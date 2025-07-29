#!/usr/bin/env python3
"""
나무의사 기출문제 PDF OCR 변환 스크립트
"""
import os
import re
import sys
import json
import logging
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional, Tuple

# 필요한 라이브러리 임포트
try:
    import fitz  # PyMuPDF
    from PIL import Image
    import pytesseract
    import numpy as np
except ImportError as e:
    print(f"필요한 라이브러리가 설치되어 있지 않습니다: {e}")
    print("다음 명령으로 설치하세요:")
    print("pip install PyMuPDF pillow pytesseract numpy")
    sys.exit(1)

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class TreeDoctorExamParser:
    """나무의사 기출문제 PDF 파서"""
    
    def __init__(self, pdf_path: str, output_path: str):
        self.pdf_path = pdf_path
        self.output_path = output_path
        self.exam_round = self.extract_exam_round(pdf_path)
        self.questions = []
        self.failed_pages = []
        
    def extract_exam_round(self, pdf_path: str) -> str:
        """파일명에서 회차 추출"""
        match = re.search(r'제(\d+)회', pdf_path)
        return match.group(1) if match else "Unknown"
        
    def process_pdf(self) -> Dict:
        """PDF 전체 처리"""
        logger.info(f"처리 시작: {self.pdf_path}")
        
        try:
            pdf = fitz.open(self.pdf_path)
            total_pages = len(pdf)
            
            for page_num in range(total_pages):
                try:
                    logger.info(f"페이지 {page_num + 1}/{total_pages} 처리 중...")
                    page = pdf[page_num]
                    
                    # 텍스트 추출 시도
                    text = page.get_text()
                    
                    # 텍스트가 없거나 부족하면 OCR 수행
                    if len(text.strip()) < 100:
                        text = self.perform_ocr(page)
                    
                    # 문제 파싱
                    self.parse_page_content(text, page_num + 1)
                    
                except Exception as e:
                    logger.error(f"페이지 {page_num + 1} 처리 실패: {e}")
                    self.failed_pages.append({
                        'page': page_num + 1,
                        'error': str(e)
                    })
            
            pdf.close()
            
            # 결과 저장
            self.save_to_markdown()
            
            return {
                'exam_round': self.exam_round,
                'total_questions': len(self.questions),
                'failed_pages': self.failed_pages,
                'output_file': self.output_path
            }
            
        except Exception as e:
            logger.error(f"PDF 처리 중 오류 발생: {e}")
            raise
    
    def perform_ocr(self, page) -> str:
        """페이지 OCR 수행"""
        # 페이지를 이미지로 변환
        mat = fitz.Matrix(2, 2)  # 2x 확대
        pix = page.get_pixmap(matrix=mat)
        img_data = pix.tobytes("png")
        
        # PIL 이미지로 변환
        img = Image.open(io.BytesIO(img_data))
        
        # 이미지 전처리
        img = self.preprocess_image(img)
        
        # OCR 수행 (한국어)
        text = pytesseract.image_to_string(img, lang='kor')
        
        return text
    
    def preprocess_image(self, img: Image) -> Image:
        """OCR을 위한 이미지 전처리"""
        # 그레이스케일 변환
        img = img.convert('L')
        
        # numpy 배열로 변환
        img_array = np.array(img)
        
        # 이진화
        threshold = 128
        img_array = ((img_array > threshold) * 255).astype(np.uint8)
        
        # PIL 이미지로 재변환
        return Image.fromarray(img_array)
    
    def parse_page_content(self, text: str, page_num: int):
        """페이지 내용에서 문제 파싱"""
        # 문제 패턴 찾기
        question_pattern = r'(\d+)\.\s*(.*?)(?=\d+\.|$)'
        
        # 선택지 패턴
        choice_pattern = r'([①②③④⑤])\s*(.*?)(?=[①②③④⑤]|정답|해설|$)'
        
        # 정답 패턴
        answer_pattern = r'정답\s*[:：]\s*([①②③④⑤\d]+)'
        
        # 해설 패턴
        explanation_pattern = r'해설\s*[:：]\s*(.*?)(?=\d+\.|$)'
        
        # 문제 찾기
        questions = re.finditer(question_pattern, text, re.DOTALL | re.MULTILINE)
        
        for match in questions:
            question_num = match.group(1)
            question_text = match.group(2).strip()
            
            # 해당 문제의 전체 텍스트 범위 추출
            start_pos = match.start()
            next_match = re.search(rf'{int(question_num)+1}\.', text[start_pos:])
            end_pos = start_pos + next_match.start() if next_match else len(text)
            
            question_full_text = text[start_pos:end_pos]
            
            # 선택지 추출
            choices = {}
            choice_matches = re.finditer(choice_pattern, question_full_text, re.MULTILINE)
            for choice_match in choice_matches:
                choice_num = choice_match.group(1)
                choice_text = choice_match.group(2).strip()
                choices[choice_num] = choice_text
            
            # 정답 추출
            answer_match = re.search(answer_pattern, question_full_text)
            answer = answer_match.group(1) if answer_match else "미확인"
            
            # 해설 추출
            explanation_match = re.search(explanation_pattern, question_full_text, re.DOTALL)
            explanation = explanation_match.group(1).strip() if explanation_match else "해설 없음"
            
            # 문제 객체 생성
            question_obj = {
                'number': int(question_num),
                'question': question_text,
                'choices': choices,
                'answer': answer,
                'explanation': explanation,
                'page': page_num,
                'keywords': self.extract_keywords(question_text + " " + explanation)
            }
            
            self.questions.append(question_obj)
            logger.info(f"문제 {question_num} 추출 완료")
    
    def extract_keywords(self, text: str) -> List[str]:
        """텍스트에서 키워드 추출"""
        # 나무의사 관련 전문 용어 패턴
        keywords = []
        
        # 병충해 관련
        if any(term in text for term in ['병해', '충해', '병충해', '방제', '살충제', '살균제']):
            keywords.append('병충해')
        
        # 수목 관리 관련
        if any(term in text for term in ['전정', '가지치기', '수형', '전지']):
            keywords.append('수목관리')
        
        # 진단 관련
        if any(term in text for term in ['진단', '증상', '병징', '표징']):
            keywords.append('진단')
        
        # 토양 관련
        if any(term in text for term in ['토양', 'pH', '비료', '영양']):
            keywords.append('토양')
        
        # 수종 추출
        tree_species = re.findall(r'(소나무|잣나무|은행나무|느티나무|벚나무|단풍나무)', text)
        keywords.extend(list(set(tree_species)))
        
        return keywords
    
    def save_to_markdown(self):
        """마크다운 파일로 저장"""
        content = f"# 나무의사 제{self.exam_round}회 기출문제\n\n"
        content += f"**총 문제 수**: {len(self.questions)}개\n"
        content += f"**추출 일시**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
        content += "---\n\n"
        
        for q in sorted(self.questions, key=lambda x: x['number']):
            content += f"## 문제 {q['number']}\n\n"
            content += f"**문제**: {q['question']}\n\n"
            
            if q['choices']:
                content += "**선택지**:\n"
                for num, choice in sorted(q['choices'].items()):
                    content += f"- {num} {choice}\n"
                content += "\n"
            
            content += f"**정답**: {q['answer']}\n\n"
            content += f"**해설**: {q['explanation']}\n\n"
            
            if q['keywords']:
                content += f"**키워드**: {', '.join(q['keywords'])}\n\n"
            
            content += f"*페이지: {q['page']}*\n\n"
            content += "---\n\n"
        
        # 실패한 페이지 정보
        if self.failed_pages:
            content += "## 처리 실패 페이지\n\n"
            for failed in self.failed_pages:
                content += f"- 페이지 {failed['page']}: {failed['error']}\n"
        
        # 파일 저장
        with open(self.output_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        logger.info(f"결과 저장 완료: {self.output_path}")

def main():
    """메인 함수"""
    # 처리할 PDF 파일 목록
    pdf_files = [
        {
            'input': '/Users/voidlight/Downloads/[Codekiller]제5회 기출문제 해설집(v1.0).pdf',
            'output': '/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-5th-ocr.md'
        },
        {
            'input': '/Users/voidlight/Downloads/[Codekiller]제6회 기출문제 해설집(v1.0).pdf',
            'output': '/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-6th-ocr.md'
        },
        {
            'input': '/Users/voidlight/Downloads/[Codekiller]제7회 기출문제 해설집(v1.0).pdf',
            'output': '/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-7th-ocr.md'
        }
    ]
    
    # 결과 요약
    results = []
    
    for file_info in pdf_files:
        if not os.path.exists(file_info['input']):
            logger.error(f"파일을 찾을 수 없습니다: {file_info['input']}")
            continue
        
        try:
            parser = TreeDoctorExamParser(file_info['input'], file_info['output'])
            result = parser.process_pdf()
            results.append(result)
            
            logger.info(f"처리 완료: 제{result['exam_round']}회 - {result['total_questions']}문제 추출")
            
        except Exception as e:
            logger.error(f"처리 실패: {file_info['input']} - {e}")
            results.append({
                'exam_round': 'Unknown',
                'error': str(e),
                'input_file': file_info['input']
            })
    
    # 최종 보고서 생성
    report_path = '/Users/voidlight/tree-doctor-pdf-qa-mcp/data/ocr_processing_report.json'
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    logger.info(f"처리 보고서 저장: {report_path}")
    
    # 요약 출력
    print("\n=== OCR 처리 결과 요약 ===")
    for result in results:
        if 'error' in result:
            print(f"❌ 제{result['exam_round']}회: 처리 실패 - {result['error']}")
        else:
            print(f"✅ 제{result['exam_round']}회: {result['total_questions']}문제 추출")
            if result['failed_pages']:
                print(f"   ⚠️  실패 페이지: {len(result['failed_pages'])}개")

if __name__ == "__main__":
    # io 모듈 임포트 (BytesIO 사용)
    import io
    main()