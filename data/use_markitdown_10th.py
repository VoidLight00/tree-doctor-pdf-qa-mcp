#!/usr/bin/env python3
"""
Markitdown을 사용한 제10회 기출문제 추출
"""

import os
import sys
from pathlib import Path

# markitdown 경로 추가
sys.path.append('/Users/voidlight/markitdown')

try:
    from markitdown import MarkItDown
    print("Markitdown 임포트 성공!")
except ImportError as e:
    print(f"Markitdown 임포트 실패: {e}")
    sys.exit(1)

def convert_pdf():
    """PDF를 Markdown으로 변환"""
    
    pdf_path = "/Users/voidlight/Downloads/[Codekiller]제10회 기출문제 해설집(v1.0).pdf"
    
    if not os.path.exists(pdf_path):
        print(f"PDF 파일을 찾을 수 없습니다: {pdf_path}")
        return None
    
    print(f"PDF 파일 크기: {os.path.getsize(pdf_path) / 1024 / 1024:.2f} MB")
    
    # MarkItDown 인스턴스 생성
    md = MarkItDown()
    
    print("변환 시작...")
    
    try:
        # PDF를 Markdown으로 변환
        result = md.convert(pdf_path)
        
        if result and hasattr(result, 'text_content'):
            print(f"변환 성공! 텍스트 길이: {len(result.text_content)}")
            
            # 결과 저장
            output_path = "exam-10th-markitdown.md"
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(result.text_content)
            
            print(f"결과 저장: {output_path}")
            
            # 간단한 통계
            lines = result.text_content.split('\n')
            print(f"총 줄 수: {len(lines)}")
            
            # 문제 번호 찾기
            question_nums = []
            for line in lines:
                if line.strip() and line.strip()[0].isdigit() and '.' in line:
                    parts = line.strip().split('.', 1)
                    if parts[0].isdigit():
                        num = int(parts[0])
                        if 1 <= num <= 150:
                            question_nums.append(num)
            
            print(f"발견된 문제 번호: {len(set(question_nums))}개")
            
            return result.text_content
        else:
            print("변환 실패: 결과가 없습니다")
            return None
            
    except Exception as e:
        print(f"변환 중 오류 발생: {e}")
        import traceback
        traceback.print_exc()
        return None

def main():
    content = convert_pdf()
    
    if content:
        print("\n변환 완료!")
        print("exam-10th-markitdown.md 파일을 확인하세요.")
    else:
        print("\n변환 실패")

if __name__ == "__main__":
    main()