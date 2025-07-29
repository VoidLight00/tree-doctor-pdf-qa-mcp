#!/usr/bin/env python3
"""
나무의사 기출문제 PDF를 마크다운으로 변환하는 스크립트
markitdown 라이브러리를 활용한 버전
"""
import os
import sys
import json
import re
import logging
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# markitdown 경로 추가
sys.path.insert(0, '/Users/voidlight/voidlight-markdown-mcp-server/src')

try:
    from markitdown_mcp_enhanced.core.markitdown import MarkItDown
except ImportError:
    logger.error("markitdown을 찾을 수 없습니다. 기본 markitdown을 사용합니다.")
    try:
        from markitdown import MarkItDown
    except ImportError:
        logger.error("markitdown 라이브러리를 설치해주세요: pip install markitdown")
        sys.exit(1)

class ExamQuestionParser:
    """시험 문제 파서"""
    
    def __init__(self):
        self.markitdown = MarkItDown()
        self.question_pattern = re.compile(
            r'(\d+)\.\s*(.+?)(?=(?:\d+\.\s|정답|해설|$))', 
            re.DOTALL | re.MULTILINE
        )
        self.choice_pattern = re.compile(
            r'([①②③④⑤])\s*(.+?)(?=[①②③④⑤]|정답|해설|$)', 
            re.MULTILINE
        )
        self.answer_pattern = re.compile(
            r'정답\s*[:：]?\s*([①②③④⑤\d]+)'
        )
        self.explanation_pattern = re.compile(
            r'해설\s*[:：]?\s*(.+?)(?=\d+\.|문제|$)', 
            re.DOTALL
        )
        
    def extract_exam_round(self, filename: str) -> str:
        """파일명에서 회차 추출"""
        match = re.search(r'제(\d+)회', filename)
        return match.group(1) if match else "Unknown"
    
    def parse_questions(self, text: str) -> List[Dict]:
        """텍스트에서 문제 파싱"""
        questions = []
        
        # 페이지 구분 제거 및 텍스트 정리
        text = re.sub(r'-+\s*Page \d+\s*-+', '', text)
        text = re.sub(r'\n{3,}', '\n\n', text)
        
        # 문제 찾기
        matches = list(self.question_pattern.finditer(text))
        
        for i, match in enumerate(matches):
            question_num = match.group(1)
            question_content = match.group(2).strip()
            
            # 문제의 전체 범위 확인
            start_pos = match.start()
            if i < len(matches) - 1:
                end_pos = matches[i + 1].start()
            else:
                end_pos = len(text)
            
            question_text = text[start_pos:end_pos]
            
            # 선택지 추출
            choices = {}
            for choice_match in self.choice_pattern.finditer(question_text):
                choice_num = choice_match.group(1)
                choice_text = choice_match.group(2).strip()
                choices[choice_num] = choice_text
            
            # 정답 추출
            answer_match = self.answer_pattern.search(question_text)
            answer = answer_match.group(1) if answer_match else "미확인"
            
            # 해설 추출
            explanation_match = self.explanation_pattern.search(question_text)
            explanation = explanation_match.group(1).strip() if explanation_match else ""
            
            # 키워드 추출
            keywords = self.extract_keywords(question_content + " " + explanation)
            
            questions.append({
                'number': int(question_num),
                'question': question_content,
                'choices': choices,
                'answer': answer,
                'explanation': explanation,
                'keywords': keywords
            })
            
        return questions
    
    def extract_keywords(self, text: str) -> List[str]:
        """텍스트에서 주요 키워드 추출"""
        keywords = []
        
        # 병충해 관련
        if re.search(r'병해|충해|병충해|병원균|해충|방제', text):
            keywords.append('병충해')
        
        # 수목 관리
        if re.search(r'전정|가지치기|전지|수형|정지', text):
            keywords.append('수목관리')
        
        # 진단
        if re.search(r'진단|증상|병징|표징|피해', text):
            keywords.append('진단')
        
        # 토양
        if re.search(r'토양|pH|비료|영양|시비', text):
            keywords.append('토양')
        
        # 농약
        if re.search(r'농약|살충제|살균제|약제|방제제', text):
            keywords.append('농약')
        
        # 생리
        if re.search(r'생리|생장|생육|대사|광합성', text):
            keywords.append('생리')
        
        # 수종 추출
        tree_species = re.findall(
            r'(소나무|잣나무|은행나무|느티나무|벚나무|단풍나무|참나무|밤나무|감나무|배나무|사과나무|복숭아나무)', 
            text
        )
        keywords.extend(list(set(tree_species)))
        
        # 병명 추출
        diseases = re.findall(
            r'(혹병|탄저병|흰가루병|잎마름병|뿌리썩음병|줄기썩음병|모잘록병|역병|녹병|점무늬병)', 
            text
        )
        keywords.extend(list(set(diseases)))
        
        # 해충명 추출
        pests = re.findall(
            r'(나방|진딧물|깍지벌레|응애|굼벵이|하늘소|바구미|매미충|나무좀)', 
            text
        )
        keywords.extend(list(set(pests)))
        
        return list(set(keywords))
    
    def process_pdf(self, pdf_path: str, output_path: str) -> Dict:
        """PDF 파일 처리"""
        logger.info(f"처리 시작: {pdf_path}")
        
        try:
            # markitdown으로 PDF 변환
            result = self.markitdown.convert(pdf_path)
            
            if not result or not result.text_content:
                raise Exception("PDF 변환 실패: 텍스트를 추출할 수 없습니다.")
            
            # 회차 추출
            exam_round = self.extract_exam_round(pdf_path)
            
            # 문제 파싱
            questions = self.parse_questions(result.text_content)
            
            # 마크다운 생성
            markdown_content = self.generate_markdown(exam_round, questions)
            
            # 파일 저장
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(markdown_content)
            
            logger.info(f"저장 완료: {output_path}")
            
            return {
                'exam_round': exam_round,
                'total_questions': len(questions),
                'output_file': output_path,
                'success': True
            }
            
        except Exception as e:
            logger.error(f"처리 실패: {e}")
            return {
                'exam_round': self.extract_exam_round(pdf_path),
                'error': str(e),
                'success': False
            }
    
    def generate_markdown(self, exam_round: str, questions: List[Dict]) -> str:
        """마크다운 컨텐츠 생성"""
        content = f"# 나무의사 제{exam_round}회 기출문제\n\n"
        content += f"**총 문제 수**: {len(questions)}개\n"
        content += f"**추출 일시**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
        content += "---\n\n"
        
        for q in sorted(questions, key=lambda x: x['number']):
            content += f"## 문제 {q['number']}\n\n"
            content += f"**문제**: {q['question']}\n\n"
            
            if q['choices']:
                content += "**선택지**:\n"
                for num in ['①', '②', '③', '④', '⑤']:
                    if num in q['choices']:
                        content += f"- {num} {q['choices'][num]}\n"
                content += "\n"
            
            content += f"**정답**: {q['answer']}\n\n"
            
            if q['explanation']:
                content += f"**해설**: {q['explanation']}\n\n"
            
            if q['keywords']:
                content += f"**키워드**: {', '.join(q['keywords'])}\n\n"
            
            content += "---\n\n"
        
        return content

