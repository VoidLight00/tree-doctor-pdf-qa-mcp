#!/usr/bin/env python3
"""
제9회 나무의사 기출문제 추출 스크립트 (개선된 버전)
"""
import re
import json
from typing import List, Dict, Optional, Tuple
import sys

def clean_text(text: str) -> str:
    """텍스트 정리"""
    # 불필요한 공백 제거
    text = re.sub(r'\s+', ' ', text)
    # OCR 오류 수정
    text = text.replace('ㅎ', '°').replace('승', '°C')
    text = text.replace('메서', '에서').replace('메', '에')
    text = text.strip()
    return text

def extract_question_text(block: str) -> Tuple[str, List[str]]:
    """문제 텍스트와 본문 추출"""
    lines = block.strip().split('\n')
    question_text = ""
    content_lines = []
    
    in_question = False
    for i, line in enumerate(lines):
        if '**문제**:' in line:
            # 문제 텍스트 시작
            question_text = line.split('**문제**:')[1].strip()
            in_question = True
            
            # 다음 줄들도 문제에 포함될 수 있음
            j = i + 1
            while j < len(lines) and not lines[j].startswith('**') and not lines[j].startswith('##'):
                if lines[j].strip():
                    question_text += " " + lines[j].strip()
                j += 1
                if '①' in lines[j-1] or '(1)' in lines[j-1] or 'ㄱ.' in lines[j-1]:
                    break
        elif not in_question and line.strip() and not line.startswith('##'):
            content_lines.append(line)
    
    return clean_text(question_text), content_lines

def extract_choices_from_text(text: str) -> List[Dict[str, str]]:
    """텍스트에서 선택지 추출"""
    choices = []
    
    # 번호 선택지 (①②③④⑤)
    pattern1 = r'([①②③④⑤])\s*([^①②③④⑤]+?)(?=[①②③④⑤]|$)'
    matches = re.findall(pattern1, text, re.DOTALL)
    if matches:
        for num, content in matches:
            choices.append({
                'number': num,
                'text': clean_text(content)
            })
        return choices
    
    # 괄호 선택지 (1) (2) (3) (4) (5)
    pattern2 = r'[(（]\s*([1-5])\s*[)）]\s*([^(（)）]+?)(?=[(（]\s*[1-5]\s*[)）]|$)'
    matches = re.findall(pattern2, text, re.DOTALL)
    if matches:
        for num, content in matches:
            choices.append({
                'number': num,
                'text': clean_text(content)
            })
        return choices
    
    # ㄱㄴㄷㄹ 선택지
    pattern3 = r'([ㄱㄴㄷㄹ])\.\s*([^ㄱㄴㄷㄹ]+?)(?=[ㄱㄴㄷㄹ]\.|$)'
    matches = re.findall(pattern3, text, re.DOTALL)
    if matches:
        for letter, content in matches:
            choices.append({
                'number': letter,
                'text': clean_text(content)
            })
    
    return choices

