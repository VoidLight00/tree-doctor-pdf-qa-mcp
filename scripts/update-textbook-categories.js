#!/usr/bin/env node

/**
 * 원본 파일명 기반 교재 분류 업데이트
 */

import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TextbookCategoryUpdater {
  constructor() {
    this.dbPath = path.join(__dirname, '..', 'tree-doctor-pdf-qa.db');
    this.db = null;
    
    // 파일명 기반 정확한 분류 매핑
    this.categoryMappings = {
      // 수목생리학
      '기초 수목 생리학': '수목생리학',
      '수목생리학 - 전면개정판': '수목생리학',
      
      // 수목병리학
      '식물병리학': '수목병리학',  // 제5판 등도 포함
      '신고 수목병리학': '수목병리학',  // 제4판 등도 포함
      '알기 쉬운 생활 속 수목 병해충': '수목병리학',
      '나무쌤의 나무의사 2차 병해편': '수목병리학',
      
      // 수목해충학
      '나무쌤의 나무의사 2차 해충편': '수목해충학',
      
      // 토양학
      '토양학': '토양학',  // (김계훈 외) 등도 포함
      
      // 산림보호학
      '삼고 산림보호학': '산림보호학',
      '산림보호학': '산림보호학',
      
      // 수목진단
      '사례로 보는 수목진단': '수목진단',
      '수목진단 이야기': '수목진단',
      
      // 수목의학
      '수목의학': '수목의학',  // 2차 수정판 등도 포함
      
      // 식물학
      '일반식물학': '일반식물학',  // 제2판 등도 포함
      '식물형태학': '식물형태학',
      
      // 기출문제/시험대비
      '유튜버 나무쌤 나무의사 필기': '기출문제',
      '나무쌤 나무의사 필기': '기출문제',
      '시대에듀 나무의사 필기 기출문제해설': '기출문제',
      '나무의사 필기 기출문제해설': '기출문제',
      '나무쌤필기': '기출문제',
      
      // 2차시험
      '나무의사 2차 서술고사': '2차시험',
      '나무쌤의 나무의사 2차 서술형': '2차시험',
      '나무의사 2차': '2차시험'
    };
  }
  
  async initialize() {
    this.db = new sqlite3.Database(this.dbPath);
    console.log('📚 교재 분류 업데이트 시작...\n');
  }
  
  async updateCategories() {
    // 현재 교재 목록 가져오기
    const textbooks = await new Promise((resolve, reject) => {
      this.db.all(
        `SELECT id, title, subject FROM textbooks WHERE processing_method = 'pdf_extract'`,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
    
    console.log(`📖 ${textbooks.length}개 교재 분류 중...\n`);
    
    let updateCount = 0;
    
    for (const textbook of textbooks) {
      const newCategory = this.determineCategory(textbook.title);
      
      // 항상 업데이트 (기타에서 다른 카테고리로 변경되도록)
      if (newCategory !== textbook.subject || textbook.subject === '기타') {
        await new Promise((resolve, reject) => {
          this.db.run(
            `UPDATE textbooks SET subject = ? WHERE id = ?`,
            [newCategory, textbook.id],
            (err) => {
              if (err) reject(err);
              else {
                updateCount++;
                console.log(`✅ "${textbook.title}" → ${newCategory} (기존: ${textbook.subject})`);
                resolve();
              }
            }
          );
        });
      } else {
        console.log(`⏭️ "${textbook.title}" → 유지: ${textbook.subject}`);
      }
    }
    
    console.log(`\n✅ ${updateCount}개 교재 분류 업데이트 완료`);
  }
  
  determineCategory(title) {
    // 처리 코드 제거 (_3c_r5_2d 등)
    let cleanTitle = title.replace(/_[0-9a-z]+_[0-9a-z]+_[0-9a-z]+/gi, '')
                         .replace(/\s*\(\d+\)\s*$/, '') // 끝의 (1) 등 제거
                         .trim();
    
    // 앞부분 처리 코드 제거 - 여러 패턴 처리
    cleanTitle = cleanTitle.replace(/^\(.*?\)\s*/, '') // (용지2) 제거
                          .replace(/^\[.*?\]\s*/, '') // [ㅁㅋ] 또는 [2+17] 제거
                          .replace(/^\(.*?\)\s*/, '') // 남은 괄호 한번 더 제거
                          .replace(/^\[.*?\]\s*/, '') // 남은 대괄호 한번 더 제거
                          .trim();
    
    console.log(`  원본: "${title}" → 정제: "${cleanTitle}"`);
    
    // 정확한 매칭 시도
    for (const [keyword, category] of Object.entries(this.categoryMappings)) {
      if (cleanTitle.includes(keyword)) {
        console.log(`    매칭됨! "${keyword}" → ${category}`);
        return category;
      }
    }
    
    // 키워드 기반 분류 (백업)
    const keywordCategories = {
      '수목생리학': ['생리학', '생리'],
      '수목병리학': ['병리학', '병해', '병원'],
      '수목해충학': ['해충', '곤충'],
      '토양학': ['토양'],
      '산림보호학': ['산림보호', '산림'],
      '수목진단': ['진단', '수목진단'],
      '수목의학': ['수목의학'],
      '일반식물학': ['일반식물학', '식물학'],
      '식물형태학': ['형태학', '식물형태'],
      '기출문제': ['기출', '시험', '필기'],
      '2차시험': ['2차', '서술']
    };
    
    for (const [category, keywords] of Object.entries(keywordCategories)) {
      for (const keyword of keywords) {
        if (cleanTitle.includes(keyword)) {
          console.log(`    키워드 매칭! "${keyword}" → ${category}`);
          return category;
        }
      }
    }
    
    console.log(`    매칭 실패 - 기타로 분류`);
    return '기타';
  }
  
  async showUpdatedStats() {
    console.log('\n📊 업데이트된 분류 현황:');
    
    const stats = await new Promise((resolve, reject) => {
      this.db.all(
        `SELECT subject, COUNT(*) as count 
         FROM textbooks 
         WHERE processing_method = 'pdf_extract' 
         GROUP BY subject 
         ORDER BY count DESC`,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
    
    console.log('\n과목별 교재 현황:');
    stats.forEach(row => {
      console.log(`- ${row.subject}: ${row.count}권`);
    });
    
    // 전체 통계
    const total = await new Promise((resolve, reject) => {
      this.db.get(
        `SELECT COUNT(*) as total FROM textbooks WHERE processing_method = 'pdf_extract'`,
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
    
    console.log(`\n총 교재: ${total.total}권`);
  }
  
  async updateSearchIndex() {
    console.log('\n🔍 검색 인덱스 업데이트 중...');
    
    // FTS 테이블 재구축
    await new Promise((resolve, reject) => {
      this.db.run(
        `DELETE FROM textbook_search_fts`,
        (err) => {
          if (err && !err.message.includes('no such table')) reject(err);
          else resolve();
        }
      );
    });
    
    await new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO textbook_search_fts (textbook_name, subject, content)
         SELECT t.title, t.subject, tc.content
         FROM textbooks t
         JOIN textbook_contents tc ON t.id = tc.textbook_id
         WHERE t.processing_method = 'pdf_extract'`,
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
    
    console.log('✅ 검색 인덱스 업데이트 완료');
  }
  
  async run() {
    await this.initialize();
    await this.updateCategories();
    await this.showUpdatedStats();
    await this.updateSearchIndex();
    
    this.db.close();
    
    console.log('\n🎉 교재 분류 업데이트 완료!');
    console.log('\n이제 과목별로 교재를 검색할 수 있습니다:');
    console.log('- "수목생리학 교재에서 광합성 찾아줘"');
    console.log('- "수목병리학 관련 내용 검색해줘"');
    console.log('- "토양학 pH 관련 설명"');
  }
}

// 실행
const updater = new TextbookCategoryUpdater();
updater.run().catch(console.error);