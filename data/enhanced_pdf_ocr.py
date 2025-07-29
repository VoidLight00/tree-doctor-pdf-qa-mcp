#!/usr/bin/env python3
"""
나무의사 기출문제 PDF 고품질 OCR 추출
- 이미지 기반 PDF 처리 최적화
- 구조화된 문제 추출
"""
import os
import re
import sys
import json
import logging
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Tuple
import warnings
warnings.filterwarnings('ignore')

# 필요한 라이브러리 임포트
try:
    import fitz  # PyMuPDF
    from PIL import Image, ImageEnhance, ImageFilter, ImageOps
    import pytesseract
    import numpy as np
    import cv2
except ImportError as e:
    print(f"필요한 라이브러리가 설치되어 있지 않습니다: {e}")
    print("다음 명령으로 설치하세요:")
    print("pip install PyMuPDF pillow pytesseract numpy opencv-python")
    sys.exit(1)

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('enhanced_ocr.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class EnhancedExamOCR:
    """향상된 나무의사 기출문제 OCR 처리기"""
    
    def __init__(self, pdf_path: str, output_path: str):
        self.pdf_path = pdf_path
        self.output_path = output_path
        self.exam_round = self.extract_exam_round(pdf_path)
        self.questions = []
        self.raw_texts = []  # 페이지별 원본 텍스트 저장
        
    def extract_exam_round(self, pdf_path: str) -> str:
        """파일명에서 회차 추출"""
        match = re.search(r'제(\d+)회', pdf_path)
        return match.group(1) if match else "Unknown"
    
    def enhance_image(self, img_array: np.ndarray) -> np.ndarray:
        """이미지 품질 향상"""
        # 그레이스케일 변환
        if len(img_array.shape) == 3:
            gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
        else:
            gray = img_array
        
        # 대비 향상
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        enhanced = clahe.apply(gray)
        
        # 노이즈 제거
        denoised = cv2.fastNlMeansDenoising(enhanced, None, 10, 7, 21)
        
        # 샤프닝
        kernel = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])
        sharpened = cv2.filter2D(denoised, -1, kernel)
        
        # 이진화 (Otsu's method)
        _, binary = cv2.threshold(sharpened, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        return binary
    
    def ocr_page_with_regions(self, page) -> str:
        """페이지를 영역별로 나누어 OCR 수행"""
        # 고해상도로 렌더링 (300 DPI)
        mat = fitz.Matrix(300/72, 300/72)
        pix = page.get_pixmap(matrix=mat, alpha=False)
        
        # numpy 배열로 변환
        img_data = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.h, pix.w, pix.n)
        
        # BGR to RGB (if needed)
        if pix.n == 3:
            img_array = cv2.cvtColor(img_data, cv2.COLOR_BGR2RGB)
        else:
            img_array = img_data
        
        # 이미지 향상
        enhanced = self.enhance_image(img_array)
        
        # OCR 수행
        custom_config = r'--oem 3 --psm 6 -l kor+eng'
        text = pytesseract.image_to_string(enhanced, config=custom_config)
        
        return text
    
    def process_pdf(self) -> Dict:
        """PDF 전체 처리"""
        logger.info(f"향상된 OCR 처리 시작: {self.pdf_path}")
        
        try:
            pdf = fitz.open(self.pdf_path)
            total_pages = len(pdf)
            
            for page_num in range(total_pages):
                logger.info(f"페이지 {page_num + 1}/{total_pages} 처리 중...")
                page = pdf[page_num]
                
                # 먼저 텍스트 추출 시도
                text = page.get_text()
                
                # 텍스트가 부족하면 OCR 수행
                if len(text.strip()) < 100:
                    logger.info(f"페이지 {page_num + 1}: OCR 수행")
                    text = self.ocr_page_with_regions(page)
                
                self.raw_texts.append({
                    'page': page_num + 1,
                    'text': text
                })
            
            pdf.close()
            
            # 전체 텍스트 결합 및 문제 추출
            full_text = '\n\n'.join([p['text'] for p in self.raw_texts])
            self.extract_structured_questions(full_text)
            
            # 결과 저장
            self.save_to_markdown()
            
            return {
                'exam_round': self.exam_round,
                'total_questions': len(self.questions),
                'total_pages': total_pages,
                'output_file': self.output_path,
                'success': True
            }
            
        except Exception as e:
            logger.error(f"PDF 처리 중 오류 발생: {e}")
            return {
                'exam_round': self.exam_round,
                'error': str(e),
                'success': False
            }
    
    def extract_structured_questions(self, text: str):
        """구조화된 문제 추출"""
        # 다양한 문제 패턴
        patterns = [
            # 기본 패턴: 1. 문제내용
            r'(\d{1,3})\.\s*([^①②③④⑤]+?)(?=①)',
            # 문제 N. 형식
            r'문제\s*(\d{1,3})\.\s*([^①②③④⑤]+?)(?=①)',
            # 【문제N】 형식
            r'【문제\s*(\d{1,3})】\s*([^①②③④⑤]+?)(?=①)',
        ]
        
        # 전체 텍스트에서 문제 블록 찾기
        question_blocks = []
        
        # 숫자. 패턴으로 분할
        parts = re.split(r'(?=\d{1,3}\.)', text)
        
        for part in parts:
            part = part.strip()
            if not part:
                continue
            
            # 문제 번호 확인
            match = re.match(r'^(\d{1,3})\.\s*(.+)', part, re.DOTALL)
            if match:
                q_num = int(match.group(1))
                q_content = match.group(2)
                
                # 선택지 추출
                choices = self.extract_choices_from_text(q_content)
                
                # 정답 추출
                answer = self.extract_answer_from_text(q_content)
                
                # 해설 추출
                explanation = self.extract_explanation_from_text(q_content)
                
                # 문제 텍스트 정리 (선택지, 정답, 해설 제거)
                question_text = q_content
                for pattern in [r'①.*?(?=정답|해설|$)', r'정답.*?(?=해설|$)', r'해설.*?$']:
                    question_text = re.sub(pattern, '', question_text, flags=re.DOTALL)
                question_text = question_text.strip()
                
                if question_text or choices:  # 문제 내용이나 선택지가 있으면 추가
                    self.questions.append({
                        'number': q_num,
                        'question': question_text,
                        'choices': choices,
                        'answer': answer,
                        'explanation': explanation,
                        'keywords': self.extract_keywords(q_content)
                    })
        
        # 번호순 정렬
        self.questions.sort(key=lambda x: x['number'])
        logger.info(f"총 {len(self.questions)}개 문제 추출")
    
    def extract_choices_from_text(self, text: str) -> Dict[str, str]:
        """텍스트에서 선택지 추출"""
        choices = {}
        
        # 선택지 패턴들
        patterns = [
            (r'①\s*([^②③④⑤]+)', '①'),
            (r'②\s*([^③④⑤]+)', '②'),
            (r'③\s*([^④⑤]+)', '③'),
            (r'④\s*([^⑤]+)', '④'),
            (r'⑤\s*([^정답해설]+)', '⑤'),
        ]
        
        for pattern, key in patterns:
            match = re.search(pattern, text, re.DOTALL)
            if match:
                choice_text = match.group(1).strip()
                # 정답, 해설 부분 제거
                choice_text = re.sub(r'(정답|해설).*$', '', choice_text, flags=re.DOTALL).strip()
                if choice_text:
                    choices[key] = choice_text
        
        return choices
    
    def extract_answer_from_text(self, text: str) -> str:
        """텍스트에서 정답 추출"""
        patterns = [
            r'정답\s*[:：]?\s*([①②③④⑤])',
            r'답\s*[:：]?\s*([①②③④⑤])',
            r'\[정답\]\s*([①②③④⑤])',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                return match.group(1)
        
        return ""
    
    def extract_explanation_from_text(self, text: str) -> str:
        """텍스트에서 해설 추출"""
        patterns = [
            r'해설\s*[:：]?\s*(.+?)(?=\d{1,3}\.|$)',
            r'설명\s*[:：]?\s*(.+?)(?=\d{1,3}\.|$)',
            r'\[해설\]\s*(.+?)(?=\d{1,3}\.|$)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.DOTALL)
            if match:
                explanation = match.group(1).strip()
                # 너무 긴 해설은 적절히 자르기
                if len(explanation) > 500:
                    explanation = explanation[:500] + "..."
                return explanation
        
        return ""
    
    def extract_keywords(self, text: str) -> List[str]:
        """키워드 추출"""
        keywords = []
        
        # 주요 키워드 패턴
        keyword_patterns = {
            '병충해': r'병해|충해|병충해|병원균|해충|방제',
            '수목관리': r'전정|가지치기|전지|수형|정지',
            '진단': r'진단|증상|병징|표징',
            '토양': r'토양|pH|비료|영양',
            '농약': r'농약|살충제|살균제|약제',
            '생리': r'생리|생장|생육|광합성|호흡'
        }
        
        for category, pattern in keyword_patterns.items():
            if re.search(pattern, text):
                keywords.append(category)
        
        # 수종 추출
        trees = re.findall(r'(소나무|잣나무|은행나무|느티나무|벚나무|단풍나무|참나무)', text)
        keywords.extend(list(set(trees)))
        
        # 병해충명 추출
        pests = re.findall(r'([가-힣]+병|[가-힣]+충)', text)
        keywords.extend(list(set(pests[:5])))  # 상위 5개만
        
        return list(set(keywords))
    
    def save_to_markdown(self):
        """마크다운으로 저장"""
        content = f"# 나무의사 제{self.exam_round}회 기출문제 (고품질 OCR)\n\n"
        content += f"**총 문제 수**: {len(self.questions)}개\n"
        content += f"**추출 일시**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
        content += f"**처리 방법**: Enhanced OCR with Image Processing\n\n"
        content += "---\n\n"
        
        for q in self.questions:
            content += f"## 문제 {q['number']}\n\n"
            
            if q['question']:
                content += f"**문제**: {q['question']}\n\n"
            
            if q['choices']:
                content += "**선택지**:\n"
                for key in ['①', '②', '③', '④', '⑤']:
                    if key in q['choices']:
                        content += f"- {key} {q['choices'][key]}\n"
                content += "\n"
            
            if q['answer']:
                content += f"**정답**: {q['answer']}\n\n"
            
            if q['explanation']:
                content += f"**해설**: {q['explanation']}\n\n"
            
            if q['keywords']:
                content += f"**키워드**: {', '.join(q['keywords'])}\n\n"
            
            content += "---\n\n"
        
        # 파일 저장
        with open(self.output_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        logger.info(f"결과 저장 완료: {self.output_path}")

def main():
    """메인 함수"""
    files = [
        {
            'input': '/Users/voidlight/Downloads/[Codekiller]제5회 기출문제 해설집(v1.0).pdf',
            'output': '/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-5th-complete.md'
        },
        {
            'input': '/Users/voidlight/Downloads/[Codekiller]제6회 기출문제 해설집(v1.0).pdf',
            'output': '/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-6th-complete.md'
        }
    ]
    
    results = []
    
    for file_info in files:
        if not os.path.exists(file_info['input']):
            logger.error(f"파일을 찾을 수 없습니다: {file_info['input']}")
            continue
        
        try:
            processor = EnhancedExamOCR(file_info['input'], file_info['output'])
            result = processor.process_pdf()
            results.append(result)
            
            if result['success']:
                logger.info(f"✅ 제{result['exam_round']}회: {result['total_questions']}문제 추출 완료")
            else:
                logger.error(f"❌ 제{result['exam_round']}회: 처리 실패")
            
        except Exception as e:
            logger.error(f"처리 실패: {file_info['input']} - {e}")
            results.append({
                'exam_round': 'Unknown',
                'error': str(e),
                'success': False
            })
    
    # 최종 보고서
    print("\n=== 향상된 OCR 처리 완료 ===")
    for result in results:
        if result['success']:
            print(f"✅ 제{result['exam_round']}회: {result['total_questions']}문제")
        else:
            print(f"❌ 제{result['exam_round']}회: 실패")

if __name__ == "__main__":
    main()