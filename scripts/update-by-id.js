#!/usr/bin/env node

/**
 * ID를 사용한 직접 교재 분류 업데이트
 */

import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'tree-doctor-pdf-qa.db');
const db = new sqlite3.Database(dbPath);

console.log('📚 ID 기반 교재 분류 업데이트 시작...\n');

// 먼저 모든 교재 목록 가져오기
db.all(
  `SELECT id, title FROM textbooks WHERE processing_method = 'pdf_extract' ORDER BY id`,
  (err, textbooks) => {
    if (err) {
      console.error('교재 조회 오류:', err);
      db.close();
      return;
    }
    
    console.log('📖 교재 목록 확인 및 분류:\n');
    
    // 각 교재를 수동으로 분류
    const classifications = textbooks.map(book => {
      console.log(`ID ${book.id}: ${book.title}`);
      
      const title = book.title.toLowerCase();
      let category = '기타';
      
      // 수목생리학
      if (title.includes('생리학') && title.includes('기초')) {
        category = '수목생리학';
      } else if (title.includes('수목생리학')) {
        category = '수목생리학';
      }
      // 수목병리학
      else if (title.includes('식물병리학')) {
        category = '수목병리학';
      } else if (title.includes('수목병리학')) {
        category = '수목병리학';
      } else if (title.includes('수목') && title.includes('병해충')) {
        category = '수목병리학';
      } else if (title.includes('병해편')) {
        category = '수목병리학';
      }
      // 수목해충학
      else if (title.includes('해충편')) {
        category = '수목해충학';
      }
      // 토양학
      else if (title.includes('토양학')) {
        category = '토양학';
      }
      // 산림보호학
      else if (title.includes('산림보호학')) {
        category = '산림보호학';
      }
      // 수목진단
      else if (title.includes('수목진단')) {
        category = '수목진단';
      }
      // 수목의학
      else if (title.includes('수목의학')) {
        category = '수목의학';
      }
      // 식물학
      else if (title.includes('일반식물학')) {
        category = '일반식물학';
      } else if (title.includes('식물형태학')) {
        category = '식물형태학';
      }
      // 기출문제
      else if (title.includes('필기') && (title.includes('나무쌤') || title.includes('시대에듀'))) {
        category = '기출문제';
      }
      // 2차시험
      else if (title.includes('2차') && (title.includes('서술') || title.includes('고사'))) {
        category = '2차시험';
      }
      
      console.log(`  → 분류: ${category}\n`);
      
      return { id: book.id, category };
    });
    
    // 업데이트 실행
    let updateCount = 0;
    const updates = classifications.map(({ id, category }) => {
      return new Promise((resolve) => {
        db.run(
          `UPDATE textbooks SET subject = ? WHERE id = ?`,
          [category, id],
          function(err) {
            if (err) {
              console.error(`❌ ID ${id} 업데이트 오류:`, err);
            } else if (this.changes > 0) {
              updateCount++;
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
                
                db.close();
                console.log('\n🎉 교재 분류 업데이트 완료!');
              }
            );
          });
        }
      );
    });
  }
);