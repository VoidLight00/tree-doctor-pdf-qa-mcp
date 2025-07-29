#!/usr/bin/env python3
"""
나무의사 제10회 기출문제 완전 추출
OCR 텍스트에서 150문제 모두 추출하기 위한 개선된 파서
"""

import re
import json
import logging
from collections import defaultdict

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

def clean_text(text):
    """텍스트 정리"""
    # 불필요한 공백 제거
    text = re.sub(r'\s+', ' ', text)
    # OCR 오류 보정
    text = text.replace('0)', '①')
    text = text.replace('2)', '②')
    text = text.replace('3)', '③')
    text = text.replace('4)', '④')
    text = text.replace('(01)', '①')
    text = text.replace('(2)', '②')
    text = text.replace('(3)', '③')
    text = text.replace('(4)', '④')
    text = text.replace('(5)', '⑤')
    text = text.replace('(9)', '⑤')
    
    return text

def find_questions_by_page(text):
    """페이지별로 문제 찾기"""
    pages = text.split('--- 페이지')
    questions = {}
    
    for page_idx, page_text in enumerate(pages):
        if not page_text.strip():
            continue
            
        # 페이지 번호 추출
        page_num_match = re.match(r'\s*(\d+)\s*---', page_text)
        if page_num_match:
            page_num = int(page_num_match.group(1))
        else:
            page_num = page_idx
        
        logging.info(f"페이지 {page_num} 분석 중...")
        
        # 이 페이지의 텍스트
        page_content = page_text[page_text.find('---')+3:] if '---' in page_text else page_text
        page_content = clean_text(page_content)
        
        # 다양한 문제 패턴
        patterns = [
            # 기본 패턴
            r'(\d{1,3})\s*\.\s*([^①②③④]+?)(?=①)',
            # 숫자만 있는 경우
            r'^(\d{1,3})\.\s*(.+?)(?=①)',
            # 문제 번호가 독립된 줄에 있는 경우
            r'^\s*(\d{1,3})\s*$(.+?)(?=①)',
            # OCR 오류 고려
            r'(\d{1,3})[.．]\s*([^①②③④0-9]+?)(?=\s*[①0])',
        ]
        
        for pattern in patterns:
            # 페이지 내에서 문제 찾기
            matches = list(re.finditer(pattern, page_content, re.MULTILINE | re.DOTALL))
            
            for match in matches:
                try:
                    q_num = int(match.group(1))
                    if 1 <= q_num <= 150 and q_num not in questions:
                        q_text = match.group(2).strip()
                        
                        # 문제 텍스트 정리
                        q_text = re.sub(r'\s+', ' ', q_text)
                        
                        if len(q_text) < 5:
                            continue
                        
                        # 선택지 찾기
                        start_pos = match.end()
                        # 다음 문제까지 또는 페이지 끝까지
                        next_q_match = re.search(rf'{q_num + 1}\s*\.', page_content[start_pos:])
                        if next_q_match:
                            end_pos = start_pos + next_q_match.start()
                        else:
                            end_pos = len(page_content)
                        
                        choices_text = page_content[start_pos:end_pos]
                        
                        # 선택지 추출
                        choices = extract_choices(choices_text)
                        
                        if len(choices) >= 2:  # 최소 2개 선택지
                            questions[q_num] = {
                                'number': q_num,
                                'question': q_text,
                                'choices': choices,
                                'answer': None,
                                'page': page_num
                            }
                            logging.info(f"문제 {q_num} 추출 (페이지 {page_num})")
                            
                except Exception as e:
                    logging.error(f"문제 추출 오류: {e}")
                    continue
    
    return questions

def extract_choices(text):
    """선택지 추출"""
    choices = {}
    
    # 선택지 패턴
    choice_patterns = [
        (r'①\s*([^②③④⑤]+)', '1'),
        (r'②\s*([^①③④⑤]+)', '2'),
        (r'③\s*([^①②④⑤]+)', '3'),
        (r'④\s*([^①②③⑤]+)', '4'),
        (r'⑤\s*([^①②③④]+)', '5')
    ]
    
    for pattern, num in choice_patterns:
        match = re.search(pattern, text)
        if match:
            choice_text = match.group(1).strip()
            choice_text = re.sub(r'\s+', ' ', choice_text)
            
            # 다음 문제 번호나 정답 표시가 포함되어 있으면 거기까지만
            choice_text = re.split(r'\d{1,3}\s*\.|\s*정답\s*[:：]', choice_text)[0]
            
            if len(choice_text) > 2:
                choices[num] = choice_text
    
    return choices

def find_answers(text, questions):
    """정답 찾기"""
    # 정답 섹션 찾기
    answer_section_start = -1
    for match in re.finditer(r'정답\s*및\s*해설|정답.*해설|답안', text, re.IGNORECASE):
        answer_section_start = match.start()
        break
    
    if answer_section_start > 0:
        answer_text = text[answer_section_start:]
    else:
        answer_text = text
    
    # 정답 패턴
    answer_patterns = [
        r'(\d{1,3})\s*[.)]\s*([①②③④⑤])',
        r'(\d{1,3})\s*번?\s*[:：]\s*([①②③④⑤])',
        r'정답\s*[:：]?\s*(\d{1,3})\s*-\s*([①②③④⑤])'
    ]
    
    for pattern in answer_patterns:
        matches = re.finditer(pattern, answer_text)
        for match in matches:
            try:
                q_num = int(match.group(1))
                if q_num in questions:
                    answer_char = match.group(2)
                    if answer_char in '①②③④⑤':
                        answer_num = str('①②③④⑤'.index(answer_char) + 1)
                        questions[q_num]['answer'] = answer_num
                        
            except Exception:
                continue
    
    return questions

