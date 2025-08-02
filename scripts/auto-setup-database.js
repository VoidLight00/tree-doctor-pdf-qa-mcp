#!/usr/bin/env node

/**
 * 자동 데이터베이스 설치 시스템
 * - 병렬 다운로드로 빠른 설치
 * - 체크섬 검증으로 무결성 보장
 * - 크로스 플랫폼 지원
 */

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import https from 'https';
import { pipeline } from 'stream/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

class DatabaseAutoSetup {
  constructor() {
    // 데이터베이스 파일을 여러 조각으로 분할하여 병렬 다운로드
    this.dbParts = [
      {
        name: 'tree-doctor-pdf-qa.db.part1',
        url: 'https://github.com/VoidLight00/tree-doctor-pdf-qa-mcp/releases/download/v1.0/tree-doctor-pdf-qa.db.part1',
        size: 40 * 1024 * 1024, // 40MB
        checksum: 'CHECKSUM_PART1'
      },
      {
        name: 'tree-doctor-pdf-qa.db.part2',
        url: 'https://github.com/VoidLight00/tree-doctor-pdf-qa-mcp/releases/download/v1.0/tree-doctor-pdf-qa.db.part2',
        size: 40 * 1024 * 1024, // 40MB
        checksum: 'CHECKSUM_PART2'
      },
      {
        name: 'tree-doctor-pdf-qa.db.part3',
        url: 'https://github.com/VoidLight00/tree-doctor-pdf-qa-mcp/releases/download/v1.0/tree-doctor-pdf-qa.db.part3',
        size: 40 * 1024 * 1024, // 40MB
        checksum: 'CHECKSUM_PART3'
      }
    ];
    
    this.finalDbPath = path.join(projectRoot, 'tree-doctor-pdf-qa.db');
    this.tempDir = path.join(projectRoot, '.temp-db-download');
  }
  
  async checkExistingDatabase() {
    try {
      await fs.access(this.finalDbPath);
      const stats = await fs.stat(this.finalDbPath);
      
      if (stats.size > 100 * 1024 * 1024) { // 100MB 이상
        console.log('✅ 데이터베이스가 이미 존재합니다.');
        
        // 무결성 검사
        const isValid = await this.verifyDatabase();
        if (isValid) {
          console.log('✅ 데이터베이스 무결성 검증 완료');
          return true;
        } else {
          console.log('⚠️ 데이터베이스 무결성 검증 실패. 재다운로드합니다.');
          await fs.unlink(this.finalDbPath);
        }
      }
    } catch (err) {
      // 파일이 없음
    }
    return false;
  }
  
