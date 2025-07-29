#!/usr/bin/env python3
"""
제6회 나무의사 시험 150문제 완벽 추출 스크립트 - Tesseract 전용
이미지 기반 PDF에서 모든 문제를 추출
"""

import os
import sys
import re
import json
from pathlib import Path
import logging
from typing import List, Dict, Optional, Tuple
import subprocess
import cv2
import numpy as np
from pdf2image import convert_from_path
from PIL import Image, ImageEnhance, ImageFilter
import pytesseract
from concurrent.futures import ThreadPoolExecutor, as_completed
import time

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('exam_6th_extraction.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class ExamExtractor:
    def __init__(self, pdf_path: str):
        self.pdf_path = pdf_path
        self.output_dir = Path("temp_images_6th")
        self.output_dir.mkdir(exist_ok=True)
        
        # 문제 패턴들
        self.question_patterns = [
            re.compile(r'^(\d{1,3})\s*\.\s*(.+)'),  # 1. 문제
            re.compile(r'^(\d{1,3})\s*\.(.+)'),     # 1.문제
            re.compile(r'^(\d{1,3})\.?\s+(.+)'),    # 1 문제 또는 1. 문제
            re.compile(r'^문제\s*(\d{1,3})\s*\.\s*(.+)'),  # 문제 1. 
            re.compile(r'^【\s*(\d{1,3})\s*】\s*(.+)'),     # 【1】 문제
            re.compile(r'^\[\s*(\d{1,3})\s*\]\s*(.+)'),     # [1] 문제
            re.compile(r'^Q(\d{1,3})\s*\.\s*(.+)'),         # Q1. 문제
            re.compile(r'^문\s*(\d{1,3})\s*\.\s*(.+)'),     # 문1. 문제
        ]
        
        # 선택지 패턴들
        self.choice_patterns = [
            re.compile(r'^([①②③④⑤])\s*(.+)'),
            re.compile(r'^(\d)\s*[)\.]\s*(.+)'),
            re.compile(r'^[가나다라마]\s*[)\.]\s*(.+)'),
            re.compile(r'^[ㄱㄴㄷㄹㅁ]\s*[)\.]\s*(.+)'),
        ]
        
        self.questions = []
        self.current_question = None

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
        
        # 모폴로지 연산으로 텍스트 개선
        kernel = np.ones((1,1), np.uint8)
        morphed = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)
        
        return morphed

    def extract_text_tesseract(self, image: np.ndarray, psm_mode: int = 6) -> str:
        """Tesseract OCR로 텍스트 추출"""
        try:
            # 한국어 설정으로 OCR
            text = pytesseract.image_to_string(
                image, 
                lang='kor+eng',
                config=f'--psm {psm_mode} --oem 3'
            )
            return text
        except Exception as e:
            logger.error(f"Tesseract OCR 오류: {e}")
            return ""

    def extract_text_with_multiple_configs(self, image: np.ndarray) -> str:
        """여러 Tesseract 설정으로 시도"""
        texts = []
        
        # 여러 PSM 모드 시도
        psm_modes = [6, 3, 11, 12]  # 6: 균일한 블록, 3: 자동, 11: 희소 텍스트, 12: 희소 텍스트 + OSD
        
        for psm in psm_modes:
            text = self.extract_text_tesseract(image, psm)
            if text.strip():
                texts.append(text)
        
        # 가장 긴 텍스트 반환
        return max(texts, key=len) if texts else ""

    def process_page(self, page_num: int, image: Image.Image) -> List[Dict]:
        """한 페이지 처리"""
        logger.info(f"페이지 {page_num} 처리 중...")
        
        # PIL Image를 numpy array로 변환
        img_array = np.array(image)
        
        # 원본 이미지로 시도
        text_original = self.extract_text_with_multiple_configs(img_array)
        
        # 향상된 이미지로 시도
        enhanced = self.enhance_image(img_array)
        text_enhanced = self.extract_text_with_multiple_configs(enhanced)
        
        # 더 긴 텍스트 선택
        text = text_original if len(text_original) > len(text_enhanced) else text_enhanced
        
        # 디버깅용 텍스트 저장
        debug_path = self.output_dir / f"page_{page_num}_text.txt"
        with open(debug_path, 'w', encoding='utf-8') as f:
            f.write("=== ORIGINAL TEXT ===\n")
            f.write(text_original)
            f.write("\n\n=== ENHANCED TEXT ===\n")
            f.write(text_enhanced)
            f.write("\n\n=== SELECTED TEXT ===\n")
            f.write(text)
        
        # 이미지도 저장 (디버깅용)
        image.save(self.output_dir / f"page_{page_num}.png")
        cv2.imwrite(str(self.output_dir / f"page_{page_num}_enhanced.png"), enhanced)
        
        # 문제 파싱
        questions = self.parse_questions(text, page_num)
        
        return questions

    def parse_questions(self, text: str, page_num: int) -> List[Dict]:
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
                if current_question and current_choices:
                    current_question['choices'] = current_choices
                    questions.append(current_question)
                
                # 새 문제 시작
                q_num = int(question_match.group(1))
                q_text = question_match.group(2).strip()
                
                # 다음 줄들도 문제 텍스트에 포함시키기
                j = i + 1
                while j < len(lines) and not any(p.match(lines[j].strip()) for p in self.choice_patterns):
                    if lines[j].strip() and not any(p.match(lines[j].strip()) for p in self.question_patterns):
                        q_text += " " + lines[j].strip()
                    j += 1
                
                current_question = {
                    'number': q_num,
                    'text': q_text,
                    'page': page_num
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
        if current_question and current_choices:
            current_question['choices'] = current_choices
            questions.append(current_question)
        
        return questions

    def convert_pdf_to_images(self) -> List[Image.Image]:
        """PDF를 이미지로 변환"""
        logger.info(f"PDF를 이미지로 변환 중: {self.pdf_path}")
        
        try:
            # 고해상도로 변환
            images = convert_from_path(
                self.pdf_path,
                dpi=300,
                fmt='png',
                thread_count=4
            )
            logger.info(f"총 {len(images)} 페이지 변환 완료")
            return images
        except Exception as e:
            logger.error(f"PDF 변환 오류: {e}")
            return []

    def extract_all_questions(self):
        """모든 문제 추출"""
        # PDF를 이미지로 변환
        images = self.convert_pdf_to_images()
        if not images:
            logger.error("PDF 변환 실패")
            return
        
        # 순차 처리 (병렬 처리보다 안정적)
        all_questions = []
        for i, img in enumerate(images):
            try:
                questions = self.process_page(i+1, img)
                all_questions.extend(questions)
                logger.info(f"페이지 {i+1}: {len(questions)}개 문제 추출")
            except Exception as e:
                logger.error(f"페이지 {i+1} 처리 오류: {e}")
        
        # 문제 번호로 정렬
        all_questions.sort(key=lambda x: x['number'])
        
        # 중복 제거
        unique_questions = []
        seen_numbers = set()
        for q in all_questions:
            if q['number'] not in seen_numbers:
                unique_questions.append(q)
                seen_numbers.add(q['number'])
        
        self.questions = unique_questions
        logger.info(f"총 {len(self.questions)}개 문제 추출 완료")

    def post_process_questions(self):
        """추출된 문제 후처리"""
        logger.info("문제 후처리 중...")
        
        # 누락된 문제 찾기
        existing_numbers = {q['number'] for q in self.questions}
        expected_numbers = set(range(1, 151))  # 1~150
        missing_numbers = expected_numbers - existing_numbers
        
        if missing_numbers:
            logger.warning(f"누락된 문제 번호: {sorted(missing_numbers)}")
            logger.warning(f"누락된 문제 수: {len(missing_numbers)}개")

    def save_results(self, output_path: str):
        """결과 저장"""
        logger.info(f"결과 저장 중: {output_path}")
        
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write("# 제6회 나무의사 자격시험 문제\n\n")
            f.write(f"총 문제 수: {len(self.questions)}개\n\n")
            
            # 통계 정보
            if self.questions:
                numbers = [q['number'] for q in self.questions]
                f.write(f"문제 번호 범위: {min(numbers)} ~ {max(numbers)}\n")
                
                # 누락된 문제 표시
                existing_numbers = set(numbers)
                missing_numbers = set(range(1, 151)) - existing_numbers
                if missing_numbers:
                    f.write(f"누락된 문제: {sorted(missing_numbers)}\n")
                
                f.write("\n---\n\n")
            
            for q in self.questions:
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
            json.dump(self.questions, f, ensure_ascii=False, indent=2)
        
        logger.info(f"MD 파일: {output_path}")
        logger.info(f"JSON 파일: {json_path}")

def main():
    pdf_path = "/Users/voidlight/Downloads/[Codekiller]제6회 기출문제 해설집(v1.0).pdf"
    output_path = "/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-6th-final-150.md"
    
    if not os.path.exists(pdf_path):
        logger.error(f"PDF 파일을 찾을 수 없습니다: {pdf_path}")
        return
    
    # Tesseract 설치 확인
    try:
        subprocess.run(['tesseract', '--version'], capture_output=True, check=True)
    except:
        logger.error("Tesseract가 설치되지 않았습니다. brew install tesseract를 실행하세요.")
        return
    
    # 한국어 데이터 확인
    try:
        langs = pytesseract.get_languages()
        if 'kor' not in langs:
            logger.warning("한국어 데이터가 없습니다. brew install tesseract-lang을 실행하세요.")
            return
    except:
        pass
    
    # 추출 시작
    extractor = ExamExtractor(pdf_path)
    
    start_time = time.time()
    extractor.extract_all_questions()
    extractor.post_process_questions()
    extractor.save_results(output_path)
    
    elapsed_time = time.time() - start_time
    logger.info(f"처리 완료! 소요 시간: {elapsed_time:.2f}초")
    logger.info(f"추출된 문제 수: {len(extractor.questions)}개")
    
    # 통계 출력
    if extractor.questions:
        numbers = [q['number'] for q in extractor.questions]
        logger.info(f"문제 번호 범위: {min(numbers)} ~ {max(numbers)}")

if __name__ == "__main__":
    main()