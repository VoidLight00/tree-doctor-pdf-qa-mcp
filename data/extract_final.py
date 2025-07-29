#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import re
import json
from typing import List, Dict, Any, Optional, Tuple

def extract_all_questions(filepath: str) -> List[Dict[str, Any]]:
    """파일에서 모든 문제를 추출합니다."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 문제 섹션 분리 (## 문제로 시작하는 섹션들)
    problem_sections = re.split(r'(?=## 문제 \d+)', content)
    questions = []
    
    for section in problem_sections:
        if not section.strip() or not section.startswith('## 문제'):
            continue
            
        # 문제 번호 추출
        id_match = re.match(r'## 문제 (\d+)', section)
        if not id_match:
            continue
            
        question_id = int(id_match.group(1))
        
        # 섹션 내용을 줄 단위로 분리
        lines = section.split('\n')
        
        # 문제 텍스트 찾기
        question_text = ""
        choices = []
        answer = None
        explanation = ""
        keywords = []
        
        i = 0
        while i < len(lines):
            line = lines[i].strip()
            
            # **문제**: 로 시작하는 줄 찾기
            if line.startswith("**문제**:"):
                question_text = line.replace("**문제**:", "").strip()
                # 다음 줄들도 문제 텍스트에 포함될 수 있음
                i += 1
                while i < len(lines):
                    next_line = lines[i].strip()
                    # 선택지 패턴이나 다른 마커를 만나면 중단
                    if (next_line.startswith("**해설**:") or 
                        next_line.startswith("**키워드**:") or
                        next_line.startswith("---") or
                        re.match(r'^[①②③④⑤\(]?\d+[\).]', next_line) or
                        next_line.startswith("@")):
                        break
                    if next_line:
                        question_text += " " + next_line
                    i += 1
                i -= 1  # 마지막으로 확인한 줄로 되돌아가기
            
            # 선택지 패턴들
            elif re.match(r'^[①②③④⑤]', line):
                # ① ② ③ ④ ⑤ 형식
                match = re.match(r'^([①②③④⑤])\s*(.+)', line)
                if match:
                    number = ord(match.group(1)) - ord('①') + 1
                    text = match.group(2).strip()
                    choices.append({'number': number, 'text': text})
            
            elif re.match(r'^\(\d+\)', line):
                # (1) (2) (3) 형식
                match = re.match(r'^\((\d+)\)\s*(.+)', line)
                if match:
                    number = int(match.group(1))
                    text = match.group(2).strip()
                    choices.append({'number': number, 'text': text})
            
            elif re.match(r'^\d+\)', line):
                # 1) 2) 3) 형식
                match = re.match(r'^(\d+)\)\s*(.+)', line)
                if match:
                    number = int(match.group(1))
                    text = match.group(2).strip()
                    choices.append({'number': number, 'text': text})
            
            elif line.startswith("@"):
                # @ 표시는 보통 정답 표시
                # 이전 선택지들 중에서 @ 앞의 번호 찾기
                for j in range(i-1, max(0, i-10), -1):
                    prev_line = lines[j].strip()
                    match = re.match(r'^[①②③④⑤\(]?(\d+)[\).]', prev_line)
                    if match:
                        answer = int(match.group(1))
                        break
            
            # **해설**: 로 시작하는 줄
            elif line.startswith("**해설**:"):
                explanation = line.replace("**해설**:", "").strip()
                # 다음 줄들도 해설에 포함
                i += 1
                while i < len(lines):
                    next_line = lines[i].strip()
                    if next_line.startswith("**키워드**:") or next_line.startswith("---"):
                        break
                    if next_line:
                        explanation += " " + next_line
                    i += 1
                i -= 1
            
            # **키워드**: 로 시작하는 줄
            elif line.startswith("**키워드**:"):
                keyword_line = line.replace("**키워드**:", "").strip()
                if keyword_line:
                    keywords = [k.strip() for k in keyword_line.split(',') if k.strip()]
            
            i += 1
        
        # 문제 텍스트가 비어있는 경우 처리
        if not question_text and len(lines) > 2:
            # **문제**: 가 없는 경우, 문제 번호 다음 줄부터 선택지 전까지를 문제로 간주
            for i in range(2, len(lines)):
                line = lines[i].strip()
                if line and not line.startswith("**") and not line.startswith("---"):
                    if re.match(r'^[①②③④⑤\(]?\d+[\).]', line) or line.startswith("@"):
                        break
                    question_text = line
                    break
        
        # 정답이 해설에 포함되어 있는 경우
        if not answer and explanation:
            # 여러 정답 패턴 확인
            patterns = [
                r'정답\s*[:：]\s*(\d+)',
                r'답\s*[:：]\s*(\d+)',
                r'정답은\s*(\d+)',
                r'\((\d+)\)\s*번?\s*이?\s*정답',
                r'(\d+)\s*번?\s*이?\s*정답'
            ]
            for pattern in patterns:
                match = re.search(pattern, explanation)
                if match:
                    answer = int(match.group(1))
                    break
        
        # 문제가 유효한 경우만 추가
        if question_text or choices:
            questions.append({
                'id': question_id,
                'question': question_text.strip(),
                'choices': choices,
                'answer': answer,
                'explanation': explanation.strip(),
                'keywords': keywords
            })
    
    return questions

def main():
    input_file = '/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-7th-complete.md'
    output_file = '/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-7th-final.json'
    
    print("제7회 나무의사 기출문제 추출 시작...")
    
    try:
        questions = extract_all_questions(input_file)
        
        # ID 순으로 정렬
        questions.sort(key=lambda x: x['id'])
        
        # 중복 ID 처리 (같은 ID를 가진 문제들을 그룹화)
        question_groups = {}
        for q in questions:
            if q['id'] not in question_groups:
                question_groups[q['id']] = []
            question_groups[q['id']].append(q)
        
        # 각 ID에서 가장 완전한 문제 선택
        final_questions = []
        for qid, group in question_groups.items():
            # 선택지가 가장 많고 문제 텍스트가 긴 것을 선택
            best_q = max(group, key=lambda q: (len(q['choices']), len(q['question'])))
            final_questions.append(best_q)
        
        # 다시 정렬
        final_questions.sort(key=lambda x: x['id'])
        
        # 통계
        total = len(final_questions)
        with_choices = sum(1 for q in final_questions if q['choices'])
        with_answers = sum(1 for q in final_questions if q['answer'] is not None)
        with_explanations = sum(1 for q in final_questions if q['explanation'])
        
        # JSON 저장
        output_data = {
            'exam_info': {
                'title': '제7회 나무의사 기출문제',
                'total_questions': total,
                'questions_with_choices': with_choices,
                'questions_with_answers': with_answers,
                'questions_with_explanations': with_explanations,
                'extraction_date': '2025-07-28',
                'note': '일부 문제는 OCR 오류로 인해 완전하지 않을 수 있습니다.'
            },
            'questions': final_questions
        }
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, ensure_ascii=False, indent=2)
        
        print(f"\n추출 완료!")
        print(f"총 문제 수: {total}개")
        print(f"선택지가 있는 문제: {with_choices}개")
        print(f"정답이 있는 문제: {with_answers}개")
        print(f"해설이 있는 문제: {with_explanations}개")
        print(f"\n결과 파일: {output_file}")
        
        # 추출 품질 확인을 위한 샘플 출력
        print("\n[추출 샘플]")
        for i in range(min(3, len(final_questions))):
            q = final_questions[i]
            print(f"\n문제 {q['id']}:")
            print(f"  문제: {q['question'][:60]}...")
            print(f"  선택지 수: {len(q['choices'])}")
            print(f"  정답: {q['answer']}")
            if q['choices']:
                print("  선택지 예시:", q['choices'][0])
        
    except Exception as e:
        print(f"오류 발생: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()