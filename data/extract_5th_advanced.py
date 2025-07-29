#!/usr/bin/env python3
import os
import sys
import subprocess
import json
import re
from datetime import datetime

# 필요한 라이브러리 설치
libraries = [
    'pdfplumber',
    'pypdf2',
    'pytesseract',
    'pdf2image',
    'pillow'
]

for lib in libraries:
    try:
        __import__(lib.replace('-', '_').lower())
    except ImportError:
        print(f"{lib} 설치 중...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", lib])

import pdfplumber
import PyPDF2
import pytesseract
from pdf2image import convert_from_path
from PIL import Image

def extract_with_pdfplumber(pdf_path):
    """pdfplumber로 텍스트 추출"""
    try:
        print("1단계: pdfplumber로 추출 중...")
        text = ""
        with pdfplumber.open(pdf_path) as pdf:
            for i, page in enumerate(pdf.pages):
                print(f"  - 페이지 {i+1}/{len(pdf.pages)} 처리 중...")
                page_text = page.extract_text()
                if page_text:
                    text += f"\n\n--- 페이지 {i+1} ---\n\n{page_text}"
        return text
    except Exception as e:
        print(f"pdfplumber 추출 실패: {str(e)}")
        return None

def extract_with_ocr(pdf_path):
    """OCR을 사용한 추출 (이미지 변환 후)"""
    try:
        print("2단계: OCR 추출 시도 중...")
        # PDF를 이미지로 변환
        print("  - PDF를 이미지로 변환 중...")
        images = convert_from_path(pdf_path, dpi=300)
        
        text = ""
        for i, image in enumerate(images):
            print(f"  - 페이지 {i+1}/{len(images)} OCR 처리 중...")
            # 한국어 OCR 설정
            page_text = pytesseract.image_to_string(image, lang='kor')
            text += f"\n\n--- 페이지 {i+1} (OCR) ---\n\n{page_text}"
        
        return text
    except Exception as e:
        print(f"OCR 추출 실패: {str(e)}")
        return None

def parse_questions_advanced(text):
    """향상된 문제 파싱"""
    questions = []
    
    # 다양한 문제 패턴
    patterns = [
        # 문제 번호와 내용이 같은 줄에 있는 경우
        r'(\d+)\.\s*([^①②③④\n]+)\s*\n\s*①',
        # 문제 번호와 내용이 다른 줄에 있는 경우
        r'(\d+)\.\s*\n\s*([^①②③④\n]+)\s*\n\s*①',
        # '문제' 라는 단어가 포함된 경우
        r'문제\s*(\d+)[\.번]?\s*([^①②③④\n]+)\s*\n\s*①',
    ]
    
    # 전체 텍스트를 문제 단위로 분할
    question_blocks = re.split(r'\n\s*(?=\d+\.)', text)
    
    for block in question_blocks:
        # 문제 번호 찾기
        num_match = re.match(r'^(\d+)\.', block)
        if not num_match:
            continue
            
        q_num = int(num_match.group(1))
        
        # 문제 내용과 선택지 추출
        lines = block.strip().split('\n')
        
        # 문제 내용 찾기
        q_text = ""
        choice_start = -1
        
        for i, line in enumerate(lines):
            if '①' in line:
                choice_start = i
                q_text = '\n'.join(lines[1:i]).strip()
                break
        
        if choice_start == -1 or not q_text:
            continue
        
        # 선택지 추출
        choices = {}
        choice_nums = ['①', '②', '③', '④']
        
        # 선택지가 있는 부분의 텍스트
        choice_text = '\n'.join(lines[choice_start:])
        
        for j, num in enumerate(choice_nums):
            # 현재 선택지 시작 위치
            start_idx = choice_text.find(num)
            if start_idx == -1:
                continue
                
            # 다음 선택지 시작 위치 (없으면 끝까지)
            if j < len(choice_nums) - 1:
                end_idx = choice_text.find(choice_nums[j+1])
                if end_idx == -1:
                    end_idx = len(choice_text)
            else:
                end_idx = len(choice_text)
            
            # 선택지 텍스트 추출
            choice_content = choice_text[start_idx + len(num):end_idx].strip()
            # 정답 표시 제거
            choice_content = re.sub(r'\s*\*+\s*$', '', choice_content)
            choices[num] = choice_content
        
        if len(choices) >= 4:
            question = {
                'number': q_num,
                'question': q_text,
                'choices': choices
            }
            
            # 정답 찾기 (다양한 패턴)
            answer_patterns = [
                rf'{q_num}\s*[번\.]?\s*[:\-]?\s*([①②③④])',
                rf'정답\s*[:\-]?\s*{q_num}\s*[번\.]?\s*[:\-]?\s*([①②③④])',
                rf'{q_num}\s*[번\.]?\s*정답\s*[:\-]?\s*([①②③④])',
            ]
            
            for pattern in answer_patterns:
                answer_match = re.search(pattern, text)
                if answer_match:
                    question['answer'] = answer_match.group(1)
                    break
            
            questions.append(question)
    
    # 중복 제거 및 정렬
    unique_questions = {}
    for q in questions:
        unique_questions[q['number']] = q
    
    return [unique_questions[i] for i in sorted(unique_questions.keys())]

