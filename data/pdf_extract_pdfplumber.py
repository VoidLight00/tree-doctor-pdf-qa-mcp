#!/usr/bin/env python3
"""
pdfplumber를 사용한 나무의사 기출문제 추출
"""
import os
import re
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional
import pdfplumber

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class TreeDoctorPDFExtractor:
    """나무의사 기출문제 PDF 추출기"""
    
    def __init__(self):
        # 문제 번호 패턴
        self.question_pattern = re.compile(r'^(\d+)\.\s+(.+?)(?=\d+\.|$)', re.DOTALL | re.MULTILINE)
        
        # 선택지 패턴
        self.choice_patterns = {
            '①': re.compile(r'①\s*(.+?)(?=②|정답|해설|$)', re.DOTALL),
            '②': re.compile(r'②\s*(.+?)(?=③|정답|해설|$)', re.DOTALL),
            '③': re.compile(r'③\s*(.+?)(?=④|정답|해설|$)', re.DOTALL),
            '④': re.compile(r'④\s*(.+?)(?=⑤|정답|해설|$)', re.DOTALL),
            '⑤': re.compile(r'⑤\s*(.+?)(?=정답|해설|$)', re.DOTALL)
        }
        
        # 정답 패턴
        self.answer_pattern = re.compile(r'정답\s*[:：]?\s*([①②③④⑤])')
        
        # 해설 패턴
        self.explanation_pattern = re.compile(r'해설\s*[:：]?\s*(.+?)(?=\d+\.|$)', re.DOTALL)
        
    def extract_text_from_pdf(self, pdf_path: str) -> str:
        """PDF에서 텍스트 추출"""
        full_text = ""
        
        try:
            with pdfplumber.open(pdf_path) as pdf:
                logger.info(f"총 {len(pdf.pages)}페이지 처리 시작")
                
                for i, page in enumerate(pdf.pages):
                    logger.info(f"페이지 {i+1}/{len(pdf.pages)} 처리 중...")
                    
                    # 텍스트 추출
                    text = page.extract_text()
                    
                    if text:
                        # 페이지 구분자 추가
                        full_text += f"\n\n--- 페이지 {i+1} ---\n\n"
                        full_text += text
                    else:
                        logger.warning(f"페이지 {i+1}에서 텍스트를 추출할 수 없습니다.")
                
        except Exception as e:
            logger.error(f"PDF 처리 중 오류: {e}")
            raise
            
        return full_text
    
    def parse_questions(self, text: str) -> List[Dict]:
        """텍스트에서 문제 파싱"""
        questions = []
        
        # 페이지 구분자 제거
        text = re.sub(r'---\s*페이지\s*\d+\s*---', '', text)
        
        # 문제 번호로 분할
        parts = re.split(r'(?=^\d+\.)', text, flags=re.MULTILINE)
        
        for part in parts:
            part = part.strip()
            if not part:
                continue
                
            # 문제 번호 확인
            match = re.match(r'^(\d+)\.\s*(.+)', part, re.DOTALL)
            if not match:
                continue
                
            question_num = int(match.group(1))
            content = match.group(2)
            
            # 문제 파싱
            question_data = self.parse_question_content(content)
            question_data['number'] = question_num
            
            # 키워드 추출
            question_data['keywords'] = self.extract_keywords(
                question_data['question'] + ' ' + question_data.get('explanation', '')
            )
            
            questions.append(question_data)
            
        return questions
    
    def parse_question_content(self, text: str) -> Dict:
        """문제 내용 파싱"""
        result = {
            'question': '',
            'choices': {},
            'answer': '',
            'explanation': ''
        }
        
        # 선택지 찾기
        choice_start = float('inf')
        for choice_num in ['①', '②', '③', '④', '⑤']:
            pos = text.find(choice_num)
            if pos != -1 and pos < choice_start:
                choice_start = pos
        
        # 문제 텍스트 추출
        if choice_start < float('inf'):
            result['question'] = text[:choice_start].strip()
            
            # 선택지 추출
            for choice_num, pattern in self.choice_patterns.items():
                match = pattern.search(text)
                if match:
                    result['choices'][choice_num] = match.group(1).strip()
        else:
            # 선택지가 없는 경우
            answer_match = self.answer_pattern.search(text)
            explanation_match = self.explanation_pattern.search(text)
            
            if answer_match:
                result['question'] = text[:answer_match.start()].strip()
            elif explanation_match:
                result['question'] = text[:explanation_match.start()].strip()
            else:
                result['question'] = text.strip()
        
        # 정답 추출
        answer_match = self.answer_pattern.search(text)
        if answer_match:
            result['answer'] = answer_match.group(1)
        
        # 해설 추출
        explanation_match = self.explanation_pattern.search(text)
        if explanation_match:
            result['explanation'] = explanation_match.group(1).strip()
        
        return result
    
    def extract_keywords(self, text: str) -> List[str]:
        """키워드 추출"""
        keywords = []
        
        # 주요 카테고리
        categories = {
            '병충해': r'병해|충해|병충해|병원균|해충|방제|감염|피해',
            '수목관리': r'전정|가지치기|전지|수형|정지|관리|시비|관수',
            '진단': r'진단|증상|병징|표징|검사|판별',
            '토양': r'토양|pH|비료|영양|양분|토성|유기물',
            '농약': r'농약|살충제|살균제|약제|방제제|희석|살포',
            '생리': r'생리|생장|생육|대사|광합성|호흡|증산'
        }
        
        for category, pattern in categories.items():
            if re.search(pattern, text):
                keywords.append(category)
        
        # 수종 추출
        tree_pattern = r'(소나무|잣나무|전나무|가문비나무|낙엽송|은행나무|느티나무|벚나무|단풍나무|참나무|밤나무|감나무|배나무|사과나무|복숭아나무|측백나무|향나무|플라타너스|아카시아|버드나무)'
        trees = re.findall(tree_pattern, text)
        keywords.extend(list(set(trees)))
        
        # 병명 추출
        disease_pattern = r'(녹병|혹병|탄저병|흰가루병|잎마름병|뿌리썩음병|줄기썩음병|모잘록병|역병|점무늬병|갈색무늬병|잿빛곰팡이병|시들음병|궤양병|빗자루병)'
        diseases = re.findall(disease_pattern, text)
        keywords.extend(list(set(diseases)))
        
        # 해충 추출
        pest_pattern = r'(나방|진딧물|깍지벌레|응애|굼벵이|하늘소|바구미|매미충|나무좀|잎벌레|잎말이나방|솔나방|솔잎혹파리)'
        pests = re.findall(pest_pattern, text)
        keywords.extend(list(set(pests)))
        
        return list(set(keywords))
    
    def generate_markdown(self, exam_round: str, questions: List[Dict]) -> str:
        """마크다운 생성"""
        content = f"# 나무의사 제{exam_round}회 기출문제\n\n"
        content += f"**총 문제 수**: {len(questions)}개\n"
        content += f"**추출 일시**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
        content += f"**추출 방법**: pdfplumber\n\n"
        content += "---\n\n"
        
        for q in sorted(questions, key=lambda x: x['number']):
            content += f"## 문제 {q['number']}\n\n"
            
            if q['question']:
                content += f"**문제**: {q['question']}\n\n"
            
            if q['choices']:
                content += "**선택지**:\n"
                for num in ['①', '②', '③', '④', '⑤']:
                    if num in q['choices']:
                        content += f"- {num} {q['choices'][num]}\n"
                content += "\n"
            
            if q['answer']:
                content += f"**정답**: {q['answer']}\n\n"
            
            if q['explanation']:
                content += f"**해설**: {q['explanation']}\n\n"
            
            if q['keywords']:
                content += f"**키워드**: {', '.join(q['keywords'])}\n\n"
            
            content += "---\n\n"
        
        return content
    
    def process_pdf(self, pdf_path: str, output_path: str) -> Dict:
        """PDF 처리"""
        logger.info(f"처리 시작: {pdf_path}")
        
        try:
            # 회차 추출
            match = re.search(r'제(\d+)회', pdf_path)
            exam_round = match.group(1) if match else "Unknown"
            
            # 텍스트 추출
            text = self.extract_text_from_pdf(pdf_path)
            
            # 문제 파싱
            questions = self.parse_questions(text)
            
            # 마크다운 생성
            markdown_content = self.generate_markdown(exam_round, questions)
            
            # 파일 저장
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(markdown_content)
            
            logger.info(f"저장 완료: {output_path}")
            
            return {
                'exam_round': exam_round,
                'total_questions': len(questions),
                'output_file': output_path,
                'success': True
            }
            
        except Exception as e:
            logger.error(f"처리 실패: {e}")
            return {
                'exam_round': 'Unknown',
                'error': str(e),
                'success': False
            }

