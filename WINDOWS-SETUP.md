# 🪟 Windows 설치 가이드 - 나무의사 PDF Q&A MCP

Windows에서 오류 없이 설치하고 실행하는 방법입니다.

## 📋 사전 요구사항

1. **Node.js 18.0 이상**
   - [nodejs.org](https://nodejs.org)에서 LTS 버전 다운로드
   - 설치 시 "Add to PATH" 옵션 체크 필수

2. **Git for Windows**
   - [git-scm.com](https://git-scm.com)에서 다운로드
   - 설치 중 "Git Bash Here" 옵션 활성화

3. **Visual Studio Build Tools** (sqlite3 컴파일용)
   ```powershell
   # PowerShell 관리자 권한으로 실행
   npm install --global windows-build-tools
   ```

## 🚀 설치 방법

### 방법 1: Git Bash 사용 (권장)

```bash
# Git Bash에서 실행
git clone https://github.com/VoidLight00/tree-doctor-pdf-qa-mcp.git
cd tree-doctor-pdf-qa-mcp
npm install
npm run build
npm start
```

### 방법 2: PowerShell 사용

```powershell
# PowerShell에서 실행
git clone https://github.com/VoidLight00/tree-doctor-pdf-qa-mcp.git
cd tree-doctor-pdf-qa-mcp
npm install
npm run build
npm run start:win
```

### 방법 3: 명령 프롬프트 (CMD) 사용

```cmd
git clone https://github.com/VoidLight00/tree-doctor-pdf-qa-mcp.git
cd tree-doctor-pdf-qa-mcp
npm install
npm run build
node dist\index.js
```

## 🔧 일반적인 오류 해결

### 1. sqlite3 설치 오류

```bash
# 사전 빌드된 바이너리 사용
npm install sqlite3 --build-from-source=false
```

### 2. 경로 관련 오류

- 프로젝트 경로에 **한글이나 공백**이 없는지 확인
- 예: `C:\tree-doctor-mcp` ✅
- 예: `C:\내 문서\나무의사 MCP` ❌

### 3. 권한 오류

```powershell
# PowerShell 관리자 권한으로 실행
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 4. Node.js 버전 오류

```bash
# 버전 확인
node --version  # v18.0.0 이상이어야 함
npm --version   # v8.0.0 이상이어야 함
```

## 🎯 Claude Desktop 설정 (Windows)

1. Claude Desktop 설정 파일 위치:
   - `%APPDATA%\Claude\claude_desktop_config.json`

2. 설정 예시:
```json
{
  "mcpServers": {
    "tree-doctor-pdf-qa": {
      "command": "node.exe",
      "args": ["C:\\tree-doctor-mcp\\dist\\index.js"],
      "env": {}
    }
  }
}
```

**주의사항**:
- 경로에 `\\` (역슬래시 2개) 사용
- 절대 경로 사용 필수
- 한글 경로 피하기

## 📊 설치 확인

```powershell
# PowerShell에서 확인
cd tree-doctor-pdf-qa-mcp
node -e "console.log('Node.js OK')"
npm list sqlite3
sqlite3 tree-doctor-pdf-qa.db "SELECT COUNT(*) FROM exam_questions;"
```

정상이면 `224`가 출력됩니다.

## 🆘 추가 도움말

### Windows Defender 예외 추가

1. Windows 보안 → 바이러스 및 위협 방지
2. 설정 관리 → 제외 추가
3. 폴더 제외: `C:\tree-doctor-mcp`

### 환경 변수 설정

시스템 환경 변수에 추가:
- `NODE_ENV=production`
- `NODE_OPTIONS=--max-old-space-size=4096`

## ✅ 빠른 체크리스트

- [ ] Node.js 18+ 설치됨
- [ ] Git 설치됨
- [ ] Visual Studio Build Tools 설치됨
- [ ] 프로젝트 경로에 한글/공백 없음
- [ ] npm install 성공
- [ ] npm run build 성공
- [ ] 데이터베이스 파일 존재 (216KB)
- [ ] Claude Desktop 설정 완료

---

**문제 발생 시**: GitHub Issues에 Windows 환경임을 명시하고 문의하세요.