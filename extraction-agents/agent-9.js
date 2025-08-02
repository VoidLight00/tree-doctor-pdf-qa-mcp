#!/usr/bin/env node
/**
 * agent-9 - 9회차 전문 추출 에이전트
 * 역할: 부분 완성 문제 보완 전문
 */

import fs from 'fs/promises';
import path from 'path';
import sqlite3 from 'sqlite3';

class ExtractionAgent9 {
  constructor() {
    this.examYear = 9;
    this.dataDir = '/Users/voidlight/tree-doctor-pdf-qa-mcp/data';
    this.targetFile = 'exam-9th-final-150.md';
    this.dbPath = '/Users/voidlight/tree-doctor-pdf-qa-mcp/tree-doctor-pdf-qa.db';
    this.results = [];
  }

  async run() {
    console.log('🤖 agent-9 시작 - 9회차 (누락: 91개)');
    
    try {
      // 마크다운 파일 읽기
      const content = await fs.readFile(
        path.join(this.dataDir, this.targetFile), 
        'utf-8'
      );
      
      // 회차별 특화 추출 로직
      const questions = await this.extractQuestions(content);
      
      // 데이터베이스에 저장
      await this.saveToDatabase(questions);
      
      console.log('✅ agent-9 완료: ' + questions.length + '개 문제 추출');
      
      // 결과 저장
      await fs.writeFile(
        path.join('/Users/voidlight/tree-doctor-pdf-qa-mcp/extraction-agents', 'agent-9-results.json'),
        JSON.stringify({
          agentId: 'agent-9',
          examYear: 9,
          extracted: questions.length,
          questions: questions
        }, null, 2)
      );
      
    } catch (error) {
      console.error('❌ agent-9 오류:', error.message);
    }
  }

  async extractQuestions(content) {
    const questions = [];
    const lines = content.split('\n');
    
    
    // 9회차: 부분 완성 보완
    let questionNum = 59; // 이미 59개 있음
    
    // 누락된 구간 찾기
    const existingNumbers = new Set([/* 기존 문제 번호들 */]);
    
    for (let targetNum = 1; targetNum <= 150; targetNum++) {
      if (existingNumbers.has(targetNum)) continue;
      
      // 해당 번호 문제 찾기
      const pattern = new RegExp(`^\\s*${targetNum}\\s*[.)\\]]`);
      const lineIdx = lines.findIndex(line => pattern.test(line));
      
      if (lineIdx !== -1) {
        const question = {
          number: targetNum,
          text: '',
          choices: {},
          subject: '미분류'
        };
        
        // 문제 내용 추출
        for (let i = lineIdx; i < lines.length && i < lineIdx + 10; i++) {
          const line = lines[i];
          if (line.match(/^[①②③④⑤]/)) {
            const [num, text] = line.split(/[.)]/);
            question.choices[this.normalizeNumber(num)] = text.trim();
          } else if (line.match(/^\d+[.)]/)) {
            break; // 다음 문제
          } else {
            question.text += ' ' + line.trim();
          }
        }
        
        if (question.text) questions.push(question);
      }
    }
      
    
    return questions;
  }
  
  
  // OCR 오류 수정
  fixOCRErrors(text) {
    const corrections = {
      '뮤효': '유효', '몬도': '온도', 'AES': '것은',
      'GALLS': '혹', 'HAMAS': 'DNA를', 'SSes': '에서',
      'Bay': '염색', 'BIOS S': '피어스병', '®': '②'
    };
    
    let fixed = text;
    for (const [wrong, correct] of Object.entries(corrections)) {
      fixed = fixed.replace(new RegExp(wrong, 'g'), correct);
    }
    return fixed;
  }
  
  // 번호 정규화
  normalizeNumber(num) {
    const mapping = {
      '①': 1, '②': 2, '③': 3, '④': 4, '⑤': 5,
      '1': 1, '2': 2, '3': 3, '4': 4, '5': 5
    };
    return mapping[num] || 0;
  }
  
  // 과목 분류
  detectSubject(text) {
    if (text.match(/병원체|감염|세균|바이러스|진균/)) return '수목병리학';
    if (text.match(/해충|곤충|천적|유충/)) return '수목해충학';
    if (text.match(/광합성|호흡|증산|영양/)) return '수목생리학';
    if (text.match(/전정|시비|관리|진단/)) return '수목관리학';
    if (text.match(/토양|pH|양분|비료/)) return '토양학';
    if (text.match(/산림|조림|벌채|갱신/)) return '임업일반';
    return '미분류';
  }

  async saveToDatabase(questions) {
    const db = new sqlite3.Database(this.dbPath);
    
    for (const q of questions) {
      await new Promise((resolve, reject) => {
        db.run(`
          INSERT OR IGNORE INTO exam_questions (
            exam_year, exam_round, question_number, subject,
            question_text, question_type, points, is_incomplete
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          this.examYear, 1, q.number, q.subject || '미분류',
          q.text, 'multiple_choice', 1, 0
        ], function(err) {
          if (!err) {
            const qId = this.lastID;
            // 선택지 저장
            if (q.choices) {
              Object.entries(q.choices).forEach(([num, text], idx) => {
                db.run(`
                  INSERT OR IGNORE INTO exam_choices (
                    question_id, choice_number, choice_text, is_correct
                  ) VALUES (?, ?, ?, ?)
                `, [qId, idx + 1, text, q.answer == (idx + 1) ? 1 : 0]);
              });
            }
          }
          resolve();
        });
      });
    }
    
    db.close();
  }
}

// 실행
const agent = new ExtractionAgent9();
agent.run().catch(console.error);
