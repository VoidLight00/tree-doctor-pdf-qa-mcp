#!/usr/bin/env python3
"""
특정 페이지를 집중적으로 OCR 처리하여 누락된 문제 찾기
"""

import fitz
import subprocess
import re
import json
import os
from PIL import Image
import numpy as np

# 여전히 누락된 문제들
STILL_MISSING = [59, 69, 83, 89, 92, 99, 126, 127, 129, 130, 131, 132, 133, 134, 
                 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150]

def preprocess_image(image_path):
    """이미지 전처리로 OCR 정확도 향상"""
    from PIL import ImageEnhance, ImageFilter
    
    img = Image.open(image_path)
    
    # 그레이스케일 변환
    img = img.convert('L')
    
    # 대비 향상
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(2.0)
    
    # 선명도 향상
    enhancer = ImageEnhance.Sharpness(img)
    img = enhancer.enhance(1.5)
    
    # 노이즈 제거
    img = img.filter(ImageFilter.MedianFilter(size=3))
    
    # 저장
    processed_path = image_path.replace('.png', '_processed.png')
    img.save(processed_path)
    
    return processed_path

def ocr_with_multiple_engines(image_path):
    """여러 OCR 설정으로 시도"""
    results = []
    
    # 이미지 전처리
    processed_path = preprocess_image(image_path)
    
    # 다양한 Tesseract PSM 모드
    psm_modes = [
        3,   # 자동 페이지 분할
        4,   # 단일 열 텍스트
        6,   # 균일한 블록의 단일 텍스트
        11,  # 희소 텍스트
    ]
    
    for psm in psm_modes:
        try:
            # 원본 이미지
            result = subprocess.run(
                ['tesseract', image_path, '-', '-l', 'kor', '--psm', str(psm)],
                capture_output=True,
                text=True
            )
            if result.stdout:
                results.append(f"PSM {psm} (원본):\n{result.stdout}")
            
            # 전처리된 이미지
            result = subprocess.run(
                ['tesseract', processed_path, '-', '-l', 'kor', '--psm', str(psm)],
                capture_output=True,
                text=True
            )
            if result.stdout:
                results.append(f"PSM {psm} (전처리):\n{result.stdout}")
                
        except Exception as e:
            print(f"OCR 오류 (PSM {psm}): {e}")
    
    # 임시 파일 삭제
    if os.path.exists(processed_path):
        os.remove(processed_path)
    
    return "\n\n".join(results)

def extract_questions_advanced(text, missing_nums):
    """고급 문제 추출"""
    questions = {}
    
    # 모든 텍스트에서 숫자 패턴 찾기
    for num in missing_nums:
        # 다양한 패턴으로 문제 찾기
        patterns = [
            # 기본 패턴
            rf'(?:^|\n)\s*{num}\s*[\.。]\s*([^\n]+)',
            rf'(?:^|\n)\s*{num}\s*[)）]\s*([^\n]+)',
            # 페이지 구분 후
            rf'---[^\n]*---\s*{num}\s*[\.。]\s*([^\n]+)',
            # 특수 패턴
            rf'[【\[]\s*{num}\s*[】\]]\s*([^\n]+)',
            rf'문제\s*{num}\s*[\.。)）]?\s*([^\n]+)',
            rf'Q\s*{num}\s*[\.。)）]?\s*([^\n]+)',
            # 띄어쓰기 변형
            rf'{num}\s+[\.。]\s*([^\n]+)',
            rf'{num}\s+[)）]\s*([^\n]+)',
        ]
        
        for pattern in patterns:
            matches = re.finditer(pattern, text, re.MULTILINE | re.IGNORECASE)
            for match in matches:
                q_text = match.group(1).strip()
                
                # 문제 내용 확장
                start_pos = match.end()
                end_pos = start_pos + 1000  # 다음 1000자 내에서 찾기
                
                context = text[start_pos:end_pos]
                
                # 보기 찾기
                options = []
                option_patterns = [
                    r'([①②③④⑤])\s*([^\n①②③④⑤]+)',
                    r'([1-5])\s*[)）\.]\s*([^\n\d)）\.]+)',
                ]
                
                for opt_pattern in option_patterns:
                    opt_matches = re.finditer(opt_pattern, context)
                    for opt_match in opt_matches:
                        options.append(f"{opt_match.group(1)} {opt_match.group(2).strip()}")
                
                # 정답 찾기
                answer = None
                answer_patterns = [
                    r'정답\s*[:：]?\s*([①②③④⑤1-5])',
                    r'답\s*[:：]?\s*([①②③④⑤1-5])',
                    r'\[정답\]\s*([①②③④⑤1-5])',
                ]
                
                for ans_pattern in answer_patterns:
                    ans_match = re.search(ans_pattern, context)
                    if ans_match:
                        answer = ans_match.group(1)
                        break
                
                questions[num] = {
                    'number': num,
                    'question': q_text,
                    'options': options[:5],
                    'answer': answer
                }
                
                print(f"문제 {num} 발견!")
                break  # 하나만 찾으면 다음 번호로
    
    return questions

