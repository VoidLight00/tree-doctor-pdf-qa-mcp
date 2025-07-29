#!/usr/bin/env python3
"""
제6회 나무의사 시험 150문제 완벽 추출 - Markitdown 사용
"""

import os
import sys
import re
import json
from pathlib import Path
import logging
from typing import List, Dict
from markitdown import markitdown

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('exam_6th_markitdown.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class ExamExtractor:
    def __init__(self, pdf_path: str):
        self.pdf_path = pdf_path
        self.questions = []
        
        # 문제 패턴들
        self.question_patterns = [
            re.compile(r'^(\d{1,3})\s*\.\s*(.+)', re.MULTILINE),
            re.compile(r'^(\d{1,3})\s*\.(.+)', re.MULTILINE),
            re.compile(r'^(\d{1,3})\.?\s+(.+)', re.MULTILINE),
            re.compile(r'^문제\s*(\d{1,3})\s*\.\s*(.+)', re.MULTILINE),
            re.compile(r'^【\s*(\d{1,3})\s*】\s*(.+)', re.MULTILINE),
            re.compile(r'^\[\s*(\d{1,3})\s*\]\s*(.+)', re.MULTILINE),
        ]
        
        # 선택지 패턴들
        self.choice_patterns = [
            re.compile(r'^([①②③④⑤])\s*(.+)', re.MULTILINE),
            re.compile(r'^(\d)\s*[)\.]\s*(.+)', re.MULTILINE),
            re.compile(r'^[가나다라마]\s*[)\.]\s*(.+)', re.MULTILINE),
        ]

    def extract_with_markitdown(self):
        """Markitdown으로 PDF 추출"""
        logger.info(f"Markitdown으로 추출 시작: {self.pdf_path}")
        
        try:
            # Markitdown 추출
            result = markitdown(self.pdf_path)
            
            if result and hasattr(result, 'text'):
                text = result.text
            else:
                text = str(result) if result else ""
            
            logger.info(f"추출된 텍스트 길이: {len(text)} 문자")
            
            # 디버깅용 텍스트 저장
            debug_path = "exam_6th_markitdown_raw.txt"
            with open(debug_path, 'w', encoding='utf-8') as f:
                f.write(text)
            
            return text
            
        except Exception as e:
            logger.error(f"Markitdown 추출 오류: {e}")
            return ""

    def parse_questions(self, text: str) -> List[Dict]:
        """텍스트에서 문제 추출"""
        questions = []
        
        # 여러 패턴으로 시도
        for pattern in self.question_patterns:
            matches = pattern.findall(text)
            if matches:
                logger.info(f"패턴 {pattern.pattern}로 {len(matches)}개 매치 발견")
                
                for match in matches:
                    try:
                        q_num = int(match[0])
                        q_text = match[1].strip()
                        
                        if 1 <= q_num <= 150:
                            # 문제 텍스트와 선택지 추출
                            question_data = self.extract_question_details(text, q_num, q_text)
                            if question_data:
                                questions.append(question_data)
                    except Exception as e:
                        logger.error(f"문제 파싱 오류: {e}")
                        continue
                
                if len(questions) > 100:  # 100개 이상 찾으면 성공으로 간주
                    break
        
        # 중복 제거 및 정렬
        unique_questions = {}
        for q in questions:
            if q['number'] not in unique_questions:
                unique_questions[q['number']] = q
        
        return sorted(unique_questions.values(), key=lambda x: x['number'])

    def extract_question_details(self, text: str, q_num: int, q_text: str) -> Dict:
        """문제의 상세 정보 추출"""
        # 다음 문제 번호 찾기
        next_q_num = q_num + 1
        
        # 문제 영역 찾기
        patterns = [
            rf'{q_num}\s*\.\s*{re.escape(q_text[:20])}.*?(?={next_q_num}\s*\.|$)',
            rf'{q_num}\s*\..*?(?={next_q_num}\s*\.|$)',
            rf'문제\s*{q_num}.*?(?=문제\s*{next_q_num}|$)'
        ]
        
        question_area = ""
        for pattern in patterns:
            match = re.search(pattern, text, re.DOTALL)
            if match:
                question_area = match.group(0)
                break
        
        if not question_area:
            question_area = q_text
        
        # 선택지 추출
        choices = []
        for choice_pattern in self.choice_patterns:
            choice_matches = choice_pattern.findall(question_area)
            for match in choice_matches:
                choice_num = match[0]
                choice_text = match[1].strip()
                choices.append(f"{choice_num} {choice_text}")
        
        # 정답 추출
        answer = ""
        answer_match = re.search(r'정답\s*[:：]?\s*([①②③④⑤])', question_area)
        if answer_match:
            answer = answer_match.group(1)
        
        return {
            'number': q_num,
            'text': q_text,
            'choices': choices,
            'answer': answer,
            'full_text': question_area
        }

    def extract_all_questions(self):
        """모든 문제 추출"""
        # Markitdown으로 추출
        text = self.extract_with_markitdown()
        
        if not text:
            logger.error("텍스트 추출 실패")
            return
        
        # 문제 파싱
        self.questions = self.parse_questions(text)
        
        logger.info(f"총 {len(self.questions)}개 문제 추출 완료")

    def save_results(self, output_path: str):
        """결과 저장"""
        logger.info(f"결과 저장 중: {output_path}")
        
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write("# 제6회 나무의사 자격시험 문제\n\n")
            f.write(f"총 문제 수: {len(self.questions)}개\n\n")
            
            # 통계 정보
            if self.questions:
                numbers = [q['number'] for q in self.questions]
                f.write(f"문제 번호 범위: {min(numbers)} ~ {max(numbers)}\n")
                
                # 누락된 문제 표시
                existing_numbers = set(numbers)
                missing_numbers = set(range(1, 151)) - existing_numbers
                if missing_numbers:
                    f.write(f"누락된 문제: {sorted(missing_numbers)}\n")
                
                f.write("\n---\n\n")
            
            for q in self.questions:
                f.write(f"## {q['number']}. {q['text']}\n\n")
                
                if q.get('choices'):
                    for choice in q['choices']:
                        f.write(f"{choice}\n")
                else:
                    f.write("(선택지 없음)\n")
                
                if q.get('answer'):
                    f.write(f"\n**정답**: {q['answer']}\n")
                
                f.write("\n---\n\n")
        
        # JSON 형식으로도 저장
        json_path = output_path.replace('.md', '.json')
        with open(json_path, 'w', encoding='utf-8') as f:
            # full_text 제외한 데이터만 저장
            clean_questions = []
            for q in self.questions:
                clean_q = {
                    'number': q['number'],
                    'text': q['text'],
                    'choices': q.get('choices', []),
                    'answer': q.get('answer', '')
                }
                clean_questions.append(clean_q)
            json.dump(clean_questions, f, ensure_ascii=False, indent=2)
        
        logger.info(f"MD 파일: {output_path}")
        logger.info(f"JSON 파일: {json_path}")

def main():
    pdf_path = "/Users/voidlight/Downloads/[Codekiller]제6회 기출문제 해설집(v1.0).pdf"
    output_path = "/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-6th-final-150.md"
    
    if not os.path.exists(pdf_path):
        logger.error(f"PDF 파일을 찾을 수 없습니다: {pdf_path}")
        return
    
    # 추출 시작
    extractor = ExamExtractor(pdf_path)
    
    extractor.extract_all_questions()
    extractor.save_results(output_path)
    
    logger.info(f"추출된 문제 수: {len(extractor.questions)}개")
    
    # 통계 출력
    if extractor.questions:
        numbers = [q['number'] for q in extractor.questions]
        logger.info(f"문제 번호 범위: {min(numbers)} ~ {max(numbers)}")
        
        # 누락된 문제 확인
        existing_numbers = set(numbers)
        missing_numbers = set(range(1, 151)) - existing_numbers
        if missing_numbers:
            logger.warning(f"누락된 문제 수: {len(missing_numbers)}개")
            logger.warning(f"누락된 문제 번호: {sorted(missing_numbers)}")

if __name__ == "__main__":
    main()