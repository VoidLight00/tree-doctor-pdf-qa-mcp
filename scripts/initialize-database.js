#!/usr/bin/env node

import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initializeDatabase() {
  console.log('🌳 나무의사 PDF Q&A 데이터베이스 초기화 시작...\n');
  
  const dbPath = path.join(__dirname, '..', 'tree-doctor-pdf-qa.db');
  
  // sqlite3 모듈 verbose 모드로 설정
  const sqlite = sqlite3.verbose();
  
  return new Promise((resolve, reject) => {
    const db = new sqlite.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ 데이터베이스 연결 오류:', err);
        reject(err);
        return;
      }
      
      console.log('📋 테이블 생성 중...');
      
      // 순차적으로 테이블 생성
      db.serialize(() => {
        // 교재 테이블
        db.run(`
          CREATE TABLE IF NOT EXISTS textbooks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            subject TEXT,
            file_path TEXT NOT NULL,
            total_pages INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);
        
        // 교재 내용 테이블
        db.run(`
          CREATE TABLE IF NOT EXISTS textbook_contents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            textbook_id INTEGER,
            page_number INTEGER,
            section TEXT,
            content TEXT,
            FOREIGN KEY (textbook_id) REFERENCES textbooks(id)
          )
        `);
        
        // PDF 내용 테이블
        db.run(`
          CREATE TABLE IF NOT EXISTS pdf_contents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            file_path TEXT NOT NULL,
            book_title TEXT NOT NULL,
            page INTEGER NOT NULL,
            content TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(file_path, page)
          )
        `);
        
        // 개념 테이블
        db.run(`
          CREATE TABLE IF NOT EXISTS concepts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            keyword TEXT NOT NULL,
            description TEXT NOT NULL,
            subject TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);
        
        // 북마크 테이블
        db.run(`
          CREATE TABLE IF NOT EXISTS bookmarks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            type TEXT NOT NULL CHECK(type IN ('question', 'concept', 'explanation', 'source')),
            tags TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);
        
        // 플래시카드 테이블
        db.run(`
          CREATE TABLE IF NOT EXISTS flashcards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            front TEXT NOT NULL,
            back TEXT NOT NULL,
            subject TEXT NOT NULL,
            concepts TEXT,
            review_count INTEGER DEFAULT 0,
            last_reviewed DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);
        
        // 실수 노트 테이블
        db.run(`
          CREATE TABLE IF NOT EXISTS mistakes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            question_id INTEGER,
            question_text TEXT,
            correct_answer TEXT,
            wrong_answer TEXT,
            explanation TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);
        
        // 기출문제 관련 테이블들
        db.run(`
          CREATE TABLE IF NOT EXISTS exam_questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            year INTEGER,
            round INTEGER,
            subject TEXT,
            question_number INTEGER,
            question_text TEXT NOT NULL,
            question_type TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);
        
        db.run(`
          CREATE TABLE IF NOT EXISTS exam_choices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            question_id INTEGER,
            choice_number INTEGER,
            choice_text TEXT NOT NULL,
            FOREIGN KEY (question_id) REFERENCES exam_questions(id)
          )
        `);
        
        db.run(`
          CREATE TABLE IF NOT EXISTS exam_answers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            question_id INTEGER,
            answer_number INTEGER,
            answer_text TEXT,
            is_correct BOOLEAN DEFAULT 0,
            explanation TEXT,
            FOREIGN KEY (question_id) REFERENCES exam_questions(id)
          )
        `);
        
        db.run(`
          CREATE TABLE IF NOT EXISTS exam_keywords (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            question_id INTEGER,
            keyword TEXT NOT NULL,
            FOREIGN KEY (question_id) REFERENCES exam_questions(id)
          )
        `);
        
        db.run(`
          CREATE TABLE IF NOT EXISTS exam_textbook_links (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            question_id INTEGER,
            textbook_id INTEGER,
            page_number INTEGER,
            relevance_score REAL,
            FOREIGN KEY (question_id) REFERENCES exam_questions(id),
            FOREIGN KEY (textbook_id) REFERENCES textbooks(id)
          )
        `);
        
        db.run(`
          CREATE TABLE IF NOT EXISTS exam_similar_questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            question_id INTEGER,
            similar_question_id INTEGER,
            similarity_score REAL,
            FOREIGN KEY (question_id) REFERENCES exam_questions(id),
            FOREIGN KEY (similar_question_id) REFERENCES exam_questions(id)
          )
        `);
        
        db.run(`
          CREATE TABLE IF NOT EXISTS exam_subject_stats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            subject TEXT NOT NULL,
            total_questions INTEGER DEFAULT 0,
            year INTEGER,
            round INTEGER
          )
        `);
        
        db.run(`
          CREATE TABLE IF NOT EXISTS exam_questions_with_answers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            year INTEGER,
            subject TEXT,
            question_number INTEGER,
            question_text TEXT,
            choices TEXT,
            answer INTEGER,
            answer_text TEXT,
            explanation TEXT
          )
        `);
        
        db.run(`
          CREATE TABLE IF NOT EXISTS data_improvements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            entity_type TEXT NOT NULL,
            entity_id INTEGER,
            improvement_type TEXT,
            content TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);
        
        // 인덱스 생성
        console.log('🔍 인덱스 생성 중...');
        
        db.run(`CREATE INDEX IF NOT EXISTS idx_pdf_content ON pdf_contents(content)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_book_title ON pdf_contents(book_title)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_bookmark_type ON bookmarks(type)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_concept_keyword ON concepts(keyword)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_flashcard_subject ON flashcards(subject)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_textbook_contents_textbook_id ON textbook_contents(textbook_id)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_textbook_contents_content ON textbook_contents(content)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_concepts_subject ON concepts(subject)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_exam_questions_year_round ON exam_questions(year, round)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_exam_questions_subject ON exam_questions(subject)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_exam_keywords_keyword ON exam_keywords(keyword)`, (err) => {
          if (err) {
            console.error('❌ 인덱스 생성 중 오류:', err);
            db.close();
            reject(err);
          } else {
            console.log('✅ 데이터베이스 초기화 완료!');
            console.log(`📁 데이터베이스 위치: ${dbPath}`);
            console.log('\n다음 단계: node scripts/load-textbooks.js ./textbooks');
            db.close();
            resolve();
          }
        });
      });
    });
  });
}

// 스크립트 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase().catch(console.error);
}