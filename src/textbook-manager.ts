import { DatabaseManager } from "./database.js";
import { PDFProcessor, ProcessedPDF } from "./pdf-processor.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface Textbook {
  id: number;
  filePath: string;
  fileName: string;
  title: string;
  subject: string;
  pageCount: number;
  contentLength: number;
  processingMethod: string;
  createdAt: string;
  updatedAt: string;
}

export interface TextbookContent {
  id: number;
  textbookId: number;
  sectionTitle: string;
  content: string;
  pageStart: number;
  pageEnd: number;
  level: number;
  createdAt: string;
}

export interface SearchResult {
  textbook: Textbook;
  content: TextbookContent;
  relevanceScore: number;
  matchedText: string;
}

export class TextbookManager {
  private dbManager: DatabaseManager;
  private pdfProcessor: PDFProcessor;
  private textbooksPath: string;

  constructor(dbManager: DatabaseManager) {
    this.dbManager = dbManager;
    this.pdfProcessor = new PDFProcessor();
    this.textbooksPath = path.join(__dirname, "..", "textbooks");
  }

  /**
   * 교재 디렉토리 초기화
   */
  async initializeTextbooks(): Promise<void> {
    try {
      await fs.mkdir(this.textbooksPath, { recursive: true });
      
      // 데이터베이스 테이블 생성
      await this.createTextbookTables();
      
      console.error("📚 교재 관리 시스템 초기화 완료");
    } catch (error) {
      console.error(`❌ 교재 시스템 초기화 실패: ${error}`);
      throw error;
    }
  }

