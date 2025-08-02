# 🌳 나무의사 PDF Q&A MCP 서버 - 설치 가이드

## ⚠️ 중요: 데이터 파일 필요

이 프로젝트를 사용하려면 다음 데이터 파일들이 필요합니다:

### 1. 나무의사 교재 PDF 파일 (필수)
- 약 25개의 나무의사 자격증 관련 교재 PDF
- 저작권 문제로 레포지토리에 포함되지 않음
- 개인적으로 구매하거나 합법적으로 획득한 교재 필요

### 2. 데이터베이스 파일 (선택)
- `tree-doctor-pdf-qa.db` - 사전 처리된 교재 데이터
- 없어도 PDF만 있으면 자동 생성 가능

## 📋 설치 순서

### 1단계: 프로젝트 클론 및 의존성 설치
```bash
git clone https://github.com/VoidLight00/tree-doctor-pdf-qa-mcp.git
cd tree-doctor-pdf-qa-mcp
npm install
```

### 2단계: 빌드
```bash
npm run build
```

### 3단계: 교재 PDF 준비
```bash
# textbooks 디렉토리 생성
mkdir -p textbooks

# 나무의사 교재 PDF 파일들을 textbooks 디렉토리에 복사
# 예: cp ~/Downloads/나무의사책들/*.pdf ./textbooks/
```

### 4단계: 데이터베이스 초기화
```bash
# 새로운 데이터베이스 생성 (처음 설치 시)
node scripts/initialize-database.js

# 교재 PDF 로드 (빌드 전 사용 가능)
node scripts/simple-load-textbooks.js ./textbooks

# 또는 빌드 후 고급 기능 사용
npm run build && node scripts/load-textbooks.js ./textbooks
```

### 5단계: Claude Desktop 설정
```bash
npm run setup-claude
```

### 6단계: Claude Desktop 재시작
Claude Desktop을 완전히 종료했다가 다시 실행하세요.

## 📁 교재 PDF 구조

textbooks 디렉토리에 다음과 같은 구조로 PDF를 배치하세요:

```
textbooks/
├── 수목생리학/
│   ├── 기초수목생리학.pdf
│   └── ...
├── 수목병리학/
│   ├── 식물병리학.pdf
│   └── ...
├── 수목해충학/
│   └── ...
├── 수목관리학/
│   └── ...
└── 나무보호법/
    └── ...
```

## 🔧 문제 해결

### 데이터베이스 경로 문제
MCP 서버가 데이터베이스를 찾지 못하는 경우:

```bash
# dist 디렉토리에 데이터베이스 심볼릭 링크 생성
ln -sf ../tree-doctor-pdf-qa.db dist/tree-doctor-pdf-qa.db

# 또는 빌드 시 자동으로 링크 생성 (package.json에 이미 설정됨)
npm run build
```

### MCP 서버가 연결되지 않을 때
1. 프로세스 확인: `ps aux | grep tree-doctor`
2. 로그 확인: `tail -f mcp.log`
3. 서버 재시작: `npm run restart`

### 교재를 불러올 수 없을 때
1. 데이터베이스 확인: `sqlite3 tree-doctor-pdf-qa.db ".tables"`
2. 교재 개수 확인: `sqlite3 tree-doctor-pdf-qa.db "SELECT COUNT(*) FROM textbooks;"`
3. 교재 재로드: `node scripts/load-textbooks.js ./textbooks`

## 📝 데이터 공유 (선택사항)

이미 처리된 데이터베이스를 공유받은 경우:
1. `tree-doctor-pdf-qa.db` 파일을 프로젝트 루트에 복사
2. 교재 PDF는 여전히 필요 (검색 및 상세 내용 확인용)

## 📞 지원

문제가 있으시면 이슈를 등록해주세요:
https://github.com/VoidLight00/tree-doctor-pdf-qa-mcp/issues