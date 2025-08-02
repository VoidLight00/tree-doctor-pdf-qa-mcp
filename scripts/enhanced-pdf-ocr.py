#!/usr/bin/env python3
"""
향상된 PDF OCR 추출기
여러 라이브러리를 조합한 최적화된 문제 추출
"""

import os
import re
import json
import sqlite3
from pathlib import Path
import pdfplumber
import pytesseract
from PIL import Image
import fitz  # PyMuPDF
from pdf2image import convert_from_path

class EnhancedPDFOCR:
    def __init__(self):
        self.project_root = Path(__file__).parent.parent
        self.data_dir = self.project_root / "data"
        self.db_path = self.project_root / "tree-doctor-pdf-qa.db"
        self.temp_dir = self.project_root / "temp_ocr"
        self.temp_dir.mkdir(exist_ok=True)
        
    def extract_with_pdfplumber(self, pdf_path):
        """pdfplumber로 텍스트 추출"""
        print("📖 pdfplumber로 추출 중...")
        text = ""
        
        try:
            with pdfplumber.open(pdf_path) as pdf:
                for i, page in enumerate(pdf.pages):
                    page_text = page.extract_text()
                    if page_text:
                        text += f"\n\n--- 페이지 {i+1} ---\n\n"
                        text += page_text
        except Exception as e:
            print(f"⚠️ pdfplumber 오류: {e}")
        
        return text
    
    def extract_with_pymupdf(self, pdf_path):
        """PyMuPDF로 텍스트 추출"""
        print("📖 PyMuPDF로 추출 중...")
        text = ""
        
        try:
            pdf = fitz.open(pdf_path)
            for i, page in enumerate(pdf):
                page_text = page.get_text()
                if page_text:
                    text += f"\n\n--- 페이지 {i+1} ---\n\n"
                    text += page_text
            pdf.close()
        except Exception as e:
            print(f"⚠️ PyMuPDF 오류: {e}")
        
        return text
    
    def extract_with_ocr(self, pdf_path):
        """PDF를 이미지로 변환 후 OCR"""
        print("🔍 OCR로 추출 중...")
        text = ""
        
        try:
            # PDF를 이미지로 변환
            images = convert_from_path(str(pdf_path), dpi=300)
            
            for i, image in enumerate(images):
                print(f"  페이지 {i+1}/{len(images)} OCR 처리 중...")
                
                # 이미지 전처리
                image = image.convert('L')  # 그레이스케일 변환
                
                # OCR 수행
                page_text = pytesseract.image_to_string(image, lang='kor')
                if page_text:
                    text += f"\n\n--- 페이지 {i+1} ---\n\n"
                    text += page_text
        except Exception as e:
            print(f"⚠️ OCR 오류: {e}")
        
        return text
    
    def combine_extractions(self, pdf_path):
        """여러 방법을 조합하여 최적의 텍스트 추출"""
        print(f"\n📄 PDF 처리: {pdf_path.name}")
        
        # 1. pdfplumber 시도
        text1 = self.extract_with_pdfplumber(pdf_path)
        
        # 2. PyMuPDF 시도
        text2 = self.extract_with_pymupdf(pdf_path)
        
        # 3. 텍스트가 부족하면 OCR 시도
        if len(text1) < 1000 and len(text2) < 1000:
            print("⚠️ 일반 추출 결과 부족, OCR 시도...")
            text3 = self.extract_with_ocr(pdf_path)
            return text3
        
        # 가장 긴 텍스트 선택
        return text1 if len(text1) > len(text2) else text2
    
    def clean_text(self, text):
        """텍스트 정리 및 OCR 오류 수정"""
        # OCR 오류 패턴 수정
        corrections = {
            # 번호 관련
            '①': '①', '②': '②', '③': '③', '④': '④', '⑤': '⑤',
            '©': '①', '®': '②', 'º': '③', '¼': '④', '½': '⑤',
            '(1)': '①', '(2)': '②', '(3)': '③', '(4)': '④', '(5)': '⑤',
            
            # 한글 오류
            '뮤효': '유효', '몬도': '온도', '트레스': '스트레스',
            '시러': '실러', '칠엽': '칠엽', '근두암총병': '근두암종병',
            
            # 특수문자 정리
            '–': '-', '—': '-', '"': '"', '"': '"', ''': "'", ''': "'",
            '…': '...', '･': '·',
        }
        
        for wrong, correct in corrections.items():
            text = text.replace(wrong, correct)
        
        # 불필요한 공백 정리
        text = re.sub(r'\s+', ' ', text)
        text = re.sub(r'\n{3,}', '\n\n', text)
        
        return text
    
    def extract_questions(self, text, exam_year):
        """문제 추출 (개선된 패턴)"""
        questions = []
        
        # 페이지별로 처리
        pages = text.split('--- 페이지')
        
        for page_text in pages:
            # 문제 번호 찾기 - 다양한 패턴
            patterns = [
                # 기본 패턴
                r'(\d{1,3})\.\s*([^①②③④⑤\n]+)',
                r'(\d{1,3})\)\s*([^①②③④⑤\n]+)',
                r'문제\s*(\d{1,3})[.)\s]*([^①②③④⑤\n]+)',
                
                # 특수 패턴
                r'【\s*(\d{1,3})\s*】\s*([^①②③④⑤\n]+)',
                r'Q(\d{1,3})[.)\s]*([^①②③④⑤\n]+)',
                r'\[(\d{1,3})\]\s*([^①②③④⑤\n]+)',
            ]
            
            for pattern in patterns:
                matches = list(re.finditer(pattern, page_text, re.MULTILINE))
                
                for i, match in enumerate(matches):
                    q_num = int(match.group(1))
                    if 1 <= q_num <= 150:
                        # 문제 텍스트 추출
                        q_text = match.group(2).strip()
                        
                        # 다음 문제까지의 텍스트 찾기
                        start_pos = match.end()
                        if i + 1 < len(matches):
                            end_pos = matches[i + 1].start()
                        else:
                            end_pos = len(page_text)
                        
                        full_text = page_text[start_pos:end_pos]
                        
                        # 선택지 추출
                        choices = self.extract_choices(full_text)
                        
                        if len(choices) >= 4:
                            question = {
                                'number': q_num,
                                'text': self.clean_text(q_text),
                                'choices': choices,
                                'exam_year': exam_year,
                                'subject': self.detect_subject(q_text)
                            }
                            questions.append(question)
        
        # 중복 제거 및 정렬
        unique_questions = {}
        for q in questions:
            if q['number'] not in unique_questions:
                unique_questions[q['number']] = q
        
        return sorted(unique_questions.values(), key=lambda x: x['number'])
    
    def extract_choices(self, text):
        """선택지 추출"""
        choices = {}
        
        # 선택지 패턴들
        patterns = [
            r'([①②③④⑤])\s*([^①②③④⑤\n]+)',
            r'([1-5])[.)]\s*([^1-5\n]+)',
            r'\(([1-5])\)\s*([^\(\)\n]+)',
        ]
        
        for pattern in patterns:
            matches = re.finditer(pattern, text)
            for match in matches:
                choice_num = self.normalize_choice_number(match.group(1))
                choice_text = match.group(2).strip()
                
                if choice_num and len(choice_text) > 2:
                    # 정답이나 해설 부분 제거
                    if not re.search(r'정답|해설|답안|설명', choice_text[:10]):
                        choices[choice_num] = choice_text
                
                if len(choices) >= 5:
                    break
        
        return choices
    
    def normalize_choice_number(self, num):
        """선택지 번호 정규화"""
        mapping = {
            '①': 1, '②': 2, '③': 3, '④': 4, '⑤': 5,
            '1': 1, '2': 2, '3': 3, '4': 4, '5': 5,
            '⑴': 1, '⑵': 2, '⑶': 3, '⑷': 4, '⑸': 5,
        }
        return mapping.get(num)
    
    def detect_subject(self, text):
        """과목 분류 (키워드 기반)"""
        subjects = {
            '수목병리학': ['병원체', '병원균', '감염', '세균', '바이러스', '진균', '곰팡이', 
                      '병해', '살균제', '병징', '병반', '흰가루병', '탄저병', '마름병',
                      '잎마름병', '줄기썩음병', '뿌리썩음병', '시들음병'],
            '수목해충학': ['해충', '곤충', '천적', '유충', '번데기', '성충', '살충제', 
                      '천공', '가해', '나방', '딱정벌레', '진딧물', '깍지벌레',
                      '응애', '나무좀', '하늘소', '바구미'],
            '수목생리학': ['광합성', '호흡', '증산', '영양', '생장', '식물호르몬', 
                      '굴광성', '굴지성', '옥신', '지베렐린', '시토키닌', '에틸렌',
                      'ABA', '앱시스산', '기공', '물관', '체관'],
            '수목관리학': ['전정', '시비', '관리', '진단', '식재', '이식', '멀칭', 
                      '전지', '가지치기', '병충해방제', '수목진단', '토양개량',
                      '지주대', '관수', '월동'],
            '토양학': ['토양', 'pH', '양분', '비료', '유기물', '배수', '통기성', 
                   '양이온교환', '부식', '토성', '입단', '공극', '용적밀도'],
            '임업일반': ['산림', '조림', '벌채', '갱신', '임분', '임목', '천연갱신', 
                    '인공조림', '육림', '산림경영', '임령', '수확', '간벌']
        }
        
        # 각 과목별 점수 계산
        scores = {}
        for subject, keywords in subjects.items():
            score = sum(1 for keyword in keywords if keyword in text)
            if score > 0:
                scores[subject] = score
        
        # 가장 높은 점수의 과목 반환
        if scores:
            return max(scores, key=scores.get)
        
        return '미분류'
    
    def save_to_database(self, questions):
        """데이터베이스에 저장"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        saved = 0
        skipped = 0
        
        for q in questions:
            # 중복 확인
            cursor.execute(
                "SELECT id FROM exam_questions WHERE exam_year = ? AND question_number = ?",
                (q['exam_year'], q['number'])
            )
            
            if cursor.fetchone():
                skipped += 1
                continue
            
            try:
                # 문제 저장
                cursor.execute("""
                    INSERT INTO exam_questions (
                        exam_year, exam_round, question_number, subject,
                        question_text, question_type, points, is_incomplete
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    q['exam_year'], 1, q['number'], q['subject'],
                    q['text'], 'multiple_choice', 1, 0
                ))
                
                question_id = cursor.lastrowid
                
                # 선택지 저장
                for num, text in q['choices'].items():
                    cursor.execute("""
                        INSERT INTO exam_choices (
                            question_id, choice_number, choice_text, is_correct
                        ) VALUES (?, ?, ?, ?)
                    """, (question_id, num, text, 0))
                
                saved += 1
                
                if saved % 10 == 0:
                    conn.commit()
                    print(f"💾 {saved}개 저장 중...")
                    
            except Exception as e:
                print(f"⚠️ 문제 {q['number']} 저장 오류: {e}")
        
        conn.commit()
        conn.close()
        
        print(f"\n✅ 저장 완료: {saved}개 추가, {skipped}개 중복 제외")
        return saved, skipped
    
    def show_stats(self):
        """데이터베이스 통계 표시"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT exam_year, COUNT(*) as count 
            FROM exam_questions 
            GROUP BY exam_year 
            ORDER BY exam_year
        """)
        
        print("\n📊 현재 데이터베이스 상태:")
        print("━" * 40)
        
        total = 0
        for row in cursor.fetchall():
            percent = (row[1] / 150) * 100
            print(f"{row[0]}회차: {row[1]}/150 ({percent:.1f}%)")
            total += row[1]
        
        print("━" * 40)
        print(f"전체: {total}/750 문제")
        print()
        
        conn.close()
    
    def process_pdf(self, pdf_path, exam_year):
        """PDF 파일 처리"""
        print(f"\n🎯 {exam_year}회차 처리 시작...")
        
        # 텍스트 추출
        text = self.combine_extractions(pdf_path)
        
        # 텍스트 저장
        output_txt = pdf_path.with_suffix('.extracted.txt')
        with open(output_txt, 'w', encoding='utf-8') as f:
            f.write(text)
        print(f"📝 텍스트 저장: {output_txt.name}")
        
        # 문제 추출
        questions = self.extract_questions(text, exam_year)
        print(f"🔍 {len(questions)}개 문제 추출됨")
        
        # JSON 저장
        output_json = pdf_path.with_suffix('.questions.json')
        with open(output_json, 'w', encoding='utf-8') as f:
            json.dump(questions, f, ensure_ascii=False, indent=2)
        print(f"📋 JSON 저장: {output_json.name}")
        
        # 데이터베이스 저장
        saved, skipped = self.save_to_database(questions)
        
        return saved, skipped
    
    def run(self):
        """실행"""
        print("🚀 향상된 PDF OCR 추출기 시작...\n")
        
        self.show_stats()
        
        # PDF 파일 목록
        pdfs = [
            ('제11회 나무의사 자격시험 1차 시험지.pdf', 11),
            ('exam-10th.pdf', 10),
        ]
        
        total_saved = 0
        total_skipped = 0
        
        for pdf_name, exam_year in pdfs:
            pdf_path = self.data_dir / pdf_name
            if pdf_path.exists():
                saved, skipped = self.process_pdf(pdf_path, exam_year)
                total_saved += saved
                total_skipped += skipped
            else:
                print(f"⚠️ 파일 없음: {pdf_path}")
        
        print(f"\n📊 전체 결과:")
        print(f"총 {total_saved}개 추가, {total_skipped}개 중복 제외")
        
        self.show_stats()
        print("✅ 추출 완료!")

if __name__ == "__main__":
    extractor = EnhancedPDFOCR()
    extractor.run()