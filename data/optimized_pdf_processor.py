#!/usr/bin/env python3
"""
최적화된 PDF 처리기 - 나무의사 기출문제 해설집
텍스트 추출 우선, 선택적 OCR, 병렬 처리
"""

import os
import re
import json
import time
import logging
from concurrent.futures import ProcessPoolExecutor, as_completed
from typing import List, Dict, Optional, Tuple
import pdfplumber
import pytesseract
from PIL import Image
import fitz  # PyMuPDF
from pathlib import Path

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('optimized_processing.log'),
        logging.StreamHandler()
    ]
)

class OptimizedPDFProcessor:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.stats = {
            'text_extracted': 0,
            'ocr_used': 0,
            'total_pages': 0,
            'problems_found': 0
        }
        
    def extract_text_from_page(self, pdf_path: str, page_num: int) -> Optional[str]:
        """pdfplumber를 사용한 텍스트 추출"""
        try:
            with pdfplumber.open(pdf_path) as pdf:
                if page_num < len(pdf.pages):
                    page = pdf.pages[page_num]
                    text = page.extract_text()
                    if text and len(text.strip()) > 50:  # 최소 텍스트 길이 확인
                        return text
        except Exception as e:
            self.logger.warning(f"Text extraction failed for page {page_num}: {e}")
        return None
    
    def ocr_page(self, pdf_path: str, page_num: int) -> Optional[str]:
        """선택적 OCR 처리"""
        try:
            doc = fitz.open(pdf_path)
            page = doc[page_num]
            
            # 고해상도로 이미지 변환
            mat = fitz.Matrix(3, 3)  # 3x 확대
            pix = page.get_pixmap(matrix=mat)
            img_data = pix.tobytes("png")
            
            # PIL 이미지로 변환
            from io import BytesIO
            img = Image.open(BytesIO(img_data))
            
            # OCR 수행
            text = pytesseract.image_to_string(img, lang='kor+eng')
            doc.close()
            
            if text and len(text.strip()) > 50:
                return text
        except Exception as e:
            self.logger.warning(f"OCR failed for page {page_num}: {e}")
        return None
    
    def parse_problem_structure(self, text: str) -> List[Dict]:
        """문제 구조 파싱"""
        problems = []
        
        # 문제 패턴들
        patterns = [
            r'문제\s*(\d+)[.\s]*',
            r'(\d+)[.\s]*\s*다음',
            r'(\d+)[.\s]*\s*[가-힣]+.*?(?=①)',
            r'【\s*(\d+)\s*】'
        ]
        
        # 전체 텍스트를 문제 단위로 분할
        problem_splits = []
        for pattern in patterns:
            matches = list(re.finditer(pattern, text, re.MULTILINE))
            problem_splits.extend([(m.start(), m.group(1)) for m in matches])
        
        # 정렬하고 중복 제거
        problem_splits = sorted(set(problem_splits))
        
        # 각 문제 추출
        for i, (start, num) in enumerate(problem_splits):
            end = problem_splits[i+1][0] if i+1 < len(problem_splits) else len(text)
            problem_text = text[start:end].strip()
            
            # 문제 내용 추출
            problem_data = self.extract_problem_details(problem_text, num)
            if problem_data:
                problems.append(problem_data)
        
        return problems
    
    def extract_problem_details(self, text: str, problem_num: str) -> Optional[Dict]:
        """문제 상세 정보 추출"""
        try:
            # 문제 텍스트 정리
            lines = [line.strip() for line in text.split('\n') if line.strip()]
            
            # 문제 본문 찾기
            question_text = ""
            options = []
            answer = ""
            explanation = ""
            
            # 선택지 패턴
            option_pattern = r'[①②③④⑤]\s*(.+?)(?=[①②③④⑤]|$)'
            options_match = re.findall(option_pattern, text, re.DOTALL)
            
            if options_match:
                options = [opt.strip() for opt in options_match]
            
            # 정답 패턴
            answer_patterns = [
                r'정답\s*[:：]\s*([①②③④⑤])',
                r'답\s*[:：]\s*([①②③④⑤])',
                r'\[정답\]\s*([①②③④⑤])'
            ]
            
            for pattern in answer_patterns:
                match = re.search(pattern, text)
                if match:
                    answer = match.group(1)
                    break
            
            # 해설 추출
            explanation_start = re.search(r'(해설|해답|설명)\s*[:：]', text)
            if explanation_start:
                explanation = text[explanation_start.end():].strip()
            
            # 문제 본문 추출 (선택지 이전 부분)
            if options:
                first_option_pos = text.find('①')
                if first_option_pos > 0:
                    question_text = text[:first_option_pos].strip()
                    # 문제 번호 제거
                    question_text = re.sub(r'^문제\s*\d+[.\s]*', '', question_text)
                    question_text = re.sub(r'^\d+[.\s]*', '', question_text)
            
            if question_text:
                return {
                    'number': int(problem_num),
                    'question': question_text,
                    'options': options,
                    'answer': answer,
                    'explanation': explanation[:500] if explanation else ""  # 해설은 500자로 제한
                }
        except Exception as e:
            self.logger.warning(f"Failed to extract problem {problem_num}: {e}")
        
        return None
    
    def process_pdf(self, pdf_path: str, output_path: str) -> Dict:
        """단일 PDF 처리"""
        self.logger.info(f"Processing: {pdf_path}")
        start_time = time.time()
        
        exam_num = re.search(r'제(\d+)회', pdf_path)
        exam_title = f"제{exam_num.group(1)}회 나무의사 기출문제" if exam_num else "나무의사 기출문제"
        
        all_problems = []
        total_pages = 0
        
        try:
            # 총 페이지 수 확인
            with pdfplumber.open(pdf_path) as pdf:
                total_pages = len(pdf.pages)
            
            self.stats['total_pages'] += total_pages
            
            # 각 페이지 처리
            for page_num in range(total_pages):
                self.logger.info(f"Processing page {page_num + 1}/{total_pages}")
                
                # 1. 텍스트 추출 시도
                text = self.extract_text_from_page(pdf_path, page_num)
                
                if text:
                    self.stats['text_extracted'] += 1
                else:
                    # 2. 텍스트 추출 실패시 OCR
                    self.logger.info(f"Using OCR for page {page_num + 1}")
                    text = self.ocr_page(pdf_path, page_num)
                    if text:
                        self.stats['ocr_used'] += 1
                
                if text:
                    # 3. 문제 파싱
                    problems = self.parse_problem_structure(text)
                    all_problems.extend(problems)
                    self.stats['problems_found'] += len(problems)
        
        except Exception as e:
            self.logger.error(f"Error processing PDF: {e}")
        
        # 문제 번호로 정렬
        all_problems.sort(key=lambda x: x['number'])
        
        # Markdown 생성
        self.save_to_markdown(all_problems, exam_title, output_path)
        
        processing_time = time.time() - start_time
        
        return {
            'file': pdf_path,
            'output': output_path,
            'total_pages': total_pages,
            'problems_extracted': len(all_problems),
            'text_pages': self.stats['text_extracted'],
            'ocr_pages': self.stats['ocr_used'],
            'processing_time': f"{processing_time:.2f}s"
        }
    
    def save_to_markdown(self, problems: List[Dict], title: str, output_path: str):
        """Markdown 파일로 저장"""
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(f"# {title}\n\n")
            f.write(f"총 문제 수: {len(problems)}\n\n")
            f.write("---\n\n")
            
            for problem in problems:
                f.write(f"## 문제 {problem['number']}\n\n")
                f.write(f"**문제:** {problem['question']}\n\n")
                
                if problem['options']:
                    f.write("**선택지:**\n")
                    for i, opt in enumerate(problem['options'], 1):
                        f.write(f"- {['①', '②', '③', '④', '⑤'][i-1]} {opt}\n")
                    f.write("\n")
                
                if problem['answer']:
                    f.write(f"**정답:** {problem['answer']}\n\n")
                
                if problem['explanation']:
                    f.write(f"**해설:** {problem['explanation']}\n\n")
                
                f.write("---\n\n")

