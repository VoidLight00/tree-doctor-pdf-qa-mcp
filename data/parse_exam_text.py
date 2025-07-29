#!/usr/bin/env python3
"""
OCR 텍스트를 파싱하여 구조화된 마크다운으로 변환
"""

import re
import sys

class ExamTextParser:
    def __init__(self):
        self.patterns = {
            # 문제 번호 패턴 (1. 2. 3. 등)
            'question': re.compile(r'^(\d+)\.\s+(.+)$'),
            # 선택지 패턴 (①②③④⑤ 또는 0) 1) 2) 등)
            'choice1': re.compile(r'^([①②③④⑤])\s*(.+)$'),
            'choice2': re.compile(r'^(\d)\)\s*(.+)$'),
            # 정답 패턴
            'answer': re.compile(r'정답[:\s]*([①②③④⑤\d])'),
            # 해설 시작 패턴
            'explanation': re.compile(r'해설[:\s]*(.*)$'),
        }
        
    def clean_text(self, text):
        """텍스트 정리"""
        # 불필요한 공백 제거
        text = re.sub(r'\s+', ' ', text)
        # 특수 문자 정리
        text = text.replace('0)', '①').replace('1)', '①').replace('2)', '②')
        text = text.replace('3)', '③').replace('4)', '④').replace('5)', '⑤')
        text = text.replace('(8', '②').replace('@', '④').replace('6', '⑤')
        return text.strip()
    
    def parse_exam_10th(self, file_path):
        """제10회 해설집 파싱"""
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 페이지 단위로 분리
        pages = content.split('--- 페이지')
        
        questions = []
        current_question = None
        current_choices = []
        in_explanation = False
        explanation_lines = []
        
        for page in pages[1:]:  # 첫 번째 빈 페이지 제외
            lines = page.split('\n')
            
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                
                # 문제 번호 찾기
                if re.match(r'^\d+\.\s+', line):
                    # 이전 문제 저장
                    if current_question:
                        if explanation_lines:
                            current_question['explanation'] = '\n'.join(explanation_lines)
                        if current_choices:
                            current_question['choices'] = current_choices
                        questions.append(current_question)
                    
                    # 새 문제 시작
                    match = self.patterns['question'].match(line)
                    if match:
                        current_question = {
                            'number': int(match.group(1)),
                            'question': self.clean_text(match.group(2)),
                            'choices': [],
                            'answer': '',
                            'explanation': ''
                        }
                        current_choices = []
                        in_explanation = False
                        explanation_lines = []
                
                # 선택지 찾기
                elif current_question and (
                    self.patterns['choice1'].match(line) or 
                    self.patterns['choice2'].match(line)
                ):
                    # 선택지 형식 통일
                    clean_line = self.clean_text(line)
                    for pattern in [self.patterns['choice1'], self.patterns['choice2']]:
                        match = pattern.match(clean_line)
                        if match:
                            num = match.group(1)
                            text = match.group(2)
                            # 번호 변환
                            if num in '012345':
                                num = ['①', '①', '②', '③', '④', '⑤'][int(num)]
                            current_choices.append({'num': num, 'text': text})
                            break
                
                # 정답 찾기
                elif current_question and '정답' in line:
                    match = self.patterns['answer'].search(line)
                    if match:
                        answer = match.group(1)
                        if answer in '12345':
                            answer = ['①', '②', '③', '④', '⑤'][int(answer)-1]
                        current_question['answer'] = answer
                
                # 해설 찾기
                elif current_question and ('해설' in line or '<' in line or '병원균' in line):
                    in_explanation = True
                    explanation_lines.append(line)
                elif in_explanation:
                    explanation_lines.append(line)
        
        # 마지막 문제 저장
        if current_question:
            if explanation_lines:
                current_question['explanation'] = '\n'.join(explanation_lines)
            if current_choices:
                current_question['choices'] = current_choices
            questions.append(current_question)
        
        return questions
    
    def parse_exam_11th(self, file_path):
        """제11회 시험지 파싱"""
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        questions = []
        lines = content.split('\n')
        current_question = None
        current_choices = []
        
        for i, line in enumerate(lines):
            line = line.strip()
            if not line:
                continue
            
            # 문제 번호 찾기
            if re.match(r'^\d+\.\s+', line):
                # 이전 문제 저장
                if current_question and current_choices:
                    current_question['choices'] = current_choices
                    questions.append(current_question)
                
                # 새 문제 시작
                match = self.patterns['question'].match(line)
                if match:
                    current_question = {
                        'number': int(match.group(1)),
                        'question': self.clean_text(match.group(2)),
                        'choices': []
                    }
                    current_choices = []
            
            # 선택지 찾기
            elif current_question:
                clean_line = self.clean_text(line)
                for pattern in [self.patterns['choice1'], self.patterns['choice2']]:
                    match = pattern.match(clean_line)
                    if match:
                        num = match.group(1)
                        text = match.group(2)
                        if num in '012345':
                            num = ['①', '①', '②', '③', '④', '⑤'][int(num)]
                        current_choices.append({'num': num, 'text': text})
                        break
        
        # 마지막 문제 저장
        if current_question and current_choices:
            current_question['choices'] = current_choices
            questions.append(current_question)
        
        return questions
    
    def format_markdown_10th(self, questions):
        """제10회 마크다운 포맷"""
        md = "# 제10회 나무의사 자격시험 기출문제 및 해설\n\n"
        md += "## 수목병리학\n\n"
        
        for q in questions:
            md += f"### {q['number']}. {q['question']}\n\n"
            
            for choice in q['choices']:
                md += f"{choice['num']} {choice['text']}\n"
            
            if q['answer']:
                md += f"\n**정답: {q['answer']}**\n"
            
            if q['explanation']:
                md += f"\n#### 해설\n{q['explanation']}\n"
            
            md += "\n---\n\n"
        
        return md
    
    def format_markdown_11th(self, questions):
        """제11회 마크다운 포맷"""
        md = "# 제11회 나무의사 자격시험 1차 시험 문제\n\n"
        
        current_subject = ""
        for q in questions:
            # 과목 변경 감지 (임시)
            if q['number'] == 1:
                current_subject = "## 수목병리학\n\n"
            elif q['number'] == 21:
                current_subject = "## 수목해충학\n\n"
            elif q['number'] == 41:
                current_subject = "## 수목생리학\n\n"
            elif q['number'] == 61:
                current_subject = "## 산림토양학\n\n"
            elif q['number'] == 81:
                current_subject = "## 정책 및 법규\n\n"
            
            if current_subject:
                md += current_subject
                current_subject = ""
            
            md += f"### {q['number']}. {q['question']}\n\n"
            
            for choice in q['choices']:
                md += f"{choice['num']} {choice['text']}\n"
            
            md += "\n---\n\n"
        
        return md

def main():
    parser = ExamTextParser()
    
    # 제10회 처리
    print("제10회 기출문제 해설집 파싱 중...")
    questions_10th = parser.parse_exam_10th("/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-10th-ocr.txt")
    markdown_10th = parser.format_markdown_10th(questions_10th)
    
    with open("/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-10th-complete.md", "w", encoding="utf-8") as f:
        f.write(markdown_10th)
    
    print(f"✓ 제10회 완료: {len(questions_10th)}개 문제")
    
    # 제11회 처리
    print("\n제11회 시험지 파싱 중...")
    questions_11th = parser.parse_exam_11th("/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-11th-ocr.txt")
    markdown_11th = parser.format_markdown_11th(questions_11th)
    
    with open("/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-11th-complete.md", "w", encoding="utf-8") as f:
        f.write(markdown_11th)
    
    print(f"✓ 제11회 완료: {len(questions_11th)}개 문제")

if __name__ == "__main__":
    main()