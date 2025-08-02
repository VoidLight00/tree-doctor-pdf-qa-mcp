#!/usr/bin/env node

/**
 * 직접 SQL로 교재 분류 업데이트
 */

import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'tree-doctor-pdf-qa.db');
const db = new sqlite3.Database(dbPath);

console.log('📚 직접 SQL로 교재 분류 업데이트 시작...\n');

// 각 교재별로 직접 UPDATE
const updates = [
  // 수목생리학
  { pattern: '%기초 수목 생리학%', category: '수목생리학' },
  { pattern: '%수목생리학%전면개정판%', category: '수목생리학' },
  
  // 수목병리학
  { pattern: '%식물병리학%제5판%', category: '수목병리학' },
  { pattern: '%신고 수목병리학%제4판%', category: '수목병리학' },
  { pattern: '%알기 쉬운 생활 속 수목 병해충%', category: '수목병리학' },
  { pattern: '%나무쌤%2차 병해편%', category: '수목병리학' },
  
  // 수목해충학
  { pattern: '%나무쌤%2차 해충편%', category: '수목해충학' },
  
  // 토양학
  { pattern: '%토양학%김계훈%', category: '토양학' },
  
  // 산림보호학
  { pattern: '%삼고 산림보호학%', category: '산림보호학' },
  
  // 수목진단
  { pattern: '%사례로 보는 수목진단%', category: '수목진단' },
  
  // 수목의학
  { pattern: '%수목의학%2차 수정판%', category: '수목의학' },
  
  // 식물학
  { pattern: '%일반식물학%제2판%', category: '일반식물학' },
  { pattern: '%식물형태학%새롭고 알기 쉬운%', category: '식물형태학' },
  
  // 기출문제
  { pattern: '%유튜버 나무쌤 나무의사 필기%', category: '기출문제' },
  { pattern: '%시대에듀 나무의사 필기 기출문제해설%', category: '기출문제' },
  { pattern: '%나무쌤필기.압축%', category: '기출문제' },
  
  // 2차시험
  { pattern: '%나무의사 2차 서술고사%', category: '2차시험' },
  { pattern: '%나무쌤%2차 서술형%', category: '2차시험' }
];

let totalUpdated = 0;

// 각 패턴에 대해 UPDATE 실행
Promise.all(updates.map(({ pattern, category }) => {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE textbooks 
       SET subject = ? 
       WHERE title LIKE ? AND processing_method = 'pdf_extract'`,
      [category, pattern],
      function(err) {
        if (err) {
          console.error(`❌ 오류 (${pattern}):`, err);
          reject(err);
        } else {
          if (this.changes > 0) {
            console.log(`✅ ${category}: ${this.changes}개 교재 업데이트됨`);
            totalUpdated += this.changes;
          }
          resolve();
        }
      }
    );
  });
}))
.then(() => {
  console.log(`\n✅ 총 ${totalUpdated}개 교재 분류 업데이트 완료`);
  
  // 결과 확인
  db.all(
    `SELECT subject, COUNT(*) as count 
     FROM textbooks 
     WHERE processing_method = 'pdf_extract' 
     GROUP BY subject 
     ORDER BY count DESC`,
    (err, rows) => {
      if (err) {
        console.error('통계 조회 오류:', err);
      } else {
        console.log('\n📊 최종 분류 현황:');
        rows.forEach(row => {
          console.log(`- ${row.subject}: ${row.count}권`);
        });
      }
      
      // 검색 인덱스 업데이트
      console.log('\n🔍 검색 인덱스 업데이트 중...');
      db.run(
        `DELETE FROM textbook_search_fts`,
        () => {
          db.run(
            `INSERT INTO textbook_search_fts (textbook_name, subject, content)
             SELECT t.title, t.subject, tc.content
             FROM textbooks t
             JOIN textbook_contents tc ON t.id = tc.textbook_id
             WHERE t.processing_method = 'pdf_extract'`,
            (err) => {
              if (err) {
                console.error('검색 인덱스 업데이트 오류:', err);
              } else {
                console.log('✅ 검색 인덱스 업데이트 완료');
              }
              
              db.close();
              console.log('\n🎉 교재 분류 업데이트 완료!');
            }
          );
        }
      );
    }
  );
})
.catch(err => {
  console.error('업데이트 실패:', err);
  db.close();
});