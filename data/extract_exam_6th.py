#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
나무의사 제6회 기출문제 PDF 추출 스크립트
150문제 완벽 추출을 위한 멀티 라이브러리 접근
"""

import fitz  # PyMuPDF
import pdfplumber
import re
import sys
from pathlib import Path

def extract_with_pymupdf(pdf_path):
    """PyMuPDF로 텍스트 추출"""
    text = ""
    try:
        doc = fitz.open(pdf_path)
        for page_num, page in enumerate(doc, 1):
            page_text = page.get_text()
            text += f"\n\n--- 페이지 {page_num} ---\n\n{page_text}"
        doc.close()
        return text
    except Exception as e:
        print(f"PyMuPDF 추출 오류: {e}")
        return ""

def extract_with_pdfplumber(pdf_path):
    """pdfplumber로 텍스트 추출"""
    text = ""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page_num, page in enumerate(pdf.pages, 1):
                page_text = page.extract_text() or ""
                text += f"\n\n--- 페이지 {page_num} ---\n\n{page_text}"
        return text
    except Exception as e:
        print(f"pdfplumber 추출 오류: {e}")
        return ""

def process_question_text(text):
    """추출된 텍스트를 문제별로 정리"""
    # 문제 패턴 찾기 (여러 가지 패턴 시도)
    patterns = [
        r'(\d{1,3})\s*[\.]\s*(.*?)(?=\d{1,3}\s*[\.]\s*|$)',  # 1. 형식
        r'(\d{1,3})\s*\)\s*(.*?)(?=\d{1,3}\s*\)|$)',         # 1) 형식
        r'문제\s*(\d{1,3})\s*(.*?)(?=문제\s*\d{1,3}|$)',     # 문제 1 형식
        r'(\d{1,3})\s*번\s*(.*?)(?=\d{1,3}\s*번|$)',         # 1번 형식
    ]
    
    questions = []
    
    for pattern in patterns:
        matches = re.findall(pattern, text, re.DOTALL)
        if len(matches) > 100:  # 100개 이상 찾으면 유효한 패턴으로 간주
            for num, content in matches:
                try:
                    q_num = int(num)
                    if 1 <= q_num <= 150:
                        # 선택지 정리
                        content = clean_question_content(content)
                        questions.append((q_num, content))
                except:
                    continue
            break
    
    return sorted(questions, key=lambda x: x[0])

def clean_question_content(content):
    """문제 내용 정리"""
    # 불필요한 공백 제거
    content = re.sub(r'\s+', ' ', content).strip()
    
    # 선택지 정리
    content = re.sub(r'①', '\n① ', content)
    content = re.sub(r'②', '\n② ', content)
    content = re.sub(r'③', '\n③ ', content)
    content = re.sub(r'④', '\n④ ', content)
    
    # 정답 표시 정리
    content = re.sub(r'정답\s*[:：]\s*', '\n\n**정답: ', content)
    content = re.sub(r'해설\s*[:：]\s*', '\n\n**해설:**\n', content)
    
    return content

def extract_answers_and_explanations(text):
    """정답과 해설 추출"""
    answers = {}
    
    # 정답 패턴
    answer_patterns = [
        r'(\d{1,3})\s*[\.번]\s*정답\s*[:：]?\s*([①②③④])',
        r'문제\s*(\d{1,3})\s*정답\s*[:：]?\s*([①②③④])',
        r'(\d{1,3})\s*[\.]\s*[^\n]*?\n\s*정답\s*[:：]?\s*([①②③④])'
    ]
    
    for pattern in answer_patterns:
        matches = re.findall(pattern, text)
        for num, answer in matches:
            try:
                q_num = int(num)
                if 1 <= q_num <= 150:
                    answers[q_num] = answer
            except:
                continue
    
    return answers

def main():
    # PDF 경로
    pdf_path = "/Users/voidlight/Downloads/[Codekiller]제6회 기출문제 해설집(v1.0).pdf"
    output_path = "/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-6th-perfect.md"
    
    print("PDF 추출 시작...")
    
    # 1. PyMuPDF로 추출
    print("PyMuPDF로 추출 중...")
    text_pymupdf = extract_with_pymupdf(pdf_path)
    
    # 2. pdfplumber로 추출
    print("pdfplumber로 추출 중...")
    text_pdfplumber = extract_with_pdfplumber(pdf_path)
    
    # 3. 더 긴 텍스트 선택 (더 완전한 추출)
    if len(text_pymupdf) > len(text_pdfplumber):
        print("PyMuPDF 결과 사용")
        full_text = text_pymupdf
    else:
        print("pdfplumber 결과 사용")
        full_text = text_pdfplumber
    
    # 4. 문제 처리
    print("문제 추출 중...")
    questions = process_question_text(full_text)
    print(f"추출된 문제 수: {len(questions)}")
    
    # 5. 정답 추출
    print("정답 추출 중...")
    answers = extract_answers_and_explanations(full_text)
    print(f"추출된 정답 수: {len(answers)}")
    
    # 6. 마크다운 생성
    print("마크다운 생성 중...")
    md_content = "# 나무의사 제6회 기출문제 (150문제)\n\n"
    md_content += "> 이 문서는 나무의사 제6회 기출문제 해설집에서 추출한 것입니다.\n\n"
    md_content += "---\n\n"
    
    missing_questions = []
    
    for i in range(1, 151):
        found = False
        for q_num, content in questions:
            if q_num == i:
                md_content += f"## 문제 {i}\n\n"
                md_content += content + "\n"
                
                # 정답 추가
                if i in answers:
                    if "**정답:" not in content:
                        md_content += f"\n**정답: {answers[i]}**\n"
                
                md_content += "\n---\n\n"
                found = True
                break
        
        if not found:
            missing_questions.append(i)
            md_content += f"## 문제 {i}\n\n"
            md_content += "*(문제 내용 누락 - 수동 확인 필요)*\n\n"
            md_content += "---\n\n"
    
    # 7. 파일 저장
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(md_content)
    
    print(f"\n추출 완료!")
    print(f"출력 파일: {output_path}")
    print(f"총 문제 수: 150")
    print(f"성공적으로 추출된 문제: {150 - len(missing_questions)}")
    if missing_questions:
        print(f"누락된 문제 번호: {missing_questions}")
    
    # 8. 추가 정보 파일 생성
    info_path = output_path.replace('.md', '_info.txt')
    with open(info_path, 'w', encoding='utf-8') as f:
        f.write("나무의사 제6회 기출문제 추출 정보\n")
        f.write("=" * 50 + "\n")
        f.write(f"총 문제 수: 150\n")
        f.write(f"추출 성공: {150 - len(missing_questions)}\n")
        f.write(f"추출 실패: {len(missing_questions)}\n")
        if missing_questions:
            f.write(f"누락 문제: {missing_questions}\n")
        f.write("\n원본 텍스트 길이:\n")
        f.write(f"- PyMuPDF: {len(text_pymupdf)} 문자\n")
        f.write(f"- pdfplumber: {len(text_pdfplumber)} 문자\n")

if __name__ == "__main__":
    main()