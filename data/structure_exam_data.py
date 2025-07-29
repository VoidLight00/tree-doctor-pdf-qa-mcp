#!/usr/bin/env python3
"""
나무의사 기출문제 구조화 스크립트
OCR 데이터를 표준화된 JSON 구조로 변환
"""

import json
import re
import os
from datetime import datetime
from typing import Dict, List, Optional, Tuple
import logging

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('structuring.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)

class ExamStructurer:
    def __init__(self):
        self.subject_mapping = {
            (1, 30): "수목병리학",
            (31, 60): "수목해충학", 
            (61, 90): "수목생리학",
            (91, 120): "산림토양학",
            (121, 150): "정책 및 법규"
        }
        
        # 과목별 키워드 패턴
        self.subject_keywords = {
            "수목병리학": ["병원균", "병징", "병원성", "기주", "감염", "균사", "포자", "녹병", "탄저병", "시들음병"],
            "수목해충학": ["곤충", "나방", "하늘소", "좀", "진딧물", "깍지벌레", "유충", "성충", "번데기", "피해"],
            "수목생리학": ["광합성", "호흡", "증산", "양분", "생장", "휴면", "개화", "결실", "호르몬", "스트레스"],
            "산림토양학": ["토양", "pH", "양분", "유기물", "토성", "배수", "비료", "시비", "뿌리", "균근"],
            "정책 및 법규": ["법률", "규정", "시행령", "시행규칙", "허가", "신고", "벌칙", "과태료", "자격", "기준"]
        }
        
    def get_subject_by_number(self, question_num: int) -> str:
        """문제 번호로 과목 분류"""
        for (start, end), subject in self.subject_mapping.items():
            if start <= question_num <= end:
                return subject
        return "미분류"
    
    def extract_keywords(self, text: str, subject: str) -> List[str]:
        """문제 텍스트에서 주요 키워드 추출"""
        keywords = []
        if subject in self.subject_keywords:
            for keyword in self.subject_keywords[subject]:
                if keyword in text:
                    keywords.append(keyword)
        return keywords[:5]  # 최대 5개까지
    
    def parse_question_block(self, block: str, exam_year: str) -> Optional[Dict]:
        """문제 블록을 파싱하여 구조화된 데이터로 변환"""
        try:
            # 문제 번호 추출
            number_match = re.search(r'문제\s*(\d+)', block)
            if not number_match:
                return None
                
            question_num = int(number_match.group(1))
            
            # 문제 0은 제외
            if question_num == 0:
                return None
                
            # 문제 내용 추출
            question_start = block.find("**문제**:")
            if question_start == -1:
                question_start = block.find("**문제**")
                
            if question_start == -1:
                return None
                
            # 선택지 추출
            choices = {}
            choice_patterns = [
                r'[①②③④⑤]\s*([^①②③④⑤\n]+)',
                r'(\d)\.\s*([^\d\n]+)',
                r'[ㄱㄴㄷㄹㅁ]\.\s*([^\n]+)'
            ]
            
            for pattern in choice_patterns:
                matches = re.findall(pattern, block)
                if matches:
                    for i, match in enumerate(matches, 1):
                        if isinstance(match, tuple):
                            choices[str(i)] = match[1].strip()
                        else:
                            choices[str(i)] = match.strip()
                    break
            
            # 정답 추출
            answer_match = re.search(r'정답[:\s]*([①②③④⑤\d])', block)
            answer = None
            if answer_match:
                answer_text = answer_match.group(1)
                if answer_text in '①②③④⑤':
                    answer = '①②③④⑤'.index(answer_text) + 1
                else:
                    answer = int(answer_text)
            
            # 해설 추출
            explanation_match = re.search(r'해설[:\s]*(.+?)(?=문제|\Z)', block, re.DOTALL)
            explanation = explanation_match.group(1).strip() if explanation_match else ""
            
            # 과목 결정
            subject = self.get_subject_by_number(question_num)
            
            # 전체 텍스트 구성
            full_text = block
            
            # 키워드 추출
            keywords = self.extract_keywords(full_text, subject)
            
            return {
                "number": question_num,
                "subject": subject,
                "question": full_text.strip(),
                "choices": choices,
                "answer": answer,
                "explanation": explanation,
                "keywords": keywords
            }
            
        except Exception as e:
            logging.error(f"Error parsing question block: {e}")
            return None
    
    def process_exam_file(self, file_path: str, exam_year: str) -> Dict:
        """전체 시험 파일 처리"""
        logging.info(f"Processing {file_path}")
        
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 문제 블록 분리
        question_blocks = re.split(r'(?=##\s*문제\s*\d+)', content)
        
        questions = []
        question_numbers = set()
        
        for block in question_blocks:
            if not block.strip():
                continue
                
            question = self.parse_question_block(block, exam_year)
            if question and question['number'] not in question_numbers:
                questions.append(question)
                question_numbers.add(question['number'])
        
        # 문제 번호순 정렬
        questions.sort(key=lambda x: x['number'])
        
        # 누락된 문제 확인
        missing_questions = []
        for i in range(1, 151):
            if i not in question_numbers:
                missing_questions.append(i)
        
        result = {
            "exam_year": exam_year,
            "total_questions": len(questions),
            "missing_questions": missing_questions,
            "questions": questions
        }
        
        logging.info(f"Processed {len(questions)} questions, {len(missing_questions)} missing")
        
        return result
    
    def validate_structure(self, data: Dict) -> Dict:
        """구조화된 데이터 검증"""
        issues = []
        
        # 문제 수 검증
        if data['total_questions'] != 150:
            issues.append(f"Expected 150 questions, found {data['total_questions']}")
        
        # 과목별 문제 수 검증
        subject_counts = {}
        for q in data['questions']:
            subject = q['subject']
            subject_counts[subject] = subject_counts.get(subject, 0) + 1
        
        expected_counts = {
            "수목병리학": 30,
            "수목해충학": 30,
            "수목생리학": 30,
            "산림토양학": 30,
            "정책 및 법규": 30
        }
        
        for subject, expected in expected_counts.items():
            actual = subject_counts.get(subject, 0)
            if actual != expected:
                issues.append(f"{subject}: Expected {expected}, found {actual}")
        
        # 선택지 검증
        for q in data['questions']:
            if len(q['choices']) < 4:
                issues.append(f"Question {q['number']}: Less than 4 choices")
            if not q['answer']:
                issues.append(f"Question {q['number']}: No answer")
        
        return {
            "valid": len(issues) == 0,
            "issues": issues,
            "subject_distribution": subject_counts
        }

def main():
    structurer = ExamStructurer()
    
    # 처리할 시험 목록
    exams = [
        ("5회", "exam-5th-complete.md"),
        ("6회", "exam-6th-complete.md"),
        ("7회", "exam-7th-complete.md"),
        ("8회", "exam-8th-complete.md"),
        ("9회", "exam-9th-complete.md"),
        ("10회", "exam-10th-complete.md"),
        ("11회", "exam-11th-complete.md")
    ]
    
    report = {
        "processing_date": datetime.now().isoformat(),
        "exams_processed": [],
        "overall_statistics": {
            "total_questions": 0,
            "total_missing": 0,
            "subject_distribution": {}
        }
    }
    
    for exam_year, filename in exams:
        input_path = f"/Users/voidlight/tree-doctor-pdf-qa-mcp/data/{filename}"
        output_path = f"/Users/voidlight/tree-doctor-pdf-qa-mcp/data/structured/exam-{exam_year.replace('회', 'th')}.json"
        
        if not os.path.exists(input_path):
            logging.warning(f"File not found: {input_path}")
            continue
        
        # 처리
        result = structurer.process_exam_file(input_path, exam_year)
        
        # 검증
        validation = structurer.validate_structure(result)
        
        # 저장
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        
        # 보고서 업데이트
        exam_report = {
            "exam_year": exam_year,
            "questions_found": result['total_questions'],
            "missing_questions": len(result['missing_questions']),
            "validation": validation
        }
        report["exams_processed"].append(exam_report)
        
        # 전체 통계 업데이트
        report["overall_statistics"]["total_questions"] += result['total_questions']
        report["overall_statistics"]["total_missing"] += len(result['missing_questions'])
        
        for subject, count in validation['subject_distribution'].items():
            if subject not in report["overall_statistics"]["subject_distribution"]:
                report["overall_statistics"]["subject_distribution"][subject] = 0
            report["overall_statistics"]["subject_distribution"][subject] += count
        
        logging.info(f"Completed {exam_year}: {output_path}")
    
    # 최종 보고서 저장
    report_path = "/Users/voidlight/tree-doctor-pdf-qa-mcp/data/structured/structuring_report.json"
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    
    logging.info(f"Final report saved: {report_path}")

if __name__ == "__main__":
    main()