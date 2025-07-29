#!/usr/bin/env python3
"""
간단한 PDF 처리기 - 빠른 텍스트 추출 중심
"""

import os
import re
import json
import time
import logging
from typing import List, Dict, Optional
import pdfplumber
from pathlib import Path

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

class SimplePDFProcessor:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
    def extract_all_text(self, pdf_path: str) -> str:
        """PDF에서 모든 텍스트 추출"""
        all_text = ""
        try:
            with pdfplumber.open(pdf_path) as pdf:
                total_pages = len(pdf.pages)
                self.logger.info(f"총 {total_pages} 페이지 처리 중...")
                
                for i, page in enumerate(pdf.pages):
                    try:
                        text = page.extract_text()
                        if text:
                            all_text += f"\n\n--- 페이지 {i+1} ---\n\n{text}"
                        
                        if (i + 1) % 10 == 0:
                            self.logger.info(f"진행상황: {i+1}/{total_pages} 페이지 완료")
                    except Exception as e:
                        self.logger.warning(f"페이지 {i+1} 추출 실패: {e}")
                        continue
                        
        except Exception as e:
            self.logger.error(f"PDF 열기 실패: {e}")
            
        return all_text
    
    def parse_problems(self, text: str) -> List[Dict]:
        """텍스트에서 문제 파싱"""
        problems = []
        
        # 다양한 문제 패턴
        patterns = [
            (r'문제\s*(\d+)', r'문제'),
            (r'(\d+)\.\s*다음', r'\.'),
            (r'【\s*(\d+)\s*】', r'【'),
            (r'(\d+)\s*번', r'번')
        ]
        
        # 모든 패턴으로 문제 위치 찾기
        problem_positions = []
        for pattern, marker in patterns:
            for match in re.finditer(pattern, text):
                num = match.group(1)
                if num and 1 <= int(num) <= 100:  # 문제 번호 범위 제한
                    problem_positions.append((match.start(), int(num), match.group(0)))
        
        # 위치로 정렬
        problem_positions.sort(key=lambda x: x[0])
        
        # 각 문제 추출
        for i, (start, num, marker) in enumerate(problem_positions):
            # 다음 문제 시작 위치 찾기
            end = problem_positions[i+1][0] if i+1 < len(problem_positions) else len(text)
            
            # 문제 텍스트 추출
            problem_text = text[start:end].strip()
            
            # 선택지 추출
            options = []
            option_pattern = r'([①②③④⑤])\s*([^①②③④⑤]+?)(?=[①②③④⑤]|$)'
            option_matches = re.findall(option_pattern, problem_text, re.DOTALL)
            
            for opt_num, opt_text in option_matches:
                options.append(f"{opt_num} {opt_text.strip()}")
            
            # 정답 찾기
            answer = ""
            answer_patterns = [
                r'정답\s*[:：]\s*([①②③④⑤])',
                r'답\s*[:：]\s*([①②③④⑤])',
                r'\[정답\]\s*([①②③④⑤])',
                r'정답\s*([①②③④⑤])'
            ]
            
            for pattern in answer_patterns:
                match = re.search(pattern, problem_text)
                if match:
                    answer = match.group(1)
                    break
            
            # 문제 본문 추출 (선택지 전까지)
            question = problem_text
            if options:
                first_option_pos = problem_text.find('①')
                if first_option_pos > 0:
                    question = problem_text[:first_option_pos].strip()
            
            # 문제 번호 제거
            question = re.sub(r'^(문제\s*\d+|【\s*\d+\s*】|\d+\.|^\d+번)\s*', '', question).strip()
            
            if question and len(question) > 10:  # 최소 길이 확인
                problems.append({
                    'number': num,
                    'question': question[:1000],  # 문제는 최대 1000자
                    'options': options[:5],  # 최대 5개 선택지
                    'answer': answer
                })
        
        return problems
    
    def process_pdf(self, pdf_path: str, output_path: str) -> Dict:
        """PDF 처리 메인 함수"""
        self.logger.info(f"처리 시작: {pdf_path}")
        start_time = time.time()
        
        # 시험 회차 추출
        exam_num = re.search(r'제(\d+)회', pdf_path)
        exam_title = f"제{exam_num.group(1)}회 나무의사 기출문제" if exam_num else "나무의사 기출문제"
        
        # 텍스트 추출
        all_text = self.extract_all_text(pdf_path)
        
        if not all_text:
            self.logger.error("텍스트 추출 실패")
            return {'error': '텍스트 추출 실패'}
        
        # 문제 파싱
        problems = self.parse_problems(all_text)
        
        # 문제 번호로 정렬
        problems.sort(key=lambda x: x['number'])
        
        # 중복 제거 (같은 번호의 문제가 여러 개인 경우)
        unique_problems = []
        seen_numbers = set()
        for p in problems:
            if p['number'] not in seen_numbers:
                unique_problems.append(p)
                seen_numbers.add(p['number'])
        
        # Markdown 저장
        self.save_to_markdown(unique_problems, exam_title, output_path)
        
        processing_time = time.time() - start_time
        
        result = {
            'file': pdf_path,
            'output': output_path,
            'problems_extracted': len(unique_problems),
            'processing_time': f"{processing_time:.2f}s"
        }
        
        self.logger.info(f"처리 완료: {len(unique_problems)}개 문제 추출 ({processing_time:.2f}초)")
        
        return result
    
    def save_to_markdown(self, problems: List[Dict], title: str, output_path: str):
        """Markdown 파일로 저장"""
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(f"# {title}\n\n")
            f.write(f"총 문제 수: {len(problems)}\n")
            f.write(f"추출 시간: {time.strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            f.write("---\n\n")
            
            for problem in problems:
                f.write(f"## 문제 {problem['number']}\n\n")
                f.write(f"**문제:** {problem['question']}\n\n")
                
                if problem['options']:
                    f.write("**선택지:**\n")
                    for opt in problem['options']:
                        f.write(f"- {opt}\n")
                    f.write("\n")
                
                if problem['answer']:
                    f.write(f"**정답:** {problem['answer']}\n\n")
                
                f.write("---\n\n")

def main():
    """메인 함수"""
    processor = SimplePDFProcessor()
    
    files_to_process = [
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
    
    for file_info in files_to_process:
        try:
            result = processor.process_pdf(file_info['input'], file_info['output'])
            results.append(result)
        except Exception as e:
            logging.error(f"처리 실패 {file_info['input']}: {e}")
            results.append({
                'file': file_info['input'],
                'error': str(e)
            })
    
    total_time = time.time() - total_start
    
    # 최종 보고서
    report = {
        'total_time': f"{total_time:.2f}s",
        'files_processed': len(results),
        'results': results
    }
    
    # 보고서 저장
    with open('/Users/voidlight/tree-doctor-pdf-qa-mcp/data/simple_processing_report.json', 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    
    print(f"\n처리 완료!")
    print(f"총 시간: {total_time:.2f}초")
    print(f"처리된 파일: {len(results)}개")
    
    for result in results:
        if 'error' not in result:
            print(f"- {os.path.basename(result['file'])}: {result['problems_extracted']}개 문제 추출")

if __name__ == "__main__":
    main()