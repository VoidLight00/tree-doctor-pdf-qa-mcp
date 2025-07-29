# 🤝 기여 가이드라인

나무의사 기출문제 크라우드소싱 프로젝트에 기여해주셔서 감사합니다!

## 📋 시작하기 전에

1. 이 프로젝트는 나무의사 자격증 준비생들을 위한 공익 프로젝트입니다
2. 모든 기여는 CC BY-SA 4.0 라이선스를 따릅니다
3. 정확성이 가장 중요합니다 - 원본과 정확히 일치해야 합니다

## 🚀 기여 프로세스

### 1단계: Fork & Clone
```bash
# 리포지토리 Fork 후
git clone https://github.com/YOUR-USERNAME/tree-doctor-exam-crowdsource.git
cd tree-doctor-exam-crowdsource
```

### 2단계: 브랜치 생성
```bash
git checkout -b add/2023-1-001
# 또는
git checkout -b fix/2023-1-001-typo
```

### 3단계: 문제 추가
1. `data/YYYY/round-N/subject-name/` 디렉토리에 JSON 파일 생성
2. 파일명: `question-NNN.json` (예: `question-001.json`)

### 4단계: JSON 형식
```json
{
  "id": "2023-1-001",
  "year": 2023,
  "round": 1,
  "subject": "수목병리학",
  "questionNumber": 1,
  "question": "문제 내용",
  "options": [
    "① 선택지1",
    "② 선택지2",
    "③ 선택지3",
    "④ 선택지4"
  ],
  "answer": 1,
  "explanation": "해설 (선택사항)",
  "image": null,
  "difficulty": "중",
  "tags": ["태그1", "태그2"],
  "contributor": "YOUR-GITHUB-USERNAME",
  "verifiedBy": [],
  "source": "2023년 제1회 나무의사 자격시험"
}
```

### 5단계: 검증
```bash
# 로컬 테스트 실행
npm test

# JSON 유효성 검사
npm run validate
```

### 6단계: 커밋 & 푸시
```bash
git add .
git commit -m "add: 2023년 1회 수목병리학 문제 1번"
git push origin add/2023-1-001
```

### 7단계: Pull Request
1. GitHub에서 Pull Request 생성
2. PR 템플릿에 따라 정보 입력
3. 검증자 지정 (최소 2명)

## 📝 커밋 메시지 규칙

- `add:` 새 문제 추가
- `fix:` 오류 수정
- `update:` 기존 내용 업데이트
- `docs:` 문서 수정
- `chore:` 기타 작업

예시:
```
add: 2023년 1회 수목병리학 문제 1-10번
fix: 2022년 2회 수목관리학 5번 오타 수정
update: 2023년 1회 전체 문제 해설 추가
```

## 🔍 검증 가이드라인

### 검증자의 역할
1. 원본 PDF와 대조
2. 오타 및 형식 확인
3. 정답 번호 확인
4. 이미지 링크 유효성 확인

### 검증 체크리스트
- [ ] 문제가 원본과 일치하는가?
- [ ] 선택지가 모두 정확한가?
- [ ] 정답 번호가 맞는가?
- [ ] JSON 형식이 올바른가?
- [ ] 중복 문제가 아닌가?

## 🏆 기여도 인정

### 자동 인정 항목
- 문제 입력: `contributor` 필드에 자동 기록
- 검증 참여: `verifiedBy` 배열에 추가
- 월간 통계: 자동 집계 및 공개

### 기여자 혜택
1. README 기여자 섹션 등재
2. 기여도 배지 부여
3. 월간 우수 기여자 선정

## ⚠️ 주의사항

### 저작권
- 기출문제는 공개된 자료만 사용
- 해설은 직접 작성하거나 출처 명시
- 이미지는 직접 제작하거나 라이선스 확인

### 품질 관리
- 무작위 검증을 통한 품질 유지
- 오류율 5% 이상 시 재검증
- 악의적 기여 시 차단

## 💬 도움이 필요하신가요?

- [Discord 채널](https://discord.gg/tree-doctor)
- [GitHub Discussions](https://github.com/yourusername/tree-doctor-exam-crowdsource/discussions)
- 이메일: tree-doctor@example.com

## 🙏 감사합니다!

여러분의 기여가 많은 수험생들에게 도움이 됩니다. 
함께 만들어가는 나무의사 커뮤니티에 감사드립니다! 🌳