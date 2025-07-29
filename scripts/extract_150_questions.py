#!/usr/bin/env python3
import re
from collections import defaultdict

def extract_and_clean_questions(input_file, output_file):
    """제7회 나무의사 시험 문제를 추출하고 정리합니다."""
    
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 전체 내용을 문제 블록으로 분할
    problem_blocks = content.split('## 문제')
    
    all_questions = []
    
    for block in problem_blocks[1:]:  # 첫 번째는 헤더이므로 제외
        if '**문제**:' not in block:
            continue
            
        # 문제 텍스트 추출
        match = re.search(r'\*\*문제\*\*:\s*(.+?)(?=\*\*(?:해설|키워드)\*\*:|---)', block, re.DOTALL)
        if not match:
            continue
            
        question_text = match.group(1).strip()
        
        # OCR 오류 정리
        question_text = clean_ocr_errors(question_text)
        
        # 문제 유효성 검사
        if is_valid_question(question_text):
            all_questions.append(question_text)
    
    # 중복 제거 (더 정교하게)
    unique_questions = remove_duplicates(all_questions)
    
    # 문제 품질에 따라 정렬
    sorted_questions = sorted(unique_questions, key=lambda q: question_quality_score(q), reverse=True)
    
    # 상위 150개 선택
    final_questions = sorted_questions[:150]
    
    # 부족한 경우 경고
    if len(final_questions) < 150:
        print(f"경고: {len(final_questions)}개의 문제만 추출되었습니다.")
        
        # 기준을 완화하여 추가 문제 찾기
        additional_questions = []
        for q in sorted_questions[150:]:
            if len(q) > 30 and '?' in q:
                additional_questions.append(q)
                if len(final_questions) + len(additional_questions) >= 150:
                    break
        
        final_questions.extend(additional_questions[:150-len(final_questions)])
    
    # 출력 파일 작성
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("# 제7회 나무의사 자격시험 문제 (150문제)\n\n")
        f.write("**시험일자**: 2023년\n")
        f.write("**총 문제수**: 150문제\n")
        f.write("**처리일시**: 2025-07-29\n\n")
        f.write("---\n\n")
        
        for i, question in enumerate(final_questions, 1):
            f.write(f"## 문제 {i}\n\n")
            formatted_q = format_question(question)
            f.write(formatted_q)
            f.write("\n\n---\n\n")
    
    print(f"총 {len(final_questions)}개의 문제를 추출했습니다.")
    return len(final_questions)

def is_valid_question(text):
    """유효한 문제인지 검사합니다."""
    # 너무 짧은 문제 제외
    if len(text) < 20:
        return False
    
    # 선택지가 있는지 확인
    has_choices = bool(re.search(r'[①②③④⑤\(1\)\(2\)\(3\)\(4\)\(5\)]', text))
    
    # 물음표가 있는지 확인
    has_question = '?' in text or '것은' in text or '것을' in text or '하시오' in text
    
    # 유효한 문제 키워드가 있는지 확인
    valid_keywords = ['설명', '다음', '아닌', '옳은', '옳지', '관한', '대한', '경우', '때', '위한']
    has_keywords = any(keyword in text for keyword in valid_keywords)
    
    return (has_choices or has_question) and (has_keywords or len(text) > 100)

def question_quality_score(text):
    """문제의 품질 점수를 계산합니다."""
    score = 0
    
    # 길이 점수
    score += min(len(text), 500) / 10
    
    # 선택지 점수
    if re.search(r'[①②③④⑤]', text):
        score += 50
    elif re.search(r'\([1-5]\)', text):
        score += 40
    
    # 물음표 점수
    if '?' in text:
        score += 30
    
    # 키워드 점수
    keywords = ['설명으로', '다음 중', '아닌 것은', '옳은 것은', '옳지 않은 것은']
    for keyword in keywords:
        if keyword in text:
            score += 20
    
    # 전문 용어 점수
    terms = ['수목', '토양', '병충해', '나무', '병원균', '방제', '생리', '관리']
    for term in terms:
        if term in text:
            score += 5
    
    return score

def remove_duplicates(questions):
    """중복 문제를 제거합니다."""
    unique_questions = []
    seen_starts = set()
    seen_cores = set()
    
    for q in questions:
        # 문제 시작 부분 (처음 30자)
        start = re.sub(r'\s+', '', q[:30])
        
        # 문제 핵심 부분 추출 (선택지 제외)
        core = re.split(r'[①②③④⑤\(1\)\(2\)\(3\)\(4\)\(5\)]', q)[0]
        core = re.sub(r'\s+', '', core)[:50]
        
        if start not in seen_starts and core not in seen_cores:
            seen_starts.add(start)
            seen_cores.add(core)
            unique_questions.append(q)
    
    return unique_questions

