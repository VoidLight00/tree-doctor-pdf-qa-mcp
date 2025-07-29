#!/usr/bin/env python3
import re
import json
import sys
from collections import defaultdict

def clean_text(text):
    """OCR 오류로 인한 텍스트 정리"""
    # 일반적인 OCR 오류 패턴 수정
    replacements = {
        'S[': '시',
        'O]': '이',
        'AS': '잎',
        'HS': '하는',
        'SS': '수',
        'VS': '위',
        'BS': '비',
        'ES': '에',
        'LS': '로',
        'PS': '피',
        'US': '우',
        'Bo]': '잎이',
        'Ho]': '회',
        'Oo]': '오',
        'SAS': '상',
        'SANS': '상',
        'HAS': '하',
        'WAS': '와',
        'LAS': '라',
        'MAS': '마',
        'BAS': '바',
        'SSO]': '수이',
        'SHO]': '시오',
        'ASO]': '이소',
        'ALLE': '알',
        'HALE': '할',
        'SALE': '살',
        'ILLE': '일',
        'et': '데',
        'Hol': '회이',
        'Sol': '소이',
        'Bal': '발',
        'Mal': '말',
        'Dal': '달'
    }
    
    for old, new in replacements.items():
        text = text.replace(old, new)
    
    # 불필요한 특수문자 제거
    text = re.sub(r'[\[\]]{2,}', '', text)
    text = re.sub(r'\s+', ' ', text)
    
    return text.strip()

def extract_answer_references(content):
    """정답 참조 추출"""
    answer_refs = {}
    
    # 정답 패턴들
    answer_patterns = [
        r'정답\s*[:：]\s*(\d+)\s*[-\-]\s*([0-9①②③④⑤()]+)',
        r'답\s*[:：]\s*(\d+)\s*[-\-]\s*([0-9①②③④⑤()]+)',
        r'섬답\s*[:：]\s*(\d+)\s*[-\-]\s*([0-9①②③④⑤()]+)'
    ]
    
    for pattern in answer_patterns:
        matches = re.findall(pattern, content)
        for match in matches:
            question_num = int(match[0])
            answer = match[1].strip()
            # 괄호 제거
            answer = re.sub(r'[()]', '', answer)
            answer_refs[question_num] = answer
    
    return answer_refs

def parse_question_block(text, question_id, answer_refs):
    """문제 블록 파싱"""
    lines = text.strip().split('\n')
    
    question_data = {
        'id': question_id,
        'question': '',
        'options': [],
        'answer': '',
        'explanation': '',
        'keywords': []
    }
    
    # 정답 참조 확인
    if question_id in answer_refs:
        question_data['answer'] = answer_refs[question_id]
    
    current_field = None
    option_buffer = []
    
    for line in lines:
        line = line.strip()
        if not line or line == '---':
            continue
        
        # 필드 구분
        if line.startswith('**문제**:'):
            current_field = 'question'
            question_data['question'] = clean_text(line.replace('**문제**:', '').strip())
        elif line.startswith('**선택지**:'):
            current_field = 'options'
            continue
        elif line.startswith('**정답**:'):
            current_field = 'answer'
            answer_text = line.replace('**정답**:', '').strip()
            if answer_text:
                question_data['answer'] = answer_text
        elif line.startswith('**해설**:'):
            current_field = 'explanation'
            question_data['explanation'] = clean_text(line.replace('**해설**:', '').strip())
        elif line.startswith('**키워드**:'):
            keywords_text = line.replace('**키워드**:', '').strip()
            question_data['keywords'] = [k.strip() for k in keywords_text.split(',') if k.strip()]
            current_field = None
        else:
            # 선택지 패턴 확인
            option_patterns = [
                (r'^①', '①'),
                (r'^②', '②'),
                (r'^③', '③'),
                (r'^④', '④'),
                (r'^⑤', '⑤'),
                (r'^\(1\)', '(1)'),
                (r'^\(2\)', '(2)'),
                (r'^\(3\)', '(3)'),
                (r'^\(4\)', '(4)'),
                (r'^\(5\)', '(5)'),
                (r'^0[1-5]', 'num'),
                (r'^[가-하]\.', 'kor'),
                (r'^ㄱ\.', 'ㄱ'),
                (r'^ㄴ\.', 'ㄴ'),
                (r'^ㄷ\.', 'ㄷ'),
                (r'^ㄹ\.', 'ㄹ'),
                (r'^ㅁ\.', 'ㅁ')
            ]
            
            is_option = False
            for pattern, type_name in option_patterns:
                if re.match(pattern, line):
                    option_buffer.append(clean_text(line))
                    is_option = True
                    current_field = 'options'
                    break
            
            if not is_option:
                if current_field == 'question':
                    question_data['question'] += ' ' + clean_text(line)
                elif current_field == 'options' and option_buffer:
                    # 이전 선택지의 연속
                    option_buffer[-1] += ' ' + clean_text(line)
                elif current_field == 'explanation':
                    question_data['explanation'] += ' ' + clean_text(line)
                elif current_field == 'answer':
                    question_data['answer'] += ' ' + line
    
    # 선택지 정리
    question_data['options'] = option_buffer
    
    # 텍스트 정리
    question_data['question'] = ' '.join(question_data['question'].split())
    question_data['explanation'] = ' '.join(question_data['explanation'].split())
    
    return question_data

