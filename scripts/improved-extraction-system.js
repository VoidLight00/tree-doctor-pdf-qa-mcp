#!/usr/bin/env node

/**
 * 개선된 문제 추출 시스템
 * 품질 중심의 단계별 추출
 */

import fs from 'fs/promises';
import path from 'path';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ImprovedExtractionSystem {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.dataDir = path.join(this.projectRoot, 'data');
    this.dbPath = path.join(this.projectRoot, 'tree-doctor-pdf-qa.db');
    this.db = null;
  }

  async initialize() {
    this.db = new sqlite3.Database(this.dbPath);
    console.log('🎯 개선된 추출 시스템 시작...\n');
  }

  // OCR 오류 수정
  fixOCRErrors(text) {
    const corrections = {
      '뮤효': '유효',
      '몬도': '온도', 
      'AES': '것은',
      'GALLS': '혹',
      'HAMAS': 'DNA를',
      'SSes': '에서',
      'Bay': '염색',
      'BIOS S': '피어스병',
      '®': '②',
      'S이l': '종에',
      '2h': '최초',
      'SAt BES': '곤충은',
      'ANZ': '또한',
      'te!': '',
      'Pl': '',
      '1ㅁ\\)/\\]': 'IPM'
    };
    
    let fixed = text;
    for (const [wrong, correct] of Object.entries(corrections)) {
      fixed = fixed.replace(new RegExp(wrong, 'g'), correct);
    }
    
    // 불필요한 특수문자 제거
    fixed = fixed.replace(/[#*]/g, '');
    fixed = fixed.replace(/\s+/g, ' ').trim();
    
    return fixed;
  }

  // 문제 구조 검증
  validateQuestion(question) {
    // 필수 요소 확인
    if (!question.text || question.text.length < 10) return false;
    if (!question.choices || Object.keys(question.choices).length < 4) return false;
    if (!question.number || question.number < 1 || question.number > 150) return false;
    
    // 중복 선택지 확인
    const choiceTexts = Object.values(question.choices);
    const uniqueChoices = new Set(choiceTexts);
    if (uniqueChoices.size < 4) return false;
    
    // 선택지 길이 확인
    for (const choice of choiceTexts) {
      if (choice.length < 2) return false;
    }
    
    return true;
  }

  // 과목 분류
  detectSubject(text) {
    const patterns = {
      '수목병리학': /병원체|감염|세균|바이러스|진균|병해|살균제|병징|병반/,
      '수목해충학': /해충|곤충|천적|유충|번데기|성충|살충제|천공|가해/,
      '수목생리학': /광합성|호흡|증산|영양|생장|식물호르몬|굴광성|굴지성/,
      '수목관리학': /전정|시비|관리|진단|식재|이식|멀칭|전지/,
      '토양학': /토양|pH|양분|비료|유기물|배수|통기성/,
      '임업일반': /산림|조림|벌채|갱신|임분|임목|천연갱신/
    };
    
    for (const [subject, pattern] of Object.entries(patterns)) {
      if (pattern.test(text)) return subject;
    }
    
    return '미분류';
  }

  // 7회차 전용 추출
  async extract7th() {
    console.log('📖 7회차 추출 시작...');
    const content = await fs.readFile(
      path.join(this.dataDir, 'exam-7th-final-150.md'),
      'utf-8'
    );
    
    const questions = [];
    const lines = content.split('\n');
    
    let currentQuestion = null;
    let inQuestion = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = this.fixOCRErrors(lines[i].trim());
      
      // 문제 시작 패턴
      const questionMatch = line.match(/^(\d+)\s*[.)]\s*(.+)/);
      if (questionMatch) {
        const num = parseInt(questionMatch[1]);
        if (num >= 1 && num <= 150) {
          // 이전 문제 저장
          if (currentQuestion && this.validateQuestion(currentQuestion)) {
            questions.push(currentQuestion);
          }
          
          currentQuestion = {
            number: num,
            text: questionMatch[2],
            choices: {},
            subject: null
          };
          inQuestion = true;
          continue;
        }
      }
      
      // 선택지 패턴
      if (inQuestion && currentQuestion) {
        const choiceMatch = line.match(/^([①②③④⑤1-5])[.)]\s*(.+)/);
        if (choiceMatch) {
          const choiceNum = this.normalizeChoiceNumber(choiceMatch[1]);
          if (choiceNum && choiceMatch[2].length > 1) {
            currentQuestion.choices[choiceNum] = choiceMatch[2];
          }
        } else if (line.length > 10 && !line.match(/^(정답|해설|키워드)/)) {
          // 문제 텍스트 연속
          currentQuestion.text += ' ' + line;
        }
      }
    }
    
    // 마지막 문제 저장
    if (currentQuestion && this.validateQuestion(currentQuestion)) {
      questions.push(currentQuestion);
    }
    
    // 과목 분류
    questions.forEach(q => {
      q.subject = this.detectSubject(q.text);
    });
    
    console.log(`✅ 7회차: ${questions.length}개 추출 완료`);
    return questions;
  }

  // 선택지 번호 정규화
  normalizeChoiceNumber(num) {
    const mapping = {
      '①': 1, '②': 2, '③': 3, '④': 4, '⑤': 5,
      '1': 1, '2': 2, '3': 3, '4': 4, '5': 5
    };
    return mapping[num];
  }

  // 데이터베이스 저장
  async saveQuestions(questions, examYear) {
    let saved = 0;
    let skipped = 0;
    
    for (const q of questions) {
      try {
        // 중복 확인
        const exists = await new Promise((resolve, reject) => {
          this.db.get(
            `SELECT id FROM exam_questions 
             WHERE exam_year = ? AND question_number = ?`,
            [examYear, q.number],
            (err, row) => {
              if (err) reject(err);
              else resolve(!!row);
            }
          );
        });
        
        if (exists) {
          skipped++;
          continue;
        }
        
        // 문제 저장
        const questionId = await new Promise((resolve, reject) => {
          this.db.run(
            `INSERT INTO exam_questions (
              exam_year, exam_round, question_number, subject,
              question_text, question_type, points, is_incomplete
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              examYear, 1, q.number, q.subject,
              q.text, 'multiple_choice', 1, 0
            ],
            function(err) {
              if (err) reject(err);
              else resolve(this.lastID);
            }
          );
        });
        
        // 선택지 저장
        for (const [num, text] of Object.entries(q.choices)) {
          await new Promise((resolve, reject) => {
            this.db.run(
              `INSERT INTO exam_choices (
                question_id, choice_number, choice_text, is_correct
              ) VALUES (?, ?, ?, ?)`,
              [questionId, parseInt(num), text, 0],
              err => err ? reject(err) : resolve()
            );
          });
        }
        
        saved++;
      } catch (error) {
        console.error(`❌ 문제 ${q.number} 저장 실패:`, error.message);
      }
    }
    
    console.log(`💾 저장 완료: ${saved}개 추가, ${skipped}개 중복 제외`);
    return { saved, skipped };
  }

  // 통계 표시
  async showStats() {
    return new Promise((resolve) => {
      this.db.all(
        `SELECT exam_year, COUNT(*) as count 
         FROM exam_questions 
         GROUP BY exam_year 
         ORDER BY exam_year`,
        (err, rows) => {
          if (err) {
            console.error('통계 조회 실패:', err);
            resolve();
            return;
          }
          
          console.log('\n📊 현재 데이터베이스 상태:');
          console.log('━'.repeat(40));
          
          let total = 0;
          rows.forEach(row => {
            const percent = ((row.count / 150) * 100).toFixed(1);
            console.log(`${row.exam_year}회차: ${row.count}/150 (${percent}%)`);
            total += row.count;
          });
          
          console.log('━'.repeat(40));
          console.log(`전체: ${total}/750 문제`);
          console.log();
          
          resolve();
        }
      );
    });
  }

  async run() {
    await this.initialize();
    await this.showStats();
    
    // 7회차 추출
    const questions7 = await this.extract7th();
    if (questions7.length > 0) {
      await this.saveQuestions(questions7, 7);
    }
    
    // 최종 통계
    await this.showStats();
    
    this.db.close();
    console.log('✅ 추출 완료!');
  }
}

// 실행
const system = new ImprovedExtractionSystem();
system.run().catch(console.error);