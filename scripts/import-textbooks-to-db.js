#!/usr/bin/env node

/**
 * 추출된 교재 텍스트를 데이터베이스에 저장
 */

import fs from 'fs/promises';
import path from 'path';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TextbookImporter {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.extractedDir = path.join(this.projectRoot, 'textbooks-extracted');
    this.dbPath = path.join(this.projectRoot, 'tree-doctor-pdf-qa.db');
    this.db = null;
  }
  
  async initialize() {
    this.db = new sqlite3.Database(this.dbPath);
    console.log('📥 교재 데이터베이스 저장 시작...\n');
    
    // 테이블 생성
    await this.createTables();
  }
  
  async createTables() {
    const createSQL = `
    -- 교재 정보 테이블
    CREATE TABLE IF NOT EXISTS textbooks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      category TEXT,
      file_size INTEGER,
      extracted_size INTEGER,
      page_count INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- 교재 내용 테이블
    CREATE TABLE IF NOT EXISTS textbook_contents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      textbook_id INTEGER NOT NULL,
      page_number INTEGER,
      content TEXT NOT NULL,
      char_count INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (textbook_id) REFERENCES textbooks(id)
    );
    
    -- 인덱스
    CREATE INDEX IF NOT EXISTS idx_textbook_category ON textbooks(category);
    CREATE INDEX IF NOT EXISTS idx_content_textbook ON textbook_contents(textbook_id);
    CREATE INDEX IF NOT EXISTS idx_content_page ON textbook_contents(page_number);
    
    -- FTS5 검색 테이블
    CREATE VIRTUAL TABLE IF NOT EXISTS textbook_search USING fts5(
      textbook_name, content, 
      content=textbook_contents,
      tokenize='unicode61'
    );
    `;
    
    return new Promise((resolve, reject) => {
      this.db.exec(createSQL, (err) => {
        if (err) {
          console.error('❌ 테이블 생성 실패:', err);
          reject(err);
        } else {
          console.log('✅ 테이블 생성 완료');
          resolve();
        }
      });
    });
  }
  
  categorizeTextbook(filename) {
    const categories = {
      '생리학': /생리학|physiology/i,
      '병리학': /병리학|병해|pathology/i,
      '해충학': /해충|곤충|insect/i,
      '토양학': /토양|soil/i,
      '수목진단': /진단|diagnosis/i,
      '수목의학': /수목의학|medicine/i,
      '형태학': /형태학|morphology/i,
      '일반': /일반|general/i,
      '기출문제': /기출|시험|문제/i,
      '2차시험': /2차|서술/i
    };
    
    for (const [category, pattern] of Object.entries(categories)) {
      if (pattern.test(filename)) return category;
    }
    return '기타';
  }
  
  async importTextbooks() {
    try {
      const files = await fs.readdir(this.extractedDir);
      const txtFiles = files.filter(f => f.endsWith('.txt'));
      
      console.log(`📚 ${txtFiles.length}개 교재 파일 발견\n`);
      
      for (const file of txtFiles) {
        await this.importSingleTextbook(file);
      }
      
      // FTS 인덱스 재구축
      await this.rebuildFTSIndex();
      
    } catch (error) {
      console.error('❌ 가져오기 오류:', error);
    }
  }
  
  async importSingleTextbook(filename) {
    console.log(`📖 처리 중: ${filename}`);
    
    try {
      const filePath = path.join(this.extractedDir, filename);
      const content = await fs.readFile(filePath, 'utf-8');
      const stats = await fs.stat(filePath);
      
      const textbookName = filename.replace('.txt', '');
      const category = this.categorizeTextbook(textbookName);
      
      // 페이지별로 분할
      const pages = content.split(/--- 페이지 \d+ ---/).filter(p => p.trim());
      
      // 교재 정보 저장
      const textbookId = await new Promise((resolve, reject) => {
        this.db.run(
          `INSERT OR REPLACE INTO textbooks (name, category, extracted_size, page_count)
           VALUES (?, ?, ?, ?)`,
          [textbookName, category, stats.size, pages.length],
          function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
          }
        );
      });
      
      // 페이지별 내용 저장
      let savedPages = 0;
      for (let i = 0; i < pages.length; i++) {
        const pageContent = pages[i].trim();
        if (pageContent.length < 50) continue; // 너무 짧은 페이지는 제외
        
        await new Promise((resolve, reject) => {
          this.db.run(
            `INSERT INTO textbook_contents (textbook_id, page_number, content, char_count)
             VALUES (?, ?, ?, ?)`,
            [textbookId, i + 1, pageContent, pageContent.length],
            (err) => {
              if (err) reject(err);
              else {
                savedPages++;
                resolve();
              }
            }
          );
        });
        
        // FTS 검색 테이블에도 추가
        await new Promise((resolve, reject) => {
          this.db.run(
            `INSERT INTO textbook_search (textbook_name, content)
             VALUES (?, ?)`,
            [textbookName, pageContent],
            (err) => {
              if (err && !err.message.includes('UNIQUE')) reject(err);
              else resolve();
            }
          );
        });
      }
      
      console.log(`✅ ${textbookName}: ${savedPages}개 페이지 저장됨`);
      
    } catch (error) {
      console.error(`❌ ${filename} 처리 실패:`, error.message);
    }
  }
  
  async rebuildFTSIndex() {
    console.log('\n🔍 검색 인덱스 재구축 중...');
    
    return new Promise((resolve) => {
      this.db.run(
        `INSERT INTO textbook_search(textbook_search) VALUES('rebuild')`,
        (err) => {
          if (err) console.error('인덱스 재구축 실패:', err);
          else console.log('✅ 검색 인덱스 재구축 완료');
          resolve();
        }
      );
    });
  }
  
  async showStatistics() {
    console.log('\n📊 저장 결과 통계:');
    
    // 교재별 통계
    const stats = await new Promise((resolve, reject) => {
      this.db.all(
        `SELECT t.category, COUNT(DISTINCT t.id) as textbook_count, 
                SUM(t.page_count) as total_pages,
                SUM(t.extracted_size) as total_size
         FROM textbooks t
         GROUP BY t.category
         ORDER BY textbook_count DESC`,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
    
    console.log('\n카테고리별 현황:');
    stats.forEach(row => {
      const sizeMB = (row.total_size / 1024 / 1024).toFixed(1);
      console.log(`- ${row.category}: ${row.textbook_count}권, ${row.total_pages}페이지, ${sizeMB}MB`);
    });
    
    // 전체 통계
    const total = await new Promise((resolve, reject) => {
      this.db.get(
        `SELECT COUNT(DISTINCT id) as total_textbooks,
                SUM(page_count) as total_pages,
                SUM(extracted_size) as total_size
         FROM textbooks`,
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
    
    console.log('\n전체 통계:');
    console.log(`- 총 교재: ${total.total_textbooks}권`);
    console.log(`- 총 페이지: ${total.total_pages}페이지`);
    console.log(`- 총 크기: ${(total.total_size / 1024 / 1024).toFixed(1)}MB`);
  }
  
  async run() {
    await this.initialize();
    await this.importTextbooks();
    await this.showStatistics();
    
    this.db.close();
    console.log('\n✅ 모든 교재가 데이터베이스에 저장되었습니다!');
    console.log('이제 다른 PC에서도 교재 내용을 검색할 수 있습니다.');
  }
}

// 실행
const importer = new TextbookImporter();
importer.run().catch(console.error);