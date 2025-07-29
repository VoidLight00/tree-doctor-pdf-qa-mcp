#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Markitdown 직접 사용 스크립트
"""

import sys
import os
from pathlib import Path

# markitdown 경로 추가
sys.path.insert(0, '/Users/voidlight/markitdown')
sys.path.insert(0, '/Users/voidlight/voidlight_markitdown')

try:
    from markitdown import MarkItDown
    print("MarkItDown 임포트 성공")
except ImportError:
    try:
        # 다른 방법 시도
        import subprocess
        result = subprocess.run([sys.executable, "-m", "markitdown", "--version"], 
                              capture_output=True, text=True)
        print(f"markitdown 모듈 실행 가능: {result.stdout}")
    except:
        print("MarkItDown을 찾을 수 없습니다.")
        sys.exit(1)

def extract_with_markitdown(pdf_path):
    """Markitdown으로 PDF 추출"""
    try:
        # MarkItDown 인스턴스 생성
        md = MarkItDown()
        
        print(f"PDF 파일 처리 중: {pdf_path}")
        result = md.convert(pdf_path)
        
        if result and hasattr(result, 'text_content'):
            return result.text_content
        else:
            print("변환 결과가 비어있습니다.")
            return None
            
    except Exception as e:
        print(f"MarkItDown 오류: {e}")
        
        # 대체 방법: 명령줄 실행
        try:
            import subprocess
            cmd = [sys.executable, "-m", "markitdown", pdf_path]
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode == 0:
                return result.stdout
            else:
                print(f"명령줄 오류: {result.stderr}")
                return None
        except Exception as e2:
            print(f"명령줄 실행 오류: {e2}")
            return None

def process_markdown(text):
    """마크다운 텍스트에서 문제 추출"""
    import re
    
    questions = []
    
    # 문제 번호 패턴들
    patterns = [
        # 1. 형식
        r'(?:^|\n)\s*(\d{1,3})\s*\.\s*((?:(?!\n\s*\d{1,3}\s*\.)[\s\S])*?)(?=\n\s*\d{1,3}\s*\.|$)',
        # 1) 형식
        r'(?:^|\n)\s*(\d{1,3})\s*\)\s*((?:(?!\n\s*\d{1,3}\s*\))[\s\S])*?)(?=\n\s*\d{1,3}\s*\)|$)',
        # 【1】 형식
        r'(?:^|\n)\s*【\s*(\d{1,3})\s*】\s*((?:(?!\n\s*【\s*\d{1,3}\s*】)[\s\S])*?)(?=\n\s*【\s*\d{1,3}\s*】|$)',
        # 문제 1 형식
        r'(?:^|\n)\s*문제\s+(\d{1,3})\s*((?:(?!\n\s*문제\s+\d{1,3})[\s\S])*?)(?=\n\s*문제\s+\d{1,3}|$)',
    ]
    
    for pattern in patterns:
        matches = re.findall(pattern, text, re.MULTILINE | re.DOTALL)
        if len(matches) >= 50:  # 50개 이상이면 유효한 패턴
            print(f"패턴 매칭 성공: {len(matches)}개 문제 발견")
            for num, content in matches:
                try:
                    q_num = int(num)
                    if 1 <= q_num <= 150:
                        cleaned = clean_content(content)
                        questions.append((q_num, cleaned))
                except:
                    continue
            break
    
    return sorted(questions, key=lambda x: x[0])

def clean_content(content):
    """문제 내용 정리"""
    import re
    
    # 불필요한 공백 정리
    content = re.sub(r'\n{3,}', '\n\n', content)
    content = re.sub(r'[ \t]+', ' ', content)
    
    # 선택지 정리
    content = re.sub(r'([①②③④⑤])\s*', r'\n\1 ', content)
    
    # 정답과 해설 강조
    content = re.sub(r'(?:정\s*답|답)\s*[:：]?\s*', '\n\n**정답: ', content, flags=re.IGNORECASE)
    content = re.sub(r'(?:해\s*설|설명)\s*[:：]?\s*', '\n\n**해설:**\n', content, flags=re.IGNORECASE)
    
    return content.strip()

def main():
    pdf_path = "/Users/voidlight/Downloads/[Codekiller]제6회 기출문제 해설집(v1.0).pdf"
    output_path = "/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-6th-perfect.md"
    
    print("Markitdown으로 PDF 추출 시작...")
    
    # 1. Markitdown으로 추출
    text = extract_with_markitdown(pdf_path)
    
    if not text:
        print("Markitdown 추출 실패")
        return
    
    print(f"추출된 텍스트 길이: {len(text)} 문자")
    
    # 임시 파일로 저장
    temp_path = Path(output_path).parent / "markitdown_raw.txt"
    with open(temp_path, 'w', encoding='utf-8') as f:
        f.write(text)
    print(f"원본 텍스트 저장: {temp_path}")
    
    # 2. 문제 추출
    print("\n문제 추출 중...")
    questions = process_markdown(text)
    print(f"추출된 문제 수: {len(questions)}")
    
    # 3. 마크다운 생성
    print("\n최종 마크다운 생성 중...")
    md_content = "# 나무의사 제6회 기출문제 (150문제)\n\n"
    md_content += "> Markitdown을 사용하여 추출한 문제입니다.\n"
    md_content += "> 출처: [Codekiller]제6회 기출문제 해설집(v1.0).pdf\n\n"
    md_content += "---\n\n"
    
    missing = []
    
    for i in range(1, 151):
        found = False
        for q_num, content in questions:
            if q_num == i:
                md_content += f"## 문제 {i}\n\n"
                md_content += content + "\n\n"
                md_content += "---\n\n"
                found = True
                break
        
        if not found:
            missing.append(i)
            md_content += f"## 문제 {i}\n\n"
            md_content += "*(추출 실패 - 원본 PDF 확인 필요)*\n\n"
            md_content += "---\n\n"
    
    # 4. 저장
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(md_content)
    
    print(f"\n추출 완료!")
    print(f"출력 파일: {output_path}")
    print(f"총 문제 수: 150")
    print(f"성공적으로 추출: {150 - len(missing)}개")
    if missing:
        print(f"추출 실패: {len(missing)}개")
        if len(missing) <= 20:
            print(f"실패한 문제 번호: {missing}")
        else:
            print(f"실패한 문제 번호 (처음 20개): {missing[:20]}...")
    
    # 5. 요약 정보 생성
    summary_path = output_path.replace('.md', '_summary.txt')
    with open(summary_path, 'w', encoding='utf-8') as f:
        f.write("나무의사 제6회 기출문제 추출 요약\n")
        f.write("=" * 50 + "\n")
        f.write(f"PDF 파일: {Path(pdf_path).name}\n")
        f.write(f"추출 방법: Markitdown\n")
        f.write(f"총 문제 수: 150\n")
        f.write(f"추출 성공: {150 - len(missing)}\n")
        f.write(f"추출 실패: {len(missing)}\n")
        f.write(f"성공률: {((150 - len(missing)) / 150 * 100):.1f}%\n")
    
    print(f"\n요약 정보: {summary_path}")

if __name__ == "__main__":
    main()