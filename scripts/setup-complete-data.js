#!/usr/bin/env node

/**
 * 나무의사 PDF Q&A MCP - 완전한 데이터 설정 스크립트
 * 다른 PC에서도 모든 기출문제와 교재를 사용할 수 있도록 설정
 */

const fs = require('fs').promises;
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

class TreeDoctorDataSetup {
  constructor() {
    this.dbPath = path.join(__dirname, '..', 'tree-doctor-pdf-qa.db');
    this.dataDir = path.join(__dirname, '..', 'data');
    this.structuredDir = path.join(this.dataDir, 'structured');
    this.db = null;
  }

  async initialize() {
    console.log('🌳 나무의사 MCP 데이터 초기화 시작...\n');
    
    // 데이터베이스 연결
    this.db = new sqlite3.Database(this.dbPath);
    
    // 스키마 생성
    await this.createSchema();
    
    // 데이터 로드
    await this.loadAllData();
    
    console.log('\n✅ 초기화 완료!');
  }

  async createSchema() {
    console.log('📋 데이터베이스 스키마 생성...');
    
    const schemaPath = path.join(__dirname, '..', 'sql', 'exam-schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf-8');
    
    return new Promise((resolve, reject) => {
      this.db.exec(schema, (err) => {
        if (err) {
          console.error('❌ 스키마 생성 실패:', err);
          reject(err);
        } else {
          console.log('✅ 스키마 생성 완료');
          resolve();
        }
      });
    });
  }

  async loadAllData() {
    console.log('\n📚 기출문제 데이터 로드 시작...');
    
    // 기출문제 로드
    await this.loadExamQuestions();
    
    // 교재 정보 로드
    await this.loadTextbookInfo();
    
    // 검색 인덱스 생성
    await this.createSearchIndex();
  }

