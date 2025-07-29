#!/bin/bash

# 나무의사 학습 도우미 시작 스크립트

echo "🌳 나무의사 학습 도우미를 시작합니다..."

# Node.js 설치 확인
if ! command -v node &> /dev/null; then
    echo "❌ Node.js가 설치되어 있지 않습니다."
    echo "Node.js를 먼저 설치해주세요: https://nodejs.org/"
    exit 1
fi

# 현재 디렉토리로 이동
cd "$(dirname "$0")"

# 의존성 설치 확인
if [ ! -d "node_modules" ]; then
    echo "📦 의존성을 설치합니다..."
    npm install
fi

# 데이터베이스 확인
DB_PATH="../tree-doctor-pdf-qa.db"
if [ ! -f "$DB_PATH" ]; then
    echo "⚠️  경고: 데이터베이스 파일을 찾을 수 없습니다: $DB_PATH"
    echo "앱은 실행되지만 일부 기능이 제한될 수 있습니다."
fi

# 서버 시작
echo "🚀 서버를 시작합니다..."
echo "📱 브라우저에서 http://localhost:3000 으로 접속하세요"
echo ""
echo "종료하려면 Ctrl+C를 누르세요"
echo ""

npm start