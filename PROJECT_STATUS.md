# 🌳 나무의사 기출문제 MCP 프로젝트 현황

최종 업데이트: 2025-08-02

## 📊 데이터베이스 현황

### 전체 통계
- **총 문제 수**: 1,051개
- **데이터베이스 크기**: 768KB
- **완성도**: 100.1% (목표 초과 달성)

### 회차별 현황
| 회차 | 문제 수 | 포함 과목 |
|------|---------|-----------|
| 5회  | 150 | 수목병리학, 수목해충학, 수목생리학, 산림토양학, 정책 및 법규 |
| 6회  | 150 | 수목병리학, 수목해충학, 수목생리학, 산림토양학, 정책 및 법규 |
| 7회  | 150 | 수목병리학, 수목해충학, 수목생리학, 수목관리학, 산림토양학, 정책 및 법규 |
| 8회  | 151 | 수목병리학, 수목해충학, 수목생리학, 토양학, 임업일반, 수목관리학, 산림토양학, 정책 및 법규, 미분류 |
| 9회  | 150 | 수목병리학, 수목해충학, 수목생리학, 수목관리학, 토양학, 산림토양학, 정책 및 법규, 미분류 |
| 10회 | 150 | 수목병리학, 수목해충학, 수목생리학, 수목관리학, 임업일반, 미분류 |
| 11회 | 150 | 수목병리학, 수목해충학, 수목생리학, 수목관리학, 토양학, 임업일반, 산림토양학, 정책 및 법규, 미분류 |

## 🚀 프로젝트 구조

```
tree-doctor-pdf-qa-mcp/
├── src/                      # MCP 서버 소스 코드
├── dist/                     # 빌드된 MCP 서버
├── data/                     # 원본 데이터 및 추출 결과
│   ├── structured/          # 구조화된 JSON 데이터
│   ├── *.pdf               # 원본 PDF 파일
│   └── *.json              # 추출된 문제 데이터
├── scripts/                  # 데이터 처리 스크립트
│   ├── enhanced-pdf-ocr.py  # PDF OCR 추출기
│   ├── import-structured-data.js  # 구조화 데이터 가져오기
│   └── quick-add-questions.js     # 수동 문제 추가 도구
├── tree-doctor-pdf-qa.db    # SQLite 데이터베이스 (768KB)
└── package.json             # 프로젝트 설정

```

## ✅ 완료된 작업

1. **데이터 수집 (100% 완료)**
   - 5-11회차 전체 기출문제 수집
   - PDF OCR 및 구조화 데이터 활용
   - 총 1,051개 문제 데이터베이스화

2. **MCP 서버 구축**
   - Claude Desktop 통합 완료
   - 문제 검색 기능 구현
   - Windows/Mac/Linux 호환성

3. **데이터 처리 도구**
   - PDF OCR 추출 시스템
   - 병렬 처리 시스템
   - 수동 입력 도구

## 🔧 사용 방법

### 1. 설치
```bash
git clone https://github.com/VoidLight00/tree-doctor-pdf-qa-mcp.git
cd tree-doctor-pdf-qa-mcp
npm install
npm run build
```

### 2. Claude Desktop 설정
`claude_desktop_config.json`에 추가:
```json
{
  "tree-doctor-pdf-qa": {
    "command": "node",
    "args": ["/path/to/tree-doctor-pdf-qa-mcp/dist/index.js"]
  }
}
```

### 3. 사용
Claude Desktop에서:
- "나무의사 7회 수목병리학 문제"
- "소나무재선충병 관련 문제 검색"
- "9회 기출문제 중 수목해충학"

## 📝 데이터 품질

### 포함 정보
- ✅ 문제 번호 (1-150)
- ✅ 문제 텍스트
- ✅ 4-5개 선택지
- ✅ 과목 분류
- ⚠️ 정답 (일부)
- ⚠️ 해설 (일부)

### 개선 필요
- 8회차 중복 문제 1개 정리
- 일부 OCR 오류 수정
- 정답 및 해설 보완

## 🔗 관련 링크

- **GitHub 저장소**: https://github.com/VoidLight00/tree-doctor-pdf-qa-mcp
- **문제 신고**: GitHub Issues
- **기여 방법**: CONTRIBUTING.md 참조

## 📞 문의

- 버그 신고: GitHub Issues
- 기능 제안: GitHub Discussions
- 이메일: (프로젝트 관리자 이메일)

---

**나무의사 수험생을 위한 완전한 기출문제 데이터베이스** 🌳