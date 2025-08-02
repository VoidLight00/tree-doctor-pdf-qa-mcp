#!/usr/bin/env node

/**
 * Cross-platform postbuild script
 * Windows와 Unix 환경 모두에서 작동
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.join(__dirname, '..');
const sourceDb = path.join(projectRoot, 'tree-doctor-pdf-qa.db');
const targetDb = path.join(projectRoot, 'dist', 'tree-doctor-pdf-qa.db');
const distDir = path.join(projectRoot, 'dist');

// dist 디렉토리가 없으면 생성
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// 데이터베이스 파일 복사
try {
  if (fs.existsSync(sourceDb)) {
    fs.copyFileSync(sourceDb, targetDb);
    console.log('✅ Database file copied to dist/');
  } else {
    console.log('⚠️  Source database not found, skipping copy');
  }
} catch (error) {
  console.error('❌ Error copying database:', error.message);
  // 오류가 발생해도 빌드는 계속 진행
}