def save_markdown(questions, output_path):
    """마크다운 형식으로 저장"""
    markdown = "# 제5회 나무의사 기출문제\n\n"
    markdown += f"총 {len(questions)}문제\n"
    markdown += f"추출 일시: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
    markdown += "---\n\n"
    
    for q in questions:
        markdown += f"## {q['number']}. {q['question']}\n\n"
        
        for choice_num, choice_text in q['choices'].items():
            markdown += f"{choice_num} {choice_text}\n"
        
        if 'answer' in q:
            markdown += f"\n**정답: {q['answer']}**\n"
        
        markdown += "\n---\n\n"
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(markdown)
    
    return markdown

def main():
    pdf_path = '/Users/voidlight/Downloads/[Codekiller]제5회 기출문제 해설집(v1.0).pdf'
    output_path = '/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-5th-perfect.md'
    
    print('🌳 제5회 나무의사 기출문제 고급 추출 시작\n')
    
    # 1. pdfplumber로 추출
    text = extract_with_pdfplumber(pdf_path)
    
    # 2. 텍스트가 부족하면 OCR 시도
    if not text or len(text) < 1000:
        print("\n텍스트가 부족합니다. OCR 추출을 시도합니다...")
        ocr_text = extract_with_ocr(pdf_path)
        if ocr_text:
            text = (text or "") + "\n\n" + ocr_text
    
    if not text:
        print("❌ PDF 추출 실패")
        return
    
    # 3. 문제 파싱
    print("\n3단계: 문제 파싱 중...")
    questions = parse_questions_advanced(text)
    
    # 4. 결과 검증
    print(f"\n📊 추출 결과:")
    print(f"- 총 {len(questions)}문제 추출됨")
    
    if len(questions) > 0:
        print(f"- 첫 번째 문제: {questions[0]['number']}번")
        print(f"- 마지막 문제: {questions[-1]['number']}번")
        
        # 정답 포함 여부
        with_answer = sum(1 for q in questions if 'answer' in q)
        print(f"- 정답 포함: {with_answer}/{len(questions)}")
    
    # 5. 저장
    save_markdown(questions, output_path)
    
    # 디버깅용 원본 텍스트 저장
    debug_path = output_path.replace('.md', '-raw.txt')
    with open(debug_path, 'w', encoding='utf-8') as f:
        f.write(text)
    
    print(f"\n✅ 완료!")
    print(f"- 추출된 파일: {output_path}")
    print(f"- 원본 텍스트: {debug_path}")
    
    # 누락된 문제 확인
    if len(questions) < 150:
        missing = []
        extracted_nums = [q['number'] for q in questions]
        for i in range(1, 151):
            if i not in extracted_nums:
                missing.append(i)
        
        if missing:
            print(f"\n⚠️ 누락된 문제 번호: {missing[:20]}{'...' if len(missing) > 20 else ''}")

if __name__ == '__main__':
    main()