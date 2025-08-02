#!/usr/bin/env node

/**
 * 수동 ID 매핑으로 교재 분류 업데이트
 */

import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'tree-doctor-pdf-qa.db');
const db = new sqlite3.Database(dbPath);

console.log('📚 수동 매핑으로 교재 분류 업데이트 시작...\n');

// 직접 확인한 ID와 카테고리 매핑
const manualMappings = [
  { id: 1, category: '수목생리학' },   // 기초 수목 생리학
  { id: 2, category: '수목병리학' },   // 식물병리학 - 제5판
  { id: 3, category: '식물형태학' },   // 식물형태학
  { id: 4, category: '수목병리학' },   // 알기 쉬운 생활 속 수목 병해충
  { id: 5, category: '일반식물학' },   // 일반식물학 - 제2판
  { id: 6, category: '기출문제' },     // 유튜버 나무쌤 나무의사 필기
  { id: 7, category: '기출문제' },     // 시대에듀 나무의사 필기 기출문제해설
  { id: 8, category: '토양학' },       // 토양학 (김계훈 외)
  { id: 9, category: '산림보호학' },   // 삼고 산림보호학
  { id: 10, category: '수목병리학' },  // 신고 수목병리학 - 제4판
  { id: 11, category: '수목진단' },    // 사례로 보는 수목진단 이야기
  { id: 12, category: '수목병리학' },  // 나무쌤의 나무의사 2차 병해편
  { id: 13, category: '2차시험' },     // 나무쌤의 나무의사 2차 서술형
  { id: 14, category: '수목해충학' },  // 나무쌤의 나무의사 2차 해충편
  { id: 15, category: '기출문제' },    // 나무쌤필기.압축
  { id: 16, category: '2차시험' },     // 나무의사 2차 서술고사
  { id: 17, category: '수목생리학' },  // 수목생리학 - 전면개정판
  { id: 18, category: '수목의학' }     // 수목의학 - 2차 수정판
];

// 업데이트 실행
let updateCount = 0;
const updates = manualMappings.map(({ id, category }) => {
  return new Promise((resolve) => {
    db.run(
      `UPDATE textbooks SET subject = ? WHERE id = ?`,
      [category, id],
      function(err) {
        if (err) {
          console.error(`❌ ID ${id} 업데이트 오류:`, err);
        } else if (this.changes > 0) {
          updateCount++;
          console.log(`✅ ID ${id} → ${category}`);
        }
        resolve();
      }
    );
  });
});

Promise.all(updates).then(() => {
  console.log(`\n✅ 총 ${updateCount}개 교재 분류 업데이트 완료`);
  
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
      db.run(`DELETE FROM textbook_search_fts`, () => {
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
            
            // 업데이트된 교재 목록 확인
            db.all(
              `SELECT id, title, subject FROM textbooks WHERE processing_method = 'pdf_extract' ORDER BY subject, id`,
              (err, books) => {
                if (!err) {
                  console.log('\n📚 업데이트된 교재 목록:');
                  let currentSubject = '';
                  books.forEach(book => {
                    if (book.subject !== currentSubject) {
                      currentSubject = book.subject;
                      console.log(`\n[${currentSubject}]`);
                    }
                    console.log(`  ${book.id}. ${book.title}`);
                  });
                }
                
                db.close();
                console.log('\n🎉 교재 분류 업데이트 완료!');
                console.log('\n이제 과목별로 교재를 검색할 수 있습니다:');
                console.log('- "수목생리학 교재에서 광합성 찾아줘"');
                console.log('- "수목병리학 관련 내용 검색해줘"');
                console.log('- "토양학 pH 관련 설명"');
              }
            );
          }
        );
      });
    }
  );
});