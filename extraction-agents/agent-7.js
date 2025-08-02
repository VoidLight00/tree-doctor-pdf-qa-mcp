#!/usr/bin/env node
/**
 * agent-7 - 7회차 전문 추출 에이전트
 * 역할: OCR 오류 수정 및 패턴 인식 전문
 */

import fs from 'fs/promises';
import path from 'path';
import sqlite3 from 'sqlite3';

class ExtractionAgent7 {
  constructor() {
    this.examYear = 7;
    this.dataDir = '/Users/voidlight/tree-doctor-pdf-qa-mcp/data';
    this.targetFile = 'exam-7th-final-150.md';
    this.dbPath = '/Users/voidlight/tree-doctor-pdf-qa-mcp/tree-doctor-pdf-qa.db';
    this.results = [];
  }

  async run() {
    console.log('🤖 agent-7 시작 - 7회차 (누락: 145개)');
    
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
      
      console.log('✅ agent-7 완료: ' + questions.length + '개 문제 추출');
      
      // 결과 저장
      await fs.writeFile(
        path.join('/Users/voidlight/tree-doctor-pdf-qa-mcp/extraction-agents', 'agent-7-results.json'),
        JSON.stringify({
          agentId: 'agent-7',
          examYear: 7,
          extracted: questions.length,
          questions: questions
        }, null, 2)
      );
      
    } catch (error) {
      console.error('❌ agent-7 오류:', error.message);
    }
  }

  async extractQuestions(content) {
    const questions = [];
    const lines = content.split('\n');
    
    
    // 7회차: OCR 오류가 심한 패턴 처리
    let currentQuestion = null;
    let questionNum = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // 문제 번호 패턴 - OCR 오류 고려
      if (line.match(/^\d+[.)\s]|^문제\s*\d+/)) {
        if (currentQuestion) questions.push(currentQuestion);
        
        questionNum++;
        const text = line.replace(/^\d+[.)\s]|^문제\s*\d+[.:]/g, '').trim();
        
        currentQuestion = {
          number: questionNum,
          text: this.fixOCRErrors(text),
          choices: {},
          subject: this.detectSubject(text)
        };
      }
      // 선택지 패턴
      else if (currentQuestion && line.match(/^[①②③④⑤1-5][.)]/)) {
        const num = line.match(/^([①②③④⑤1-5])/)[1];
        const choiceNum = this.normalizeNumber(num);
        const choiceText = line.replace(/^[①②③④⑤1-5][.)\s]/, '');
        currentQuestion.choices[choiceNum] = this.fixOCRErrors(choiceText);
      }
    }
    
    if (currentQuestion) questions.push(currentQuestion);
      
    
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
const agent = new ExtractionAgent7();
agent.run().catch(console.error);
