#!/usr/bin/env python3
"""
간단한 PDF 텍스트 추출기
"""

import pymupdf
import sys

def extract_pdf_text(pdf_path):
    """PDF에서 텍스트만 간단히 추출"""
    try:
        doc = pymupdf.open(pdf_path)
        full_text = ""
        
        for page_num, page in enumerate(doc):
            text = page.get_text()
            full_text += f"\n\n--- 페이지 {page_num + 1} ---\n\n{text}"
        
        doc.close()
        return full_text
    except Exception as e:
        print(f"오류 발생: {e}")
        return None

# 제10회 추출
print("제10회 처리 중...")
exam_10_text = extract_pdf_text("/Users/voidlight/Downloads/[Codekiller]제10회 기출문제 해설집(v1.0).pdf")
if exam_10_text:
    with open("/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-10th-raw.txt", "w", encoding="utf-8") as f:
        f.write(exam_10_text)
    print("✓ 제10회 텍스트 추출 완료")

# 제11회 추출
print("제11회 처리 중...")
exam_11_text = extract_pdf_text("/Users/voidlight/Downloads/제11회 나무의사 자격시험 1차 시험지.pdf")
if exam_11_text:
    with open("/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-11th-raw.txt", "w", encoding="utf-8") as f:
        f.write(exam_11_text)
    print("✓ 제11회 텍스트 추출 완료")