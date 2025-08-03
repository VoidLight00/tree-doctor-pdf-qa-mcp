# 🌳 나무의사 PDF Q&A MCP 설치 가이드

## 📋 다른 PC에서 설치하기

### 방법 1: Claude Code에서 설치 (추천) 🤖

Claude Code에 다음 명령어를 복사해서 붙여넣기:

```
다음 명령어를 실행해줘:
git clone https://github.com/VoidLight00/tree-doctor-pdf-qa-mcp.git && cd tree-doctor-pdf-qa-mcp && npm run install-all
```

또는 단계별로:

```
1. git clone https://github.com/VoidLight00/tree-doctor-pdf-qa-mcp.git
2. cd tree-doctor-pdf-qa-mcp
3. npm run install-all
```

### 방법 2: 터미널에서 직접 설치 💻

```bash
git clone https://github.com/VoidLight00/tree-doctor-pdf-qa-mcp.git
cd tree-doctor-pdf-qa-mcp
npm run install-all
```

## 📱 Claude Desktop 설정

설치 완료 후 Claude Desktop 설정 파일에 추가:

### Windows
`%APPDATA%\Claude\claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "tree-doctor-pdf-qa": {
      "command": "node",
      "args": ["C:\\경로\\tree-doctor-pdf-qa-mcp\\dist\\index.js"],
      "env": {}
    }
  }
}
```

### Mac/Linux
`~/.claude/claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "tree-doctor-pdf-qa": {
      "command": "node",
      "args": ["/경로/tree-doctor-pdf-qa-mcp/dist/index.js"],
      "env": {}
    }
  }
}
```

## ✅ 설치 확인

설치가 완료되면:
- ✅ 기출문제 1,051개
- ✅ 교재 18권
- ✅ 전체 검색 가능

## 🚀 사용 예시

Claude에서:
- "수목생리학 광합성 설명해줘"
- "2025년 기출문제 보여줘"
- "토양학 pH 관련 내용 찾아줘"

---

## 🆘 문제 해결

### 데이터베이스가 다운로드되지 않는 경우

1. 수동 다운로드:
   - [GitHub Release](https://github.com/VoidLight00/tree-doctor-pdf-qa-mcp/releases) 에서 `tree-doctor-pdf-qa-db.tar.gz` 다운로드
   - 프로젝트 폴더에서 압축 해제:
   ```bash
   tar -xzf tree-doctor-pdf-qa-db.tar.gz
   ```

2. 다시 빌드:
   ```bash
   npm run build
   ```

### 설치 명령어 (복사용)

```
git clone https://github.com/VoidLight00/tree-doctor-pdf-qa-mcp.git && cd tree-doctor-pdf-qa-mcp && npm run install-all
```