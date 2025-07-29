# N8N 워크플로우 설정 가이드

## 1. crowdsource-automation.json

### 기능
- GitHub Issue 생성 시 자동으로 JSON 파일 생성
- Slack으로 실시간 알림 발송
- 데이터 검증 및 변환

### 설정 방법

1. **N8N 설치 및 실행**
   ```bash
   npm install -g n8n
   n8n start
   ```

2. **워크플로우 임포트**
   - N8N 대시보드 접속
   - "Import from File" 클릭
   - `crowdsource-automation.json` 선택

3. **자격증명 설정**
   
   **GitHub API**:
   - Settings → Developer settings → Personal access tokens
   - `repo` 권한 필요
   - N8N에서 GitHub 노드의 Credentials 설정

   **Slack API**:
   - https://api.slack.com/apps 에서 앱 생성
   - OAuth & Permissions에서 `chat:write` 권한 추가
   - Bot User OAuth Token을 N8N에 입력

4. **Webhook URL 설정**
   - N8N 워크플로우에서 Webhook 노드의 URL 복사
   - GitHub 리포지토리 Settings → Webhooks → Add webhook
   - Payload URL에 N8N Webhook URL 입력
   - Content type: `application/json`
   - Events: `Issues` 선택

### 워크플로우 구조

```
GitHub Webhook → Parse Event → Check if New Question → Extract Data → Create File + Send Notification
```

## 2. 추가 워크플로우 (계획)

### contributor-stats.json
- 매일 자정 기여자 통계 계산
- README 자동 업데이트
- 월간 우수 기여자 선정

### validation-checker.json
- PR 생성 시 자동 검증
- 중복 문제 검사
- 형식 검증

### backup-sync.json
- 매일 데이터 백업
- Google Drive 동기화
- 버전 관리

## 문제 해결

### Webhook이 작동하지 않을 때
1. N8N이 실행 중인지 확인
2. Webhook URL이 인터넷에서 접근 가능한지 확인 (ngrok 사용 권장)
3. GitHub Webhook 설정에서 Recent Deliveries 확인

### Slack 알림이 오지 않을 때
1. Slack Bot이 채널에 초대되었는지 확인
2. Bot Token이 올바른지 확인
3. 채널 ID가 정확한지 확인

### 파일 생성이 안 될 때
1. GitHub Token의 권한 확인 (`repo` 권한 필요)
2. 리포지토리 접근 권한 확인
3. 파일 경로가 올바른지 확인