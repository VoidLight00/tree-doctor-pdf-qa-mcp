#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import re
import json
from typing import List, Dict, Any, Optional, Tuple
import os

def clean_text(text: str) -> str:
    """텍스트를 정리합니다."""
    # 연속된 공백을 하나로
    text = re.sub(r'\s+', ' ', text)
    # 앞뒤 공백 제거
    text = text.strip()
    return text

def extract_choices_from_text(text: str) -> Tuple[List[Dict[str, Any]], str]:
    """텍스트에서 선택지를 추출하고 남은 텍스트를 반환합니다."""
    choices = []
    remaining_text = text
    
    # 여러 선택지 패턴
    patterns = [
        # ① ② ③ ④ ⑤ 형식
        (r'([①②③④⑤])\s*([^①②③④⑤\n]+)', 'circled'),
        # (1) (2) (3) 형식
        (r'\((\d+)\)\s*([^(\n]+(?:\n(?!\(\d+\))[^\n]+)*)', 'parentheses'),
        # 1) 2) 3) 형식
        (r'(\d+)\)\s*([^0-9)\n]+(?:\n(?!\d+\))[^\n]+)*)', 'number'),
        # @ 기호로 표시된 정답
        (r'(@)\s*([^@\n]+)', 'at')
    ]
    
    for pattern, pattern_type in patterns:
        matches = list(re.finditer(pattern, text))
        if matches:
            for match in matches:
                if pattern_type == 'circled':
                    number = ord(match.group(1)) - ord('①') + 1
                elif pattern_type == 'at':
                    # @ 표시는 보통 정답을 나타내므로 별도 처리
                    continue
                else:
                    number = int(match.group(1))
                
                choice_text = clean_text(match.group(2))
                choices.append({
                    'number': number,
                    'text': choice_text
                })
                
                # 찾은 선택지를 텍스트에서 제거
                remaining_text = remaining_text.replace(match.group(0), '')
            
            # 선택지를 찾았으면 break
            if choices:
                break
    
    return choices, clean_text(remaining_text)

def find_answer_in_text(text: str, choices: List[Dict[str, Any]]) -> Optional[int]:
    """텍스트에서 정답을 찾습니다."""
    # @ 표시 찾기
    at_match = re.search(r'@\s*([^@\n]+)', text)
    if at_match:
        at_text = at_match.group(1).strip()
        # @ 표시된 텍스트와 일치하는 선택지 찾기
        for choice in choices:
            if choice['text'] in at_text or at_text in choice['text']:
                return choice['number']
    
    # 정답 패턴들
    answer_patterns = [
        r'정답\s*[:：]\s*(\d+)',
        r'답\s*[:：]\s*(\d+)',
        r'정답은\s*(\d+)',
        r'\((\d+)\)\s*번?\s*이?\s*정답',
        r'(\d+)\s*번?\s*이?\s*정답'
    ]
    
    for pattern in answer_patterns:
        match = re.search(pattern, text)
        if match:
            return int(match.group(1))
    
    return None

def extract_questions_comprehensive(filepath: str) -> List[Dict[str, Any]]:
    """파일에서 모든 문제를 포괄적으로 추출합니다."""
    questions = []
    
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        
        # "## 문제 X" 패턴 찾기
        if line.startswith("## 문제"):
            match = re.match(r'## 문제 (\d+)', line)
            if match:
                question_id = int(match.group(1))
                
                # 문제 내용 수집
                content_lines = []
                i += 1
                
                # 다음 "## 문제" 또는 파일 끝까지 내용 수집
                while i < len(lines) and not lines[i].strip().startswith("## 문제"):
                    content_lines.append(lines[i])
                    i += 1
                
                # 수집한 내용 처리
                full_content = ''.join(content_lines)
                
                # 섹션 분리 (---로 구분)
                sections = full_content.split('---')
                main_section = sections[0] if sections else full_content
                
                # **문제**: 패턴 찾기
                question_match = re.search(r'\*\*문제\*\*:\s*(.+?)(?=\*\*해설\*\*:|\*\*키워드\*\*:|$)', main_section, re.DOTALL)
                if question_match:
                    question_text = question_match.group(1).strip()
                else:
                    # **문제**: 가 없으면 첫 번째 의미있는 텍스트를 문제로 간주
                    question_text = main_section.strip()
                
                # 선택지 추출
                choices, remaining_question = extract_choices_from_text(question_text)
                
                # 해설 추출
                explanation_match = re.search(r'\*\*해설\*\*:\s*(.+?)(?=\*\*키워드\*\*:|$)', main_section, re.DOTALL)
                explanation = explanation_match.group(1).strip() if explanation_match else ""
                
                # 키워드 추출
                keyword_match = re.search(r'\*\*키워드\*\*:\s*(.+?)(?=$)', main_section, re.DOTALL)
                keywords = []
                if keyword_match:
                    keyword_text = keyword_match.group(1).strip()
                    keywords = [k.strip() for k in keyword_text.split(',') if k.strip()]
                
                # 정답 찾기
                answer = find_answer_in_text(full_content, choices)
                
                # 문제가 너무 짧거나 비어있는 경우 전체 섹션을 문제로 사용
                if len(remaining_question) < 10:
                    remaining_question = clean_text(main_section.replace('**문제**:', '').replace('**해설**:', '').replace('**키워드**:', ''))
                
                questions.append({
                    'id': question_id,
                    'question': remaining_question if choices else question_text,
                    'choices': choices,
                    'answer': answer,
                    'explanation': explanation,
                    'keywords': keywords
                })
                
                # i는 이미 다음 문제 위치로 이동했으므로 감소
                i -= 1
        
        i += 1
    
    return questions

def main():
    input_file = '/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-7th-complete.md'
    output_file = '/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-7th-questions-complete.json'
    
    print(f"파일 읽기 시작: {input_file}")
    
    try:
        questions = extract_questions_comprehensive(input_file)
        
        # ID로 정렬
        questions.sort(key=lambda x: x['id'])
        
        # 통계 계산
        total_questions = len(questions)
        answered_questions = sum(1 for q in questions if q['answer'] is not None)
        questions_with_choices = sum(1 for q in questions if q['choices'])
        
        # JSON 파일로 저장
        output_data = {
            'exam_info': {
                'title': '제7회 나무의사 기출문제',
                'total_questions': total_questions,
                'answered_questions': answered_questions,
                'questions_with_choices': questions_with_choices,
                'extracted_date': '2025-07-28'
            },
            'questions': questions
        }
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, ensure_ascii=False, indent=2)
        
        print(f"\n추출 완료!")
        print(f"총 문제 수: {total_questions}개")
        print(f"정답이 있는 문제: {answered_questions}개")
        print(f"선택지가 있는 문제: {questions_with_choices}개")
        print(f"결과 파일: {output_file}")
        
        # 샘플 출력
        if questions:
            print("\n[샘플 문제]")
            sample = questions[0]
            print(f"ID: {sample['id']}")
            print(f"문제: {sample['question'][:100]}...")
            print(f"선택지 수: {len(sample['choices'])}")
            print(f"정답: {sample['answer']}")
        
    except Exception as e:
        print(f"오류 발생: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()