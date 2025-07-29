# Marker PDF 변환 스크립트

이 디렉토리는 Marker를 사용한 PDF 변환을 위한 스크립트들을 포함합니다.

## 📁 파일 구조

- `marker-setup.py` - Marker 환경 설정 확인 및 가이드
- `marker-parallel.py` - 병렬 PDF 변환 스크립트
- `setup-marker-env.sh` - 자동 환경 설정 스크립트
- `test-marker.py` - Marker 기능 테스트 스크립트

## 🚀 빠른 시작

### 1. 환경 설정

```bash
# 자동 설정 (권장)
./setup-marker-env.sh

# 또는 수동 설정
python3.11 -m venv ~/marker-env
source ~/marker-env/bin/activate
cd /Users/voidlight/MCP-Servers/marker
pip install -e '.[full]'
```

### 2. 환경 확인

```bash
python marker-setup.py
```

### 3. 기능 테스트

```bash
source ~/marker-env/bin/activate
python test-marker.py
```

## 📖 사용법

### 단일 PDF 변환

```bash
source ~/marker-env/bin/activate
marker_single input.pdf --output_dir output/
```

### 병렬 처리

```bash
source ~/marker-env/bin/activate
python marker-parallel.py input_dir/ output_dir/ --workers 4
```

### 고급 옵션

```bash
# JSON 형식으로 출력
python marker-parallel.py input_dir/ output_dir/ --format json

# LLM 사용 (Gemini)
python marker-parallel.py input_dir/ output_dir/ --use-llm

# 강제 OCR 및 수식 포맷팅
python marker-parallel.py input_dir/ output_dir/ --force-ocr --format-lines

# 특정 페이지만 처리
python marker-parallel.py input.pdf output_dir/ --page-range "0,5-10,20"
```

## 🔧 병렬 처리 스크립트 기능

`marker-parallel.py`는 다음 기능을 제공합니다:

- **멀티프로세싱**: CPU 코어를 활용한 병렬 처리
- **진행 상황 표시**: 실시간 처리 상태 모니터링
- **에러 핸들링**: 실패한 파일 로그 저장
- **다양한 출력 형식**: markdown, json, html, chunks
- **스킵 기능**: 이미 처리된 파일 자동 스킵

## ⚠️ 주의사항

1. **Python 버전**: Python 3.10 이상 필요
2. **메모리 사용**: 워커당 약 3-5GB VRAM/RAM 사용
3. **처리 시간**: PDF 복잡도에 따라 페이지당 0.1-5초

## 🐛 문제 해결

### Python 버전 오류
```bash
brew install python@3.11
python3.11 -m venv ~/marker-env
```

### Import 오류
```bash
cd /Users/voidlight/MCP-Servers/marker
pip install -e '.[full]'
```

### 메모리 부족
```bash
# 워커 수 줄이기
python marker-parallel.py input_dir/ output_dir/ --workers 2
```

## 📊 성능 팁

1. **워커 수**: CPU 코어 수 - 1 권장
2. **배치 처리**: 많은 PDF는 병렬 스크립트 사용
3. **LLM 사용**: 정확도는 높지만 속도 저하
4. **OCR 옵션**: 필요한 경우만 사용

## 🔗 관련 링크

- [Marker GitHub](https://github.com/VikParuchuri/marker)
- [Marker 문서](https://github.com/VikParuchuri/marker/blob/master/README.md)