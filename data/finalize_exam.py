#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
제11회 나무의사 시험 최종 정리
"""

import re

def clean_and_format():
    """PyMuPDF 결과를 정리하고 포맷팅"""
    
    # PyMuPDF 결과 읽기
    with open('/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-11th-perfect_pymupdf.md', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 페이지 구분 제거
    content = re.sub(r'--- 페이지 \d+ ---', '', content)
    
    # 빈 줄 정리
    content = re.sub(r'\n{3,}', '\n\n', content)
    
    # 문제 번호 패턴 정리
    lines = content.split('\n')
    formatted_lines = []
    current_question = None
    question_content = []
    
    for line in lines:
        # 문제 번호 찾기
        match = re.match(r'^(\d+)\s*\.\s*(.*)', line.strip())
        if match:
            # 이전 문제 저장
            if current_question and question_content:
                formatted_lines.append(f"\n### {current_question}번\n")
                formatted_lines.extend(question_content)
                formatted_lines.append("")
            
            # 새 문제 시작
            current_question = int(match.group(1))
            if match.group(2):
                question_content = [match.group(2)]
            else:
                question_content = []
        elif line.strip() and current_question:
            # 선택지인지 확인
            if re.match(r'^[①②③④⑤]', line.strip()):
                question_content.append(line.strip())
            else:
                # 문제 내용
                if question_content and not question_content[-1].endswith(('.', '?', '!', '다', '까', '라')):
                    # 이전 줄과 연결
                    question_content[-1] += ' ' + line.strip()
                else:
                    question_content.append(line.strip())
    
    # 마지막 문제 저장
    if current_question and question_content:
        formatted_lines.append(f"\n### {current_question}번\n")
        formatted_lines.extend(question_content)
    
    # 최종 마크다운 생성
    final_content = f"""# 제11회 나무의사 자격시험 1차 시험

## 시험 정보
- 총 문제 수: 125문제 (실제 PDF에 포함된 문제)
- 참고: PDF 파일에는 125번까지만 포함되어 있습니다.

## 문제

"""
    
    final_content += '\n'.join(formatted_lines)
    
    # 문제 통계
    question_numbers = re.findall(r'^### (\d+)번', final_content, re.MULTILINE)
    question_count = len(question_numbers)
    
    # 통계 추가
    stats = f"""

## 추출 통계
- 추출된 문제 수: {question_count}개
- 문제 번호 범위: 1 ~ {max(int(n) for n in question_numbers) if question_numbers else 0}
- 추출 방법: PyMuPDF
"""
    
    final_content += stats
    
    # 파일 저장
    with open('/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-11th-perfect.md', 'w', encoding='utf-8') as f:
        f.write(final_content)
    
    print(f"최종 파일 생성 완료: exam-11th-perfect.md")
    print(f"총 {question_count}개 문제 포맷팅 완료")
    
    # 샘플 출력
    print("\n=== 처음 3문제 샘플 ===")
    sample_lines = final_content.split('\n')[:50]
    for line in sample_lines:
        if line.strip():
            print(line)

def check_pdf_again():
    """PDF 파일을 다시 한 번 확인"""
    import fitz
    
    PDF_PATH = "/Users/voidlight/Downloads/제11회 나무의사 자격시험 1차 시험지.pdf"
    
    doc = fitz.open(PDF_PATH)
    print(f"\nPDF 정보:")
    print(f"- 총 페이지: {len(doc)}")
    print(f"- 제목: {doc.metadata.get('title', 'N/A')}")
    
    # 마지막 5페이지 텍스트 확인
    print("\n마지막 5페이지 내용 확인:")
    for page_num in range(max(0, len(doc) - 5), len(doc)):
        page = doc[page_num]
        text = page.get_text()
        
        # 문제 번호 찾기
        questions = re.findall(r'(\d{3})\s*\.', text)
        if questions:
            print(f"페이지 {page_num + 1}: 문제 {questions} 발견")
        
        # 126 이상의 번호가 있는지 확인
        for num in range(126, 151):
            if str(num) in text:
                print(f"페이지 {page_num + 1}에서 {num} 발견!")
    
    doc.close()

def main():
    """메인 함수"""
    print("제11회 나무의사 시험 최종 정리 시작...\n")
    
    # PDF 재확인
    check_pdf_again()
    
    # 최종 포맷팅
    clean_and_format()

if __name__ == "__main__":
    main()