def process_exam_files_parallel():
    """병렬 처리로 여러 PDF 파일 처리"""
    processor = OptimizedPDFProcessor()
    
    # 처리할 파일 목록
    files_to_process = [
        {
            'input': '/Users/voidlight/Downloads/[Codekiller]제7회 기출문제 해설집(v1.0).pdf',
            'output': '/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-7th-complete.md'
        },
        {
            'input': '/Users/voidlight/Downloads/[Codekiller]제8회 기출문제 해설집(v1.0).pdf',
            'output': '/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-8th-complete.md'
        },
        {
            'input': '/Users/voidlight/Downloads/[Codekiller]제9회 기출문제 해설집(v1.0).pdf',
            'output': '/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-9th-complete.md'
        }
    ]
    
    results = []
    start_time = time.time()
    
    # 병렬 처리 (프로세스 풀 사용)
    with ProcessPoolExecutor(max_workers=3) as executor:
        # 작업 제출
        future_to_file = {
            executor.submit(processor.process_pdf, f['input'], f['output']): f 
            for f in files_to_process
        }
        
        # 결과 수집
        for future in as_completed(future_to_file):
            file_info = future_to_file[future]
            try:
                result = future.result()
                results.append(result)
                logging.info(f"Completed: {file_info['input']}")
            except Exception as e:
                logging.error(f"Failed to process {file_info['input']}: {e}")
                results.append({
                    'file': file_info['input'],
                    'error': str(e)
                })
    
    total_time = time.time() - start_time
    
    # 처리 보고서 생성
    report = {
        'total_processing_time': f"{total_time:.2f}s",
        'files_processed': len(results),
        'results': results,
        'statistics': processor.stats
    }
    
    # 보고서 저장
    with open('/Users/voidlight/tree-doctor-pdf-qa-mcp/data/optimized_processing_report.json', 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    
    logging.info(f"Processing completed in {total_time:.2f} seconds")
    logging.info(f"Report saved to optimized_processing_report.json")

if __name__ == "__main__":
    # 단일 프로세스로 실행 (병렬 처리 문제 회피)
    processor = OptimizedPDFProcessor()
    
    files_to_process = [
        {
            'input': '/Users/voidlight/Downloads/[Codekiller]제7회 기출문제 해설집(v1.0).pdf',
            'output': '/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-7th-complete.md'
        },
        {
            'input': '/Users/voidlight/Downloads/[Codekiller]제8회 기출문제 해설집(v1.0).pdf',
            'output': '/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-8th-complete.md'
        },
        {
            'input': '/Users/voidlight/Downloads/[Codekiller]제9회 기출문제 해설집(v1.0).pdf',
            'output': '/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-9th-complete.md'
        }
    ]
    
    results = []
    start_time = time.time()
    
    for file_info in files_to_process:
        try:
            result = processor.process_pdf(file_info['input'], file_info['output'])
            results.append(result)
            logging.info(f"Completed: {file_info['input']}")
        except Exception as e:
            logging.error(f"Failed to process {file_info['input']}: {e}")
            results.append({
                'file': file_info['input'],
                'error': str(e)
            })
    
    total_time = time.time() - start_time
    
    # 처리 보고서 생성
    report = {
        'total_processing_time': f"{total_time:.2f}s",
        'files_processed': len(results),
        'results': results,
        'statistics': processor.stats
    }
    
    # 보고서 저장
    with open('/Users/voidlight/tree-doctor-pdf-qa-mcp/data/optimized_processing_report.json', 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    
    print(f"\n처리 완료!")
    print(f"총 처리 시간: {total_time:.2f}초")
    print(f"처리된 파일: {len(results)}개")
    print(f"텍스트 추출 페이지: {processor.stats['text_extracted']}")
    print(f"OCR 사용 페이지: {processor.stats['ocr_used']}")
    print(f"추출된 문제 수: {processor.stats['problems_found']}")