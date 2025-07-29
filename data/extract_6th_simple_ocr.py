#!/usr/bin/env python3
"""
제6회 나무의사 시험 150문제 완벽 추출 - 간단한 OCR 버전
"""

import os
import sys
import re
import json
from pathlib import Path
import logging
from typing import List, Dict
import subprocess
from pdf2image import convert_from_path
from PIL import Image, ImageEnhance, ImageFilter
import pytesseract
import time

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('exam_6th_simple_ocr.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class SimpleOCRExtractor:
    def __init__(self, pdf_path: str):
        self.pdf_path = pdf_path
        self.output_dir = Path("temp_ocr_6th")
        self.output_dir.mkdir(exist_ok=True)
        self.questions = []

    def enhance_image_simple(self, image: Image.Image) -> Image.Image:
        """PIL을 사용한 간단한 이미지 향상"""
        # 그레이스케일 변환
        gray = image.convert('L')
        
        # 대비 향상
        enhancer = ImageEnhance.Contrast(gray)
        enhanced = enhancer.enhance(2.0)
        
        # 선명도 향상
        enhancer = ImageEnhance.Sharpness(enhanced)
        sharp = enhancer.enhance(2.0)
        
        return sharp

    def extract_text_from_page(self, image: Image.Image, page_num: int) -> str:
        """페이지에서 텍스트 추출"""
        logger.info(f"페이지 {page_num} OCR 처리 중...")
        
        try:
            # 원본 이미지로 시도
            text = pytesseract.image_to_string(image, lang='kor+eng')
            
            # 텍스트가 너무 짧으면 향상된 이미지로 재시도
            if len(text.strip()) < 100:
                enhanced = self.enhance_image_simple(image)
                text = pytesseract.image_to_string(enhanced, lang='kor+eng')
            
            # 디버깅용 텍스트 저장
            text_path = self.output_dir / f"page_{page_num:03d}.txt"
            with open(text_path, 'w', encoding='utf-8') as f:
                f.write(text)
            
            return text
            
        except Exception as e:
            logger.error(f"페이지 {page_num} OCR 오류: {e}")
            return ""

    def parse_questions(self, text: str, page_num: int) -> List[Dict]:
        """텍스트에서 문제 추출"""
        questions = []
        
        # 문제 패턴들 (더 간단하게)
        patterns = [
            # 숫자. 형식
            r'(\d{1,3})\s*\.\s*([^\n]+(?:\n(?![①②③④⑤\d]\s*[\.)])[^\n]+)*)',
            # 숫자) 형식
            r'(\d{1,3})\s*\)\s*([^\n]+(?:\n(?![①②③④⑤\d]\s*[\.)])[^\n]+)*)',
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, text, re.MULTILINE)
            
            for match in matches:
                try:
                    q_num = int(match[0])
                    q_text = match[1].strip()
                    
                    if 1 <= q_num <= 150 and len(q_text) > 10:
                        # 선택지 찾기
                        choices = self.extract_choices(text, q_num)
                        
                        questions.append({
                            'number': q_num,
                            'text': q_text,
                            'choices': choices,
                            'page': page_num
                        })
                except:
                    continue
        
        return questions

    def extract_choices(self, text: str, question_num: int) -> List[str]:
        """문제의 선택지 추출"""
        choices = []
        
        # 문제 위치 찾기
        q_pattern = rf'{question_num}\s*[\.)].*?(?=\d{{1,3}}\s*[\.)]|$)'
        q_match = re.search(q_pattern, text, re.DOTALL)
        
        if q_match:
            q_text = q_match.group(0)
            
            # 선택지 패턴
            choice_patterns = [
                r'([①②③④⑤])\s*([^\n①②③④⑤]+)',
                r'(\d)\s*[)]\s*([^\n]+)',
            ]
            
            for pattern in choice_patterns:
                matches = re.findall(pattern, q_text)
                for match in matches:
                    choice_num = match[0]
                    choice_text = match[1].strip()
                    if choice_text:
                        choices.append(f"{choice_num} {choice_text}")
        
        return choices

    def process_pdf(self):
        """PDF 전체 처리"""
        logger.info(f"PDF 변환 시작: {self.pdf_path}")
        
        try:
            # PDF를 이미지로 변환 (낮은 DPI로 빠르게)
            images = convert_from_path(
                self.pdf_path,
                dpi=200,  # 300에서 200으로 낮춤
                fmt='png',
                thread_count=2
            )
            
            logger.info(f"총 {len(images)} 페이지 변환 완료")
            
            all_questions = []
            
            # 각 페이지 처리
            for i, image in enumerate(images):
                page_num = i + 1
                
                # 텍스트 추출
                text = self.extract_text_from_page(image, page_num)
                
                # 문제 파싱
                questions = self.parse_questions(text, page_num)
                all_questions.extend(questions)
                
                logger.info(f"페이지 {page_num}: {len(questions)}개 문제 발견")
                
                # 진행률
                if page_num % 10 == 0:
                    logger.info(f"진행률: {page_num}/{len(images)} ({page_num/len(images)*100:.1f}%)")
            
            # 중복 제거 및 정렬
            unique_questions = {}
            for q in all_questions:
                q_num = q['number']
                if q_num not in unique_questions:
                    unique_questions[q_num] = q
                elif len(q['text']) > len(unique_questions[q_num]['text']):
                    unique_questions[q_num] = q
            
            self.questions = sorted(unique_questions.values(), key=lambda x: x['number'])
            
        except Exception as e:
            logger.error(f"PDF 처리 오류: {e}")

    def save_results(self, output_path: str):
        """결과 저장"""
        logger.info(f"결과 저장 중: {output_path}")
        
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write("# 제6회 나무의사 자격시험 문제\n\n")
            f.write(f"총 문제 수: {len(self.questions)}개\n")
            f.write(f"추출 시각: {time.strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            
            if self.questions:
                numbers = [q['number'] for q in self.questions]
                f.write(f"문제 번호 범위: {min(numbers)} ~ {max(numbers)}\n")
                
                # 누락된 문제
                existing = set(numbers)
                missing = set(range(1, 151)) - existing
                if missing:
                    f.write(f"누락된 문제 ({len(missing)}개): {sorted(missing)}\n")
                
                f.write("\n---\n\n")
                
                # 각 문제 출력
                for q in self.questions:
                    f.write(f"## 문제 {q['number']}\n\n")
                    f.write(f"{q['text']}\n\n")
                    
                    if q.get('choices'):
                        for choice in q['choices']:
                            f.write(f"{choice}\n")
                        f.write("\n")
                    
                    f.write(f"*페이지: {q['page']}*\n")
                    f.write("\n---\n\n")
        
        # JSON 저장
        json_path = output_path.replace('.md', '.json')
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(self.questions, f, ensure_ascii=False, indent=2)
        
        # 통계 파일 저장
        stats_path = output_path.replace('.md', '_stats.txt')
        with open(stats_path, 'w', encoding='utf-8') as f:
            f.write(f"총 문제 수: {len(self.questions)}\n")
            if self.questions:
                numbers = [q['number'] for q in self.questions]
                f.write(f"문제 번호: {min(numbers)} ~ {max(numbers)}\n")
                missing = set(range(1, 151)) - set(numbers)
                f.write(f"누락 문제 수: {len(missing)}\n")
                if missing:
                    f.write(f"누락 번호: {sorted(missing)}\n")

def main():
    pdf_path = "/Users/voidlight/Downloads/[Codekiller]제6회 기출문제 해설집(v1.0).pdf"
    output_path = "/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-6th-final-150.md"
    
    if not os.path.exists(pdf_path):
        logger.error(f"PDF 파일을 찾을 수 없습니다: {pdf_path}")
        return
    
    # Tesseract 확인
    try:
        result = subprocess.run(['tesseract', '--version'], capture_output=True, text=True)
        logger.info(f"Tesseract 버전: {result.stdout.split()[1]}")
    except:
        logger.error("Tesseract가 설치되지 않았습니다.")
        return
    
    # 추출 시작
    start_time = time.time()
    
    extractor = SimpleOCRExtractor(pdf_path)
    extractor.process_pdf()
    extractor.save_results(output_path)
    
    elapsed_time = time.time() - start_time
    
    logger.info(f"\n{'='*50}")
    logger.info(f"처리 완료!")
    logger.info(f"소요 시간: {elapsed_time:.2f}초")
    logger.info(f"추출된 문제: {len(extractor.questions)}개")
    
    if extractor.questions:
        numbers = [q['number'] for q in extractor.questions]
        missing = set(range(1, 151)) - set(numbers)
        logger.info(f"문제 범위: {min(numbers)} ~ {max(numbers)}")
        logger.info(f"누락 문제: {len(missing)}개")
        
        if len(extractor.questions) < 100:
            logger.warning("추출된 문제가 100개 미만입니다. OCR 품질 확인 필요!")

if __name__ == "__main__":
    main()