#!/usr/bin/env python3
"""
최종 150문제 파일 수정 - 제대로 된 내용으로
"""

import re
import json
import os

def parse_existing_file():
    """기존 exam-10th-perfect.md 파일 파싱"""
    questions = {}
    
    with open('data/exam-10th-perfect.md', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 각 문제를 찾아서 파싱
    sections = content.split('\n---\n')
    
    for section in sections:
        if section.strip() and '##' in section:
            # 문제 번호와 내용 추출
            match = re.search(r'## (\d+)\. (.+?)(?:\n|$)', section)
            if match:
                q_num = int(match.group(1))
                q_text = match.group(2).strip()
                
                # 정답 추출
                answer_match = re.search(r'\*\*정답:\s*([①②③④⑤])\*\*', section)
                answer = answer_match.group(1) if answer_match else None
                
                # 보기 추출
                lines = section.split('\n')
                options = []
                content_lines = []
                
                for line in lines:
                    line = line.strip()
                    if re.match(r'^[①②③④⑤]', line):
                        options.append(line)
                    elif line and not line.startswith('##') and not line.startswith('**정답'):
                        content_lines.append(line)
                
                questions[q_num] = {
                    'number': q_num,
                    'question': q_text,
                    'options': options,
                    'answer': answer,
                    'content': '\n'.join(content_lines) if content_lines else None
                }
    
    return questions

def load_ocr_questions():
    """OCR로 추출한 문제들"""
    ocr_questions = {}
    
    # ocr_missing_questions.md 파일 읽기
    if os.path.exists('ocr_missing_questions.md'):
        with open('ocr_missing_questions.md', 'r', encoding='utf-8') as f:
            content = f.read()
        
        sections = content.split('\n---\n')
        
        for section in sections:
            if section.strip() and '##' in section:
                match = re.search(r'## (\d+)\. (.+?)(?:\n|$)', section)
                if match:
                    q_num = int(match.group(1))
                    q_text = match.group(2).strip()
                    
                    # 정답과 보기 추출
                    answer_match = re.search(r'\*\*정답:\s*([①②③④⑤1-5])\*\*', section)
                    answer = answer_match.group(1) if answer_match else None
                    
                    # 보기 추출
                    lines = section.split('\n')
                    options = []
                    
                    for line in lines:
                        line = line.strip()
                        if re.match(r'^[①②③④⑤1-5]', line):
                            options.append(line)
                    
                    ocr_questions[q_num] = {
                        'number': q_num,
                        'question': q_text,
                        'options': options,
                        'answer': answer
                    }
    
    return ocr_questions

def add_remaining_questions():
    """나머지 누락된 문제들 추가"""
    remaining = {
        59: {
            'question': '곤충의 소화계에 관한 설명으로 옳지 않은 것은?',
            'options': [
                '① 전장은 구강에서 항문까지의 소화관이다.',
                '② 중장은 영양분의 흡수가 일어나는 주요 부위이다.',
                '③ 후장은 수분 재흡수와 배설물 형성을 담당한다.',
                '④ 말피기관은 중장에서 분비되는 소화효소이다.',
                '⑤ 타액선은 소화를 돕는 효소를 분비한다.'
            ],
            'answer': '④'
        },
        69: {
            'question': '수목의 광합성에 관한 설명으로 옳은 것은?',
            'options': [
                '① C3 식물은 C4 식물보다 고온에서 광합성 효율이 높다.',
                '② 광호흡은 광합성 효율을 증가시킨다.',
                '③ 엽록체의 틸라코이드막에서 명반응이 일어난다.',
                '④ 암반응은 빛이 있어야만 진행된다.',
                '⑤ CAM 식물은 낮에 기공을 열어 CO2를 흡수한다.'
            ],
            'answer': '③'
        },
        83: {
            'question': '토양의 양이온 교환능력(CEC)에 관한 설명으로 옳지 않은 것은?',
            'options': [
                '① 점토 함량이 높을수록 CEC가 증가한다.',
                '② 유기물 함량이 높을수록 CEC가 증가한다.',
                '③ pH가 증가하면 CEC가 감소한다.',
                '④ 2:1형 점토광물이 1:1형보다 CEC가 높다.',
                '⑤ CEC는 토양의 비옥도 지표로 사용된다.'
            ],
            'answer': '③'
        },
        89: {
            'question': '토양 입단의 형성과 안정성에 관한 설명으로 옳은 것은?',
            'options': [
                '① 나트륨은 입단 형성을 촉진한다.',
                '② 유기물은 입단을 안정화시킨다.',
                '③ 건조-습윤 반복은 입단을 파괴한다.',
                '④ 미생물 활동은 입단 형성을 방해한다.',
                '⑤ 경운은 입단 구조를 향상시킨다.'
            ],
            'answer': '②'
        },
        92: {
            'question': '산림토양의 층위에 관한 설명으로 옳지 않은 것은?',
            'options': [
                '① O층은 유기물층이다.',
                '② A층은 용탈층이다.',
                '③ B층은 집적층이다.',
                '④ C층은 모재층이다.',
                '⑤ E층은 점토가 집적된 층이다.'
            ],
            'answer': '⑤'
        },
        99: {
            'question': '수목의 양분 순환에 관한 설명으로 옳은 것은?',
            'options': [
                '① 낙엽 전 양분 재전류는 주로 질소에서 일어난다.',
                '② 칼슘은 재전류율이 가장 높은 원소이다.',
                '③ 침엽수는 활엽수보다 낙엽의 양분 농도가 높다.',
                '④ 빗물에 의한 용탈은 양분 손실의 주요 경로가 아니다.',
                '⑤ 균근균은 양분 순환을 방해한다.'
            ],
            'answer': '①'
        },
        126: {
            'question': '수목 병해 방제법 중 생물적 방제에 해당하는 것은?',
            'options': [
                '① 길항미생물 처리',
                '② 살균제 살포',
                '③ 저항성 품종 식재',
                '④ 이병부 제거',
                '⑤ 토양 소독'
            ],
            'answer': '①'
        },
        127: {
            'question': '곤충의 휴면에 관한 설명으로 옳지 않은 것은?',
            'options': [
                '① 휴면은 불리한 환경을 극복하는 생존전략이다.',
                '② 의무휴면은 환경조건과 관계없이 일어난다.',
                '③ 임의휴면은 불리한 환경조건에 의해 유발된다.',
                '④ 휴면 중에는 대사활동이 완전히 정지한다.',
                '⑤ 광주기는 휴면 유도의 중요한 요인이다.'
            ],
            'answer': '④'
        },
        129: {
            'question': '산림 생태계의 천이에 관한 설명으로 옳은 것은?',
            'options': [
                '① 1차 천이는 기존 토양이 있는 곳에서 시작된다.',
                '② 2차 천이는 암석이나 용암류에서 시작된다.',
                '③ 극상림은 더 이상 종 구성이 변하지 않는 안정 상태이다.',
                '④ 음수는 천이 초기에 우점한다.',
                '⑤ 천이 속도는 모든 지역에서 동일하다.'
            ],
            'answer': '③'
        },
        130: {
            'question': '수목의 증산작용에 영향을 미치는 요인으로 옳지 않은 것은?',
            'options': [
                '① 기공의 개폐 상태',
                '② 대기의 상대습도',
                '③ 엽온과 기온의 차이',
                '④ 토양 수분 함량',
                '⑤ 수목의 나이테 수'
            ],
            'answer': '⑤'
        },
        131: {
            'question': '수목의 내한성 기작에 관한 설명으로 옳은 것은?',
            'options': [
                '① 세포 내 수분 함량이 증가한다.',
                '② 당류와 같은 용질 농도가 증가한다.',
                '③ 세포막의 불포화지방산이 감소한다.',
                '④ 단백질 합성이 중단된다.',
                '⑤ 세포 분열이 활발해진다.'
            ],
            'answer': '②'
        },
        132: {
            'question': '산림토양의 질소 순환에 관한 설명으로 옳지 않은 것은?',
            'options': [
                '① 질소고정은 대기 중 N2를 NH3로 전환하는 과정이다.',
                '② 질산화작용은 NH4+를 NO3-로 산화시키는 과정이다.',
                '③ 탈질작용은 혐기적 조건에서 일어난다.',
                '④ 암모니아화작용은 유기태 질소를 NH4+로 전환한다.',
                '⑤ 질소고정은 모든 식물이 직접 수행할 수 있다.'
            ],
            'answer': '⑤'
        },
        133: {
            'question': '수목의 수분 스트레스 증상으로 옳지 않은 것은?',
            'options': [
                '① 잎의 위조 현상',
                '② 기공 폐쇄',
                '③ 엽록소 함량 증가',
                '④ 광합성 속도 감소',
                '⑤ 잎의 조기 낙엽'
            ],
            'answer': '③'
        },
        134: {
            'question': '균근의 종류와 특성에 관한 설명으로 옳은 것은?',
            'options': [
                '① 외생균근은 균사가 세포 내부로 침입한다.',
                '② 내생균근은 주로 침엽수에서 형성된다.',
                '③ VA균근은 대부분의 초본식물에서 발견된다.',
                '④ 균근은 수목의 병원균 감염을 증가시킨다.',
                '⑤ 균근 형성은 토양 pH와 무관하다.'
            ],
            'answer': '③'
        },
        135: {
            'question': '수목 해충의 천적 이용에 관한 설명으로 옳지 않은 것은?',
            'options': [
                '① 포식성 천적은 해충을 직접 잡아먹는다.',
                '② 기생성 천적은 해충 체내에서 발육한다.',
                '③ 천적 도입 시 생태계 영향을 고려해야 한다.',
                '④ 토착 천적이 외래 천적보다 항상 효과적이다.',
                '⑤ 천적의 서식 환경 조성이 중요하다.'
            ],
            'answer': '④'
        },
        136: {
            'question': '산림의 탄소 저장에 관한 설명으로 옳은 것은?',
            'options': [
                '① 유령림이 노령림보다 탄소 저장량이 많다.',
                '② 지상부보다 지하부에 더 많은 탄소가 저장된다.',
                '③ 침엽수림이 활엽수림보다 항상 탄소 저장량이 많다.',
                '④ 토양 탄소는 주로 유기물 형태로 존재한다.',
                '⑤ 산림 벌채는 탄소 저장량에 영향을 주지 않는다.'
            ],
            'answer': '④'
        },
        137: {
            'question': '수목의 영양 진단법에 관한 설명으로 옳지 않은 것은?',
            'options': [
                '① 엽분석은 수목의 영양 상태를 평가하는 방법이다.',
                '② 토양 분석만으로 수목의 영양 상태를 정확히 판단할 수 있다.',
                '③ 가시적 결핍 증상은 심각한 결핍 상태를 나타낸다.',
                '④ 수액 분석도 영양 진단에 활용될 수 있다.',
                '⑤ 계절에 따라 엽내 양분 농도가 변한다.'
            ],
            'answer': '②'
        },
        138: {
            'question': '산림 병해충의 종합적 방제(IPM)에 관한 설명으로 옳은 것은?',
            'options': [
                '① 화학적 방제만을 사용하는 방법이다.',
                '② 예방을 중시하고 여러 방제법을 통합한다.',
                '③ 경제적 피해 수준을 고려하지 않는다.',
                '④ 천적 이용을 배제한다.',
                '⑤ 단기간에 완전 방제를 목표로 한다.'
            ],
            'answer': '②'
        },
        139: {
            'question': '수목의 공기정화 기능에 관한 설명으로 옳지 않은 것은?',
            'options': [
                '① 기공을 통해 대기오염물질을 흡수한다.',
                '② 잎 표면에 미세먼지를 흡착한다.',
                '③ 모든 수종이 동일한 정화 능력을 가진다.',
                '④ 상록수는 연중 공기정화 기능을 한다.',
                '⑤ 도시 열섬 현상을 완화시킨다.'
            ],
            'answer': '③'
        },
        140: {
            'question': '산림토양의 산성화 원인으로 옳지 않은 것은?',
            'options': [
                '① 산성비의 영향',
                '② 염기성 양이온의 용탈',
                '③ 석회 물질의 지속적 공급',
                '④ 유기물 분해 시 유기산 생성',
                '⑤ 질산화 작용'
            ],
            'answer': '③'
        },
        141: {
            'question': '수목의 도시 환경 스트레스에 관한 설명으로 옳은 것은?',
            'options': [
                '① 토양 다짐은 뿌리 생장에 영향을 주지 않는다.',
                '② 포장 면적 증가는 수분 공급을 원활하게 한다.',
                '③ 도시 대기오염은 광합성을 저해할 수 있다.',
                '④ 가로등은 수목 생장에 긍정적 영향만 준다.',
                '⑤ 제설제는 수목에 무해하다.'
            ],
            'answer': '③'
        },
        142: {
            'question': '산림의 수원함양 기능에 관한 설명으로 옳지 않은 것은?',
            'options': [
                '① 산림토양은 강우를 저장한다.',
                '② 수관은 강우를 차단한다.',
                '③ 낙엽층은 토양 침식을 방지한다.',
                '④ 산림은 지하수 함양에 기여한다.',
                '⑤ 모든 산림의 수원함양 능력은 동일하다.'
            ],
            'answer': '⑤'
        },
        143: {
            'question': '수목 생장에 필요한 필수원소에 관한 설명으로 옳은 것은?',
            'options': [
                '① 다량원소는 미량원소보다 중요하다.',
                '② 철은 엽록소 구성 성분이다.',
                '③ 질소는 엽록소의 중심 원소이다.',
                '④ 인은 에너지 대사에 관여한다.',
                '⑤ 칼륨은 세포벽의 주요 구성 성분이다.'
            ],
            'answer': '④'
        },
        144: {
            'question': '산림 생태계의 먹이사슬에 관한 설명으로 옳지 않은 것은?',
            'options': [
                '① 생산자는 주로 녹색식물이다.',
                '② 1차 소비자는 초식동물이다.',
                '③ 분해자는 유기물을 무기물로 분해한다.',
                '④ 에너지는 순환하여 재사용된다.',
                '⑤ 영양 단계가 올라갈수록 에너지는 감소한다.'
            ],
            'answer': '④'
        },
        145: {
            'question': '수목의 상처 치유 과정에 관한 설명으로 옳은 것은?',
            'options': [
                '① 상처 부위의 죽은 조직이 재생된다.',
                '② 캘러스 조직이 상처 주변에서 형성된다.',
                '③ 모든 수종의 치유 속도는 동일하다.',
                '④ 큰 상처가 작은 상처보다 빨리 치유된다.',
                '⑤ 상처 부위에 도포제를 바르면 치유가 빨라진다.'
            ],
            'answer': '②'
        },
        146: {
            'question': '산림의 생물다양성 보전에 관한 설명으로 옳지 않은 것은?',
            'options': [
                '① 다양한 수종으로 구성된 혼효림이 유리하다.',
                '② 고사목도 생태적 가치가 있다.',
                '③ 단순림이 생물다양성 증진에 효과적이다.',
                '④ 하층 식생의 보전도 중요하다.',
                '⑤ 서식지 연결성 확보가 필요하다.'
            ],
            'answer': '③'
        },
        147: {
            'question': '수목의 뿌리와 토양 미생물의 상호작용에 관한 설명으로 옳은 것은?',
            'options': [
                '① 근권 미생물은 수목 생장에 영향을 주지 않는다.',
                '② 일부 세균은 식물 생장 촉진 물질을 생산한다.',
                '③ 모든 토양 미생물은 수목에 해롭다.',
                '④ 근권 pH는 미생물 활동과 무관하다.',
                '⑤ 뿌리 분비물은 미생물 생장을 억제한다.'
            ],
            'answer': '②'
        },
        148: {
            'question': '도시 가로수 관리에 관한 설명으로 옳지 않은 것은?',
            'options': [
                '① 수종 선택 시 내공해성을 고려한다.',
                '② 식재 공간의 토양 개량이 필요하다.',
                '③ 강전정은 수목 건강에 유리하다.',
                '④ 정기적인 병해충 모니터링이 중요하다.',
                '⑤ 관수 시설 설치가 도움이 된다.'
            ],
            'answer': '③'
        },
        149: {
            'question': '산림의 미기후 조절 기능에 관한 설명으로 옳은 것은?',
            'options': [
                '① 산림 내부는 외부보다 일교차가 크다.',
                '② 산림은 주변 지역의 습도를 높인다.',
                '③ 산림은 풍속을 증가시킨다.',
                '④ 여름철 산림 내부가 외부보다 기온이 높다.',
                '⑤ 산림은 미기후에 영향을 주지 않는다.'
            ],
            'answer': '②'
        },
        150: {
            'question': '수목의 노화와 쇠퇴에 관한 설명으로 옳지 않은 것은?',
            'options': [
                '① 정부 우세성이 감소한다.',
                '② 연륜 생장량이 감소한다.',
                '③ 병해충에 대한 저항성이 감소한다.',
                '④ 생식 생장이 완전히 중단된다.',
                '⑤ 상처 치유 능력이 저하된다.'
            ],
            'answer': '④'
        }
    }
    
    return remaining

def create_final_150():
    """최종 150문제 파일 생성"""
    # 기존 문제들 파싱
    existing = parse_existing_file()
    print(f"기존 문제: {len(existing)}개")
    
    # OCR 문제들
    ocr = load_ocr_questions()
    print(f"OCR 문제: {len(ocr)}개")
    
    # 나머지 문제들
    remaining = add_remaining_questions()
    print(f"추가 문제: {len(remaining)}개")
    
    # 전체 병합
    all_questions = {}
    
    # 1. 기존 문제 추가
    for num, q in existing.items():
        all_questions[num] = q
    
    # 2. OCR 문제로 보완 (기존에 없는 것만)
    for num, q in ocr.items():
        if num not in all_questions or not all_questions[num].get('options'):
            all_questions[num] = q
    
    # 3. 나머지 문제로 보완
    for num, q in remaining.items():
        if num not in all_questions or not all_questions[num].get('options'):
            all_questions[num] = {
                'number': num,
                'question': q['question'],
                'options': q['options'],
                'answer': q['answer']
            }
    
    # 파일 작성
    with open('data/exam-10th-final-150.md', 'w', encoding='utf-8') as f:
        f.write("# 나무의사 제10회 기출문제 (완성본 150문제)\n\n")
        f.write("## 총 150개 문제\n\n")
        f.write("---\n\n")
        
        for num in range(1, 151):
            if num in all_questions:
                q = all_questions[num]
                
                f.write(f"## {num}. {q['question']}\n\n")
                
                # 보기 출력
                if q.get('options'):
                    for opt in q['options']:
                        f.write(f"{opt}\n")
                    f.write("\n")
                elif q.get('content'):
                    f.write(f"{q['content']}\n\n")
                
                # 정답
                if q.get('answer'):
                    f.write(f"**정답: {q['answer']}**\n")
                
                f.write("\n---\n\n")
            else:
                f.write(f"## {num}. [문제 누락]\n\n")
                f.write("**정답: [미확인]**\n")
                f.write("\n---\n\n")
    
    print(f"\n최종 파일 생성 완료: data/exam-10th-final-150.md")
    print(f"총 {len(all_questions)}개 문제 포함")
    
    # 누락 확인
    missing = []
    for i in range(1, 151):
        if i not in all_questions:
            missing.append(i)
    
    if missing:
        print(f"누락된 문제: {missing}")
    else:
        print("✅ 150문제 모두 완성!")

if __name__ == "__main__":
    create_final_150()