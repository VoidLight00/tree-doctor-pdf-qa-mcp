# 데이터베이스 다운로드 안내

Tree Doctor PDF Q&A MCP의 데이터베이스는 크기(120MB) 때문에 Git에 포함되지 않습니다.

## 다운로드 방법

### 옵션 1: Google Drive (권장)
데이터베이스 파일을 다음 링크에서 다운로드하세요:
- [추후 업로드 예정]

### 옵션 2: 직접 생성
1. 기출문제와 교재 PDF 파일 준비
2. 아래 스크립트 실행:
```bash
# 데이터베이스 초기화
npm run init-db

# 기출문제 처리 (PDF 필요)
node scripts/process-exams.js

# 교재 처리 (PDF 필요)
node scripts/textbook-extraction-improved.js
node scripts/import-textbook-contents.js
node scripts/manual-category-update.js
```

## 포함된 데이터

- 📝 **기출문제**: 1,051개 (2019-2025년)
- 📚 **교재**: 18권
  - 수목병리학: 4권
  - 기출문제집: 3권
  - 2차시험: 2권
  - 수목생리학: 2권
  - 산림보호학: 1권
  - 수목의학: 1권
  - 수목진단: 1권
  - 수목해충학: 1권
  - 식물형태학: 1권
  - 일반식물학: 1권
  - 토양학: 1권

## 데이터베이스 위치

다운로드한 `tree-doctor-pdf-qa.db` 파일을 프로젝트 루트 디렉토리에 저장하세요:
```
tree-doctor-pdf-qa-mcp/
├── tree-doctor-pdf-qa.db  ← 여기에 저장
├── package.json
├── src/
└── ...
```

## 윈도우 사용자 주의사항

윈도우에서도 정상 작동합니다. 경로 구분자가 자동으로 변환됩니다.