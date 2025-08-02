#!/usr/bin/env python3
"""
고급 PDF OCR 추출기
markitdown과 여러 OCR 기법을 활용한 정확한 문제 추출
"""

import os
import re
import json
import sqlite3
from pathlib import Path
from markitdown import MarkItDown

class PDFOCRExtractor:
    def __init__(self):
        self.project_root = Path(__file__).parent.parent
        self.data_dir = self.project_root / "data"
        self.db_path = self.project_root / "tree-doctor-pdf-qa.db"
        self.markitdown = MarkItDown()
        
    def extract_pdf_text(self, pdf_path):
        """PDF를 markitdown으로 텍스트 추출"""
        print(f"📄 PDF 처리 중: {pdf_path.name}")
        
        try:
            result = self.markitdown.convert(str(pdf_path))
            text = result.text_content
            
            # 변환된 텍스트 저장
            output_path = pdf_path.with_suffix('.extracted.md')
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(text)
            
            print(f"✅ 텍스트 추출 완료: {output_path.name}")
            return text
        except Exception as e:
            print(f"❌ PDF 추출 실패: {e}")
            return None
    
    def clean_text(self, text):
        """OCR 텍스트 정리"""
        # 일반적인 OCR 오류 수정
        corrections = {
            '①': '①', '②': '②', '③': '③', '④': '④', '⑤': '⑤',
            '©': '①', '®': '②', 'º': '③', '¼': '④', '½': '⑤',
            '０': '0', '１': '1', '２': '2', '３': '3', '４': '4',
            '５': '5', '６': '6', '７': '7', '８': '8', '９': '9',
            '。': '.', '、': ',', '）': ')', '（': '(',
            '：': ':', '；': ';', '？': '?', '！': '!',
        }
        
        for wrong, correct in corrections.items():
            text = text.replace(wrong, correct)
        
        # 불필요한 공백 정리
        text = re.sub(r'\s+', ' ', text)
        text = re.sub(r'\n{3,}', '\n\n', text)
        
        return text
    
    def parse_questions(self, text, exam_year):
        """문제 파싱"""
        questions = []
        
        # 문제 패턴들
        patterns = [
            r'(\d{1,3})\.\s*([^①②③④⑤]+?)(?=①)',  # 1. 문제내용 ①
            r'문제\s*(\d{1,3})[.)\s]*([^①②③④⑤]+?)(?=①)',  # 문제 1. 내용 ①
            r'(\d{1,3})\)\s*([^①②③④⑤]+?)(?=①)',  # 1) 내용 ①
            r'【(\d{1,3})】\s*([^①②③④⑤]+?)(?=①)',  # 【1】 내용 ①
            r'Q(\d{1,3})[.)\s]*([^①②③④⑤]+?)(?=①)',  # Q1. 내용 ①
        ]
        
        # 선택지 패턴
        choice_pattern = r'([①②③④⑤])\s*([^①②③④⑤]+?)(?=[①②③④⑤]|$|정답|해설|\d{1,3}[.)])'
        
        for pattern in patterns:
            matches = re.finditer(pattern, text, re.DOTALL)
            
            for match in matches:
                q_num = int(match.group(1))
                if 1 <= q_num <= 150:
                    q_text = match.group(2).strip()
                    
                    # 선택지 추출
                    remaining_text = text[match.end():]
                    choices = {}
                    
                    choice_matches = re.finditer(choice_pattern, remaining_text, re.DOTALL)
                    for choice_match in choice_matches:
                        choice_num = self.normalize_choice_number(choice_match.group(1))
                        choice_text = choice_match.group(2).strip()
                        
                        if choice_num and len(choice_text) > 1:
                            choices[choice_num] = choice_text
                        
                        if len(choices) >= 5:  # 최대 5개 선택지
                            break
                    
                    if len(choices) >= 4:  # 최소 4개 선택지
                        question = {
                            'number': q_num,
                            'text': self.clean_text(q_text),
                            'choices': choices,
                            'exam_year': exam_year,
                            'subject': self.detect_subject(q_text)
                        }
                        questions.append(question)
        
        # 중복 제거
        seen_numbers = set()
        unique_questions = []
        for q in questions:
            if q['number'] not in seen_numbers:
                seen_numbers.add(q['number'])
                unique_questions.append(q)
        
        return sorted(unique_questions, key=lambda x: x['number'])
    
    def normalize_choice_number(self, num):
        """선택지 번호 정규화"""
        mapping = {
            '①': 1, '②': 2, '③': 3, '④': 4, '⑤': 5,
            '1': 1, '2': 2, '3': 3, '4': 4, '5': 5,
            '⑴': 1, '⑵': 2, '⑶': 3, '⑷': 4, '⑸': 5,
        }
        return mapping.get(num)
    
    def detect_subject(self, text):
        """과목 분류"""
        subjects = {
            '수목병리학': ['병원체', '병원균', '감염', '세균', '바이러스', '진균', '곰팡이', 
                      '병해', '살균제', '병징', '병반', '흰가루병', '탄저병', '마름병'],
            '수목해충학': ['해충', '곤충', '천적', '유충', '번데기', '성충', '살충제', 
                      '천공', '가해', '나방', '딱정벌레', '진딧물', '깍지벌레'],
            '수목생리학': ['광합성', '호흡', '증산', '영양', '생장', '식물호르몬', 
                      '굴광성', '굴지성', '옥신', '지베렐린', '시토키닌'],
            '수목관리학': ['전정', '시비', '관리', '진단', '식재', '이식', '멀칭', 
                      '전지', '가지치기', '병충해방제', '수목진단'],
            '토양학': ['토양', 'pH', '양분', '비료', '유기물', '배수', '통기성', 
                   '양이온교환', '부식', '토성'],
            '임업일반': ['산림', '조림', '벌채', '갱신', '임분', '임목', '천연갱신', 
                    '인공조림', '육림', '산림경영']
        }
        
        for subject, keywords in subjects.items():
            if any(keyword in text for keyword in keywords):
                return subject
        
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
                print(f"💾 {saved}개 저장 중...")
        
        conn.commit()
        conn.close()
        
        print(f"\n✅ 저장 완료: {saved}개 추가, {skipped}개 중복 제외")
        return saved, skipped
    
    def show_stats(self):
        """통계 표시"""
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
        """PDF 처리"""
        print(f"\n📚 {exam_year}회차 처리 시작...")
        
        # PDF 텍스트 추출
        text = self.extract_pdf_text(pdf_path)
        if not text:
            return 0, 0
        
        # 텍스트 정리
        text = self.clean_text(text)
        
        # 문제 파싱
        questions = self.parse_questions(text, exam_year)
        print(f"🔍 {len(questions)}개 문제 추출됨")
        
        # 데이터베이스 저장
        saved, skipped = self.save_to_database(questions)
        
        # JSON 파일로도 저장
        output_json = pdf_path.with_suffix('.questions.json')
        with open(output_json, 'w', encoding='utf-8') as f:
            json.dump(questions, f, ensure_ascii=False, indent=2)
        
        return saved, skipped
    
    def run(self):
        """실행"""
        print("🚀 PDF OCR 추출기 시작...\n")
        
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
    extractor = PDFOCRExtractor()
    extractor.run()