  /**
   * 교재 테이블 생성
   */
  private async createTextbookTables(): Promise<void> {
    const db = (this.dbManager as any).db;
    if (!db) throw new Error("Database not initialized");

    const run = (sql: string, params?: any[]): Promise<void> => {
      return new Promise((resolve, reject) => {
        db.run(sql, params, (err: any) => {
          if (err) reject(err);
          else resolve();
        });
      });
    };

    // 교재 테이블
    await run(`
      CREATE TABLE IF NOT EXISTS textbooks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_path TEXT NOT NULL UNIQUE,
        file_name TEXT NOT NULL,
        title TEXT NOT NULL,
        subject TEXT NOT NULL,
        page_count INTEGER DEFAULT 0,
        content_length INTEGER DEFAULT 0,
        processing_method TEXT DEFAULT 'text',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 교재 내용 테이블
    await run(`
      CREATE TABLE IF NOT EXISTS textbook_contents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        textbook_id INTEGER NOT NULL,
        section_title TEXT,
        content TEXT NOT NULL,
        page_start INTEGER DEFAULT 1,
        page_end INTEGER DEFAULT 1,
        level INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (textbook_id) REFERENCES textbooks (id)
      )
    `);

    // 인덱스 생성
    await run(`CREATE INDEX IF NOT EXISTS idx_textbooks_subject ON textbooks(subject)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_textbooks_title ON textbooks(title)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_textbook_contents_textbook_id ON textbook_contents(textbook_id)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_textbook_contents_content ON textbook_contents(content)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_textbook_contents_section_title ON textbook_contents(section_title)`);
  }

  /**
   * PDF 디렉토리에서 모든 교재 로드
   */
  async loadTextbooksFromDirectory(directoryPath: string): Promise<void> {
    try {
      console.error(`📂 교재 로드 시작: ${directoryPath}`);
      
      const processedPDFs = await this.pdfProcessor.processDirectory(directoryPath);
      
      console.error(`📚 처리된 교재 수: ${processedPDFs.length}`);
      
      for (const pdf of processedPDFs) {
        await this.saveTextbook(pdf);
      }
      
      console.error(`✅ 모든 교재 로드 완료!`);
    } catch (error) {
      console.error(`❌ 교재 로드 실패: ${error}`);
      throw error;
    }
  }

  /**
   * 처리된 PDF를 데이터베이스에 저장
   */
  private async saveTextbook(pdf: ProcessedPDF): Promise<void> {
    const db = (this.dbManager as any).db;
    if (!db) throw new Error("Database not initialized");

    try {
      // 교재 정보 저장
      const textbookId = await new Promise<number>((resolve, reject) => {
        db.run(
          `INSERT OR REPLACE INTO textbooks 
           (file_path, file_name, title, subject, page_count, content_length, processing_method) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            pdf.filePath,
            pdf.fileName,
            pdf.title,
            pdf.subject,
            pdf.pageCount,
            pdf.content.length,
            pdf.processingMethod
          ],
          function(this: any, err: any) {
            if (err) reject(err);
            else resolve(this.lastID);
          }
        );
      });

      // 기존 내용 삭제
      await new Promise<void>((resolve, reject) => {
        db.run(
          `DELETE FROM textbook_contents WHERE textbook_id = ?`,
          [textbookId],
          (err: any) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      // 내용을 섹션별로 분할하여 저장
      const sections = this.splitContentIntoSections(pdf.content);
      
      for (const section of sections) {
        await new Promise<void>((resolve, reject) => {
          db.run(
            `INSERT INTO textbook_contents 
             (textbook_id, section_title, content, page_start, page_end, level) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              textbookId,
              section.title,
              section.content,
              section.pageStart,
              section.pageEnd,
              section.level
            ],
            (err: any) => {
              if (err) reject(err);
              else resolve();
            }
          );
        });
      }

      console.error(`✅ 저장 완료: ${pdf.title} (${sections.length}개 섹션)`);
    } catch (error) {
      console.error(`❌ 교재 저장 실패: ${pdf.title} - ${error}`);
      throw error;
    }
  }

  /**
   * 내용을 섹션별로 분할
   */
  private splitContentIntoSections(content: string): Array<{
    title: string;
    content: string;
    pageStart: number;
    pageEnd: number;
    level: number;
  }> {
    const sections: Array<{
      title: string;
      content: string;
      pageStart: number;
      pageEnd: number;
      level: number;
    }> = [];

    // 내용을 단락별로 분할
    const paragraphs = content.split(/\n\s*\n/);
    let currentSection = {
      title: "",
      content: "",
      pageStart: 1,
      pageEnd: 1,
      level: 1
    };

    let pageCounter = 1;
    let sectionCounter = 0;

    for (const paragraph of paragraphs) {
      const trimmed = paragraph.trim();
      if (!trimmed) continue;

      // 제목으로 보이는 패턴 감지
      if (this.isLikelyTitle(trimmed)) {
        if (currentSection.content) {
          sections.push({ ...currentSection });
          sectionCounter++;
        }

        currentSection = {
          title: trimmed,
          content: "",
          pageStart: Math.floor(sectionCounter / 3) + 1,
          pageEnd: Math.floor(sectionCounter / 3) + 1,
          level: this.getTitleLevel(trimmed)
        };
      } else {
        currentSection.content += paragraph + "\n\n";
      }
    }

    if (currentSection.content) {
      sections.push(currentSection);
    }

    // 섹션이 없는 경우 전체 내용을 하나의 섹션으로
    if (sections.length === 0) {
      sections.push({
        title: "전체 내용",
        content: content,
        pageStart: 1,
        pageEnd: Math.ceil(content.length / 3000),
        level: 1
      });
    }

    return sections;
  }

  /**
   * 제목 판별
   */
  private isLikelyTitle(text: string): boolean {
    const titlePatterns = [
      /^제\s*\d+\s*장/,
      /^제\s*\d+\s*절/,
      /^\d+\.\s*[가-힣]/,
      /^[가-힣]{2,15}$/,
      /^●\s*[가-힣]/,
      /^◆\s*[가-힣]/,
      /^▶\s*[가-힣]/,
      /^【[가-힣]+】/,
      /^〔[가-힣]+〕/,
    ];

    return titlePatterns.some(pattern => pattern.test(text)) && 
           text.length < 100 && 
           text.split('\n').length === 1;
  }

  /**
   * 제목 레벨 판별
   */
  private getTitleLevel(title: string): number {
    if (title.match(/^제\s*\d+\s*장/)) return 1;
    if (title.match(/^제\s*\d+\s*절/)) return 2;
    if (title.match(/^\d+\.\s*/)) return 3;
    if (title.match(/^[가-힣]{2,15}$/)) return 2;
    return 3;
  }

  /**
   * 교재 검색
   */
  async searchTextbooks(query: string, subject?: string, maxResults: number = 10): Promise<SearchResult[]> {
    const db = (this.dbManager as any).db;
    if (!db) throw new Error("Database not initialized");

    return new Promise<SearchResult[]>((resolve, reject) => {
      let sql = `
        SELECT 
          t.id, t.file_path, t.file_name, t.title, t.subject, t.page_count, 
          t.content_length, t.processing_method, t.created_at, t.updated_at,
          tc.id as content_id, tc.section_title, tc.content, 
          tc.page_start, tc.page_end, tc.level, tc.created_at as content_created_at
        FROM textbooks t
        JOIN textbook_contents tc ON t.id = tc.textbook_id
        WHERE tc.content LIKE ?
      `;

      const params: any[] = [`%${query}%`];

      if (subject) {
        sql += ` AND t.subject = ?`;
        params.push(subject);
      }

      sql += ` ORDER BY t.subject, t.title, tc.level, tc.page_start LIMIT ?`;
      params.push(maxResults);

      db.all(sql, params, (err: any, rows: any[]) => {
        if (err) reject(err);
        else {
          const results: SearchResult[] = rows.map(row => {
            const textbook: Textbook = {
              id: row.id,
              filePath: row.file_path,
              fileName: row.file_name,
              title: row.title,
              subject: row.subject,
              pageCount: row.page_count,
              contentLength: row.content_length,
              processingMethod: row.processing_method,
              createdAt: row.created_at,
              updatedAt: row.updated_at,
            };

            const content: TextbookContent = {
              id: row.content_id,
              textbookId: row.id,
              sectionTitle: row.section_title,
              content: row.content,
              pageStart: row.page_start,
              pageEnd: row.page_end,
              level: row.level,
              createdAt: row.content_created_at,
            };

            return {
              textbook,
              content,
              relevanceScore: this.calculateRelevanceScore(query, row.content),
              matchedText: this.extractMatchedText(query, row.content),
            };
          });

          resolve(results.sort((a, b) => b.relevanceScore - a.relevanceScore));
        }
      });
    });
  }

  /**
   * 관련도 점수 계산
   */
  private calculateRelevanceScore(query: string, content: string): number {
    const queryWords = query.toLowerCase().split(/\s+/);
    const contentLower = content.toLowerCase();
    
    let score = 0;
    for (const word of queryWords) {
      const matches = (contentLower.match(new RegExp(word, 'g')) || []).length;
      score += matches;
    }
    
    return score;
  }

  /**
   * 매칭된 텍스트 추출
   */
  private extractMatchedText(query: string, content: string): string {
    const queryWords = query.toLowerCase().split(/\s+/);
    const sentences = content.split(/[.!?]\s+/);
    
    for (const sentence of sentences) {
      const sentenceLower = sentence.toLowerCase();
      if (queryWords.some(word => sentenceLower.includes(word))) {
        return sentence.trim().substring(0, 200) + "...";
      }
    }
    
    return content.substring(0, 200) + "...";
  }

  /**
   * 교재 목록 조회
   */
  async getTextbooks(subject?: string): Promise<Textbook[]> {
    const db = (this.dbManager as any).db;
    if (!db) throw new Error("Database not initialized");

    return new Promise<Textbook[]>((resolve, reject) => {
      let sql = `SELECT * FROM textbooks`;
      const params: any[] = [];

      if (subject) {
        sql += ` WHERE subject = ?`;
        params.push(subject);
      }

      sql += ` ORDER BY subject, title`;

      db.all(sql, params, (err: any, rows: any[]) => {
        if (err) reject(err);
        else resolve(rows.map((row: any) => ({
          id: row.id,
          filePath: row.file_path,
          fileName: row.file_name,
          title: row.title,
          subject: row.subject,
          pageCount: row.page_count,
          contentLength: row.content_length,
          processingMethod: row.processing_method,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        })));
      });
    });
  }

  /**
   * 과목 목록 조회
   */
  async getSubjects(): Promise<string[]> {
    const db = (this.dbManager as any).db;
    if (!db) throw new Error("Database not initialized");

    return new Promise<string[]>((resolve, reject) => {
      db.all(
        `SELECT DISTINCT subject FROM textbooks ORDER BY subject`,
        (err: any, rows: any[]) => {
          if (err) reject(err);
          else resolve(rows.map((row: any) => row.subject));
        }
      );
    });
  }

  /**
   * 특정 교재의 내용 조회
   */
  async getTextbookContents(textbookId: number): Promise<TextbookContent[]> {
    const db = (this.dbManager as any).db;
    if (!db) throw new Error("Database not initialized");

    return new Promise<TextbookContent[]>((resolve, reject) => {
      db.all(
        `SELECT * FROM textbook_contents WHERE textbook_id = ? ORDER BY level, page_start`,
        [textbookId],
        (err: any, rows: any[]) => {
          if (err) reject(err);
          else resolve(rows.map((row: any) => ({
            id: row.id,
            textbookId: row.textbook_id,
            sectionTitle: row.section_title,
            content: row.content,
            pageStart: row.page_start,
            pageEnd: row.page_end,
            level: row.level,
            createdAt: row.created_at,
          })));
        }
      );
    });
  }

  /**
   * 교재 통계 조회
   */
  async getTextbookStats(): Promise<any> {
    const db = (this.dbManager as any).db;
    if (!db) throw new Error("Database not initialized");

    return new Promise<any>((resolve, reject) => {
      db.all(
        `SELECT 
          COUNT(*) as total_textbooks,
          COUNT(DISTINCT subject) as total_subjects,
          SUM(page_count) as total_pages,
          SUM(content_length) as total_content_length,
          subject,
          COUNT(*) as textbooks_per_subject
        FROM textbooks 
        GROUP BY subject`,
        (err: any, rows: any[]) => {
          if (err) reject(err);
          else {
            const stats = {
              totalTextbooks: rows.length > 0 ? rows[0].total_textbooks : 0,
              totalSubjects: rows.length > 0 ? rows[0].total_subjects : 0,
              totalPages: rows.reduce((sum: number, row: any) => sum + row.total_pages, 0),
              totalContentLength: rows.reduce((sum: number, row: any) => sum + row.total_content_length, 0),
              bySubject: rows.reduce((acc: any, row: any) => {
                acc[row.subject] = row.textbooks_per_subject;
                return acc;
              }, {}),
            };
            resolve(stats);
          }
        }
      );
    });
  }

  /**
   * 리소스 정리
   */
  async cleanup(): Promise<void> {
    await this.pdfProcessor.cleanup();
  }
}