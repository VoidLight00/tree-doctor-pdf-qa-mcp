#!/usr/bin/env python3
"""
제6회 나무의사 시험 150문제 완벽 추출 - 페이지별 처리
각 페이지를 개별적으로 처리하여 메모리 효율성 향상
"""

import os
import sys
import re
import json
from pathlib import Path
import logging
from typing import List, Dict, Optional
import subprocess
import cv2
import numpy as np
from pdf2image import convert_from_path
from PIL import Image
import pytesseract
import time

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('exam_6th_page_by_page.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class PageProcessor:
    def __init__(self):
        # 문제 패턴들
        self.question_patterns = [
            re.compile(r'^(\d{1,3})\s*\.\s*(.+)'),
            re.compile(r'^(\d{1,3})\s*\.(.+)'),
            re.compile(r'^(\d{1,3})\.?\s+(.+)'),
            re.compile(r'^문제\s*(\d{1,3})\s*\.\s*(.+)'),
            re.compile(r'^【\s*(\d{1,3})\s*】\s*(.+)'),
            re.compile(r'^\[\s*(\d{1,3})\s*\]\s*(.+)'),
        ]
        
        # 선택지 패턴들
        self.choice_patterns = [
            re.compile(r'^([①②③④⑤])\s*(.+)'),
            re.compile(r'^(\d)\s*[)\.]\s*(.+)'),
            re.compile(r'^[가나다라마]\s*[)\.]\s*(.+)'),
        ]

    def enhance_image(self, image: np.ndarray) -> np.ndarray:
        """이미지 품질 향상"""
        # 그레이스케일 변환
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()
        
        # 노이즈 제거
        denoised = cv2.fastNlDenoising(gray, None, 10, 7, 21)
        
        # 대비 향상
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        enhanced = clahe.apply(denoised)
        
        # 이진화
        _, binary = cv2.threshold(enhanced, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        return binary

    def extract_text_from_image(self, image: np.ndarray) -> str:
        """이미지에서 텍스트 추출"""
        try:
            # 여러 PSM 모드로 시도
            texts = []
            for psm in [6, 3, 11]:  # 6: 균일한 블록, 3: 자동, 11: 희소 텍스트
                text = pytesseract.image_to_string(
                    image, 
                    lang='kor+eng',
                    config=f'--psm {psm} --oem 3'
                )
                if text.strip():
                    texts.append(text)
            
            # 가장 긴 텍스트 선택
            return max(texts, key=len) if texts else ""
        except Exception as e:
            logger.error(f"OCR 오류: {e}")
            return ""

    def process_page_image(self, image: Image.Image, page_num: int) -> List[Dict]:
        """한 페이지 이미지 처리"""
        logger.info(f"페이지 {page_num} 처리 중...")
        
        # PIL Image를 numpy array로 변환
        img_array = np.array(image)
        
        # 원본과 향상된 이미지 모두로 시도
        text_original = self.extract_text_from_image(img_array)
        
        enhanced = self.enhance_image(img_array)
        text_enhanced = self.extract_text_from_image(enhanced)
        
        # 더 긴 텍스트 선택
        text = text_original if len(text_original) > len(text_enhanced) else text_enhanced
        
        # 문제 파싱
        questions = self.parse_questions_from_text(text, page_num)
        
        return questions, text

    def parse_questions_from_text(self, text: str, page_num: int) -> List[Dict]:
        """텍스트에서 문제 추출"""
        questions = []
        lines = text.split('\n')
        
        current_question = None
        current_choices = []
        
        for i, line in enumerate(lines):
            line = line.strip()
            if not line:
                continue
            
            # 문제 번호 찾기
            question_match = None
            for pattern in self.question_patterns:
                match = pattern.match(line)
                if match:
                    question_match = match
                    break
            
            if question_match:
                # 이전 문제 저장
                if current_question:
                    current_question['choices'] = current_choices
                    questions.append(current_question)
                
                # 새 문제 시작
                q_num = int(question_match.group(1))
                q_text = question_match.group(2).strip()
                
                # 다음 줄들도 문제 텍스트에 포함
                j = i + 1
                while j < len(lines) and not any(p.match(lines[j].strip()) for p in self.choice_patterns):
                    if lines[j].strip() and not any(p.match(lines[j].strip()) for p in self.question_patterns):
                        q_text += " " + lines[j].strip()
                    j += 1
                
                current_question = {
                    'number': q_num,
                    'text': q_text,
                    'page': page_num,
                    'choices': []
                }
                current_choices = []
            
            # 선택지 찾기
            elif current_question:
                for pattern in self.choice_patterns:
                    match = pattern.match(line)
                    if match:
                        choice_num = match.group(1)
                        choice_text = match.group(2) if len(match.groups()) > 1 else line[1:].strip()
                        current_choices.append(f"{choice_num} {choice_text}")
                        break

        # 마지막 문제 저장
        if current_question:
            current_question['choices'] = current_choices
            questions.append(current_question)
        
        return questions

def extract_pdf_page_by_page(pdf_path: str, output_dir: Path) -> List[Dict]:
    """PDF를 페이지별로 처리"""
    processor = PageProcessor()
    all_questions = []
    page_texts = []
    
    logger.info(f"PDF 처리 시작: {pdf_path}")
    
    # 페이지별로 변환 및 처리
    try:
        # PDF 정보 가져오기
        from pdf2image.pdf2image import pdfinfo_from_path
        info = pdfinfo_from_path(pdf_path)
        total_pages = info['Pages']
        logger.info(f"총 페이지 수: {total_pages}")
        
        # 페이지별로 처리
        for page_num in range(1, total_pages + 1):
            logger.info(f"페이지 {page_num}/{total_pages} 변환 중...")
            
            # 한 페이지만 변환
            images = convert_from_path(
                pdf_path,
                dpi=300,
                first_page=page_num,
                last_page=page_num,
                fmt='png'
            )
            
            if images:
                questions, text = processor.process_page_image(images[0], page_num)
                all_questions.extend(questions)
                
                # 페이지 텍스트 저장
                page_text_path = output_dir / f"page_{page_num:03d}_text.txt"
                with open(page_text_path, 'w', encoding='utf-8') as f:
                    f.write(text)
                
                logger.info(f"페이지 {page_num}: {len(questions)}개 문제 추출")
                
                # 메모리 해제
                del images
            
            # 진행률 표시
            if page_num % 10 == 0:
                logger.info(f"진행률: {page_num}/{total_pages} ({page_num/total_pages*100:.1f}%)")
    
    except Exception as e:
        logger.error(f"PDF 처리 오류: {e}")
    
    return all_questions

def merge_and_deduplicate_questions(questions: List[Dict]) -> List[Dict]:
    """문제 병합 및 중복 제거"""
    # 문제 번호별로 그룹화
    question_dict = {}
    
    for q in questions:
        q_num = q['number']
        if q_num not in question_dict:
            question_dict[q_num] = q
        else:
            # 더 긴 텍스트를 가진 것 선택
            if len(q['text']) > len(question_dict[q_num]['text']):
                question_dict[q_num] = q
            # 선택지가 더 많은 것 선택
            elif len(q.get('choices', [])) > len(question_dict[q_num].get('choices', [])):
                question_dict[q_num] = q
    
    # 정렬하여 반환
    return sorted(question_dict.values(), key=lambda x: x['number'])

def save_results(questions: List[Dict], output_path: str):
    """결과 저장"""
    logger.info(f"결과 저장 중: {output_path}")
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write("# 제6회 나무의사 자격시험 문제\n\n")
        f.write(f"총 문제 수: {len(questions)}개\n\n")
        
        # 통계 정보
        if questions:
            numbers = [q['number'] for q in questions]
            f.write(f"문제 번호 범위: {min(numbers)} ~ {max(numbers)}\n")
            
            # 누락된 문제 표시
            existing_numbers = set(numbers)
            missing_numbers = set(range(1, 151)) - existing_numbers
            if missing_numbers:
                f.write(f"누락된 문제: {sorted(missing_numbers)}\n")
            
            f.write("\n---\n\n")
        
        for q in questions:
            f.write(f"## {q['number']}. {q['text']}\n\n")
            
            if q.get('choices'):
                for choice in q['choices']:
                    f.write(f"{choice}\n")
            else:
                f.write("(선택지 없음)\n")
            
            f.write(f"\n**페이지**: {q['page']}\n")
            f.write("\n---\n\n")
    
    # JSON 형식으로도 저장
    json_path = output_path.replace('.md', '.json')
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(questions, f, ensure_ascii=False, indent=2)
    
    logger.info(f"MD 파일: {output_path}")
    logger.info(f"JSON 파일: {json_path}")

def main():
    pdf_path = "/Users/voidlight/Downloads/[Codekiller]제6회 기출문제 해설집(v1.0).pdf"
    output_path = "/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-6th-final-150.md"
    output_dir = Path("temp_pages_6th")
    output_dir.mkdir(exist_ok=True)
    
    if not os.path.exists(pdf_path):
        logger.error(f"PDF 파일을 찾을 수 없습니다: {pdf_path}")
        return
    
    # Tesseract 설치 확인
    try:
        subprocess.run(['tesseract', '--version'], capture_output=True, check=True)
    except:
        logger.error("Tesseract가 설치되지 않았습니다.")
        return
    
    # 추출 시작
    start_time = time.time()
    
    # 페이지별로 처리
    all_questions = extract_pdf_page_by_page(pdf_path, output_dir)
    
    # 중복 제거 및 병합
    final_questions = merge_and_deduplicate_questions(all_questions)
    
    # 결과 저장
    save_results(final_questions, output_path)
    
    elapsed_time = time.time() - start_time
    logger.info(f"처리 완료! 소요 시간: {elapsed_time:.2f}초")
    logger.info(f"추출된 문제 수: {len(final_questions)}개")
    
    # 통계 출력
    if final_questions:
        numbers = [q['number'] for q in final_questions]
        logger.info(f"문제 번호 범위: {min(numbers)} ~ {max(numbers)}")
        
        missing_numbers = set(range(1, 151)) - set(numbers)
        if missing_numbers:
            logger.warning(f"누락된 문제 수: {len(missing_numbers)}개")
            logger.warning(f"누락된 문제 번호: {sorted(missing_numbers)}")

if __name__ == "__main__":
    main()