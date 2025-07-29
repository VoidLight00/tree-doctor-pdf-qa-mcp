import { DatabaseManager } from "./database.js";
import { ExamManager, ExamQuestion, ExamChoice, ExamAnswer } from "./exam-manager.js";
import sqlite3 from "sqlite3";
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 데이터 품질 플래그
export interface QualityFlags {
  dataQuality: 'high' | 'medium' | 'low' | 'template';
  completeness: 'complete' | 'partial' | 'minimal';
  verificationStatus: 'verified' | 'unverified' | 'auto-generated';
}

// 시험 구조 정보
export interface ExamStructure {
  examYear: string;
  totalQuestions: number;
  subjects: {
    [key: string]: {
      range: string;
      startNumber: number;
      endNumber: number;
    };
  };
}

// 검색 결과
export interface MVPSearchResult {
  questionId?: number;
  examYear: string;
  examRound: number;
  questionNumber: number;
  subject: string;
  questionText?: string;
  qualityFlags: QualityFlags;
  isTemplate: boolean;
}

// 데이터 통계
export interface DataStatistics {
  totalQuestions: number;
  highQualityCount: number;
  mediumQualityCount: number;
  lowQualityCount: number;
  templateCount: number;
  byExamYear: { [key: string]: number };
  bySubject: { [key: string]: number };
  completenessStats: {
    complete: number;
    partial: number;
    minimal: number;
  };
}

// 데이터 개선 기록
export interface DataImprovement {
  improvementType: 'question_text' | 'choices' | 'answer' | 'explanation' | 'keywords';
  oldValue?: string;
  newValue: string;
  contributorId?: string;
}

export class MVPIntegration {
  private db: sqlite3.Database | null = null;
  private examStructureCache: Map<string, ExamStructure> = new Map();

  constructor(
    private dbManager: DatabaseManager,
    private examManager: ExamManager
  ) {
    this.initializeExamStructures();
  }

  async initialize(): Promise<void> {
    // 데이터베이스 인스턴스 가져오기
    this.db = (this.dbManager as any).db;
    
    // 품질 플래그 컬럼 추가
    await this.addQualityColumns();
    
    // 데이터 개선 테이블 생성
    await this.createImprovementTable();
  }

  private async addQualityColumns(): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    const columns = [
      "ALTER TABLE exam_questions ADD COLUMN data_quality TEXT DEFAULT 'template'",
      "ALTER TABLE exam_questions ADD COLUMN completeness TEXT DEFAULT 'minimal'",
      "ALTER TABLE exam_questions ADD COLUMN verification_status TEXT DEFAULT 'unverified'"
    ];

