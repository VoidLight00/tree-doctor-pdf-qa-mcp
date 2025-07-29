#!/usr/bin/env python3
"""
나무의사 기출문제 PDF를 마크다운으로 변환하는 스크립트
PyMuPDF(fitz)를 사용한 정확한 텍스트 추출
"""
import os
import re
import sys
import json
import logging
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Tuple

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

try:
    import fitz  # PyMuPDF
except ImportError:
    logger.error("PyMuPDF가 설치되어 있지 않습니다.")
    logger.error("설치 명령: pip install PyMuPDF")
    sys.exit(1)

class TreeDoctorExamExtractor:
    """나무의사 기출문제 추출기"""
    
    def __init__(self):
        # 문제 패턴 (번호. 형식)
        self.question_pattern = re.compile(
            r'^(\d+)\.\s+(.+?)(?=(?:^\d+\.|①|정답|해설|$))',
            re.MULTILINE | re.DOTALL
        )
        
        # 선택지 패턴
        self.choice_patterns = {
            '①': re.compile(r'①\s*(.+?)(?=②|③|④|⑤|정답|해설|^\d+\.|$)', re.DOTALL),
            '②': re.compile(r'②\s*(.+?)(?=③|④|⑤|정답|해설|^\d+\.|$)', re.DOTALL),
            '③': re.compile(r'③\s*(.+?)(?=④|⑤|정답|해설|^\d+\.|$)', re.DOTALL),
            '④': re.compile(r'④\s*(.+?)(?=⑤|정답|해설|^\d+\.|$)', re.DOTALL),
            '⑤': re.compile(r'⑤\s*(.+?)(?=정답|해설|^\d+\.|$)', re.DOTALL)
        }
        
        # 정답 패턴
        self.answer_pattern = re.compile(
            r'정답\s*[:：]?\s*([①②③④⑤])',
            re.IGNORECASE
        )
        
        # 해설 패턴
        self.explanation_pattern = re.compile(
            r'해설\s*[:：]?\s*(.+?)(?=^\d+\.|$)',
            re.MULTILINE | re.DOTALL | re.IGNORECASE
        )
        
        # 과목 패턴
        self.subject_patterns = {
            '수목병리학': re.compile(r'수목병리학|수목\s*병리학'),
            '수목해충학': re.compile(r'수목해충학|수목\s*해충학'),
            '수목생리학': re.compile(r'수목생리학|수목\s*생리학'),
            '산림토양학': re.compile(r'산림토양학|산림\s*토양학'),
            '수목관리학': re.compile(r'수목관리학|수목\s*관리학'),
            '조경수관리': re.compile(r'조경수관리|조경수\s*관리'),
            '농약학': re.compile(r'농약학'),
            '기계장비': re.compile(r'기계장비|기계\s*장비')
        }
        
    def extract_exam_round(self, filename: str) -> str:
        """파일명에서 회차 추출"""
        match = re.search(r'제(\d+)회', filename)
        return match.group(1) if match else "Unknown"
    
    def extract_text_from_pdf(self, pdf_path: str) -> List[Dict]:
        """PDF에서 페이지별로 텍스트 추출"""
        pages_text = []
        
        try:
            pdf = fitz.open(pdf_path)
            
            for page_num in range(len(pdf)):
                page = pdf[page_num]
                text = page.get_text()
                
                # 텍스트 정리
                text = text.strip()
                text = re.sub(r'\n{3,}', '\n\n', text)  # 과도한 줄바꿈 제거
                text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]', '', text)  # 제어 문자 제거
                
                pages_text.append({
                    'page_num': page_num + 1,
                    'text': text
                })
                
            pdf.close()
            
        except Exception as e:
            logger.error(f"PDF 텍스트 추출 실패: {e}")
            raise
            
        return pages_text
    
    def parse_question_block(self, text: str) -> Dict:
        """문제 블록 파싱"""
        result = {
            'question': '',
            'choices': {},
            'answer': '',
            'explanation': '',
            'subject': ''
        }
        
        # 문제 텍스트 추출 (첫 번째 선택지 전까지)
        question_end = text.find('①')
        if question_end > 0:
            result['question'] = text[:question_end].strip()
            remaining_text = text[question_end:]
        else:
            # 선택지가 없는 경우
            result['question'] = text.strip()
            return result
        
        # 선택지 추출
        for choice_num, pattern in self.choice_patterns.items():
            match = pattern.search(remaining_text)
            if match:
                result['choices'][choice_num] = match.group(1).strip()
        
        # 정답 추출
        answer_match = self.answer_pattern.search(text)
        if answer_match:
            result['answer'] = answer_match.group(1)
        
        # 해설 추출
        explanation_match = self.explanation_pattern.search(text)
        if explanation_match:
            result['explanation'] = explanation_match.group(1).strip()
        
        # 과목 추출
        for subject, pattern in self.subject_patterns.items():
            if pattern.search(text):
                result['subject'] = subject
                break
        
        return result
    
    def extract_questions(self, pages_text: List[Dict]) -> List[Dict]:
        """모든 페이지에서 문제 추출"""
        all_questions = []
        current_subject = ''
        
        # 전체 텍스트 합치기
        full_text = '\n'.join([page['text'] for page in pages_text])
        
        # 문제 번호로 분할
        question_blocks = re.split(r'(?=^\d+\.)', full_text, flags=re.MULTILINE)
        
        for block in question_blocks:
            block = block.strip()
            if not block:
                continue
                
            # 문제 번호 확인
            match = re.match(r'^(\d+)\.', block)
            if not match:
                # 과목명 확인
                for subject, pattern in self.subject_patterns.items():
                    if pattern.search(block):
                        current_subject = subject
                        break
                continue
            
            question_num = int(match.group(1))
            
            # 문제 내용 추출 (번호 제거)
            question_content = block[match.end():].strip()
            
            # 문제 파싱
            parsed = self.parse_question_block(question_content)
            
            # 과목 정보 추가
            if not parsed['subject'] and current_subject:
                parsed['subject'] = current_subject
            
            # 키워드 추출
            keywords = self.extract_keywords(
                parsed['question'] + ' ' + parsed['explanation']
            )
            
            all_questions.append({
                'number': question_num,
                'subject': parsed['subject'],
                'question': parsed['question'],
                'choices': parsed['choices'],
                'answer': parsed['answer'],
                'explanation': parsed['explanation'],
                'keywords': keywords
            })
        
        return all_questions
    
    def extract_keywords(self, text: str) -> List[str]:
        """텍스트에서 키워드 추출"""
        keywords = []
        
        # 병충해 관련
        if re.search(r'병해|충해|병충해|병원균|해충|방제|살충|살균', text):
            keywords.append('병충해')
        
        # 수목 관리
        if re.search(r'전정|가지치기|전지|수형|정지|적심|적과', text):
            keywords.append('수목관리')
        
        # 진단
        if re.search(r'진단|증상|병징|표징|피해|감염', text):
            keywords.append('진단')
        
        # 토양
        if re.search(r'토양|pH|비료|영양|시비|퇴비', text):
            keywords.append('토양')
        
        # 농약
        if re.search(r'농약|살충제|살균제|약제|방제제|희석|살포', text):
            keywords.append('농약')
        
        # 생리
        if re.search(r'생리|생장|생육|대사|광합성|호흡|증산', text):
            keywords.append('생리')
        
        # 수종 추출
        tree_species = re.findall(
            r'(소나무|잣나무|은행나무|느티나무|벚나무|단풍나무|참나무|밤나무|'
            r'감나무|배나무|사과나무|복숭아나무|측백나무|향나무|전나무|'
            r'가문비나무|낙엽송|메타세쿼이아|플라타너스|아카시아|버드나무)',
            text
        )
        keywords.extend(list(set(tree_species)))
        
        # 병명 추출
        diseases = re.findall(
            r'(혹병|탄저병|흰가루병|잎마름병|뿌리썩음병|줄기썩음병|'
            r'모잘록병|역병|녹병|점무늬병|갈색무늬병|잿빛곰팡이병|'
            r'시들음병|궤양병|빗자루병)',
            text
        )
        keywords.extend(list(set(diseases)))
        
        # 해충명 추출
        pests = re.findall(
            r'(나방|진딧물|깍지벌레|응애|굼벵이|하늘소|바구미|매미충|'
            r'나무좀|잎벌레|잎말이나방|솔나방|솔잎혹파리|복숭아혹진딧물)',
            text
        )
        keywords.extend(list(set(pests)))
        
        return list(set(keywords))
    
    def generate_markdown(self, exam_round: str, questions: List[Dict]) -> str:
        """마크다운 컨텐츠 생성"""
        content = f"# 나무의사 제{exam_round}회 기출문제\n\n"
        content += f"**총 문제 수**: {len(questions)}개\n"
        content += f"**추출 일시**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
        
        # 과목별 문제 수 집계
        subject_counts = {}
        for q in questions:
            subject = q['subject'] or '미분류'
            subject_counts[subject] = subject_counts.get(subject, 0) + 1
        
        if subject_counts:
            content += "**과목별 문제 수**:\n"
            for subject, count in sorted(subject_counts.items()):
                content += f"- {subject}: {count}문제\n"
            content += "\n"
        
        content += "---\n\n"
        
        # 문제별 내용
        for q in sorted(questions, key=lambda x: x['number']):
            content += f"## 문제 {q['number']}"
            if q['subject']:
                content += f" [{q['subject']}]"
            content += "\n\n"
            
            content += f"**문제**: {q['question']}\n\n"
            
            if q['choices']:
                content += "**선택지**:\n"
                for num in ['①', '②', '③', '④', '⑤']:
                    if num in q['choices']:
                        content += f"{num} {q['choices'][num]}\n"
                content += "\n"
            
            content += f"**정답**: {q['answer'] or '미확인'}\n\n"
            
            if q['explanation']:
                content += f"**해설**: {q['explanation']}\n\n"
            
            if q['keywords']:
                content += f"**키워드**: {', '.join(q['keywords'])}\n\n"
            
            content += "---\n\n"
        
        return content
    
    def process_pdf(self, pdf_path: str, output_path: str) -> Dict:
        """PDF 파일 처리"""
        logger.info(f"처리 시작: {pdf_path}")
        
        try:
            # 회차 추출
            exam_round = self.extract_exam_round(pdf_path)
            
            # PDF에서 텍스트 추출
            pages_text = self.extract_text_from_pdf(pdf_path)
            logger.info(f"총 {len(pages_text)}페이지에서 텍스트 추출 완료")
            
            # 문제 추출
            questions = self.extract_questions(pages_text)
            logger.info(f"총 {len(questions)}문제 추출 완료")
            
            # 마크다운 생성
            markdown_content = self.generate_markdown(exam_round, questions)
            
            # 파일 저장
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(markdown_content)
            
            logger.info(f"저장 완료: {output_path}")
            
            return {
                'exam_round': exam_round,
                'total_questions': len(questions),
                'total_pages': len(pages_text),
                'output_file': output_path,
                'success': True
            }
            
        except Exception as e:
            logger.error(f"처리 실패: {e}")
            return {
                'exam_round': self.extract_exam_round(pdf_path),
                'error': str(e),
                'success': False
            }