def clean_ocr_errors(text):
    """OCR 오류를 정리합니다."""
    # 일반적인 OCR 오류 패턴 교정
    replacements = {
        # 일반적인 OCR 오류
        'SHE': '의해',
        'HOM': '높은',
        'Hop': '위해',
        'AWS': '에서',
        'SFO': '위한',
        'SPOS': '회백색으로',
        'SSS': '전염',
        'ASH': '전염원',
        'SARS': '병원균은',
        'Sz}': '와',
        '7}': '가',
        'ge': '옳은',
        'So': '옳지',
        'OF': '의',
        'AAO': '의한',
        'AAS': '용액',
        'SHARON': '화합물',
        'RIA': '화합물',
        'SASS': '중력을',
        'SAAS': '점액을',
        'Se': '용해시켜',
        'ㅎ)': '3)',
        '65)': '5)',
        'AL?': '것은?',
        'BAA': '실시',
        'BASS': '목을',
        'SAS': '중력',
        'Os': '유충',
        'Wo]': '잎이',
        'HOA': '잎에서',
        'Hol': '에',
        'Ho]': '넣어',
        'DSS': '임분은',
        'A222': '임분은',
        'ASS': '임분을',
        'SEAS': '호흡은',
        'HAS': '활동이',
        'MAS': '활동이',
        'wets': '형성을',
        'OSE': '이동은',
        'GOA]': '잎에서',
        'SHS': '사부를',
        'ABE': '수목',
        'BSS': '충들이',
        'SUAAT|': '소나무재선충은',
        'HAE': '해충',
        '63': '③',
        '@': '⑤',
        '©': '③',
        '0)': '①',
        'S77': '직경',
        'FOAIA|': '굵어지지',
        'ODA': '모니터링',
        'Aaa Bel': '약충이',
        'SIA]': '5월',
        'SSAt': '살포',
        '1[6)': 'ite)',
        '（': '(',
        '）': ')',
        '「': '「',
        '」': '」',
        '|': '」',
        'Ae:': '참고:',
        '017': '된다',
        'DSS': '임분은',
        'SIC': '증가한다',
        'QE': '있는',
        '00%': '80%',
        '옮지 많은': '옳지 않은',
        '옮은': '옳은',
        '옮지': '옳지',
        'S]': '의',
        '알': '③',
        '뭔균': '원균',
        '병뭔균': '병원균',
        'SEF}': '온도가',
        'SPO]': '위에',
        '잠단류야': '집단류',
        '확싼': '확산',
        '명양소': '영양소',
        'SAO': '목에',
        'ASO': '않은',
        '파좀상': '파종상',
        'SEAS': '우드칩을',
        'SAMS': '투수성을',
        '1012k8Atterra': 'Terra',
        'WADA': '① 과상구조',
        '(01055106': '(massive',
        'structrure)': 'structure)',
        '벽상구소': '벽상구조',
        'CSA': '구조가',
        'HSE': '토양',
        '삼구조': '상구조',
        'B.Cce': 'B, C층',
        'ROA': '표토에',
        'DPA': '괴상구조',
        'lem': '1cm',
        'BS': 'B층',
        'ees': '좋다',
        'BAS': '멀칭',
        '2007': '20cm',
        '＊': '*',
        '•': '*',
        'ㆍ': '*',
    }
    
    for old, new in replacements.items():
        text = text.replace(old, new)
    
    # 숫자 뒤 괄호 정리
    text = re.sub(r'(\d)\s*\)', r'\1)', text)
    
    # 선택지 번호 정리
    text = re.sub(r'^\s*\((\d)\)', r'(\1)', text, flags=re.MULTILINE)
    
    # 중복 공백 정리
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'\n\s*\n\s*\n', '\n\n', text)
    
    # 문장 끝 정리
    text = re.sub(r'([가-힣])\s+([가-힣])', r'\1 \2', text)
    
    return text.strip()

def format_question(question_text):
    """문제를 형식에 맞게 정리합니다."""
    lines = question_text.split('\n')
    formatted_lines = []
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # 선택지 패턴 정리
        if re.match(r'^[①②③④⑤\(1\)\(2\)\(3\)\(4\)\(5\)]', line):
            formatted_lines.append(line)
        else:
            # 문제 본문
            if formatted_lines and not formatted_lines[-1].endswith('?'):
                formatted_lines[-1] += ' ' + line
            else:
                formatted_lines.append(line)
    
    return '\n'.join(formatted_lines)

if __name__ == "__main__":
    input_file = "/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-7th-complete.md"
    output_file = "/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-7th-final-150.md"
    
    num_questions = extract_and_clean_questions(input_file, output_file)
    
    if num_questions < 150:
        print(f"경고: {num_questions}개의 문제만 추출되었습니다. 수동 검토가 필요합니다.")