#!/usr/bin/env node

/**
 * structured 폴더의 JSON 데이터를 데이터베이스로 가져오기
 */

import fs from 'fs/promises';
import path from 'path';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class StructuredDataImporter {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.structuredDir = path.join(this.projectRoot, 'data', 'structured');
    this.dbPath = path.join(this.projectRoot, 'tree-doctor-pdf-qa.db');
    this.db = null;
  }

  async initialize() {
    this.db = new sqlite3.Database(this.dbPath);
    console.log('🚀 구조화된 데이터 가져오기 시작...\n');
  }

  async importExamData(filePath, examYear) {
    console.log(`📄 ${examYear}회차 처리 중...`);
    
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);
      
      if (!data.questions || !Array.isArray(data.questions)) {
        console.log(`⚠️ ${examYear}회차: 문제 데이터 없음`);
        return { saved: 0, skipped: 0 };
      }
      
      let saved = 0;
      let skipped = 0;
      
      for (const q of data.questions) {
        // 필수 필드 확인
        if (!q.number || !q.question) continue;
        
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
        
        // 문제 텍스트 정리
        let questionText = q.question;
        // 마크다운 제거
        questionText = questionText.replace(/\*\*/g, '');
        questionText = questionText.replace(/##\s*/g, '');
        questionText = questionText.replace(/---/g, '');
        // **문제**: 로 시작하는 경우 제거
        questionText = questionText.replace(/^\*?\*?문제\*?\*?:\s*/i, '');
        // **키워드**: 부분 제거
        questionText = questionText.replace(/\*?\*?키워드\*?\*?:.*$/s, '');
        questionText = questionText.trim();
        
        // 과목 결정
        const subject = q.subject || this.detectSubject(questionText);
        
        // 문제 저장
        const questionId = await new Promise((resolve, reject) => {
          this.db.run(
            `INSERT INTO exam_questions (
              exam_year, exam_round, question_number, subject,
              question_text, question_type, points, is_incomplete
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              examYear, 1, q.number, subject,
              questionText, 'multiple_choice', 1, 0
            ],
            function(err) {
              if (err) reject(err);
              else resolve(this.lastID);
            }
          );
        });
        
        // 선택지 저장
        if (q.choices && typeof q.choices === 'object') {
          for (const [num, text] of Object.entries(q.choices)) {
            const choiceNum = parseInt(num);
            if (choiceNum >= 1 && choiceNum <= 5 && text) {
              await new Promise((resolve, reject) => {
                this.db.run(
                  `INSERT INTO exam_choices (
                    question_id, choice_number, choice_text, is_correct
                  ) VALUES (?, ?, ?, ?)`,
                  [questionId, choiceNum, text.trim(), 
                   q.answer === choiceNum ? 1 : 0],
                  err => err ? reject(err) : resolve()
                );
              });
            }
          }
        }
        
        // 정답 저장
        if (q.answer) {
          await new Promise((resolve, reject) => {
            this.db.run(
              `INSERT INTO exam_answers (
                question_id, correct_answer, explanation
              ) VALUES (?, ?, ?)`,
              [questionId, q.answer.toString(), q.explanation || ''],
              err => err ? reject(err) : resolve()
            );
          });
        }
        
        saved++;
        
        if (saved % 10 === 0) {
          console.log(`  💾 ${saved}개 저장 중...`);
        }
      }
      
      console.log(`✅ ${examYear}회차: ${saved}개 추가, ${skipped}개 중복 제외`);
      return { saved, skipped };
      
    } catch (error) {
      console.error(`❌ ${examYear}회차 처리 오류:`, error.message);
      return { saved: 0, skipped: 0 };
    }
  }

  detectSubject(text) {
    const patterns = {
      '수목병리학': /병원체|병원균|감염|세균|바이러스|진균|곰팡이|병해|살균제|병징|병반/,
      '수목해충학': /해충|곤충|천적|유충|번데기|성충|살충제|천공|가해|나방|딱정벌레/,
      '수목생리학': /광합성|호흡|증산|영양|생장|식물호르몬|굴광성|굴지성|옥신/,
      '수목관리학': /전정|시비|관리|진단|식재|이식|멀칭|전지|가지치기/,
      '토양학': /토양|pH|양분|비료|유기물|배수|통기성|양이온교환/,
      '임업일반': /산림|조림|벌채|갱신|임분|임목|천연갱신/
    };
    
    for (const [subject, pattern] of Object.entries(patterns)) {
      if (pattern.test(text)) return subject;
    }
    
    return '미분류';
  }

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
          console.log(`전체: ${total}/750 문제\n`);
          
          resolve();
        }
      );
    });
  }

  async run() {
    await this.initialize();
    await this.showStats();
    
    // 처리할 파일 목록
    const examFiles = [
      { file: 'exam-5th.json', year: 5 },
      { file: 'exam-6th.json', year: 6 },
      { file: 'exam-7th.json', year: 7 },
      { file: 'exam-8th.json', year: 8 },
      { file: 'exam-9th.json', year: 9 },
      { file: 'exam-10th.json', year: 10 },
      { file: 'exam-11th.json', year: 11 }
    ];
    
    let totalSaved = 0;
    let totalSkipped = 0;
    
    for (const exam of examFiles) {
      const filePath = path.join(this.structuredDir, exam.file);
      try {
        await fs.access(filePath);
        const { saved, skipped } = await this.importExamData(filePath, exam.year);
        totalSaved += saved;
        totalSkipped += skipped;
      } catch (error) {
        console.log(`⚠️ ${exam.year}회차 파일 없음`);
      }
    }
    
    console.log(`\n📊 전체 결과:`);
    console.log(`총 ${totalSaved}개 추가, ${totalSkipped}개 중복 제외`);
    
    await this.showStats();
    
    this.db.close();
    console.log('✅ 가져오기 완료!');
  }
}

// 실행
const importer = new StructuredDataImporter();
importer.run().catch(console.error);