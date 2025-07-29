#!/usr/bin/env python3
"""
제9회 나무의사 시험 문제 정제 스크립트 v2
더 정확한 문제 추출과 품질 개선
"""

import re
import os
from collections import defaultdict
from difflib import SequenceMatcher
import unicodedata

class ExamQuestionRefinerV2:
    def __init__(self):
        self.questions = []
        self.ocr_corrections = {
            # 일반적인 OCR 오류
            '뮤효': '유효',
            '몬도': '온도',
            '발육영점몬도': '발육영점온도',
            '온일도': '일도',
            '6ㅎ': 'day',
            'ㅁ|': 'DD',
            '승': '°C',
            'OlCt': '이다',
            '해중': '해충',
            '문제메서': '문제에서',
            'SLIG RS': '수목에',
            'LEP AA\| Ba': '배추좀나방',
            '&': 'A',
            ':::': '여기서',
            'ak': '는',
            'bE': '는',
            'FHS': '즙을',
            'CHS': '곤충이',
            'SUNS': '종자전염',
            'SEASS': '곤충이',
            'SSRs': '생활사',
            'AS': '많은',
            'Ct': '단',
            'WD': '뚫고',
            'BS': '월동',
            '0um': 'μm',
            '007': 'μm',
            'SAO]': '증상이',
            '20]': '주로',
            # 단어 분리 오류
            '분샘포자': '분생포자',
            '흡즘성곤충': '흡즙성곤충',
            '내병정품종': '내병성품종',
            '분생포쟈각': '분생포자각',
            '목대형아따': '막대형이며',
            '여라-개와-세포': '여러 개의 세포',
            '컴은무늬병': '검은무늬병',
            # 기타
            '찾은': '많은',
            '5~6&월': '5~6월',
        }
        
    def clean_text(self, text):
        """OCR 오류 수정 및 텍스트 정리"""
        if not text:
            return ""
            
        # Unicode 정규화
        text = unicodedata.normalize('NFKC', text)
        
        # OCR 교정
        for wrong, correct in self.ocr_corrections.items():
            text = text.replace(wrong, correct)
            
        # 잘못된 띄어쓰기 수정
        text = re.sub(r'([가-힣])([A-Z])', r'\1 \2', text)
        text = re.sub(r'([a-z])([가-힣])', r'\1 \2', text)
        
        # 특수문자 주변 공백 정리
        text = re.sub(r'\s*([.,!?:;])\s*', r'\1 ', text)
        text = re.sub(r'\s*([()])\s*', r' \1 ', text)
        
        # 중복 공백 제거
        text = re.sub(r'\s+', ' ', text)
        text = text.strip()
        
        return text
    
    def is_valid_question_content(self, content):
        """유효한 문제 내용인지 확인"""
        if not content:
            return False
            
        # 너무 짧은 내용
        if len(content) < 10:
            return False
            
        # 의미없는 문자열
        invalid_patterns = [
            r'^[0-9\s\-/|\\]+$',  # 숫자와 기호만
            r'^[a-zA-Z\s]+$',     # 영문자만
            r'^[\s\W]+$',         # 공백과 특수문자만
            r'^0+\w*$',           # 0으로 시작하는 이상한 패턴
            r'^\d+\s*/\s*\d+$',   # 숫자/숫자 패턴
        ]
        
        for pattern in invalid_patterns:
            if re.match(pattern, content):
                return False
                
        # 최소한의 한글 포함 여부
        if not re.search(r'[가-힣]{2,}', content):
            return False
            
        return True
    
    def extract_questions_improved(self, content):
        """개선된 문제 추출 방법"""
        lines = content.split('\n')
        current_question = None
        in_question_block = False
        question_text_buffer = []
        
        for i, line in enumerate(lines):
            line = line.strip()
            
            # 새로운 문제 시작
            if line.startswith('## 문제'):
                # 이전 문제 저장
                if current_question and question_text_buffer:
                    full_text = ' '.join(question_text_buffer)
                    current_question['content'] = self.clean_text(full_text)
                    
                    if self.is_valid_question_content(current_question['content']):
                        self.questions.append(current_question)
                
                # 새 문제 초기화
                match = re.search(r'문제\s*(\d+)', line)
                question_num = int(match.group(1)) if match else 0
                
                current_question = {
                    'number': question_num,
                    'content': '',
                    'choices': [],
                    'answer': '',
                    'explanation': '',
                    'keywords': [],
                    'line_num': i + 1
                }
                question_text_buffer = []
                in_question_block = True
                
            elif in_question_block and line.startswith('---'):
                # 문제 블록 종료
                if current_question and question_text_buffer:
                    full_text = ' '.join(question_text_buffer)
                    current_question['content'] = self.clean_text(full_text)
                    
                    if self.is_valid_question_content(current_question['content']):
                        self.questions.append(current_question)
                
                current_question = None
                question_text_buffer = []
                in_question_block = False
                
            elif in_question_block and current_question:
                # 문제 내용 처리
                if line.startswith('**문제**:'):
                    text = line.replace('**문제**:', '').strip()
                    if text:
                        question_text_buffer.append(text)
                        
                elif line.startswith('**정답**:'):
                    current_question['answer'] = self.clean_text(line.replace('**정답**:', '').strip())
                    
                elif line.startswith('**해설**:'):
                    current_question['explanation'] = self.clean_text(line.replace('**해설**:', '').strip())
                    
                elif line.startswith('**키워드**:'):
                    keywords = line.replace('**키워드**:', '').strip()
                    current_question['keywords'] = [k.strip() for k in keywords.split(',') if k.strip()]
                    
                elif line and not line.startswith('**'):
                    # 선택지 또는 추가 문제 내용
                    if re.match(r'^[①②③④⑤\(\d\)]\s*', line):
                        current_question['choices'].append(self.clean_text(line))
                    else:
                        # 문제 내용의 연속
                        question_text_buffer.append(line)
        
        # 마지막 문제 처리
        if current_question and question_text_buffer:
            full_text = ' '.join(question_text_buffer)
            current_question['content'] = self.clean_text(full_text)
            
            if self.is_valid_question_content(current_question['content']):
                self.questions.append(current_question)
    
    def calculate_quality_score_v2(self, question):
        """개선된 품질 점수 계산"""
        score = 0
        
        content = question['content']
        content_len = len(content)
        
        # 기본 내용 점수 (40점)
        if content_len >= 50:
            score += 40
        elif content_len >= 30:
            score += 30
        elif content_len >= 20:
            score += 20
        elif content_len >= 10:
            score += 10
        
        # 문제 구조 완성도 (30점)
        if question['choices'] and len(question['choices']) >= 4:
            score += 15
        if question['answer']:
            score += 10
        if question['explanation'] and len(question['explanation']) > 10:
            score += 5
        
        # 키워드 품질 (10점)
        if question['keywords']:
            score += 5
            if len(question['keywords']) >= 2:
                score += 5
        
        # 내용 품질 (20점)
        # 전문 용어 포함
        technical_terms = ['나무', '수목', '병원균', '해충', '발육', '온도', '토양', '뿌리', '잎', '가지', 
                          '병해', '충해', '방제', '살균제', '살충제', '진단', '치료', '전정', '시비']
        term_count = sum(1 for term in technical_terms if term in content)
        score += min(10, term_count * 2)
        
        # 문장 완성도
        if re.search(r'[.?!]$', content):
            score += 5
        if re.search(r'^[가-힣A-Z]', content):
            score += 5
        
        # 감점 요소
        # OCR 오류 흔적
        error_patterns = ['0]', '01x', '^^', '|||', 'ㅎㅎ', 'ㅁ|', '@@', '##']
        for pattern in error_patterns:
            if pattern in content:
                score -= 5
        
        # 문제 번호 0
        if question['number'] == 0:
            score -= 10
        
        # 너무 짧은 내용
        if content_len < 15:
            score -= 20
        
        return max(0, min(100, score))
    
    def remove_duplicates_v2(self):
        """개선된 중복 제거"""
        unique_questions = []
        seen_contents = set()
        
        for q in self.questions:
            # 내용 정규화
            normalized = re.sub(r'[^가-힣a-zA-Z0-9]', '', q['content'].lower())[:100]
            
            if not normalized:
                continue
                
            # 완전 중복 체크
            if normalized in seen_contents:
                continue
                
            # 유사도 체크
            is_duplicate = False
            for unique_q in unique_questions:
                unique_normalized = re.sub(r'[^가-힣a-zA-Z0-9]', '', unique_q['content'].lower())[:100]
                
                similarity = SequenceMatcher(None, normalized, unique_normalized).ratio()
                if similarity > 0.85:  # 85% 이상 유사하면 중복으로 간주
                    is_duplicate = True
                    break
            
            if not is_duplicate:
                seen_contents.add(normalized)
                unique_questions.append(q)
        
        self.questions = unique_questions
    
    def select_top_150(self):
        """상위 150개 문제 선별"""
        # 품질 점수 계산
        for q in self.questions:
            q['quality_score'] = self.calculate_quality_score_v2(q)
        
        # 점수순 정렬
        self.questions.sort(key=lambda x: (x['quality_score'], len(x['content'])), reverse=True)
        
        # 상위 150개 선택
        selected = self.questions[:150]
        
        # 새 번호 부여 (1-150)
        for i, q in enumerate(selected, 1):
            q['new_number'] = i
        
        return selected
    
    def format_output(self, questions):
        """최종 마크다운 출력 형식"""
        output = []
        output.append("# 제9회 나무의사 자격시험 정제 문제집")
        output.append("")
        output.append("**총 문제 수**: 150개")
        output.append("**정제 일시**: 2025-07-29")
        output.append("**정제 내용**: OCR 오류 수정, 중복 제거, 품질 기준 선별")
        output.append("")
        output.append("## 품질 점수 분포")
        
        scores = [q['quality_score'] for q in questions]
        score_ranges = {
            '90-100': sum(1 for s in scores if 90 <= s <= 100),
            '80-89': sum(1 for s in scores if 80 <= s < 90),
            '70-79': sum(1 for s in scores if 70 <= s < 80),
            '60-69': sum(1 for s in scores if 60 <= s < 70),
            '50-59': sum(1 for s in scores if 50 <= s < 60),
            '50 미만': sum(1 for s in scores if s < 50),
        }
        
        for range_name, count in score_ranges.items():
            output.append(f"- {range_name}점: {count}문제")
        
        output.append(f"- 평균 점수: {sum(scores) / len(scores):.1f}점")
        output.append("")
        output.append("---")
        output.append("")
        
        for q in questions:
            output.append(f"## 문제 {q['new_number']}")
            output.append("")
            output.append(f"**문제**: {q['content']}")
            output.append("")
            
            if q['choices']:
                for choice in q['choices']:
                    output.append(choice)
                output.append("")
            
            if q['answer']:
                output.append(f"**정답**: {q['answer']}")
                output.append("")
            
            if q['explanation']:
                output.append(f"**해설**: {q['explanation']}")
                output.append("")
            
            if q['keywords']:
                output.append(f"**키워드**: {', '.join(q['keywords'])}")
                output.append("")
            
            output.append(f"*품질점수: {q['quality_score']}/100*")
            output.append("")
            output.append("---")
            output.append("")
        
        return '\n'.join(output)
    
    def process(self, input_path, output_path):
        """전체 처리 프로세스"""
        print("=" * 60)
        print("제9회 나무의사 시험 문제 정제 v2.0")
        print("=" * 60)
        
        print("\n1. 파일 읽기...")
        with open(input_path, 'r', encoding='utf-8') as f:
            content = f.read()
        print(f"   파일 크기: {len(content):,} 문자")
        
        print("\n2. 문제 추출 (개선된 방법)...")
        self.extract_questions_improved(content)
        print(f"   추출된 문제: {len(self.questions)}개")
        
        print("\n3. 중복 제거...")
        original_count = len(self.questions)
        self.remove_duplicates_v2()
        print(f"   제거된 중복: {original_count - len(self.questions)}개")
        print(f"   남은 문제: {len(self.questions)}개")
        
        print("\n4. 품질 평가 및 상위 150개 선별...")
        selected = self.select_top_150()
        print(f"   선별된 문제: {len(selected)}개")
        
        print("\n5. 최종 마크다운 생성...")
        output_content = self.format_output(selected)
        
        print("\n6. 파일 저장...")
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(output_content)
        
        print(f"\n✅ 완료! {output_path}에 저장되었습니다.")
        
        # 상세 통계
        print("\n" + "=" * 60)
        print("상세 통계")
        print("=" * 60)
        
        scores = [q['quality_score'] for q in selected]
        print(f"품질 점수:")
        print(f"  - 최고: {max(scores)}점")
        print(f"  - 최저: {min(scores)}점")
        print(f"  - 평균: {sum(scores) / len(scores):.1f}점")
        
        with_choices = sum(1 for q in selected if q['choices'])
        with_answer = sum(1 for q in selected if q['answer'])
        with_explanation = sum(1 for q in selected if q['explanation'])
        with_keywords = sum(1 for q in selected if q['keywords'])
        
        print(f"\n구성 요소:")
        print(f"  - 선택지 포함: {with_choices}문제 ({with_choices/len(selected)*100:.1f}%)")
        print(f"  - 정답 포함: {with_answer}문제 ({with_answer/len(selected)*100:.1f}%)")
        print(f"  - 해설 포함: {with_explanation}문제 ({with_explanation/len(selected)*100:.1f}%)")
        print(f"  - 키워드 포함: {with_keywords}문제 ({with_keywords/len(selected)*100:.1f}%)")

if __name__ == "__main__":
    refiner = ExamQuestionRefinerV2()
    
    input_path = "/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-9th-complete.md"
    output_path = "/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-9th-final-150.md"
    
    refiner.process(input_path, output_path)