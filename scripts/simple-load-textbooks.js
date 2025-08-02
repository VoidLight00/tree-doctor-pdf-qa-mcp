#!/usr/bin/env node

import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function loadTextbooks() {
  const directoryPath = process.argv[2];
  
  if (!directoryPath) {
    console.error('❌ 사용법: node scripts/simple-load-textbooks.js <교재_디렉토리_경로>');
    console.error('예: node scripts/simple-load-textbooks.js ./textbooks');
    process.exit(1);
  }
  
  console.log('🌳 나무의사 교재 정보 로드 시작...\n');
  
  try {
    // 디렉토리 확인
    await fs.access(directoryPath);
    const stats = await fs.stat(directoryPath);
    if (!stats.isDirectory()) {
      throw new Error('지정된 경로가 디렉토리가 아닙니다.');
    }
    
    // 데이터베이스 연결
    const dbPath = path.join(__dirname, '..', 'tree-doctor-pdf-qa.db');
    const sqlite = sqlite3.verbose();
    
    const db = new sqlite.Database(dbPath, async (err) => {
      if (err) {
        console.error('❌ 데이터베이스 연결 오류:', err);
        process.exit(1);
      }
      
      console.log(`📁 디렉토리: ${directoryPath}`);
      console.log('📚 PDF 파일 검색 중...\n');
      
      // PDF 파일 찾기
      const pdfFiles = await findPdfFiles(directoryPath);
      console.log(`찾은 PDF 파일: ${pdfFiles.length}개\n`);
      
      let successCount = 0;
      
      // 각 PDF를 데이터베이스에 등록
      for (const pdfFile of pdfFiles) {
        const title = path.basename(pdfFile, '.pdf');
        const subject = guessSubject(title);
        
        await new Promise((resolve, reject) => {
          db.run(
            `INSERT OR IGNORE INTO textbooks (title, subject, file_path) VALUES (?, ?, ?)`,
            [title, subject, pdfFile],
            function(err) {
              if (err) {
                console.error(`❌ ${title} 등록 실패:`, err.message);
                resolve();
              } else if (this.changes > 0) {
                console.log(`✅ ${title} (${subject}) 등록 완료`);
                successCount++;
                resolve();
              } else {
                console.log(`⏭️  ${title} (이미 등록됨)`);
                resolve();
              }
            }
          );
        });
      }
      
      console.log(`\n✅ 교재 로드 완료!`);
      console.log(`📊 신규 등록: ${successCount}개`);
      
      // 통계 출력
      db.get(`SELECT COUNT(*) as total FROM textbooks`, (err, row) => {
        if (!err && row) {
          console.log(`📚 전체 교재: ${row.total}개`);
        }
        
        db.all(`SELECT subject, COUNT(*) as count FROM textbooks GROUP BY subject`, (err, rows) => {
          if (!err && rows) {
            console.log('\n📈 과목별 교재:');
            rows.forEach(row => {
              console.log(`   - ${row.subject}: ${row.count}개`);
            });
          }
          
          db.close();
        });
      });
    });
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    process.exit(1);
  }
}

async function findPdfFiles(dir, fileList = []) {
  const files = await fs.readdir(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = await fs.stat(filePath);
    
    if (stat.isDirectory()) {
      await findPdfFiles(filePath, fileList);
    } else if (file.toLowerCase().endsWith('.pdf')) {
      fileList.push(filePath);
    }
  }
  
  return fileList;
}

function guessSubject(title) {
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes('생리') || lowerTitle.includes('physiology')) {
    return '수목생리학';
  } else if (lowerTitle.includes('병리') || lowerTitle.includes('병해') || lowerTitle.includes('pathology')) {
    return '수목병리학';
  } else if (lowerTitle.includes('해충') || lowerTitle.includes('충해') || lowerTitle.includes('entomology')) {
    return '수목해충학';
  } else if (lowerTitle.includes('토양') || lowerTitle.includes('soil')) {
    return '토양학';
  } else if (lowerTitle.includes('관리') || lowerTitle.includes('재배') || lowerTitle.includes('management')) {
    return '수목관리학';
  } else if (lowerTitle.includes('법') || lowerTitle.includes('법규') || lowerTitle.includes('law')) {
    return '나무의사 관련 법규';
  } else if (lowerTitle.includes('농약') || lowerTitle.includes('pesticide')) {
    return '농약학';
  } else {
    return '일반';
  }
}

// 스크립트 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  loadTextbooks();
}