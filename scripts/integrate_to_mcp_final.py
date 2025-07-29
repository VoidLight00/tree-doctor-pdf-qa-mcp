#!/usr/bin/env python3
"""
추출된 나무의사 기출문제 데이터를 MCP 시스템에 통합
"""

import os
import sys
import json
import logging
from pathlib import Path
from typing import Dict, List
from datetime import datetime

# MCP 시스템 경로 추가
sys.path.insert(0, '/Users/voidlight/tree-doctor-pdf-qa-mcp')

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

class MCPIntegrator:
    """MCP 시스템 통합 클래스"""
    
    def __init__(self):
        self.logger = logging.getLogger(self.__class__.__name__)
        self.data_dir = Path("/Users/voidlight/tree-doctor-pdf-qa-mcp/data")
        self.mcp_dir = Path("/Users/voidlight/tree-doctor-pdf-qa-mcp/mcp_data")
        self.mcp_dir.mkdir(exist_ok=True)
        
    def load_all_questions(self) -> Dict[int, List[Dict]]:
        """모든 회차의 문제 로드"""
        all_questions = {}
        
        # JSON 파일 매핑
        json_files = {
            5: "exam-5th-extracted.json",
            6: "exam-6th-extracted.json", 
            7: "exam-7th-all-questions.json",
            8: "exam-8th-final.json",
            9: "exam-9th-final.json",
            10: "exam-10th-extracted.json",
            11: "exam-11th-extracted.json"
        }
        
        for exam_round, filename in json_files.items():
            file_path = self.data_dir / filename
            if file_path.exists():
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        
                    # 각 파일의 구조에 따라 문제 추출
                    if "questions" in data:
                        all_questions[exam_round] = data["questions"]
                    elif isinstance(data, list):
                        all_questions[exam_round] = data
                    else:
                        self.logger.warning(f"{exam_round}회 파일 구조 확인 필요")
                        
                    self.logger.info(f"{exam_round}회 로드 완료: {len(all_questions.get(exam_round, []))}문제")
                except Exception as e:
                    self.logger.error(f"{exam_round}회 로드 실패: {e}")
            else:
                self.logger.warning(f"{exam_round}회 파일 없음: {filename}")
                
        return all_questions
    
    def create_mcp_structure(self, all_questions: Dict[int, List[Dict]]) -> Dict:
        """MCP 호환 데이터 구조 생성"""
        mcp_data = {
            "metadata": {
                "title": "나무의사 자격시험 기출문제 데이터베이스",
                "version": "1.0",
                "created_date": datetime.now().isoformat(),
                "total_exams": len(all_questions),
                "total_questions": sum(len(q) for q in all_questions.values()),
                "quality_levels": {
                    "high": 0,
                    "medium": 0,
                    "low": 0
                }
            },
            "exams": {},
            "subjects": {
                "수목병리학": [],
                "수목해충학": [],
                "수목생리학": [],
                "산림토양학": [],
                "정책 및 법규": []
            },
            "search_index": []
        }
        
        # 각 회차 데이터 통합
        for exam_round, questions in all_questions.items():
            exam_key = f"exam_{exam_round}"
            mcp_data["exams"][exam_key] = {
                "round": exam_round,
                "title": f"제{exam_round}회 나무의사 자격시험",
                "question_count": len(questions),
                "questions": []
            }
            
            for q_idx, question in enumerate(questions):
                # 표준화된 문제 구조 생성
                std_question = self._standardize_question(question, exam_round, q_idx)
                
                # 품질 평가
                quality = self._assess_quality(std_question)
                mcp_data["metadata"]["quality_levels"][quality] += 1
                
                # 문제 추가
                mcp_data["exams"][exam_key]["questions"].append(std_question)
                
                # 과목별 분류
                subject = std_question.get("subject", "기타")
                if subject in mcp_data["subjects"]:
                    mcp_data["subjects"][subject].append({
                        "exam_round": exam_round,
                        "question_id": std_question["id"]
                    })
                
                # 검색 인덱스 생성
                mcp_data["search_index"].append({
                    "id": std_question["id"],
                    "exam_round": exam_round,
                    "text": std_question.get("question", ""),
                    "keywords": std_question.get("keywords", [])
                })
                
        return mcp_data
    
    def _standardize_question(self, question: Dict, exam_round: int, index: int) -> Dict:
        """문제 구조 표준화"""
        std_question = {
            "id": f"q{exam_round}_{index+1}",
            "exam_round": exam_round,
            "number": question.get("number", question.get("question_number", index+1)),
            "subject": question.get("subject", self._determine_subject(question)),
            "question": question.get("question", question.get("question_text", "")),
            "choices": self._standardize_choices(question),
            "answer": question.get("answer", question.get("correct_answer", "")),
            "explanation": question.get("explanation", ""),
            "keywords": question.get("keywords", []),
            "difficulty": question.get("difficulty", ""),
            "quality": ""  # 나중에 평가
        }
        
        return std_question
    
    def _standardize_choices(self, question: Dict) -> Dict[str, str]:
        """선택지 표준화"""
        choices = {}
        
        # 다양한 선택지 형식 처리
        if "choices" in question:
            if isinstance(question["choices"], dict):
                choices = question["choices"]
            elif isinstance(question["choices"], list):
                for i, choice in enumerate(question["choices"]):
                    if isinstance(choice, dict):
                        num = choice.get("number", i+1)
                        text = choice.get("text", "")
                        choices[str(num)] = text
                    else:
                        choices[str(i+1)] = str(choice)
                        
        elif "options" in question:
            choices = question["options"]
            
        return choices
    
    def _determine_subject(self, question: Dict) -> str:
        """문제 번호로 과목 결정"""
        q_num = question.get("number", question.get("question_number", 0))
        
        if isinstance(q_num, int):
            if 1 <= q_num <= 30:
                return "수목병리학"
            elif 31 <= q_num <= 60:
                return "수목해충학"
            elif 61 <= q_num <= 90:
                return "수목생리학"
            elif 91 <= q_num <= 120:
                return "산림토양학"
            elif 121 <= q_num <= 150:
                return "정책 및 법규"
                
        return "기타"
    
    def _assess_quality(self, question: Dict) -> str:
        """문제 품질 평가"""
        score = 0
        
        # 필수 요소 체크
        if question.get("question", "").strip():
            score += 2
        if len(question.get("choices", {})) >= 4:
            score += 2
        if question.get("answer"):
            score += 2
        if question.get("explanation"):
            score += 1
        if len(question.get("keywords", [])) > 0:
            score += 1
            
        # 품질 등급 결정
        if score >= 7:
            quality = "high"
        elif score >= 4:
            quality = "medium"
        else:
            quality = "low"
            
        question["quality"] = quality
        return quality
    
    def save_mcp_data(self, mcp_data: Dict):
        """MCP 데이터 저장"""
        # 메인 데이터베이스 저장
        db_path = self.mcp_dir / "tree_doctor_questions.json"
        with open(db_path, 'w', encoding='utf-8') as f:
            json.dump(mcp_data, f, ensure_ascii=False, indent=2)
        self.logger.info(f"MCP 데이터베이스 저장: {db_path}")
        
        # 회차별 개별 파일 저장
        for exam_key, exam_data in mcp_data["exams"].items():
            exam_path = self.mcp_dir / f"{exam_key}.json"
            with open(exam_path, 'w', encoding='utf-8') as f:
                json.dump(exam_data, f, ensure_ascii=False, indent=2)
                
        # 검색 인덱스 저장
        index_path = self.mcp_dir / "search_index.json"
        with open(index_path, 'w', encoding='utf-8') as f:
            json.dump(mcp_data["search_index"], f, ensure_ascii=False, indent=2)
            
        # 통계 보고서 생성
        self._generate_statistics_report(mcp_data)
        
    def _generate_statistics_report(self, mcp_data: Dict):
        """통계 보고서 생성"""
        report_path = self.mcp_dir / "integration_report.md"
        
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write("# MCP 통합 결과 보고서\n\n")
            f.write(f"**생성일**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            
            f.write("## 전체 통계\n")
            f.write(f"- 총 시험 회차: {mcp_data['metadata']['total_exams']}개\n")
            f.write(f"- 총 문제 수: {mcp_data['metadata']['total_questions']}개\n\n")
            
            f.write("## 품질 분포\n")
            for quality, count in mcp_data['metadata']['quality_levels'].items():
                percentage = (count / mcp_data['metadata']['total_questions'] * 100) if mcp_data['metadata']['total_questions'] > 0 else 0
                f.write(f"- {quality.upper()}: {count}개 ({percentage:.1f}%)\n")
            
            f.write("\n## 회차별 현황\n")
            for exam_key, exam_data in mcp_data["exams"].items():
                f.write(f"- {exam_data['title']}: {exam_data['question_count']}문제\n")
                
            f.write("\n## 과목별 분포\n")
            for subject, refs in mcp_data["subjects"].items():
                f.write(f"- {subject}: {len(refs)}문제\n")
                
        self.logger.info(f"통합 보고서 생성: {report_path}")

def main():
    """메인 실행 함수"""
    logger = logging.getLogger("Main")
    logger.info("MCP 시스템 통합 시작")
    
    # 통합기 생성
    integrator = MCPIntegrator()
    
    # 1. 모든 문제 로드
    all_questions = integrator.load_all_questions()
    logger.info(f"총 {len(all_questions)}개 회차 로드 완료")
    
    # 2. MCP 구조 생성
    mcp_data = integrator.create_mcp_structure(all_questions)
    
    # 3. 데이터 저장
    integrator.save_mcp_data(mcp_data)
    
    # 4. 완료 메시지
    logger.info("✅ MCP 시스템 통합 완료!")
    logger.info(f"총 {mcp_data['metadata']['total_questions']}개 문제 통합")
    logger.info(f"고품질: {mcp_data['metadata']['quality_levels']['high']}개")
    logger.info(f"중간품질: {mcp_data['metadata']['quality_levels']['medium']}개")
    logger.info(f"저품질: {mcp_data['metadata']['quality_levels']['low']}개")

if __name__ == "__main__":
    main()