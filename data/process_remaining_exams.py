#!/usr/bin/env python3
"""
나무의사 제8-11회 기출문제 PDF 처리 스크립트
PyMuPDF와 pdfplumber 조합으로 최적화
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
from concurrent.futures import ThreadPoolExecutor, as_completed

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

try:
    import fitz  # PyMuPDF
    import pdfplumber
    from PIL import Image
    import pytesseract
except ImportError as e:
    logger.error(f"필요한 라이브러리가 설치되어 있지 않습니다: {e}")
    logger.error("설치 명령:")
    logger.error("pip install PyMuPDF pdfplumber pillow pytesseract")
    sys.exit(1)

class OptimizedTreeDoctorExtractor:
    """최적화된 나무의사 기출문제 추출기"""
    
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
        
    def extract_text_hybrid(self, pdf_path: str, is_exam_paper: bool = False) -> List[Dict]:
        """하이브리드 방식으로 텍스트 추출 (PyMuPDF + pdfplumber + 선택적 OCR)"""
        pages_data = []
        
        try:
            # PyMuPDF로 먼저 시도
            pdf_fitz = fitz.open(pdf_path)
            
            with pdfplumber.open(pdf_path) as pdf_plumber:
                for page_num in range(len(pdf_fitz)):
                    logger.info(f"페이지 {page_num + 1}/{len(pdf_fitz)} 처리 중...")
                    
                    # 1. PyMuPDF로 텍스트 추출
                    page_fitz = pdf_fitz[page_num]
                    text_fitz = page_fitz.get_text()
                    
                    # 2. pdfplumber로 테이블 추출
                    page_plumber = pdf_plumber.pages[page_num]
                    tables = page_plumber.extract_tables()
                    
                    # 테이블 텍스트 통합
                    table_text = ""
                    if tables:
                        for table in tables:
                            for row in table:
                                if row:
                                    table_text += " ".join([cell or "" for cell in row]) + "\n"
                    
                    # 텍스트 결합
                    combined_text = text_fitz + "\n" + table_text
                    
                    # 3. 텍스트가 불충분한 경우에만 OCR 수행
                    if len(combined_text.strip()) < 50:
                        logger.info(f"페이지 {page_num + 1}: 텍스트 부족, OCR 수행")
                        combined_text = self.perform_ocr(page_fitz)
                    
                    pages_data.append({
                        'page_num': page_num + 1,
                        'text': combined_text
                    })
            
            pdf_fitz.close()
            
        except Exception as e:
            logger.error(f"PDF 처리 실패: {e}")
            raise
        
        return pages_data
    
    def perform_ocr(self, page) -> str:
        """단일 페이지에 대한 OCR 수행"""
        try:
            # 고해상도로 이미지 변환
            mat = fitz.Matrix(3, 3)  # 3x 확대
            pix = page.get_pixmap(matrix=mat)
            img_data = pix.tobytes("png")
            
            # PIL 이미지로 변환
            img = Image.open(io.BytesIO(img_data))
            
            # OCR 수행 (한국어)
            text = pytesseract.image_to_string(img, lang='kor', config='--psm 6')
            return text
        except Exception as e:
            logger.error(f"OCR 실패: {e}")
            return ""
    
    def parse_questions_optimized(self, full_text: str, is_exam_paper: bool = False) -> List[Dict]:
        """최적화된 문제 파싱"""
        questions = []
        
        # 텍스트 정리
        full_text = re.sub(r'\n{3,}', '\n\n', full_text)
        full_text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]', '', full_text)
        
        # 문제별로 분할
        question_blocks = re.split(r'(?=^\d+\.)', full_text, flags=re.MULTILINE)
        
        for block in question_blocks:
            if not block.strip():
                continue
            
            match = self.question_num_pattern.match(block.strip())
            if match:
                question_num = int(match.group(1))
                
                # 시험지인 경우 해설 추출 안 함
                if is_exam_paper:
                    question_data = self.parse_exam_question(block)
                else:
                    question_data = self.parse_question_with_explanation(block)
                
                question_data['number'] = question_num
                questions.append(question_data)
        
        return questions
    
    def parse_exam_question(self, text: str) -> Dict:
        """시험지용 문제 파싱 (문제와 선택지만)"""
        result = {
            'question': '',
            'choices': {},
            'answer': '',
            'explanation': ''
        }
        
        # 선택지 찾기
        for pattern in self.choice_patterns:
            matches = list(pattern.finditer(text))
            if matches:
                # 첫 선택지 전까지가 문제
                first_choice_pos = matches[0].start()
                result['question'] = text[:first_choice_pos].strip()
                result['question'] = re.sub(r'^\d+\.', '', result['question']).strip()
                
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
        
        if not result['question']:
            # 선택지가 없는 경우
            result['question'] = re.sub(r'^\d+\.', '', text).strip()
        
        return result
    
    def parse_question_with_explanation(self, text: str) -> Dict:
        """해설집용 문제 파싱 (전체 정보)"""
        result = self.parse_exam_question(text)
        
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
        """키워드 추출 (최적화)"""
        keywords = []
        
        # 과목별 핵심 키워드
        keyword_patterns = {
            '수목병리학': r'(병해|병원균|병징|표징|감염|방제|포자|균사|세균|바이러스)',
            '수목해충학': r'(해충|곤충|유충|성충|천적|피해|가해|번데기|알|유약호르몬)',
            '수목생리학': r'(광합성|호흡|증산|생장|호르몬|대사|물질이동|양분|탄수화물)',
            '산림토양학': r'(토양|pH|양분|비료|유기물|토성|지력|양이온|치환용량)',
            '수목관리학': r'(전정|시비|관수|이식|식재|관리|전지|정지|수형)',
            '농약학': r'(농약|살충제|살균제|희석|살포|약해|잔류|제형|유효성분)'
        }
        
        for subject, pattern in keyword_patterns.items():
            if re.search(pattern, text):
                keywords.append(subject)
        
        # 주요 수종, 병해충 추출
        important_terms = re.findall(
            r'(소나무|잣나무|전나무|가문비나무|낙엽송|은행나무|느티나무|'
            r'벚나무|단풍나무|참나무|밤나무|플라타너스|아카시아|버드나무|'
            r'녹병|혹병|탄저병|흰가루병|잎마름병|뿌리썩음병|시들음병|'
            r'나방|진딧물|깍지벌레|응애|하늘소|바구미|솔나방)',
            text
        )
        keywords.extend(list(set(important_terms)))
        
        return list(set(keywords))[:10]  # 최대 10개로 제한
    
    def generate_markdown(self, exam_round: str, questions: List[Dict], is_exam_paper: bool = False) -> str:
        """마크다운 생성"""
        doc_type = "시험지" if is_exam_paper else "기출문제"
        content = f"# 나무의사 제{exam_round}회 {doc_type}\n\n"
        content += f"**총 문제 수**: {len(questions)}개\n"
        content += f"**추출 일시**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
        content += f"**추출 방법**: PyMuPDF + pdfplumber (선택적 OCR)\n\n"
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
            
            if q['answer'] and not is_exam_paper:
                content += f"**정답**: {q['answer']}\n\n"
            
            if q['explanation'] and not is_exam_paper:
                content += f"**해설**: {q['explanation']}\n\n"
            
            if q.get('keywords'):
                content += f"**키워드**: {', '.join(q['keywords'])}\n\n"
            
            content += "---\n\n"
        
        return content
    
    def process_pdf(self, pdf_path: str, output_path: str, is_exam_paper: bool = False) -> Dict:
        """PDF 처리 메인 함수"""
        logger.info(f"처리 시작: {pdf_path}")
        start_time = datetime.now()
        
        try:
            # 회차 추출
            match = re.search(r'제(\d+)회', pdf_path)
            exam_round = match.group(1) if match else "Unknown"
            
            # 하이브리드 방식으로 텍스트 추출
            pages_data = self.extract_text_hybrid(pdf_path, is_exam_paper)
            
            # 전체 텍스트 합치기
            full_text = '\n\n'.join([p['text'] for p in pages_data])
            
            # 문제 파싱
            questions = self.parse_questions_optimized(full_text, is_exam_paper)
            
            # 키워드 추출 (해설집인 경우만)
            if not is_exam_paper:
                for q in questions:
                    q['keywords'] = self.extract_keywords(
                        q['question'] + ' ' + q.get('explanation', '')
                    )
            
            # 마크다운 생성
            markdown_content = self.generate_markdown(exam_round, questions, is_exam_paper)
            
            # 파일 저장
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(markdown_content)
            
            process_time = (datetime.now() - start_time).total_seconds()
            logger.info(f"저장 완료: {output_path} (처리시간: {process_time:.2f}초)")
            
            return {
                'exam_round': exam_round,
                'total_questions': len(questions),
                'total_pages': len(pages_data),
                'output_file': output_path,
                'process_time': process_time,
                'success': True
            }
            
        except Exception as e:
            logger.error(f"처리 실패: {e}")
            return {
                'exam_round': 'Unknown',
                'error': str(e),
                'success': False
            }

def process_multiple_pdfs(files_info: List[Dict]) -> List[Dict]:
    """여러 PDF를 병렬로 처리"""
    extractor = OptimizedTreeDoctorExtractor()
    results = []
    
    with ThreadPoolExecutor(max_workers=3) as executor:
        future_to_file = {
            executor.submit(
                extractor.process_pdf,
                file_info['input'],
                file_info['output'],
                file_info.get('is_exam_paper', False)
            ): file_info
            for file_info in files_info
        }
        
        for future in as_completed(future_to_file):
            file_info = future_to_file[future]
            try:
                result = future.result()
                results.append(result)
            except Exception as e:
                logger.error(f"처리 실패 ({file_info['input']}): {e}")
                results.append({
                    'exam_round': 'Unknown',
                    'error': str(e),
                    'success': False,
                    'file': file_info['input']
                })
    
    return results

def main():
    """메인 함수"""
    # Tesseract 경로 설정 (macOS)
    pytesseract.pytesseract.tesseract_cmd = '/opt/homebrew/bin/tesseract'
    
    # 처리할 파일
    files = [
        {
            'input': '/Users/voidlight/Downloads/[Codekiller]제8회 기출문제 해설집(v1.0).pdf',
            'output': '/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-8th-ocr.md',
            'is_exam_paper': False
        },
        {
            'input': '/Users/voidlight/Downloads/[Codekiller]제9회 기출문제 해설집(v1.0).pdf',
            'output': '/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-9th-ocr.md',
            'is_exam_paper': False
        },
        {
            'input': '/Users/voidlight/Downloads/[Codekiller]제10회 기출문제 해설집(v1.0).pdf',
            'output': '/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-10th-ocr.md',
            'is_exam_paper': False
        },
        {
            'input': '/Users/voidlight/Downloads/제11회 나무의사 자격시험 1차 시험지.pdf',
            'output': '/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-11th-ocr.md',
            'is_exam_paper': True  # 시험지이므로 문제와 선택지만 추출
        }
    ]
    
    # 파일 존재 확인
    for file_info in files:
        if not os.path.exists(file_info['input']):
            logger.error(f"파일을 찾을 수 없습니다: {file_info['input']}")
            return
    
    # 병렬 처리
    logger.info("=== 나무의사 제8-11회 기출문제 처리 시작 ===")
    start_time = datetime.now()
    results = process_multiple_pdfs(files)
    total_time = (datetime.now() - start_time).total_seconds()
    
    # 결과 출력
    print("\n=== 처리 결과 ===")
    success_count = 0
    total_questions = 0
    
    for result in results:
        if result['success']:
            success_count += 1
            total_questions += result['total_questions']
            print(f"✅ 제{result['exam_round']}회: {result['total_questions']}문제 추출")
            print(f"   페이지: {result['total_pages']}개")
            print(f"   처리시간: {result['process_time']:.2f}초")
        else:
            print(f"❌ 실패: {result.get('file', 'Unknown')} - {result.get('error', 'Unknown')}")
    
    print(f"\n총 처리 시간: {total_time:.2f}초")
    print(f"성공: {success_count}/{len(files)}개 파일")
    print(f"총 추출 문제: {total_questions}개")
    
    # 보고서 저장
    report_path = '/Users/voidlight/tree-doctor-pdf-qa-mcp/data/processing_report_8-11.json'
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump({
            'timestamp': datetime.now().isoformat(),
            'total_time': total_time,
            'results': results
        }, f, ensure_ascii=False, indent=2)
    
    print(f"\n처리 보고서 저장: {report_path}")

if __name__ == "__main__":
    main()