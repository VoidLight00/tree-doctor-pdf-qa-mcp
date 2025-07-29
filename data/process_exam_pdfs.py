#!/usr/bin/env python3
"""
나무의사 제10회, 제11회 기출문제 PDF 처리 스크립트
Enhanced OCR 기법 적용
"""

import os
import re
import sys
from pathlib import Path

# PDF 처리 라이브러리
try:
    import pymupdf  # PyMuPDF
    import pytesseract
    from PIL import Image
    import numpy as np
    import cv2
except ImportError as e:
    print(f"필요한 라이브러리가 설치되지 않았습니다: {e}")
    print("다음 명령어로 설치하세요:")
    print("pip install pymupdf pytesseract pillow numpy opencv-python")
    sys.exit(1)

class ExamPDFProcessor:
    """나무의사 시험 PDF 처리기"""
    
    def __init__(self):
        self.patterns = {
            'question_num': re.compile(r'^(\d+)\.\s*(.+)'),
            'choice': re.compile(r'^([①②③④⑤])\s*(.+)'),
            'answer': re.compile(r'정답\s*[:：]\s*([①②③④⑤])'),
            'explanation': re.compile(r'해설\s*[:：]\s*(.+)', re.DOTALL)
        }
    
    def enhance_image(self, image):
        """이미지 품질 향상"""
        # PIL Image를 numpy array로 변환
        img_array = np.array(image)
        
        # 그레이스케일 변환
        if len(img_array.shape) == 3:
            gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
        else:
            gray = img_array
        
        # 대비 향상
        enhanced = cv2.convertScaleAbs(gray, alpha=1.5, beta=0)
        
        # 노이즈 제거
        denoised = cv2.fastNlMeansDenoising(enhanced)
        
        # 이진화
        _, binary = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        return Image.fromarray(binary)
    
    def extract_text_from_pdf(self, pdf_path, use_ocr=True):
        """PDF에서 텍스트 추출"""
        doc = pymupdf.open(pdf_path)
        full_text = ""
        
        for page_num, page in enumerate(doc):
            # 먼저 내장 텍스트 추출 시도
            text = page.get_text()
            
            if use_ocr and len(text.strip()) < 100:  # 텍스트가 거의 없으면 OCR 사용
                # 페이지를 이미지로 변환
                pix = page.get_pixmap(matrix=pymupdf.Matrix(2, 2))  # 2x 해상도
                img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                
                # 이미지 향상
                enhanced_img = self.enhance_image(img)
                
                # OCR 수행
                text = pytesseract.image_to_string(enhanced_img, lang='kor')
            
            full_text += f"\n\n--- 페이지 {page_num + 1} ---\n\n{text}"
        
        doc.close()
        return full_text
    
    def parse_exam_10th(self, text):
        """제10회 해설집 파싱"""
        questions = []
        lines = text.split('\n')
        current_question = None
        
        i = 0
        while i < len(lines):
            line = lines[i].strip()
            
            # 문제 번호 찾기
            match = self.patterns['question_num'].match(line)
            if match:
                if current_question:
                    questions.append(current_question)
                
                current_question = {
                    'number': int(match.group(1)),
                    'question': match.group(2),
                    'choices': [],
                    'answer': '',
                    'explanation': ''
                }
            
            # 선택지 찾기
            elif current_question and self.patterns['choice'].match(line):
                match = self.patterns['choice'].match(line)
                current_question['choices'].append({
                    'num': match.group(1),
                    'text': match.group(2)
                })
            
            # 정답 찾기
            elif current_question and '정답' in line:
                match = self.patterns['answer'].search(line)
                if match:
                    current_question['answer'] = match.group(1)
            
            # 해설 찾기
            elif current_question and '해설' in line:
                # 해설은 여러 줄일 수 있으므로 다음 문제까지 수집
                explanation_lines = [line]
                i += 1
                while i < len(lines) and not self.patterns['question_num'].match(lines[i].strip()):
                    explanation_lines.append(lines[i].strip())
                    i += 1
                i -= 1  # 한 줄 뒤로
                current_question['explanation'] = '\n'.join(explanation_lines)
            
            i += 1
        
        if current_question:
            questions.append(current_question)
        
        return questions
    
    def parse_exam_11th(self, text):
        """제11회 시험지 파싱 (해설 없음)"""
        questions = []
        lines = text.split('\n')
        current_question = None
        
        for line in lines:
            line = line.strip()
            
            # 문제 번호 찾기
            match = self.patterns['question_num'].match(line)
            if match:
                if current_question:
                    questions.append(current_question)
                
                current_question = {
                    'number': int(match.group(1)),
                    'question': match.group(2),
                    'choices': []
                }
            
            # 선택지 찾기
            elif current_question and self.patterns['choice'].match(line):
                match = self.patterns['choice'].match(line)
                current_question['choices'].append({
                    'num': match.group(1),
                    'text': match.group(2)
                })
        
        if current_question:
            questions.append(current_question)
        
        return questions
    
    def format_markdown_10th(self, questions):
        """제10회 마크다운 포맷팅"""
        md = "# 제10회 나무의사 자격시험 기출문제 및 해설\n\n"
        
        for q in questions:
            md += f"## {q['number']}. {q['question']}\n\n"
            
            for choice in q['choices']:
                md += f"{choice['num']} {choice['text']}\n"
            
            md += f"\n**정답: {q['answer']}**\n\n"
            
            if q['explanation']:
                md += f"### 해설\n{q['explanation']}\n\n"
            
            md += "---\n\n"
        
        return md
    
    def format_markdown_11th(self, questions):
        """제11회 마크다운 포맷팅"""
        md = "# 제11회 나무의사 자격시험 1차 시험 문제\n\n"
        
        for q in questions:
            md += f"## {q['number']}. {q['question']}\n\n"
            
            for choice in q['choices']:
                md += f"{choice['num']} {choice['text']}\n"
            
            md += "\n---\n\n"
        
        return md
    
    def process_exam_pdfs(self):
        """메인 처리 함수"""
        # 파일 경로
        exam_10th_path = "/Users/voidlight/Downloads/[Codekiller]제10회 기출문제 해설집(v1.0).pdf"
        exam_11th_path = "/Users/voidlight/Downloads/제11회 나무의사 자격시험 1차 시험지.pdf"
        
        output_10th = "/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-10th-complete.md"
        output_11th = "/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-11th-complete.md"
        
        # 제10회 처리
        print("제10회 나무의사 자격시험 해설집 처리 중...")
        if os.path.exists(exam_10th_path):
            text_10th = self.extract_text_from_pdf(exam_10th_path, use_ocr=True)
            questions_10th = self.parse_exam_10th(text_10th)
            markdown_10th = self.format_markdown_10th(questions_10th)
            
            with open(output_10th, 'w', encoding='utf-8') as f:
                f.write(markdown_10th)
            
            print(f"✓ 제10회 처리 완료: {len(questions_10th)}개 문제")
            print(f"  저장 위치: {output_10th}")
        else:
            print(f"✗ 제10회 파일을 찾을 수 없습니다: {exam_10th_path}")
        
        # 제11회 처리
        print("\n제11회 나무의사 자격시험 시험지 처리 중...")
        if os.path.exists(exam_11th_path):
            text_11th = self.extract_text_from_pdf(exam_11th_path, use_ocr=True)
            questions_11th = self.parse_exam_11th(text_11th)
            markdown_11th = self.format_markdown_11th(questions_11th)
            
            with open(output_11th, 'w', encoding='utf-8') as f:
                f.write(markdown_11th)
            
            print(f"✓ 제11회 처리 완료: {len(questions_11th)}개 문제")
            print(f"  저장 위치: {output_11th}")
        else:
            print(f"✗ 제11회 파일을 찾을 수 없습니다: {exam_11th_path}")

if __name__ == "__main__":
    processor = ExamPDFProcessor()
    processor.process_exam_pdfs()