def main():
    """메인 함수"""
    # 처리할 파일 목록
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
    
    extractor = TreeDoctorExamExtractor()
    results = []
    
    for file_info in files:
        if not os.path.exists(file_info['input']):
            logger.error(f"파일을 찾을 수 없습니다: {file_info['input']}")
            continue
        
        result = extractor.process_pdf(file_info['input'], file_info['output'])
        results.append(result)
    
    # 결과 보고
    print("\n=== PDF 변환 결과 요약 ===")
    success_count = 0
    total_questions = 0
    
    for result in results:
        if result['success']:
            success_count += 1
            total_questions += result['total_questions']
            print(f"✅ 제{result['exam_round']}회: {result['total_questions']}문제 추출 완료")
            print(f"   페이지 수: {result.get('total_pages', 'N/A')}")
            print(f"   저장 위치: {result['output_file']}")
        else:
            print(f"❌ 제{result['exam_round']}회: 변환 실패 - {result.get('error', 'Unknown error')}")
    
    print(f"\n총 {success_count}/{len(results)}개 파일 변환 성공")
    print(f"총 {total_questions}문제 추출")
    
    # 전체 보고서 저장
    report_path = '/Users/voidlight/tree-doctor-pdf-qa-mcp/data/conversion_report.json'
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print(f"\n📋 상세 보고서: {report_path}")

if __name__ == "__main__":
    main()