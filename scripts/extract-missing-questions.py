#!/usr/bin/env python3
"""
누락된 기출문제를 추출하고 텍스트화하는 전략
"""

import os
import json
import sqlite3
from pathlib import Path
from datetime import datetime

class MissingQuestionExtractor:
    def __init__(self):
        self.project_root = Path(__file__).parent.parent
        self.data_dir = self.project_root / "data"
        self.db_path = self.project_root / "tree-doctor-pdf-qa.db"
        
    def analyze_missing_questions(self):
        """누락된 문제 분석"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # 회차별 현황
        cursor.execute("""
            SELECT exam_year, COUNT(*) as current, 
                   150 - COUNT(*) as missing
            FROM exam_questions 
            GROUP BY exam_year
            ORDER BY exam_year
        """)
        
        results = cursor.fetchall()
        conn.close()
        
        report = {
            "analysis_date": datetime.now().isoformat(),
            "total_target": 750,  # 5회차 * 150문제
            "current_total": sum(r[1] for r in results),
            "missing_total": sum(r[2] for r in results),
            "rounds": {}
        }
        
        for year, current, missing in results:
            report["rounds"][f"{year}회"] = {
                "current": current,
                "target": 150,
                "missing": missing,
                "completion_rate": f"{(current/150)*100:.1f}%"
            }
            
        return report

    def create_extraction_strategies(self):
        """회차별 추출 전략"""
        strategies = {
            "5회": {
                "status": "PDF 없음",
                "strategy": "대체 자료 필요",
                "actions": [
                    "온라인 커뮤니티에서 문제 수집",
                    "기출문제집 구매 후 수동 입력",
                    "Discord/카페에서 자료 요청"
                ]
            },
            "6회": {
                "status": "41문제 누락",
                "strategy": "부분 복구 가능",
                "actions": [
                    "기존 마크다운 파일 재검토",
                    "이미지 OCR 재시도",
                    "수동으로 누락 문제 입력"
                ]
            },
            "7회": {
                "status": "145문제 누락",
                "strategy": "전면 재작업 필요",
                "actions": [
                    "원본 PDF 재확보",
                    "고품질 OCR 도구 사용",
                    "페이지별 수동 검증"
                ]
            },
            "8회": {
                "status": "145문제 누락",
                "strategy": "전면 재작업 필요",
                "actions": [
                    "마크다운 파일 구조 분석",
                    "문제 패턴 인식 개선",
                    "선택지 추출 로직 수정"
                ]
            },
            "9회": {
                "status": "91문제 누락",
                "strategy": "부분 보완",
                "actions": [
                    "기존 59문제 품질 검증",
                    "누락 구간 집중 추출",
                    "문제 번호 연속성 확인"
                ]
            },
            "10회": {
                "status": "완료",
                "strategy": "품질 개선만",
                "actions": [
                    "선택지 정확도 검증",
                    "정답 확인",
                    "해설 추가"
                ]
            },
            "11회": {
                "status": "120문제 누락",
                "strategy": "대규모 보완 필요",
                "actions": [
                    "125문제 형식 확인",
                    "누락 문제 집중 추출",
                    "최종 검증"
                ]
            }
        }
        
        return strategies

    def create_manual_input_template(self):
        """수동 입력용 템플릿 생성"""
        template = {
            "exam_year": 0,
            "question_number": 0,
            "subject": "과목 선택: 수목병리학/수목해충학/수목생리학/수목관리학/임업일반/토양학",
            "question_text": "문제 내용을 여기에 입력하세요",
            "choices": {
                "1": "첫 번째 선택지",
                "2": "두 번째 선택지",
                "3": "세 번째 선택지",
                "4": "네 번째 선택지"
            },
            "answer": 0,
            "explanation": "해설 (선택사항)",
            "keywords": ["키워드1", "키워드2"]
        }
        
        # 템플릿 파일 생성
        template_path = self.data_dir / "manual-input-template.json"
        with open(template_path, 'w', encoding='utf-8') as f:
            json.dump(template, f, ensure_ascii=False, indent=2)
            
        return template_path

    def create_ocr_improvement_script(self):
        """OCR 개선 스크립트"""
        script = '''#!/usr/bin/env python3
"""
개선된 OCR 스크립트 - Tesseract + 후처리
"""

import pytesseract
from PIL import Image, ImageEnhance, ImageFilter
import cv2
import numpy as np

def preprocess_image(image_path):
    """이미지 전처리로 OCR 정확도 향상"""
    # 이미지 로드
    img = cv2.imread(image_path)
    
    # 그레이스케일 변환
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # 노이즈 제거
    denoised = cv2.fastNlMeansDenoising(gray)
    
    # 대비 향상
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    enhanced = clahe.apply(denoised)
    
    # 이진화
    _, binary = cv2.threshold(enhanced, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    
    return binary

def extract_text_with_layout(image_path):
    """레이아웃 보존하며 텍스트 추출"""
    # 전처리
    processed = preprocess_image(image_path)
    
    # Tesseract 설정
    custom_config = r'--oem 3 --psm 6 -l kor+eng'
    
    # OCR 실행
    text = pytesseract.image_to_string(processed, config=custom_config)
    
    # 후처리
    text = post_process_text(text)
    
    return text

def post_process_text(text):
    """OCR 결과 후처리"""
    # 일반적인 OCR 오류 수정
    corrections = {
        '뮤효': '유효',
        '몬도': '온도',
        '0)': '①',
        '®': '②',
        '©': '③',
        '@': '④',
        '®': '⑤'
    }
    
    for wrong, correct in corrections.items():
        text = text.replace(wrong, correct)
        
    return text

def extract_questions_from_text(text):
    """텍스트에서 문제 구조 추출"""
    import re
    
    questions = []
    
    # 문제 패턴
    question_pattern = r'(\d+)\s*[.)]\s*(.+?)(?=\d+\s*[.)]|$)'
    
    matches = re.finditer(question_pattern, text, re.DOTALL)
    
    for match in matches:
        q_num = match.group(1)
        q_text = match.group(2).strip()
        
        # 선택지 추출
        choices = {}
        choice_pattern = r'([①②③④⑤])\s*(.+?)(?=[①②③④⑤]|정답|$)'
        choice_matches = re.finditer(choice_pattern, q_text)
        
        for c_match in choice_matches:
            choice_num = c_match.group(1)
            choice_text = c_match.group(2).strip()
            choices[choice_num] = choice_text
            
        questions.append({
            'number': int(q_num),
            'text': q_text.split('①')[0].strip(),
            'choices': choices
        })
        
    return questions
'''
        
        script_path = self.data_dir / "improved_ocr_extractor.py"
        with open(script_path, 'w', encoding='utf-8') as f:
            f.write(script)
            
        return script_path

    def create_crowdsourcing_template(self):
        """크라우드소싱용 GitHub 이슈 템플릿"""
        template = """---
