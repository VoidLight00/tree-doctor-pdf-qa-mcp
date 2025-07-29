# 나무의사 학습 도우미

나무의사 자격증 취득을 위한 학습 도우미 웹 애플리케이션입니다.

## 주요 기능

1. **병해충 진단 검색**
   - 증상 기반 검색
   - 수종별, 증상별 필터링
   - 사진 업로드를 통한 진단

2. **방제 시기 캘린더**
   - 월별 방제 일정 확인
   - 주요 병해충 방제 시기 알림

3. **약제 정보 검색**
   - 약제명, 성분명 검색
   - 사용법 및 주의사항 확인
   - 카테고리별 분류

4. **나무의사 시험 정보**
   - 시험 일정 및 과목 안내
   - 학습 자료 제공

## 설치 및 실행

### 1. 의존성 설치
```bash
cd /Users/voidlight/tree-doctor-pdf-qa-mcp/web-app
npm install
```

### 2. 서버 실행
```bash
npm start
```

### 3. 웹 브라우저에서 접속
```
http://localhost:3000
```

## 기술 스택

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Node.js, Express
- **Database**: SQLite (기존 tree-doctor-pdf-qa.db 활용)
- **오프라인 지원**: Service Worker

## 개발 모드

```bash
npm run dev
```

nodemon을 사용하여 파일 변경 시 자동으로 서버를 재시작합니다.

## 모바일 대응

- 반응형 디자인으로 모바일, 태블릿, 데스크톱 모두 지원
- 터치 인터페이스 최적화
- 오프라인 모드 지원

## API 엔드포인트

- `GET /api/search` - 병해충 검색
- `GET /api/medicine` - 약제 정보 검색
- `GET /api/detail/:id` - 상세 정보 조회
- `GET /api/schedules` - 방제 일정 조회
- `POST /api/memory/search` - Memory MCP 검색

## 향후 개선 사항

1. 실제 이미지 분석 AI 모델 연동
2. 사용자 학습 진도 추적
3. 커뮤니티 기능 추가
4. 푸시 알림 기능
5. 더 많은 교육 자료 통합