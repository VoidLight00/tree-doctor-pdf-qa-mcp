# 🔧 나무의사 PDF Q&A MCP - 문제 해결 가이드

## 🚨 Claude Desktop에서 MCP 서버가 비활성화되는 문제

### 1. 진단 결과
- ✅ MCP 서버 자체는 정상 작동 (모든 테스트 통과)
- ✅ Claude Desktop 설정 파일 올바름
- ✅ 프로세스가 실행 중 (PID 86497)
- ❓ Claude Desktop에서 비활성화됨

### 2. 가능한 원인들

#### A. Node.js 버전 문제
- 현재 버전: v22.17.0
- Claude Desktop이 특정 Node.js 버전을 요구할 수 있음

#### B. 프로세스 권한 문제
- MCP 서버가 Claude Desktop과 통신할 권한이 없을 수 있음

#### C. 환경 변수 문제
- PATH나 다른 환경 변수가 Claude Desktop에서 다를 수 있음

#### D. 타임아웃 문제
- 서버 초기화 시간이 길어서 타임아웃될 수 있음

### 3. 해결 방법

#### 방법 1: Claude Desktop 완전 재시작
```bash
# 1. Claude Desktop 완전 종료
# macOS: Cmd + Q
# 또는 Activity Monitor에서 Claude 관련 프로세스 모두 종료

# 2. MCP 서버 프로세스 확인 및 종료
ps aux | grep tree-doctor | grep -v grep
# 있으면 kill -9 [PID]

# 3. Claude Desktop 재시작
# 새 대화 시작
```

#### 방법 2: 설정 파일 재생성
```bash
# 1. 백업
cp ~/Library/Application\ Support/Claude/claude_desktop_config.json ~/Library/Application\ Support/Claude/claude_desktop_config.json.backup

# 2. tree-doctor 설정만 다시 추가
# claude_desktop_config.json 편집하여 다음 추가:
```
```json
"tree-doctor-pdf-qa": {
  "command": "node",
  "args": [
    "/Users/voidlight/tree-doctor-pdf-qa-mcp/dist/index.js"
  ],
  "env": {
    "NODE_ENV": "production",
    "NODE_OPTIONS": "--max-old-space-size=4096"
  }
}
```

#### 방법 3: 디버그 모드로 실행
```bash
# 1. 설정 파일에 디버그 옵션 추가
"tree-doctor-pdf-qa": {
  "command": "node",
  "args": [
    "--inspect",
    "/Users/voidlight/tree-doctor-pdf-qa-mcp/dist/index.js"
  ],
  "env": {
    "NODE_ENV": "production",
    "DEBUG": "*"
  }
}
```

#### 방법 4: 단순화된 wrapper 스크립트 사용
```bash
# 1. wrapper 스크립트 생성
cat > /Users/voidlight/tree-doctor-pdf-qa-mcp/start-mcp.sh << 'EOF'
#!/bin/bash
cd /Users/voidlight/tree-doctor-pdf-qa-mcp
exec /usr/local/bin/node dist/index.js
EOF

# 2. 실행 권한 부여
chmod +x /Users/voidlight/tree-doctor-pdf-qa-mcp/start-mcp.sh

# 3. 설정 파일 수정
"tree-doctor-pdf-qa": {
  "command": "/Users/voidlight/tree-doctor-pdf-qa-mcp/start-mcp.sh"
}
```

### 4. 테스트 절차

#### 단계 1: 서버 단독 테스트
```bash
cd /Users/voidlight/tree-doctor-pdf-qa-mcp
node test-mcp-server.js
```

#### 단계 2: 직접 실행 테스트
```bash
echo '{"jsonrpc":"2.0","method":"tools/list","params":{},"id":1}' | node dist/index.js
```

#### 단계 3: Claude Desktop 로그 확인
- Claude Desktop 개발자 도구 열기
- Console 탭에서 MCP 관련 에러 확인

### 5. 추가 진단 도구

#### MCP 서버 상태 확인 스크립트
```bash
#!/bin/bash
echo "=== MCP Server Status Check ==="

# 1. 프로세스 확인
echo -e "\n1. Process Status:"
ps aux | grep tree-doctor | grep -v grep || echo "Not running"

# 2. 포트 확인 (stdio 사용하므로 해당 없음)
echo -e "\n2. Node.js Version:"
node --version

# 3. 설정 파일 확인
echo -e "\n3. Claude Config:"
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json | jq '.mcpServers["tree-doctor-pdf-qa"]'

# 4. 파일 권한 확인
echo -e "\n4. File Permissions:"
ls -la /Users/voidlight/tree-doctor-pdf-qa-mcp/dist/index.js

# 5. 데이터베이스 확인
echo -e "\n5. Database Status:"
ls -lh /Users/voidlight/tree-doctor-pdf-qa-mcp/tree-doctor-pdf-qa.db
```

### 6. 알려진 문제 및 해결책

#### 문제: "MCP server disconnected"
- 원인: 서버 초기화 중 타임아웃
- 해결: 데이터베이스 사전 로드 또는 초기화 시간 단축

#### 문제: "Tool not found"
- 원인: JSON Schema 형식 문제
- 해결: 이미 수정됨 (zod-to-json-schema 사용)

#### 문제: "Permission denied"
- 원인: 파일 실행 권한 없음
- 해결: chmod +x 적용

### 7. 최종 체크리스트

- [ ] Claude Desktop 완전 종료 및 재시작
- [ ] MCP 서버 프로세스 확인
- [ ] 설정 파일 정확성 확인
- [ ] Node.js 버전 확인 (v18+ 권장)
- [ ] 파일 권한 확인
- [ ] 데이터베이스 파일 존재 확인
- [ ] 새 대화에서 테스트

### 8. 지원 및 문의

문제가 지속되면 다음 정보와 함께 보고해주세요:
- Claude Desktop 버전
- macOS 버전
- Node.js 버전
- 에러 메시지 (있는 경우)
- Claude Desktop 개발자 콘솔 로그