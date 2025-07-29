#!/usr/bin/env python3
"""
나무의사 기출문제 PDF OCR 추출 스크립트
PyMuPDF와 Tesseract OCR을 함께 사용
"""
import os
import re
import sys
import json
import logging
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Tuple
import io

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

try:
    import fitz  # PyMuPDF
    from PIL import Image
    import pytesseract
except ImportError as e:
    logger.error(f"필요한 라이브러리가 설치되어 있지 않습니다: {e}")
    logger.error("설치 명령:")
    logger.error("pip install PyMuPDF pillow pytesseract")
    sys.exit(1)

class TreeDoctorOCRExtractor:
    """나무의사 기출문제 OCR 추출기"""
    
    def __init__(self):
        # 문제 번호 패턴
        self.question_num_pattern = re.compile(r'^(\d+)\.')
        
        # 선택지 패턴
        self.choice_patterns = [
            re.compile(r'([①②③④⑤])\s*(.+?)(?=[①②③④⑤]|정\s*답|해\s*설|$)', re.DOTALL),
            re.compile(r'([1-5])\)\s*(.+?)(?=[1-5]\)|정\s*답|해\s*설|$)', re.DOTALL),
        ]
        
        # 정답 패턴
        self.answer_patterns = [
            re.compile(r'정\s*답\s*[:：]?\s*([①②③④⑤1-5])'),
            re.compile(r'답\s*[:：]?\s*([①②③④⑤1-5])'),
            re.compile(r'\[정답\]\s*([①②③④⑤1-5])'),
        ]
        
        # 해설 패턴
        self.explanation_patterns = [
            re.compile(r'해\s*설\s*[:：]?\s*(.+?)(?=\d+\.|문제|$)', re.DOTALL),
            re.compile(r'\[해설\]\s*(.+?)(?=\d+\.|문제|$)', re.DOTALL),
        ]
        
    def extract_text_with_ocr(self, pdf_path: str) -> List[Dict]:
        """PDF에서 OCR로 텍스트 추출"""
        pages_data = []
        
        try:
            pdf = fitz.open(pdf_path)
            
            for page_num in range(len(pdf)):
                logger.info(f"페이지 {page_num + 1}/{len(pdf)} OCR 처리 중...")
                
                page = pdf[page_num]
                
                # 먼저 일반 텍스트 추출 시도
                text = page.get_text()
                
                # 텍스트가 충분하지 않으면 OCR 수행
                if len(text.strip()) < 100:
                    # 페이지를 이미지로 변환 (고해상도)
                    mat = fitz.Matrix(3, 3)  # 3x 확대
                    pix = page.get_pixmap(matrix=mat)
                    img_data = pix.tobytes("png")
                    
                    # PIL 이미지로 변환
                    img = Image.open(io.BytesIO(img_data))
                    
                    # OCR 수행 (한국어)
                    try:
                        ocr_text = pytesseract.image_to_string(img, lang='kor', config='--psm 6')
                        text = ocr_text
                    except Exception as e:
                        logger.error(f"OCR 실패 (페이지 {page_num + 1}): {e}")
                        text = ""
                
                pages_data.append({
                    'page_num': page_num + 1,
                    'text': text
                })
                
            pdf.close()
            
        except Exception as e:
            logger.error(f"PDF 처리 실패: {e}")
            raise
            
        return pages_data
    
    def parse_questions_from_text(self, full_text: str) -> List[Dict]:
        """전체 텍스트에서 문제 파싱"""
        questions = []
        
        # 텍스트 정리
        full_text = re.sub(r'\n{3,}', '\n\n', full_text)
        full_text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]', '', full_text)
        
        # 줄 단위로 분할
        lines = full_text.split('\n')
        
        current_question = None
        current_text = []
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # 새 문제 시작 확인
            match = self.question_num_pattern.match(line)
            if match:
                # 이전 문제 저장
                if current_question and current_text:
                    question_data = self.parse_question_content('\n'.join(current_text))
                    question_data['number'] = current_question
                    questions.append(question_data)
                
                # 새 문제 시작
                current_question = int(match.group(1))
                current_text = [line[match.end():].strip()]
            else:
                # 현재 문제에 텍스트 추가
                if current_question:
                    current_text.append(line)
        
        # 마지막 문제 저장
        if current_question and current_text:
            question_data = self.parse_question_content('\n'.join(current_text))
            question_data['number'] = current_question
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
        choice_found = False
        for pattern in self.choice_patterns:
            matches = list(pattern.finditer(text))
            if matches:
                choice_found = True
                # 첫 선택지 전까지가 문제
                first_choice_pos = matches[0].start()
                result['question'] = text[:first_choice_pos].strip()
                
                # 선택지 추출
                for match in matches:
                    choice_num = match.group(1)
                    choice_text = match.group(2).strip()
                    
                    # 숫자를 기호로 변환
                    if choice_num in '12345':
                        num_to_symbol = {'1': '①', '2': '②', '3': '③', '4': '④', '5': '⑤'}
                        choice_num = num_to_symbol.get(choice_num, choice_num)
                    
                    result['choices'][choice_num] = choice_text
                break
        
        if not choice_found:
            # 선택지가 없는 경우 정답/해설 전까지를 문제로
            for pattern in self.answer_patterns + self.explanation_patterns:
                match = pattern.search(text)
                if match:
                    result['question'] = text[:match.start()].strip()
                    break
            else:
                result['question'] = text.strip()
        
        # 정답 찾기
        for pattern in self.answer_patterns:
            match = pattern.search(text)
            if match:
                answer = match.group(1)
                # 숫자를 기호로 변환
                if answer in '12345':
                    num_to_symbol = {'1': '①', '2': '②', '3': '③', '4': '④', '5': '⑤'}
                    answer = num_to_symbol.get(answer, answer)
                result['answer'] = answer
                break
        
        # 해설 찾기
        for pattern in self.explanation_patterns:
            match = pattern.search(text)
            if match:
                result['explanation'] = match.group(1).strip()
                break
        
        return result
    
    def extract_keywords(self, text: str) -> List[str]:
        """키워드 추출"""
        keywords = []
        
        # 과목 관련
        subjects = {
            '수목병리학': ['병해', '병원균', '병징', '표징', '감염', '방제'],
            '수목해충학': ['해충', '곤충', '유충', '성충', '천적', '피해'],
            '수목생리학': ['광합성', '호흡', '증산', '생장', '호르몬', '대사'],
            '산림토양학': ['토양', 'pH', '양분', '비료', '유기물', '토성'],
            '수목관리학': ['전정', '시비', '관수', '이식', '식재', '관리'],
            '농약학': ['농약', '살충제', '살균제', '희석', '살포', '약해']
        }
        
        for subject, terms in subjects.items():
            if any(term in text for term in terms):
                keywords.append(subject)
        
        # 수종
        trees = re.findall(
            r'(소나무|잣나무|전나무|가문비나무|낙엽송|은행나무|느티나무|'
            r'벚나무|단풍나무|참나무|밤나무|감나무|배나무|사과나무|'
            r'복숭아나무|측백나무|향나무|플라타너스|아카시아|버드나무)',
            text
        )
        keywords.extend(list(set(trees)))
        
        # 병명
        diseases = re.findall(
            r'(녹병|혹병|탄저병|흰가루병|잎마름병|뿌리썩음병|'
            r'줄기썩음병|모잘록병|역병|점무늬병|갈색무늬병|'
            r'잿빛곰팡이병|시들음병|궤양병|빗자루병)',
            text
        )
        keywords.extend(list(set(diseases)))
        
        # 해충
        pests = re.findall(
            r'(나방|진딧물|깍지벌레|응애|굼벵이|하늘소|바구미|'
            r'매미충|나무좀|잎벌레|잎말이나방|솔나방|솔잎혹파리)',
            text
        )
        keywords.extend(list(set(pests)))
        
        return list(set(keywords))
    
    def generate_markdown(self, exam_round: str, questions: List[Dict]) -> str:
        """마크다운 생성"""
        content = f"# 나무의사 제{exam_round}회 기출문제 (OCR)\n\n"
        content += f"**총 문제 수**: {len(questions)}개\n"
        content += f"**추출 일시**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
        content += f"**추출 방법**: OCR (Tesseract)\n\n"
        content += "---\n\n"
        
        for q in sorted(questions, key=lambda x: x['number']):
            content += f"## 문제 {q['number']}\n\n"
            
            if q['question']:
                content += f"**문제**: {q['question']}\n\n"
            
            if q['choices']:
                content += "**선택지**:\n"
                for num in ['①', '②', '③', '④', '⑤']:
                    if num in q['choices']:
                        content += f"{num} {q['choices'][num]}\n"
                content += "\n"
            
            if q['answer']:
                content += f"**정답**: {q['answer']}\n\n"
            
            if q['explanation']:
                content += f"**해설**: {q['explanation']}\n\n"
            
            if q.get('keywords'):
                content += f"**키워드**: {', '.join(q['keywords'])}\n\n"
            
            content += "---\n\n"
        
        return content
    
    def process_pdf(self, pdf_path: str, output_path: str) -> Dict:
        """PDF 처리 메인 함수"""
        logger.info(f"OCR 처리 시작: {pdf_path}")
        
        try:
            # 회차 추출
            match = re.search(r'제(\d+)회', pdf_path)
            exam_round = match.group(1) if match else "Unknown"
            
            # OCR로 텍스트 추출
            pages_data = self.extract_text_with_ocr(pdf_path)
            
            # 전체 텍스트 합치기
            full_text = '\n\n'.join([p['text'] for p in pages_data])
            
            # 문제 파싱
            questions = self.parse_questions_from_text(full_text)
            
            # 키워드 추출
            for q in questions:
                q['keywords'] = self.extract_keywords(
                    q['question'] + ' ' + q.get('explanation', '')
                )
            
            # 마크다운 생성
            markdown_content = self.generate_markdown(exam_round, questions)
            
            # 파일 저장
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(markdown_content)
            
            logger.info(f"저장 완료: {output_path}")
            
            return {
                'exam_round': exam_round,
                'total_questions': len(questions),
                'total_pages': len(pages_data),
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
    # Tesseract 경로 설정 (macOS)
    pytesseract.pytesseract.tesseract_cmd = '/opt/homebrew/bin/tesseract'
    
    # 처리할 파일
    files = [
        {
            'input': '/Users/voidlight/Downloads/[Codekiller]제5회 기출문제 해설집(v1.0).pdf',
            'output': '/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-5th-ocr.md'
        },
        {
            'input': '/Users/voidlight/Downloads/[Codekiller]제6회 기출문제 해설집(v1.0).pdf',
            'output': '/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-6th-ocr.md'
        },
        {
            'input': '/Users/voidlight/Downloads/[Codekiller]제7회 기출문제 해설집(v1.0).pdf',
            'output': '/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-7th-ocr.md'
        }
    ]
    
    extractor = TreeDoctorOCRExtractor()
    results = []
    
    for file_info in files:
        if not os.path.exists(file_info['input']):
            logger.error(f"파일을 찾을 수 없습니다: {file_info['input']}")
            continue
        
        result = extractor.process_pdf(file_info['input'], file_info['output'])
        results.append(result)
    
    # 결과 출력
    print("\n=== OCR 추출 결과 ===")
    for result in results:
        if result['success']:
            print(f"✅ 제{result['exam_round']}회: {result['total_questions']}문제 추출")
            print(f"   페이지: {result.get('total_pages', 'N/A')}개")
        else:
            print(f"❌ 제{result['exam_round']}회: 실패 - {result.get('error', 'Unknown')}")
    
    # 보고서 저장
    report_path = '/Users/voidlight/tree-doctor-pdf-qa-mcp/data/ocr_report.json'
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    main()