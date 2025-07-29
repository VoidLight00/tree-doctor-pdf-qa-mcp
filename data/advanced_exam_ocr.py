#!/usr/bin/env python3
"""
나무의사 기출문제 고품질 OCR 및 구조화 스크립트
- 300 DPI 이상 고해상도 이미지 변환
- 한국어 특화 OCR (Tesseract Korean)
- 지능형 패턴 인식 및 구조화
"""
import os
import re
import sys
import json
import logging
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional, Tuple
import io

# 필요한 라이브러리 임포트
try:
    import fitz  # PyMuPDF
    from PIL import Image, ImageEnhance, ImageFilter
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
        logging.FileHandler('exam_ocr.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class AdvancedExamOCR:
    """고품질 나무의사 기출문제 OCR 처리기"""
    
    def __init__(self, pdf_path: str, output_path: str):
        self.pdf_path = pdf_path
        self.output_path = output_path
        self.exam_round = self.extract_exam_round(pdf_path)
        self.questions = []
        self.failed_pages = []
        self.ocr_stats = {
            'total_pages': 0,
            'ocr_pages': 0,
            'text_pages': 0,
            'total_chars': 0
        }
        
    def extract_exam_round(self, pdf_path: str) -> str:
        """파일명에서 회차 추출"""
        match = re.search(r'제(\d+)회', pdf_path)
        return match.group(1) if match else "Unknown"
    
    def process_pdf(self) -> Dict:
        """PDF 전체 처리 (고품질 OCR)"""
        logger.info(f"고품질 OCR 처리 시작: {self.pdf_path}")
        
        try:
            pdf = fitz.open(self.pdf_path)
            self.ocr_stats['total_pages'] = len(pdf)
            
            all_text = ""  # 전체 텍스트 누적
            
            for page_num in range(len(pdf)):
                try:
                    logger.info(f"페이지 {page_num + 1}/{len(pdf)} 처리 중...")
                    page = pdf[page_num]
                    
                    # 먼저 텍스트 추출 시도
                    text = page.get_text()
                    
                    # 텍스트가 충분하지 않으면 고품질 OCR 수행
                    if len(text.strip()) < 200 or self._is_image_based_page(page):
                        logger.info(f"페이지 {page_num + 1}: 고품질 OCR 수행")
                        text = self.perform_high_quality_ocr(page)
                        self.ocr_stats['ocr_pages'] += 1
                    else:
                        self.ocr_stats['text_pages'] += 1
                    
                    self.ocr_stats['total_chars'] += len(text)
                    all_text += f"\n\n=== 페이지 {page_num + 1} ===\n\n{text}"
                    
                except Exception as e:
                    logger.error(f"페이지 {page_num + 1} 처리 실패: {e}")
                    self.failed_pages.append({
                        'page': page_num + 1,
                        'error': str(e)
                    })
            
            pdf.close()
            
            # 전체 텍스트에서 문제 추출
            self.extract_all_questions(all_text)
            
            # 결과 저장
            self.save_to_markdown()
            
            return {
                'exam_round': self.exam_round,
                'total_questions': len(self.questions),
                'failed_pages': self.failed_pages,
                'ocr_stats': self.ocr_stats,
                'output_file': self.output_path
            }
            
        except Exception as e:
            logger.error(f"PDF 처리 중 오류 발생: {e}")
            raise
    
    def _is_image_based_page(self, page) -> bool:
        """페이지가 이미지 기반인지 확인"""
        # 이미지 개수와 텍스트 길이로 판단
        image_list = page.get_images()
        text_len = len(page.get_text().strip())
        return len(image_list) > 0 and text_len < 100
    
    def perform_high_quality_ocr(self, page) -> str:
        """고품질 OCR 수행 (300 DPI)"""
        # 300 DPI로 이미지 변환
        mat = fitz.Matrix(300/72, 300/72)  # 300 DPI
        pix = page.get_pixmap(matrix=mat, alpha=False)
        img_data = pix.tobytes("png")
        
        # PIL 이미지로 변환
        img = Image.open(io.BytesIO(img_data))
        
        # 고급 이미지 전처리
        img = self.advanced_preprocess_image(img)
        
        # OCR 수행 (한국어, 고품질 설정)
        custom_config = r'--oem 3 --psm 6 -c tessedit_char_whitelist=0123456789가-힣ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz①②③④⑤()[].,!?:;-_ '
        text = pytesseract.image_to_string(img, lang='kor', config=custom_config)
        
        return text
    
    def advanced_preprocess_image(self, img: Image) -> Image:
        """고급 이미지 전처리"""
        # OpenCV로 변환
        img_cv = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
        
        # 그레이스케일 변환
        gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
        
        # 노이즈 제거
        denoised = cv2.fastNlMeansDenoising(gray, None, 10, 7, 21)
        
        # 적응형 임계값 처리
        binary = cv2.adaptiveThreshold(
            denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
            cv2.THRESH_BINARY, 11, 2
        )
        
        # 모폴로지 연산으로 텍스트 개선
        kernel = np.ones((1, 1), np.uint8)
        morphed = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)
        
        # PIL 이미지로 재변환
        img_pil = Image.fromarray(morphed)
        
        # 선명도 향상
        enhancer = ImageEnhance.Sharpness(img_pil)
        img_pil = enhancer.enhance(2.0)
        
        return img_pil
    
    def extract_all_questions(self, full_text: str):
        """전체 텍스트에서 모든 문제 추출"""
        # 다양한 문제 번호 패턴
        question_patterns = [
            r'(\d{1,3})\.\s*([^\n]+.*?)(?=(?:\d{1,3}\.|정답|해설|$))',  # 기본 패턴
            r'문제\s*(\d{1,3})[.)]?\s*([^\n]+.*?)(?=(?:문제\s*\d{1,3}|정답|해설|$))',  # 문제 N
            r'【문제(\d{1,3})】\s*([^\n]+.*?)(?=(?:【문제\d{1,3}】|정답|해설|$))',  # 【문제N】
            r'Q(\d{1,3})[.)]?\s*([^\n]+.*?)(?=(?:Q\d{1,3}|정답|해설|$))',  # QN
        ]
        
        all_questions = []
        
        for pattern in question_patterns:
            matches = list(re.finditer(pattern, full_text, re.DOTALL | re.MULTILINE))
            for match in matches:
                question_num = int(match.group(1))
                question_content = match.group(2).strip()
                
                # 중복 체크
                if not any(q['number'] == question_num for q in all_questions):
                    all_questions.append({
                        'number': question_num,
                        'content': question_content,
                        'start': match.start(),
                        'end': match.end()
                    })
        
        # 번호순 정렬
        all_questions.sort(key=lambda x: x['number'])
        
        # 각 문제에 대해 상세 정보 추출
        for q in all_questions:
            self.extract_question_details(q, full_text)
        
        self.questions = all_questions
        logger.info(f"총 {len(self.questions)}개 문제 추출 완료")
    
    def extract_question_details(self, question: Dict, full_text: str):
        """문제의 상세 정보 추출"""
        # 문제 범위 결정
        start = question['start']
        next_q = next((q for q in self.questions if q['number'] == question['number'] + 1), None)
        end = next_q['start'] if next_q else len(full_text)
        
        question_text = full_text[start:end]
        
        # 선택지 추출 (다양한 패턴)
        choices = self.extract_choices(question_text)
        
        # 정답 추출
        answer = self.extract_answer(question_text)
        
        # 해설 추출
        explanation = self.extract_explanation(question_text)
        
        # 과목 추출
        subject = self.extract_subject(question_text)
        
        # 키워드 추출
        keywords = self.extract_keywords(question_text)
        
        # 문제 정보 업데이트
        question.update({
            'question': question['content'],
            'choices': choices,
            'answer': answer,
            'explanation': explanation,
            'subject': subject,
            'keywords': keywords
        })
        
        # 임시 필드 제거
        del question['content']
        del question['start']
        del question['end']
    
    def extract_choices(self, text: str) -> Dict[str, str]:
        """선택지 추출 (다양한 형식 지원)"""
        choices = {}
        
        # 패턴 1: ① ② ③ ④ ⑤
        pattern1 = r'([①②③④⑤])\s*([^\n①②③④⑤]+)'
        
        # 패턴 2: 1) 2) 3) 4) 5)
        pattern2 = r'(\d)\)\s*([^\n\d)]+)'
        
        # 패턴 3: (1) (2) (3) (4) (5)
        pattern3 = r'\((\d)\)\s*([^\n\(\)]+)'
        
        # 패턴 4: ㄱ. ㄴ. ㄷ. ㄹ.
        pattern4 = r'([ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎ])\.\s*([^\nㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎ]+)'
        
        for pattern in [pattern1, pattern2, pattern3, pattern4]:
            matches = re.finditer(pattern, text, re.MULTILINE)
            for match in matches:
                key = match.group(1)
                value = match.group(2).strip()
                if value and len(value) > 2:  # 의미있는 내용만
                    choices[key] = value
        
        return choices
    
    def extract_answer(self, text: str) -> str:
        """정답 추출"""
        answer_patterns = [
            r'정답\s*[:：]\s*([①②③④⑤\d]+)',
            r'답\s*[:：]\s*([①②③④⑤\d]+)',
            r'【정답】\s*([①②③④⑤\d]+)',
            r'Answer\s*[:：]\s*([①②③④⑤\d]+)',
        ]
        
        for pattern in answer_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        
        return "미확인"
    
    def extract_explanation(self, text: str) -> str:
        """해설 추출"""
        explanation_patterns = [
            r'해설\s*[:：]\s*(.*?)(?=문제\s*\d|$)',
            r'설명\s*[:：]\s*(.*?)(?=문제\s*\d|$)',
            r'【해설】\s*(.*?)(?=문제\s*\d|$)',
            r'풀이\s*[:：]\s*(.*?)(?=문제\s*\d|$)',
        ]
        
        for pattern in explanation_patterns:
            match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
            if match:
                explanation = match.group(1).strip()
                # 너무 긴 해설은 적절히 자르기
                if len(explanation) > 1000:
                    explanation = explanation[:1000] + "..."
                return explanation
        
        return "해설 없음"
    
    def extract_subject(self, text: str) -> str:
        """과목 추출"""
        subjects = {
            '수목병리학': ['병해', '병원균', '곰팡이', '세균', '바이러스'],
            '수목해충학': ['해충', '곤충', '천적', '방제'],
            '수목생리학': ['광합성', '호흡', '증산', '양분'],
            '토양학': ['토양', 'pH', '양분', '비료'],
            '수목관리학': ['전정', '가지치기', '식재', '이식'],
            '농약학': ['농약', '살충제', '살균제', '제초제'],
        }
        
        text_lower = text.lower()
        scores = {}
        
        for subject, keywords in subjects.items():
            score = sum(1 for keyword in keywords if keyword in text)
            if score > 0:
                scores[subject] = score
        
        if scores:
            return max(scores, key=scores.get)
        return "일반"
    
    def extract_keywords(self, text: str) -> List[str]:
        """키워드 추출 (향상된 버전)"""
        keywords = set()
        
        # 전문 용어 사전
        term_dict = {
            '병충해': ['병해', '충해', '병충해', '병원균', '해충'],
            '방제': ['방제', '살충제', '살균제', '농약', '약제'],
            '진단': ['진단', '증상', '병징', '표징', '피해'],
            '수목관리': ['전정', '가지치기', '전지', '수형', '정지'],
            '토양': ['토양', 'pH', '비료', '양분', '영양'],
            '생리': ['광합성', '호흡', '증산', '수분'],
        }
        
        # 전문 용어 검색
        for category, terms in term_dict.items():
            if any(term in text for term in terms):
                keywords.add(category)
        
        # 수종 추출
        tree_pattern = r'(소나무|잣나무|은행나무|느티나무|벚나무|단풍나무|참나무|밤나무|감나무|배나무|사과나무)'
        trees = re.findall(tree_pattern, text)
        keywords.update(set(trees))
        
        # 병해충명 추출
        pest_pattern = r'([가-힣]+병|[가-힣]+충|[가-힣]+균)'
        pests = re.findall(pest_pattern, text)
        keywords.update(set(pests[:3]))  # 상위 3개만
        
        return list(keywords)
    
    def save_to_markdown(self):
        """구조화된 마크다운으로 저장"""
        content = f"# 나무의사 제{self.exam_round}회 기출문제 (완벽 복원판)\n\n"
        content += f"**총 문제 수**: {len(self.questions)}개\n"
        content += f"**추출 일시**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
        content += f"**OCR 품질**: 고해상도 300 DPI\n"
        content += f"**처리 통계**:\n"
        content += f"- 전체 페이지: {self.ocr_stats['total_pages']}페이지\n"
        content += f"- OCR 처리: {self.ocr_stats['ocr_pages']}페이지\n"
        content += f"- 텍스트 추출: {self.ocr_stats['text_pages']}페이지\n"
        content += f"- 전체 문자수: {self.ocr_stats['total_chars']:,}자\n\n"
        content += "---\n\n"
        
        # 과목별 분류
        subjects = {}
        for q in self.questions:
            subject = q.get('subject', '일반')
            if subject not in subjects:
                subjects[subject] = []
            subjects[subject].append(q)
        
        # 과목별로 출력
        for subject, questions in subjects.items():
            content += f"## 📚 {subject} ({len(questions)}문제)\n\n"
            
            for q in sorted(questions, key=lambda x: x['number']):
                content += f"### 문제 {q['number']}\n"
                if q.get('subject') != '일반':
                    content += f"**과목**: {q['subject']}\n"
                content += f"**문제**: {q['question']}\n\n"
                
                if q['choices']:
                    content += "**선택지**:\n"
                    for key in ['①', '②', '③', '④', '⑤', '1', '2', '3', '4', '5']:
                        if key in q['choices']:
                            content += f"{key} {q['choices'][key]}\n"
                    content += "\n"
                
                content += f"**정답**: {q['answer']}\n\n"
                
                if q['explanation'] != "해설 없음":
                    content += f"**해설**: {q['explanation']}\n\n"
                
                if q['keywords']:
                    content += f"**키워드**: {', '.join(q['keywords'])}\n\n"
                
                content += "---\n\n"
        
        # 처리 실패 정보
        if self.failed_pages:
            content += "\n## ⚠️ 처리 실패 페이지\n\n"
            for failed in self.failed_pages:
                content += f"- 페이지 {failed['page']}: {failed['error']}\n"
            content += "\n"
        
        # 품질 보증 정보
        content += "\n## 📊 품질 보증\n\n"
        content += f"- 문제 추출률: {len(self.questions)/150*100:.1f}% (예상 150문제 기준)\n"
        content += f"- 선택지 완성도: {sum(1 for q in self.questions if len(q['choices']) >= 4)/len(self.questions)*100:.1f}%\n"
        content += f"- 정답 확인률: {sum(1 for q in self.questions if q['answer'] != '미확인')/len(self.questions)*100:.1f}%\n"
        content += f"- 해설 포함률: {sum(1 for q in self.questions if q['explanation'] != '해설 없음')/len(self.questions)*100:.1f}%\n"
        
        # 파일 저장
        with open(self.output_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        logger.info(f"고품질 결과 저장 완료: {self.output_path}")

def main():
    """메인 함수"""
    # 처리할 PDF 파일
    pdf_files = [
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
    
    for file_info in pdf_files:
        if not os.path.exists(file_info['input']):
            logger.error(f"파일을 찾을 수 없습니다: {file_info['input']}")
            continue
        
        try:
            processor = AdvancedExamOCR(file_info['input'], file_info['output'])
            result = processor.process_pdf()
            results.append(result)
            
            logger.info(f"✅ 제{result['exam_round']}회 처리 완료: {result['total_questions']}문제")
            
        except Exception as e:
            logger.error(f"처리 실패: {file_info['input']} - {e}")
            results.append({
                'exam_round': 'Unknown',
                'error': str(e),
                'input_file': file_info['input']
            })
    
    # 최종 보고서
    report_path = '/Users/voidlight/tree-doctor-pdf-qa-mcp/data/advanced_ocr_report.json'
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    # 요약 출력
    print("\n=== 🚀 고품질 OCR 처리 완료 ===")
    for result in results:
        if 'error' in result:
            print(f"❌ 제{result['exam_round']}회: 처리 실패")
        else:
            print(f"✅ 제{result['exam_round']}회: {result['total_questions']}문제 추출")
            stats = result['ocr_stats']
            print(f"   - OCR 처리: {stats['ocr_pages']}/{stats['total_pages']} 페이지")
            print(f"   - 전체 문자: {stats['total_chars']:,}자")

if __name__ == "__main__":
    main()