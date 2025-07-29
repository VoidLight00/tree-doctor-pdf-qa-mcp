#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
OCR을 사용한 PDF 추출 스크립트
pdf2image와 pytesseract를 사용하여 이미지 기반 PDF 처리
"""

import os
import sys
from pathlib import Path

try:
    from pdf2image import convert_from_path
    import pytesseract
    from PIL import Image
    import fitz  # PyMuPDF
except ImportError as e:
    print(f"필요한 라이브러리가 없습니다: {e}")
    print("설치 방법:")
    print("pip install pdf2image pytesseract pillow PyMuPDF")
    print("brew install tesseract poppler")
    sys.exit(1)

def extract_images_from_pdf(pdf_path):
    """PDF에서 이미지 추출"""
    print("PDF에서 이미지 추출 중...")
    
    doc = fitz.open(pdf_path)
    images = []
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        image_list = page.get_images()
        
        if image_list:
            print(f"페이지 {page_num + 1}: {len(image_list)}개의 이미지 발견")
            
            for img_index, img in enumerate(image_list):
                xref = img[0]
                pix = fitz.Pixmap(doc, xref)
                
                if pix.n - pix.alpha < 4:  # GRAY or RGB
                    img_data = pix.tobytes("png")
                    images.append({
                        'page': page_num + 1,
                        'index': img_index,
                        'data': img_data
                    })
                else:  # CMYK
                    pix1 = fitz.Pixmap(fitz.csRGB, pix)
                    img_data = pix1.tobytes("png")
                    images.append({
                        'page': page_num + 1,
                        'index': img_index,
                        'data': img_data
                    })
                    pix1 = None
                pix = None
    
    doc.close()
    return images

def pdf_to_images_ocr(pdf_path, output_dir):
    """PDF를 이미지로 변환하고 OCR 수행"""
    print("PDF를 이미지로 변환 중...")
    
    try:
        # PDF를 이미지로 변환
        images = convert_from_path(pdf_path, dpi=300)
        print(f"총 {len(images)}개 페이지 변환 완료")
        
        all_text = []
        
        # 각 페이지 OCR 처리
        for i, image in enumerate(images):
            print(f"페이지 {i+1}/{len(images)} OCR 처리 중...")
            
            # 이미지 저장 (디버깅용)
            img_path = Path(output_dir) / f"page_{i+1}.png"
            image.save(img_path)
            
            # OCR 수행 (한국어)
            try:
                text = pytesseract.image_to_string(image, lang='kor')
                all_text.append(f"\n\n=== 페이지 {i+1} ===\n\n{text}")
            except Exception as e:
                print(f"페이지 {i+1} OCR 오류: {e}")
                all_text.append(f"\n\n=== 페이지 {i+1} ===\n\n[OCR 실패]")
        
        return "\n".join(all_text)
        
    except Exception as e:
        print(f"PDF 변환 오류: {e}")
        return None

def process_ocr_text(text):
    """OCR 텍스트에서 문제 추출"""
    import re
    
    questions = []
    
    # 문제 패턴들
    patterns = [
        r'(\d{1,3})\s*[\.]\s*((?:(?!\d{1,3}\s*[\.])[\s\S])*?)(?=\d{1,3}\s*[\.]\s*|$)',
        r'(\d{1,3})\s*번\s*((?:(?!\d{1,3}\s*번)[\s\S])*?)(?=\d{1,3}\s*번|$)',
        r'문제\s*(\d{1,3})\s*((?:(?!문제\s*\d{1,3})[\s\S])*?)(?=문제\s*\d{1,3}|$)',
    ]
    
    for pattern in patterns:
        matches = re.findall(pattern, text, re.MULTILINE | re.DOTALL)
        if len(matches) > 50:
            print(f"패턴 매칭 성공: {len(matches)}개 문제 발견")
            for num, content in matches:
                try:
                    q_num = int(num)
                    if 1 <= q_num <= 150:
                        questions.append((q_num, clean_ocr_content(content)))
                except:
                    continue
            break
    
    return sorted(questions, key=lambda x: x[0])

def clean_ocr_content(content):
    """OCR 결과 정리"""
    # 불필요한 공백 제거
    content = re.sub(r'\s+', ' ', content).strip()
    
    # 선택지 정리
    content = re.sub(r'([①②③④⑤])\s*', r'\n\1 ', content)
    
    # 정답 표시
    content = re.sub(r'정\s*답\s*[:：]?\s*', '\n\n**정답: ', content)
    content = re.sub(r'해\s*설\s*[:：]?\s*', '\n\n**해설:**\n', content)
    
    return content

def main():
    pdf_path = "/Users/voidlight/Downloads/[Codekiller]제6회 기출문제 해설집(v1.0).pdf"
    output_dir = "/Users/voidlight/tree-doctor-pdf-qa-mcp/data/ocr_output"
    final_output = "/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-6th-perfect.md"
    
    # 출력 디렉토리 생성
    os.makedirs(output_dir, exist_ok=True)
    
    # Tesseract 확인
    try:
        tesseract_version = pytesseract.get_tesseract_version()
        print(f"Tesseract 버전: {tesseract_version}")
    except:
        print("Tesseract가 설치되지 않았습니다.")
        print("설치: brew install tesseract tesseract-lang")
        return
    
    # 1. PDF에서 이미지 추출 시도
    images = extract_images_from_pdf(pdf_path)
    if images:
        print(f"\nPDF에서 {len(images)}개의 이미지를 추출했습니다.")
    
    # 2. PDF를 이미지로 변환하고 OCR
    print("\nPDF OCR 처리 시작...")
    ocr_text = pdf_to_images_ocr(pdf_path, output_dir)
    
    if not ocr_text:
        print("OCR 실패")
        return
    
    # OCR 결과 저장
    ocr_path = Path(output_dir) / "ocr_result.txt"
    with open(ocr_path, 'w', encoding='utf-8') as f:
        f.write(ocr_text)
    print(f"OCR 결과 저장: {ocr_path}")
    
    # 3. 문제 추출
    print("\n문제 추출 중...")
    questions = process_ocr_text(ocr_text)
    print(f"추출된 문제: {len(questions)}개")
    
    # 4. 마크다운 생성
    md_content = "# 나무의사 제6회 기출문제 (150문제)\n\n"
    md_content += "> OCR을 사용하여 추출한 문제입니다.\n\n"
    md_content += "---\n\n"
    
    missing = []
    
    for i in range(1, 151):
        found = False
        for q_num, content in questions:
            if q_num == i:
                md_content += f"## 문제 {i}\n\n"
                md_content += content + "\n\n"
                md_content += "---\n\n"
                found = True
                break
        
        if not found:
            missing.append(i)
            md_content += f"## 문제 {i}\n\n"
            md_content += "*(OCR 추출 실패)*\n\n"
            md_content += "---\n\n"
    
    # 저장
    with open(final_output, 'w', encoding='utf-8') as f:
        f.write(md_content)
    
    print(f"\n완료!")
    print(f"출력: {final_output}")
    print(f"성공: {150 - len(missing)}개")
    if missing:
        print(f"실패: {len(missing)}개")

if __name__ == "__main__":
    main()