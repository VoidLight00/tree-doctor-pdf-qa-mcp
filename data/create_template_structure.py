#!/usr/bin/env python3
"""
나무의사 기출문제 템플릿 구조 생성
OCR 데이터 품질이 너무 낮아 수동 입력을 위한 템플릿 생성
"""

import json
import os
from datetime import datetime

class ExamTemplateGenerator:
    def __init__(self):
        self.subject_mapping = {
            (1, 30): "수목병리학",
            (31, 60): "수목해충학", 
            (61, 90): "수목생리학",
            (91, 120): "산림토양학",
            (121, 150): "정책 및 법규"
        }
        
        # 각 과목별 예시 문제 (실제 기출문제 스타일)
        self.sample_questions = {
            "수목병리학": [
                {
                    "question": "다음 중 수목병원체의 표징(sign)에 해당하지 않는 것은?",
                    "choices": {
                        "1": "균사(hyphae)",
                        "2": "포자(spore)",
                        "3": "자실체(fruiting body)",
                        "4": "병반(lesion)",
                        "5": "균핵(sclerotium)"
                    },
                    "answer": 4,
                    "explanation": "병반(lesion)은 병징(symptom)에 해당하며, 나머지는 모두 병원체의 구조물인 표징이다."
                },
                {
                    "question": "소나무재선충병의 병원체는?",
                    "choices": {
                        "1": "Bursaphelenchus xylophilus",
                        "2": "Cronartium ribicola",
                        "3": "Rhizoctonia solani",
                        "4": "Armillaria mellea",
                        "5": "Phytophthora cinnamomi"
                    },
                    "answer": 1,
                    "explanation": "소나무재선충병의 병원체는 Bursaphelenchus xylophilus이며, 솔수염하늘소가 매개충이다."
                }
            ],
            "수목해충학": [
                {
                    "question": "다음 중 천공성 해충이 아닌 것은?",
                    "choices": {
                        "1": "광릉긴나무좀",
                        "2": "소나무좀",
                        "3": "북방수염하늘소",
                        "4": "솔잎혹파리",
                        "5": "오리나무좀"
                    },
                    "answer": 4,
                    "explanation": "솔잎혹파리는 잎에 충영을 형성하는 해충으로 천공성 해충이 아니다."
                }
            ],
            "수목생리학": [
                {
                    "question": "다음 중 식물호르몬이 아닌 것은?",
                    "choices": {
                        "1": "옥신(Auxin)",
                        "2": "지베렐린(Gibberellin)",
                        "3": "시토키닌(Cytokinin)",
                        "4": "셀룰로오스(Cellulose)",
                        "5": "에틸렌(Ethylene)"
                    },
                    "answer": 4,
                    "explanation": "셀룰로오스는 세포벽의 주요 구성 성분으로 식물호르몬이 아니다."
                }
            ],
            "산림토양학": [
                {
                    "question": "토양 pH가 5.5일 때 토양의 성질은?",
                    "choices": {
                        "1": "강산성",
                        "2": "약산성",
                        "3": "중성",
                        "4": "약알칼리성",
                        "5": "강알칼리성"
                    },
                    "answer": 2,
                    "explanation": "pH 5.5는 약산성에 해당한다. (강산성: <4.5, 약산성: 4.5-6.5, 중성: 6.5-7.5)"
                }
            ],
            "정책 및 법규": [
                {
                    "question": "나무의사 자격시험의 응시자격이 아닌 것은?",
                    "choices": {
                        "1": "수목보호 관련 학과 학사학위 소지자",
                        "2": "수목보호기술자로서 4년 이상 실무경력자",
                        "3": "산림기사 자격 취득 후 3년 이상 실무경력자",
                        "4": "조경기사 자격 취득 후 2년 이상 실무경력자",
                        "5": "식물보호기사 자격 취득 후 3년 이상 실무경력자"
                    },
                    "answer": 4,
                    "explanation": "조경기사는 3년 이상의 실무경력이 필요하다."
                }
            ]
        }
    
    def get_subject_by_number(self, question_num: int) -> str:
        """문제 번호로 과목 분류"""
        for (start, end), subject in self.subject_mapping.items():
            if start <= question_num <= end:
                return subject
        return "미분류"
    
    def create_empty_question(self, number: int) -> dict:
        """빈 문제 템플릿 생성"""
        subject = self.get_subject_by_number(number)
        return {
            "number": number,
            "subject": subject,
            "question": f"[{subject} - 문제 {number}번 내용을 입력하세요]",
            "choices": {
                "1": "[선택지 1]",
                "2": "[선택지 2]",
                "3": "[선택지 3]",
                "4": "[선택지 4]",
                "5": "[선택지 5]"
            },
            "answer": None,
            "explanation": "[해설을 입력하세요]",
            "keywords": []
        }
    
    def create_exam_template(self, exam_year: str) -> dict:
        """전체 시험 템플릿 생성"""
        questions = []
        
        # 각 과목별로 몇 개의 샘플 문제 포함
        sample_indices = {
            "수목병리학": [1, 15],
            "수목해충학": [31, 45],
            "수목생리학": [61, 75],
            "산림토양학": [91, 105],
            "정책 및 법규": [121, 135]
        }
        
        for i in range(1, 151):
            subject = self.get_subject_by_number(i)
            
            # 샘플 문제 삽입
            is_sample = False
            for subj, indices in sample_indices.items():
                if subject == subj and i in indices:
                    sample_idx = indices.index(i)
                    if sample_idx < len(self.sample_questions.get(subj, [])):
                        sample = self.sample_questions[subj][sample_idx].copy()
                        sample["number"] = i
                        sample["subject"] = subject
                        sample["keywords"] = self.extract_keywords_from_question(sample["question"], subject)
                        questions.append(sample)
                        is_sample = True
                        break
            
            if not is_sample:
                questions.append(self.create_empty_question(i))
        
        return {
            "exam_year": exam_year,
            "exam_info": {
                "total_questions": 150,
                "subjects": {
                    "수목병리학": "1-30번",
                    "수목해충학": "31-60번",
                    "수목생리학": "61-90번",
                    "산림토양학": "91-120번",
                    "정책 및 법규": "121-150번"
                },
                "template_version": "1.0",
                "created_date": datetime.now().isoformat(),
                "notes": "이 파일은 수동 입력을 위한 템플릿입니다. [대괄호] 안의 내용을 실제 문제 내용으로 교체하세요."
            },
            "questions": questions
        }
    
    def extract_keywords_from_question(self, question: str, subject: str) -> list:
        """문제에서 키워드 추출"""
        keywords = []
        
        # 기본 키워드 사전
        keyword_dict = {
            "수목병리학": ["병원체", "병징", "표징", "균사", "포자", "재선충", "녹병", "탄저병"],
            "수목해충학": ["해충", "천공성", "나방", "하늘소", "좀", "진딧물", "깍지벌레"],
            "수목생리학": ["호르몬", "옥신", "지베렐린", "시토키닌", "광합성", "호흡", "증산"],
            "산림토양학": ["토양", "pH", "양분", "유기물", "균근", "질소", "인", "칼륨"],
            "정책 및 법규": ["나무의사", "자격", "법률", "시행령", "실무경력", "수목보호"]
        }
        
        for keyword in keyword_dict.get(subject, []):
            if keyword in question:
                keywords.append(keyword)
        
        return keywords[:5]
    
    def create_input_guidelines(self) -> str:
        """입력 가이드라인 생성"""
        guidelines = """# 나무의사 기출문제 입력 가이드라인

## 1. 문제 입력 규칙

### 1.1 문제 번호
- 1-150번까지 순차적으로 입력
- 각 과목별 번호 범위를 준수

### 1.2 문제 내용
- 원문 그대로 정확히 입력
- 특수문자, 괄호, 기호 등 모두 포함
- 그림이나 표가 있는 경우 [그림] 또는 [표] 표시

### 1.3 선택지
- ①②③④⑤ 또는 1)2)3)4)5) 형식 통일
- 각 선택지는 완전한 문장으로 입력
- 보기(ㄱ,ㄴ,ㄷ,ㄹ)가 있는 경우 문제 내용에 포함

### 1.4 정답
- 숫자로만 입력 (1, 2, 3, 4, 5)
- 복수 정답인 경우 배열로 입력 [1, 3]

### 1.5 해설
- 정답의 이유를 명확히 설명
- 관련 개념이나 이론 포함
- 오답의 이유도 간단히 언급

### 1.6 키워드
- 문제의 핵심 개념 3-5개
- 과목별 주요 용어 위주
- 영문 약어는 대문자로 통일

## 2. 품질 체크리스트

- [ ] 문제 번호가 순차적인가?
- [ ] 모든 선택지가 입력되었는가?
- [ ] 정답이 올바르게 표시되었는가?
- [ ] 해설이 충분히 상세한가?
- [ ] 키워드가 적절한가?

## 3. 자주 나오는 실수

1. 문제 번호 중복 또는 누락
2. 선택지 번호 형식 불일치
3. 정답 번호 오류
4. 특수문자 누락
5. 과목 분류 오류

## 4. 입력 예시

```json
{
  "number": 1,
  "subject": "수목병리학",
  "question": "다음 중 수목의 병징(symptom)이 아닌 것은?",
  "choices": {
    "1": "잎의 황화(chlorosis)",
    "2": "균사체(mycelium)",
    "3": "시들음(wilting)",
    "4": "궤양(canker)",
    "5": "괴사(necrosis)"
  },
  "answer": 2,
  "explanation": "균사체는 병원체의 구조물로 표징(sign)에 해당한다. 나머지는 모두 식물체에 나타나는 이상 증상인 병징이다.",
  "keywords": ["병징", "표징", "균사체", "황화", "괴사"]
}
```
"""
        return guidelines

