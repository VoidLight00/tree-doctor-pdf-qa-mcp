#!/usr/bin/env node

/**
 * GitHub Release를 위한 데이터베이스 준비 스크립트
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

async function prepareRelease() {
  console.log('🚀 GitHub Release 준비 중...\n');
  
  const dbPath = path.join(projectRoot, 'tree-doctor-pdf-qa.db');
  const releaseDir = path.join(projectRoot, 'release');
  
  // 릴리즈 디렉토리 생성
  await fs.mkdir(releaseDir, { recursive: true });
  
  // 1. 데이터베이스 압축
  console.log('📦 데이터베이스 압축 중...');
  execSync(`cd ${projectRoot} && tar -czf release/tree-doctor-pdf-qa-db.tar.gz tree-doctor-pdf-qa.db`, { stdio: 'inherit' });
  
  // 2. 체크섬 생성
  console.log('\n🔐 체크섬 생성 중...');
  const dbBuffer = await fs.readFile(dbPath);
  const hash = crypto.createHash('sha256');
  hash.update(dbBuffer);
  const checksum = hash.digest('hex');
  
  await fs.writeFile(
    path.join(releaseDir, 'checksum.txt'),
    `tree-doctor-pdf-qa.db SHA256: ${checksum}\n`
  );
  
  // 3. 릴리즈 정보 생성
  const releaseInfo = {
    version: '1.0.0',
    date: new Date().toISOString(),
    database: {
      filename: 'tree-doctor-pdf-qa.db',
      size: dbBuffer.length,
      checksum: checksum,
      contents: {
        exam_questions: 1051,
        textbooks: 18,
        textbook_chunks: 8985
      }
    }
  };
  
  await fs.writeFile(
    path.join(releaseDir, 'release-info.json'),
    JSON.stringify(releaseInfo, null, 2)
  );
  
  console.log('\n✅ 릴리즈 파일 생성 완료!\n');
  console.log('📁 생성된 파일:');
  console.log(`   - release/tree-doctor-pdf-qa-db.tar.gz`);
  console.log(`   - release/checksum.txt`);
  console.log(`   - release/release-info.json`);
  
  console.log('\n📤 GitHub Release 업로드 방법:');
  console.log('1. https://github.com/VoidLight00/tree-doctor-pdf-qa-mcp/releases/new');
  console.log('2. Tag: v1.0.0');
  console.log('3. Title: Database Release v1.0.0');
  console.log('4. 파일 첨부: release/ 폴더의 모든 파일');
  console.log('\n설명:');
  console.log('```');
  console.log('나무의사 PDF Q&A MCP 데이터베이스 릴리즈');
  console.log('');
  console.log('포함 내용:');
  console.log('- 기출문제: 1,051개 (2019-2025년)');
  console.log('- 교재: 18권 (전체 텍스트 추출 완료)');
  console.log('- 데이터베이스 크기: 120MB');
  console.log('');
  console.log('설치 방법:');
  console.log('1. tree-doctor-pdf-qa-db.tar.gz 다운로드');
  console.log('2. 프로젝트 루트에서 압축 해제: tar -xzf tree-doctor-pdf-qa-db.tar.gz');
  console.log('```');
}

prepareRelease().catch(console.error);