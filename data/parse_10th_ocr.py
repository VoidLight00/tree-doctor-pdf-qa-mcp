#!/usr/bin/env python3
"""
나무의사 제10회 기출문제 OCR 텍스트 파싱
이미 OCR된 텍스트에서 150문제 추출
"""

import re
import json
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

def parse_ocr_text():
    """OCR 텍스트 파일에서 문제 추출"""
    
    # OCR 텍스트 읽기
    with open('exam-10th-ocr.txt', 'r', encoding='utf-8') as f:
        text = f.read()
    
    logging.info(f"텍스트 파일 읽기 완료: {len(text)} 문자")
    
    questions = {}
    
    # 문제 패턴들 (OCR 오류 고려)
    patterns = [
        # 표준 패턴
        r'(\d{1,3})\s*\.\s*([^①②③④0-9]+?)(?=①|0\)|2\)|3\)|0 )',
        # OCR 오류 고려 패턴 (숫자가 0으로 인식되는 경우)
        r'(\d{1,3})\s*\.\s*([^①②③④]+?)(?=\n\s*[0①])',
        # 더 느슨한 패턴
        r'(\d{1,3})[.．]\s*([^\n]+?)(?=\n\s*[①0])',
        # 매우 느슨한 패턴
        r'(\d{1,3})\.\s*(.+?)(?=\n[^\n]*[①②③④])',
    ]
    
    # 각 패턴으로 시도
    for pattern_idx, pattern in enumerate(patterns):
        matches = list(re.finditer(pattern, text, re.MULTILINE | re.DOTALL))
        logging.info(f"패턴 {pattern_idx + 1}: {len(matches)}개 매치")
        
        for match in matches:
            try:
                q_num = int(match.group(1))
                if 1 <= q_num <= 150 and q_num not in questions:
                    q_text = match.group(2).strip()
                    
                    # 문제 텍스트 정리
                    q_text = re.sub(r'\s+', ' ', q_text)
                    q_text = re.sub(r'[\n\r]+', ' ', q_text)
                    
                    # 너무 짧은 문제는 건너뛰기
                    if len(q_text) < 10:
                        continue
                    
                    # 선택지 찾기
                    start_pos = match.end()
                    end_pos = min(start_pos + 2000, len(text))
                    choices_text = text[start_pos:end_pos]
                    
                    # 선택지 추출 (OCR 오류 고려)
                    choices = {}
                    
                    # OCR에서 ①②③④가 0) 2) 3) 0 등으로 인식될 수 있음
                    choice_patterns = [
                        (r'[①0]\s*\)?\s*([^②③④\n0-9]+)', '1'),
                        (r'[②2]\s*\)?\s*([^①③④\n0-9]+)', '2'),
                        (r'[③3]\s*\)?\s*([^①②④\n0-9]+)', '3'),
                        (r'[④0]\s*\)?\s*([^①②③\n0-9]+)', '4')
                    ]
                    
                    for choice_pattern, choice_num in choice_patterns:
                        choice_match = re.search(choice_pattern, choices_text)
                        if choice_match:
                            choice_text = choice_match.group(1).strip()
                            choice_text = re.sub(r'\s+', ' ', choice_text)
                            if len(choice_text) > 3:  # 너무 짧은 선택지 제외
                                choices[choice_num] = choice_text
                    
                    # 최소 2개 이상의 선택지가 있어야 유효
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
    
    # 정답 찾기
    logging.info("정답 찾기 시작...")
    
    # 정답 패턴 (OCR 오류 고려)
    answer_patterns = [
        r'(\d{1,3})\s*[.)]\s*([①②③④0-9])',
        r'정답.*?(\d{1,3})\s*[:：]\s*([①②③④0-9])',
        r'(\d{1,3})\s*번\s*[:：]?\s*([①②③④0-9])'
    ]
    
    for pattern in answer_patterns:
        matches = re.finditer(pattern, text)
        for match in matches:
            try:
                q_num = int(match.group(1))
                if q_num in questions:
                    answer_char = match.group(2)
                    
                    # OCR 오류 보정
                    if answer_char == '0':
                        answer_char = '①'
                    elif answer_char in '1234':
                        answer_char = '①②③④'[int(answer_char) - 1]
                    
                    if answer_char in '①②③④':
                        answer_num = str(['①', '②', '③', '④'].index(answer_char) + 1)
                        questions[q_num]['answer'] = answer_num
                        
            except Exception:
                continue
    
    logging.info(f"총 {len(questions)}개 문제 추출 완료")
    
    return questions

def save_results(questions):
    """결과 저장"""
    
    # JSON 저장
    with open('exam-10th-parsed.json', 'w', encoding='utf-8') as f:
        json.dump(questions, f, ensure_ascii=False, indent=2)
    
    # Markdown 저장
    with open('exam-10th-perfect.md', 'w', encoding='utf-8') as f:
        f.write("# 나무의사 제10회 기출문제\n\n")
        f.write(f"총 {len(questions)}개 문제 추출 (OCR 텍스트 파싱)\n\n")
        
        # 누락된 문제 확인
        missing = []
        for i in range(1, 151):
            if i not in questions:
                missing.append(i)
        
        if missing:
            f.write(f"**누락된 문제 ({len(missing)}개):** ")
            if len(missing) > 20:
                f.write(f"{missing[:20]}... (총 {len(missing)}개)\n\n")
            else:
                f.write(f"{missing}\n\n")
        else:
            f.write("**모든 150문제가 성공적으로 추출되었습니다!**\n\n")
        
        f.write("---\n\n")
        
        # 문제 출력
        for i in range(1, 151):
            if i in questions:
                q = questions[i]
                f.write(f"## {i}. {q['question']}\n\n")
                
                # 선택지
                for num in ['1', '2', '3', '4']:
                    if num in q['choices']:
                        f.write(f"{'①②③④'[int(num)-1]} {q['choices'][num]}\n")
                
                # 정답
                if q.get('answer'):
                    f.write(f"\n**정답: {'①②③④'[int(q['answer'])-1]}**\n")
                
                f.write("\n---\n\n")
            else:
                f.write(f"## {i}. [누락된 문제]\n\n---\n\n")
    
    logging.info("결과 저장 완료")
    
    return missing

def main():
    questions = parse_ocr_text()
    missing = save_results(questions)
    
    print(f"\n추출 완료!")
    print(f"총 {len(questions)}개 문제 추출")
    print(f"- exam-10th-parsed.json: JSON 형식")
    print(f"- exam-10th-perfect.md: Markdown 형식")
    
    if missing:
        print(f"\n누락된 문제 ({len(missing)}개):")
        print(f"처음 10개: {missing[:10]}")
        print(f"마지막 10개: {missing[-10:]}")
    else:
        print("\n모든 150문제가 성공적으로 추출되었습니다!")

if __name__ == "__main__":
    main()