#!/usr/bin/env node

/**
 * 초기 데이터가 포함된 데이터베이스 생성
 * 빈 DB 대신 실제 데이터 포함
 */

import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class InitialDatabaseCreator {
  constructor() {
    this.dbPath = path.join(__dirname, '..', 'tree-doctor-pdf-qa.db');
    this.backupPath = path.join(__dirname, '..', 'tree-doctor-pdf-qa.db.backup');
  }
  
  async checkExistingDatabase() {
    try {
      const stats = await fs.stat(this.dbPath);
      if (stats.size > 100 * 1024 * 1024) { // 100MB 이상이면 실제 DB
        console.log('✅ 완전한 데이터베이스가 이미 존재합니다.');
        return true;
      }
    } catch (err) {
      // 파일 없음
    }
    return false;
  }
  
  async downloadFullDatabase() {
    console.log('📥 전체 데이터베이스 다운로드 시도 중...');
    
    // GitHub Release에서 다운로드
    const downloadUrl = 'https://github.com/VoidLight00/tree-doctor-pdf-qa-mcp/releases/download/v1.0.0/tree-doctor-pdf-qa-db.tar.gz';
    
    try {
      const https = await import('https');
      const { createWriteStream } = await import('fs');
      const { pipeline } = await import('stream/promises');
      
      const response = await new Promise((resolve, reject) => {
        https.get(downloadUrl, (res) => {
          if (res.statusCode === 200) {
            resolve(res);
          } else if (res.statusCode === 302 || res.statusCode === 301) {
            // 리다이렉트 처리
            https.get(res.headers.location, resolve).on('error', reject);
          } else {
            reject(new Error(`HTTP ${res.statusCode}`));
          }
        }).on('error', reject);
      });
      
      const tempFile = this.dbPath + '.download.tar.gz';
      await pipeline(response, createWriteStream(tempFile));
      
      // 압축 해제
      console.log('📦 압축 해제 중...');
      const { execSync } = await import('child_process');
      execSync(`tar -xzf "${tempFile}" -C "${path.dirname(this.dbPath)}"`, { stdio: 'inherit' });
      await fs.unlink(tempFile);
      
      console.log('✅ 데이터베이스 다운로드 완료!');
      return true;
      
    } catch (error) {
      console.error('❌ 다운로드 실패:', error.message);
      return false;
    }
  }
  
  async createMinimalDatabase() {
    console.log('⚠️  최소 데이터베이스 생성 중...');
    console.log('   (전체 데이터를 원하시면 DATABASE_DOWNLOAD.md 참조)');
    
    const db = new sqlite3.Database(this.dbPath);
    
    // 테이블 생성은 initialize-database.js 사용
    const { execSync } = await import('child_process');
    execSync('node scripts/initialize-database.js', { stdio: 'inherit' });
    
    // 최소 데이터 추가
    await new Promise((resolve) => {
      db.serialize(() => {
        // 안내 문구를 문제로 추가
        db.run(`
          INSERT INTO exam_questions (year, round, question_number, subject, question_text, question_type, created_at)
          VALUES 
          (2025, 1, 1, '안내', '데이터베이스가 제대로 설치되지 않았습니다. DATABASE_DOWNLOAD.md를 참조하세요.', 'info', datetime('now')),
          (2025, 1, 2, '안내', '전체 데이터베이스(120MB)를 다운로드하려면 npm run install-all을 실행하세요.', 'info', datetime('now'))
        `);
        
        db.close(resolve);
      });
    });
    
    console.log('⚠️  최소 데이터베이스 생성 완료');
    console.log('   전체 데이터를 위해 npm run install-all 실행 필요');
  }
  
  async run() {
    // 1. 이미 완전한 DB가 있는지 확인
    const hasFullDb = await this.checkExistingDatabase();
    if (hasFullDb) {
      return;
    }
    
    // 2. 전체 DB 다운로드 시도
    const downloaded = await this.downloadFullDatabase();
    if (downloaded) {
      return;
    }
    
    // 3. 실패 시 최소 DB 생성
    await this.createMinimalDatabase();
  }
}

// 실행
const creator = new InitialDatabaseCreator();
creator.run().catch(console.error);