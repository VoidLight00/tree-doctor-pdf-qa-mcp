# 🌳 나무의사 PDF Q&A MCP - 간단 설치 가이드

## 📥 방법 1: ZIP 파일 다운로드 (가장 간단!)

### 1. ZIP 파일 다운로드
- 파일명: `tree-doctor-pdf-qa-mcp-full.zip` (248MB)
- [다운로드 링크 필요]

### 2. 압축 해제
원하는 위치에 압축 해제

### 3. 의존성 설치 및 빌드
```bash
cd tree-doctor-pdf-qa-mcp
npm install
npm run build
```

### 4. Claude Desktop 설정
`claude_desktop_config.json` 파일에 추가:

**Windows** (`%APPDATA%\Claude\claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "tree-doctor-pdf-qa": {
      "command": "node",
      "args": ["C:\\압축해제경로\\tree-doctor-pdf-qa-mcp\\dist\\index.js"],
      "env": {}
    }
  }
}
```

**Mac** (`~/.claude/claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "tree-doctor-pdf-qa": {
      "command": "node",
      "args": ["/압축해제경로/tree-doctor-pdf-qa-mcp/dist/index.js"],
      "env": {}
    }
  }
}
```

### 5. Claude Desktop 재시작

## ✅ 설치 확인
- 기출문제: 1,051개
- 교재: 18권
- 모든 내용 검색 가능

## 🎯 Claude Code용 복사 명령어

```
다음 ZIP 파일을 다운로드하고 압축을 풀어줘: tree-doctor-pdf-qa-mcp-full.zip
그다음 해당 폴더로 이동해서 npm install && npm run build 실행해줘
```

## 💡 장점
- Git 설치 불필요
- 인터넷 속도 상관없이 빠른 설치
- 모든 데이터 포함 (DB 파일 포함)
- 한 번에 완료