def process_last_pages():
    """마지막 페이지들 집중 처리 (129-150번 문제)"""
    pdf_path = "/Users/voidlight/Downloads/[Codekiller]제10회 기출문제 해설집(v1.0).pdf"
    doc = fitz.open(pdf_path)
    
    # 마지막 20페이지 집중 처리
    start_page = max(0, len(doc) - 25)
    
    all_questions = {}
    
    for page_num in range(start_page, len(doc)):
        page = doc[page_num]
        
        print(f"\n페이지 {page_num + 1}/{len(doc)} 처리 중...")
        
        # 고해상도로 이미지 추출
        mat = fitz.Matrix(4, 4)  # 4x 확대
        pix = page.get_pixmap(matrix=mat)
        
        image_path = f"temp_page_{page_num + 1}.png"
        pix.save(image_path)
        
        # 다중 OCR 엔진 사용
        text = ocr_with_multiple_engines(image_path)
        
        # 문제 추출
        questions = extract_questions_advanced(text, STILL_MISSING)
        all_questions.update(questions)
        
        # 임시 파일 삭제
        if os.path.exists(image_path):
            os.remove(image_path)
    
    doc.close()
    
    return all_questions

def main():
    print("마지막 페이지들 집중 OCR 처리...")
    print(f"찾아야 할 문제: {len(STILL_MISSING)}개")
    print(f"문제 번호: {STILL_MISSING}")
    
    # PIL 설치 확인
    try:
        from PIL import Image
    except ImportError:
        print("PIL 설치 중...")
        subprocess.run(['pip3', 'install', 'pillow'], check=True)
        from PIL import Image
    
    # 마지막 페이지들 처리
    questions = process_last_pages()
    
    print(f"\n\n=== 결과 ===")
    print(f"추가로 발견된 문제: {len(questions)}개")
    print(f"발견된 문제 번호: {sorted(questions.keys())}")
    
    # 기존 문제들 로드
    existing_questions = {}
    if os.path.exists('ocr_questions.json'):
        with open('ocr_questions.json', 'r', encoding='utf-8') as f:
            existing_questions = json.load(f)
    
    # 병합
    existing_questions.update(questions)
    
    # 저장
    with open('ocr_questions_updated.json', 'w', encoding='utf-8') as f:
        json.dump(existing_questions, f, ensure_ascii=False, indent=2)
    
    # 마크다운으로 추가 저장
    with open('additional_missing_questions.md', 'w', encoding='utf-8') as f:
        f.write("# 추가로 발견된 누락 문제들\n\n")
        
        for q_num in sorted(questions.keys()):
            q = questions[q_num]
            f.write(f"## {q_num}. {q['question']}\n\n")
            
            if q['options']:
                for opt in q['options']:
                    f.write(f"{opt}\n")
                f.write("\n")
            
            if q['answer']:
                f.write(f"**정답: {q['answer']}**\n")
            
            f.write("\n---\n\n")
    
    # 여전히 누락된 문제
    all_found = set(existing_questions.keys())
    still_missing = [q for q in STILL_MISSING if q not in all_found]
    
    print(f"\n총 발견된 문제: {len(all_found)}개")
    print(f"여전히 누락된 문제: {len(still_missing)}개")
    print(f"누락된 문제 번호: {still_missing}")

if __name__ == "__main__":
    main()