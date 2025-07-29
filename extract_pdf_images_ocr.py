#!/usr/bin/env python3
"""
PDF에서 이미지를 추출하고 OCR을 수행하여 누락된 문제 찾기
"""

import fitz
import os
import subprocess
import re
from pathlib import Path
import json

# 누락된 문제 번호들
MISSING_QUESTIONS = [
    28, 59, 67, 68, 69, 72, 73, 74, 75, 77, 83, 86, 87, 
    89, 90, 91, 92, 93, 94, 95, 96, 99, 100, 104, 107, 113, 
    118, 123, 126, 127, 129, 130, 131, 132, 133, 134, 135, 
    136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 
    147, 148, 149, 150
]

def extract_images_from_pdf(pdf_path, output_dir):
    """PDF에서 이미지 추출"""
    doc = fitz.open(pdf_path)
    os.makedirs(output_dir, exist_ok=True)
    
    image_files = []
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        
        # 페이지를 이미지로 변환 (고해상도)
        mat = fitz.Matrix(3, 3)  # 3x 확대
        pix = page.get_pixmap(matrix=mat)
        
        image_path = os.path.join(output_dir, f"page_{page_num + 1:03d}.png")
        pix.save(image_path)
        image_files.append(image_path)
        
        print(f"페이지 {page_num + 1} 이미지 저장: {image_path}")
    
    doc.close()
    return image_files

def ocr_image_tesseract(image_path):
    """Tesseract를 사용한 OCR"""
    try:
        # 한국어 OCR
        result = subprocess.run(
            ['tesseract', image_path, '-', '-l', 'kor', '--psm', '6'],
            capture_output=True,
            text=True
        )
        return result.stdout
    except Exception as e:
        print(f"Tesseract OCR 실패: {e}")
        return ""

def find_questions_in_text(text, source_info=""):
    """텍스트에서 문제 찾기"""
    questions = {}
    
    # 텍스트 정리
    lines = text.split('\n')
    
    # 다양한 문제 패턴
    patterns = [
        # 28. 문제
        (r'^(\d{1,3})\s*[\.。]\s*(.+)', "점 패턴"),
        # 28) 문제
        (r'^(\d{1,3})\s*[)）]\s*(.+)', "괄호 패턴"),
        # 【28】 문제
        (r'[【\[](\d{1,3})[】\]]\s*(.+)', "대괄호 패턴"),
        # 문제 28.
        (r'문제\s*(\d{1,3})\s*[\.。]\s*(.+)', "문제 패턴"),
        # Q28.
        (r'Q\s*(\d{1,3})\s*[\.。]\s*(.+)', "Q 패턴"),
    ]
    
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        
        for pattern, pattern_name in patterns:
            match = re.match(pattern, line)
            if match:
                try:
                    q_num = int(match.group(1))
                    
                    # 누락된 문제 번호인지 확인
                    if q_num in MISSING_QUESTIONS:
                        q_text = match.group(2).strip()
                        
                        # 문제 내용 계속 읽기
                        j = i + 1
                        while j < len(lines) and j < i + 10:  # 최대 10줄
                            next_line = lines[j].strip()
                            
                            # 다음 문제 시작이면 중단
                            if any(re.match(p[0], next_line) for p in patterns):
                                break
                            
                            # 보기 시작이면 중단
                            if re.match(r'^[①②③④⑤1-5][)）\.]', next_line):
                                break
                            
                            if next_line:
                                q_text += " " + next_line
                            
                            j += 1
                        
                        # 보기 찾기
                        options = []
                        k = j
                        while k < len(lines) and k < j + 10:
                            opt_line = lines[k].strip()
                            
                            # 보기 패턴
                            opt_match = re.match(r'^([①②③④⑤1-5])[)）\.]\s*(.+)', opt_line)
                            if opt_match:
                                options.append(f"{opt_match.group(1)} {opt_match.group(2)}")
                            
                            k += 1
                        
                        # 정답 찾기
                        answer = None
                        for m in range(k, min(k + 5, len(lines))):
                            ans_line = lines[m]
                            ans_match = re.search(r'정답\s*[:：]?\s*([①②③④⑤1-5])', ans_line)
                            if ans_match:
                                answer = ans_match.group(1)
                                break
                        
                        questions[q_num] = {
                            'number': q_num,
                            'question': q_text,
                            'options': options,
                            'answer': answer,
                            'source': source_info,
                            'pattern': pattern_name
                        }
                        
                        print(f"문제 {q_num} 발견! ({pattern_name})")
                        
                except Exception as e:
                    print(f"파싱 오류: {e}")
        
        i += 1
    
    return questions

def main():
    pdf_path = "/Users/voidlight/Downloads/[Codekiller]제10회 기출문제 해설집(v1.0).pdf"
    output_dir = "pdf_images"
    
    print("1. PDF에서 이미지 추출 중...")
    image_files = extract_images_from_pdf(pdf_path, output_dir)
    
    print(f"\n2. {len(image_files)}개 이미지에서 OCR 수행 중...")
    
    all_questions = {}
    
    # 각 이미지에 대해 OCR 수행
    for idx, image_path in enumerate(image_files):
        print(f"\n페이지 {idx + 1} OCR 중...")
        
        # Tesseract OCR
        text = ocr_image_tesseract(image_path)
        
        if text:
            # 문제 찾기
            questions = find_questions_in_text(text, f"페이지 {idx + 1}")
            all_questions.update(questions)
    
    # 결과 정리
    print(f"\n\n=== 결과 ===")
    print(f"총 발견된 누락 문제: {len(all_questions)}개")
    print(f"발견된 문제 번호: {sorted(all_questions.keys())}")
    
    still_missing = [q for q in MISSING_QUESTIONS if q not in all_questions]
    print(f"\n여전히 누락된 문제: {len(still_missing)}개")
    print(f"누락된 문제 번호: {still_missing}")
    
    # JSON으로 저장
    with open('ocr_questions.json', 'w', encoding='utf-8') as f:
        json.dump(all_questions, f, ensure_ascii=False, indent=2)
    
    # 마크다운으로 저장
    with open('ocr_missing_questions.md', 'w', encoding='utf-8') as f:
        f.write("# OCR로 추출한 누락 문제들\n\n")
        
        for q_num in sorted(all_questions.keys()):
            q = all_questions[q_num]
            f.write(f"## {q_num}. {q['question']}\n\n")
            
            if q['options']:
                for opt in q['options']:
                    f.write(f"{opt}\n")
                f.write("\n")
            
            if q['answer']:
                f.write(f"**정답: {q['answer']}**\n")
            
            f.write(f"\n출처: {q['source']}, 패턴: {q['pattern']}\n")
            f.write("\n---\n\n")
    
    return all_questions

if __name__ == "__main__":
    # Tesseract 설치 확인
    try:
        subprocess.run(['tesseract', '--version'], capture_output=True)
        print("Tesseract 설치 확인됨")
    except:
        print("Tesseract가 설치되지 않았습니다. 설치가 필요합니다.")
        print("brew install tesseract")
        print("brew install tesseract-lang")
        exit(1)
    
    main()