    for (const sql of columns) {
      await new Promise<void>((resolve, reject) => {
        this.db!.run(sql, (err) => {
          // 컬럼이 이미 존재하는 경우 에러 무시
          if (err && !err.message.includes("duplicate column")) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    }
  }

  private async createImprovementTable(): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    const sql = `
      CREATE TABLE IF NOT EXISTS data_improvements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        question_id INTEGER NOT NULL,
        improvement_type TEXT NOT NULL,
        old_value TEXT,
        new_value TEXT,
        contributor_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (question_id) REFERENCES exam_questions(id)
      )
    `;

    await new Promise<void>((resolve, reject) => {
      this.db!.run(sql, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  private initializeExamStructures(): void {
    // 모든 회차의 과목별 문제 구조 정의
    const baseStructure = {
      totalQuestions: 150,
      subjects: {
        "수목병리학": { range: "1-30번", startNumber: 1, endNumber: 30 },
        "수목해충학": { range: "31-60번", startNumber: 31, endNumber: 60 },
        "수목생리학": { range: "61-90번", startNumber: 61, endNumber: 90 },
        "산림토양학": { range: "91-120번", startNumber: 91, endNumber: 120 },
        "정책 및 법규": { range: "121-150번", startNumber: 121, endNumber: 150 }
      }
    };

    // 5회차부터 11회차까지 구조 저장
    for (let i = 5; i <= 11; i++) {
      this.examStructureCache.set(`${i}회`, {
        examYear: `${i}회`,
        ...baseStructure
      });
    }
  }

  // 샘플 데이터 임포트 (현재 사용 가능한 1개 문제)
  async importSampleData(): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    // 5회차 1번 문제 (유일한 고품질 데이터)
    const sampleQuestion = {
      examYear: 5,
      examRound: 1,
      questionNumber: 1,
      subject: "수목병리학",
      questionText: "다음 중 수목병원체의 표징(sign)에 해당하지 않는 것은?",
      questionType: "multiple_choice",
      difficultyLevel: 2,
      points: 1,
      dataQuality: "high",
      completeness: "complete",
      verificationStatus: "verified"
    };

    const choices = [
      { choiceNumber: 1, choiceText: "균사(hyphae)", isCorrect: false },
      { choiceNumber: 2, choiceText: "포자(spore)", isCorrect: false },
      { choiceNumber: 3, choiceText: "자실체(fruiting body)", isCorrect: false },
      { choiceNumber: 4, choiceText: "병반(lesion)", isCorrect: true },
      { choiceNumber: 5, choiceText: "균핵(sclerotium)", isCorrect: false }
    ];

    const answer = {
      correctAnswer: "4",
      explanation: "병반(lesion)은 병징(symptom)에 해당하며, 나머지는 모두 병원체의 구조물인 표징이다."
    };

    const keywords = ["병원체", "표징", "병징", "수목병리학"];

    // 트랜잭션으로 데이터 삽입
    await new Promise<void>((resolve, reject) => {
      const db = this.db!;
      db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        // 문제 삽입
        db.run(
          `INSERT OR REPLACE INTO exam_questions 
           (exam_year, exam_round, question_number, subject, question_text, question_type, 
            difficulty_level, points, data_quality, completeness, verification_status, is_incomplete) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            sampleQuestion.examYear, sampleQuestion.examRound, sampleQuestion.questionNumber,
            sampleQuestion.subject, sampleQuestion.questionText, sampleQuestion.questionType,
            sampleQuestion.difficultyLevel, sampleQuestion.points, sampleQuestion.dataQuality,
            sampleQuestion.completeness, sampleQuestion.verificationStatus, 0
          ],
          function(err: Error | null) {
            if (err) {
              db.run("ROLLBACK");
              reject(err);
              return;
            }

            const questionId = this.lastID;

            // 선택지 삽입
            const choicePromises = choices.map(choice => 
              new Promise<void>((res, rej) => {
                db.run(
                  `INSERT OR REPLACE INTO exam_choices 
                   (question_id, choice_number, choice_text, is_correct) 
                   VALUES (?, ?, ?, ?)`,
                  [questionId, choice.choiceNumber, choice.choiceText, choice.isCorrect ? 1 : 0],
                  (err: Error | null) => err ? rej(err) : res()
                );
              })
            );

            // 정답 삽입
            const answerPromise = new Promise<void>((res, rej) => {
              db.run(
                `INSERT OR REPLACE INTO exam_answers 
                 (question_id, correct_answer, explanation) 
                 VALUES (?, ?, ?)`,
                [questionId, answer.correctAnswer, answer.explanation],
                (err: Error | null) => err ? rej(err) : res()
              );
            });

            // 키워드 삽입
            const keywordPromises = keywords.map((keyword, idx) => 
              new Promise<void>((res, rej) => {
                db.run(
                  `INSERT OR REPLACE INTO exam_keywords 
                   (question_id, keyword, importance) 
                   VALUES (?, ?, ?)`,
                  [questionId, keyword, 5 - idx],
                  (err: Error | null) => err ? rej(err) : res()
                );
              })
            );

            Promise.all([...choicePromises, answerPromise, ...keywordPromises])
              .then(() => {
                db.run("COMMIT");
                resolve();
              })
              .catch((err) => {
                db.run("ROLLBACK");
                reject(err);
              });
          }
        );
      });
    });
  }

  // 템플릿 구조 가져오기
  async getTemplateStructure(examYear: string): Promise<ExamStructure | null> {
    return this.examStructureCache.get(examYear) || null;
  }

  // 품질 플래그를 포함한 데이터 임포트
  async importWithQualityFlags(
    questionData: Partial<ExamQuestion>,
    qualityFlags: QualityFlags
  ): Promise<number> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise<number>((resolve, reject) => {
      this.db!.run(
        `INSERT INTO exam_questions 
         (exam_year, exam_round, question_number, subject, question_text, question_type,
          difficulty_level, points, data_quality, completeness, verification_status, is_incomplete) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          questionData.examYear, questionData.examRound, questionData.questionNumber,
          questionData.subject, questionData.questionText || "[문제 내용 입력 필요]",
          questionData.questionType || "multiple_choice",
          questionData.difficultyLevel, questionData.points || 1,
          qualityFlags.dataQuality, qualityFlags.completeness, qualityFlags.verificationStatus,
          qualityFlags.dataQuality === 'template' ? 1 : 0
        ],
        function(err: Error | null) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  // 부분 데이터 검색
  async searchPartialData(
    query: string,
    includeTemplates: boolean = false
  ): Promise<MVPSearchResult[]> {
    if (!this.db) throw new Error("Database not initialized");

    // 먼저 구조 정보에서 검색
    const structuralResults: MVPSearchResult[] = [];
    
    // 과목명으로 검색
    for (const [examYear, structure] of this.examStructureCache) {
      for (const [subject, info] of Object.entries(structure.subjects)) {
        if (subject.toLowerCase().includes(query.toLowerCase())) {
          // 해당 과목의 모든 문제 번호 추가
          for (let num = info.startNumber; num <= info.endNumber; num++) {
            structuralResults.push({
              examYear,
              examRound: 1,
              questionNumber: num,
              subject,
              qualityFlags: {
                dataQuality: 'template',
                completeness: 'minimal',
                verificationStatus: 'auto-generated'
              },
              isTemplate: true
            });
          }
        }
      }
    }

    // 데이터베이스에서 실제 데이터 검색
    const dbResults = await new Promise<MVPSearchResult[]>((resolve, reject) => {
      let sql = `
        SELECT 
          q.id, q.exam_year, q.exam_round, q.question_number, 
          q.subject, q.question_text, q.data_quality, 
          q.completeness, q.verification_status
        FROM exam_questions q
        WHERE (q.question_text LIKE ? OR q.subject LIKE ?)
      `;
      
      const params = [`%${query}%`, `%${query}%`];
      
      if (!includeTemplates) {
        sql += ` AND q.data_quality != 'template'`;
      }

      sql += ` ORDER BY q.data_quality DESC, q.exam_year DESC LIMIT 50`;

      this.db!.all(sql, params, (err, rows: any[]) => {
        if (err) {
          reject(err);
          return;
        }

        const results = rows.map(row => ({
          questionId: row.id,
          examYear: `${row.exam_year}회`,
          examRound: row.exam_round,
          questionNumber: row.question_number,
          subject: row.subject,
          questionText: row.question_text,
          qualityFlags: {
            dataQuality: row.data_quality as any,
            completeness: row.completeness as any,
            verificationStatus: row.verification_status as any
          },
          isTemplate: row.data_quality === 'template'
        }));

        resolve(results);
      });
    });

    // 구조 정보와 DB 결과 병합 (중복 제거)
    const mergedResults = [...dbResults];
    const existingKeys = new Set(
      dbResults.map(r => `${r.examYear}-${r.questionNumber}`)
    );

    for (const structResult of structuralResults) {
      const key = `${structResult.examYear}-${structResult.questionNumber}`;
      if (!existingKeys.has(key)) {
        mergedResults.push(structResult);
      }
    }

    return mergedResults;
  }

  // 사용 가능한 데이터 통계
  async getAvailableDataStats(): Promise<DataStatistics> {
    if (!this.db) throw new Error("Database not initialized");

    const stats: DataStatistics = {
      totalQuestions: 1050, // 7회차 × 150문제
      highQualityCount: 0,
      mediumQualityCount: 0,
      lowQualityCount: 0,
      templateCount: 0,
      byExamYear: {},
      bySubject: {
        "수목병리학": 210,    // 7회차 × 30문제
        "수목해충학": 210,
        "수목생리학": 210,
        "산림토양학": 210,
        "정책 및 법규": 210
      },
      completenessStats: {
        complete: 0,
        partial: 0,
        minimal: 0
      }
    };

    // 실제 데이터 통계 조회
    const queries = {
      qualityCounts: `
        SELECT data_quality, COUNT(*) as count 
        FROM exam_questions 
        GROUP BY data_quality
      `,
      completenessCounts: `
        SELECT completeness, COUNT(*) as count 
        FROM exam_questions 
        GROUP BY completeness
      `,
      byYear: `
        SELECT exam_year, COUNT(*) as count 
        FROM exam_questions 
        GROUP BY exam_year
      `,
      bySubject: `
        SELECT subject, COUNT(*) as count 
        FROM exam_questions 
        WHERE data_quality != 'template'
        GROUP BY subject
      `
    };

    // 품질별 통계
    await new Promise<void>((resolve, reject) => {
      this.db!.all(queries.qualityCounts, (err, rows: any[]) => {
        if (err) {
          reject(err);
          return;
        }
        
        rows.forEach(row => {
          switch(row.data_quality) {
            case 'high': stats.highQualityCount = row.count; break;
            case 'medium': stats.mediumQualityCount = row.count; break;
            case 'low': stats.lowQualityCount = row.count; break;
            case 'template': stats.templateCount = row.count; break;
          }
        });
        resolve();
      });
    });

    // 완성도별 통계
    await new Promise<void>((resolve, reject) => {
      this.db!.all(queries.completenessCounts, (err, rows: any[]) => {
        if (err) {
          reject(err);
          return;
        }
        
        rows.forEach(row => {
          if (row.completeness in stats.completenessStats) {
            stats.completenessStats[row.completeness as keyof typeof stats.completenessStats] = row.count;
          }
        });
        resolve();
      });
    });

    // 연도별 통계
    await new Promise<void>((resolve, reject) => {
      this.db!.all(queries.byYear, (err, rows: any[]) => {
        if (err) {
          reject(err);
          return;
        }
        
        rows.forEach(row => {
          stats.byExamYear[`${row.exam_year}회`] = row.count;
        });
        resolve();
      });
    });

    return stats;
  }

  // 데이터 개선 추적
  async trackDataImprovement(
    questionId: number,
    improvement: DataImprovement
  ): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise<void>((resolve, reject) => {
      this.db!.run(
        `INSERT INTO data_improvements 
         (question_id, improvement_type, old_value, new_value, contributor_id) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          questionId,
          improvement.improvementType,
          improvement.oldValue,
          improvement.newValue,
          improvement.contributorId
        ],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  // 문제 템플릿 생성
  async generateQuestionTemplates(): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    for (const [examYear, structure] of this.examStructureCache) {
      const yearNum = parseInt(examYear.replace('회', ''));
      
      for (const [subject, info] of Object.entries(structure.subjects)) {
        for (let num = info.startNumber; num <= info.endNumber; num++) {
          await this.importWithQualityFlags(
            {
              examYear: yearNum,
              examRound: 1,
              questionNumber: num,
              subject,
              questionText: `[${subject} - 문제 ${num}번 내용을 입력하세요]`,
              questionType: "multiple_choice",
              points: 1
            },
            {
              dataQuality: 'template',
              completeness: 'minimal',
              verificationStatus: 'auto-generated'
            }
          );
        }
      }
    }
  }

  // 품질 업그레이드
  async upgradeQuestionQuality(
    questionId: number,
    newData: Partial<ExamQuestion>,
    newQualityFlags: Partial<QualityFlags>
  ): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    const updates: string[] = [];
    const values: any[] = [];

    // 문제 데이터 업데이트
    if (newData.questionText) {
      updates.push("question_text = ?");
      values.push(newData.questionText);
    }

    // 품질 플래그 업데이트
    if (newQualityFlags.dataQuality) {
      updates.push("data_quality = ?");
      values.push(newQualityFlags.dataQuality);
    }
    if (newQualityFlags.completeness) {
      updates.push("completeness = ?");
      values.push(newQualityFlags.completeness);
    }
    if (newQualityFlags.verificationStatus) {
      updates.push("verification_status = ?");
      values.push(newQualityFlags.verificationStatus);
    }

    // 불완전 플래그 업데이트
    if (newQualityFlags.dataQuality !== 'template') {
      updates.push("is_incomplete = ?");
      values.push(0);
    }

    values.push(questionId);

    await new Promise<void>((resolve, reject) => {
      this.db!.run(
        `UPDATE exam_questions SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        values,
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }
}