  async loadExamQuestions() {
    const examFiles = [
      'exam-5th.json',
      'exam-6th.json', 
      'exam-7th.json',
      'exam-8th.json',
      'exam-9th.json',
      'exam-10th.json',
      'exam-11th.json'
    ];

    let totalQuestions = 0;
    let successCount = 0;

    for (const file of examFiles) {
      try {
        const filePath = path.join(this.structuredDir, file);
        const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
        
        if (!fileExists) {
          console.log(`⚠️  ${file}: 파일 없음`);
          continue;
        }

        const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));
        const examYear = parseInt(data.exam_year) || parseInt(file.match(/\d+/)[0]);
        
        if (data.questions && Array.isArray(data.questions)) {
          for (const q of data.questions) {
            if (q.question && q.question.trim()) {
              await this.insertQuestion(examYear, q);
              totalQuestions++;
            }
          }
          successCount++;
          console.log(`✅ ${file}: ${data.questions.length}개 문제 로드`);
        }
      } catch (error) {
        console.error(`❌ ${file} 로드 실패:`, error.message);
      }
    }

    // 마크다운 파일에서 추가 데이터 추출
    await this.loadFromMarkdownFiles();

    console.log(`\n📊 총 ${totalQuestions}개 문제 로드 완료 (${successCount}개 파일)`);
  }

  async insertQuestion(examYear, questionData) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT OR IGNORE INTO exam_questions (
          exam_year, exam_round, question_number, subject, 
          question_text, question_type, points, is_incomplete
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        examYear,
        1, // 회차는 모두 1차 시험
        questionData.number || 0,
        questionData.subject || '미분류',
        this.cleanQuestionText(questionData.question),
        'multiple_choice', // 대부분 객관식
        1, // 기본 배점
        questionData.is_incomplete ? 1 : 0
      ];

      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          const questionId = this.lastID;
          
          // 선택지 삽입
          if (questionData.choices) {
            const choices = Object.entries(questionData.choices);
            choices.forEach(([num, text], index) => {
              const choiceSql = `
                INSERT OR IGNORE INTO exam_choices (
                  question_id, choice_number, choice_text, is_correct
                ) VALUES (?, ?, ?, ?)
              `;
              
              this.db.run(choiceSql, [
                questionId,
                index + 1,
                text,
                questionData.answer == num ? 1 : 0
              ]);
            });
          }

          // 정답 및 해설 삽입
          if (questionData.answer || questionData.explanation) {
            const answerSql = `
              INSERT OR IGNORE INTO exam_answers (
                question_id, correct_answer, explanation
              ) VALUES (?, ?, ?)
            `;
            
            this.db.run(answerSql, [
              questionId,
              questionData.answer || '',
              questionData.explanation || ''
            ]);
          }

          // 키워드 삽입
          if (questionData.keywords && Array.isArray(questionData.keywords)) {
            questionData.keywords.forEach(keyword => {
              const keywordSql = `
                INSERT OR IGNORE INTO exam_keywords (
                  question_id, keyword
                ) VALUES (?, ?)
              `;
              
              this.db.run(keywordSql, [questionId, keyword]);
            });
          }

          resolve(questionId);
        }
      }.bind(this));
    });
  }

  async loadFromMarkdownFiles() {
    console.log('\n📄 마크다운 파일에서 추가 데이터 추출...');
    
    const markdownFiles = [
      'exam-6th-final-150.md',
      'exam-7th-final-150.md',
      'exam-8th-final-150.md',
      'exam-9th-final-150.md',
      'exam-10th-final-150.md',
      'exam-11th-perfect.md'
    ];

    for (const file of markdownFiles) {
      try {
        const filePath = path.join(this.dataDir, file);
        const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
        
        if (!fileExists) continue;

        const content = await fs.readFile(filePath, 'utf-8');
        const questions = this.parseMarkdownQuestions(content);
        
        if (questions.length > 0) {
          const examYear = parseInt(file.match(/\d+/)[0]);
          
          for (const q of questions) {
            await this.insertQuestion(examYear, q);
          }
          
          console.log(`✅ ${file}: ${questions.length}개 문제 추출`);
        }
      } catch (error) {
        console.error(`⚠️  ${file} 처리 중 오류:`, error.message);
      }
    }
  }

  parseMarkdownQuestions(content) {
    const questions = [];
    const lines = content.split('\n');
    
    let currentQuestion = null;
    let inQuestion = false;
    let questionNumber = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // 문제 시작 패턴 찾기
      if (line.match(/^(문제|##?\s*문제|##?\s*\d+\.|##?\s*\d+\)|##?\s*\[\d+\])/)) {
        if (currentQuestion && currentQuestion.question) {
          questions.push(currentQuestion);
        }
        
        questionNumber++;
        currentQuestion = {
          number: questionNumber,
          question: '',
          choices: {},
          subject: this.guessSubject(line)
        };
        inQuestion = true;
      } else if (inQuestion && currentQuestion) {
        // 선택지 패턴 찾기
        const choiceMatch = line.match(/^([①②③④⑤]|[1-5][.)]\s*)/);
        if (choiceMatch) {
          const choiceNum = choiceMatch[0].replace(/[①②③④⑤).\s]/g, '');
          const choiceText = line.substring(choiceMatch[0].length).trim();
          currentQuestion.choices[choiceNum] = choiceText;
        } else if (line.match(/^(정답|답)\s*[:：]/)) {
          const answer = line.replace(/^(정답|답)\s*[:：]\s*/, '').trim();
          currentQuestion.answer = answer;
          inQuestion = false;
        } else if (line && !line.startsWith('#')) {
          currentQuestion.question += ' ' + line;
        }
      }
    }

    // 마지막 문제 추가
    if (currentQuestion && currentQuestion.question) {
      questions.push(currentQuestion);
    }

    return questions;
  }

  guessSubject(text) {
    const subjects = {
      '수목병리': '수목병리학',
      '수목해충': '수목해충학',
      '수목생리': '수목생리학',
      '수목관리': '수목관리학',
      '임업': '임업일반',
      '토양': '토양학'
    };

    for (const [keyword, subject] of Object.entries(subjects)) {
      if (text.includes(keyword)) {
        return subject;
      }
    }

    return '미분류';
  }

  cleanQuestionText(text) {
    if (!text) return '';
    
    // 기본 정리
    let cleaned = text
      .replace(/\*\*문제\*\*:\s*/g, '')
      .replace(/\*\*키워드\*\*:.*$/g, '')
      .replace(/---\s*##/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // OCR 오류 패턴 수정
    const corrections = {
      '몬도': '온도',
      '뮤효': '유효',
      'AES': '것은',
      'GALLS': '혹',
      'HAMAS': 'DNA를',
      'SSes': '에서',
      'Bay': '염색',
      'BIOS S': '피어스병'
    };

    for (const [wrong, correct] of Object.entries(corrections)) {
      cleaned = cleaned.replace(new RegExp(wrong, 'g'), correct);
    }

    return cleaned;
  }

  async loadTextbookInfo() {
    console.log('\n📖 교재 정보 로드...');
    
    const textbookData = {
      subjects: [
        '수목병리학',
        '수목해충학', 
        '수목생리학',
        '수목관리학',
        '임업일반',
        '토양학'
      ],
      metadata: {
        '수목병리학': {
          topics: ['병원체', '진단', '방제', '세균병', '바이러스병', '진균병'],
          keywords: ['병원체', '감염', '방제', '살균제', '진단']
        },
        '수목해충학': {
          topics: ['해충분류', '피해진단', '방제법', '천적', '살충제'],
          keywords: ['해충', '천적', '방제', '살충제', '피해']
        },
        '수목생리학': {
          topics: ['광합성', '호흡', '증산작용', '영양', '생장'],
          keywords: ['광합성', '호흡', '영양', '생장', '스트레스']
        },
        '수목관리학': {
          topics: ['전정', '시비', '병해충관리', '토양관리', '수목진단'],
          keywords: ['전정', '시비', '관리', '진단', '토양']
        }
      }
    };

    // 교재 메타데이터 저장
    const sql = `
      INSERT OR REPLACE INTO textbooks (
        title, subject, file_path, page_count, created_at
      ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;

    for (const subject of textbookData.subjects) {
      await new Promise((resolve, reject) => {
        this.db.run(sql, [
          `${subject} 교재`,
          subject,
          `textbooks/${subject}.pdf`,
          300 // 예상 페이지 수
        ], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    console.log('✅ 교재 정보 로드 완료');
  }

  async createSearchIndex() {
    console.log('\n🔍 검색 인덱스 생성...');
    
    // FTS 테이블 생성
    const createFTS = `
      CREATE VIRTUAL TABLE IF NOT EXISTS exam_questions_fts USING fts5(
        question_text, subject, keywords,
        content=exam_questions, content_rowid=id
      );
    `;

    await new Promise((resolve, reject) => {
      this.db.run(createFTS, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // FTS 인덱스 채우기
    const populateFTS = `
      INSERT INTO exam_questions_fts (question_text, subject, keywords)
      SELECT 
        question_text,
        subject,
        (SELECT GROUP_CONCAT(keyword, ' ') FROM exam_keywords WHERE question_id = q.id)
      FROM exam_questions q;
    `;

    await new Promise((resolve, reject) => {
      this.db.run(populateFTS, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    console.log('✅ 검색 인덱스 생성 완료');
  }

  async generateStatusReport() {
    console.log('\n📊 상태 리포트 생성...');
    
    const stats = await this.getStatistics();
    
    const report = {
      generated_at: new Date().toISOString(),
      database: {
        path: this.dbPath,
        size: await this.getFileSize(this.dbPath)
      },
      statistics: stats,
      setup_instructions: {
        step1: "npm install 실행",
        step2: "npm run setup 실행 (이 스크립트)",
        step3: "npm start로 MCP 서버 시작",
        step4: "Claude Desktop에서 MCP 연결"
      }
    };

    await fs.writeFile(
      path.join(this.dataDir, 'setup-status.json'),
      JSON.stringify(report, null, 2)
    );

    console.log('✅ 상태 리포트 저장: data/setup-status.json');
    console.log('\n📈 최종 통계:');
    console.log(`- 총 문제 수: ${stats.total_questions}`);
    console.log(`- 과목 수: ${stats.subjects.length}`);
    console.log(`- 회차: ${stats.exam_years.join(', ')}회`);
  }

  async getStatistics() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          COUNT(*) as total_questions,
          COUNT(DISTINCT subject) as subject_count,
          COUNT(DISTINCT exam_year) as year_count
        FROM exam_questions
      `;

      this.db.get(sql, (err, row) => {
        if (err) {
          reject(err);
        } else {
          // 추가 정보 수집
          this.db.all('SELECT DISTINCT subject FROM exam_questions', (err2, subjects) => {
            this.db.all('SELECT DISTINCT exam_year FROM exam_questions ORDER BY exam_year', (err3, years) => {
              resolve({
                total_questions: row.total_questions,
                subjects: subjects.map(s => s.subject),
                exam_years: years.map(y => y.exam_year)
              });
            });
          });
        }
      });
    });
  }

  async getFileSize(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return `${(stats.size / 1024 / 1024).toFixed(2)} MB`;
    } catch {
      return 'N/A';
    }
  }

  async close() {
    if (this.db) {
      this.db.close();
    }
  }
}

// 실행
async function main() {
  const setup = new TreeDoctorDataSetup();
  
  try {
    await setup.initialize();
    await setup.generateStatusReport();
    await setup.close();
    
    console.log('\n🎉 설정 완료! 다음 명령으로 MCP 서버를 시작하세요:');
    console.log('   npm start\n');
  } catch (error) {
    console.error('\n❌ 설정 중 오류 발생:', error);
    process.exit(1);
  }
}

// package.json에 스크립트 추가 필요
// "scripts": {
//   "setup": "node scripts/setup-complete-data.js",
//   "start": "node dist/index.js"
// }

main();