def extract_all_questions():
    """모든 문제 추출"""
    # OCR 텍스트 읽기
    with open('exam-10th-ocr.txt', 'r', encoding='utf-8') as f:
        text = f.read()
    
    logging.info("OCR 텍스트 읽기 완료")
    
    # 페이지별로 문제 찾기
    questions = find_questions_by_page(text)
    
    # 전체 텍스트에서 한 번 더 찾기 (누락된 것 보완)
    cleaned_text = clean_text(text)
    
    # 추가 패턴으로 누락된 문제 찾기
    additional_patterns = [
        # 매우 관대한 패턴
        r'(?:^|\n)\s*(\d{1,3})\s*\.\s*(.{10,200}?)(?=\s*①)',
        # 문제 번호만 있는 경우
        r'(?:^|\n)\s*(\d{1,3})\s*$\s*(.{10,200}?)(?=\s*①)',
    ]
    
    for pattern in additional_patterns:
        matches = re.finditer(pattern, cleaned_text, re.MULTILINE | re.DOTALL)
        for match in matches:
            try:
                q_num = int(match.group(1))
                if 1 <= q_num <= 150 and q_num not in questions:
                    q_text = match.group(2).strip()
                    q_text = re.sub(r'\s+', ' ', q_text)
                    
                    if len(q_text) >= 10:
                        # 선택지 찾기
                        start_pos = match.end()
                        end_pos = start_pos + 1000
                        if end_pos > len(cleaned_text):
                            end_pos = len(cleaned_text)
                        
                        choices_text = cleaned_text[start_pos:end_pos]
                        choices = extract_choices(choices_text)
                        
                        if len(choices) >= 2:
                            questions[q_num] = {
                                'number': q_num,
                                'question': q_text,
                                'choices': choices,
                                'answer': None,
                                'page': 0
                            }
                            logging.info(f"추가 문제 {q_num} 발견")
                            
            except Exception as e:
                continue
    
    # 정답 찾기
    questions = find_answers(text, questions)
    
    logging.info(f"총 {len(questions)}개 문제 추출 완료")
    
    return questions

def save_results(questions):
    """결과 저장"""
    # JSON 저장
    with open('exam-10th-complete.json', 'w', encoding='utf-8') as f:
        json.dump(questions, f, ensure_ascii=False, indent=2)
    
    # Markdown 저장
    with open('exam-10th-perfect.md', 'w', encoding='utf-8') as f:
        f.write("# 나무의사 제10회 기출문제 (완전판)\n\n")
        f.write(f"총 {len(questions)}개 문제 추출\n\n")
        
        # 누락된 문제 확인
        missing = []
        for i in range(1, 151):
            if i not in questions:
                missing.append(i)
        
        if missing:
            f.write(f"**누락된 문제 ({len(missing)}개):** {missing}\n\n")
        else:
            f.write("**모든 150문제가 성공적으로 추출되었습니다!**\n\n")
        
        f.write("---\n\n")
        
        # 문제 출력
        for i in range(1, 151):
            if i in questions:
                q = questions[i]
                f.write(f"## {i}. {q['question']}\n\n")
                
                # 선택지
                for num in ['1', '2', '3', '4', '5']:
                    if num in q['choices']:
                        f.write(f"{'①②③④⑤'[int(num)-1]} {q['choices'][num]}\n")
                f.write("\n")
                
                # 정답
                if q.get('answer'):
                    f.write(f"**정답: {'①②③④⑤'[int(q['answer'])-1]}**\n")
                
                f.write(f"\n*페이지: {q.get('page', '?')}*\n")
                f.write("\n---\n\n")
            else:
                f.write(f"## {i}. [누락된 문제]\n\n---\n\n")
    
    # 통계 저장
    with open('exam-10th-stats.txt', 'w', encoding='utf-8') as f:
        f.write(f"제10회 나무의사 기출문제 추출 통계\n")
        f.write(f"=================================\n\n")
        f.write(f"총 문제 수: {len(questions)}/150\n")
        f.write(f"누락된 문제: {len(missing)}개\n")
        f.write(f"정답이 있는 문제: {sum(1 for q in questions.values() if q.get('answer'))}개\n\n")
        
        if missing:
            f.write(f"누락된 문제 번호:\n{missing}\n")
    
    return missing

def main():
    questions = extract_all_questions()
    missing = save_results(questions)
    
    print(f"\n추출 완료!")
    print(f"총 {len(questions)}개 문제 추출")
    print(f"- exam-10th-complete.json: JSON 형식")
    print(f"- exam-10th-perfect.md: Markdown 형식")
    print(f"- exam-10th-stats.txt: 통계 정보")
    
    if missing:
        print(f"\n누락된 문제 ({len(missing)}개):")
        if len(missing) <= 20:
            print(missing)
        else:
            print(f"처음 20개: {missing[:20]}")

if __name__ == "__main__":
    main()