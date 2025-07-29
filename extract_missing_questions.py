#!/usr/bin/env python3
"""
제10회 나무의사 시험 누락된 52문제 추출 스크립트
"""

import fitz  # PyMuPDF
import re
import json
from pathlib import Path

# 누락된 문제 번호들
MISSING_QUESTIONS = [
    28, 59, 67, 68, 69, 72, 73, 74, 75, 77, 83, 86, 87, 
    89, 90, 91, 92, 93, 94, 95, 96, 99, 100, 104, 107, 113, 
    118, 123, 126, 127, 129, 130, 131, 132, 133, 134, 135, 
    136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 
    147, 148, 149, 150
]

def extract_text_from_pdf(pdf_path):
    """PDF에서 전체 텍스트 추출"""
    doc = fitz.open(pdf_path)
    all_text = []
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text()
        all_text.append({
            'page': page_num + 1,
            'text': text
        })
    
    doc.close()
    return all_text

def find_question_patterns(text):
    """문제 패턴 찾기"""
    patterns = [
        # 기본 패턴: 숫자. 문제
        r'(\d{1,3})\s*\.\s*([^\n]+(?:\n(?!\d{1,3}\s*\.)[^\n]+)*)',
        # 숫자) 패턴
        r'(\d{1,3})\s*\)\s*([^\n]+(?:\n(?!\d{1,3}\s*\))[^\n]+)*)',
        # --- 페이지 X --- 뒤의 패턴
        r'---\s*페이지\s*\d+\s*---\s*(\d{1,3})\s*\.\s*([^\n]+(?:\n(?!\d{1,3}\s*\.)[^\n]+)*)',
    ]
    
    questions = {}
    
    for pattern in patterns:
        matches = re.finditer(pattern, text, re.MULTILINE)
        for match in matches:
            q_num = int(match.group(1))
            if q_num in MISSING_QUESTIONS:
                q_text = match.group(2).strip()
                # 보기 추출
                options = extract_options(text[match.end():match.end()+1000])
                answer = extract_answer(text[match.end():match.end()+1500])
                
                questions[q_num] = {
                    'number': q_num,
                    'question': q_text,
                    'options': options,
                    'answer': answer
                }
    
    return questions

def extract_options(text):
    """보기 추출"""
    options = []
    
    # ① ② ③ ④ ⑤ 패턴
    circle_pattern = r'([①②③④⑤])\s*([^\n①②③④⑤]+)'
    matches = re.finditer(circle_pattern, text)
    
    for match in matches:
        option_num = match.group(1)
        option_text = match.group(2).strip()
        options.append(f"{option_num} {option_text}")
    
    # 1) 2) 3) 4) 5) 패턴
    if not options:
        num_pattern = r'(\d)\s*\)\s*([^\n\d)]+)'
        matches = re.finditer(num_pattern, text)
        
        for match in matches:
            option_num = match.group(1)
            option_text = match.group(2).strip()
            if option_num in ['1', '2', '3', '4', '5']:
                options.append(f"{option_num}) {option_text}")
    
    return options[:5]  # 최대 5개

def extract_answer(text):
    """정답 추출"""
    answer_patterns = [
        r'정답\s*[:：]\s*([①②③④⑤1-5])',
        r'답\s*[:：]\s*([①②③④⑤1-5])',
        r'\*\*정답\s*[:：]\s*([①②③④⑤1-5])\*\*',
    ]
    
    for pattern in answer_patterns:
        match = re.search(pattern, text)
        if match:
            return match.group(1)
    
    return None

def process_pdf_advanced(pdf_path):
    """고급 PDF 처리"""
    doc = fitz.open(pdf_path)
    all_questions = {}
    
    # 페이지별로 처리
    for page_num in range(len(doc)):
        page = doc[page_num]
        
        # 텍스트 추출 방법 1: get_text()
        text = page.get_text()
        questions = find_question_patterns(text)
        all_questions.update(questions)
        
        # 텍스트 추출 방법 2: get_text("blocks")
        blocks = page.get_text("blocks")
        block_text = "\n".join([block[4] for block in blocks])
        questions = find_question_patterns(block_text)
        all_questions.update(questions)
        
        # 텍스트 추출 방법 3: get_text("dict")
        page_dict = page.get_text("dict")
        dict_text = extract_text_from_dict(page_dict)
        questions = find_question_patterns(dict_text)
        all_questions.update(questions)
    
    doc.close()
    return all_questions

def extract_text_from_dict(page_dict):
    """딕셔너리에서 텍스트 추출"""
    text = ""
    for block in page_dict.get("blocks", []):
        if block.get("type") == 0:  # text block
            for line in block.get("lines", []):
                for span in line.get("spans", []):
                    text += span.get("text", "") + " "
                text += "\n"
    return text

def main():
    pdf_path = "/Users/voidlight/Downloads/[Codekiller]제10회 기출문제 해설집(v1.0).pdf"
    
    print(f"PDF 처리 중: {pdf_path}")
    print(f"찾아야 할 문제: {len(MISSING_QUESTIONS)}개")
    print(f"문제 번호: {MISSING_QUESTIONS}")
    
    # PDF 처리
    all_questions = process_pdf_advanced(pdf_path)
    
    print(f"\n추출된 문제: {len(all_questions)}개")
    print(f"추출된 문제 번호: {sorted(all_questions.keys())}")
    
    # 누락된 문제 확인
    still_missing = [q for q in MISSING_QUESTIONS if q not in all_questions]
    print(f"\n여전히 누락된 문제: {len(still_missing)}개")
    print(f"누락된 문제 번호: {still_missing}")
    
    # 결과 저장
    with open('extracted_questions.json', 'w', encoding='utf-8') as f:
        json.dump(all_questions, f, ensure_ascii=False, indent=2)
    
    # 마크다운으로 저장
    with open('missing_questions.md', 'w', encoding='utf-8') as f:
        f.write("# 추출된 누락 문제들\n\n")
        
        for q_num in sorted(all_questions.keys()):
            q = all_questions[q_num]
            f.write(f"## {q_num}. {q['question']}\n\n")
            
            if q['options']:
                for opt in q['options']:
                    f.write(f"{opt}\n")
                f.write("\n")
            
            if q['answer']:
                f.write(f"**정답: {q['answer']}**\n")
            
            f.write("\n---\n\n")
    
    return all_questions

if __name__ == "__main__":
    main()