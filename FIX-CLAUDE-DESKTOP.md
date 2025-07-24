# 🔧 Claude Desktop MCP 서버 비활성화 문제 해결 가이드

## 📋 현재 상태

### ✅ 정상 작동 중
- MCP 서버 코드 정상 (모든 테스트 통과)
- Claude Desktop 설정 파일 올바름
- 데이터베이스 정상 (158MB, 27개 교재)
- 14개 도구 모두 정상 작동

### ❌ 문제
- Claude Desktop에서 MCP 서버가 비활성화됨

## 🎯 즉시 해결 방법

### 방법 1: Claude Desktop 완전 재시작 (가장 권장)

1. **Claude Desktop 완전 종료**
   ```bash
   # macOS: Cmd + Q 또는
   killall Claude
   ```

2. **잠시 대기** (5-10초)

3. **Claude Desktop 재시작**

4. **새 대화 시작하고 테스트**
   ```
   "나무의사 교재 통계를 보여주세요"
   ```

### 방법 2: Wrapper 스크립트 사용

1. **설정 파일 수정**
   ```bash
   # ~/Library/Application Support/Claude/claude_desktop_config.json 편집
   ```

2. **tree-doctor-pdf-qa 설정을 다음으로 변경**
   ```json
   "tree-doctor-pdf-qa": {
     "command": "/Users/voidlight/tree-doctor-pdf-qa-mcp/start-mcp.sh"
   }
   ```

3. **Claude Desktop 재시작**

### 방법 3: 환경 변수 추가

1. **설정 파일에 환경 변수 추가**
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

2. **Claude Desktop 재시작**

## 🔍 진단 명령어

### 빠른 진단
```bash
cd /Users/voidlight/tree-doctor-pdf-qa-mcp
./diagnose-mcp.sh
```

### MCP 서버 수동 테스트
```bash
# 서버가 응답하는지 확인
echo '{"jsonrpc":"2.0","method":"tools/list","params":{},"id":1}' | node dist/index.js | grep -o '"name"' | wc -l
# 정상이면 14가 출력됨
```

### Claude Desktop 로그 확인
1. Claude Desktop 개발자 도구 열기
2. Console 탭 확인
3. "tree-doctor" 검색

## 📌 체크리스트

- [ ] Node.js v18 이상 설치됨 (현재 v22.17.0 ✓)
- [ ] npm 패키지 모두 설치됨 ✓
- [ ] TypeScript 빌드 완료 ✓
- [ ] 데이터베이스 파일 존재 ✓
- [ ] Claude Desktop 설정에 MCP 서버 등록됨 ✓
- [ ] Claude Desktop 재시작함
- [ ] 새 대화에서 테스트함

## 🚨 일반적인 문제와 해결책

### "MCP tools not available"
→ Claude Desktop 재시작 필요

### "Server disconnected"
→ 서버 초기화 시간 문제, wrapper 스크립트 사용

### "Permission denied"
→ 실행 권한 확인: `chmod +x dist/index.js`

### "Module not found"
→ npm install 재실행

## 💡 추가 팁

1. **항상 새 대화에서 테스트**
   - 기존 대화는 MCP 도구를 로드하지 않음

2. **Claude Desktop 완전 종료 확인**
   ```bash
   ps aux | grep Claude | grep -v grep
   ```

3. **MCP 서버 프로세스 확인**
   ```bash
   ps aux | grep tree-doctor | grep -v grep
   ```

## 📞 문제 지속 시

다음 정보와 함께 보고:
- diagnose-mcp.sh 실행 결과
- Claude Desktop 버전
- 개발자 콘솔 에러 메시지