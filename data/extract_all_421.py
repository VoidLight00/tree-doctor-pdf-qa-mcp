#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import re
import json
from typing import List, Dict, Any, Optional

def extract_all_421_questions(filepath: str) -> List[Dict[str, Any]]:
    """파일에서 모든 421개 문제를 추출합니다."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 모든 "## 문제 X" 위치 찾기
    problem_pattern = r'## 문제 \d+'
    problem_positions = []
    
    for match in re.finditer(problem_pattern, content):
        problem_positions.append(match.start())
    
    print(f"찾은 문제 수: {len(problem_positions)}개")
    
    questions = []
    
    for i, start_pos in enumerate(problem_positions):
        # 다음 문제까지의 내용 추출
        if i < len(problem_positions) - 1:
            end_pos = problem_positions[i + 1]
        else:
            end_pos = len(content)
        
        section = content[start_pos:end_pos]
        
        # 문제 파싱
        question_data = parse_question(section, i + 1)  # 1부터 시작하는 번호
        if question_data:
            questions.append(question_data)
    
    return questions

def parse_question(section: str, seq_number: int) -> Optional[Dict[str, Any]]:
    """개별 문제 섹션을 파싱합니다."""
    lines = section.strip().split('\n')
    if len(lines) < 2:
        return None
    
    # 기본 값들
    question_text = ""
    choices = []
    answer = None
    explanation = ""
    keywords = []
    
    # 원래 문제 번호 추출
    id_match = re.match(r'## 문제 (\d+)', lines[0])
    original_id = int(id_match.group(1)) if id_match else 0
    
    # 줄별로 처리
    i = 1  # 첫 줄(## 문제 X)은 이미 처리했으므로 다음 줄부터
    in_explanation = False
    in_keywords = False
    
    while i < len(lines):
        line = lines[i].strip()
        
        # 섹션 구분자
        if line == "---":
            break
        
        # **문제**: 처리
        if line.startswith("**문제**:"):
            question_text = line.replace("**문제**:", "").strip()
            # 다음 줄들이 문제의 연속일 수 있음
            i += 1
            while i < len(lines):
                next_line = lines[i].strip()
                # 선택지나 다른 마커를 만나면 중단
                if (re.match(r'^[①②③④⑤\(\d+\)@]', next_line) or 
                    next_line.startswith("**") or 
                    next_line == "---"):
                    break
                if next_line:
                    question_text += " " + next_line
                i += 1
            continue
        
        # **해설**: 처리
        if line.startswith("**해설**:"):
            in_explanation = True
            in_keywords = False
            explanation = line.replace("**해설**:", "").strip()
            i += 1
            continue
        
        # **키워드**: 처리
        if line.startswith("**키워드**:"):
            in_keywords = True
            in_explanation = False
            keyword_text = line.replace("**키워드**:", "").strip()
            if keyword_text:
                keywords = [k.strip() for k in keyword_text.split(',') if k.strip()]
            i += 1
            continue
        
        # 선택지 패턴들
        choice_patterns = [
            (r'^([①②③④⑤])\s*(.+)', 'circled'),
            (r'^\((\d+)\)\s*(.+)', 'paren'),
            (r'^(\d+)\)\s*(.+)', 'number'),
        ]
        
        matched_choice = False
        for pattern, pattern_type in choice_patterns:
            match = re.match(pattern, line)
            if match:
                if pattern_type == 'circled':
                    number = ord(match.group(1)) - ord('①') + 1
                else:
                    number = int(match.group(1))
                
                text = match.group(2).strip()
                choices.append({'number': number, 'text': text})
                matched_choice = True
                in_explanation = False
                in_keywords = False
                break
        
        # @ 표시 (정답)
        if line.startswith("@") and not matched_choice:
            # @ 앞의 마지막 선택지가 정답
            if choices:
                answer = choices[-1]['number']
        
        # 해설이나 키워드 모드에서 텍스트 추가
        elif in_explanation and line and not matched_choice:
            explanation += " " + line
        elif in_keywords and line and not matched_choice:
            keywords.extend([k.strip() for k in line.split(',') if k.strip()])
        
        # 문제 텍스트가 아직 없고 특별한 마커가 없는 경우
        elif not question_text and not matched_choice and line and not line.startswith("**"):
            question_text = line
        
        i += 1
    
    # 정답 추출 (해설에서)
    if not answer and explanation:
        answer_patterns = [
            r'정답\s*[:：]\s*(\d+)',
            r'정답은\s*(\d+)',
            r'\((\d+)\)\s*번?\s*이?\s*정답',
            r'(\d+)\s*번?\s*이?\s*정답',
            r'@[^\d]*(\d+)'
        ]
        
        for pattern in answer_patterns:
            match = re.search(pattern, explanation)
            if match:
                try:
                    answer = int(match.group(1))
                    break
                except:
                    pass
    
    return {
        'id': seq_number,
        'original_id': original_id,
        'question': question_text.strip(),
        'choices': choices,
        'answer': answer,
        'explanation': explanation.strip(),
        'keywords': keywords
    }

def main():
    input_file = '/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-7th-complete.md'
    output_file = '/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-7th-all-questions.json'
    
    print("제7회 나무의사 기출문제 전체 추출 시작...")
    
    try:
        questions = extract_all_421_questions(input_file)
        
        # 통계
        total = len(questions)
        with_text = sum(1 for q in questions if q['question'])
        with_choices = sum(1 for q in questions if q['choices'])
        with_answers = sum(1 for q in questions if q['answer'] is not None)
        with_explanations = sum(1 for q in questions if q['explanation'])
        complete = sum(1 for q in questions if q['question'] and len(q['choices']) >= 4)
        
        # JSON 저장
        output_data = {
            'exam_info': {
                'title': '제7회 나무의사 기출문제',
                'total_questions': total,
                'questions_with_text': with_text,
                'questions_with_choices': with_choices,
                'questions_with_answers': with_answers,
                'questions_with_explanations': with_explanations,
                'complete_questions': complete,
                'extraction_date': '2025-07-28',
                'note': '문제 번호는 1부터 순차적으로 부여됨. original_id는 원본 파일의 번호(0-9 반복)'
            },
            'questions': questions
        }
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, ensure_ascii=False, indent=2)
        
        print(f"\n추출 완료!")
        print(f"총 문제 수: {total}개")
        print(f"문제 텍스트가 있는 문제: {with_text}개")
        print(f"선택지가 있는 문제: {with_choices}개")
        print(f"정답이 있는 문제: {with_answers}개")
        print(f"해설이 있는 문제: {with_explanations}개")
        print(f"완전한 문제(텍스트+4개 이상 선택지): {complete}개")
        print(f"\n결과 파일: {output_file}")
        
        # 샘플 출력
        print("\n[샘플 문제]")
        for i in [0, 100, 200, 300, 400]:
            if i < len(questions):
                q = questions[i]
                print(f"\n문제 {q['id']} (원본 ID: {q['original_id']}):")
                print(f"  문제: {q['question'][:50]}..." if q['question'] else "  문제: (없음)")
                print(f"  선택지 수: {len(q['choices'])}")
                print(f"  정답: {q['answer']}")
        
    except Exception as e:
        print(f"오류 발생: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()