def main():
    """메인 함수"""
    files = [
        {
            'input': '/Users/voidlight/Downloads/[Codekiller]제5회 기출문제 해설집(v1.0).pdf',
            'output': '/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-5th-complete.md'
        },
        {
            'input': '/Users/voidlight/Downloads/[Codekiller]제6회 기출문제 해설집(v1.0).pdf',
            'output': '/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-6th-complete.md'
        }
    ]
    
    extractor = TreeDoctorPDFExtractor()
    results = []
    
    for file_info in files:
        if not os.path.exists(file_info['input']):
            logger.error(f"파일을 찾을 수 없습니다: {file_info['input']}")
            continue
        
        result = extractor.process_pdf(file_info['input'], file_info['output'])
        results.append(result)
    
    # 결과 출력
    print("\n=== PDF 추출 결과 ===")
    total_questions = 0
    success_count = 0
    
    for result in results:
        if result['success']:
            success_count += 1
            total_questions += result['total_questions']
            print(f"✅ 제{result['exam_round']}회: {result['total_questions']}문제 추출 완료")
        else:
            print(f"❌ 제{result['exam_round']}회: 실패 - {result.get('error', 'Unknown')}")
    
    print(f"\n총 {success_count}/{len(results)}개 파일 처리 성공")
    print(f"총 {total_questions}문제 추출")
    
    # 보고서 저장
    report_path = '/Users/voidlight/tree-doctor-pdf-qa-mcp/data/extraction_report.json'
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print(f"\n📋 상세 보고서: {report_path}")

if __name__ == "__main__":
    main()