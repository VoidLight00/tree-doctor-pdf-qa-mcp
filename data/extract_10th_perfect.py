#!/usr/bin/env python3
"""
나무의사 제10회 기출문제 완벽 추출 스크립트
150문제 모두 추출하기 위한 통합 접근법
"""

import os
import sys
import json
import re
import subprocess
import fitz  # PyMuPDF
import pytesseract
from PIL import Image
import io
from pathlib import Path
import logging

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('extraction_10th.log'),
        logging.StreamHandler()
    ]
)

class Exam10thExtractor:
    def __init__(self, pdf_path):
        self.pdf_path = pdf_path
        self.questions = {}
        self.total_pages = 0
        
    def extract_with_pymupdf(self):
        """PyMuPDF를 사용한 직접 텍스트 추출"""
        logging.info("PyMuPDF로 텍스트 추출 시작...")
        
        try:
            doc = fitz.open(self.pdf_path)
            self.total_pages = len(doc)
            logging.info(f"총 페이지 수: {self.total_pages}")
            
            all_text = ""
            for page_num in range(self.total_pages):
                page = doc[page_num]
                text = page.get_text()
                all_text += f"\n--- 페이지 {page_num + 1} ---\n{text}"
                
                # 문제 번호 패턴 찾기
                question_pattern = r'(\d{1,3})\s*\.\s*([^①②③④]+)'
                matches = re.finditer(question_pattern, text, re.MULTILINE | re.DOTALL)
                
                for match in matches:
                    q_num = int(match.group(1))
                    if 1 <= q_num <= 150:
                        logging.info(f"문제 {q_num} 발견 (페이지 {page_num + 1})")
            
            doc.close()
            
            # 전체 텍스트 저장
            with open('exam-10th-pymupdf.txt', 'w', encoding='utf-8') as f:
                f.write(all_text)
                
            return all_text
            
        except Exception as e:
            logging.error(f"PyMuPDF 추출 오류: {e}")
            return ""
    
    def extract_with_ocr(self):
        """페이지별 OCR 수행"""
        logging.info("OCR 추출 시작...")
        
        try:
            doc = fitz.open(self.pdf_path)
            ocr_text = ""
            
            for page_num in range(self.total_pages):
                logging.info(f"페이지 {page_num + 1} OCR 처리 중...")
                
                page = doc[page_num]
                # 고해상도로 이미지 변환
                mat = fitz.Matrix(3, 3)  # 3배 확대
                pix = page.get_pixmap(matrix=mat)
                img_data = pix.pil_tobytes(format="PNG")
                
                # PIL 이미지로 변환
                img = Image.open(io.BytesIO(img_data))
                
                # OCR 수행 (한국어)
                text = pytesseract.image_to_string(img, lang='kor')
                ocr_text += f"\n--- 페이지 {page_num + 1} OCR ---\n{text}"
                
                # 문제 번호 찾기
                question_nums = re.findall(r'^\s*(\d{1,3})\s*\.', text, re.MULTILINE)
                for num in question_nums:
                    logging.info(f"OCR에서 문제 {num} 발견 (페이지 {page_num + 1})")
            
            doc.close()
            
            # OCR 결과 저장
            with open('exam-10th-ocr-full.txt', 'w', encoding='utf-8') as f:
                f.write(ocr_text)
                
            return ocr_text
            
        except Exception as e:
            logging.error(f"OCR 추출 오류: {e}")
            return ""
    
    def extract_with_marker(self):
        """Marker를 사용한 추출"""
        logging.info("Marker로 추출 시작...")
        
        try:
            # Marker 실행
            cmd = [
                'marker_single',
                self.pdf_path,
                'marker-output-10th',
                '--langs', 'ko',
                '--batch_multiplier', '2',
                '--max_pages', '300'
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode == 0:
                logging.info("Marker 변환 성공")
                
                # 출력 파일 찾기
                output_dir = Path('marker-output-10th')
                if output_dir.exists():
                    for md_file in output_dir.glob('**/*.md'):
                        with open(md_file, 'r', encoding='utf-8') as f:
                            content = f.read()
                            
                        # 문제 수 확인
                        question_nums = re.findall(r'^\s*(\d{1,3})\s*\.', content, re.MULTILINE)
                        logging.info(f"Marker에서 {len(set(question_nums))}개 문제 발견")
                        
                        return content
            else:
                logging.error(f"Marker 오류: {result.stderr}")
                
        except Exception as e:
            logging.error(f"Marker 추출 오류: {e}")
            
        return ""
    
    def parse_questions(self, text):
        """텍스트에서 문제 파싱"""
        logging.info("문제 파싱 시작...")
        
        # 다양한 문제 패턴 시도
        patterns = [
            # 표준 패턴
            r'(\d{1,3})\s*\.\s*([^①②③④]+?)(?=①)',
            # 줄바꿈 포함 패턴
            r'(\d{1,3})\s*\.\s*([\s\S]+?)(?=①)',
            # 느슨한 패턴
            r'(\d{1,3})\.\s*(.+?)(?=\n\s*①)',
        ]
        
        for pattern in patterns:
            matches = list(re.finditer(pattern, text, re.MULTILINE))
            logging.info(f"패턴 {patterns.index(pattern) + 1}: {len(matches)}개 매치")
        
        # 가장 좋은 패턴 선택
        best_pattern = patterns[0]
        max_matches = 0
        
        for pattern in patterns:
            matches = list(re.finditer(pattern, text, re.MULTILINE))
            valid_matches = [m for m in matches if 1 <= int(m.group(1)) <= 150]
            if len(valid_matches) > max_matches:
                max_matches = len(valid_matches)
                best_pattern = pattern
        
        logging.info(f"최선의 패턴으로 {max_matches}개 문제 발견")
        
        # 문제 추출
        matches = re.finditer(best_pattern, text, re.MULTILINE)
        
        for match in matches:
            q_num = int(match.group(1))
            if 1 <= q_num <= 150:
                q_text = match.group(2).strip()
                
                # 선택지 찾기
                start_pos = match.end()
                next_q_pattern = rf'{q_num + 1}\s*\.'
                next_match = re.search(next_q_pattern, text[start_pos:])
                
                if next_match:
                    end_pos = start_pos + next_match.start()
                else:
                    # 다음 문제가 없으면 적당한 길이만큼
                    end_pos = start_pos + 1000
                
                choices_text = text[start_pos:end_pos]
                
                # 선택지 파싱
                choices = {}
                choice_patterns = [
                    r'①\s*([^②③④]+)',
                    r'②\s*([^①③④]+)',
                    r'③\s*([^①②④]+)',
                    r'④\s*([^①②③]+)'
                ]
                
                for i, cp in enumerate(choice_patterns, 1):
                    choice_match = re.search(cp, choices_text)
                    if choice_match:
                        choices[str(i)] = choice_match.group(1).strip()
                
                # 정답 찾기
                answer_match = re.search(rf'{q_num}\s*[.)]\s*([①②③④])', text)
                answer = None
                if answer_match:
                    answer_char = answer_match.group(1)
                    answer = str(['①', '②', '③', '④'].index(answer_char) + 1)
                
                self.questions[q_num] = {
                    'number': q_num,
                    'question': q_text,
                    'choices': choices,
                    'answer': answer
                }
    
    def extract_all(self):
        """모든 방법을 사용하여 추출"""
        # 1. PyMuPDF 추출
        pymupdf_text = self.extract_with_pymupdf()
        self.parse_questions(pymupdf_text)
        logging.info(f"PyMuPDF: {len(self.questions)}개 문제 추출")
        
        # 2. OCR 추출
        if len(self.questions) < 150:
            ocr_text = self.extract_with_ocr()
            self.parse_questions(ocr_text)
            logging.info(f"OCR 후: {len(self.questions)}개 문제 추출")
        
        # 3. Marker 추출
        if len(self.questions) < 150:
            marker_text = self.extract_with_marker()
            if marker_text:
                self.parse_questions(marker_text)
                logging.info(f"Marker 후: {len(self.questions)}개 문제 추출")
        
        # 결과 정리
        logging.info(f"\n최종 추출 결과: {len(self.questions)}개 문제")
        
        # 누락된 문제 확인
        missing = []
        for i in range(1, 151):
            if i not in self.questions:
                missing.append(i)
        
        if missing:
            logging.warning(f"누락된 문제: {missing}")
        
        return self.questions
    
    def save_results(self):
        """결과 저장"""
        # JSON 저장
        with open('exam-10th-perfect.json', 'w', encoding='utf-8') as f:
            json.dump(self.questions, f, ensure_ascii=False, indent=2)
        
        # Markdown 저장
        with open('exam-10th-perfect.md', 'w', encoding='utf-8') as f:
            f.write("# 나무의사 제10회 기출문제\n\n")
            f.write(f"총 {len(self.questions)}문제 추출\n\n")
            
            for i in range(1, 151):
                if i in self.questions:
                    q = self.questions[i]
                    f.write(f"## {i}. {q['question']}\n\n")
                    
                    if q['choices']:
                        for num, choice in q['choices'].items():
                            f.write(f"{'①②③④'[int(num)-1]} {choice}\n")
                    
                    if q['answer']:
                        f.write(f"\n**정답: {'①②③④'[int(q['answer'])-1]}**\n")
                    
                    f.write("\n---\n\n")
                else:
                    f.write(f"## {i}. [누락된 문제]\n\n---\n\n")
        
        logging.info("결과 저장 완료")

def main():
    pdf_path = "./exam-10th.pdf"
    
    if not os.path.exists(pdf_path):
        logging.error(f"PDF 파일을 찾을 수 없습니다: {pdf_path}")
        return
    
    extractor = Exam10thExtractor(pdf_path)
    extractor.extract_all()
    extractor.save_results()
    
    print(f"\n추출 완료!")
    print(f"- 총 {len(extractor.questions)}개 문제 추출")
    print(f"- exam-10th-perfect.json: JSON 형식")
    print(f"- exam-10th-perfect.md: Markdown 형식")

if __name__ == "__main__":
    main()