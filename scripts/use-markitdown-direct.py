#!/usr/bin/env python3
import os
import sys
import subprocess
import json
from datetime import datetime

# markitdown 설치 확인
try:
    import markitdown
except ImportError:
    print("markitdown 설치 중...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "markitdown"])
    import markitdown

# PDF 파일 목록
pdf_files = [
    {
        'input': '/Users/voidlight/Downloads/[Codekiller]제5회 기출문제 해설집(v1.0).pdf',
        'output': 'exam-5th-markitdown.md'
    },
    {
        'input': '/Users/voidlight/Downloads/[Codekiller]제6회 기출문제 해설집(v1.0).pdf',
        'output': 'exam-6th-markitdown.md'
    },
    {
        'input': '/Users/voidlight/Downloads/[Codekiller]제7회 기출문제 해설집(v1.0).pdf',
        'output': 'exam-7th-markitdown.md'
    },
    {
        'input': '/Users/voidlight/Downloads/[Codekiller]제8회 기출문제 해설집(v1.0).pdf',
        'output': 'exam-8th-markitdown.md'
    },
    {
        'input': '/Users/voidlight/Downloads/[Codekiller]제9회 기출문제 해설집(v1.0).pdf',
        'output': 'exam-9th-markitdown.md'
    },
    {
        'input': '/Users/voidlight/Downloads/[Codekiller]제10회 기출문제 해설집(v1.0).pdf',
        'output': 'exam-10th-markitdown.md'
    },
    {
        'input': '/Users/voidlight/Downloads/제11회 나무의사 자격시험 1차 시험지.pdf',
        'output': 'exam-11th-markitdown.md'
    }
]

def convert_pdf(pdf_path, output_name):
    """PDF를 마크다운으로 변환"""
    try:
        print(f"변환 시작: {os.path.basename(pdf_path)}")
        
        # markitdown 변환기 생성
        converter = markitdown.MarkdownConverter()
        
        # PDF 변환
        with open(pdf_path, 'rb') as pdf_file:
            markdown = converter.convert(pdf_file)
        
        # 결과 저장
        output_path = os.path.join('/Users/voidlight/tree-doctor-pdf-qa-mcp/data', output_name)
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(markdown)
        
        # 라인 수 계산
        lines = markdown.count('\n') + 1
        print(f"✅ 완료: {output_name} ({lines}줄)")
        
        return {'success': True, 'lines': lines, 'file': output_name}
        
    except Exception as e:
        print(f"❌ 실패: {os.path.basename(pdf_path)} - {str(e)}")
        return {'success': False, 'error': str(e), 'file': output_name}

def main():
    print('🌳 나무의사 기출문제 PDF → Markdown 변환 시작')
    print('Python markitdown 라이브러리 사용\n')
    
    results = []
    
    # 각 PDF 파일 처리
    for pdf in pdf_files:
        if os.path.exists(pdf['input']):
            result = convert_pdf(pdf['input'], pdf['output'])
            results.append(result)
        else:
            print(f"❌ 파일 없음: {pdf['input']}")
            results.append({
                'success': False,
                'error': 'File not found',
                'file': pdf['output']
            })
    
    # 결과 요약
    print('\n📊 변환 결과 요약:')
    successful = [r for r in results if r.get('success')]
    failed = [r for r in results if not r.get('success')]
    
    print(f"✅ 성공: {len(successful)}개")
    for r in successful:
        print(f"   - {r['file']}: {r['lines']}줄")
    
    if failed:
        print(f"\n❌ 실패: {len(failed)}개")
        for r in failed:
            print(f"   - {r['file']}: {r['error']}")
    
    # 리포트 저장
    report = {
        'timestamp': datetime.now().isoformat(),
        'total': len(pdf_files),
        'successful': len(successful),
        'failed': len(failed),
        'results': results
    }
    
    report_path = '/Users/voidlight/tree-doctor-pdf-qa-mcp/data/markitdown-conversion-report.json'
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    
    print(f'\n✅ 변환 완료! 리포트: {report_path}')

if __name__ == '__main__':
    main()