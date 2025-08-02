#!/usr/bin/env node

/**
 * 데이터베이스를 여러 파트로 분할하여 GitHub Release에 업로드
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

class DatabaseSplitter {
  constructor() {
    this.dbPath = path.join(projectRoot, 'tree-doctor-pdf-qa.db');
    this.outputDir = path.join(projectRoot, 'db-parts');
    this.partSize = 40 * 1024 * 1024; // 40MB per part
  }
  
  async splitDatabase() {
    console.log('📦 데이터베이스 분할 시작...\n');
    
    // 출력 디렉토리 생성
    await fs.mkdir(this.outputDir, { recursive: true });
    
    // 데이터베이스 파일 읽기
    const dbBuffer = await fs.readFile(this.dbPath);
    const totalSize = dbBuffer.length;
    const partCount = Math.ceil(totalSize / this.partSize);
    
    console.log(`📊 데이터베이스 크기: ${(totalSize / 1024 / 1024).toFixed(1)}MB`);
    console.log(`📦 ${partCount}개 파트로 분할\n`);
    
    const checksums = {};
    
    for (let i = 0; i < partCount; i++) {
      const start = i * this.partSize;
      const end = Math.min(start + this.partSize, totalSize);
      const partBuffer = dbBuffer.slice(start, end);
      
      const partName = `tree-doctor-pdf-qa.db.part${i + 1}`;
      const partPath = path.join(this.outputDir, partName);
      
      // 파트 저장
      await fs.writeFile(partPath, partBuffer);
      
      // 체크섬 계산
      const hash = crypto.createHash('sha256');
      hash.update(partBuffer);
      const checksum = hash.digest('hex');
      checksums[partName] = checksum;
      
      console.log(`✅ ${partName} 생성 (${(partBuffer.length / 1024 / 1024).toFixed(1)}MB)`);
      console.log(`   체크섬: ${checksum}`);
    }
    
    // 체크섬 파일 생성
    const checksumPath = path.join(this.outputDir, 'checksums.json');
    await fs.writeFile(checksumPath, JSON.stringify(checksums, null, 2));
    
    console.log('\n✅ 분할 완료!');
    console.log(`\n📁 생성된 파일들: ${this.outputDir}`);
    
    // GitHub Release 업로드 가이드
    console.log('\n📤 GitHub Release 업로드 방법:');
    console.log('1. https://github.com/VoidLight00/tree-doctor-pdf-qa-mcp/releases/new');
    console.log('2. 태그: v1.0');
    console.log('3. 제목: Database Files v1.0');
    console.log('4. 파일 첨부:');
    for (let i = 0; i < partCount; i++) {
      console.log(`   - ${this.outputDir}/tree-doctor-pdf-qa.db.part${i + 1}`);
    }
    console.log(`   - ${this.outputDir}/checksums.json`);
    
    // auto-setup-database.js 업데이트 필요
    console.log('\n⚠️ auto-setup-database.js의 체크섬 업데이트 필요:');
    Object.entries(checksums).forEach(([name, checksum]) => {
      console.log(`${name}: '${checksum}'`);
    });
  }
}

// 실행
const splitter = new DatabaseSplitter();
splitter.splitDatabase().catch(console.error);