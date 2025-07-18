import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface PDFContent {
  id: number;
  filePath: string;
  bookTitle: string;
  page: number;
  content: string;
  createdAt: string;
}

export interface Bookmark {
  id: number;
  title: string;
  content: string;
  type: "question" | "concept" | "explanation" | "source";
  tags?: string[];
  createdAt: string;
}

export interface Concept {
  id: number;
  keyword: string;
  description: string;
  subject?: string;
  createdAt: string;
}

export interface Flashcard {
  id: number;
  front: string;
  back: string;
  subject: string;
  concepts?: string[];
  reviewCount: number;
  lastReviewed?: string;
  createdAt: string;
}

export interface StudyMaterial {
  id: number;
  title?: string;
  keyword?: string;
  content?: string;
  description?: string;
  type: string;
  subject?: string;
  createdAt: string;
}

export class DatabaseManager {
  private db: sqlite3.Database | null = null;
  private dbPath: string;

  constructor() {
    this.dbPath = path.join(__dirname, "..", "tree-doctor-pdf-qa.db");
  }

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          reject(err);
        } else {
          this.createTables().then(resolve).catch(reject);
        }
      });
    });
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    const run = (sql: string, params?: any[]): Promise<void> => {
      return new Promise((resolve, reject) => {
        this.db!.run(sql, params, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    };

    // PDF 내용 테이블
    await run(`
      CREATE TABLE IF NOT EXISTS pdf_contents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_path TEXT NOT NULL,
        book_title TEXT NOT NULL,
        page INTEGER NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(file_path, page)
      )
    `);

    // 북마크 테이블
    await run(`
      CREATE TABLE IF NOT EXISTS bookmarks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('question', 'concept', 'explanation', 'source')),
        tags TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 개념 테이블
    await run(`
      CREATE TABLE IF NOT EXISTS concepts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        keyword TEXT NOT NULL,
        description TEXT NOT NULL,
        subject TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 암기카드 테이블
    await run(`
      CREATE TABLE IF NOT EXISTS flashcards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        front TEXT NOT NULL,
        back TEXT NOT NULL,
        subject TEXT NOT NULL,
        concepts TEXT,
        review_count INTEGER DEFAULT 0,
        last_reviewed DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 인덱스 생성
    await run(`CREATE INDEX IF NOT EXISTS idx_pdf_content ON pdf_contents(content)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_book_title ON pdf_contents(book_title)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_bookmark_type ON bookmarks(type)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_concept_keyword ON concepts(keyword)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_flashcard_subject ON flashcards(subject)`);
  }

  async addPDFContent(filePath: string, bookTitle: string, page: number, content: string): Promise<number> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise<number>((resolve, reject) => {
      this.db!.run(
        `INSERT OR REPLACE INTO pdf_contents (file_path, book_title, page, content) 
         VALUES (?, ?, ?, ?)`,
        [filePath, bookTitle, page, content],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  async searchPDFContent(query: string, maxResults: number = 5): Promise<PDFContent[]> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise<PDFContent[]>((resolve, reject) => {
      this.db!.all(
        `SELECT * FROM pdf_contents 
         WHERE content LIKE ? 
         ORDER BY LENGTH(content) ASC
         LIMIT ?`,
        [`%${query}%`, maxResults],
        (err, rows: any[]) => {
          if (err) reject(err);
          else resolve(rows.map((row: any) => ({
            id: row.id,
            filePath: row.file_path,
            bookTitle: row.book_title,
            page: row.page,
            content: row.content,
            createdAt: row.created_at,
          })));
        }
      );
    });
  }

  async createBookmark(title: string, content: string, type: string, tags?: string[]): Promise<Bookmark> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise<Bookmark>((resolve, reject) => {
      this.db!.run(
        `INSERT INTO bookmarks (title, content, type, tags) VALUES (?, ?, ?, ?)`,
        [title, content, type, tags ? JSON.stringify(tags) : null],
        function(err) {
          if (err) reject(err);
          else {
            const lastID = this.lastID;
            resolve({
              id: lastID,
              title,
              content,
              type: type as any,
              tags,
              createdAt: new Date().toISOString(),
            });
          }
        }
      );
    });
  }

  async getBookmarks(type?: string, tags?: string[]): Promise<Bookmark[]> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise<Bookmark[]>((resolve, reject) => {
      let query = `SELECT * FROM bookmarks`;
      const params: any[] = [];

      if (type && type !== "all") {
        query += ` WHERE type = ?`;
        params.push(type);
      }

      if (tags && tags.length > 0) {
        const tagConditions = tags.map(() => `tags LIKE ?`).join(" AND ");
        query += type && type !== "all" ? ` AND (${tagConditions})` : ` WHERE (${tagConditions})`;
        tags.forEach(tag => params.push(`%"${tag}"%`));
      }

      query += ` ORDER BY created_at DESC`;

      this.db!.all(query, params, (err, rows: any[]) => {
        if (err) reject(err);
        else resolve(rows.map((row: any) => ({
          id: row.id,
          title: row.title,
          content: row.content,
          type: row.type,
          tags: row.tags ? JSON.parse(row.tags) : undefined,
          createdAt: row.created_at,
        })));
      });
    });
  }

  async createConcept(keyword: string, description: string, subject?: string): Promise<Concept> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise<Concept>((resolve, reject) => {
      this.db!.run(
        `INSERT INTO concepts (keyword, description, subject) VALUES (?, ?, ?)`,
        [keyword, description, subject],
        function(err) {
          if (err) reject(err);
          else {
            const lastID = this.lastID;
            resolve({
              id: lastID,
              keyword,
              description,
              subject,
              createdAt: new Date().toISOString(),
            });
          }
        }
      );
    });
  }

  async createFlashcard(front: string, back: string, subject: string, concepts?: string[]): Promise<Flashcard> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise<Flashcard>((resolve, reject) => {
      this.db!.run(
        `INSERT INTO flashcards (front, back, subject, concepts) VALUES (?, ?, ?, ?)`,
        [front, back, subject, concepts ? JSON.stringify(concepts) : null],
        function(err) {
          if (err) reject(err);
          else {
            const lastID = this.lastID;
            resolve({
              id: lastID,
              front,
              back,
              subject,
              concepts,
              reviewCount: 0,
              lastReviewed: undefined,
              createdAt: new Date().toISOString(),
            });
          }
        }
      );
    });
  }

  async getStudyMaterials(type: string, subject?: string): Promise<StudyMaterial[]> {
    if (!this.db) throw new Error("Database not initialized");

    const materials: StudyMaterial[] = [];

    if (type === "concepts" || type === "all") {
      const concepts = await this.getConcepts(subject);
      materials.push(...concepts.map(concept => ({
        id: concept.id,
        keyword: concept.keyword,
        description: concept.description,
        type: "concept",
        subject: concept.subject,
        createdAt: concept.createdAt,
      })));
    }

    if (type === "flashcards" || type === "all") {
      const flashcards = await this.getFlashcards(subject);
      materials.push(...flashcards.map(flashcard => ({
        id: flashcard.id,
        title: flashcard.front,
        content: flashcard.back,
        type: "flashcard",
        subject: flashcard.subject,
        createdAt: flashcard.createdAt,
      })));
    }

    if (type === "bookmarks" || type === "all") {
      const bookmarks = await this.getBookmarks();
      materials.push(...bookmarks.map(bookmark => ({
        id: bookmark.id,
        title: bookmark.title,
        content: bookmark.content,
        type: bookmark.type,
        createdAt: bookmark.createdAt,
      })));
    }

    return materials.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  private async getConcepts(subject?: string): Promise<Concept[]> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise<Concept[]>((resolve, reject) => {
      let query = `SELECT * FROM concepts`;
      const params: any[] = [];

      if (subject) {
        query += ` WHERE subject = ?`;
        params.push(subject);
      }

      query += ` ORDER BY created_at DESC`;

      this.db!.all(query, params, (err, rows: any[]) => {
        if (err) reject(err);
        else resolve(rows.map((row: any) => ({
          id: row.id,
          keyword: row.keyword,
          description: row.description,
          subject: row.subject,
          createdAt: row.created_at,
        })));
      });
    });
  }

  private async getFlashcards(subject?: string): Promise<Flashcard[]> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise<Flashcard[]>((resolve, reject) => {
      let query = `SELECT * FROM flashcards`;
      const params: any[] = [];

      if (subject) {
        query += ` WHERE subject = ?`;
        params.push(subject);
      }

      query += ` ORDER BY created_at DESC`;

      this.db!.all(query, params, (err, rows: any[]) => {
        if (err) reject(err);
        else resolve(rows.map((row: any) => ({
          id: row.id,
          front: row.front,
          back: row.back,
          subject: row.subject,
          concepts: row.concepts ? JSON.parse(row.concepts) : undefined,
          reviewCount: row.review_count,
          lastReviewed: row.last_reviewed,
          createdAt: row.created_at,
        })));
      });
    });
  }

  async close(): Promise<void> {
    if (this.db) {
      return new Promise((resolve, reject) => {
        this.db!.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
  }
}