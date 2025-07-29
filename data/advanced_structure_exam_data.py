#!/usr/bin/env python3
"""
나무의사 기출문제 고급 구조화 스크립트
여러 소스에서 최적의 데이터를 추출하여 표준 JSON 구조로 변환
"""

import json
import re
import os
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Any
import logging
from collections import defaultdict
import difflib

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('advanced_structuring.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)

class AdvancedExamStructurer:
    def __init__(self):
        self.subject_mapping = {
            (1, 30): "수목병리학",
            (31, 60): "수목해충학", 
            (61, 90): "수목생리학",
            (91, 120): "산림토양학",
            (121, 150): "정책 및 법규"
        }
        
        # 과목별 키워드 패턴 (확장)
        self.subject_keywords = {
            "수목병리학": [
                "병원균", "병징", "병원성", "기주", "감염", "균사", "포자", "녹병", "탄저병", "시들음병",
                "세균", "바이러스", "진균", "파이토플라즈마", "선충", "방제", "저항성", "감수성", "전염", "병원체"
            ],
            "수목해충학": [
                "곤충", "나방", "하늘소", "좀", "진딧물", "깍지벌레", "유충", "성충", "번데기", "피해",
                "천적", "페로몬", "방제", "살충제", "기주식물", "월동", "발생", "령", "변태", "산란"
            ],
            "수목생리학": [
                "광합성", "호흡", "증산", "양분", "생장", "휴면", "개화", "결실", "호르몬", "스트레스",
                "옥신", "지베렐린", "시토키닌", "ABA", "에틸렌", "형성층", "물관부", "체관부", "기공", "엽록체"
            ],
            "산림토양학": [
                "토양", "pH", "양분", "유기물", "토성", "배수", "비료", "시비", "뿌리", "균근",
                "질소", "인", "칼륨", "칼슘", "마그네슘", "미량원소", "CEC", "염기포화도", "토양구조", "토양단면"
            ],
            "정책 및 법규": [
                "법률", "규정", "시행령", "시행규칙", "허가", "신고", "벌칙", "과태료", "자격", "기준",
                "나무의사", "수목진료", "식물검역", "산림보호", "병해충", "방제명령", "수목원", "산림청", "지방자치단체", "행정처분"
            ]
        }
        
        # 문제 패턴 정규식
        self.question_patterns = [
            r'(\d+)\.\s*(.+?)(?=\d+\.|$)',  # 1. 문제내용
            r'문제\s*(\d+)[.:\s]*(.+?)(?=문제\s*\d+|$)',  # 문제 1: 내용
            r'【문제\s*(\d+)】\s*(.+?)(?=【문제|$)',  # 【문제 1】 내용
            r'Q(\d+)\.\s*(.+?)(?=Q\d+\.|$)',  # Q1. 문제내용
        ]
        
        # 선택지 패턴
        self.choice_patterns = [
            (r'[①②③④⑤]\s*([^①②③④⑤\n]+)', 'circled'),
            (r'[ⓐⓑⓒⓓⓔ]\s*([^ⓐⓑⓒⓓⓔ\n]+)', 'circled_lower'),
            (r'(\d)\)\s*([^\d\)]+)', 'number_paren'),
            (r'[가나다라마]\.\s*([^가나다라마\n]+)', 'korean'),
            (r'[ABCDE]\.\s*([^ABCDE\n]+)', 'alphabet'),
            (r'[ㄱㄴㄷㄹㅁ]\.\s*([^ㄱㄴㄷㄹㅁ\n]+)', 'consonant')
        ]
        
        # 정답 패턴
        self.answer_patterns = [
            r'정답[:\s]*([①②③④⑤ⓐⓑⓒⓓⓔ\d가나다라마ABCDE])',
            r'답[:\s]*([①②③④⑤ⓐⓑⓒⓓⓔ\d가나다라마ABCDE])',
            r'해답[:\s]*([①②③④⑤ⓐⓑⓒⓓⓔ\d가나다라마ABCDE])',
            r'\[정답\]\s*([①②③④⑤ⓐⓑⓒⓓⓔ\d가나다라마ABCDE])'
        ]
        
    def get_subject_by_number(self, question_num: int) -> str:
        """문제 번호로 과목 분류"""
        for (start, end), subject in self.subject_mapping.items():
            if start <= question_num <= end:
                return subject
        return "미분류"
    
    def extract_keywords(self, text: str, subject: str) -> List[str]:
        """문제 텍스트에서 주요 키워드 추출 (개선된 버전)"""
        keywords = []
        text_lower = text.lower()
        
        if subject in self.subject_keywords:
            for keyword in self.subject_keywords[subject]:
                if keyword.lower() in text_lower:
                    keywords.append(keyword)
        
        # 추가 키워드 추출 (전문 용어 패턴)
        # 학명 패턴
        scientific_names = re.findall(r'[A-Z][a-z]+ [a-z]+', text)
        keywords.extend(scientific_names[:3])
        
        # 영문 약어
        abbreviations = re.findall(r'\b[A-Z]{2,}\b', text)
        keywords.extend(abbreviations[:2])
        
        return list(set(keywords))[:7]  # 중복 제거 후 최대 7개
    
    def clean_text(self, text: str) -> str:
        """텍스트 정리"""
        # 불필요한 공백 및 줄바꿈 정리
        text = re.sub(r'\s+', ' ', text)
        text = re.sub(r'\n{3,}', '\n\n', text)
        
        # 깨진 문자 패턴 제거
        text = re.sub(r'[『』「」〔〕〈〉《》]', '', text)
        text = re.sub(r'[ㅇㅁㅎ]{3,}', '', text)
        text = re.sub(r'\d{6,}', '', text)
        
        return text.strip()
    
    def extract_question_from_text(self, text: str, question_num: int) -> Optional[Dict]:
        """텍스트에서 특정 번호의 문제 추출"""
        # 여러 패턴 시도
        for pattern in self.question_patterns:
            matches = re.finditer(pattern, text, re.DOTALL)
            for match in matches:
                try:
                    num = int(match.group(1))
                    if num == question_num:
                        content = match.group(2)
                        return self.parse_question_content(content, num)
                except:
                    continue
        return None
    
    def parse_question_content(self, content: str, question_num: int) -> Dict:
        """문제 내용 파싱"""
        content = self.clean_text(content)
        
        # 선택지 추출
        choices = {}
        best_choice_match = None
        best_choice_count = 0
        
        for pattern, pattern_type in self.choice_patterns:
            matches = re.findall(pattern, content)
            if len(matches) > best_choice_count:
                best_choice_match = matches
                best_choice_count = len(matches)
                
        if best_choice_match:
            for i, choice in enumerate(best_choice_match, 1):
                if isinstance(choice, tuple):
                    choices[str(i)] = self.clean_text(choice[1] if len(choice) > 1 else choice[0])
                else:
                    choices[str(i)] = self.clean_text(choice)
        
        # 정답 추출
        answer = None
        for pattern in self.answer_patterns:
            match = re.search(pattern, content)
            if match:
                answer_text = match.group(1)
                # 정답 변환
                if answer_text in '①②③④⑤':
                    answer = '①②③④⑤'.index(answer_text) + 1
                elif answer_text in 'ⓐⓑⓒⓓⓔ':
                    answer = 'ⓐⓑⓒⓓⓔ'.index(answer_text) + 1
                elif answer_text.isdigit():
                    answer = int(answer_text)
                elif answer_text in '가나다라마':
                    answer = '가나다라마'.index(answer_text) + 1
                elif answer_text in 'ABCDE':
                    answer = 'ABCDE'.index(answer_text) + 1
                break
        
        # 문제 텍스트 정리 (선택지 제거)
        question_text = content
        for pattern, _ in self.choice_patterns:
            question_text = re.sub(pattern, '', question_text)
        
        # 해설 추출
        explanation = ""
        explanation_match = re.search(r'해설[:\s]*(.+?)(?=문제|정답|$)', content, re.DOTALL)
        if explanation_match:
            explanation = self.clean_text(explanation_match.group(1))
        
        # 과목 결정
        subject = self.get_subject_by_number(question_num)
        
        # 키워드 추출
        keywords = self.extract_keywords(content, subject)
        
        return {
            "number": question_num,
            "subject": subject,
            "question": question_text.strip(),
            "choices": choices,
            "answer": answer,
            "explanation": explanation,
            "keywords": keywords
        }
    
    def merge_question_sources(self, sources: List[Dict]) -> Dict:
        """여러 소스에서 추출한 문제 데이터 병합"""
        if not sources:
            return None
        
        # 가장 완전한 데이터 선택
        best_source = sources[0]
        best_score = 0
        
        for source in sources:
            score = 0
            if source.get('question') and len(source['question']) > 10:
                score += 3
            if source.get('choices') and len(source['choices']) >= 4:
                score += 2
            if source.get('answer'):
                score += 1
            if source.get('explanation'):
                score += 1
            if source.get('keywords'):
                score += 1
                
            if score > best_score:
                best_score = score
                best_source = source
        
        # 다른 소스에서 누락된 정보 보완
        merged = best_source.copy()
        for source in sources:
            if not merged.get('answer') and source.get('answer'):
                merged['answer'] = source['answer']
            if not merged.get('explanation') and source.get('explanation'):
                merged['explanation'] = source['explanation']
            if len(merged.get('choices', {})) < len(source.get('choices', {})):
                merged['choices'] = source['choices']
            if len(merged.get('keywords', [])) < len(source.get('keywords', [])):
                merged['keywords'] = source['keywords']
        
        return merged
    
    def process_exam_files(self, exam_year: str, file_patterns: List[str]) -> Dict:
        """여러 파일에서 시험 데이터 처리"""
        logging.info(f"Processing exam year: {exam_year}")
        
        all_questions = defaultdict(list)
        
        # 각 파일에서 문제 추출
        for pattern in file_patterns:
            file_path = f"/Users/voidlight/tree-doctor-pdf-qa-mcp/data/{pattern}"
            if not os.path.exists(file_path):
                continue
                
            logging.info(f"Reading {file_path}")
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # 1-150번 문제 추출 시도
            for num in range(1, 151):
                question = self.extract_question_from_text(content, num)
                if question:
                    all_questions[num].append(question)
        
        # 문제별로 최적 데이터 선택
        final_questions = []
        for num in range(1, 151):
            if num in all_questions:
                merged = self.merge_question_sources(all_questions[num])
                if merged:
                    final_questions.append(merged)
            else:
                # 누락된 문제 - 빈 데이터로 채우기
                final_questions.append({
                    "number": num,
                    "subject": self.get_subject_by_number(num),
                    "question": f"[문제 {num} 데이터 누락]",
                    "choices": {},
                    "answer": None,
                    "explanation": "",
                    "keywords": []
                })
        
        # 검증
        missing_questions = [q['number'] for q in final_questions if "[데이터 누락]" in q['question']]
        
        result = {
            "exam_year": exam_year,
            "total_questions": len(final_questions),
            "complete_questions": len([q for q in final_questions if "[데이터 누락]" not in q['question']]),
            "missing_questions": missing_questions,
            "questions": final_questions
        }
        
        return result
    
    def generate_sample_questions(self, exam_year: str, subject: str, start_num: int, count: int) -> List[Dict]:
        """샘플 문제 생성 (테스트용)"""
        questions = []
        
        sample_templates = {
            "수목병리학": [
                ("다음 중 수목병원균의 특징으로 옳지 않은 것은?", 
                 ["세균은 세포벽을 가지고 있다", "바이러스는 기주세포 내에서만 증식한다", 
                  "진균은 균사를 형성한다", "파이토플라즈마는 세포벽이 있다", "선충은 다세포 동물이다"], 4),
                ("소나무재선충병의 매개충은?",
                 ["솔수염하늘소", "소나무좀", "솔잎혹파리", "솔껍질깍지벌레", "매미나방"], 1)
            ],
            "수목해충학": [
                ("다음 중 천공성 해충이 아닌 것은?",
                 ["광릉긴나무좀", "소나무좀", "북방수염하늘소", "솔잎혹파리", "밤나무줄기마름병"], 4),
                ("매미나방의 월동 형태는?",
                 ["난괴", "유충", "번데기", "성충", "유충과 번데기"], 1)
            ]
        }
        
        templates = sample_templates.get(subject, [])
        for i in range(count):
            if templates:
                template = templates[i % len(templates)]
                question = {
                    "number": start_num + i,
                    "subject": subject,
                    "question": template[0],
                    "choices": {str(j+1): choice for j, choice in enumerate(template[1])},
                    "answer": template[2],
                    "explanation": f"{subject} 관련 기본 개념 문제입니다.",
                    "keywords": self.extract_keywords(template[0] + " ".join(template[1]), subject)
                }
                questions.append(question)
        
        return questions

def main():
    structurer = AdvancedExamStructurer()
    
    # 처리할 시험 및 파일 패턴
    exam_configs = [
        ("5회", ["exam-5th-complete.md", "exam-5th-ocr.md", "exam-5th.md"]),
        ("6회", ["exam-6th-complete.md", "exam-6th-ocr.md", "exam-6th.md"]),
        ("7회", ["exam-7th-complete.md", "exam-7th-ocr.md", "exam-7th.md"]),
        ("8회", ["exam-8th-complete.md", "exam-8th-ocr.md", "exam-8th.md"]),
        ("9회", ["exam-9th-complete.md", "exam-9th-ocr.md", "exam-9th.md"]),
        ("10회", ["exam-10th-complete.md", "exam-10th-ocr.md", "exam-10th.md"]),
        ("11회", ["exam-11th-complete.md", "exam-11th-ocr.md", "exam-11th.md"])
    ]
    
    report = {
        "processing_date": datetime.now().isoformat(),
        "processor": "AdvancedExamStructurer v2.0",
        "exams_processed": [],
        "overall_statistics": {
            "total_questions_expected": 1050,  # 150 * 7
            "total_questions_found": 0,
            "total_complete_questions": 0,
            "total_missing": 0,
            "subject_distribution": defaultdict(int),
            "quality_metrics": {
                "with_choices": 0,
                "with_answers": 0,
                "with_explanations": 0,
                "with_keywords": 0
            }
        }
    }
    
    for exam_year, file_patterns in exam_configs:
        output_path = f"/Users/voidlight/tree-doctor-pdf-qa-mcp/data/structured/exam-{exam_year.replace('회', 'th')}.json"
        
        # 처리
        result = structurer.process_exam_files(exam_year, file_patterns)
        
        # 저장
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        
        # 보고서 업데이트
        exam_report = {
            "exam_year": exam_year,
            "total_questions": result['total_questions'],
            "complete_questions": result['complete_questions'],
            "missing_questions": len(result['missing_questions']),
            "missing_question_numbers": result['missing_questions'][:10] + (['...'] if len(result['missing_questions']) > 10 else [])
        }
        
        # 품질 메트릭
        quality_metrics = {
            "with_choices": 0,
            "with_answers": 0,
            "with_explanations": 0,
            "with_keywords": 0
        }
        
        for q in result['questions']:
            if "[데이터 누락]" not in q['question']:
                if q.get('choices') and len(q['choices']) >= 4:
                    quality_metrics['with_choices'] += 1
                if q.get('answer'):
                    quality_metrics['with_answers'] += 1
                if q.get('explanation'):
                    quality_metrics['with_explanations'] += 1
                if q.get('keywords'):
                    quality_metrics['with_keywords'] += 1
        
        exam_report['quality_metrics'] = quality_metrics
        report["exams_processed"].append(exam_report)
        
        # 전체 통계 업데이트
        report["overall_statistics"]["total_questions_found"] += result['total_questions']
        report["overall_statistics"]["total_complete_questions"] += result['complete_questions']
        report["overall_statistics"]["total_missing"] += len(result['missing_questions'])
        
        # 품질 메트릭 합산
        for key, value in quality_metrics.items():
            report["overall_statistics"]["quality_metrics"][key] += value
        
        logging.info(f"Completed {exam_year}: {output_path}")
        logging.info(f"Found {result['complete_questions']}/{result['total_questions']} complete questions")
    
    # 최종 보고서 저장
    report_path = "/Users/voidlight/tree-doctor-pdf-qa-mcp/data/structured/advanced_structuring_report.json"
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    
    # 요약 보고서 생성
    summary_path = "/Users/voidlight/tree-doctor-pdf-qa-mcp/data/structured/STRUCTURING_SUMMARY.md"
    with open(summary_path, 'w', encoding='utf-8') as f:
        f.write("# 나무의사 기출문제 구조화 완료 보고서\n\n")
        f.write(f"**처리 일시**: {report['processing_date']}\n")
        f.write(f"**처리기**: {report['processor']}\n\n")
        f.write("## 전체 요약\n\n")
        f.write(f"- **총 기대 문제 수**: {report['overall_statistics']['total_questions_expected']}개 (150문제 × 7회)\n")
        f.write(f"- **실제 발견 문제 수**: {report['overall_statistics']['total_questions_found']}개\n")
        f.write(f"- **완전한 문제 수**: {report['overall_statistics']['total_complete_questions']}개\n")
        f.write(f"- **누락된 문제 수**: {report['overall_statistics']['total_missing']}개\n\n")
        
        f.write("## 회차별 상세\n\n")
        f.write("| 회차 | 총 문제 | 완전한 문제 | 누락 문제 | 선택지 있음 | 정답 있음 |\n")
        f.write("|------|---------|-------------|-----------|-------------|----------|\n")
        for exam in report['exams_processed']:
            f.write(f"| {exam['exam_year']} | {exam['total_questions']} | ")
            f.write(f"{exam['complete_questions']} | {exam['missing_questions']} | ")
            f.write(f"{exam['quality_metrics']['with_choices']} | ")
            f.write(f"{exam['quality_metrics']['with_answers']} |\n")
        
        f.write("\n## 품질 지표\n\n")
        total_complete = report['overall_statistics']['total_complete_questions']
        if total_complete > 0:
            f.write(f"- **선택지 포함률**: {report['overall_statistics']['quality_metrics']['with_choices']/total_complete*100:.1f}%\n")
            f.write(f"- **정답 포함률**: {report['overall_statistics']['quality_metrics']['with_answers']/total_complete*100:.1f}%\n")
            f.write(f"- **해설 포함률**: {report['overall_statistics']['quality_metrics']['with_explanations']/total_complete*100:.1f}%\n")
            f.write(f"- **키워드 포함률**: {report['overall_statistics']['quality_metrics']['with_keywords']/total_complete*100:.1f}%\n")
        
        f.write("\n## 권장사항\n\n")
        f.write("1. 누락된 문제 데이터는 원본 PDF에서 수동으로 입력 필요\n")
        f.write("2. OCR 품질이 낮은 부분은 재스캔 후 고품질 OCR 도구 사용 권장\n")
        f.write("3. 정답과 해설이 누락된 문제는 별도 해설집 참조 필요\n")
        f.write("4. 구조화된 데이터는 검수 후 학습 시스템에 활용 가능\n")
    
    logging.info(f"Summary report saved: {summary_path}")

if __name__ == "__main__":
    main()