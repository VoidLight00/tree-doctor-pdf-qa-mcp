#!/usr/bin/env node

/**
 * 나무의사 PDF Q&A MCP 자동 설치 스크립트
 * - 데이터베이스 자동 다운로드
 * - 의존성 설치
 * - 빌드 및 설정
 */

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import { createWriteStream } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

class AutoInstaller {
  constructor() {
    this.dbPath = path.join(projectRoot, 'tree-doctor-pdf-qa.db');
    // GitHub Release 다운로드 링크
    this.dbUrl = 'https://github.com/VoidLight00/tree-doctor-pdf-qa-mcp/releases/download/v1.0.0/tree-doctor-pdf-qa-db.tar.gz';
    
    // 백업 다운로드 소스들 (병렬 시도)
    this.downloadSources = [
      {
        name: 'GitHub Release',
        url: this.dbUrl,
        agent: 1,
        compressed: true
      }
    ];
  }
  
  async checkSystem() {
    console.log('🔍 시스템 체크...\n');
    
    // Node.js 버전 체크
    const nodeVersion = process.version;
    console.log(`✅ Node.js ${nodeVersion}`);
    
    // 운영체제 확인
    const platform = process.platform;
    const platformName = {
      'win32': 'Windows',
      'darwin': 'macOS',
      'linux': 'Linux'
    }[platform] || platform;
    
    console.log(`✅ 운영체제: ${platformName}`);
    
    // npm 체크
    try {
      await this.runCommand('npm', ['--version']);
      console.log('✅ npm 설치 확인');
    } catch {
      console.error('❌ npm이 설치되어 있지 않습니다.');
      process.exit(1);
    }
    
    console.log('');
  }
  
  async checkExistingDatabase() {
    try {
      await fs.access(this.dbPath);
      const stats = await fs.stat(this.dbPath);
      
      if (stats.size > 100 * 1024 * 1024) { // 100MB 이상
        console.log('✅ 데이터베이스가 이미 존재합니다.');
        
        // 간단한 무결성 검사
        const isValid = await this.quickVerifyDatabase();
        if (isValid) {
          return true;
        } else {
          console.log('⚠️ 데이터베이스가 손상되었습니다. 재다운로드합니다.');
          await fs.unlink(this.dbPath);
        }
      }
    } catch {
      // 파일 없음
    }
    return false;
  }
  
  async downloadDatabase() {
    console.log('📥 데이터베이스 다운로드 중...\n');
    console.log('📊 예상 크기: 약 120MB\n');
    
    // 병렬로 여러 소스에서 다운로드 시도
    const downloadPromises = this.downloadSources.map(source => 
      this.tryDownloadFromSource(source)
    );
    
    try {
      // 가장 먼저 성공한 다운로드 사용
      await Promise.race(downloadPromises);
      console.log('\n✅ 데이터베이스 다운로드 완료!');
      return true;
    } catch (error) {
      console.error('\n❌ 모든 다운로드 소스 실패');
      console.error('수동으로 데이터베이스를 다운로드해주세요:');
      console.error('1. DATABASE_DOWNLOAD.md 파일 참조');
      console.error('2. tree-doctor-pdf-qa.db 파일을 프로젝트 루트에 저장');
      return false;
    }
  }
  
