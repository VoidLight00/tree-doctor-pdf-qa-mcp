#!/usr/bin/env python3
"""
제7-9회 나무의사 기출문제 처리
enhanced_pdf_ocr.py를 기반으로 수정
"""
import os
import sys
import time

# enhanced_pdf_ocr.py 재사용
sys.path.append('/Users/voidlight/tree-doctor-pdf-qa-mcp/data')
from enhanced_pdf_ocr import EnhancedExamOCR

def process_exam_files():
    """제7-9회 시험 파일 처리"""
    files = [
        {
            'input': '/Users/voidlight/Downloads/[Codekiller]제7회 기출문제 해설집(v1.0).pdf',
            'output': '/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-7th-complete.md'
        },
        {
            'input': '/Users/voidlight/Downloads/[Codekiller]제8회 기출문제 해설집(v1.0).pdf',
            'output': '/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-8th-complete.md'
        },
        {
            'input': '/Users/voidlight/Downloads/[Codekiller]제9회 기출문제 해설집(v1.0).pdf',
            'output': '/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-9th-complete.md'
        }
    ]
    
    results = []
    start_time = time.time()
    
    for file_info in files:
        print(f"\n{'='*60}")
        print(f"처리 시작: {os.path.basename(file_info['input'])}")
        print(f"{'='*60}")
        
        try:
            # 파일 존재 확인
            if not os.path.exists(file_info['input']):
                print(f"❌ 파일을 찾을 수 없습니다: {file_info['input']}")
                continue
            
            # OCR 처리기 생성 및 실행
            ocr = EnhancedExamOCR(file_info['input'], file_info['output'])
            result = ocr.process_pdf()
            
            print(f"✅ 처리 완료: {file_info['output']}")
            results.append({
                'file': file_info['input'],
                'success': True
            })
            
        except Exception as e:
            print(f"❌ 처리 실패: {e}")
            results.append({
                'file': file_info['input'],
                'success': False,
                'error': str(e)
            })
    
    # 결과 요약
    total_time = time.time() - start_time
    print(f"\n{'='*60}")
    print(f"전체 처리 완료")
    print(f"{'='*60}")
    print(f"총 소요 시간: {total_time:.2f}초")
    print(f"성공: {sum(1 for r in results if r.get('success', False))}개")
    print(f"실패: {sum(1 for r in results if not r.get('success', False))}개")

if __name__ == "__main__":
    process_exam_files()