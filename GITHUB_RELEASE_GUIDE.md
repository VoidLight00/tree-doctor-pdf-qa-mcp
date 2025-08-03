# 🚀 GitHub Release 생성 가이드

## 📋 사전 준비 사항

Release 파일들이 이미 준비되어 있습니다:
- `release/tree-doctor-pdf-qa-db.tar.gz` (39MB) ✅
- `release/checksum.txt` ✅
- `release/release-info.json` ✅

## 🔧 GitHub Release 생성 단계

### 1. GitHub 저장소로 이동
```
https://github.com/VoidLight00/tree-doctor-pdf-qa-mcp
```

### 2. Release 생성
1. 저장소 페이지에서 **"Releases"** 클릭
2. **"Create a new release"** 버튼 클릭

### 3. Release 정보 입력
- **Tag version**: `v1.0.0`
- **Release title**: `Tree Doctor PDF Q&A MCP v1.0.0`
- **Description**:
```markdown
# 🌳 나무의사 PDF Q&A MCP v1.0.0

## 📊 포함된 데이터
- 기출문제: 1,051개
- 교재: 18권
- 텍스트 청크: 8,985개

## 📥 자동 설치
```bash
git clone https://github.com/VoidLight00/tree-doctor-pdf-qa-mcp.git
cd tree-doctor-pdf-qa-mcp
npm run install-all
```

## 📦 Release 파일
- `tree-doctor-pdf-qa-db.tar.gz` (39MB) - 압축된 데이터베이스
- `checksum.txt` - SHA256 체크섬
- `release-info.json` - 릴리스 정보

## ✅ 체크섬
```
160013dce494391ab47f28478c2b610e1fc02292c2a1eb71bd4d975f09737361
```
```

### 4. 파일 업로드
**"Attach binaries by dropping them here or selecting them"** 영역에 다음 파일들을 드래그 앤 드롭:
1. `/Users/voidlight/tree-doctor-pdf-qa-mcp/release/tree-doctor-pdf-qa-db.tar.gz`
2. `/Users/voidlight/tree-doctor-pdf-qa-mcp/release/checksum.txt`
3. `/Users/voidlight/tree-doctor-pdf-qa-mcp/release/release-info.json`

### 5. Release 발행
- **"Publish release"** 버튼 클릭

## 🔗 업로드 완료 후

Release가 생성되면 자동 다운로드 URL이 활성화됩니다:
```
https://github.com/VoidLight00/tree-doctor-pdf-qa-mcp/releases/download/v1.0.0/tree-doctor-pdf-qa-db.tar.gz
```

이제 다른 PC에서 다음 명령어로 전체 데이터를 자동으로 받을 수 있습니다:
```bash
npm run install-all
```

## ⚡ 빠른 테스트

Release 생성 후 다른 PC에서:
```bash
git clone https://github.com/VoidLight00/tree-doctor-pdf-qa-mcp.git
cd tree-doctor-pdf-qa-mcp
npm run install-all
```

설치 완료 후 데이터 확인:
- 기출문제: 1,051개 ✅
- 교재: 18권 ✅