def main():
    """메인 함수"""
    # 처리할 파일 목록
    files = [
        {
            'input': '/Users/voidlight/Downloads/[Codekiller]제5회 기출문제 해설집(v1.0).pdf',
            'output': '/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-5th-ocr.md'
        },
        {
            'input': '/Users/voidlight/Downloads/[Codekiller]제6회 기출문제 해설집(v1.0).pdf',
            'output': '/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-6th-ocr.md'
        },
        {
            'input': '/Users/voidlight/Downloads/[Codekiller]제7회 기출문제 해설집(v1.0).pdf',
            'output': '/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-7th-ocr.md'
        }
    ]
    
    parser = ExamQuestionParser()
    results = []
    
    for file_info in files:
        if not os.path.exists(file_info['input']):
            logger.error(f"파일을 찾을 수 없습니다: {file_info['input']}")
            continue
        
        result = parser.process_pdf(file_info['input'], file_info['output'])
        results.append(result)
    
    # 결과 보고
    print("\n=== PDF 변환 결과 요약 ===")
    for result in results:
        if result['success']:
            print(f"✅ 제{result['exam_round']}회: {result['total_questions']}문제 추출 완료")
            print(f"   저장 위치: {result['output_file']}")
        else:
            print(f"❌ 제{result['exam_round']}회: 변환 실패 - {result.get('error', 'Unknown error')}")
    
    # 전체 보고서 저장
    report_path = '/Users/voidlight/tree-doctor-pdf-qa-mcp/data/conversion_report.json'
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print(f"\n📋 상세 보고서: {report_path}")

if __name__ == "__main__":
    main()