#!/usr/bin/env python3
"""
markitdown을 사용하여 제7-9회 PDF 변환
"""
import os
import re
import json
import time
from datetime import datetime
from markitdown import MarkItDown

def extract_exam_round(filename):
    """파일명에서 회차 추출"""
    match = re.search(r'제(\d+)회', filename)
    return match.group(1) if match else "Unknown"

def process_pdf_with_markitdown(pdf_path, output_path):
    """markitdown으로 PDF 처리"""
    print(f"처리 중: {pdf_path}")
    start_time = time.time()
    
    try:
        # MarkItDown 인스턴스 생성
        md = MarkItDown()
        # PDF 변환
        result = md.convert(pdf_path)
        
        if result and result.text_content:
            # 회차 추출
            exam_round = extract_exam_round(pdf_path)
            
            # 마크다운 헤더 추가
            content = f"# 나무의사 제{exam_round}회 기출문제\n\n"
            content += f"**추출 일시**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
            content += f"**원본 파일**: {os.path.basename(pdf_path)}\n"
            content += f"**추출 방법**: markitdown\n\n"
            content += "---\n\n"
            content += result.text_content
            
            # 파일 저장
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            processing_time = time.time() - start_time
            print(f"저장 완료: {output_path} ({processing_time:.2f}초)")
            
            return {
                'success': True,
                'file': pdf_path,
                'output': output_path,
                'processing_time': f"{processing_time:.2f}s",
                'content_length': len(content)
            }
        else:
            print(f"변환 실패: {pdf_path}")
            return {
                'success': False,
                'file': pdf_path,
                'error': 'markitdown returned empty result'
            }
    except Exception as e:
        print(f"오류 발생: {e}")
        return {
            'success': False,
            'file': pdf_path,
            'error': str(e)
        }

def main():
    """메인 함수"""
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
    total_start = time.time()
    
    for file_info in files:
        if not os.path.exists(file_info['input']):
            print(f"파일을 찾을 수 없습니다: {file_info['input']}")
            results.append({
                'success': False,
                'file': file_info['input'],
                'error': '파일을 찾을 수 없습니다'
            })
            continue
        
        result = process_pdf_with_markitdown(file_info['input'], file_info['output'])
        results.append(result)
    
    total_time = time.time() - total_start
    
    # 결과 보고서 생성
    report = {
        'total_processing_time': f"{total_time:.2f}s",
        'files_processed': len(results),
        'successful': sum(1 for r in results if r.get('success', False)),
        'failed': sum(1 for r in results if not r.get('success', False)),
        'results': results
    }
    
    # 보고서 저장
    with open('/Users/voidlight/tree-doctor-pdf-qa-mcp/data/markitdown_processing_report.json', 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    
    # 결과 출력
    print("\n=== 변환 결과 ===")
    print(f"총 처리 시간: {total_time:.2f}초")
    print(f"성공: {report['successful']}개")
    print(f"실패: {report['failed']}개")
    
    for result in results:
        status = "✅" if result.get('success', False) else "❌"
        filename = os.path.basename(result['file'])
        if result.get('success', False):
            print(f"{status} {filename} - {result.get('content_length', 0)} 문자")
        else:
            print(f"{status} {filename} - {result.get('error', 'Unknown error')}")

if __name__ == "__main__":
    main()