  async tryDownloadFromSource(source) {
    return new Promise((resolve, reject) => {
      console.log(`🤖 Agent ${source.agent} (${source.name}): 다운로드 시도...`);
      
      const tempPath = source.compressed 
        ? `${this.dbPath}.tar.gz.tmp${source.agent}`
        : `${this.dbPath}.tmp${source.agent}`;
      const file = createWriteStream(tempPath);
      
      https.get(source.url, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          // 리다이렉트 처리
          https.get(response.headers.location, (redirectResponse) => {
            this.handleDownloadResponse(redirectResponse, file, tempPath, source, resolve, reject);
          });
        } else {
          this.handleDownloadResponse(response, file, tempPath, source, resolve, reject);
        }
      }).on('error', (err) => {
        console.error(`❌ Agent ${source.agent}: 연결 실패`);
        reject(err);
      });
    });
  }
  
  handleDownloadResponse(response, file, tempPath, source, resolve, reject) {
    if (response.statusCode !== 200) {
      console.error(`❌ Agent ${source.agent}: HTTP ${response.statusCode}`);
      reject(new Error(`HTTP ${response.statusCode}`));
      return;
    }
    
    const totalSize = parseInt(response.headers['content-length'], 10);
    let downloadedSize = 0;
    
    response.on('data', (chunk) => {
      downloadedSize += chunk.length;
      const progress = ((downloadedSize / totalSize) * 100).toFixed(1);
      process.stdout.write(`\r🤖 Agent ${source.agent}: ${progress}% (${(downloadedSize / 1024 / 1024).toFixed(1)}MB / ${(totalSize / 1024 / 1024).toFixed(1)}MB)`);
    });
    
    response.pipe(file);
    
    file.on('finish', async () => {
      file.close();
      console.log(`\n✅ Agent ${source.agent}: 다운로드 완료`);
      
      try {
        if (source.compressed) {
          // 압축 해제
          console.log('📦 압축 해제 중...');
          await this.runCommand('tar', ['-xzf', tempPath, '-C', projectRoot]);
          await fs.unlink(tempPath); // 압축 파일 삭제
        } else {
          // 최종 위치로 이동
          await fs.rename(tempPath, this.dbPath);
        }
        resolve();
      } catch (err) {
        reject(err);
      }
    });
    
    file.on('error', (err) => {
      file.close();
      fs.unlink(tempPath).catch(() => {});
      reject(err);
    });
  }
  
  async quickVerifyDatabase() {
    try {
      const sqlite3 = await import('sqlite3');
      const db = new sqlite3.default.Database(this.dbPath);
      
      return new Promise((resolve) => {
        db.get('SELECT COUNT(*) as count FROM exam_questions', (err, row) => {
          db.close();
          resolve(!err && row && row.count > 1000);
        });
      });
    } catch {
      return false;
    }
  }
  
  async installDependencies() {
    console.log('\n📦 의존성 설치 중...');
    await this.runCommand('npm', ['install']);
    console.log('✅ 의존성 설치 완료');
  }
  
  async buildProject() {
    console.log('\n🔨 프로젝트 빌드 중...');
    await this.runCommand('npm', ['run', 'build']);
    console.log('✅ 빌드 완료');
  }
  
  async showFinalInstructions() {
    console.log('\n' + '='.repeat(60));
    console.log('\n🎉 설치 완료!\n');
    
    console.log('📊 설치된 데이터:');
    
    try {
      const sqlite3 = await import('sqlite3');
      const db = new sqlite3.default.Database(this.dbPath);
      
      await new Promise((resolve) => {
        db.get(
          `SELECT 
            (SELECT COUNT(*) FROM exam_questions) as exams,
            (SELECT COUNT(*) FROM textbooks WHERE processing_method = 'pdf_extract') as textbooks`,
          (err, row) => {
            if (!err && row) {
              console.log(`- 기출문제: ${row.exams}개`);
              console.log(`- 교재: ${row.textbooks}권`);
            }
            db.close();
            resolve();
          }
        );
      });
    } catch {
      // 통계 표시 실패 시 무시
    }
    
    console.log('\n📝 다음 단계:');
    console.log('\n1. Claude Desktop 설정 파일에 추가:');
    
    const configPath = process.platform === 'win32' 
      ? 'C:\\경로\\tree-doctor-pdf-qa-mcp\\dist\\index.js'
      : path.join(projectRoot, 'dist', 'index.js');
    
    console.log('```json');
    console.log(JSON.stringify({
      "mcpServers": {
        "tree-doctor-pdf-qa": {
          "command": "node",
          "args": [configPath.replace(/\\/g, '\\\\')],
          "env": {}
        }
      }
    }, null, 2));
    console.log('```');
    
    console.log('\n2. Claude Desktop 재시작');
    console.log('\n3. 사용 예시:');
    console.log('   "수목생리학에서 광합성 설명해줘"');
    console.log('   "2025년 기출문제 보여줘"');
    console.log('   "토양학 pH 관련 내용 찾아줘"');
    
    console.log('\n' + '='.repeat(60));
  }
  
  async runCommand(command, args) {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        stdio: 'inherit',
        shell: process.platform === 'win32'
      });
      
      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command failed with code ${code}`));
        }
      });
    });
  }
  
  async run() {
    try {
      console.log('🌳 나무의사 PDF Q&A MCP 자동 설치\n');
      console.log('이 스크립트는 다음 작업을 수행합니다:');
      console.log('1. 시스템 환경 체크');
      console.log('2. 데이터베이스 자동 다운로드 (120MB)');
      console.log('3. npm 패키지 설치');
      console.log('4. 프로젝트 빌드');
      console.log('\n' + '='.repeat(60) + '\n');
      
      // 1. 시스템 체크
      await this.checkSystem();
      
      // 2. 데이터베이스 확인/다운로드
      const dbExists = await this.checkExistingDatabase();
      if (!dbExists) {
        const downloaded = await this.downloadDatabase();
        if (!downloaded) {
          console.error('\n설치를 계속할 수 없습니다.');
          process.exit(1);
        }
      }
      
      // 3. 의존성 설치
      await this.installDependencies();
      
      // 4. 빌드
      await this.buildProject();
      
      // 5. 완료 안내
      await this.showFinalInstructions();
      
    } catch (error) {
      console.error('\n❌ 설치 실패:', error.message);
      console.error('\n문제 해결:');
      console.error('1. 인터넷 연결 확인');
      console.error('2. Node.js 18 이상 설치 확인');
      console.error('3. 수동 설치: README.md 참조');
      process.exit(1);
    }
  }
}

// 실행
console.clear();
const installer = new AutoInstaller();
installer.run();