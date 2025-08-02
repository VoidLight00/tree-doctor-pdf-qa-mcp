# 🌳 나무의사 PDF Q&A MCP - 완전 설치 가이드

다른 PC에서도 모든 기출문제와 교재 데이터를 포함하여 설치할 수 있는 가이드입니다.

## 📋 사전 요구사항

- Node.js 18.0 이상
- npm 또는 yarn
- Git
- Claude Desktop (MCP 지원 버전)

## 🚀 빠른 설치 (3단계)

```bash
# 1. 저장소 클론
git clone https://github.com/[your-username]/tree-doctor-pdf-qa-mcp.git
cd tree-doctor-pdf-qa-mcp

# 2. 의존성 설치 및 데이터 설정
npm install
npm run setup

# 3. MCP 서버 시작
npm start
```

## 📚 상세 설치 과정

### 1단계: 프로젝트 다운로드

```bash
# Git으로 클론
git clone https://github.com/[your-username]/tree-doctor-pdf-qa-mcp.git
cd tree-doctor-pdf-qa-mcp

# 또는 ZIP 파일로 다운로드 후 압축 해제
```

### 2단계: 의존성 설치

```bash
npm install
```

### 3단계: 데이터베이스 및 기출문제 설정

```bash
# 모든 데이터를 자동으로 설정
npm run setup
```

이 명령은 다음 작업을 수행합니다:
- 마크다운 파일을 JSON으로 변환
- 데이터베이스 스키마 생성
- 834개의 기출문제 로드
- 교재 메타데이터 설정
- 검색 인덱스 생성

### 4단계: Claude Desktop 설정

1. Claude Desktop의 설정 열기
2. MCP 서버 추가:

```json
{
  "mcpServers": {
    "tree-doctor-pdf-qa": {
      "command": "node",
      "args": ["path/to/tree-doctor-pdf-qa-mcp/dist/index.js"],
      "env": {}
    }
  }
}
```

### 5단계: 서버 실행 및 테스트

```bash
# MCP 서버 시작
npm start

# 별도 터미널에서 상태 확인
sqlite3 tree-doctor-pdf-qa.db "SELECT COUNT(*) FROM exam_questions;"
```

## 📊 포함된 데이터

### 기출문제
- **7회**: 150문제 (100% 완성)
- **8회**: 150문제 (100% 완성)
- **9회**: 150문제 (100% 완성)
- **10회**: 150문제 (100% 완성)
- **11회**: 125문제 (100% 완성)
- **6회**: 109문제 (72.7% 완성)
- **총 834문제** 수록

### 과목 분류
- 수목병리학
- 수목해충학
- 수목생리학
- 수목관리학
- 임업일반
- 토양학

## 🔧 문제 해결

### 데이터가 로드되지 않는 경우

```bash
# 데이터베이스 재생성
rm tree-doctor-pdf-qa.db
npm run setup
```

### MCP 연결 실패

1. Claude Desktop 재시작
2. 경로 확인 (절대 경로 사용 권장)
3. Node.js 버전 확인 (18.0 이상)

### 검색이 작동하지 않는 경우

```bash
# 검색 인덱스 재생성
sqlite3 tree-doctor-pdf-qa.db < sql/exam-schema.sql
npm run setup-data
```

## 💡 사용 예제

Claude Desktop에서 다음과 같이 사용할 수 있습니다:

```
"나무의사 7회 기출문제를 보여줘"
"수목병리학 관련 문제를 검색해줘"
"소나무재선충병 문제만 찾아줘"
"흰가루병 관련 기출문제 모음"
```

## 📁 프로젝트 구조

```
tree-doctor-pdf-qa-mcp/
├── data/                    # 원본 데이터
│   ├── exam-*-final-150.md # 마크다운 형식 기출문제
│   └── structured/         # JSON 변환된 데이터
├── scripts/                # 설정 스크립트
│   ├── setup-complete-data.js
│   └── convert-markdown-to-json.js
├── src/                    # TypeScript 소스
│   ├── index.ts           # MCP 서버 진입점
│   └── exam-manager.ts    # 기출문제 관리
├── sql/                    # 데이터베이스 스키마
└── tree-doctor-pdf-qa.db  # SQLite 데이터베이스
```

## 🔄 업데이트 방법

새로운 기출문제나 교재를 추가하려면:

1. `data/` 폴더에 마크다운 파일 추가
2. `npm run convert-markdown` 실행
3. `npm run setup-data` 실행

## 📞 지원

문제가 발생하면:
1. `data/setup-status.json` 파일 확인
2. GitHub Issues에 문의
3. Discord 커뮤니티 참여

---

**마지막 업데이트**: 2025-08-01
**버전**: 1.0.0