def extract_answer_from_text(text: str) -> Optional[str]:
    """텍스트에서 정답 추출"""
    # 다양한 정답 패턴
    patterns = [
        r'정답\s*[:：]\s*([①②③④⑤1-5])',
        r'답\s*[:：]\s*([①②③④⑤1-5])',
        r'\[정답\s*([①②③④⑤1-5])\]',
        r'\(정답\s*([①②③④⑤1-5])\)',
        r'정답은\s*([①②③④⑤1-5])',
        r'답은\s*([①②③④⑤1-5])'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            return match.group(1)
    
    # 대괄호나 괄호 안의 정답 힌트
    if '[' in text and ']' in text:
        bracket_match = re.search(r'\[([①②③④⑤1-5])\]', text)
        if bracket_match:
            return bracket_match.group(1)
    
    return None

def extract_keywords(text: str) -> List[str]:
    """키워드 추출"""
    keywords = []
    
    # 키워드 패턴
    keyword_patterns = [
        r'\*\*키워드\*\*[:：]\s*(.+?)(?:\n|$)',
        r'키워드[:：]\s*(.+?)(?:\n|$)'
    ]
    
    for pattern in keyword_patterns:
        match = re.search(pattern, text)
        if match:
            keyword_text = match.group(1)
            keywords = [k.strip() for k in keyword_text.split(',')]
            break
    
    return keywords

def parse_question_block(block: str, question_num: int) -> Optional[Dict]:
    """문제 블록 파싱"""
    question_text, content_lines = extract_question_text(block)
    
    if not question_text or len(question_text) < 3:
        return None
    
    # 전체 텍스트
    full_text = block
    
    # 선택지 추출
    choices = extract_choices_from_text(full_text)
    
    # 정답 추출
    answer = extract_answer_from_text(full_text)
    
    # 키워드 추출
    keywords = extract_keywords(full_text)
    
    # 문제 유형 판단
    question_type = "객관식" if choices else "주관식"
    
    return {
        'number': question_num,
        'question': question_text,
        'type': question_type,
        'choices': choices,
        'answer': answer,
        'keywords': keywords,
        'content': '\n'.join(content_lines) if content_lines else None
    }

def main():
    """메인 함수"""
    input_file = "/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-9th-complete.md"
    output_file = "/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-9th-questions-final.json"
    
    questions = []
    current_block = ""
    question_count = 0
    
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 문제 블록 분리
    blocks = re.split(r'\n---\n', content)
    
    for block in blocks:
        if '## 문제' in block and '**문제**:' in block:
            question_count += 1
            parsed = parse_question_block(block, question_count)
            if parsed and len(parsed['question']) > 3:
                questions.append(parsed)
    
    # 중복 제거
    unique_questions = {}
    for q in questions:
        key = q['question'][:30]  # 처음 30자로 중복 체크
        if key not in unique_questions:
            unique_questions[key] = q
    
    # 번호 재정렬
    final_questions = list(unique_questions.values())
    final_questions.sort(key=lambda x: x['number'])
    
    # 150문제 목표
    if len(final_questions) > 150:
        print(f"경고: {len(final_questions)}개의 문제가 발견되었습니다. 150개로 제한합니다.")
        final_questions = final_questions[:150]
    
    # 번호 재할당
    for i, q in enumerate(final_questions, 1):
        q['number'] = i
    
    # JSON 저장
    output_data = {
        "exam_info": {
            "title": "제9회 나무의사 자격시험 기출문제",
            "total_questions": len(final_questions),
            "extraction_date": "2025-07-28",
            "note": "OCR 추출로 인해 일부 문제나 선택지가 불완전할 수 있습니다."
        },
        "questions": final_questions
    }
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)
    
    # 통계 출력
    print(f"\n=== 제9회 나무의사 기출문제 추출 완료 ===")
    print(f"총 문제 수: {len(final_questions)}개")
    
    obj_count = sum(1 for q in final_questions if q['type'] == '객관식')
    subj_count = sum(1 for q in final_questions if q['type'] == '주관식')
    with_answer = sum(1 for q in final_questions if q['answer'])
    with_keywords = sum(1 for q in final_questions if q['keywords'])
    
    print(f"\n문제 유형:")
    print(f"- 객관식: {obj_count}개")
    print(f"- 주관식: {subj_count}개")
    print(f"\n추가 정보:")
    print(f"- 정답 포함: {with_answer}개")
    print(f"- 키워드 포함: {with_keywords}개")
    print(f"\n결과 파일: {output_file}")
    
    # 샘플 출력
    print("\n=== 샘플 문제 (처음 3개) ===")
    for i, q in enumerate(final_questions[:3], 1):
        print(f"\n문제 {q['number']}: {q['question']}")
        if q['choices']:
            for choice in q['choices']:
                print(f"  {choice['number']}. {choice['text']}")
        if q['answer']:
            print(f"  정답: {q['answer']}")
        if q['keywords']:
            print(f"  키워드: {', '.join(q['keywords'])}")

if __name__ == "__main__":
    main()