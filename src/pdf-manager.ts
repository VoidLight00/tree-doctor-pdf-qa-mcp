import fs from "fs/promises";
import path from "path";
import pdfParse from "pdf-parse";
import { DatabaseManager } from "./database.js";

export interface PDFDocument {
  filePath: string;
  title: string;
  totalPages: number;
  content: string;
}

export interface PDFPage {
  pageNumber: number;
  content: string;
}

export class PDFManager {
  private dbManager: DatabaseManager;
  private pdfCache: Map<string, PDFDocument> = new Map();

  constructor(dbManager: DatabaseManager) {
    this.dbManager = dbManager;
  }

  /**
   * PDF 파일을 로드하고 데이터베이스에 저장
   */
  async loadPDF(filePath: string): Promise<PDFDocument> {
    try {
      // 캐시에서 확인
      if (this.pdfCache.has(filePath)) {
        return this.pdfCache.get(filePath)!;
      }

      // 파일 존재 여부 확인
      await fs.access(filePath);
      
      // PDF 파일 읽기
      const pdfBuffer = await fs.readFile(filePath);
      const pdfData = await pdfParse(pdfBuffer);

      // 파일명에서 제목 추출
      const title = path.basename(filePath, ".pdf");

      const document: PDFDocument = {
        filePath,
        title,
        totalPages: pdfData.numpages,
        content: pdfData.text,
      };

      // 캐시에 저장
      this.pdfCache.set(filePath, document);

      // 페이지별로 내용 분할하여 데이터베이스에 저장
      await this.savePDFToDatabase(document);

      return document;
    } catch (error) {
      throw new Error(`PDF 로드 실패: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * PDF 내용을 페이지별로 데이터베이스에 저장
   */
  private async savePDFToDatabase(document: PDFDocument): Promise<void> {
    try {
      // 간단한 페이지 분할 (실제로는 더 정교한 분할이 필요)
      const pages = this.splitContentIntoPages(document.content, document.totalPages);
      
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        if (page.content.trim().length > 0) {
          await this.dbManager.addPDFContent(
            document.filePath,
            document.title,
            page.pageNumber,
            page.content
          );
        }
      }
    } catch (error) {
      console.error(`PDF 데이터베이스 저장 실패: ${error}`);
    }
  }

  /**
   * 전체 텍스트를 페이지별로 분할 (간단한 구현)
   */
  private splitContentIntoPages(content: string, totalPages: number): PDFPage[] {
    const pages: PDFPage[] = [];
    
    // 페이지 구분자로 분할 시도
    const pageBreaks = content.split(/\n\s*\n/);
    
    if (pageBreaks.length >= totalPages) {
      // 페이지 구분자가 충분한 경우
      for (let i = 0; i < totalPages && i < pageBreaks.length; i++) {
        pages.push({
          pageNumber: i + 1,
          content: pageBreaks[i].trim(),
        });
      }
    } else {
      // 균등하게 분할
      const chunkSize = Math.ceil(content.length / totalPages);
      for (let i = 0; i < totalPages; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, content.length);
        const chunk = content.substring(start, end).trim();
        
        if (chunk.length > 0) {
          pages.push({
            pageNumber: i + 1,
            content: chunk,
          });
        }
      }
    }

    return pages;
  }

  /**
   * 디렉토리에서 모든 PDF 파일을 로드
   */
  async loadPDFsFromDirectory(directoryPath: string): Promise<PDFDocument[]> {
    try {
      const files = await fs.readdir(directoryPath);
      const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));
      
      const documents: PDFDocument[] = [];
      
      for (const file of pdfFiles) {
        const filePath = path.join(directoryPath, file);
        try {
          const document = await this.loadPDF(filePath);
          documents.push(document);
          console.error(`✅ PDF 로드 완료: ${file}`);
        } catch (error) {
          console.error(`❌ PDF 로드 실패: ${file} - ${error}`);
        }
      }
      
      return documents;
    } catch (error) {
      throw new Error(`디렉토리 읽기 실패: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 특정 PDF의 특정 페이지 내용 가져오기
   */
  async getPageContent(filePath: string, pageNumber: number): Promise<string> {
    try {
      const document = await this.loadPDF(filePath);
      const pages = this.splitContentIntoPages(document.content, document.totalPages);
      
      const page = pages.find(p => p.pageNumber === pageNumber);
      return page ? page.content : "";
    } catch (error) {
      throw new Error(`페이지 내용 가져오기 실패: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * PDF 검색 (제목 기반)
   */
  searchPDFByTitle(query: string): PDFDocument[] {
    const results: PDFDocument[] = [];
    
    for (const document of this.pdfCache.values()) {
      if (document.title.toLowerCase().includes(query.toLowerCase())) {
        results.push(document);
      }
    }
    
    return results;
  }

  /**
   * 로드된 PDF 목록 가져오기
   */
  getLoadedPDFs(): PDFDocument[] {
    return Array.from(this.pdfCache.values());
  }

  /**
   * 캐시 초기화
   */
  clearCache(): void {
    this.pdfCache.clear();
  }

  /**
   * PDF 파일 유효성 검사
   */
  async validatePDF(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      const stats = await fs.stat(filePath);
      
      // 파일 크기 확인 (최대 1GB)
      if (stats.size > 1024 * 1024 * 1024) {
        throw new Error("PDF 파일이 너무 큽니다 (최대 1GB)");
      }
      
      // 확장자 확인
      if (!filePath.toLowerCase().endsWith('.pdf')) {
        throw new Error("PDF 파일이 아닙니다");
      }
      
      return true;
    } catch (error) {
      console.error(`PDF 유효성 검사 실패: ${error}`);
      return false;
    }
  }

  /**
   * 메모리 사용량 최적화를 위한 캐시 관리
   */
  manageCacheSize(maxSize: number = 10): void {
    if (this.pdfCache.size > maxSize) {
      // 가장 오래된 항목부터 제거
      const entries = Array.from(this.pdfCache.entries());
      const toRemove = entries.slice(0, entries.length - maxSize);
      
      toRemove.forEach(([filePath]) => {
        this.pdfCache.delete(filePath);
      });
    }
  }
}