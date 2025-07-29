#!/usr/bin/env python3
"""
OCR을 사용한 PDF 텍스트 추출기
"""

import pymupdf
import pytesseract
from PIL import Image
import io
import sys

def extract_pdf_with_ocr(pdf_path, output_path):
    """PDF를 OCR로 처리하여 텍스트 추출"""
    try:
        doc = pymupdf.open(pdf_path)
        full_text = ""
        
        for page_num, page in enumerate(doc):
            print(f"  페이지 {page_num + 1}/{len(doc)} 처리 중...")
            
            # 페이지를 이미지로 변환 (고해상도)
            pix = page.get_pixmap(matrix=pymupdf.Matrix(3, 3))  # 3x 해상도
            img_data = pix.tobytes("png")
            img = Image.open(io.BytesIO(img_data))
            
            # OCR 수행
            text = pytesseract.image_to_string(img, lang='kor')
            full_text += f"\n\n--- 페이지 {page_num + 1} ---\n\n{text}"
        
        doc.close()
        
        # 파일로 저장
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(full_text)
        
        return True
    except Exception as e:
        print(f"오류 발생: {e}")
        return False

# 제10회 OCR 처리
print("제10회 OCR 처리 중...")
if extract_pdf_with_ocr(
    "/Users/voidlight/Downloads/[Codekiller]제10회 기출문제 해설집(v1.0).pdf",
    "/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-10th-ocr.txt"
):
    print("✓ 제10회 OCR 완료")

# 제11회 OCR 처리  
print("\n제11회 OCR 처리 중...")
if extract_pdf_with_ocr(
    "/Users/voidlight/Downloads/제11회 나무의사 자격시험 1차 시험지.pdf",
    "/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-11th-ocr.txt"
):
    print("✓ 제11회 OCR 완료")