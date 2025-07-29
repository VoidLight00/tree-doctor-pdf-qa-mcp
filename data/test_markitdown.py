#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
markitdown 테스트
"""

import markitdown

PDF_PATH = "/Users/voidlight/Downloads/제11회 나무의사 자격시험 1차 시험지.pdf"

# markitdown 직접 사용
try:
    result = markitdown.markitdown(PDF_PATH)
    print(f"추출된 텍스트 길이: {len(result)}")
    
    # 파일로 저장
    with open('exam-11th-markitdown-direct.md', 'w', encoding='utf-8') as f:
        f.write(result)
    
    # 문제 개수 확인
    import re
    questions = re.findall(r'(\d+)\s*\.', result)
    unique_questions = set()
    for q in questions:
        num = int(q)
        if 1 <= num <= 150:
            unique_questions.add(num)
    
    print(f"찾은 문제 수: {len(unique_questions)}")
    print(f"문제 범위: {min(unique_questions)} ~ {max(unique_questions)}")
    
except Exception as e:
    print(f"오류: {e}")