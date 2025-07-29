#!/usr/bin/env python3
"""
제5회 나무의사 기출문제 완벽 추출 스크립트
여러 PDF 추출 라이브러리를 조합하여 최상의 결과 도출
"""
import os
import sys
import subprocess
import json
import re
from datetime import datetime

# 필요한 라이브러리 설치
libraries = [
    'pdfplumber',
    'pypdf2', 
    'pdfminer.six',
    'camelot-py[cv]',
    'tabula-py'
]

for lib in libraries:
    try:
        if lib == 'pdfminer.six':
            __import__('pdfminer')
        elif lib == 'camelot-py[cv]':
            __import__('camelot')
        elif lib == 'tabula-py':
            __import__('tabula')
        else:
            __import__(lib.replace('-', '_').lower())
    except ImportError:
        print(f"{lib} 설치 중...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", lib])

import pdfplumber
import PyPDF2
from pdfminer.high_level import extract_text
from pdfminer.layout import LAParams
import camelot
import tabula

def extract_with_pdfminer(pdf_path):
    """PDFMiner를 사용한 고급 텍스트 추출"""
    try:
        print("PDFMiner로 추출 중...")
        # 한국어 PDF에 최적화된 파라미터
        laparams = LAParams(
            line_overlap=0.5,
            char_margin=2.0,
            word_margin=0.1,
            boxes_flow=0.5,
            detect_vertical=True,
            all_texts=True
        )
        
        text = extract_text(pdf_path, laparams=laparams)
        return text
    except Exception as e:
        print(f"PDFMiner 추출 실패: {str(e)}")
        return None

def extract_tables_with_camelot(pdf_path):
    """Camelot을 사용한 테이블 추출"""
    try:
        print("Camelot으로 테이블 추출 중...")
        tables = camelot.read_pdf(pdf_path, pages='all', flavor='stream')
        
        text = ""
        for i, table in enumerate(tables):
            text += f"\n--- 테이블 {i+1} ---\n"
            text += table.df.to_string(index=False)
            text += "\n"
        
        return text
    except Exception as e:
        print(f"Camelot 추출 실패: {str(e)}")
        return None

def extract_tables_with_tabula(pdf_path):
    """Tabula를 사용한 테이블 추출"""
    try:
        print("Tabula로 테이블 추출 중...")
        tables = tabula.read_pdf(pdf_path, pages='all', multiple_tables=True)
        
        text = ""
        for i, table in enumerate(tables):
            text += f"\n--- 테이블 {i+1} ---\n"
            text += table.to_string(index=False)
            text += "\n"
        
        return text
    except Exception as e:
        print(f"Tabula 추출 실패: {str(e)}")
        return None

def extract_with_pypdf2(pdf_path):
    """PyPDF2를 사용한 추출"""
    try:
        print("PyPDF2로 추출 중...")
        text = ""
        
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            
            for page_num in range(len(pdf_reader.pages)):
                page = pdf_reader.pages[page_num]
                page_text = page.extract_text()
                text += f"\n--- 페이지 {page_num + 1} ---\n{page_text}"
        
        return text
    except Exception as e:
        print(f"PyPDF2 추출 실패: {str(e)}")
        return None

def clean_and_merge_texts(*texts):
    """여러 추출 결과를 정리하고 병합"""
    merged = ""
    
    for text in texts:
        if text:
            # 중복 제거를 위한 처리
            lines = text.split('\n')
            cleaned_lines = []
            
            for line in lines:
                line = line.strip()
                if line and line not in cleaned_lines:
                    cleaned_lines.append(line)
            
            merged += '\n'.join(cleaned_lines) + '\n\n'
    
    return merged

def parse_questions_comprehensive(text):
    """포괄적인 문제 파싱"""
    questions = []
    
    # 전체 텍스트를 줄 단위로 분할
    lines = text.split('\n')
    
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        
        # 문제 번호 패턴 찾기
        num_match = re.match(r'^(\d+)\s*[\.번]?\s*(.*)$', line)
        if num_match:
            q_num = int(num_match.group(1))
            q_text = num_match.group(2).strip()
            
            # 문제 내용이 비어있으면 다음 줄에서 찾기
            if not q_text and i + 1 < len(lines):
                q_text = lines[i + 1].strip()
                i += 1
            
            # 선택지 찾기
            choices = {}
            j = i + 1
            
            while j < len(lines) and len(choices) < 4:
                choice_line = lines[j].strip()
                
                # 선택지 패턴
                for choice_num in ['①', '②', '③', '④']:
                    if choice_num in choice_line:
                        # 선택지 내용 추출
                        idx = choice_line.find(choice_num)
                        choice_text = choice_line[idx + len(choice_num):].strip()
                        
                        # 다음 선택지 번호가 나오기 전까지의 내용 포함
                        k = j + 1
                        while k < len(lines):
                            next_line = lines[k].strip()
                            if any(cn in next_line for cn in ['①', '②', '③', '④']) or re.match(r'^\d+[\.번]', next_line):
                                break
                            if next_line:
                                choice_text += ' ' + next_line
                            k += 1
                        
                        choices[choice_num] = choice_text.strip()
                
                j += 1
            
            # 4개의 선택지가 모두 있으면 문제로 추가
            if len(choices) == 4 and q_text:
                questions.append({
                    'number': q_num,
                    'question': q_text,
                    'choices': choices
                })
        
        i += 1
    
    return questions

