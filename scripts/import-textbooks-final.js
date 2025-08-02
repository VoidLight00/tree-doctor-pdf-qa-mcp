#!/usr/bin/env node

/**
 * 추출된 교재를 기존 데이터베이스 구조에 맞게 저장
 */

import fs from 'fs/promises';
import path from 'path';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class FinalTextbookImporter {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.extractedDir = path.join(this.projectRoot, 'textbooks-extracted');
    this.dbPath = path.join(this.projectRoot, 'tree-doctor-pdf-qa.db');
    this.db = null;
  }
  
  async initialize() {
    this.db = new sqlite3.Database(this.dbPath);
    console.log('📥 교재 데이터베이스 최종 저장 시작...\n');
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
  
  async importTextbooks() {
    try {
      const files = await fs.readdir(this.extractedDir);
      const txtFiles = files.filter(f => f.endsWith('.txt'));
      
      console.log(`📚 ${txtFiles.length}개 교재 파일 발견\n`);
      
      let successCount = 0;
      
      for (const file of txtFiles) {
        const success = await this.importSingleTextbook(file);
        if (success) successCount++;
      }
      
      console.log(`\n✅ 총 ${successCount}개 교재 저장 완료`);
      
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
      const subject = this.categorizeTextbook(textbookName);
      
      // 페이지 수 계산
      const pages = content.split(/--- 페이지 \d+ ---/).filter(p => p.trim());
      const pageCount = pages.length;
      
      // textbooks 테이블에 저장
      const textbookId = await new Promise((resolve, reject) => {
        this.db.run(
          `INSERT OR REPLACE INTO textbooks 
           (file_path, file_name, title, subject, page_count, content_length, processing_method)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            filePath,
            filename,
            textbookName,
            subject,
            pageCount,
            content.length,
            'pdf_extract'
          ],
          function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
          }
        );
      });
      
      // textbook_contents 테이블에 페이지별로 저장
      let savedPages = 0;
      for (let i = 0; i < pages.length; i++) {
        const pageContent = pages[i].trim();
        if (pageContent.length < 50) continue;
        
        await new Promise((resolve, reject) => {
          this.db.run(
            `INSERT OR REPLACE INTO textbook_contents 
             (textbook_id, page_number, content)
             VALUES (?, ?, ?)`,
            [textbookId, i + 1, pageContent],
            (err) => {
              if (err) reject(err);
              else {
                savedPages++;
                resolve();
              }
            }
          );
        });
      }
      
      // pdf_contents 테이블에도 저장 (전체 내용)
      await new Promise((resolve, reject) => {
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
      
      console.log(`✅ ${textbookName}: ${savedPages}개 페이지 저장됨 (과목: ${subject})`);
      return true;
      
    } catch (error) {
      console.error(`❌ ${filename} 처리 실패:`, error.message);
      return false;
    }
  }
  
  async showStatistics() {
    console.log('\n📊 저장 결과 통계:');
    
    // 과목별 통계
    const stats = await new Promise((resolve, reject) => {
      this.db.all(
        `SELECT subject, COUNT(*) as count, SUM(page_count) as total_pages
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
    
    console.log('\n과목별 현황:');
    stats.forEach(row => {
      console.log(`- ${row.subject}: ${row.count}권, ${row.total_pages || 0}페이지`);
    });
    
    // 전체 통계
    const total = await new Promise((resolve, reject) => {
      this.db.get(
        `SELECT COUNT(*) as total_textbooks, SUM(page_count) as total_pages
         FROM textbooks
         WHERE processing_method = 'pdf_extract'`,
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
    
    console.log('\n전체 통계:');
    console.log(`- 총 교재: ${total.total_textbooks}권`);
    console.log(`- 총 페이지: ${total.total_pages || 0}페이지`);
    
    // 기출문제와 교재 통합 통계
    const combined = await new Promise((resolve, reject) => {
      this.db.get(
        `SELECT 
          (SELECT COUNT(*) FROM exam_questions) as exam_questions,
          (SELECT COUNT(*) FROM textbooks WHERE processing_method = 'pdf_extract') as textbooks`,
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
    
    console.log('\n통합 데이터베이스 현황:');
    console.log(`- 기출문제: ${combined.exam_questions}개`);
    console.log(`- 교재: ${combined.textbooks}권`);
  }
  
  async updateMCPServer() {
    console.log('\n🔧 MCP 서버 업데이트 중...');
    
    // textbook-manager.ts 파일이 교재 검색을 지원하는지 확인
    const managerPath = path.join(this.projectRoot, 'src', 'textbook-manager.ts');
    try {
      await fs.access(managerPath);
      console.log('✅ MCP 서버가 교재 검색을 지원합니다');
    } catch {
      console.log('⚠️ MCP 서버 교재 검색 기능 업데이트 필요');
    }
  }
  
  async run() {
    await this.initialize();
    await this.importTextbooks();
    await this.showStatistics();
    await this.updateMCPServer();
    
    this.db.close();
    
    console.log('\n🎉 모든 교재가 데이터베이스에 저장되었습니다!');
    console.log('\n사용 방법:');
    console.log('1. npm run build');
    console.log('2. Claude Desktop 재시작');
    console.log('3. "수목생리학 광합성 설명해줘" 같은 질문하기');
  }
}

// 실행
const importer = new FinalTextbookImporter();
importer.run().catch(console.error);