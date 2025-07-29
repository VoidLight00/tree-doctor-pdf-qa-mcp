#!/usr/bin/env python3
"""
markitdown을 직접 사용하여 PDF 변환
"""
import os
import re
import json
from datetime import datetime
import markitdown

def extract_exam_round(filename):
    """파일명에서 회차 추출"""
    match = re.search(r'제(\d+)회', filename)
    return match.group(1) if match else "Unknown"

def process_pdf(pdf_path, output_path):
    """PDF 처리"""
    print(f"처리 중: {pdf_path}")
    
    # markitdown으로 직접 변환
    result = markitdown.markitdown(pdf_path)
    
    if result:
        # 회차 추출
        exam_round = extract_exam_round(pdf_path)
        
        # 마크다운 헤더 추가
        content = f"# 나무의사 제{exam_round}회 기출문제\n\n"
        content += f"**추출 일시**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
        content += f"**원본 파일**: {os.path.basename(pdf_path)}\n\n"
        content += "---\n\n"
        content += result
        
        # 파일 저장
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"저장 완료: {output_path}")
        return True
    else:
        print(f"변환 실패: {pdf_path}")
        return False

def main():
    """메인 함수"""
    files = [
        {
            'input': '/Users/voidlight/Downloads/[Codekiller]제5회 기출문제 해설집(v1.0).pdf',
            'output': '/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-5th-markitdown.md'
        },
        {
            'input': '/Users/voidlight/Downloads/[Codekiller]제6회 기출문제 해설집(v1.0).pdf',
            'output': '/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-6th-markitdown.md'
        },
        {
            'input': '/Users/voidlight/Downloads/[Codekiller]제7회 기출문제 해설집(v1.0).pdf',
            'output': '/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-7th-markitdown.md'
        }
    ]
    
    results = []
    
    for file_info in files:
        if not os.path.exists(file_info['input']):
            print(f"파일을 찾을 수 없습니다: {file_info['input']}")
            continue
        
        success = process_pdf(file_info['input'], file_info['output'])
        results.append({
            'file': file_info['input'],
            'output': file_info['output'],
            'success': success
        })
    
    # 결과 출력
    print("\n=== 변환 결과 ===")
    for result in results:
        status = "✅" if result['success'] else "❌"
        print(f"{status} {os.path.basename(result['file'])}")

if __name__ == "__main__":
    main()