def find_answers_in_text(text, questions):
    """텍스트에서 정답 찾기"""
    # 정답 섹션 찾기
    answer_section = ""
    
    # 다양한 정답 섹션 패턴
    patterns = [
        r'정답\s*[:：]',
        r'답\s*[:：]',
        r'해답\s*[:：]',
        r'정답표',
        r'답안'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            answer_section = text[match.end():]
            break
    
    # 각 문제의 정답 찾기
    for q in questions:
        q_num = q['number']
        
        # 정답 패턴들
        answer_patterns = [
            rf'{q_num}\s*[번\.]?\s*[:\-]?\s*([①②③④])',
            rf'{q_num}\s*[번\.]?\s*정답\s*[:\-]?\s*([①②③④])',
            rf'문제\s*{q_num}\s*[:\-]?\s*([①②③④])',
        ]
        
        for pattern in answer_patterns:
            match = re.search(pattern, answer_section if answer_section else text)
            if match:
                q['answer'] = match.group(1)
                break
    
    return questions

def save_final_result(questions, output_path):
    """최종 결과 저장"""
    markdown = "# 제5회 나무의사 기출문제\n\n"
    markdown += f"**추출 완료**: {len(questions)}문제\n"
    markdown += f"**추출 일시**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
    markdown += f"**추출 방법**: 다중 PDF 라이브러리 조합\n\n"
    markdown += "---\n\n"
    
    # 과목별로 분류
    subjects = {
        '수목병리학': range(1, 31),
        '수목해충학': range(31, 61),
        '수목생리학': range(61, 91),
        '산림토양학': range(91, 121),
        '수목관리학': range(121, 151)
    }
    
    for subject, q_range in subjects.items():
        markdown += f"## {subject}\n\n"
        
        subject_questions = [q for q in questions if q['number'] in q_range]
        
        for q in subject_questions:
            markdown += f"### {q['number']}. {q['question']}\n\n"
            
            for choice_num, choice_text in q['choices'].items():
                markdown += f"{choice_num} {choice_text}\n"
            
            if 'answer' in q:
                markdown += f"\n**정답: {q['answer']}**\n"
            
            markdown += "\n---\n\n"
    
    # 통계
    markdown += "\n## 추출 통계\n\n"
    markdown += f"- 총 문제 수: {len(questions)}\n"
    
    for subject, q_range in subjects.items():
        count = len([q for q in questions if q['number'] in q_range])
        markdown += f"- {subject}: {count}/{len(q_range)}문제\n"
    
    with_answer = sum(1 for q in questions if 'answer' in q)
    markdown += f"\n- 정답 포함: {with_answer}/{len(questions)}문제\n"
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(markdown)
    
    return markdown

def main():
    pdf_path = '/Users/voidlight/Downloads/[Codekiller]제5회 기출문제 해설집(v1.0).pdf'
    output_path = '/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-5th-perfect.md'
    
    print('🌳 제5회 나무의사 기출문제 완벽 추출 시작\n')
    
    # 1. 여러 방법으로 텍스트 추출
    print("1단계: 다중 라이브러리를 사용한 텍스트 추출")
    
    texts = []
    
    # PDFMiner 추출
    pdfminer_text = extract_with_pdfminer(pdf_path)
    if pdfminer_text:
        texts.append(pdfminer_text)
        print("✓ PDFMiner 추출 완료")
    
    # PyPDF2 추출
    pypdf2_text = extract_with_pypdf2(pdf_path)
    if pypdf2_text:
        texts.append(pypdf2_text)
        print("✓ PyPDF2 추출 완료")
    
    # 테이블 추출
    camelot_text = extract_tables_with_camelot(pdf_path)
    if camelot_text:
        texts.append(camelot_text)
        print("✓ Camelot 테이블 추출 완료")
    
    tabula_text = extract_tables_with_tabula(pdf_path)
    if tabula_text:
        texts.append(tabula_text)
        print("✓ Tabula 테이블 추출 완료")
    
    # 2. 텍스트 병합 및 정리
    print("\n2단계: 추출된 텍스트 병합 및 정리")
    merged_text = clean_and_merge_texts(*texts)
    
    if not merged_text:
        print("❌ 텍스트 추출 실패")
        return
    
    # 3. 문제 파싱
    print("\n3단계: 문제 구조 파싱")
    questions = parse_questions_comprehensive(merged_text)
    
    # 4. 정답 찾기
    print("\n4단계: 정답 정보 추출")
    questions = find_answers_in_text(merged_text, questions)
    
    # 5. 결과 저장
    print("\n5단계: 결과 저장")
    save_final_result(questions, output_path)
    
    # 디버깅용 원본 텍스트 저장
    debug_path = output_path.replace('.md', '-debug.txt')
    with open(debug_path, 'w', encoding='utf-8') as f:
        f.write(merged_text)
    
    # 6. 최종 통계
    print(f"\n📊 추출 완료!")
    print(f"- 총 {len(questions)}문제 추출")
    print(f"- 정답 포함: {sum(1 for q in questions if 'answer' in q)}문제")
    print(f"- 저장 위치: {output_path}")
    
    # 누락된 문제 확인
    if len(questions) < 150:
        missing = []
        extracted_nums = [q['number'] for q in questions]
        for i in range(1, 151):
            if i not in extracted_nums:
                missing.append(i)
        
        if missing:
            print(f"\n⚠️ 누락된 문제: {len(missing)}개")
            print(f"   {missing[:10]}{'...' if len(missing) > 10 else ''}")

if __name__ == '__main__':
    main()