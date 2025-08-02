#!/usr/bin/env node

import { TextbookManager } from '../dist/textbook-manager.js';
import { DatabaseManager } from '../dist/database.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function loadTextbooks() {
  const directoryPath = process.argv[2];
  
  if (!directoryPath) {
    console.error('❌ 사용법: node scripts/load-textbooks.js <교재_디렉토리_경로>');
    console.error('예: node scripts/load-textbooks.js ./textbooks');
    process.exit(1);
  }
  
  console.log('🌳 나무의사 교재 로드 시작...\n');
  
  try {
    // 디렉토리 확인
    await fs.access(directoryPath);
    const stats = await fs.stat(directoryPath);
    if (!stats.isDirectory()) {
      throw new Error('지정된 경로가 디렉토리가 아닙니다.');
    }
    
    // 데이터베이스 초기화
    const dbPath = path.join(__dirname, '..', 'tree-doctor-pdf-qa.db');
    const db = new DatabaseManager(dbPath);
    await db.initialize();
    
    // 교재 관리자 초기화
    const textbookManager = new TextbookManager(db);
    
    // 교재 로드
    console.log(`📁 디렉토리: ${directoryPath}`);
    console.log('📚 교재 로드 중...\n');
    
    const result = await textbookManager.loadTextbooks(directoryPath);
    
    if (result.success) {
      console.log('\n✅ 교재 로드 완료!');
      console.log(`📊 로드된 교재: ${result.loadedCount}개`);
      
      if (result.errors && result.errors.length > 0) {
        console.log(`\n⚠️  오류 발생: ${result.errors.length}개`);
        result.errors.forEach(error => {
          console.log(`   - ${error}`);
        });
      }
      
      // 통계 출력
      const stats = await textbookManager.getTextbookStats();
      console.log('\n📈 교재 통계:');
      console.log(`   총 교재 수: ${stats.totalTextbooks}개`);
      console.log(`   총 페이지 수: ${stats.totalPages}페이지`);
      console.log(`   과목별 교재:`);
      Object.entries(stats.bySubject).forEach(([subject, count]) => {
        console.log(`   - ${subject}: ${count}개`);
      });
      
    } else {
      console.error('❌ 교재 로드 실패');
      if (result.errors) {
        result.errors.forEach(error => {
          console.error(`   - ${error}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    process.exit(1);
  }
}

// 스크립트 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  loadTextbooks();
}