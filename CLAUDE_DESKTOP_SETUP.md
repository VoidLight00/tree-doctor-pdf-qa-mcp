# 🌳 나무의사 PDF Q&A MCP - Claude Desktop 설정 완료

## ✅ 설정 상태

### 1. **프로젝트 설치 위치**
- **경로**: `/Users/voidlight/tree-doctor-pdf-qa-mcp`
- **GitHub**: https://github.com/VoidLight00/tree-doctor-pdf-qa-mcp

### 2. **Claude Desktop 설정**
- **설정 파일**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **MCP 서버 이름**: `tree-doctor-pdf-qa`
- **실행 명령**: `node /Users/voidlight/tree-doctor-pdf-qa-mcp/dist/index.js`

### 3. **설치 완료 사항**
- ✅ npm 패키지 설치 (349 packages)
- ✅ TypeScript 빌드 완료
- ✅ pdf-parse 버그 수정
- ✅ 데이터베이스 복사 (165MB, 27개 교재)
- ✅ 한국어 OCR 데이터 복사

## 🚀 사용 방법

### 1. **Claude Desktop 재시작**
Claude Desktop을 완전히 종료했다가 다시 시작하세요.

### 2. **새 대화 시작**
새로운 대화를 시작하면 MCP 도구들이 자동으로 로드됩니다.

### 3. **테스트 명령어**

#### 교재 통계 확인
```
"나무의사 교재 통계를 보여주세요"
```

#### 한국어 검색 테스트  
```
"광합성에 대해 교재에서 검색해주세요"
"나무보호법 제1조를 찾아주세요"
"수목병리학 관련 내용을 검색해봐"
```

#### 북마크 생성
```
"이 내용을 북마크로 저장해주세요"
```

#### 암기카드 생성
```
"광합성의 정의를 {{클로즈}} 형식 암기카드로 만들어주세요"
```

#### 복습 카드 확인
```
"오늘 복습할 암기카드를 보여주세요"
```

## 🛠️ 사용 가능한 MCP 도구 (21개)

### 교재 관리
- `search_textbooks` - 교재 검색
- `get_textbooks` - 교재 목록 조회
- `get_textbook_contents` - 교재 내용 조회
- `get_subjects` - 과목 목록
- `get_textbook_stats` - 교재 통계
- `load_textbooks` - 교재 로드

### 학습 도구
- `create_flashcard` - 암기카드 생성
- `get_review_cards` - 복습 카드 조회
- `update_flashcard_review` - 복습 결과 기록
- `create_mistake` - 오답 노트 생성

### 북마크 & 콘텐츠
- `create_bookmark` - 북마크 생성
- `get_bookmarks` - 북마크 조회
- `export_all_bookmarks` - 북마크 내보내기
- `extract_concepts` - 개념 추출
- `generate_explanation` - 해설 생성

### 기타
- `search_pdf` - PDF 검색
- `find_source` - 기출문제 근거 찾기
- `get_study_materials` - 학습 자료 조회
- `get_progress_report` - 진도 보고서
- `export_markdown` - 마크다운 내보내기
- `get_markdown_files` - 내보낸 파일 조회

## 📊 데이터베이스 현황
- **교재 수**: 27권
- **총 문자 수**: 39,280,071자
- **총 페이지**: 12,415페이지
- **섹션 수**: 342개

## ⚠️ 주의사항

1. **Claude Desktop 재시작 필수**
   - 설정 변경 후 반드시 재시작해야 MCP가 로드됩니다.

2. **첫 실행 시 지연**
   - 데이터베이스 초기화로 첫 도구 사용 시 약간의 지연이 있을 수 있습니다.

3. **한국어 인코딩**
   - UTF-8 인코딩이 제대로 처리되는지 확인하세요.

## 🐛 문제 해결

### MCP 도구가 보이지 않는 경우
1. Claude Desktop 완전 종료 (Cmd+Q)
2. 다시 시작
3. 새 대화 시작

### 검색 결과가 없는 경우
1. 데이터베이스 파일 확인: `~/tree-doctor-pdf-qa-mcp/tree-doctor-pdf-qa.db`
2. 파일 크기가 165MB 정도인지 확인

### 에러 발생 시
1. Claude Desktop 콘솔 확인 (개발자 도구)
2. `~/tree-doctor-pdf-qa-mcp/dist/index.js` 파일 존재 확인

---

**설정이 완료되었습니다! Claude Desktop을 재시작하고 나무의사 학습을 시작하세요.** 🌳📚