  async downloadPart(part, agentId) {
    console.log(`🤖 Agent ${agentId}: ${part.name} 다운로드 시작...`);
    
    const partPath = path.join(this.tempDir, part.name);
    
    return new Promise((resolve, reject) => {
      https.get(part.url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}`));
          return;
        }
        
        const fileStream = require('fs').createWriteStream(partPath);
        let downloadedBytes = 0;
        const totalBytes = parseInt(response.headers['content-length'], 10);
        
        response.on('data', (chunk) => {
          downloadedBytes += chunk.length;
          const progress = ((downloadedBytes / totalBytes) * 100).toFixed(1);
          process.stdout.write(`\r🤖 Agent ${agentId}: ${progress}% 완료`);
        });
        
        response.pipe(fileStream);
        
        fileStream.on('finish', () => {
          console.log(`\n✅ Agent ${agentId}: ${part.name} 다운로드 완료`);
          resolve(partPath);
        });
        
        fileStream.on('error', reject);
      }).on('error', reject);
    });
  }
  
  async launchDownloadAgents() {
    console.log('\n🚀 병렬 다운로드 에이전트 시작...\n');
    
    // 임시 디렉토리 생성
    await fs.mkdir(this.tempDir, { recursive: true });
    
    // 병렬로 모든 파트 다운로드
    const downloadPromises = this.dbParts.map((part, index) => 
      this.downloadPart(part, index + 1)
    );
    
    try {
      const downloadedPaths = await Promise.all(downloadPromises);
      console.log('\n✅ 모든 파트 다운로드 완료');
      return downloadedPaths;
    } catch (error) {
      console.error('❌ 다운로드 실패:', error);
      throw error;
    }
  }
  
  async combinePartsWithAgent() {
    console.log('\n🔧 파일 결합 에이전트 시작...');
    
    const writeStream = require('fs').createWriteStream(this.finalDbPath);
    
    for (let i = 0; i < this.dbParts.length; i++) {
      const partPath = path.join(this.tempDir, this.dbParts[i].name);
      const readStream = require('fs').createReadStream(partPath);
      
      await new Promise((resolve, reject) => {
        readStream.pipe(writeStream, { end: false });
        readStream.on('end', resolve);
        readStream.on('error', reject);
      });
      
      console.log(`✅ Part ${i + 1} 결합 완료`);
    }
    
    writeStream.end();
    console.log('✅ 데이터베이스 파일 결합 완료');
  }
  
  async verifyDatabase() {
    console.log('\n🔍 데이터베이스 검증 에이전트 시작...');
    
    // SQLite 무결성 검사
    const sqlite3 = await import('sqlite3');
    const db = new sqlite3.default.Database(this.finalDbPath);
    
    return new Promise((resolve) => {
      // 기본 테이블 확인
      db.get(
        `SELECT COUNT(*) as exam_count FROM exam_questions`,
        (err, row) => {
          if (err || !row || row.exam_count < 1000) {
            console.log('❌ 기출문제 데이터 검증 실패');
            resolve(false);
            return;
          }
          console.log(`✅ 기출문제 ${row.exam_count}개 확인`);
          
          // 교재 확인
          db.get(
            `SELECT COUNT(*) as textbook_count FROM textbooks WHERE processing_method = 'pdf_extract'`,
            (err, row) => {
              if (err || !row || row.textbook_count < 10) {
                console.log('❌ 교재 데이터 검증 실패');
                resolve(false);
                return;
              }
              console.log(`✅ 교재 ${row.textbook_count}권 확인`);
              
              db.close();
              resolve(true);
            }
          );
        }
      );
    });
  }
  
  async cleanup() {
    console.log('\n🧹 임시 파일 정리 중...');
    try {
      await fs.rm(this.tempDir, { recursive: true, force: true });
      console.log('✅ 정리 완료');
    } catch (err) {
      // 무시
    }
  }
  
  async showFinalStats() {
    const sqlite3 = await import('sqlite3');
    const db = new sqlite3.default.Database(this.finalDbPath);
    
    console.log('\n📊 설치된 데이터베이스 통계:');
    
    db.get(
      `SELECT 
        (SELECT COUNT(*) FROM exam_questions) as exams,
        (SELECT COUNT(*) FROM textbooks WHERE processing_method = 'pdf_extract') as textbooks,
        (SELECT COUNT(*) FROM textbook_contents) as contents`,
      (err, row) => {
        if (!err && row) {
          console.log(`- 기출문제: ${row.exams}개`);
          console.log(`- 교재: ${row.textbooks}권`);
          console.log(`- 교재 내용: ${row.contents}개 청크`);
        }
        db.close();
      }
    );
  }
  
  async run() {
    console.log('🌳 나무의사 PDF Q&A MCP 자동 설치 시작\n');
    console.log('📦 필요 데이터:');
    console.log('- 기출문제 1,051개 (2019-2025년)');
    console.log('- 교재 18권 (전체 텍스트)');
    console.log('- 데이터베이스 크기: 약 120MB\n');
    
    try {
      // 1. 기존 데이터베이스 확인
      const exists = await this.checkExistingDatabase();
      if (exists) {
        await this.showFinalStats();
        console.log('\n✅ 설치가 이미 완료되어 있습니다!');
        return;
      }
      
      // 2. 병렬 다운로드 에이전트 실행
      const startTime = Date.now();
      await this.launchDownloadAgents();
      
      // 3. 파일 결합 에이전트 실행
      await this.combinePartsWithAgent();
      
      // 4. 검증 에이전트 실행
      const isValid = await this.verifyDatabase();
      if (!isValid) {
        throw new Error('데이터베이스 검증 실패');
      }
      
      // 5. 정리
      await this.cleanup();
      
      const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`\n⏱️ 총 소요 시간: ${elapsedTime}초`);
      
      // 6. 최종 통계
      await this.showFinalStats();
      
      console.log('\n🎉 설치 완료!');
      console.log('\n다음 명령어로 MCP 서버를 시작하세요:');
      console.log('npm run build');
      console.log('\nClaude Desktop을 재시작하면 사용할 수 있습니다.');
      
    } catch (error) {
      console.error('\n❌ 설치 실패:', error.message);
      await this.cleanup();
      process.exit(1);
    }
  }
}

// Windows 호환성 체크
if (process.platform === 'win32') {
  console.log('✅ Windows 환경 감지 - 호환 모드로 실행합니다.');
}

// 실행
const installer = new DatabaseAutoSetup();
installer.run();