import { DatabaseManager } from "./database.js";
import sqlite3 from "sqlite3";

export interface ExamQuestion {
  id: number;
  examYear: number;
  examRound: number;
  questionNumber: number;
  subject: string;
  questionText: string;
  questionType: string;
  difficultyLevel?: number;
  points: number;
  isIncomplete: boolean;
  choices?: ExamChoice[];
  answer?: ExamAnswer;
  keywords?: string[];
  createdAt: string;
}

export interface ExamChoice {
  id: number;
  choiceNumber: number;
  choiceText: string;
  isCorrect: boolean;
}

export interface ExamAnswer {
  correctAnswer: string;
  explanation?: string;
  textbookReference?: string;
  pageReferences?: string;
}

export interface ExamSearchResult {
  question: ExamQuestion;
  relevanceScore: number;
  matchedKeywords: string[];
}

export interface MockExam {
  title: string;
  questions: ExamQuestion[];
  totalPoints: number;
  estimatedTime: number; // 분
}

export class ExamManager {
  private db: sqlite3.Database | null = null;

  constructor(private dbManager: DatabaseManager) {}

  async initialize() {
    // DatabaseManager의 db 인스턴스를 가져옴
    this.db = (this.dbManager as any).db;
  }

  // 기출문제 검색
  async searchExamQuestions(
    query: string,
    filters?: {
      subject?: string;
      yearFrom?: number;
      yearTo?: number;
      questionType?: string;
    },
    maxResults: number = 20
  ): Promise<ExamSearchResult[]> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise<ExamSearchResult[]>((resolve, reject) => {
      let sql = `
        SELECT DISTINCT
          q.*,
          a.correct_answer,
          a.explanation,
          a.textbook_reference,
          a.page_references,
          GROUP_CONCAT(DISTINCT k.keyword) as keywords
        FROM exam_questions q
        LEFT JOIN exam_answers a ON q.id = a.question_id
        LEFT JOIN exam_keywords k ON q.id = k.question_id
        WHERE (q.question_text LIKE ? OR k.keyword LIKE ?)
      `;

      const params: any[] = [`%${query}%`, `%${query}%`];

      // 필터 적용
      if (filters?.subject) {
        sql += ` AND q.subject = ?`;
        params.push(filters.subject);
      }
      if (filters?.yearFrom) {
        sql += ` AND q.exam_year >= ?`;
        params.push(filters.yearFrom);
      }
      if (filters?.yearTo) {
        sql += ` AND q.exam_year <= ?`;
        params.push(filters.yearTo);
      }
      if (filters?.questionType) {
        sql += ` AND q.question_type = ?`;
        params.push(filters.questionType);
      }

      sql += ` GROUP BY q.id ORDER BY q.exam_year DESC, q.exam_round DESC, q.question_number LIMIT ?`;
      params.push(maxResults);

      this.db!.all(sql, params, async (err, rows: any[]) => {
        if (err) {
          reject(err);
          return;
        }

        const results: ExamSearchResult[] = [];

        for (const row of rows) {
          const question = await this.mapRowToQuestion(row);
          
          // 관련성 점수 계산
          const relevanceScore = this.calculateRelevance(query, question);
          const matchedKeywords = question.keywords?.filter(k => 
            k.toLowerCase().includes(query.toLowerCase())
          ) || [];

          results.push({
            question,
            relevanceScore,
            matchedKeywords
          });
        }

        // 관련성 점수로 정렬
        results.sort((a, b) => b.relevanceScore - a.relevanceScore);
        resolve(results);
      });
    });
  }

  // 회차별 문제 조회
  async getExamByYear(year: number, round?: number): Promise<ExamQuestion[]> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise<ExamQuestion[]>((resolve, reject) => {
      let sql = `
        SELECT 
          q.*,
          a.correct_answer,
          a.explanation,
          a.textbook_reference,
          a.page_references
        FROM exam_questions q
        LEFT JOIN exam_answers a ON q.id = a.question_id
        WHERE q.exam_year = ?
      `;
      const params: any[] = [year];

      if (round !== undefined) {
        sql += ` AND q.exam_round = ?`;
        params.push(round);
      }

      sql += ` ORDER BY q.exam_round, q.question_number`;

      this.db!.all(sql, params, async (err, rows: any[]) => {
        if (err) {
          reject(err);
          return;
        }

        const questions: ExamQuestion[] = [];
        for (const row of rows) {
          questions.push(await this.mapRowToQuestion(row));
        }

        resolve(questions);
      });
    });
  }

  // 유사 문제 찾기
  async findSimilarQuestions(questionId: number, maxResults: number = 10): Promise<ExamSearchResult[]> {
    if (!this.db) throw new Error("Database not initialized");

    // 먼저 해당 문제의 키워드와 내용을 가져옴
    const sourceQuestion = await this.getQuestionById(questionId);
    if (!sourceQuestion) {
      throw new Error("Question not found");
    }

    return new Promise<ExamSearchResult[]>((resolve, reject) => {
      // 키워드 기반 유사 문제 검색
      const sql = `
        SELECT DISTINCT
          q2.*,
          a.correct_answer,
          a.explanation,
          a.textbook_reference,
          COUNT(DISTINCT k2.keyword) as shared_keywords
        FROM exam_questions q1
        JOIN exam_keywords k1 ON q1.id = k1.question_id
        JOIN exam_keywords k2 ON k1.keyword = k2.keyword
        JOIN exam_questions q2 ON k2.question_id = q2.id
        LEFT JOIN exam_answers a ON q2.id = a.question_id
        WHERE q1.id = ? AND q2.id != ?
        GROUP BY q2.id
        ORDER BY shared_keywords DESC, q2.exam_year DESC
        LIMIT ?
      `;

      this.db!.all(sql, [questionId, questionId, maxResults], async (err, rows: any[]) => {
        if (err) {
          reject(err);
          return;
        }

        const results: ExamSearchResult[] = [];

        for (const row of rows) {
          const question = await this.mapRowToQuestion(row);
          
          // 유사도 점수 계산
          const similarityScore = this.calculateSimilarity(sourceQuestion, question);
          
          results.push({
            question,
            relevanceScore: similarityScore,
            matchedKeywords: []
          });
        }

        resolve(results);
      });
    });
  }

  // 모의고사 생성
  async generateMockExam(options: {
    subjects?: string[];
    questionCount?: number;
    difficulty?: "easy" | "medium" | "hard" | "mixed";
    yearRange?: { from: number; to: number };
  }): Promise<MockExam> {
    if (!this.db) throw new Error("Database not initialized");

    const {
      subjects,
      questionCount = 50,
      difficulty = "mixed",
      yearRange
    } = options;

    return new Promise<MockExam>((resolve, reject) => {
      let sql = `
        SELECT 
          q.*,
          a.correct_answer,
          a.explanation,
          a.textbook_reference
        FROM exam_questions q
        LEFT JOIN exam_answers a ON q.id = a.question_id
        WHERE q.is_incomplete = 0
      `;
      const params: any[] = [];

      // 과목 필터
      if (subjects && subjects.length > 0) {
        sql += ` AND q.subject IN (${subjects.map(() => '?').join(',')})`;
        params.push(...subjects);
      }

      // 연도 범위 필터
      if (yearRange) {
        sql += ` AND q.exam_year BETWEEN ? AND ?`;
        params.push(yearRange.from, yearRange.to);
      }

      // 난이도 필터
      if (difficulty !== "mixed" && difficulty) {
        const difficultyLevel = {
          easy: [1, 2],
          medium: [2, 3, 4],
          hard: [4, 5]
        }[difficulty];
        
        if (difficultyLevel) {
          sql += ` AND q.difficulty_level BETWEEN ? AND ?`;
          params.push(difficultyLevel[0], difficultyLevel[1]);
        }
      }

      // 랜덤 선택
      sql += ` ORDER BY RANDOM() LIMIT ?`;
      params.push(questionCount);

      this.db!.all(sql, params, async (err, rows: any[]) => {
        if (err) {
          reject(err);
          return;
        }

        const questions: ExamQuestion[] = [];
        let totalPoints = 0;

        for (const row of rows) {
          const question = await this.mapRowToQuestion(row);
          questions.push(question);
          totalPoints += question.points;
        }

        // 예상 시간 계산 (객관식: 2분, 주관식: 5분)
        const estimatedTime = questions.reduce((total, q) => {
          return total + (q.questionType === "multiple_choice" ? 2 : 5);
        }, 0);

        const mockExam: MockExam = {
          title: `모의고사 - ${new Date().toLocaleDateString("ko-KR")}`,
          questions,
          totalPoints,
          estimatedTime
        };

        resolve(mockExam);
      });
    });
  }

  // 문제와 교재 내용 연결
  async linkQuestionToTextbook(
    questionId: number,
    textbookId: number,
    textbookContentId: number,
    relevanceScore: number
  ): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise<void>((resolve, reject) => {
      this.db!.run(
        `INSERT OR REPLACE INTO exam_textbook_links 
         (question_id, textbook_id, textbook_content_id, relevance_score) 
         VALUES (?, ?, ?, ?)`,
        [questionId, textbookId, textbookContentId, relevanceScore],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  // 통계 정보 조회
  async getExamStatistics(): Promise<any> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const queries = {
        totalQuestions: `SELECT COUNT(*) as count FROM exam_questions`,
        byYear: `SELECT exam_year, COUNT(*) as count FROM exam_questions GROUP BY exam_year ORDER BY exam_year DESC`,
        bySubject: `SELECT subject, COUNT(*) as count FROM exam_questions GROUP BY subject`,
        byType: `SELECT question_type, COUNT(*) as count FROM exam_questions GROUP BY question_type`,
        incompleteCount: `SELECT COUNT(*) as count FROM exam_questions WHERE is_incomplete = 1`,
        withAnswers: `SELECT COUNT(*) as count FROM exam_questions q JOIN exam_answers a ON q.id = a.question_id`,
        withExplanations: `SELECT COUNT(*) as count FROM exam_answers WHERE explanation IS NOT NULL`
      };

      const stats: any = {};

      Promise.all(
        Object.entries(queries).map(([key, query]) => 
          new Promise((res, rej) => {
            if (key === "byYear" || key === "bySubject" || key === "byType") {
              this.db!.all(query, (err, rows) => {
                if (err) rej(err);
                else {
                  stats[key] = rows;
                  res(undefined);
                }
              });
            } else {
              this.db!.get(query, (err, row: any) => {
                if (err) rej(err);
                else {
                  stats[key] = row.count;
                  res(undefined);
                }
              });
            }
          })
        )
      ).then(() => resolve(stats)).catch(reject);
    });
  }

  // Helper 메소드들
  private async getQuestionById(id: number): Promise<ExamQuestion | null> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      this.db!.get(
        `SELECT q.*, a.correct_answer, a.explanation 
         FROM exam_questions q 
         LEFT JOIN exam_answers a ON q.id = a.question_id 
         WHERE q.id = ?`,
        [id],
        async (err, row) => {
          if (err) reject(err);
          else if (!row) resolve(null);
          else resolve(await this.mapRowToQuestion(row));
        }
      );
    });
  }

  private async mapRowToQuestion(row: any): Promise<ExamQuestion> {
    const question: ExamQuestion = {
      id: row.id,
      examYear: row.exam_year,
      examRound: row.exam_round,
      questionNumber: row.question_number,
      subject: row.subject,
      questionText: row.question_text,
      questionType: row.question_type,
      difficultyLevel: row.difficulty_level,
      points: row.points || 1,
      isIncomplete: row.is_incomplete === 1,
      createdAt: row.created_at
    };

    // 선택지 가져오기
    if (question.questionType === "multiple_choice") {
      question.choices = await this.getChoices(question.id);
    }

    // 정답 정보
    if (row.correct_answer) {
      question.answer = {
        correctAnswer: row.correct_answer,
        explanation: row.explanation,
        textbookReference: row.textbook_reference,
        pageReferences: row.page_references
      };
    }

    // 키워드
    if (row.keywords) {
      question.keywords = row.keywords.split(",").filter((k: string) => k);
    } else {
      question.keywords = await this.getKeywords(question.id);
    }

    return question;
  }

  private async getChoices(questionId: number): Promise<ExamChoice[]> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      this.db!.all(
        `SELECT * FROM exam_choices WHERE question_id = ? ORDER BY choice_number`,
        [questionId],
        (err, rows: any[]) => {
          if (err) reject(err);
          else resolve(rows.map(row => ({
            id: row.id,
            choiceNumber: row.choice_number,
            choiceText: row.choice_text,
            isCorrect: row.is_correct === 1
          })));
        }
      );
    });
  }

  private async getKeywords(questionId: number): Promise<string[]> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      this.db!.all(
        `SELECT keyword FROM exam_keywords WHERE question_id = ? ORDER BY importance DESC`,
        [questionId],
        (err, rows: any[]) => {
          if (err) reject(err);
          else resolve(rows.map(row => row.keyword));
        }
      );
    });
  }

  private calculateRelevance(query: string, question: ExamQuestion): number {
    let score = 0;
    const queryLower = query.toLowerCase();
    const textLower = question.questionText.toLowerCase();

    // 정확한 매치
    if (textLower.includes(queryLower)) {
      score += 5;
    }

    // 단어별 매치
    const queryWords = queryLower.split(/\s+/);
    queryWords.forEach(word => {
      if (textLower.includes(word)) {
        score += 1;
      }
    });

    // 키워드 매치
    if (question.keywords) {
      question.keywords.forEach(keyword => {
        if (keyword.toLowerCase().includes(queryLower)) {
          score += 2;
        }
      });
    }

    return score;
  }

  private calculateSimilarity(q1: ExamQuestion, q2: ExamQuestion): number {
    let score = 0;

    // 같은 과목
    if (q1.subject === q2.subject) {
      score += 3;
    }

    // 같은 유형
    if (q1.questionType === q2.questionType) {
      score += 1;
    }

    // 키워드 겹침
    if (q1.keywords && q2.keywords) {
      const sharedKeywords = q1.keywords.filter(k => q2.keywords!.includes(k));
      score += sharedKeywords.length * 2;
    }

    // 텍스트 유사도 (간단한 구현)
    const words1 = new Set(q1.questionText.toLowerCase().split(/\s+/));
    const words2 = new Set(q2.questionText.toLowerCase().split(/\s+/));
    const intersection = [...words1].filter(w => words2.has(w));
    const union = new Set([...words1, ...words2]);
    
    if (union.size > 0) {
      score += (intersection.length / union.size) * 5;
    }

    return score;
  }
}