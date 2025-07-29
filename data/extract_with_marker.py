#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Marker를 사용한 나무의사 제6회 기출문제 PDF 추출
"""

import subprocess
import sys
import os
import re
from pathlib import Path

def extract_with_marker(pdf_path, output_dir):
    """Marker를 사용하여 PDF 추출"""
    try:
        # Marker 실행 (한국어 설정)
        cmd = [
            "marker_single",
            pdf_path,
            output_dir,
            "--langs", "ko",
            "--max_pages", "500",
            "--parallel_factor", "2"
        ]
        
        print("Marker 실행 중...")
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            print(f"Marker 오류: {result.stderr}")
            return None
            
        # 생성된 마크다운 파일 찾기
        pdf_name = Path(pdf_path).stem
        md_path = Path(output_dir) / pdf_name / f"{pdf_name}.md"
        
        if md_path.exists():
            return md_path
        else:
            print(f"Marker 출력 파일을 찾을 수 없음: {md_path}")
            return None
            
    except Exception as e:
        print(f"Marker 실행 오류: {e}")
        return None

def process_marker_output(md_path):
    """Marker 출력을 처리하여 문제별로 정리"""
    with open(md_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 문제 찾기
    questions = []
    
    # 다양한 문제 패턴
    patterns = [
        # 1. 형식
        r'(?:^|\n)\s*(\d{1,3})\s*\.\s*((?:(?!^\d{1,3}\s*\.)[\s\S])*?)(?=\n\s*\d{1,3}\s*\.|$)',
        # 문제 1 형식
        r'(?:^|\n)\s*문제\s*(\d{1,3})\s*((?:(?!문제\s*\d{1,3})[\s\S])*?)(?=\n\s*문제\s*\d{1,3}|$)',
        # 【1】 형식
        r'(?:^|\n)\s*【\s*(\d{1,3})\s*】\s*((?:(?!【\s*\d{1,3}\s*】)[\s\S])*?)(?=\n\s*【\s*\d{1,3}\s*】|$)',
    ]
    
    for pattern in patterns:
        matches = re.findall(pattern, content, re.MULTILINE)
        if len(matches) > 50:  # 50개 이상 찾으면 유효한 패턴
            print(f"패턴 매칭 성공: {len(matches)}개 문제 발견")
            for num, q_content in matches:
                try:
                    q_num = int(num)
                    if 1 <= q_num <= 150:
                        questions.append((q_num, clean_question(q_content)))
                except:
                    continue
            break
    
    return sorted(questions, key=lambda x: x[0])

def clean_question(content):
    """문제 내용 정리"""
    # 줄바꿈 정리
    content = re.sub(r'\n{3,}', '\n\n', content)
    
    # 선택지 정리
    content = re.sub(r'([①②③④])\s*', r'\n\1 ', content)
    
    # 정답과 해설 표시
    content = re.sub(r'(?:정\s*답|답)\s*[:：]?\s*', '\n\n**정답: ', content)
    content = re.sub(r'(?:해\s*설|설명)\s*[:：]?\s*', '\n\n**해설:**\n', content)
    
    return content.strip()

def main():
    pdf_path = "/Users/voidlight/Downloads/[Codekiller]제6회 기출문제 해설집(v1.0).pdf"
    output_dir = "/Users/voidlight/tree-doctor-pdf-qa-mcp/data/marker_output"
    final_output = "/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-6th-perfect.md"
    
    # 출력 디렉토리 생성
    os.makedirs(output_dir, exist_ok=True)
    
    # Marker로 추출
    print("Marker로 PDF 추출 시작...")
    md_path = extract_with_marker(pdf_path, output_dir)
    
    if not md_path:
        print("Marker 추출 실패. markitdown 시도...")
        # markitdown 대체 시도
        try:
            import markitdown
            from markitdown import MarkItDown
            
            md = MarkItDown()
            result = md.convert(pdf_path)
            
            # 임시 파일로 저장
            temp_md = Path(output_dir) / "temp_markitdown.md"
            with open(temp_md, 'w', encoding='utf-8') as f:
                f.write(result.text_content)
            
            md_path = temp_md
            print("markitdown 추출 완료")
            
        except Exception as e:
            print(f"markitdown 오류: {e}")
            return
    
    # 문제 처리
    print("\n문제 추출 중...")
    questions = process_marker_output(md_path)
    print(f"추출된 문제 수: {len(questions)}")
    
    # 마크다운 생성
    print("\n최종 마크다운 생성 중...")
    md_content = "# 나무의사 제6회 기출문제 (150문제)\n\n"
    md_content += "> Marker/markitdown을 사용하여 추출한 문제입니다.\n\n"
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
            md_content += "*(추출 실패 - 원본 확인 필요)*\n\n"
            md_content += "---\n\n"
    
    # 저장
    with open(final_output, 'w', encoding='utf-8') as f:
        f.write(md_content)
    
    print(f"\n추출 완료!")
    print(f"출력 파일: {final_output}")
    print(f"성공: {150 - len(missing)}개")
    if missing:
        print(f"실패: {len(missing)}개 - {missing[:10]}{'...' if len(missing) > 10 else ''}")

if __name__ == "__main__":
    main()