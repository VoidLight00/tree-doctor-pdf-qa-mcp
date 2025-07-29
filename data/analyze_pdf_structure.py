#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PDF 구조 분석 및 디버깅 스크립트
"""

import fitz  # PyMuPDF
import pdfplumber
import json
from pathlib import Path

def analyze_with_pymupdf(pdf_path):
    """PyMuPDF로 PDF 구조 분석"""
    print("\n=== PyMuPDF 분석 ===")
    
    doc = fitz.open(pdf_path)
    print(f"총 페이지 수: {len(doc)}")
    
    # 처음 5페이지 상세 분석
    for page_num in range(min(5, len(doc))):
        page = doc[page_num]
        print(f"\n--- 페이지 {page_num + 1} ---")
        
        # 텍스트 추출
        text = page.get_text()
        print(f"텍스트 길이: {len(text)} 문자")
        print(f"처음 500자:\n{text[:500]}")
        
        # 텍스트 블록 분석
        blocks = page.get_text("blocks")
        print(f"\n텍스트 블록 수: {len(blocks)}")
        
        # 처음 5개 블록 출력
        for i, block in enumerate(blocks[:5]):
            x0, y0, x1, y1, text, block_no, block_type = block
            if block_type == 0:  # 텍스트 블록
                print(f"\n블록 {i+1}: ({x0:.1f}, {y0:.1f}) - ({x1:.1f}, {y1:.1f})")
                print(f"내용: {text[:100]}")
    
    doc.close()

def analyze_with_pdfplumber(pdf_path):
    """pdfplumber로 PDF 구조 분석"""
    print("\n\n=== pdfplumber 분석 ===")
    
    with pdfplumber.open(pdf_path) as pdf:
        print(f"총 페이지 수: {len(pdf.pages)}")
        
        # 처음 5페이지 분석
        for i in range(min(5, len(pdf.pages))):
            page = pdf.pages[i]
            print(f"\n--- 페이지 {i + 1} ---")
            
            # 텍스트 추출
            text = page.extract_text() or ""
            print(f"텍스트 길이: {len(text)} 문자")
            print(f"처음 500자:\n{text[:500]}")
            
            # 테이블 확인
            tables = page.extract_tables()
            if tables:
                print(f"\n테이블 수: {len(tables)}")
                for j, table in enumerate(tables[:2]):
                    print(f"테이블 {j+1} 크기: {len(table)}x{len(table[0]) if table else 0}")
            
            # 문자 정보
            chars = page.chars[:10] if hasattr(page, 'chars') else []
            if chars:
                print(f"\n처음 10개 문자:")
                for char in chars:
                    print(f"  '{char.get('text', '')}' at ({char.get('x0', 0):.1f}, {char.get('y0', 0):.1f})")

def extract_with_layout_analysis(pdf_path):
    """레이아웃 분석을 통한 추출"""
    print("\n\n=== 레이아웃 기반 추출 ===")
    
    doc = fitz.open(pdf_path)
    all_text = []
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        
        # 디바이스 독립적 좌표로 텍스트 추출
        blocks = page.get_text("dict")
        
        # 블록을 y 좌표로 정렬 (위에서 아래로)
        for block in blocks["blocks"]:
            if block["type"] == 0:  # 텍스트 블록
                for line in block["lines"]:
                    line_text = ""
                    for span in line["spans"]:
                        line_text += span["text"]
                    if line_text.strip():
                        all_text.append(line_text.strip())
    
    doc.close()
    
    # 전체 텍스트 확인
    full_text = "\n".join(all_text)
    print(f"총 추출된 줄 수: {len(all_text)}")
    print(f"총 텍스트 길이: {len(full_text)}")
    
    # 문제 패턴 찾기
    import re
    
    # 숫자로 시작하는 줄 찾기
    numbered_lines = []
    for i, line in enumerate(all_text):
        if re.match(r'^\d{1,3}[\.)\s]', line):
            numbered_lines.append((i, line))
    
    print(f"\n숫자로 시작하는 줄 수: {len(numbered_lines)}")
    print("\n처음 10개:")
    for i, (idx, line) in enumerate(numbered_lines[:10]):
        print(f"{idx}: {line[:80]}")
    
    return all_text

def save_raw_text(pdf_path):
    """원시 텍스트를 파일로 저장"""
    print("\n\n=== 원시 텍스트 저장 ===")
    
    # PyMuPDF로 저장
    doc = fitz.open(pdf_path)
    text_pymupdf = ""
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        text_pymupdf += f"\n\n=== 페이지 {page_num + 1} ===\n\n"
        text_pymupdf += page.get_text()
    
    doc.close()
    
    # 파일로 저장
    output_path = Path(pdf_path).parent / "exam_6th_raw_pymupdf.txt"
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(text_pymupdf)
    print(f"PyMuPDF 텍스트 저장: {output_path}")
    
    # pdfplumber로 저장
    text_pdfplumber = ""
    with pdfplumber.open(pdf_path) as pdf:
        for i, page in enumerate(pdf.pages):
            text_pdfplumber += f"\n\n=== 페이지 {i + 1} ===\n\n"
            text_pdfplumber += page.extract_text() or ""
    
    output_path2 = Path(pdf_path).parent / "exam_6th_raw_pdfplumber.txt"
    with open(output_path2, 'w', encoding='utf-8') as f:
        f.write(text_pdfplumber)
    print(f"pdfplumber 텍스트 저장: {output_path2}")
    
    return str(output_path), str(output_path2)

def main():
    pdf_path = "/Users/voidlight/Downloads/[Codekiller]제6회 기출문제 해설집(v1.0).pdf"
    
    print("PDF 구조 분석 시작...")
    
    # 1. PyMuPDF 분석
    analyze_with_pymupdf(pdf_path)
    
    # 2. pdfplumber 분석
    analyze_with_pdfplumber(pdf_path)
    
    # 3. 레이아웃 기반 추출
    all_lines = extract_with_layout_analysis(pdf_path)
    
    # 4. 원시 텍스트 저장
    path1, path2 = save_raw_text(pdf_path)
    
    print("\n\n분석 완료!")
    print(f"원시 텍스트 파일을 확인하세요:")
    print(f"- {path1}")
    print(f"- {path2}")

if __name__ == "__main__":
    main()