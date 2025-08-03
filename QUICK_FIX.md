# 🚨 긴급 해결 방법

다른 PC에서 데이터베이스가 비어있는 문제 해결:

## 방법 1: 직접 데이터베이스 파일 복사 (가장 빠름)

1. 이 파일을 다운로드: [Google Drive 링크 필요]
2. 또는 원본 PC에서 `tree-doctor-pdf-qa.db` 파일 복사 (120MB)
3. 프로젝트 루트에 붙여넣기:
   ```
   tree-doctor-pdf-qa-mcp/
   ├── tree-doctor-pdf-qa.db  ← 여기에 복사
   ├── package.json
   └── ...
   ```
4. 다시 빌드:
   ```bash
   npm run build
   ```

## 방법 2: 수동 다운로드 및 압축 해제

1. 압축 파일 다운로드:
   - release/tree-doctor-pdf-qa-db.tar.gz (39MB)
   
2. 프로젝트 루트에서 압축 해제:
   ```bash
   tar -xzf tree-doctor-pdf-qa-db.tar.gz
   ```

3. 다시 빌드:
   ```bash
   npm run build
   ```

## 확인 방법

```bash
# 데이터베이스 크기 확인 (120MB 이상이어야 함)
ls -lh tree-doctor-pdf-qa.db

# 데이터 확인
sqlite3 tree-doctor-pdf-qa.db "SELECT COUNT(*) FROM exam_questions;"
# 결과: 1051

sqlite3 tree-doctor-pdf-qa.db "SELECT COUNT(*) FROM textbooks;"  
# 결과: 18
```

## 문제 원인

- GitHub 파일 크기 제한(100MB)으로 데이터베이스가 Git에 포함되지 않음
- 자동 다운로드 링크가 아직 설정되지 않음
- 빈 데이터베이스만 생성됨