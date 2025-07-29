#!/bin/bash
# Marker 환경 설정 및 설치 스크립트

echo "🚀 Marker 환경 설정 시작..."

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 가상환경 경로
VENV_PATH="$HOME/marker-env"
MARKER_PATH="/Users/voidlight/MCP-Servers/marker"

# 1. 가상환경 활성화
echo -e "\n${YELLOW}1. 가상환경 활성화${NC}"
if [ -d "$VENV_PATH" ]; then
    source "$VENV_PATH/bin/activate"
    echo -e "${GREEN}✅ 가상환경 활성화됨${NC}"
    python --version
else
    echo -e "${RED}❌ 가상환경이 없습니다. 생성 중...${NC}"
    python3.11 -m venv "$VENV_PATH"
    source "$VENV_PATH/bin/activate"
fi

# 2. pip 업그레이드
echo -e "\n${YELLOW}2. pip 업그레이드${NC}"
pip install --upgrade pip setuptools wheel

# 3. PyTorch 설치 (CPU 버전)
echo -e "\n${YELLOW}3. PyTorch 설치${NC}"
pip install torch torchvision torchaudio

# 4. Marker 설치
echo -e "\n${YELLOW}4. Marker 설치${NC}"
cd "$MARKER_PATH"
pip install -e '.[full]'

# 5. 설치 확인
echo -e "\n${YELLOW}5. 설치 확인${NC}"
python -c "
import sys
print(f'Python: {sys.version}')
try:
    import torch
    print(f'PyTorch: {torch.__version__}')
except ImportError:
    print('❌ PyTorch not installed')
    
try:
    from marker.converters.pdf import PdfConverter
    print('✅ Marker 모듈 import 성공')
except ImportError as e:
    print(f'❌ Marker import 실패: {e}')
"

# 6. 명령어 테스트
echo -e "\n${YELLOW}6. Marker 명령어 테스트${NC}"
which marker_single
marker_single --help 2>/dev/null | head -10 || echo "명령어 테스트 실패"

echo -e "\n${GREEN}✨ 설정 완료!${NC}"
echo -e "${YELLOW}사용법:${NC}"
echo "1. 가상환경 활성화: source ~/marker-env/bin/activate"
echo "2. 단일 PDF 변환: marker_single input.pdf"
echo "3. 병렬 처리: python /Users/voidlight/tree-doctor-pdf-qa-mcp/scripts/marker-parallel.py input_dir output_dir"