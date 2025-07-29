#!/usr/bin/env python3
import re
import json
import sys

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
        'ALLE': '알'
    }
    
    for old, new in replacements.items():
        text = text.replace(old, new)
    
    # 불필요한 특수문자 제거
    text = re.sub(r'[\[\]]{2,}', '', text)
    text = re.sub(r'\s+', ' ', text)
    
    return text.strip()

def extract_questions_v2(file_path):
    """제8회 나무의사 기출문제를 더 정확히 추출"""
    
    questions = []
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 문제별로 분리
    sections = content.split('## 문제 ')
    
    question_id = 0
    for section in sections[1:]:  # 첫 번째는 헤더이므로 제외
        lines = section.strip().split('\n')
        
        if not lines:
            continue
            
        # 문제 번호 추출
        first_line = lines[0].strip()
        if first_line.isdigit():
            question_id = int(first_line)
            lines = lines[1:]
        else:
            question_id += 1
        
        question_data = {
            'id': question_id,
            'question': '',
            'options': [],
            'answer': '',
            'explanation': '',
            'keywords': [],
            'raw_text': section  # 원본 텍스트 보존
        }
        
        current_field = None
        option_count = 0
        
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
                question_data['answer'] = line.replace('**정답**:', '').strip()
            elif line.startswith('**해설**:'):
                current_field = 'explanation'
                question_data['explanation'] = clean_text(line.replace('**해설**:', '').strip())
            elif line.startswith('**키워드**:'):
                keywords_text = line.replace('**키워드**:', '').strip()
                question_data['keywords'] = [k.strip() for k in keywords_text.split(',') if k.strip()]
                current_field = None
            else:
                # 현재 필드에 따라 처리
                if current_field == 'question':
                    question_data['question'] += ' ' + clean_text(line)
                elif current_field == 'options' or (current_field is None and option_count < 5):
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
                        (r'^1\)', '1)'),
                        (r'^2\)', '2)'),
                        (r'^3\)', '3)'),
                        (r'^4\)', '4)'),
                        (r'^5\)', '5)'),
                        (r'^0[1-5]', 'num'),
                        (r'^[가-하]\.', 'kor')
                    ]
                    
                    is_option = False
                    for pattern, type_name in option_patterns:
                        if re.match(pattern, line):
                            question_data['options'].append(clean_text(line))
                            option_count += 1
                            is_option = True
                            current_field = 'options'
                            break
                    
                    if not is_option and current_field == 'options' and question_data['options']:
                        # 이전 선택지의 연속
                        question_data['options'][-1] += ' ' + clean_text(line)
                elif current_field == 'explanation':
                    question_data['explanation'] += ' ' + clean_text(line)
                elif current_field == 'answer':
                    question_data['answer'] += ' ' + line
        
        # 문제 텍스트 정리
        question_data['question'] = ' '.join(question_data['question'].split())
        question_data['explanation'] = ' '.join(question_data['explanation'].split())
        
        # 유효한 문제만 추가 (최소 20자 이상의 문제 텍스트)
        if question_data['question'] and len(question_data['question']) > 20:
            questions.append(question_data)
    
    return questions

def analyze_questions(questions):
    """문제 분석 및 통계"""
    stats = {
        'total': len(questions),
        'with_options': 0,
        'with_answer': 0,
        'with_explanation': 0,
        'with_keywords': 0,
        'by_keyword': {}
    }
    
    for q in questions:
        if q['options']:
            stats['with_options'] += 1
        if q['answer']:
            stats['with_answer'] += 1
        if q['explanation']:
            stats['with_explanation'] += 1
        if q['keywords']:
            stats['with_keywords'] += 1
            for keyword in q['keywords']:
                stats['by_keyword'][keyword] = stats['by_keyword'].get(keyword, 0) + 1
    
    return stats

def main():
    input_file = '/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-8th-complete.md'
    output_file = '/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-8th-questions-v2.json'
    
    print(f"파일 읽기 중: {input_file}")
    questions = extract_questions_v2(input_file)
    
    print(f"총 {len(questions)}개의 문제를 추출했습니다.")
    
    # 통계 분석
    stats = analyze_questions(questions)
    
    # JSON으로 저장
    output_data = {
        'exam_info': {
            'title': '제8회 나무의사 기출문제',
            'total_questions': len(questions),
            'extraction_date': '2025-07-28',
            'ocr_quality_note': 'OCR 품질이 좋지 않아 일부 텍스트가 부정확할 수 있음'
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
    print(f"선택지가 있는 문제: {stats['with_options']}개 ({stats['with_options']/stats['total']*100:.1f}%)")
    print(f"정답이 있는 문제: {stats['with_answer']}개 ({stats['with_answer']/stats['total']*100:.1f}%)")
    print(f"해설이 있는 문제: {stats['with_explanation']}개 ({stats['with_explanation']/stats['total']*100:.1f}%)")
    print(f"키워드가 있는 문제: {stats['with_keywords']}개 ({stats['with_keywords']/stats['total']*100:.1f}%)")
    
    print(f"\n=== 상위 키워드 ===")
    sorted_keywords = sorted(stats['by_keyword'].items(), key=lambda x: x[1], reverse=True)[:10]
    for keyword, count in sorted_keywords:
        print(f"{keyword}: {count}개")

if __name__ == '__main__':
    main()