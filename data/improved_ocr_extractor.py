#!/usr/bin/env python3
"""
개선된 OCR 스크립트 - Tesseract + 후처리
"""

import pytesseract
from PIL import Image, ImageEnhance, ImageFilter
import cv2
import numpy as np

def preprocess_image(image_path):
    """이미지 전처리로 OCR 정확도 향상"""
    # 이미지 로드
    img = cv2.imread(image_path)
    
    # 그레이스케일 변환
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # 노이즈 제거
    denoised = cv2.fastNlMeansDenoising(gray)
    
    # 대비 향상
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    enhanced = clahe.apply(denoised)
    
    # 이진화
    _, binary = cv2.threshold(enhanced, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    
    return binary

def extract_text_with_layout(image_path):
    """레이아웃 보존하며 텍스트 추출"""
    # 전처리
    processed = preprocess_image(image_path)
    
    # Tesseract 설정
    custom_config = r'--oem 3 --psm 6 -l kor+eng'
    
    # OCR 실행
    text = pytesseract.image_to_string(processed, config=custom_config)
    
    # 후처리
    text = post_process_text(text)
    
    return text

def post_process_text(text):
    """OCR 결과 후처리"""
    # 일반적인 OCR 오류 수정
    corrections = {
        '뮤효': '유효',
        '몬도': '온도',
        '0)': '①',
        '®': '②',
        '©': '③',
        '@': '④',
        '®': '⑤'
    }
    
    for wrong, correct in corrections.items():
        text = text.replace(wrong, correct)
        
    return text

def extract_questions_from_text(text):
    """텍스트에서 문제 구조 추출"""
    import re
    
    questions = []
    
    # 문제 패턴
    question_pattern = r'(\d+)\s*[.)]\s*(.+?)(?=\d+\s*[.)]|$)'
    
    matches = re.finditer(question_pattern, text, re.DOTALL)
    
    for match in matches:
        q_num = match.group(1)
        q_text = match.group(2).strip()
        
        # 선택지 추출
        choices = {}
        choice_pattern = r'([①②③④⑤])\s*(.+?)(?=[①②③④⑤]|정답|$)'
        choice_matches = re.finditer(choice_pattern, q_text)
        
        for c_match in choice_matches:
            choice_num = c_match.group(1)
            choice_text = c_match.group(2).strip()
            choices[choice_num] = choice_text
            
        questions.append({
            'number': int(q_num),
            'text': q_text.split('①')[0].strip(),
            'choices': choices
        })
        
    return questions
