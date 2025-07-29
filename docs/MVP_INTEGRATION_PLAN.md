# Tree Doctor PDF Q&A MCP MVP 통합 계획

## 현재 상황 분석

### 데이터 현황
- **OCR 처리 결과**: 품질이 매우 낮아 자동 구조화 실패 (인식률 20% 미만)
- **구조화된 데이터**: 
  - 완성된 문제: 1개 (5회차 1번 문제 샘플)
  - 템플릿만 존재: 1,049개
  - 총 7개 회차 (5회~11회) × 150문제 = 1,050문제

### 기존 시스템 구조
- **데이터베이스**: SQLite3 기반, 완전한 스키마 구현됨
- **MCP 서버**: 기본 구조 구현됨
- **매니저 클래스들**: ExamManager, PDFManager, QASystem 등 구현됨

## MVP 구축 전략

### 1단계: 최소 기능 데이터베이스 (즉시 구현 가능)

#### 1.1 샘플 데이터 활용
```typescript
// 현재 사용 가능한 고품질 데이터
- 5회차 1번 문제 (수목병리학)
- 각 과목별 템플릿 구조
- 과목별 문제 배치 정보 (1-30: 수목병리학, 31-60: 수목해충학 등)
```

#### 1.2 데이터 품질 플래그 시스템
```typescript
interface QualityFlags {
  dataQuality: 'high' | 'medium' | 'low' | 'template';
  completeness: 'complete' | 'partial' | 'minimal';
  verificationStatus: 'verified' | 'unverified' | 'auto-generated';
}
```

### 2단계: MVP 핵심 기능

#### 2.1 즉시 제공 가능한 기능
1. **과목별 문제 구조 안내**
   - 각 회차별 과목 배치 정보 제공
   - 문제 번호와 과목 매핑

2. **템플릿 기반 학습 가이드**
   - 문제 유형별 학습 전략
   - 과목별 출제 비중 분석

3. **키워드 기반 검색 (제한적)**
   - 과목명으로 검색
   - 문제 번호로 검색

#### 2.2 점진적 확장 기능
1. **수동 데이터 입력 인터페이스**
   - 웹 기반 입력 폼
   - 실시간 유효성 검증
   - 진행 상황 추적

2. **크라우드소싱 시스템**
   - 사용자 기여 문제 입력
   - 품질 투표 시스템
   - 보상 포인트 시스템

### 3단계: 구현 우선순위

#### 높음 (1주 내)
1. MVP 통합 모듈 구현 (`mvp-integration.ts`)
2. 샘플 데이터 임포트
3. 기본 검색 기능
4. 통계 정보 제공

#### 중간 (2-3주)
1. 웹 입력 인터페이스
2. 데이터 검증 시스템
3. 부분 데이터 활용 로직

#### 낮음 (1개월 이후)
1. AI 기반 OCR 재처리
2. 자동 문제 분류기
3. 유사 문제 추천 시스템

## 기술적 구현 세부사항

### MVP Integration Module 구조
```typescript
export class MVPIntegration {
  // 데이터 품질 관리
  async importWithQualityFlags(data: any, quality: QualityFlags): Promise<void>;
  
  // 템플릿 데이터 활용
  async getTemplateStructure(examRound: number): Promise<ExamStructure>;
  
  // 부분 데이터 검색
  async searchPartialData(query: string, includeTemplates: boolean): Promise<SearchResult[]>;
  
  // 통계 및 분석
  async getAvailableDataStats(): Promise<DataStatistics>;
  
  // 데이터 개선 추적
  async trackDataImprovement(questionId: number, improvement: DataImprovement): Promise<void>;
}
```

### 데이터베이스 확장
```sql
-- 품질 플래그 추가
ALTER TABLE exam_questions ADD COLUMN data_quality TEXT DEFAULT 'template';
ALTER TABLE exam_questions ADD COLUMN completeness TEXT DEFAULT 'minimal';
ALTER TABLE exam_questions ADD COLUMN verification_status TEXT DEFAULT 'unverified';

-- 데이터 개선 이력
CREATE TABLE data_improvements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id INTEGER NOT NULL,
    improvement_type TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    contributor_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES exam_questions(id)
);
```

## 실행 계획

### 즉시 실행 (오늘)
1. ✅ MVP 통합 계획 문서 작성
2. 🔄 mvp-integration.ts 구현
3. 🔄 샘플 데이터 임포트 스크립트
4. 🔄 기본 MCP 도구 업데이트

### 단기 목표 (1주)
1. 웹 입력 인터페이스 프로토타입
2. 데이터 품질 대시보드
3. 사용자 피드백 수집 시스템

### 중기 목표 (1개월)
1. 100개 이상 고품질 문제 확보
2. 자동화된 품질 검증
3. 학습 추천 시스템 베타

## 성공 지표

### MVP 성공 기준
- [ ] 최소 1개 이상의 완전한 문제 제공
- [ ] 과목별 문제 구조 정보 100% 제공
- [ ] 기본 검색 기능 작동
- [ ] 데이터 입력 인터페이스 준비

### 품질 지표
- 고품질 문제 수: 목표 15개 → 현재 1개
- 부분 데이터 활용률: 목표 50% → 현재 0%
- 사용자 만족도: 목표 70% → 측정 예정

## 리스크 및 대응 방안

### 주요 리스크
1. **데이터 품질**: OCR 실패로 인한 수동 입력 의존
   - 대응: 크라우드소싱 및 인센티브 시스템

2. **확장성**: 수동 입력 속도 제한
   - 대응: 부분 데이터도 활용하는 유연한 시스템

3. **정확성**: 수동 입력 오류 가능성
   - 대응: 교차 검증 및 커뮤니티 리뷰

## 결론

현재 데이터 상황은 어렵지만, MVP 접근법을 통해 즉시 가치를 제공할 수 있습니다. 템플릿 구조와 메타데이터를 활용하여 기본적인 학습 지원을 시작하고, 점진적으로 데이터 품질을 개선해나가는 전략이 현실적입니다.

**다음 단계**: `mvp-integration.ts` 구현 시작