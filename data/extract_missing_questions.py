#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
누락된 문제 126-150 추출을 위한 특별 스크립트
"""

import fitz  # PyMuPDF
import re
from pdf2image import convert_from_path
import pytesseract

PDF_PATH = "/Users/voidlight/Downloads/제11회 나무의사 자격시험 1차 시험지.pdf"

def extract_last_pages_with_pymupdf():
    """PyMuPDF로 마지막 페이지들 자세히 추출"""
    print("PyMuPDF로 마지막 15페이지 상세 추출...")
    
    doc = fitz.open(PDF_PATH)
    total_pages = len(doc)
    print(f"총 페이지 수: {total_pages}")
    
    # 마지막 15페이지 추출
    for page_num in range(max(0, total_pages - 15), total_pages):
        page = doc[page_num]
        print(f"\n=== 페이지 {page_num + 1}/{total_pages} ===")
        
        # 텍스트 추출
        text = page.get_text()
        print(f"텍스트 길이: {len(text)}")
        
        # 문제 번호 찾기
        question_nums = re.findall(r'(\d{1,3})\s*\.', text)
        if question_nums:
            nums = [int(n) for n in question_nums if 100 <= int(n) <= 150]
            if nums:
                print(f"찾은 문제 번호: {nums}")
        
        # 페이지 내용 일부 출력
        lines = text.split('\n')
        for line in lines:
            if re.search(r'1[2-5]\d\s*\.', line):
                print(f"문제 라인: {line[:100]}")
        
        # 블록 단위로도 추출 시도
        blocks = page.get_text("blocks")
        print(f"블록 수: {len(blocks)}")
    
    doc.close()

def extract_with_different_methods():
    """다양한 추출 방법 시도"""
    print("\n다양한 추출 방법 시도...")
    
    doc = fitz.open(PDF_PATH)
    total_pages = len(doc)
    
    # 방법 1: dict 형식으로 추출
    print("\n방법 1: dict 형식 추출")
    for page_num in range(max(0, total_pages - 10), total_pages):
        page = doc[page_num]
        page_dict = page.get_text("dict")
        
        # 블록들 검사
        for block in page_dict["blocks"]:
            if "lines" in block:
                for line in block["lines"]:
                    for span in line["spans"]:
                        text = span["text"]
                        if re.search(r'1[2-5]\d\s*\.', text):
                            print(f"페이지 {page_num + 1}: {text}")
    
    # 방법 2: rawdict 형식
    print("\n방법 2: rawdict 형식 추출")
    for page_num in range(max(0, total_pages - 5), total_pages):
        page = doc[page_num]
        page_dict = page.get_text("rawdict")
        
        # 텍스트 조각들 검사
        if "blocks" in page_dict:
            for block in page_dict["blocks"]:
                if "lines" in block:
                    for line in block["lines"]:
                        if "spans" in line:
                            for span in line["spans"]:
                                if "text" in span:
                                    text = span["text"]
                                    if re.search(r'1[3-5]\d', text):
                                        print(f"페이지 {page_num + 1}: {text}")
    
    doc.close()

def ocr_last_pages():
    """마지막 페이지들 OCR로 재시도"""
    print("\n마지막 10페이지 OCR 재시도...")
    
    # PDF를 이미지로 변환 (마지막 10페이지만)
    images = convert_from_path(PDF_PATH, dpi=300, first_page=31, last_page=40)
    
    full_text = []
    for i, image in enumerate(images):
        page_num = 30 + i + 1
        print(f"\n페이지 {page_num} OCR 처리...")
        
        # OCR 수행
        text = pytesseract.image_to_string(image, lang='kor')
        
        # 문제 번호 찾기
        question_nums = re.findall(r'(\d{1,3})\s*[\.)]', text)
        nums = [int(n) for n in question_nums if 100 <= int(n) <= 150]
        if nums:
            print(f"OCR로 찾은 문제: {nums}")
        
        # 126-150 범위의 문제 찾기
        lines = text.split('\n')
        for line in lines:
            if re.search(r'1[2-5]\d\s*[\.)]', line):
                print(f"문제 라인: {line[:100]}")
        
        full_text.append(f"\n--- 페이지 {page_num} (OCR) ---\n")
        full_text.append(text)
    
    # OCR 결과 저장
    with open('/Users/voidlight/tree-doctor-pdf-qa-mcp/data/last_pages_ocr.txt', 'w', encoding='utf-8') as f:
        f.write('\n'.join(full_text))
    
    return '\n'.join(full_text)

def check_pdf_structure():
    """PDF 구조 확인"""
    print("\nPDF 구조 분석...")
    
    doc = fitz.open(PDF_PATH)
    print(f"총 페이지: {len(doc)}")
    print(f"메타데이터: {doc.metadata}")
    
    # 각 페이지의 크기와 회전 확인
    for i in range(len(doc)):
        page = doc[i]
        print(f"페이지 {i+1}: 크기={page.rect}, 회전={page.rotation}")
    
    doc.close()

def combine_all_methods():
    """모든 방법을 조합하여 150문제 완성"""
    print("\n=== 모든 방법 조합하여 150문제 추출 ===")
    
    # 기존 125문제 읽기
    with open('/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-11th-perfect_pymupdf.md', 'r', encoding='utf-8') as f:
        existing_content = f.read()
    
    # 누락된 문제 찾기
    found_questions = set()
    for match in re.finditer(r'^(\d+)\s*\.', existing_content, re.MULTILINE):
        num = int(match.group(1))
        if 1 <= num <= 150:
            found_questions.add(num)
    
    missing = []
    for i in range(1, 151):
        if i not in found_questions:
            missing.append(i)
    
    print(f"누락된 문제: {missing}")
    
    # 마지막 페이지들에서 누락된 문제 찾기
    doc = fitz.open(PDF_PATH)
    
    # 뒤에서부터 페이지 검색
    additional_content = []
    for page_num in range(len(doc)-1, -1, -1):
        page = doc[page_num]
        text = page.get_text()
        
        # 누락된 문제 번호 찾기
        for num in missing:
            pattern = rf'{num}\s*\.'
            if re.search(pattern, text):
                print(f"페이지 {page_num + 1}에서 문제 {num} 발견!")
                # 해당 페이지 전체 내용 추가
                additional_content.append(f"\n--- 페이지 {page_num + 1} (추가) ---\n")
                additional_content.append(text)
                break
    
    doc.close()
    
    # 최종 파일 생성
    with open('/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-11th-complete.md', 'w', encoding='utf-8') as f:
        f.write("# 제11회 나무의사 자격시험 1차 시험 (완전판)\n\n")
        f.write(existing_content)
        f.write("\n\n## 추가 발견된 문제들\n\n")
        f.write('\n'.join(additional_content))
    
    print(f"\n완성 파일: exam-11th-complete.md")

def main():
    """메인 함수"""
    print("누락된 문제 찾기 시작...\n")
    
    # 1. PDF 구조 확인
    check_pdf_structure()
    
    # 2. PyMuPDF로 마지막 페이지들 상세 분석
    extract_last_pages_with_pymupdf()
    
    # 3. 다양한 추출 방법 시도
    extract_with_different_methods()
    
    # 4. OCR로 마지막 페이지들 재시도
    ocr_text = ocr_last_pages()
    
    # 5. 모든 방법 조합
    combine_all_methods()

if __name__ == "__main__":
    main()