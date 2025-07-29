#!/usr/bin/env python3
"""
나무의사 제10회 기출문제 추출 - pdfplumber 사용
"""

import pdfplumber
import re
import json
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

def extract_with_pdfplumber():
    """pdfplumber를 사용한 추출"""
    
    pdf_path = "./exam-10th.pdf"
    
    try:
        with pdfplumber.open(pdf_path) as pdf:
            logging.info(f"PDF 열기 성공: {len(pdf.pages)} 페이지")
            
            all_text = ""
            
            for i, page in enumerate(pdf.pages):
                # 텍스트 추출
                text = page.extract_text()
                
                # 테이블 추출 시도
                tables = page.extract_tables()
                
                if text:
                    all_text += f"\n\n--- 페이지 {i + 1} ---\n{text}"
                    
                if tables:
                    all_text += f"\n\n--- 페이지 {i + 1} 테이블 ---\n"
                    for table in tables:
                        for row in table:
                            all_text += " | ".join(str(cell) if cell else "" for cell in row) + "\n"
                
                # 문제 번호 찾기
                if text:
                    question_nums = re.findall(r'^\s*(\d{1,3})\s*\.', text, re.MULTILINE)
                    if question_nums:
                        logging.info(f"페이지 {i + 1}에서 문제 발견: {question_nums}")
            
            # 결과 저장
            with open('exam-10th-pdfplumber.txt', 'w', encoding='utf-8') as f:
                f.write(all_text)
            
            logging.info("pdfplumber 추출 완료")
            
            # 문제 파싱
            questions = parse_questions(all_text)
            
            # 결과 저장
            save_results(questions)
            
            return questions
            
    except Exception as e:
        logging.error(f"pdfplumber 오류: {e}")
        return {}

def parse_questions(text):
    """텍스트에서 문제 파싱"""
    questions = {}
    
    # 문제 패턴들
    patterns = [
        # 기본 패턴
        r'(\d{1,3})\s*\.\s*([^①②③④]+?)(?=①)',
        # 줄바꿈 포함
        r'(\d{1,3})\s*\.\s*([\s\S]+?)(?=①)',
        # 더 느슨한 패턴
        r'(\d{1,3})[.．]\s*([^①②③④]+)',
    ]
    
    for pattern in patterns:
        matches = list(re.finditer(pattern, text, re.MULTILINE | re.DOTALL))
        logging.info(f"패턴으로 {len(matches)}개 매치 발견")
        
        for match in matches:
            try:
                q_num = int(match.group(1))
                if 1 <= q_num <= 150 and q_num not in questions:
                    q_text = match.group(2).strip()
                    
                    # 선택지 찾기
                    start_pos = match.end()
                    end_pos = start_pos + 1500  # 충분한 길이
                    
                    if end_pos > len(text):
                        end_pos = len(text)
                    
                    choices_text = text[start_pos:end_pos]
                    
                    # 선택지 추출
                    choices = {}
                    choice_patterns = [
                        (r'①\s*([^②③④]+)', '1'),
                        (r'②\s*([^①③④]+)', '2'),
                        (r'③\s*([^①②④]+)', '3'),
                        (r'④\s*([^①②③]+)', '4')
                    ]
                    
                    for choice_pattern, choice_num in choice_patterns:
                        choice_match = re.search(choice_pattern, choices_text)
                        if choice_match:
                            choices[choice_num] = choice_match.group(1).strip()
                    
                    if len(choices) >= 2:  # 최소 2개 선택지
                        questions[q_num] = {
                            'number': q_num,
                            'question': q_text,
                            'choices': choices,
                            'answer': None
                        }
                        
            except Exception as e:
                continue
    
    logging.info(f"총 {len(questions)}개 문제 파싱")
    
    # 정답 찾기
    answer_patterns = [
        r'(\d{1,3})\s*[.)]\s*([①②③④])',
        r'정답.*?(\d{1,3})\s*[:：]\s*([①②③④])'
    ]
    
    for pattern in answer_patterns:
        matches = re.finditer(pattern, text)
        for match in matches:
            try:
                q_num = int(match.group(1))
                if q_num in questions:
                    answer_char = match.group(2)
                    answer_num = str(['①', '②', '③', '④'].index(answer_char) + 1)
                    questions[q_num]['answer'] = answer_num
            except:
                continue
    
    return questions

def save_results(questions):
    """결과 저장"""
    # JSON 저장
    with open('exam-10th-pdfplumber.json', 'w', encoding='utf-8') as f:
        json.dump(questions, f, ensure_ascii=False, indent=2)
    
    # Markdown 저장
    with open('exam-10th-perfect.md', 'w', encoding='utf-8') as f:
        f.write("# 나무의사 제10회 기출문제\n\n")
        f.write(f"총 {len(questions)}개 문제 추출 (pdfplumber 사용)\n\n")
        
        # 누락된 문제 확인
        missing = []
        for i in range(1, 151):
            if i not in questions:
                missing.append(i)
        
        if missing:
            f.write(f"**누락된 문제 ({len(missing)}개):** {missing[:20]}...\n\n")
        
        f.write("---\n\n")
        
        # 문제 출력
        for i in range(1, 151):
            if i in questions:
                q = questions[i]
                f.write(f"## {i}. {q['question']}\n\n")
                
                for num in ['1', '2', '3', '4']:
                    if num in q['choices']:
                        f.write(f"{'①②③④'[int(num)-1]} {q['choices'][num]}\n")
                
                if q.get('answer'):
                    f.write(f"\n**정답: {'①②③④'[int(q['answer'])-1]}**\n")
                
                f.write("\n---\n\n")
            else:
                f.write(f"## {i}. [누락된 문제]\n\n---\n\n")
    
    logging.info(f"결과 저장 완료: exam-10th-perfect.md")

def main():
    questions = extract_with_pdfplumber()
    
    print(f"\n추출 완료!")
    print(f"총 {len(questions)}개 문제 추출")
    
    # 누락된 문제 확인
    missing = []
    for i in range(1, 151):
        if i not in questions:
            missing.append(i)
    
    if missing:
        print(f"\n누락된 문제 ({len(missing)}개): {missing[:10]}...")
    else:
        print("\n모든 150문제가 성공적으로 추출되었습니다!")

if __name__ == "__main__":
    main()