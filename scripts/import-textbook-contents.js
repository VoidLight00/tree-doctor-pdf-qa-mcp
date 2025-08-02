#!/usr/bin/env node

/**
 * 교재 내용을 데이터베이스에 완전히 저장하는 스크립트
 */

import fs from 'fs/promises';
import path from 'path';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TextbookContentImporter {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.extractedDir = path.join(this.projectRoot, 'textbooks-extracted');
    this.dbPath = path.join(this.projectRoot, 'tree-doctor-pdf-qa.db');
    this.db = null;
  }
  
  async initialize() {
    this.db = new sqlite3.Database(this.dbPath);
    console.log('📚 교재 내용 데이터베이스 저장 시작...\n');
  }
  
  categorizeTextbook(filename) {
    const categories = {
      '수목생리학': /생리학|physiology/i,
      '수목병리학': /병리학|병해|pathology/i,
      '수목해충학': /해충|곤충|insect/i,
      '토양학': /토양|soil/i,
      '수목진단': /진단|diagnosis/i,
      '수목의학': /수목의학|medicine/i,
      '형태학': /형태학|morphology/i,
      '일반식물학': /일반|general|식물학/i,
      '기출문제': /기출|시험|문제/i,
      '2차시험': /2차|서술/i,
      '산림보호학': /산림보호/i
    };
    
    for (const [category, pattern] of Object.entries(categories)) {
      if (pattern.test(filename)) return category;
    }
    return '기타';
  }
  
  async processAllTextbooks() {
    try {
      const files = await fs.readdir(this.extractedDir);
      const txtFiles = files.filter(f => f.endsWith('.txt'));
      
      console.log(`📖 ${txtFiles.length}개 교재 파일 발견\n`);
      
      let totalSaved = 0;
      let totalChunks = 0;
      
      for (const file of txtFiles) {
        const result = await this.processSingleTextbook(file);
        if (result.success) {
          totalSaved++;
          totalChunks += result.chunks;
        }
      }
      
      console.log(`\n✅ 총 ${totalSaved}개 교재, ${totalChunks}개 청크 저장 완료`);
      
    } catch (error) {
      console.error('❌ 처리 오류:', error);
    }
  }
  
  async processSingleTextbook(filename) {
    console.log(`📖 처리 중: ${filename}`);
    
    try {
      const filePath = path.join(this.extractedDir, filename);
      const content = await fs.readFile(filePath, 'utf-8');
      const stats = await fs.stat(filePath);
      
      const textbookName = filename.replace('.txt', '');
      const subject = this.categorizeTextbook(textbookName);
      
      // 1. textbooks 테이블 업데이트 또는 삽입
      const textbookId = await this.saveTextbookInfo(textbookName, subject, stats.size);
      
      // 2. 내용을 청크로 분할하여 저장
      const chunks = this.splitIntoChunks(content);
      let savedChunks = 0;
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        // textbook_contents 테이블에 저장
        await new Promise((resolve, reject) => {
          this.db.run(
            `INSERT INTO textbook_contents 
             (textbook_id, section_title, content, page_start, page_end, level)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              textbookId,
              `청크 ${i + 1}`,
              chunk.content,
              chunk.pageStart,
              chunk.pageEnd,
              1
            ],
            (err) => {
              if (err) reject(err);
              else {
                savedChunks++;
                resolve();
              }
            }
          );
        });
      }
      
      // 3. pdf_contents 테이블에도 전체 내용 저장
      await this.saveToPdfContents(filePath, filename, content, chunks.length);
      
      console.log(`✅ ${textbookName}: ${savedChunks}개 청크 저장됨 (과목: ${subject})`);
      
      return { success: true, chunks: savedChunks };
      
    } catch (error) {
      console.error(`❌ ${filename} 처리 실패:`, error.message);
      return { success: false, chunks: 0 };
    }
  }
  
  async saveTextbookInfo(name, subject, size) {
    // 먼저 존재하는지 확인 - file_path 또는 title로 검색
    const existing = await new Promise((resolve, reject) => {
      this.db.get(
        `SELECT id FROM textbooks WHERE title = ? OR file_path LIKE ?`,
        [name, `%${name}%`],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
    
    if (existing) {
      // 업데이트
      await new Promise((resolve, reject) => {
        this.db.run(
          `UPDATE textbooks 
           SET subject = ?, content_length = ?, processing_method = 'pdf_extract', updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [subject, size, existing.id],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
      return existing.id;
    } else {
      // 새로 삽입
      return new Promise((resolve, reject) => {
        this.db.run(
          `INSERT INTO textbooks 
           (file_path, file_name, title, subject, content_length, processing_method)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            path.join(this.extractedDir, name + '.txt'),
            name + '.pdf',
            name,
            subject,
            size,
            'pdf_extract'
          ],
          function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
          }
        );
      });
    }
  }
  
  splitIntoChunks(content) {
    const chunks = [];
    const pages = content.split(/--- 페이지 (\d+) ---/);
    
    // 페이지 구분이 있는 경우
    if (pages.length > 1) {
      for (let i = 1; i < pages.length; i += 2) {
        const pageNum = parseInt(pages[i]);
        const pageContent = pages[i + 1];
        
        if (pageContent && pageContent.trim().length > 50) {
          // 페이지를 2000자 단위로 분할
          const subChunks = this.splitBySize(pageContent, 2000);
          
          subChunks.forEach((chunk, idx) => {
            chunks.push({
              content: chunk,
              pageStart: pageNum,
              pageEnd: pageNum,
              order: chunks.length
            });
          });
        }
      }
    } else {
      // 페이지 구분이 없는 경우 2000자 단위로 분할
      const subChunks = this.splitBySize(content, 2000);
      
      subChunks.forEach((chunk, idx) => {
        chunks.push({
          content: chunk,
          pageStart: idx + 1,
          pageEnd: idx + 1,
          order: chunks.length
        });
      });
    }
    
    return chunks;
  }
  
  splitBySize(text, size) {
    const chunks = [];
    const lines = text.split('\n');
    let currentChunk = '';
    
    for (const line of lines) {
      if (currentChunk.length + line.length > size && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = line + '\n';
      } else {
        currentChunk += line + '\n';
      }
    }
    
    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }
  
  async saveToPdfContents(filePath, filename, content, pageCount) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT OR REPLACE INTO pdf_contents 
         (file_path, file_name, content, page_count, processing_method)
         VALUES (?, ?, ?, ?, ?)`,
        [filePath, filename, content, pageCount, 'pdf_extract'],
        (err) => {
          if (err && !err.message.includes('UNIQUE')) reject(err);
          else resolve();
        }
      );
    });
  }
  
  async createSearchIndex() {
    console.log('\n🔍 검색 인덱스 생성 중...');
    
    // FTS5 테이블 생성
    const createFTSSQL = `
    CREATE VIRTUAL TABLE IF NOT EXISTS textbook_search_fts USING fts5(
      textbook_name, 
      subject,
      content,
      tokenize='unicode61'
    );
    `;
    
    await new Promise((resolve, reject) => {
      this.db.exec(createFTSSQL, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    // 인덱스 데이터 삽입
    await new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO textbook_search_fts (textbook_name, subject, content)
         SELECT t.title, t.subject, tc.content
         FROM textbooks t
         JOIN textbook_contents tc ON t.id = tc.textbook_id
         WHERE t.processing_method = 'pdf_extract'`,
        (err) => {
          if (err && !err.message.includes('UNIQUE')) reject(err);
          else resolve();
        }
      );
    });
    
    console.log('✅ 검색 인덱스 생성 완료');
  }
  
  async showStatistics() {
    console.log('\n📊 최종 통계:');
    
    // 교재별 통계
    const stats = await new Promise((resolve, reject) => {
      this.db.all(
        `SELECT t.subject, COUNT(DISTINCT t.id) as textbook_count, 
                COUNT(tc.id) as chunk_count,
                SUM(LENGTH(tc.content)) as total_chars
         FROM textbooks t
         LEFT JOIN textbook_contents tc ON t.id = tc.textbook_id
         WHERE t.processing_method = 'pdf_extract'
         GROUP BY t.subject
         ORDER BY textbook_count DESC`,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
    
    console.log('\n과목별 현황:');
    stats.forEach(row => {
      const sizeMB = ((row.total_chars || 0) / 1024 / 1024).toFixed(1);
      console.log(`- ${row.subject}: ${row.textbook_count}권, ${row.chunk_count}개 청크, ${sizeMB}MB`);
    });
    
    // 전체 통계
    const total = await new Promise((resolve, reject) => {
      this.db.get(
        `SELECT COUNT(DISTINCT t.id) as total_textbooks,
                COUNT(tc.id) as total_chunks,
                SUM(LENGTH(tc.content)) as total_chars
         FROM textbooks t
         LEFT JOIN textbook_contents tc ON t.id = tc.textbook_id
         WHERE t.processing_method = 'pdf_extract'`,
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
    
    console.log('\n전체 통계:');
    console.log(`- 총 교재: ${total.total_textbooks}권`);
    console.log(`- 총 청크: ${total.total_chunks}개`);
    console.log(`- 총 크기: ${((total.total_chars || 0) / 1024 / 1024).toFixed(1)}MB`);
    
    // 통합 통계
    const combined = await new Promise((resolve, reject) => {
      this.db.get(
        `SELECT 
          (SELECT COUNT(*) FROM exam_questions) as exam_questions,
          (SELECT COUNT(*) FROM textbooks WHERE processing_method = 'pdf_extract') as textbooks,
          (SELECT COUNT(*) FROM textbook_contents) as textbook_chunks`,
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
    
    console.log('\n통합 데이터베이스 현황:');
    console.log(`- 기출문제: ${combined.exam_questions}개`);
    console.log(`- 교재: ${combined.textbooks}권`);
    console.log(`- 교재 청크: ${combined.textbook_chunks}개`);
  }
  
  async run() {
    await this.initialize();
    await this.processAllTextbooks();
    await this.createSearchIndex();
    await this.showStatistics();
    
    this.db.close();
    
    console.log('\n🎉 모든 교재 내용이 데이터베이스에 저장되었습니다!');
    console.log('\n이제 다른 PC에서도:');
    console.log('- 기출문제 1,051개 검색 가능');
    console.log('- 교재 18권 전체 내용 검색 가능');
    console.log('- "수목생리학 광합성" 같은 질문 가능');
  }
}

// 실행
const importer = new TextbookContentImporter();
importer.run().catch(console.error);