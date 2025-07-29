#!/usr/bin/env python3
"""
나무의사 제10회 기출문제 효율적 추출
PyMuPDF를 사용하여 빠르게 추출
"""

import fitz  # PyMuPDF
import re
import json
import logging
from collections import defaultdict

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

def extract_exam_10th():
    """제10회 기출문제 추출"""
    
    pdf_path = "./exam-10th.pdf"
    doc = fitz.open(pdf_path)
    
    logging.info(f"PDF 열기 성공: {len(doc)} 페이지")
    
    # 전체 텍스트 추출
    all_text = ""
    page_texts = []
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text()
        page_texts.append(text)
        all_text += f"\n\n--- 페이지 {page_num + 1} ---\n{text}"
    
    doc.close()
    
    # 전체 텍스트 저장
    with open('exam-10th-raw-text.txt', 'w', encoding='utf-8') as f:
        f.write(all_text)
    
    logging.info("전체 텍스트 추출 완료")
    
    # 문제 추출
    questions = {}
    
    # 다양한 패턴으로 문제 찾기
    patterns = [
        # 기본 패턴: 숫자. 문제
        r'^(\d{1,3})\s*\.\s*([^\n①②③④]+)',
        # 줄바꿈 포함 패턴
        r'(\d{1,3})\s*\.\s*((?:[^\n①②③④]|\n(?!\s*[①②③④]))+)',
        # 특수 패턴
        r'(\d{1,3})[.]\s*([^①②③④]+)',
        # 매우 느슨한 패턴
        r'(\d{1,3})\.\s*(.+?)(?=\n\s*①|\n\s*\d{1,3}\.|\Z)'
    ]
    
    for pattern_idx, pattern in enumerate(patterns):
        matches = list(re.finditer(pattern, all_text, re.MULTILINE | re.DOTALL))
        logging.info(f"패턴 {pattern_idx + 1}: {len(matches)}개 매치 발견")
        
        for match in matches:
            try:
                q_num = int(match.group(1))
                if 1 <= q_num <= 150 and q_num not in questions:
                    q_text = match.group(2).strip()
                    
                    # 문제 텍스트가 너무 짧으면 건너뛰기
                    if len(q_text) < 5:
                        continue
                    
                    # 선택지 찾기
                    start_pos = match.end()
                    
                    # 다음 문제 또는 페이지 끝까지
                    next_q_pattern = rf'\n\s*{q_num + 1}\s*\.'
                    next_match = re.search(next_q_pattern, all_text[start_pos:])
                    
                    if next_match:
                        end_pos = start_pos + next_match.start()
                    else:
                        end_pos = min(start_pos + 2000, len(all_text))
                    
                    choices_text = all_text[start_pos:end_pos]
                    
                    # 선택지 추출
                    choices = {}
                    choice_patterns = [
                        (r'①\s*([^②③④\n]+(?:\n(?!②)[^\n]*)*)', '1'),
                        (r'②\s*([^①③④\n]+(?:\n(?!③)[^\n]*)*)', '2'),
                        (r'③\s*([^①②④\n]+(?:\n(?!④)[^\n]*)*)', '3'),
                        (r'④\s*([^①②③\n]+(?:\n(?!\d{1,3}\.)[^\n]*)*)', '4')
                    ]
                    
                    for choice_pattern, choice_num in choice_patterns:
                        choice_match = re.search(choice_pattern, choices_text, re.DOTALL)
                        if choice_match:
                            choice_text = choice_match.group(1).strip()
                            # 선택지 텍스트 정리
                            choice_text = re.sub(r'\s+', ' ', choice_text)
                            choices[choice_num] = choice_text
                    
                    # 최소 2개 이상의 선택지가 있어야 유효한 문제
                    if len(choices) >= 2:
                        questions[q_num] = {
                            'number': q_num,
                            'question': q_text,
                            'choices': choices,
                            'answer': None
                        }
                        logging.info(f"문제 {q_num} 추출 성공")
                        
            except Exception as e:
                logging.error(f"문제 추출 오류: {e}")
                continue
    
    logging.info(f"\n총 {len(questions)}개 문제 추출")
    
    # 정답 찾기
    answer_section = None
    for i, text in enumerate(page_texts):
        if '정답' in text or '해설' in text:
            answer_section = i
            break
    
    if answer_section:
        logging.info(f"정답 섹션 발견: 페이지 {answer_section + 1}")
        
        # 정답 패턴
        answer_patterns = [
            r'(\d{1,3})\s*[.)]\s*([①②③④])',
            r'(\d{1,3})\s*번\s*[:：]\s*([①②③④])',
            r'(\d{1,3})\s*[:：]\s*([①②③④])'
        ]
        
        for page_text in page_texts[answer_section:]:
            for pattern in answer_patterns:
                matches = re.finditer(pattern, page_text)
                for match in matches:
                    q_num = int(match.group(1))
                    if q_num in questions:
                        answer_char = match.group(2)
                        answer_num = str(['①', '②', '③', '④'].index(answer_char) + 1)
                        questions[q_num]['answer'] = answer_num
    
    # 결과 저장
    # JSON 형식
    with open('exam-10th-extracted.json', 'w', encoding='utf-8') as f:
        json.dump(questions, f, ensure_ascii=False, indent=2)
    
    # Markdown 형식
    with open('exam-10th-perfect.md', 'w', encoding='utf-8') as f:
        f.write("# 나무의사 제10회 기출문제\n\n")
        f.write(f"총 {len(questions)}개 문제 추출\n\n")
        
        # 누락된 문제 확인
        missing = []
        for i in range(1, 151):
            if i not in questions:
                missing.append(i)
        
        if missing:
            f.write(f"**누락된 문제:** {missing}\n\n")
        
        f.write("---\n\n")
        
        # 문제 출력
        for i in range(1, 151):
            if i in questions:
                q = questions[i]
                f.write(f"## {i}. {q['question']}\n\n")
                
                if q['choices']:
                    for num in ['1', '2', '3', '4']:
                        if num in q['choices']:
                            f.write(f"{'①②③④'[int(num)-1]} {q['choices'][num]}\n")
                    f.write("\n")
                
                if q['answer']:
                    f.write(f"**정답: {'①②③④'[int(q['answer'])-1]}**\n")
                
                f.write("\n---\n\n")
            else:
                f.write(f"## {i}. [누락된 문제]\n\n---\n\n")
    
    return questions

def main():
    questions = extract_exam_10th()
    
    print(f"\n추출 완료!")
    print(f"총 {len(questions)}개 문제 추출")
    print(f"- exam-10th-extracted.json: JSON 형식")
    print(f"- exam-10th-perfect.md: Markdown 형식")
    print(f"- exam-10th-raw-text.txt: 원본 텍스트")
    
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