name: 기출문제 입력
about: 누락된 나무의사 기출문제를 제공해주세요
title: '[문제입력] X회 X번 문제'
labels: ['contribution', 'exam-questions']
---

## 문제 정보
- **회차**: X회
- **문제 번호**: X번
- **과목**: 

## 문제 내용
```
여기에 문제를 입력하세요
```

## 선택지
- ① 
- ② 
- ③ 
- ④ 

## 정답
- 정답: X번

## 해설 (선택사항)
```
해설이 있다면 여기에 입력하세요
```

## 출처
- [ ] 공식 기출문제집
- [ ] 수험서
- [ ] 기타: 

---
**기여해주셔서 감사합니다! 🌳**
"""
        
        template_path = self.project_root / ".github" / "ISSUE_TEMPLATE" / "add-question.md"
        template_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(template_path, 'w', encoding='utf-8') as f:
            f.write(template)
            
        return template_path

    def generate_completion_plan(self):
        """완성 계획 생성"""
        analysis = self.analyze_missing_questions()
        strategies = self.create_extraction_strategies()
        
        plan = {
            "project": "나무의사 기출문제 완성 프로젝트",
            "current_status": analysis,
            "strategies": strategies,
            "timeline": {
                "Phase 1 (1주)": [
                    "수동 입력 템플릿 배포",
                    "GitHub 이슈 템플릿 설정",
                    "Discord 커뮤니티 개설"
                ],
                "Phase 2 (2주)": [
                    "OCR 도구 개선",
                    "기존 마크다운 재분석",
                    "부분 완성 회차(6, 9회) 보완"
                ],
                "Phase 3 (4주)": [
                    "크라우드소싱 시작",
                    "대량 누락 회차(7, 8, 11회) 작업",
                    "품질 검증"
                ],
                "Phase 4 (2주)": [
                    "최종 검증",
                    "데이터베이스 업데이트",
                    "배포"
                ]
            },
            "resources_needed": [
                "원본 PDF 파일",
                "고품질 OCR 도구 (Google Vision API 등)",
                "커뮤니티 참여자",
                "검증 인력"
            ]
        }
        
        # 계획서 저장
        plan_path = self.project_root / "COMPLETION_PLAN.md"
        with open(plan_path, 'w', encoding='utf-8') as f:
            f.write(f"# 나무의사 기출문제 완성 계획\n\n")
            f.write(f"생성일: {datetime.now().strftime('%Y-%m-%d')}\n\n")
            f.write("## 현재 상황\n")
            f.write(f"- 전체 목표: 750문제 (5회차 × 150문제)\n")
            f.write(f"- 현재 보유: {analysis['current_total']}문제\n")
            f.write(f"- 누락: {analysis['missing_total']}문제\n\n")
            
            f.write("## 회차별 상황\n")
            for round_name, data in analysis['rounds'].items():
                f.write(f"### {round_name}\n")
                f.write(f"- 현재: {data['current']}/{data['target']}문제\n")
                f.write(f"- 완성도: {data['completion_rate']}\n")
                f.write(f"- 전략: {strategies[round_name]['strategy']}\n\n")
                
        return plan_path

# 실행
if __name__ == "__main__":
    extractor = MissingQuestionExtractor()
    
    print("📊 누락 문제 분석 중...")
    analysis = extractor.analyze_missing_questions()
    print(json.dumps(analysis, ensure_ascii=False, indent=2))
    
    print("\n📝 템플릿 생성 중...")
    template_path = extractor.create_manual_input_template()
    print(f"✅ 수동 입력 템플릿: {template_path}")
    
    print("\n🔧 OCR 개선 스크립트 생성 중...")
    ocr_path = extractor.create_ocr_improvement_script()
    print(f"✅ OCR 스크립트: {ocr_path}")
    
    print("\n👥 크라우드소싱 템플릿 생성 중...")
    crowd_path = extractor.create_crowdsourcing_template()
    print(f"✅ GitHub 이슈 템플릿: {crowd_path}")
    
    print("\n📋 완성 계획 생성 중...")
    plan_path = extractor.generate_completion_plan()
    print(f"✅ 완성 계획서: {plan_path}")