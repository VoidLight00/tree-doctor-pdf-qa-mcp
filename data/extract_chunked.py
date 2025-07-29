#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import re
import json
from typing import List, Dict, Any, Optional

def process_chunk(chunk: str, start_line: int) -> List[Dict[str, Any]]:
    """청크를 처리하여 문제들을 추출합니다."""
    questions = []
    
    # 문제 패턴 찾기
    problem_pattern = r'## 문제 (\d+)\s*\n'
    matches = list(re.finditer(problem_pattern, chunk))
    
    for i, match in enumerate(matches):
        question_id = int(match.group(1))
        start_pos = match.end()
        
        # 다음 문제까지의 내용 또는 청크 끝까지
        if i < len(matches) - 1:
            end_pos = matches[i + 1].start()
        else:
            end_pos = len(chunk)
        
        section = chunk[start_pos:end_pos]
        
        # 섹션 처리
        question_data = parse_question_section(section, question_id)
        if question_data:
            questions.append(question_data)
    
    return questions

def parse_question_section(section: str, question_id: int) -> Optional[Dict[str, Any]]:
    """문제 섹션을 파싱합니다."""
    lines = section.strip().split('\n')
    if not lines:
        return None
    
    question_text = ""
    choices = []
    answer = None
    explanation = ""
    keywords = []
    
    # 상태 추적
    current_mode = "question"  # question, choices, explanation, keywords
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # 모드 전환 체크
        if line.startswith("**문제**:"):
            current_mode = "question"
            question_text = line.replace("**문제**:", "").strip()
            continue
        elif line.startswith("**해설**:"):
            current_mode = "explanation"
            explanation = line.replace("**해설**:", "").strip()
            continue
        elif line.startswith("**키워드**:"):
            current_mode = "keywords"
            keyword_text = line.replace("**키워드**:", "").strip()
            if keyword_text:
                keywords = [k.strip() for k in keyword_text.split(',') if k.strip()]
            continue
        elif line == "---":
            break
        
        # 선택지 패턴 체크
        choice_match = None
        
        # ① ② ③ ④ ⑤ 형식
        match1 = re.match(r'^([①②③④⑤])\s*(.+)', line)
        if match1:
            number = ord(match1.group(1)) - ord('①') + 1
            text = match1.group(2).strip()
            choices.append({'number': number, 'text': text})
            current_mode = "choices"
            continue
        
        # (1) (2) 형식
        match2 = re.match(r'^\((\d+)\)\s*(.+)', line)
        if match2:
            number = int(match2.group(1))
            text = match2.group(2).strip()
            choices.append({'number': number, 'text': text})
            current_mode = "choices"
            continue
        
        # 1) 2) 형식
        match3 = re.match(r'^(\d+)\)\s*(.+)', line)
        if match3:
            number = int(match3.group(1))
            text = match3.group(2).strip()
            choices.append({'number': number, 'text': text})
            current_mode = "choices"
            continue
        
        # @ 표시 (정답)
        if line.startswith("@") and choices:
            # 바로 이전 선택지가 정답
            if len(choices) > 0:
                answer = choices[-1]['number']
            continue
        
        # 현재 모드에 따라 텍스트 추가
        if current_mode == "question" and not question_text:
            question_text = line
        elif current_mode == "question":
            question_text += " " + line
        elif current_mode == "explanation":
            explanation += " " + line
        elif current_mode == "keywords":
            if line:
                keywords.extend([k.strip() for k in line.split(',') if k.strip()])
    
    # 정답 추출 (해설에서)
    if not answer and explanation:
        answer_patterns = [
            r'정답\s*[:：]\s*(\d+)',
            r'답\s*[:：]\s*(\d+)',
            r'정답은\s*(\d+)',
            r'\((\d+)\)\s*번?\s*이?\s*정답',
            r'(\d+)\s*번?\s*이?\s*정답',
            r'@.*?(\d+)'
        ]
        
        for pattern in answer_patterns:
            match = re.search(pattern, explanation)
            if match:
                answer = int(match.group(1))
                break
    
    # 문제 텍스트가 없으면 첫 줄을 문제로 사용
    if not question_text and lines:
        for line in lines:
            line = line.strip()
            if line and not line.startswith("**") and not line.startswith("---"):
                question_text = line
                break
    
    return {
        'id': question_id,
        'question': question_text.strip(),
        'choices': choices,
        'answer': answer,
        'explanation': explanation.strip(),
        'keywords': keywords
    }

def extract_all_questions_chunked(filepath: str) -> List[Dict[str, Any]]:
    """파일을 청크로 나누어 모든 문제를 추출합니다."""
    questions = []
    chunk_size = 50000  # 50KB 청크
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 전체 내용을 한 번에 처리
    all_questions = process_chunk(content, 0)
    
    # ID별로 그룹화하고 가장 완전한 것 선택
    question_dict = {}
    for q in all_questions:
        qid = q['id']
        if qid not in question_dict:
            question_dict[qid] = q
        else:
            # 더 완전한 문제로 교체
            existing = question_dict[qid]
            if (len(q['choices']) > len(existing['choices']) or
                (len(q['choices']) == len(existing['choices']) and len(q['question']) > len(existing['question']))):
                question_dict[qid] = q
    
    return list(question_dict.values())

def main():
    input_file = '/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-7th-complete.md'
    output_file = '/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-7th-extracted.json'
    
    print("제7회 나무의사 기출문제 추출 (청크 방식)...")
    
    try:
        questions = extract_all_questions_chunked(input_file)
        
        # ID 순으로 정렬
        questions.sort(key=lambda x: x['id'])
        
        # 통계
        total = len(questions)
        with_choices = sum(1 for q in questions if q['choices'])
        with_answers = sum(1 for q in questions if q['answer'] is not None)
        with_explanations = sum(1 for q in questions if q['explanation'])
        complete_questions = sum(1 for q in questions if q['question'] and q['choices'] and q['answer'])
        
        # 문제 번호 범위 확인
        question_ids = [q['id'] for q in questions]
        min_id = min(question_ids) if question_ids else 0
        max_id = max(question_ids) if question_ids else 0
        
        # JSON 저장
        output_data = {
            'exam_info': {
                'title': '제7회 나무의사 기출문제',
                'total_questions': total,
                'question_id_range': f'{min_id}~{max_id}',
                'complete_questions': complete_questions,
                'questions_with_choices': with_choices,
                'questions_with_answers': with_answers,
                'questions_with_explanations': with_explanations,
                'extraction_date': '2025-07-28'
            },
            'questions': questions
        }
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, ensure_ascii=False, indent=2)
        
        print(f"\n추출 완료!")
        print(f"총 문제 수: {total}개 (ID: {min_id}~{max_id})")
        print(f"완전한 문제 (텍스트+선택지+정답): {complete_questions}개")
        print(f"선택지가 있는 문제: {with_choices}개")
        print(f"정답이 있는 문제: {with_answers}개")
        print(f"해설이 있는 문제: {with_explanations}개")
        print(f"\n결과 파일: {output_file}")
        
        # 문제 분포 확인
        if questions:
            print("\n[문제 ID 분포]")
            id_counts = {}
            for q in questions:
                decade = (q['id'] // 10) * 10
                id_counts[decade] = id_counts.get(decade, 0) + 1
            
            for decade in sorted(id_counts.keys()):
                print(f"  {decade}~{decade+9}번대: {id_counts[decade]}개")
        
    except Exception as e:
        print(f"오류 발생: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()