def main():
    generator = ExamTemplateGenerator()
    
    # 각 회차별 템플릿 생성
    exam_years = ["5회", "6회", "7회", "8회", "9회", "10회", "11회"]
    
    for exam_year in exam_years:
        # 템플릿 생성
        template = generator.create_exam_template(exam_year)
        
        # 파일 저장
        output_path = f"/Users/voidlight/tree-doctor-pdf-qa-mcp/data/structured/template-exam-{exam_year.replace('회', 'th')}.json"
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(template, f, ensure_ascii=False, indent=2)
        
        print(f"Created template: {output_path}")
    
    # 입력 가이드라인 저장
    guidelines_path = "/Users/voidlight/tree-doctor-pdf-qa-mcp/data/structured/INPUT_GUIDELINES.md"
    with open(guidelines_path, 'w', encoding='utf-8') as f:
        f.write(generator.create_input_guidelines())
    
    print(f"Created guidelines: {guidelines_path}")
    
    # 데이터 입력 상태 추적 파일 생성
    status = {
        "created_date": datetime.now().isoformat(),
        "total_exams": 7,
        "total_questions": 1050,
        "input_status": {
            "5회": {"total": 150, "completed": 0, "verified": 0},
            "6회": {"total": 150, "completed": 0, "verified": 0},
            "7회": {"total": 150, "completed": 0, "verified": 0},
            "8회": {"total": 150, "completed": 0, "verified": 0},
            "9회": {"total": 150, "completed": 0, "verified": 0},
            "10회": {"total": 150, "completed": 0, "verified": 0},
            "11회": {"total": 150, "completed": 0, "verified": 0}
        },
        "notes": "OCR 품질 문제로 인해 수동 입력이 필요합니다. 원본 PDF를 참조하여 정확히 입력해주세요."
    }
    
    status_path = "/Users/voidlight/tree-doctor-pdf-qa-mcp/data/structured/input_status.json"
    with open(status_path, 'w', encoding='utf-8') as f:
        json.dump(status, f, ensure_ascii=False, indent=2)
    
    print(f"Created status tracker: {status_path}")

if __name__ == "__main__":
    main()