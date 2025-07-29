#!/usr/bin/env python3
"""
PDF 구조 분석 및 누락된 문제 찾기
"""

import fitz
import re
from collections import defaultdict

def analyze_pdf_structure(pdf_path):
    """PDF 구조 상세 분석"""
    doc = fitz.open(pdf_path)
    
    print(f"총 페이지 수: {len(doc)}")
    
    # 각 페이지 분석
    for page_num in range(min(10, len(doc))):  # 처음 10페이지만 분석
        page = doc[page_num]
        text = page.get_text()
        
        print(f"\n=== 페이지 {page_num + 1} ===")
        print(f"텍스트 길이: {len(text)}")
        
        # 문제 번호 패턴 찾기
        patterns = [
            (r'(\d{1,3})\s*\.\s*', "숫자. 패턴"),
            (r'(\d{1,3})\s*\)', "숫자) 패턴"),
            (r'문제\s*(\d{1,3})', "문제 숫자 패턴"),
            (r'Q\s*(\d{1,3})', "Q숫자 패턴"),
            (r'【\s*(\d{1,3})\s*】', "【숫자】 패턴"),
            (r'\[(\d{1,3})\]', "[숫자] 패턴"),
        ]
        
        for pattern, name in patterns:
            matches = re.findall(pattern, text)
            if matches:
                numbers = [int(m) for m in matches]
                print(f"{name}: {numbers[:10]}...")  # 처음 10개만 표시
        
        # 정답 패턴 찾기
        answer_patterns = [
            r'정답\s*[:：]\s*([①②③④⑤1-5])',
            r'답\s*[:：]\s*([①②③④⑤1-5])',
            r'\[정답\]\s*([①②③④⑤1-5])',
            r'Answer\s*[:：]\s*([①②③④⑤1-5])',
        ]
        
        for pattern in answer_patterns:
            matches = re.findall(pattern, text)
            if matches:
                print(f"정답 패턴 발견: {matches[:5]}...")
        
        # 특수 문자 확인
        if '①' in text or '②' in text:
            print("원문자(①②③④⑤) 사용")
        if '1)' in text or '2)' in text:
            print("숫자) 보기 사용")
        
        # 처음 500자 출력
        print("\n처음 500자:")
        print(text[:500])
        print("\n" + "="*50)
    
    doc.close()

def find_questions_in_page(page_text, page_num):
    """페이지에서 문제 찾기"""
    questions = []
    
    # 다양한 문제 시작 패턴
    patterns = [
        # 28. 문제내용
        (r'^(\d{1,3})\s*\.\s*([^\n]+)', "기본패턴"),
        # --- 페이지 X --- 28. 문제내용
        (r'---\s*페이지\s*\d+\s*---\s*(\d{1,3})\s*\.\s*([^\n]+)', "페이지구분패턴"),
        # 28) 문제내용
        (r'^(\d{1,3})\s*\)\s*([^\n]+)', "괄호패턴"),
        # 【28】 문제내용
        (r'【\s*(\d{1,3})\s*】\s*([^\n]+)', "대괄호패턴"),
    ]
    
    lines = page_text.split('\n')
    
    for i, line in enumerate(lines):
        for pattern, pattern_name in patterns:
            match = re.match(pattern, line.strip())
            if match:
                q_num = int(match.group(1))
                q_text = match.group(2).strip()
                
                # 문제 내용 계속 읽기
                j = i + 1
                while j < len(lines) and not any(re.match(p[0], lines[j].strip()) for p in patterns):
                    if lines[j].strip() and not lines[j].strip().startswith(('①', '②', '③', '④', '⑤', '1)', '2)', '3)', '4)', '5)')):
                        q_text += " " + lines[j].strip()
                    else:
                        break
                    j += 1
                
                questions.append({
                    'number': q_num,
                    'text': q_text,
                    'page': page_num,
                    'pattern': pattern_name
                })
    
    return questions

def main():
    pdf_path = "/Users/voidlight/Downloads/[Codekiller]제10회 기출문제 해설집(v1.0).pdf"
    
    print("PDF 구조 분석 시작...\n")
    analyze_pdf_structure(pdf_path)
    
    # 전체 페이지에서 문제 찾기
    doc = fitz.open(pdf_path)
    all_questions = []
    
    print("\n\n전체 페이지에서 문제 찾기...")
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text()
        
        questions = find_questions_in_page(text, page_num + 1)
        if questions:
            all_questions.extend(questions)
            
            # 누락된 문제가 발견되면 출력
            for q in questions:
                if q['number'] in [28, 59, 67, 68, 69, 72, 73, 74, 75, 77, 83, 86, 87, 
                                  89, 90, 91, 92, 93, 94, 95, 96, 99, 100, 104, 107, 113, 
                                  118, 123, 126, 127, 129, 130, 131, 132, 133, 134, 135, 
                                  136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 
                                  147, 148, 149, 150]:
                    print(f"\n누락된 문제 발견! 페이지 {q['page']}")
                    print(f"문제 {q['number']}: {q['text'][:100]}...")
                    print(f"패턴: {q['pattern']}")
    
    doc.close()
    
    # 결과 정리
    found_numbers = sorted(set(q['number'] for q in all_questions))
    print(f"\n\n총 발견된 문제: {len(found_numbers)}개")
    print(f"문제 번호: {found_numbers}")

if __name__ == "__main__":
    main()