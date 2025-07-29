#!/usr/bin/env python3
"""
모든 소스를 결합하여 제10회 기출문제 150개 완전 추출
"""

import re
import json
import glob
from collections import defaultdict

def clean_text(text):
    """텍스트 정리"""
    # OCR 오류 보정
    replacements = {
        '0)': '①', '2)': '②', '3)': '③', '4)': '④', '5)': '⑤',
        '(01)': '①', '(2)': '②', '(3)': '③', '(4)': '④', '(5)': '⑤',
        '(017': '①', '(9)': '⑤',
        '을은': '옳은', '옮은': '옳은', '옮지': '옳지',
        '않 는': '않는', '않 은': '않은'
    }
    
    for old, new in replacements.items():
        text = text.replace(old, new)
    
    # 공백 정리
    text = re.sub(r'\s+', ' ', text)
    
    return text

def extract_from_all_sources():
    """모든 가능한 소스에서 문제 추출"""
    
    questions = {}
    
    # 1. OCR 텍스트 파일 읽기
    ocr_files = [
        'exam-10th-ocr.txt',
        'exam-10th-ocr.md',
        'exam-10th-raw.txt',
        'exam-10th-ocr-full.txt'
    ]
    
    all_text = ""
    
    for file in ocr_files:
        try:
            with open(file, 'r', encoding='utf-8') as f:
                content = f.read()
                all_text += f"\n\n--- {file} ---\n\n" + content
                print(f"{file} 읽기 성공: {len(content)} 문자")
        except Exception as e:
            print(f"{file} 읽기 실패: {e}")
    
    # 2. 기존 JSON 파일들에서 문제 읽기
    json_files = glob.glob('exam-10th*.json')
    
    for json_file in json_files:
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
                if isinstance(data, dict):
                    for key, value in data.items():
                        if isinstance(value, dict) and 'question' in value:
                            q_num = int(key) if key.isdigit() else value.get('number')
                            if q_num and 1 <= q_num <= 150:
                                questions[q_num] = value
                                
            print(f"{json_file}에서 {len(questions)}개 문제 로드")
        except Exception as e:
            print(f"{json_file} 로드 실패: {e}")
    
    # 3. 전체 텍스트에서 추가 문제 찾기
    cleaned_text = clean_text(all_text)
    
    # 문제 패턴들
    patterns = [
        # 기본 패턴
        r'(\d{1,3})\s*\.\s*([^①②③④⑤]+?)(?=①)',
        # 느슨한 패턴
        r'(?:^|\n)\s*(\d{1,3})\s*\.\s*(.{10,300}?)(?=\s*①)',
        # 매우 느슨한 패턴
        r'(\d{1,3})[.．]\s*([^\n]{10,}?)(?=\n[^\n]*[①②③④])'
    ]
    
    for pattern in patterns:
        matches = list(re.finditer(pattern, cleaned_text, re.MULTILINE | re.DOTALL))
        print(f"패턴에서 {len(matches)}개 매치 발견")
        
        for match in matches:
            try:
                q_num = int(match.group(1))
                if 1 <= q_num <= 150 and q_num not in questions:
                    q_text = match.group(2).strip()
                    q_text = re.sub(r'\s+', ' ', q_text)
                    
                    if len(q_text) >= 10:
                        # 선택지 찾기
                        start_pos = match.end()
                        end_pos = min(start_pos + 1500, len(cleaned_text))
                        choices_text = cleaned_text[start_pos:end_pos]
                        
                        choices = extract_choices(choices_text)
                        
                        if len(choices) >= 2:
                            questions[q_num] = {
                                'number': q_num,
                                'question': q_text,
                                'choices': choices,
                                'answer': None
                            }
                            
            except Exception:
                continue
    
    # 4. 누락된 문제를 수동으로 추가 (알려진 문제들)
    manual_questions = {
        3: "수목병에 사용되는 침투이행성 살균제로 옳지 않은 것은?",
        8: "콕스의 가설(Koch's postulates)에 관한 설명으로 옳지 않은 것은?",
        9: "수목병에 중요한 환경요인에 관한 설명으로 옳지 않은 것은?",
        18: "제시된 특징을 모두 갖는 병원균에 의한 수목병은?",
        19: "Ceratocystis 속 곰팡이에 관한 설명으로 옳지 않은 것은?",
        26: "수목 줄기에 궤양(canker)을 일으키는 수목병으로만 나열한 것은?",
        31: "곤충의 탈피에 관한 설명으로 옳지 않은 것은?",
        32: "곤충의 주화성에 관한 설명으로 옳지 않은 것은?",
        34: "곤충의 호르몬과 페로몬에 관한 설명으로 옳지 않은 것은?",
        35: "곤충의 생식에 관한 설명으로 옳지 않은 것은?",
        36: "곤충과 미생물의 관계에 관한 설명으로 옳지 않은 것은?",
        38: "진사회성 곤충에 관한 설명으로 옳지 않은 것은?",
        39: "생물적 방제의 천적곤충에 관한 설명으로 옳지 않은 것은?",
        43: "소나무를 가해하는 나무좀과(Scolytidae) 해충에 관한 설명으로 옳지 않은 것은?",
        44: "해충별 과명, 가해 부위 및 연 발생 횟수의 연결로 옳지 않은 것은?",
        49: "해충과 천적의 연결이 옳지 않은 것은?"
    }
    
    for q_num, q_text in manual_questions.items():
        if q_num not in questions:
            questions[q_num] = {
                'number': q_num,
                'question': q_text,
                'choices': {},
                'answer': None
            }
    
    # 5. 정답 찾기
    find_answers(cleaned_text, questions)
    
    return questions

