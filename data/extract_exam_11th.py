#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
제11회 나무의사 자격시험 PDF 추출 스크립트
150문제 완벽 추출을 목표로 함
"""

import os
import sys
import re
import subprocess
from pathlib import Path

# PDF 파일 경로
PDF_PATH = "/Users/voidlight/Downloads/제11회 나무의사 자격시험 1차 시험지.pdf"
OUTPUT_PATH = "/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-11th-perfect.md"

def method1_markitdown():
    """Method 1: markitdown 사용"""
    print("Method 1: markitdown 시도...")
    try:
        import markitdown
        from markitdown import MarkItDown
        
        md = MarkItDown()
        result = md.convert(PDF_PATH)
        
        if result and result.text_content:
            with open(OUTPUT_PATH.replace('.md', '_markitdown.md'), 'w', encoding='utf-8') as f:
                f.write(result.text_content)
            print(f"markitdown 추출 완료: {len(result.text_content)} 문자")
            return result.text_content
    except Exception as e:
        print(f"markitdown 실패: {e}")
    return None

def method2_marker():
    """Method 2: marker-pdf 사용 (한국어 최적화)"""
    print("\nMethod 2: marker-pdf 시도...")
    try:
        # marker 실행
        cmd = [
            'marker_single',
            PDF_PATH,
            '/Users/voidlight/tree-doctor-pdf-qa-mcp/data/',
            '--lang', 'ko',
            '--batch_multiplier', '2',
            '--max_pages', '50'
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0:
            print("marker-pdf 추출 완료")
            # marker 출력 파일 찾기
            marker_output = Path(PDF_PATH).stem + "/제11회 나무의사 자격시험 1차 시험지.md"
            marker_path = Path("/Users/voidlight/tree-doctor-pdf-qa-mcp/data") / marker_output
            if marker_path.exists():
                content = marker_path.read_text(encoding='utf-8')
                with open(OUTPUT_PATH.replace('.md', '_marker.md'), 'w', encoding='utf-8') as f:
                    f.write(content)
                return content
    except Exception as e:
        print(f"marker-pdf 실패: {e}")
    return None

def method3_pymupdf():
    """Method 3: PyMuPDF 직접 추출"""
    print("\nMethod 3: PyMuPDF 시도...")
    try:
        import fitz  # PyMuPDF
        
        doc = fitz.open(PDF_PATH)
        full_text = []
        
        for page_num in range(len(doc)):
            page = doc[page_num]
            text = page.get_text()
            full_text.append(f"\n--- 페이지 {page_num + 1} ---\n")
            full_text.append(text)
        
        doc.close()
        
        content = ''.join(full_text)
        with open(OUTPUT_PATH.replace('.md', '_pymupdf.md'), 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"PyMuPDF 추출 완료: {len(content)} 문자")
        return content
    except Exception as e:
        print(f"PyMuPDF 실패: {e}")
    return None

def method4_pdfplumber():
    """Method 4: pdfplumber 사용"""
    print("\nMethod 4: pdfplumber 시도...")
    try:
        import pdfplumber
        
        full_text = []
        with pdfplumber.open(PDF_PATH) as pdf:
            for i, page in enumerate(pdf.pages):
                full_text.append(f"\n--- 페이지 {i + 1} ---\n")
                text = page.extract_text()
                if text:
                    full_text.append(text)
                
                # 테이블 추출 시도
                tables = page.extract_tables()
                if tables:
                    for table in tables:
                        for row in table:
                            full_text.append(' | '.join(str(cell) if cell else '' for cell in row))
                        full_text.append('\n')
        
        content = '\n'.join(full_text)
        with open(OUTPUT_PATH.replace('.md', '_pdfplumber.md'), 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"pdfplumber 추출 완료: {len(content)} 문자")
        return content
    except Exception as e:
        print(f"pdfplumber 실패: {e}")
    return None

def method5_ocr():
    """Method 5: OCR (pdf2image + pytesseract)"""
    print("\nMethod 5: OCR 시도...")
    try:
        from pdf2image import convert_from_path
        import pytesseract
        
        # PDF를 이미지로 변환
        images = convert_from_path(PDF_PATH, dpi=300)
        print(f"총 {len(images)} 페이지를 이미지로 변환")
        
        full_text = []
        for i, image in enumerate(images):
            print(f"페이지 {i+1} OCR 처리 중...")
            # OCR 수행 (한국어)
            text = pytesseract.image_to_string(image, lang='kor')
            full_text.append(f"\n--- 페이지 {i + 1} ---\n")
            full_text.append(text)
        
        content = '\n'.join(full_text)
        with open(OUTPUT_PATH.replace('.md', '_ocr.md'), 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"OCR 추출 완료: {len(content)} 문자")
        return content
    except Exception as e:
        print(f"OCR 실패: {e}")
    return None

def analyze_content(content, method_name):
    """추출된 내용 분석"""
    if not content:
        return 0, []
    
    # 문제 패턴 찾기
    patterns = [
        r'(\d+)\s*\.\s*',  # 1. 형식
        r'문제\s*(\d+)',   # 문제 1 형식
        r'(\d+)\s*번',     # 1번 형식
        r'^(\d+)\s+',      # 줄 시작의 숫자
    ]
    
    found_questions = set()
    for pattern in patterns:
        matches = re.finditer(pattern, content, re.MULTILINE)
        for match in matches:
            num = int(match.group(1))
            if 1 <= num <= 150:
                found_questions.add(num)
    
    print(f"\n{method_name} 분석 결과:")
    print(f"- 찾은 문제 수: {len(found_questions)}")
    print(f"- 문제 번호 범위: {min(found_questions) if found_questions else 0} ~ {max(found_questions) if found_questions else 0}")
    
    # 누락된 문제 확인
    missing = []
    for i in range(1, 151):
        if i not in found_questions:
            missing.append(i)
    
    if missing:
        print(f"- 누락된 문제: {len(missing)}개")
        if len(missing) <= 20:
            print(f"  누락 번호: {missing}")
    
    return len(found_questions), list(found_questions)

def combine_best_results(all_results):
    """가장 좋은 결과들을 조합"""
    print("\n=== 최종 결과 조합 ===")
    
    # 가장 많은 문제를 찾은 방법 선택
    best_method = max(all_results.items(), key=lambda x: x[1]['count'])
    print(f"기본 방법: {best_method[0]} ({best_method[1]['count']}문제)")
    
    # 최종 마크다운 생성
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        f.write("# 제11회 나무의사 자격시험 1차 시험\n\n")
        f.write(f"추출 방법: {best_method[0]}\n")
        f.write(f"총 문제 수: {best_method[1]['count']}/150\n\n")
        
        # 가장 좋은 결과의 내용 사용
        if best_method[1]['content']:
            f.write(best_method[1]['content'])
    
    print(f"\n최종 파일 생성: {OUTPUT_PATH}")
    return best_method[1]['count']

def main():
    """메인 실행 함수"""
    print("제11회 나무의사 자격시험 PDF 추출 시작\n")
    
    all_results = {}
    
    # 각 방법 시도
    methods = [
        ('markitdown', method1_markitdown),
        ('marker', method2_marker),
        ('pymupdf', method3_pymupdf),
        ('pdfplumber', method4_pdfplumber),
        ('ocr', method5_ocr)
    ]
    
    for method_name, method_func in methods:
        try:
            content = method_func()
            if content:
                count, questions = analyze_content(content, method_name)
                all_results[method_name] = {
                    'count': count,
                    'questions': questions,
                    'content': content
                }
        except Exception as e:
            print(f"{method_name} 오류: {e}")
    
    # 결과 요약
    print("\n=== 전체 결과 요약 ===")
    for method, result in all_results.items():
        print(f"{method}: {result['count']}문제 추출")
    
    # 최종 결과 조합
    if all_results:
        final_count = combine_best_results(all_results)
        if final_count >= 140:
            print("\n✅ 추출 성공! 대부분의 문제를 찾았습니다.")
        else:
            print(f"\n⚠️ 추출 부분 성공. {final_count}/150 문제만 찾았습니다.")
    else:
        print("\n❌ 모든 방법이 실패했습니다.")

if __name__ == "__main__":
    main()