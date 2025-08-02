#!/usr/bin/env node

/**
 * 🌳 나무의사 PDF Q&A MCP 원클릭 설치 스크립트
 * 
 * 사용법: npx tree-doctor-pdf-qa-mcp
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class OneClickInstaller {
  constructor() {
    this.repoUrl = 'https://github.com/VoidLight00/tree-doctor-pdf-qa-mcp.git';
    this.projectName = 'tree-doctor-pdf-qa-mcp';
    this.dbSize = 120 * 1024 * 1024; // 120MB
  }
  
  async run() {
    console.clear();
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║     🌳 나무의사 PDF Q&A MCP 자동 설치 프로그램 🌳           ║
║                                                              ║
║     기출문제 1,051개 + 교재 18권 통합 시스템                ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`);

    try {
      // 1. Git 클론
      await this.cloneRepository();
      
      // 2. 디렉토리 이동
      process.chdir(this.projectName);
      
      // 3. npm 설치
      await this.installDependencies();
      
      // 4. 데이터베이스 다운로드
      await this.downloadDatabase();
      
      // 5. 빌드
      await this.buildProject();
      
      // 6. 설정 안내
      await this.showSetupInstructions();
      
    } catch (error) {
      console.error('\n❌ 설치 실패:', error.message);
      process.exit(1);
    }
  }
  
  async cloneRepository() {
    console.log('📦 저장소 복제 중...');
    
    if (fs.existsSync(this.projectName)) {
      console.log('⚠️  디렉토리가 이미 존재합니다. 덮어쓰시겠습니까? (y/n)');
      const answer = await this.prompt();
      if (answer.toLowerCase() !== 'y') {
        console.log('설치 취소됨');
        process.exit(0);
      }
      execSync(`rm -rf ${this.projectName}`, { stdio: 'ignore' });
    }
    
    execSync(`git clone ${this.repoUrl}`, { stdio: 'inherit' });
    console.log('✅ 저장소 복제 완료\n');
  }
  
  async installDependencies() {
    console.log('📦 패키지 설치 중...');
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ 패키지 설치 완료\n');
  }
  
  async downloadDatabase() {
    console.log('💾 데이터베이스 다운로드 중...');
    console.log('   크기: 약 120MB');
    console.log('   내용: 기출문제 1,051개 + 교재 18권\n');
    
    // 여러 다운로드 소스 병렬 시도
    const sources = [
      {
        name: 'Cloudflare R2',
        url: 'https://tree-doctor-mcp.r2.dev/tree-doctor-pdf-qa.db'
      },
      {
        name: 'Google Drive',
        url: 'https://drive.google.com/uc?export=download&id=YOUR_FILE_ID'
      },
      {
        name: 'GitHub Release',
        url: 'https://github.com/VoidLight00/tree-doctor-pdf-qa-mcp/releases/download/v1.0/tree-doctor-pdf-qa.db'
      }
    ];
    
    let downloaded = false;
    
    for (const source of sources) {
      try {
        console.log(`🔄 ${source.name}에서 다운로드 시도...`);
        await this.downloadFile(source.url, 'tree-doctor-pdf-qa.db');
        downloaded = true;
        break;
      } catch (err) {
        console.log(`❌ ${source.name} 실패`);
      }
    }
    
    if (!downloaded) {
      console.log('\n⚠️  자동 다운로드 실패');
      console.log('DATABASE_DOWNLOAD.md 파일을 참조하여 수동으로 다운로드해주세요.');
      console.log('다운로드 후 tree-doctor-pdf-qa.db 파일을 현재 디렉토리에 저장하세요.\n');
    } else {
      console.log('✅ 데이터베이스 다운로드 완료\n');
    }
  }
  
  async downloadFile(url, filename) {
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(filename);
      
      https.get(url, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          // 리다이렉트 처리
          https.get(response.headers.location, (redirectResponse) => {
            this.handleResponse(redirectResponse, file, resolve, reject);
          });
        } else {
          this.handleResponse(response, file, resolve, reject);
        }
      }).on('error', reject);
    });
  }
  
  handleResponse(response, file, resolve, reject) {
    if (response.statusCode !== 200) {
      reject(new Error(`HTTP ${response.statusCode}`));
      return;
    }
    
    const totalSize = parseInt(response.headers['content-length'], 10);
    let downloadedSize = 0;
    
    response.on('data', (chunk) => {
      downloadedSize += chunk.length;
      const progress = ((downloadedSize / totalSize) * 100).toFixed(1);
      const mb = (downloadedSize / 1024 / 1024).toFixed(1);
      process.stdout.write(`\r   진행: ${progress}% (${mb}MB / ${(totalSize / 1024 / 1024).toFixed(1)}MB)`);
    });
    
    response.pipe(file);
    
    file.on('finish', () => {
      file.close();
      console.log(''); // 새 줄
      resolve();
    });
    
    file.on('error', (err) => {
      fs.unlink(filename, () => {});
      reject(err);
    });
  }
  
  async buildProject() {
    console.log('🔨 프로젝트 빌드 중...');
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ 빌드 완료\n');
  }
  
  async showSetupInstructions() {
    const configPath = path.join(process.cwd(), 'dist', 'index.js').replace(/\\/g, '\\\\');
    
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                     🎉 설치 완료! 🎉                         ║
╚══════════════════════════════════════════════════════════════╝

📋 Claude Desktop 설정:

1. Claude Desktop 설정 파일 열기:
   ${this.getConfigPath()}

2. 다음 내용 추가:

{
  "mcpServers": {
    "tree-doctor-pdf-qa": {
      "command": "node",
      "args": ["${configPath}"],
      "env": {}
    }
  }
}

3. Claude Desktop 재시작

📚 사용 예시:
   "수목생리학에서 광합성 설명해줘"
   "2025년 기출문제 보여줘"
   "토양학 pH 관련 내용 찾아줘"

═══════════════════════════════════════════════════════════════
`);
  }
  
  getConfigPath() {
    const platform = process.platform;
    if (platform === 'win32') {
      return '%APPDATA%\\Claude\\claude_desktop_config.json';
    } else if (platform === 'darwin') {
      return '~/Library/Application Support/Claude/claude_desktop_config.json';
    } else {
      return '~/.config/Claude/claude_desktop_config.json';
    }
  }
  
  async prompt() {
    return new Promise((resolve) => {
      process.stdin.once('data', (data) => {
        resolve(data.toString().trim());
      });
    });
  }
}

// 실행
const installer = new OneClickInstaller();
installer.run();