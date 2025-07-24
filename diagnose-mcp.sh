#!/bin/bash

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== 나무의사 PDF Q&A MCP 진단 도구 ===${NC}"
echo -e "실행 시간: $(date)"
echo ""

# 1. Node.js 버전 확인
echo -e "${YELLOW}1. Node.js 환경 확인${NC}"
echo -n "Node.js 버전: "
node --version
echo -n "npm 버전: "
npm --version
echo ""

# 2. 프로젝트 파일 확인
echo -e "${YELLOW}2. 프로젝트 파일 확인${NC}"
PROJECT_DIR="/Users/voidlight/tree-doctor-pdf-qa-mcp"

if [ -f "$PROJECT_DIR/package.json" ]; then
    echo -e "${GREEN}✓${NC} package.json 존재"
else
    echo -e "${RED}✗${NC} package.json 없음"
fi

if [ -f "$PROJECT_DIR/dist/index.js" ]; then
    echo -e "${GREEN}✓${NC} dist/index.js 존재"
    echo "  파일 크기: $(ls -lh $PROJECT_DIR/dist/index.js | awk '{print $5}')"
else
    echo -e "${RED}✗${NC} dist/index.js 없음"
fi

if [ -f "$PROJECT_DIR/tree-doctor-pdf-qa.db" ]; then
    echo -e "${GREEN}✓${NC} 데이터베이스 존재"
    echo "  파일 크기: $(ls -lh $PROJECT_DIR/tree-doctor-pdf-qa.db | awk '{print $5}')"
else
    echo -e "${RED}✗${NC} 데이터베이스 없음"
fi
echo ""

# 3. MCP 서버 프로세스 확인
echo -e "${YELLOW}3. MCP 서버 프로세스 확인${NC}"
PROCESS=$(ps aux | grep -E 'node.*tree-doctor-pdf-qa-mcp/dist/index.js' | grep -v grep)
if [ -n "$PROCESS" ]; then
    echo -e "${GREEN}✓${NC} MCP 서버 실행 중"
    echo "$PROCESS" | awk '{print "  PID: " $2 ", CPU: " $3 "%, MEM: " $4 "%"}'
else
    echo -e "${RED}✗${NC} MCP 서버 실행되지 않음"
fi
echo ""

# 4. Claude Desktop 설정 확인
echo -e "${YELLOW}4. Claude Desktop 설정 확인${NC}"
CONFIG_FILE="$HOME/Library/Application Support/Claude/claude_desktop_config.json"

if [ -f "$CONFIG_FILE" ]; then
    echo -e "${GREEN}✓${NC} Claude Desktop 설정 파일 존재"
    
    # tree-doctor-pdf-qa 설정 확인
    if grep -q "tree-doctor-pdf-qa" "$CONFIG_FILE"; then
        echo -e "${GREEN}✓${NC} tree-doctor-pdf-qa MCP 서버 설정됨"
        echo "  설정 내용:"
        cat "$CONFIG_FILE" | jq '.mcpServers["tree-doctor-pdf-qa"]' 2>/dev/null | sed 's/^/    /'
    else
        echo -e "${RED}✗${NC} tree-doctor-pdf-qa MCP 서버 설정 없음"
    fi
else
    echo -e "${RED}✗${NC} Claude Desktop 설정 파일 없음"
fi
echo ""

# 5. MCP 서버 응답 테스트
echo -e "${YELLOW}5. MCP 서버 응답 테스트${NC}"
cd "$PROJECT_DIR"

# tools/list 테스트
echo -n "tools/list 테스트: "
RESPONSE=$(echo '{"jsonrpc":"2.0","method":"tools/list","params":{},"id":1}' | timeout 5 node dist/index.js 2>/dev/null | grep -o '"tools":\[.*\]')
if [ -n "$RESPONSE" ]; then
    TOOL_COUNT=$(echo "$RESPONSE" | grep -o '"name"' | wc -l | tr -d ' ')
    echo -e "${GREEN}✓${NC} 성공 ($TOOL_COUNT개 도구 발견)"
else
    echo -e "${RED}✗${NC} 실패"
fi

# get_textbook_stats 테스트
echo -n "get_textbook_stats 테스트: "
STATS_RESPONSE=$(echo '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"get_textbook_stats","arguments":{}},"id":2}' | timeout 5 node dist/index.js 2>/dev/null | grep -o '"content":\[.*\]')
if [ -n "$STATS_RESPONSE" ]; then
    echo -e "${GREEN}✓${NC} 성공"
else
    echo -e "${RED}✗${NC} 실패"
fi
echo ""

# 6. Claude Desktop 프로세스 확인
echo -e "${YELLOW}6. Claude Desktop 상태${NC}"
CLAUDE_PROCESS=$(ps aux | grep -i "Claude.app" | grep -v grep | head -1)
if [ -n "$CLAUDE_PROCESS" ]; then
    echo -e "${GREEN}✓${NC} Claude Desktop 실행 중"
    echo "$CLAUDE_PROCESS" | awk '{print "  PID: " $2 ", CPU: " $3 "%, MEM: " $4 "%"}'
else
    echo -e "${RED}✗${NC} Claude Desktop 실행되지 않음"
fi
echo ""

# 7. 권한 확인
echo -e "${YELLOW}7. 파일 권한 확인${NC}"
echo "dist/index.js 권한: $(ls -l $PROJECT_DIR/dist/index.js | awk '{print $1, $3, $4}')"
echo ""

# 8. 최종 진단
echo -e "${BLUE}=== 진단 결과 ===${NC}"
echo ""

# 문제 확인 및 해결책 제시
ISSUES=0

if [ ! -f "$PROJECT_DIR/dist/index.js" ]; then
    echo -e "${RED}문제${NC}: 빌드된 파일이 없습니다."
    echo -e "${YELLOW}해결${NC}: cd $PROJECT_DIR && npm run build"
    echo ""
    ISSUES=$((ISSUES + 1))
fi

if [ -z "$PROCESS" ]; then
    echo -e "${YELLOW}참고${NC}: MCP 서버가 실행 중이 아닙니다."
    echo "  Claude Desktop이 필요할 때 자동으로 시작합니다."
    echo ""
fi

if ! grep -q "tree-doctor-pdf-qa" "$CONFIG_FILE" 2>/dev/null; then
    echo -e "${RED}문제${NC}: Claude Desktop에 MCP 서버가 설정되지 않았습니다."
    echo -e "${YELLOW}해결${NC}: 다음 내용을 claude_desktop_config.json에 추가하세요:"
    echo '
  "tree-doctor-pdf-qa": {
    "command": "node",
    "args": [
      "/Users/voidlight/tree-doctor-pdf-qa-mcp/dist/index.js"
    ],
    "env": {
      "NODE_ENV": "production"
    }
  }
'
    ISSUES=$((ISSUES + 1))
fi

if [ $ISSUES -eq 0 ]; then
    echo -e "${GREEN}모든 설정이 정상입니다!${NC}"
    echo ""
    echo "다음 단계:"
    echo "1. Claude Desktop을 완전히 종료 (Cmd+Q)"
    echo "2. Claude Desktop을 다시 시작"
    echo "3. 새 대화를 시작하고 다음 명령 테스트:"
    echo '   "나무의사 교재 통계를 보여주세요"'
else
    echo -e "${RED}$ISSUES개의 문제가 발견되었습니다.${NC}"
    echo "위의 해결 방법을 따라주세요."
fi

echo ""
echo -e "${BLUE}=== 진단 완료 ===${NC}"