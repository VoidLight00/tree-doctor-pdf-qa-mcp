# 🎯 나무의사 기출문제 1,050문제 완벽 추출 마스터 플랜

## 📋 현황 분석
- **목표**: 1,050문제 (7회 × 150문제) 완벽 추출
- **자원**: Downloads 폴더에 7개 PDF 파일 모두 보유
- **과제**: 기존 OCR 실패 (77% 저품질)

## 🏗️ 다층 병렬 처리 아키텍처

### 1️⃣ **Master Orchestrator** (총괄 지휘)
- 전체 작업 조율 및 모니터링
- 품질 검증 및 최종 통합
- 실시간 진행률 대시보드

### 2️⃣ **PDF Processing Agents** (7개 - 회차별 전담)
각 에이전트가 하나의 PDF를 전담하여 병렬 처리:
- Agent-5회: 제5회 기출문제 해설집
- Agent-6회: 제6회 기출문제 해설집
- Agent-7회: 제7회 기출문제 해설집
- Agent-8회: 제8회 기출문제 해설집
- Agent-9회: 제9회 기출문제 해설집
- Agent-10회: 제10회 기출문제 해설집
- Agent-11회: 제11회 시험지

### 3️⃣ **OCR Engine Agents** (4개 - 엔진별 전담)
각 PDF를 4개 엔진으로 중복 처리:
1. **Marker Agent**: 한국어 특화 설정
2. **Markitdown Agent**: MCP 활용 변환
3. **Tesseract Agent**: 고해상도 이미지 OCR
4. **PyMuPDF Agent**: 텍스트 레이어 추출

### 4️⃣ **Support Agents** (지원 역할)
- **Image Enhancer**: PDF → 고품질 이미지 변환
- **Text Merger**: 다중 OCR 결과 통합
- **Structure Parser**: 문제/선택지/정답 분리
- **Validator**: 데이터 무결성 검증

## 🔄 처리 파이프라인

### Phase 1: 전처리 (Pre-processing)
```
1. PDF 페이지 분할
2. 300 DPI 이미지 변환
3. 대비 향상 + 노이즈 제거
4. 텍스트 영역 검출
```

### Phase 2: 다중 OCR 실행
```
각 페이지별로 병렬 실행:
- Marker: marker_single --langs Korean --batch_multiplier 4
- Markitdown: MCP 서버 호출
- Tesseract: 한국어 + 영어 모드
- PyMuPDF: 내장 텍스트 추출
```

### Phase 3: 결과 통합 (Ensemble)
```
1. 문자 단위 투표 시스템
2. 신뢰도 점수 계산
3. 최적 텍스트 선택
4. 교차 검증
```

### Phase 4: 구조화 파싱
```
1. 문제 번호 인식 (1~150)
2. 문제 본문 추출
3. 선택지 분리 (①②③④⑤)
4. 정답 및 해설 매칭
5. 과목별 자동 분류
```

### Phase 5: 품질 보증
```
1. 150문제 완성도 체크
2. 누락 문제 재처리
3. 선택지 5개 검증
4. 최종 JSON 검증
```

## 💻 기술 스택

### MCP 서버 활용
- voidlight_markitdown: PDF → Markdown 변환
- memory MCP: 중간 결과 저장
- github MCP: 버전 관리

### Python 라이브러리
- asyncio: 비동기 병렬 처리
- multiprocessing: CPU 코어 최대 활용
- cv2/PIL: 이미지 전처리
- regex: 고급 패턴 매칭

## 📊 예상 성과

### 품질 목표
- **고품질** (완전한 문제): 80% 이상 (840문제)
- **중간품질** (부분 수정): 15% (157문제)
- **저품질** (재작업): 5% 미만 (53문제)

### 처리 시간
- 페이지당: 30초 (4개 엔진 병렬)
- PDF당: 약 20분
- 전체: 2-3시간 (7개 PDF 병렬)

## 🚀 실행 명령

```bash
# 1. 환경 준비
cd /Users/voidlight/tree-doctor-pdf-qa-mcp
source ~/marker-env/bin/activate

# 2. 마스터 스크립트 실행
python3 scripts/master_extraction_system.py \
  --input-dir ~/Downloads \
  --output-dir data/final_extraction \
  --engines all \
  --parallel 7 \
  --quality-threshold 0.85

# 3. 결과 검증
python3 scripts/validate_extraction.py
```

## 📈 모니터링

실시간 진행 상황:
- 웹 대시보드: http://localhost:8080
- 로그 파일: logs/extraction_YYYYMMDD.log
- 진행률: data/progress.json

## 🎯 성공 지표

1. **정량적 지표**
   - 1,050문제 중 1,000문제 이상 추출
   - 고품질 비율 80% 이상
   - 처리 시간 3시간 이내

2. **정성적 지표**
   - 한글 텍스트 정확도 95% 이상
   - 수식/특수문자 인식률 90% 이상
   - 문제 구조 완전성 100%

## 🔧 문제 해결 전략

### OCR 실패 시
1. 해당 페이지만 재처리
2. 수동 검증 큐에 추가
3. 대체 엔진으로 재시도

### 구조 파싱 실패 시
1. 정규표현식 패턴 조정
2. GPT-4 활용 보정
3. 수동 태깅 지원

## 📅 타임라인

- **T+0분**: 시스템 초기화 및 환경 설정
- **T+10분**: 7개 PDF 병렬 처리 시작
- **T+30분**: 첫 번째 결과 확인
- **T+120분**: 전체 OCR 완료
- **T+150분**: 구조화 및 검증 완료
- **T+180분**: 최종 결과 제출

---

이 계획대로 진행하면 **3시간 내에 1,050문제 중 95% 이상을 고품질로 추출**할 수 있습니다.