def extract_choices(text):
    """선택지 추출"""
    choices = {}
    
    patterns = [
        (r'①\s*([^②③④⑤]+)', '1'),
        (r'②\s*([^①③④⑤]+)', '2'),
        (r'③\s*([^①②④⑤]+)', '3'),
        (r'④\s*([^①②③⑤]+)', '4'),
        (r'⑤\s*([^①②③④]+)', '5')
    ]
    
    for pattern, num in patterns:
        match = re.search(pattern, text)
        if match:
            choice_text = match.group(1).strip()
            choice_text = re.sub(r'\s+', ' ', choice_text)
            choice_text = re.split(r'\d{1,3}\s*\.|\s*정답\s*[:：]', choice_text)[0]
            
            if len(choice_text) > 2 and len(choice_text) < 200:
                choices[num] = choice_text
    
    return choices

def find_answers(text, questions):
    """정답 찾기"""
    answer_patterns = [
        r'(\d{1,3})\s*[.)]\s*([①②③④⑤])',
        r'(\d{1,3})\s*번?\s*[:：]\s*([①②③④⑤])',
        r'정답\s*[:：]?\s*(\d{1,3})\s*-\s*([①②③④⑤])'
    ]
    
    for pattern in answer_patterns:
        matches = re.finditer(pattern, text)
        for match in matches:
            try:
                q_num = int(match.group(1))
                if q_num in questions:
                    answer_char = match.group(2)
                    if answer_char in '①②③④⑤':
                        answer_num = str('①②③④⑤'.index(answer_char) + 1)
                        questions[q_num]['answer'] = answer_num
            except:
                continue

def save_final_results(questions):
    """최종 결과 저장"""
    # JSON 저장
    with open('exam-10th-final.json', 'w', encoding='utf-8') as f:
        json.dump(questions, f, ensure_ascii=False, indent=2)
    
    # Markdown 저장
    with open('exam-10th-perfect.md', 'w', encoding='utf-8') as f:
        f.write("# 나무의사 제10회 기출문제 (최종 완성본)\n\n")
        f.write(f"## 총 {len(questions)}개 문제 추출\n\n")
        
        # 누락된 문제
        missing = []
        for i in range(1, 151):
            if i not in questions:
                missing.append(i)
        
        if missing:
            f.write(f"### 누락된 문제 ({len(missing)}개)\n")
            f.write(f"{missing}\n\n")
        else:
            f.write("### ✅ 모든 150문제가 성공적으로 추출되었습니다!\n\n")
        
        f.write("---\n\n")
        
        # 문제 출력
        for i in range(1, 151):
            if i in questions:
                q = questions[i]
                f.write(f"## {i}. {q['question']}\n\n")
                
                if q.get('choices'):
                    for num in ['1', '2', '3', '4', '5']:
                        if num in q['choices']:
                            f.write(f"{'①②③④⑤'[int(num)-1]} {q['choices'][num]}\n")
                    f.write("\n")
                else:
                    f.write("*[선택지 누락]*\n\n")
                
                if q.get('answer'):
                    f.write(f"**정답: {'①②③④⑤'[int(q['answer'])-1]}**\n")
                
                f.write("\n---\n\n")
            else:
                f.write(f"## {i}. [누락된 문제]\n\n---\n\n")
    
    # 추출 보고서
    with open('extraction_report.md', 'w', encoding='utf-8') as f:
        f.write("# 제10회 나무의사 기출문제 추출 보고서\n\n")
        f.write(f"## 추출 결과\n\n")
        f.write(f"- 총 추출된 문제: {len(questions)}개 / 150개\n")
        f.write(f"- 추출률: {len(questions)/150*100:.1f}%\n")
        f.write(f"- 정답이 있는 문제: {sum(1 for q in questions.values() if q.get('answer'))}개\n")
        f.write(f"- 선택지가 완전한 문제: {sum(1 for q in questions.values() if len(q.get('choices', {})) >= 4)}개\n\n")
        
        if missing:
            f.write(f"## 누락된 문제 ({len(missing)}개)\n\n")
            f.write("다음 문제들은 OCR 품질 문제로 추출되지 못했습니다:\n\n")
            for i in range(0, len(missing), 10):
                f.write(f"{missing[i:i+10]}\n")
        
        f.write("\n## 권장사항\n\n")
        f.write("1. 고품질 OCR 도구 사용 (Marker, Nougat 등)\n")
        f.write("2. PDF 원본 품질 개선\n")
        f.write("3. 수동 검수 및 보완\n")
    
    return missing

def main():
    questions = extract_from_all_sources()
    missing = save_final_results(questions)
    
    print(f"\n===== 추출 완료 =====")
    print(f"총 {len(questions)}개 문제 추출 ({len(questions)/150*100:.1f}%)")
    print(f"누락된 문제: {len(missing)}개")
    
    print("\n생성된 파일:")
    print("- exam-10th-final.json: 최종 JSON 데이터")
    print("- exam-10th-perfect.md: 최종 Markdown 파일")
    print("- extraction_report.md: 추출 보고서")

if __name__ == "__main__":
    main()