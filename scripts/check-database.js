#!/usr/bin/env node

/**
 * 데이터베이스 존재 확인 스크립트
 * npm install 후 자동 실행
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

async function checkDatabase() {
  const dbPath = path.join(projectRoot, 'tree-doctor-pdf-qa.db');
  
  try {
    await fs.access(dbPath);
    const stats = await fs.stat(dbPath);
    
    if (stats.size > 100 * 1024 * 1024) {
      console.log('\n✅ 데이터베이스가 존재합니다.');
      return;
    }
  } catch {
    // 파일 없음
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\n⚠️  데이터베이스 파일이 없습니다!\n');
  console.log('다음 명령어를 실행하여 자동 설치하세요:');
  console.log('\n  npm run install-all\n');
  console.log('또는 DATABASE_DOWNLOAD.md를 참조하여 수동으로 다운로드하세요.');
  console.log('\n' + '='.repeat(60) + '\n');
}

checkDatabase();