def extract_questions_final(file_path):
    """제8회 나무의사 기출문제 최종 추출"""
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 정답 참조 먼저 추출
    answer_refs = extract_answer_references(content)
    print(f"추출된 정답 참조: {len(answer_refs)}개")
    
    # 문제별로 분리
    sections = content.split('## 문제 ')
    
    questions = []
    question_id = 0
    
    for section in sections[1:]:  # 첫 번째는 헤더이므로 제외
        lines = section.strip().split('\n')
        
        if not lines:
            continue
        
        # 문제 번호 추출
        first_line = lines[0].strip()
        if first_line.isdigit():
            question_id = int(first_line)
            section_text = '\n'.join(lines[1:])
        else:
            question_id += 1
            section_text = section
        
        # 문제 파싱
        question_data = parse_question_block(section_text, question_id, answer_refs)
        
        # 유효한 문제만 추가
        if question_data['question'] and len(question_data['question']) > 20:
            questions.append(question_data)
    
    # 문제 번호 정리 (150문제로 제한)
    final_questions = []
    for i, q in enumerate(questions[:150], 1):
        q['id'] = i
        final_questions.append(q)
    
    return final_questions

def main():
    input_file = '/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-8th-complete.md'
    output_file = '/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-8th-final.json'
    
    print(f"파일 읽기 중: {input_file}")
    questions = extract_questions_final(input_file)
    
    print(f"총 {len(questions)}개의 문제를 추출했습니다.")
    
    # 통계 계산
    stats = {
        'total': len(questions),
        'with_options': sum(1 for q in questions if q['options']),
        'with_answer': sum(1 for q in questions if q['answer']),
        'with_explanation': sum(1 for q in questions if q['explanation']),
        'with_keywords': sum(1 for q in questions if q['keywords'])
    }
    
    # JSON으로 저장
    output_data = {
        'exam_info': {
            'title': '제8회 나무의사 기출문제',
            'total_questions': len(questions),
            'extraction_date': '2025-07-28',
            'note': 'OCR 품질 문제로 일부 텍스트가 부정확할 수 있습니다. 150문제 기준으로 추출했습니다.'
        },
        'statistics': stats,
        'questions': questions
    }
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)
    
    print(f"\n결과가 {output_file}에 저장되었습니다.")
    
    # 통계 출력
    print(f"\n=== 통계 ===")
    print(f"총 문제 수: {stats['total']}")
    print(f"선택지가 있는 문제: {stats['with_options']}개")
    print(f"정답이 있는 문제: {stats['with_answer']}개")
    print(f"해설이 있는 문제: {stats['with_explanation']}개")
    print(f"키워드가 있는 문제: {stats['with_keywords']}개")
    
    # 샘플 출력
    print(f"\n=== 샘플 문제 ===")
    for i, q in enumerate(questions[:3], 1):
        print(f"\n문제 {q['id']}:")
        print(f"질문: {q['question'][:50]}...")
        if q['options']:
            print(f"선택지 수: {len(q['options'])}")
        if q['answer']:
            print(f"정답: {q['answer']}")
        if q['keywords']:
            print(f"키워드: {', '.join(q['keywords'])}")

if __name__ == '__main__':
    main()