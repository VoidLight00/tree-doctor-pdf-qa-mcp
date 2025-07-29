#!/usr/bin/env python3
import os
import sys
import subprocess
import json
import re
from datetime import datetime

# markitdown 설치 확인
try:
    import markitdown
except ImportError:
    print("markitdown 설치 중...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "markitdown"])
    import markitdown

# PyMuPDF 설치 확인
try:
    import fitz
except ImportError:
    print("PyMuPDF 설치 중...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "PyMuPDF"])
    import fitz

def extract_with_markitdown(pdf_path):
    """Markitdown으로 PDF 추출"""
    try:
        print("1단계: Markitdown으로 추출 중...")
        # markitdown의 새로운 API 사용
        from markitdown import markitdown
        
        with open(pdf_path, 'rb') as pdf_file:
            result = markitdown(pdf_file)
            markdown = result.text_content if hasattr(result, 'text_content') else str(result)
        
        return markdown
    except Exception as e:
        print(f"Markitdown 추출 실패: {str(e)}")
        return None

def extract_with_pymupdf(pdf_path):
    """PyMuPDF로 직접 텍스트 추출"""
    try:
        print("2단계: PyMuPDF로 직접 추출 중...")
        doc = fitz.open(pdf_path)
        text = ""
        
        for page_num in range(len(doc)):
            page = doc[page_num]
            text += f"\n\n--- 페이지 {page_num + 1} ---\n\n"
            text += page.get_text()
        
        doc.close()
        return text
    except Exception as e:
        print(f"PyMuPDF 추출 실패: {str(e)}")
        return None

def structure_questions(text):
    """문제를 구조화하여 정리"""
    questions = []
    
    # 문제 패턴들
    patterns = [
        r'(\d+)\.\s*([^\n]+?)[\s\n]+[①②③④]',  # 기본 패턴
        r'문제\s*(\d+)\.\s*([^\n]+?)[\s\n]+[①②③④]',  # '문제' 포함
        r'(\d+)번\.\s*([^\n]+?)[\s\n]+[①②③④]',  # '번' 포함
    ]
    
    # 각 패턴으로 시도
    for pattern in patterns:
        matches = re.finditer(pattern, text, re.MULTILINE | re.DOTALL)
        for match in matches:
            q_num = match.group(1)
            q_text = match.group(2).strip()
            
            # 선택지 찾기
            start_pos = match.end()
            choices_text = text[start_pos:start_pos + 500]  # 충분한 길이 확보
            
            # 선택지 추출
            choice_pattern = r'([①②③④])\s*([^\n①②③④]+)'
            choices = re.findall(choice_pattern, choices_text)
            
            if len(choices) >= 4:
                question = {
                    'number': int(q_num),
                    'question': q_text,
                    'choices': {
                        '①': choices[0][1].strip(),
                        '②': choices[1][1].strip(),
                        '③': choices[2][1].strip(),
                        '④': choices[3][1].strip()
                    }
                }
                
                # 정답 찾기
                answer_pattern = rf'{q_num}[번\s]*[\.:\s]*([①②③④])'
                answer_match = re.search(answer_pattern, text[start_pos:])
                if answer_match:
                    question['answer'] = answer_match.group(1)
                
                questions.append(question)
    
    # 중복 제거 및 정렬
    unique_questions = {}
    for q in questions:
        unique_questions[q['number']] = q
    
    return [unique_questions[i] for i in sorted(unique_questions.keys())]

def generate_markdown(questions):
    """구조화된 문제를 마크다운으로 변환"""
    markdown = "# 제5회 나무의사 기출문제\n\n"
    markdown += f"총 {len(questions)}문제\n\n---\n\n"
    
    for q in questions:
        markdown += f"## {q['number']}. {q['question']}\n\n"
        
        for choice_num, choice_text in q['choices'].items():
            markdown += f"{choice_num} {choice_text}\n"
        
        if 'answer' in q:
            markdown += f"\n**정답: {q['answer']}**\n"
        
        markdown += "\n---\n\n"
    
    return markdown

def validate_extraction(questions):
    """추출 결과 검증"""
    print("\n📊 추출 결과 검증:")
    print(f"- 총 문제 수: {len(questions)}")
    
    # 문제 번호 연속성 확인
    missing = []
    for i in range(1, 151):
        if not any(q['number'] == i for q in questions):
            missing.append(i)
    
    if missing:
        print(f"- 누락된 문제: {missing[:10]}{'...' if len(missing) > 10 else ''}")
    else:
        print("- 모든 문제 번호가 연속적으로 존재")
    
    # 정답 포함 여부 확인
    with_answer = sum(1 for q in questions if 'answer' in q)
    print(f"- 정답 포함 문제: {with_answer}/{len(questions)}")
    
    return len(questions) >= 145  # 최소 145문제 이상이면 성공

def main():
    pdf_path = '/Users/voidlight/Downloads/[Codekiller]제5회 기출문제 해설집(v1.0).pdf'
    output_path = '/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-5th-perfect.md'
    
    print('🌳 제5회 나무의사 기출문제 완벽 추출 시작\n')
    
    # 1. Markitdown으로 추출
    markdown_text = extract_with_markitdown(pdf_path)
    
    # 2. PyMuPDF로 추가 추출
    pymupdf_text = extract_with_pymupdf(pdf_path)
    
    # 3. 두 결과 합치기
    combined_text = ""
    if markdown_text:
        combined_text += markdown_text + "\n\n"
    if pymupdf_text:
        combined_text += pymupdf_text
    
    if not combined_text:
        print("❌ PDF 추출 실패")
        return
    
    # 4. 문제 구조화
    print("\n3단계: 문제 구조화 중...")
    questions = structure_questions(combined_text)
    
    # 5. 검증
    if validate_extraction(questions):
        print("\n✅ 추출 성공!")
    else:
        print("\n⚠️ 일부 문제가 누락되었을 수 있습니다.")
    
    # 6. 마크다운 생성 및 저장
    final_markdown = generate_markdown(questions)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(final_markdown)
    
    # 7. 원본 텍스트도 저장 (디버깅용)
    debug_path = output_path.replace('.md', '-raw.txt')
    with open(debug_path, 'w', encoding='utf-8') as f:
        f.write(combined_text)
    
    print(f"\n✅ 완료!")
    print(f"- 추출된 파일: {output_path}")
    print(f"- 원본 텍스트: {debug_path}")
    print(f"- 총 {len(questions)}문제 추출됨")

if __name__ == '__main__':
    main()