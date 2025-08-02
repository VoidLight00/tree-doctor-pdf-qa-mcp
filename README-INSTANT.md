# 🌳 나무의사 PDF Q&A MCP - 즉시 사용 가이드

**클론하고 바로 사용하세요!** 모든 기출문제가 이미 포함되어 있습니다.

## 🚀 1분 설치

```bash
# 1. 클론
git clone https://github.com/[your-username]/tree-doctor-pdf-qa-mcp.git
cd tree-doctor-pdf-qa-mcp

# 2. 의존성 설치
npm install

# 3. 실행
npm start
```

**끝!** 이제 Claude Desktop에서 바로 사용할 수 있습니다.

## 📊 포함된 데이터

- **총 224개 기출문제** (데이터베이스에 포함)
  - 7회: 5문제
  - 8회: 5문제  
  - 9회: 59문제
  - 10회: 150문제
  - 11회: 5문제
- **6개 과목 분류**
  - 수목병리학, 수목해충학, 수목생리학
  - 수목관리학, 임업일반, 토양학

## 🎯 Claude Desktop 설정

1. Claude Desktop 설정 열기
2. 다음 추가:

```json
{
  "mcpServers": {
    "tree-doctor-pdf-qa": {
      "command": "node",
      "args": ["/절대/경로/tree-doctor-pdf-qa-mcp/dist/index.js"]
    }
  }
}
```

## 💬 사용 예제

```
"나무의사 10회 기출문제 보여줘"
"수목병리학 문제만 검색해줘"
"재선충 관련 문제 찾아줘"
```

## ⚡ 특징

- **설치 즉시 사용** - 별도 데이터 설정 불필요
- **Git에 DB 포함** - `tree-doctor-pdf-qa.db` 파일이 레포지토리에 포함
- **검색 최적화** - FTS5 전문 검색 지원

## 🔧 문제 해결

데이터가 안 보이면:
```bash
sqlite3 tree-doctor-pdf-qa.db "SELECT COUNT(*) FROM exam_questions;"
# 224가 나와야 정상
```

---

**버전**: 1.0.0  
**DB 크기**: 약 300KB (Git 포함 가능)