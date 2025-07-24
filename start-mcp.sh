#!/bin/bash

# MCP 서버 시작 스크립트
# Claude Desktop에서 안정적으로 실행하기 위한 wrapper

# 작업 디렉토리로 이동
cd "$(dirname "$0")"

# 환경 변수 설정
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=4096"

# stderr로 시작 메시지 출력 (MCP 프로토콜은 stdout를 사용하므로)
echo "🌳 나무의사 PDF Q&A MCP 서버 시작 중..." >&2

# Node.js 실행
exec /usr/local/bin/node dist/index.js