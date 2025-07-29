#!/usr/bin/env node

import { promises as fs } from "fs";
import * as path from "path";
import { DatabaseManager } from "../database.js";
import * as sqlite3 from "sqlite3";

interface ExamQuestion {
  examYear: number;
  examRound: number;
  questionNumber: number;
  subject: string;
  questionText: string;
  questionType: "multiple_choice" | "essay" | "short_answer";
  choices?: Array<{
    number: number;
    text: string;
    isCorrect?: boolean;
  }>;
  correctAnswer?: string;
  explanation?: string;
  keywords?: string[];
  isIncomplete?: boolean;
}

class ExamImporter {
  private db!: sqlite3.Database;
  private dbManager: DatabaseManager;

  constructor() {
    this.dbManager = new DatabaseManager();
  }

  async initialize() {
    await this.dbManager.initialize();
    const dbPath = path.join(process.cwd(), "tree-doctor-pdf-qa.db");
    
    return new Promise<void>((resolve, reject) => {
      this.db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          reject(err);
        } else {
          this.createExamTables().then(resolve).catch(reject);
        }
      });
    });
  }

  private async createExamTables(): Promise<void> {
    const schemaPath = path.join(process.cwd(), "sql", "exam-schema.sql");
    const schema = await fs.readFile(schemaPath, "utf-8");
    
    // SQL 문을 개별적으로 실행
    const statements = schema.split(";").filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      await this.runSQL(statement + ";");
    }
  }

  private runSQL(sql: string, params?: any[]): Promise<void> {
    return new Promise((resolve, reject) => {
      if (params) {
        this.db.run(sql, params, (err) => {
          if (err) reject(err);
          else resolve();
        });
      } else {
        this.db.run(sql, (err) => {
          if (err) reject(err);
          else resolve();
        });
      }
    });
  }

  private async insertQuestion(question: ExamQuestion): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      this.db.run(
        `INSERT OR REPLACE INTO exam_questions 
         (exam_year, exam_round, question_number, subject, question_text, question_type, is_incomplete) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          question.examYear,
          question.examRound,
          question.questionNumber,
          question.subject,
          question.questionText,
          question.questionType,
          question.isIncomplete ? 1 : 0
        ],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  private async insertChoices(questionId: number, choices: ExamQuestion["choices"]) {
    if (!choices) return;

    for (const choice of choices) {
      await this.runSQL(
        `INSERT OR REPLACE INTO exam_choices 
         (question_id, choice_number, choice_text, is_correct) 
         VALUES (?, ?, ?, ?)`,
        [questionId, choice.number, choice.text, choice.isCorrect ? 1 : 0]
      );
    }
  }

  private async insertAnswer(questionId: number, correctAnswer: string, explanation?: string) {
    await this.runSQL(
      `INSERT OR REPLACE INTO exam_answers 
       (question_id, correct_answer, explanation) 
       VALUES (?, ?, ?)`,
      [questionId, correctAnswer, explanation || null]
    );
  }

  private async insertKeywords(questionId: number, keywords: string[]) {
    for (const keyword of keywords) {
      await this.runSQL(
        `INSERT OR REPLACE INTO exam_keywords 
         (question_id, keyword) 
         VALUES (?, ?)`,
        [questionId, keyword]
      );
    }
  }

  async parseMarkdownFile(filePath: string): Promise<ExamQuestion[]> {
    const content = await fs.readFile(filePath, "utf-8");
    const questions: ExamQuestion[] = [];
    
    // 파일명에서 연도와 회차 추출
    const filename = path.basename(filePath);
    const yearMatch = filename.match(/(\d{4})/);
    const roundMatch = filename.match(/(\d+)회/);
    
    if (!yearMatch || !roundMatch) {
      console.warn(`파일명에서 연도나 회차를 추출할 수 없습니다: ${filename}`);
      return [];
    }

    const examYear = parseInt(yearMatch[1]);
    const examRound = parseInt(roundMatch[1]);

    // 마크다운 파싱 로직
    const lines = content.split("\n");
    let currentQuestion: Partial<ExamQuestion> | null = null;
    let currentChoices: ExamQuestion["choices"] = [];
    let inQuestion = false;
    let questionText = "";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // 문제 번호 감지 (예: "1.", "문제 1", "Q1" 등)
      const questionMatch = line.match(/^(?:문제\s*)?(\d+)[\.)\s]/);
      if (questionMatch) {
        // 이전 문제 저장
        if (currentQuestion && questionText) {
          currentQuestion.questionText = questionText.trim();
          currentQuestion.choices = currentChoices;
          questions.push(currentQuestion as ExamQuestion);
        }

        // 새 문제 시작
        currentQuestion = {
          examYear,
          examRound,
          questionNumber: parseInt(questionMatch[1]),
          subject: this.inferSubject(content, examYear, examRound),
          questionType: "multiple_choice", // 기본값
        };
        questionText = line.replace(questionMatch[0], "").trim();
        currentChoices = [];
        inQuestion = true;
        continue;
      }

      // 선택지 감지 (①, ②, ③, ④, ⑤ 또는 1), 2), 3), 4), 5))
      const choiceMatch = line.match(/^[①②③④⑤]|^(\d)\)/);
      if (choiceMatch && inQuestion) {
        const choiceNumber = choiceMatch[1] ? 
          parseInt(choiceMatch[1]) : 
          ["①", "②", "③", "④", "⑤"].indexOf(line[0]) + 1;
        
        const choiceText = line.replace(/^[①②③④⑤]\s*|^\d\)\s*/, "").trim();
        currentChoices.push({
          number: choiceNumber,
          text: choiceText
        });
        continue;
      }

      // 정답 감지
      const answerMatch = line.match(/^(?:정답|답)\s*[:：]\s*(.+)/);
      if (answerMatch && currentQuestion) {
        currentQuestion.correctAnswer = answerMatch[1].trim();
        
        // 정답이 숫자인 경우 해당 선택지를 정답으로 표시
        const answerNum = parseInt(answerMatch[1]);
        if (!isNaN(answerNum) && currentChoices[answerNum - 1]) {
          currentChoices[answerNum - 1].isCorrect = true;
        }
        continue;
      }

      // 해설 감지
      const explanationMatch = line.match(/^(?:해설|설명)\s*[:：]\s*(.+)/);
      if (explanationMatch && currentQuestion) {
        currentQuestion.explanation = explanationMatch[1].trim();
        
        // 다음 줄들도 해설에 포함
        let j = i + 1;
        while (j < lines.length && !lines[j].match(/^(?:문제\s*)?\d+[\.)\s]/)) {
          currentQuestion.explanation += "\n" + lines[j].trim();
          j++;
        }
        i = j - 1;
        continue;
      }

      // 문제 텍스트 계속 수집
      if (inQuestion && !choiceMatch && !answerMatch && !explanationMatch && line) {
        questionText += " " + line;
      }

      // 빈 줄이면 문제 구역 종료
      if (!line && inQuestion) {
        inQuestion = false;
      }
    }

    // 마지막 문제 저장
    if (currentQuestion && questionText) {
      currentQuestion.questionText = questionText.trim();
      currentQuestion.choices = currentChoices;
      questions.push(currentQuestion as ExamQuestion);
    }

    // 불완전한 문제 표시
    questions.forEach(q => {
      if (!q.questionText || q.questionText.length < 10) {
        q.isIncomplete = true;
      }
      if (q.questionType === "multiple_choice" && (!q.choices || q.choices.length < 4)) {
        q.isIncomplete = true;
      }
      
      // 키워드 추출
      q.keywords = this.extractKeywords(q.questionText);
    });

    return questions;
  }

  private inferSubject(content: string, year: number, round: number): string {
    // 과목 추론 로직
    const subjectPatterns = {
      "수목병리학": ["병원균", "병해", "방제", "감염", "병징"],
      "수목생리학": ["광합성", "호흡", "증산", "양분", "생장"],
      "수목해충학": ["해충", "천적", "살충제", "피해", "방제법"],
      "산림토양학": ["토양", "양분", "pH", "유기물", "토성"],
      "조림학": ["식재", "육묘", "갱신", "조림", "수종"],
    };

    for (const [subject, keywords] of Object.entries(subjectPatterns)) {
      const matchCount = keywords.filter(keyword => 
        content.toLowerCase().includes(keyword)
      ).length;
      
      if (matchCount >= 2) {
        return subject;
      }
    }

    return "미분류";
  }

  private extractKeywords(text: string): string[] {
    // 간단한 키워드 추출 로직
    const keywords: string[] = [];
    
    // 전문 용어 패턴
    const technicalTerms = text.match(/[가-힣]+(?:균|충|병|제|법|학|성|소|체|액|산|염|계)/g);
    if (technicalTerms) {
      keywords.push(...technicalTerms);
    }

    // 영문 용어
    const englishTerms = text.match(/[A-Z][a-z]+(?:\s+[a-z]+)?/g);
    if (englishTerms) {
      keywords.push(...englishTerms);
    }

    // 중복 제거
    return Array.from(new Set(keywords)).slice(0, 10);
  }

  async importDirectory(directoryPath: string) {
    const files = await fs.readdir(directoryPath);
    const markdownFiles = files.filter(f => f.endsWith(".md"));
    
    console.log(`📁 ${markdownFiles.length}개의 마크다운 파일을 찾았습니다.`);

    let totalImported = 0;
    let totalFailed = 0;

    for (const file of markdownFiles) {
      const filePath = path.join(directoryPath, file);
      console.log(`\n📄 처리 중: ${file}`);

      try {
        const questions = await this.parseMarkdownFile(filePath);
        
        for (const question of questions) {
          try {
            const questionId = await this.insertQuestion(question);
            
            if (question.choices) {
              await this.insertChoices(questionId, question.choices);
            }
            
            if (question.correctAnswer) {
              await this.insertAnswer(questionId, question.correctAnswer, question.explanation);
            }
            
            if (question.keywords) {
              await this.insertKeywords(questionId, question.keywords);
            }

            totalImported++;
            
            if (question.isIncomplete) {
              console.log(`  ⚠️  문제 ${question.questionNumber}: 불완전한 데이터`);
            } else {
              console.log(`  ✅ 문제 ${question.questionNumber}: 임포트 완료`);
            }
          } catch (error) {
            console.error(`  ❌ 문제 ${question.questionNumber} 임포트 실패:`, error);
            totalFailed++;
          }
        }
      } catch (error) {
        console.error(`❌ 파일 처리 실패:`, error);
      }
    }

    console.log(`\n📊 임포트 완료:`);
    console.log(`  - 성공: ${totalImported}개`);
    console.log(`  - 실패: ${totalFailed}개`);

    // 통계 출력
    await this.printStats();
  }

  private async printStats() {
    const stats = await new Promise<any>((resolve, reject) => {
      this.db.get(
        `SELECT 
          COUNT(*) as total_questions,
          COUNT(DISTINCT exam_year) as years,
          COUNT(DISTINCT subject) as subjects,
          SUM(CASE WHEN is_incomplete = 1 THEN 1 ELSE 0 END) as incomplete_count
        FROM exam_questions`,
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    console.log(`\n📈 데이터베이스 통계:`);
    console.log(`  - 총 문제 수: ${stats.total_questions}개`);
    console.log(`  - 연도: ${stats.years}개`);
    console.log(`  - 과목: ${stats.subjects}개`);
    console.log(`  - 불완전한 데이터: ${stats.incomplete_count}개`);
  }

  async close() {
    return new Promise<void>((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

// CLI 실행
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log("사용법: npm run import-exams <디렉토리 경로>");
    console.log("예시: npm run import-exams /path/to/exam/markdown/files");
    process.exit(1);
  }

  const directoryPath = args[0];
  const importer = new ExamImporter();

  try {
    await importer.initialize();
    await importer.importDirectory(directoryPath);
    await importer.close();
    
    console.log("\n✅ 모든 작업이 완료되었습니다.");
  } catch (error) {
    console.error("❌ 오류 발생:", error);
    process.exit(1);
  }
}

// 직접 실행 감지
if (require.main === module) {
  main();
}