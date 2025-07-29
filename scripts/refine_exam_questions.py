#!/usr/bin/env python3
"""
제9회 나무의사 시험 문제 정제 스크립트
272개 문제를 150개로 정제하고 품질 개선
"""

import re
import os
from collections import defaultdict
from difflib import SequenceMatcher
import unicodedata

class ExamQuestionRefiner:
    def __init__(self):
        self.questions = []
        self.ocr_patterns = {
            # OCR 오류 패턴과 수정값
            r'뮤효': '유효',
            r'몬도': '온도',
            r'발육영점몬도': '발육영점온도',
            r'온일도': '일도',
            r'6ㅎ': 'day',
            r'ㅁ|': 'DD',
            r'승': '°C',
            r'OlCt': '이다',
            r'해중': '해충',
            r'문제메서': '문제에서',
            r'SLIG RS': '수목에',
            r'LEP AA\| Ba': '배추좀나방',
            r'&': 'A',
            r':::': '여기서',
            r'ak': '는',
            r'bE': '는',
            r'\s+': ' ',  # 중복 공백 제거
            r'^\s+|\s+$': '',  # 앞뒤 공백 제거
        }
        
    def clean_text(self, text):
        """OCR 오류 수정 및 텍스트 정리"""
        if not text:
            return ""
            
        # Unicode 정규화
        text = unicodedata.normalize('NFKC', text)
        
        # DD 제거 (잘못된 처리로 인한 문제)
        text = text.replace('DD', '')
        
        # OCR 패턴 수정
        for pattern, replacement in self.ocr_patterns.items():
            text = re.sub(pattern, replacement, text)
            
        # 특수문자 정리 - 한글, 영문, 숫자, 기본 특수문자만 유지
        text = re.sub(r'[^\w\s가-힣a-zA-Z0-9°.,!?(){}[\]<>~@#$%^&*+=\-_/\\:;\'"`①②③④⑤]', ' ', text)
        text = re.sub(r'\s+', ' ', text)
        text = text.strip()
        
        return text
    
    def extract_questions(self, content):
        """마크다운에서 문제 추출"""
        lines = content.split('\n')
        current_question = None
        
        for i, line in enumerate(lines):
            if line.startswith('## 문제'):
                if current_question and current_question.get('content'):
                    self.questions.append(current_question)
                    
                # 문제 번호 추출
                match = re.search(r'문제\s*(\d+)', line)
                question_num = int(match.group(1)) if match else 0
                current_question = {
                    'number': question_num,
                    'content': '',
                    'choices': [],
                    'answer': '',
                    'explanation': '',
                    'keywords': [],
                    'raw_text': '',
                    'line_start': i
                }
                
            elif current_question is not None:
                if line.startswith('**문제**:'):
                    content_text = line.replace('**문제**:', '').strip()
                    current_question['content'] = self.clean_text(content_text)
                    current_question['raw_text'] += line + '\n'
                elif line.startswith('**정답**:'):
                    current_question['answer'] = line.replace('**정답**:', '').strip()
                    current_question['raw_text'] += line + '\n'
                elif line.startswith('**해설**:'):
                    current_question['explanation'] = self.clean_text(line.replace('**해설**:', '').strip())
                    current_question['raw_text'] += line + '\n'
                elif line.startswith('**키워드**:'):
                    keywords = line.replace('**키워드**:', '').strip()
                    current_question['keywords'] = [k.strip() for k in keywords.split(',')]
                    current_question['raw_text'] += line + '\n'
                elif line.startswith('---'):
                    continue
                elif line.strip() and not line.startswith('#'):
                    # 문제 내용 또는 선택지 추가
                    cleaned = self.clean_text(line)
                    if cleaned:
                        if re.match(r'^[①②③④⑤\(\d\)]\s*', cleaned):
                            current_question['choices'].append(cleaned)
                        else:
                            current_question['content'] += ' ' + cleaned
                        current_question['raw_text'] += line + '\n'
        
        # 마지막 문제 추가
        if current_question and current_question.get('content'):
            self.questions.append(current_question)
    
    def calculate_quality_score(self, question):
        """문제 품질 점수 계산"""
        score = 0
        
        # 기본 점수
        if question['content'] and len(question['content']) > 10:
            score += 30
        
        # 내용 길이 점수 (적절한 길이)
        content_len = len(question['content'])
        if 20 < content_len < 500:
            score += 20
        elif 10 < content_len <= 20:
            score += 10
        
        # 선택지 점수
        if len(question['choices']) >= 4:
            score += 20
        elif len(question['choices']) >= 2:
            score += 10
        
        # 정답 존재 점수
        if question['answer']:
            score += 10
        
        # 해설 존재 점수
        if question['explanation']:
            score += 10
        
        # 키워드 존재 점수
        if question['keywords']:
            score += 10
        
        # OCR 오류 감점
        ocr_error_patterns = ['0]', '01x', '^^', '|||', 'ㅎㅎ', 'ㅁ|']
        for pattern in ocr_error_patterns:
            if pattern in question['raw_text']:
                score -= 5
        
        # 너무 짧은 문제 감점
        if content_len < 10:
            score -= 20
        
        # "문제 0" 감점
        if question['number'] == 0:
            score -= 15
        
        return max(0, score)
    
    def remove_duplicates(self):
        """중복 문제 제거"""
        unique_questions = []
        seen_contents = set()
        
        for q in self.questions:
            # 내용 기반 중복 체크
            content_key = q['content'].lower().replace(' ', '')[:50]
            
            if content_key and content_key not in seen_contents:
                seen_contents.add(content_key)
                unique_questions.append(q)
            else:
                # 유사도 체크
                is_duplicate = False
                for unique_q in unique_questions:
                    similarity = SequenceMatcher(None, 
                                               q['content'][:100], 
                                               unique_q['content'][:100]).ratio()
                    if similarity > 0.8:
                        is_duplicate = True
                        break
                
                if not is_duplicate:
                    unique_questions.append(q)
        
        self.questions = unique_questions
    
    def select_top_questions(self, target_count=150):
        """품질 점수 기준 상위 문제 선별"""
        # 품질 점수 계산
        for q in self.questions:
            q['quality_score'] = self.calculate_quality_score(q)
        
        # 점수 기준 정렬
        self.questions.sort(key=lambda x: x['quality_score'], reverse=True)
        
        # 상위 문제 선택
        selected = self.questions[:target_count]
        
        # 문제 번호 재정렬
        selected.sort(key=lambda x: (x['quality_score'], -len(x['content'])), reverse=True)
        
        # 새 번호 부여
        for i, q in enumerate(selected, 1):
            q['new_number'] = i
        
        return selected
    
    def format_markdown(self, questions):
        """마크다운 형식으로 포맷팅"""
        output = []
        output.append("# 제9회 나무의사 자격시험 정제 문제집")
        output.append("")
        output.append("**총 문제 수**: 150개")
        output.append("**정제 일시**: 2025-07-29")
        output.append("**정제 내용**: OCR 오류 수정, 중복 제거, 품질 기준 선별")
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
            
            output.append(f"**품질점수**: {q['quality_score']}/100")
            output.append("")
            output.append("---")
            output.append("")
        
        return '\n'.join(output)
    
    def process(self, input_path, output_path):
        """전체 처리 프로세스"""
        print("1. 파일 읽기...")
        with open(input_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        print("2. 문제 추출...")
        self.extract_questions(content)
        print(f"   추출된 문제: {len(self.questions)}개")
        
        print("3. 중복 제거...")
        self.remove_duplicates()
        print(f"   중복 제거 후: {len(self.questions)}개")
        
        print("4. 품질 평가 및 선별...")
        selected = self.select_top_questions(150)
        print(f"   선별된 문제: {len(selected)}개")
        
        print("5. 마크다운 생성...")
        output_content = self.format_markdown(selected)
        
        print("6. 파일 저장...")
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(output_content)
        
        print(f"\n완료! {output_path}에 저장되었습니다.")
        
        # 통계 출력
        print("\n=== 통계 ===")
        print(f"원본 문제 수: 311개")
        print(f"중복 제거 후: {len(self.questions)}개")
        print(f"최종 선별: {len(selected)}개")
        
        # 품질 점수 분포
        scores = [q['quality_score'] for q in selected]
        print(f"\n품질 점수 분포:")
        print(f"  최고: {max(scores)}")
        print(f"  최저: {min(scores)}")
        print(f"  평균: {sum(scores) / len(scores):.1f}")

if __name__ == "__main__":
    refiner = ExamQuestionRefiner()
    
    input_path = "/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-9th-complete.md"
    output_path = "/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-9th-final-150.md"
    
    refiner.process(input_path, output_path)