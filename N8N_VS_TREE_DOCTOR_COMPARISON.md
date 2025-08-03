# 🔍 N8N MCP vs Tree Doctor PDF Q&A MCP 비교

## 📊 핵심 차이점

### 1. 데이터 저장 방식의 차이

#### N8N MCP
- **데이터**: Node.js 패키지에서 직접 로드 (코드 기반)
- **저장**: 작은 SQLite DB (nodes.db - 약 1-2MB)
- **빌드 시**: npm 패키지에서 동적으로 정보 추출
- **Git 포함**: ✅ 가능 (작은 파일)

```javascript
// N8N은 npm 패키지에서 실시간으로 데이터를 로드
const nodeModule = require('n8n-nodes-base/dist/nodes/Slack/Slack.node.js');
```

#### Tree Doctor MCP
- **데이터**: PDF에서 추출한 텍스트 (대용량 데이터)
- **저장**: 큰 SQLite DB (120MB)
- **빌드 시**: 이미 존재하는 DB 파일 복사
- **Git 포함**: ❌ 불가능 (100MB 제한)

```javascript
// Tree Doctor는 사전 생성된 대용량 DB 필요
const db = new Database('tree-doctor-pdf-qa.db'); // 120MB 파일
```

### 2. 데이터 생성 과정

#### N8N MCP
```
npm install → npm 패키지 다운로드 → 빌드 시 자동으로 데이터 생성
```
- 사용자가 `npm install`만 하면 모든 데이터 자동 생성
- 추가 다운로드 불필요

#### Tree Doctor MCP
```
git clone → npm install → ⚠️ DB 파일 없음 → 별도 다운로드 필요
```
- PDF 텍스트 추출은 사전에 완료되어야 함
- 120MB DB 파일을 별도로 받아야 함

### 3. 기술적 구현 차이

#### N8N MCP
```javascript
// package.json
"files": [
  "dist/**/*",
  "data/nodes.db",  // 작은 메타데이터 DB
  ".env.example",
  "README.md"
]

// 빌드 스크립트
async loadPackageNodes() {
  // npm 패키지에서 동적으로 노드 정보 추출
  const packageJson = require('n8n-nodes-base/package.json');
  // 런타임에 문서 생성
}
```

#### Tree Doctor MCP
```javascript
// .gitignore
tree-doctor-pdf-qa.db  // 120MB - Git에 포함 불가

// 자동 설치 스크립트 필요
async downloadDatabase() {
  // GitHub Release에서 다운로드
  const url = 'https://github.com/.../releases/download/v1.0.0/db.tar.gz';
  // 압축 해제 후 설치
}
```

## 🎯 해결 방안

### 현재 구현된 방식 (Tree Doctor)
1. **GitHub Release 활용**: 대용량 파일 호스팅
2. **자동 다운로드 스크립트**: `npm run install-all`
3. **압축**: 120MB → 39MB (tar.gz)

### N8N 방식으로 개선하려면
1. **데이터 경량화**: 텍스트 요약 또는 인덱스만 저장
2. **동적 로드**: PDF를 패키지에 포함하고 런타임에 추출
3. **CDN 활용**: 외부 서버에서 필요시 다운로드

## 📌 결론

**N8N MCP**는 코드 기반 데이터로 동적 생성이 가능하지만, **Tree Doctor MCP**는 PDF에서 추출한 대용량 텍스트 데이터를 저장해야 하므로 근본적으로 다른 접근이 필요합니다.

현재 구현된 **자동 다운로드 시스템**이 이 문제를 해결하는 최적의 방법입니다:
```bash
npm run install-all  # 자동으로 DB 다운로드 및 설치
```