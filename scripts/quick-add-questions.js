#!/usr/bin/env node

/**
 * 빠른 문제 추가 도구
 * 누락된 문제를 쉽게 추가할 수 있는 인터페이스
 */

import sqlite3 from 'sqlite3';
import fs from 'fs/promises';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class QuickQuestionAdder {
  constructor() {
    this.dbPath = path.join(__dirname, '..', 'tree-doctor-pdf-qa.db');
    this.db = null;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async initialize() {
    this.db = new sqlite3.Database(this.dbPath);
    console.log('🌳 나무의사 기출문제 빠른 추가 도구\n');
  }

  async question(prompt) {
    return new Promise((resolve) => {
      this.rl.question(prompt, resolve);
    });
  }

  async addQuestionInteractive() {
    console.log('\n📝 새 문제 추가');
    console.log('─'.repeat(50));

    // 회차 입력
    const examYear = await this.question('회차 (예: 7): ');
    
    // 문제 번호 입력
    const questionNumber = await this.question('문제 번호 (예: 6): ');
    
    // 과목 선택
    console.log('\n과목 선택:');
    console.log('1. 수목병리학');
    console.log('2. 수목해충학');
    console.log('3. 수목생리학');
    console.log('4. 수목관리학');
    console.log('5. 임업일반');
    console.log('6. 토양학');
    const subjectChoice = await this.question('번호 선택: ');
    
    const subjects = {
      '1': '수목병리학',
      '2': '수목해충학',
      '3': '수목생리학',
      '4': '수목관리학',
      '5': '임업일반',
      '6': '토양학'
    };
    
    const subject = subjects[subjectChoice] || '미분류';
    
    // 문제 입력
    console.log('\n문제 내용 (여러 줄 가능, 빈 줄로 종료):');
    let questionText = '';
    let line;
    while ((line = await this.question('')) !== '') {
      questionText += line + ' ';
    }
    
    // 선택지 입력
    const choices = {};
    for (let i = 1; i <= 4; i++) {
      choices[i] = await this.question(`선택지 ${i}: `);
    }
    
    // 정답 입력
    const answer = await this.question('정답 번호 (1-4): ');
    
    // 확인
    console.log('\n📋 입력한 내용:');
    console.log(`회차: ${examYear}회`);
    console.log(`문제 ${questionNumber}. ${questionText.trim()}`);
    console.log(`과목: ${subject}`);
    for (let i = 1; i <= 4; i++) {
      console.log(`${i}. ${choices[i]}`);
    }
    console.log(`정답: ${answer}번`);
    
    const confirm = await this.question('\n저장하시겠습니까? (y/n): ');
    
    if (confirm.toLowerCase() === 'y') {
      await this.saveQuestion({
        examYear: parseInt(examYear),
        questionNumber: parseInt(questionNumber),
        subject,
        questionText: questionText.trim(),
        choices,
        answer: parseInt(answer)
      });
    }
  }

  async saveQuestion(data) {
    return new Promise((resolve, reject) => {
      this.db.run(`
        INSERT INTO exam_questions (
          exam_year, exam_round, question_number, subject,
          question_text, question_type, points, is_incomplete
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        data.examYear,
        1,
        data.questionNumber,
        data.subject,
        data.questionText,
        'multiple_choice',
        1,
        0
      ], function(err) {
        if (err) {
          console.error('❌ 저장 실패:', err.message);
          reject(err);
        } else {
          const questionId = this.lastID;
          
          // 선택지 저장
          Object.entries(data.choices).forEach(([num, text]) => {
            this.db.run(`
              INSERT INTO exam_choices (
                question_id, choice_number, choice_text, is_correct
              ) VALUES (?, ?, ?, ?)
            `, [questionId, parseInt(num), text, parseInt(num) === data.answer ? 1 : 0]);
          });
          
          // 정답 저장
          this.db.run(`
            INSERT INTO exam_answers (
              question_id, correct_answer
            ) VALUES (?, ?)
          `, [questionId, data.answer.toString()]);
          
          console.log('✅ 저장 완료!');
          resolve(questionId);
        }
      }.bind(this));
    });
  }

  async addFromFile() {
    const filePath = await this.question('\n파일 경로 입력 (.json): ');
    
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const questions = JSON.parse(content);
      
      if (Array.isArray(questions)) {
        for (const q of questions) {
          await this.saveQuestion(q);
        }
        console.log(`✅ ${questions.length}개 문제 추가 완료!`);
      } else {
        await this.saveQuestion(questions);
        console.log('✅ 1개 문제 추가 완료!');
      }
    } catch (error) {
      console.error('❌ 파일 처리 실패:', error.message);
    }
  }

  async showStats() {
    return new Promise((resolve) => {
      this.db.all(`
        SELECT exam_year, COUNT(*) as count, 
               150 - COUNT(*) as missing
        FROM exam_questions 
        GROUP BY exam_year
        ORDER BY exam_year
      `, (err, rows) => {
        if (err) {
          console.error('❌ 통계 조회 실패:', err);
        } else {
          console.log('\n📊 현재 상황:');
          console.log('─'.repeat(30));
          rows.forEach(row => {
            console.log(`${row.exam_year}회: ${row.count}/150 (누락: ${row.missing})`);
          });
          console.log('─'.repeat(30));
          const total = rows.reduce((sum, row) => sum + row.count, 0);
          console.log(`총계: ${total}문제`);
        }
        resolve();
      });
    });
  }

  async run() {
    await this.initialize();
    
    let running = true;
    while (running) {
      await this.showStats();
      
      console.log('\n메뉴:');
      console.log('1. 문제 직접 입력');
      console.log('2. 파일에서 가져오기');
      console.log('3. 종료');
      
      const choice = await this.question('\n선택: ');
      
      switch (choice) {
        case '1':
          await this.addQuestionInteractive();
          break;
        case '2':
          await this.addFromFile();
          break;
        case '3':
          running = false;
          break;
        default:
          console.log('잘못된 선택입니다.');
      }
    }
    
    this.rl.close();
    this.db.close();
    console.log('\n👋 프로그램을 종료합니다.');
  }
}

// 샘플 JSON 파일 생성
async function createSampleFile() {
  const sample = [
    {
      examYear: 7,
      questionNumber: 6,
      subject: "수목병리학",
      questionText: "다음 중 세균병의 특징이 아닌 것은?",
      choices: {
        "1": "수침상 병반을 형성한다",
        "2": "세균 유출액(ooze)이 관찰된다",
        "3": "균사체를 형성한다",
        "4": "항생제로 방제가 가능하다"
      },
      answer: 3
    }
  ];
  
  await fs.writeFile(
    path.join(__dirname, '..', 'data', 'sample-questions.json'),
    JSON.stringify(sample, null, 2),
    'utf-8'
  );
  
  console.log('✅ 샘플 파일 생성: data/sample-questions.json');
}

// 실행
const adder = new QuickQuestionAdder();
adder.run().catch(console.error);