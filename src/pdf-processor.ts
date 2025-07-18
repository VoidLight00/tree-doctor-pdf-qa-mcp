import fs from "fs/promises";
import path from "path";
import pdfParse from "pdf-parse";
import { createWorker } from "tesseract.js";
import { PDFDocument } from "pdf-lib";

export interface ProcessedPDF {
  filePath: string;
  fileName: string;
  title: string;
  content: string;
  pageCount: number;
  subject: string;
  markdown: string;
  processingMethod: "text" | "ocr" | "hybrid";
}

export interface PDFChapter {
  title: string;
  content: string;
  pageStart: number;
  pageEnd: number;
  level: number;
}

export class PDFProcessor {
  private ocrWorker: any = null;

  constructor() {}

  /**
   * OCR 워커 초기화
   */
  private async initOCRWorker() {
    if (!this.ocrWorker) {
      this.ocrWorker = await createWorker("kor");
    }
  }

  /**
   * PDF 파일 처리 및 마크다운 변환
   */
  async processPDF(filePath: string): Promise<ProcessedPDF> {
    try {
      const fileName = path.basename(filePath);
      const title = this.extractTitleFromFileName(fileName);
      const subject = this.classifySubject(fileName);

      console.error(`📚 Processing: ${fileName}`);

      // 1. PDF 텍스트 추출 시도
      const pdfBuffer = await fs.readFile(filePath);
      const pdfData = await pdfParse(pdfBuffer);

      let content = pdfData.text;
      let processingMethod: "text" | "ocr" | "hybrid" = "text";

      // 2. 텍스트가 부족한 경우 OCR 시도
      if (content.length < 1000) {
        console.error(`⚠️  텍스트가 부족합니다. OCR 처리 시도...`);
        try {
          const ocrContent = await this.performOCR(pdfBuffer);
          if (ocrContent.length > content.length) {
            content = ocrContent;
            processingMethod = "ocr";
          }
        } catch (error) {
          console.error(`❌ OCR 실패: ${error}`);
        }
      }

      // 3. 마크다운 변환
      const markdown = this.convertToMarkdown(content, title, subject);

      const result: ProcessedPDF = {
        filePath,
        fileName,
        title,
        content: content.trim(),
        pageCount: pdfData.numpages,
        subject,
        markdown,
        processingMethod,
      };

      console.error(`✅ 완료: ${fileName} (${processingMethod})`);
      return result;
    } catch (error) {
      console.error(`❌ PDF 처리 실패: ${path.basename(filePath)} - ${error}`);
      throw error;
    }
  }

  /**
   * 디렉토리 내 모든 PDF 파일 처리
   */
  async processDirectory(directoryPath: string): Promise<ProcessedPDF[]> {
    try {
      const files = await fs.readdir(directoryPath);
      const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));
      
      console.error(`📂 발견된 PDF 파일: ${pdfFiles.length}개`);

      const results: ProcessedPDF[] = [];

      for (const [index, file] of pdfFiles.entries()) {
        const filePath = path.join(directoryPath, file);
        console.error(`\n🔄 진행률: ${index + 1}/${pdfFiles.length}`);
        
        try {
          const result = await this.processPDF(filePath);
          results.push(result);
          
          // 메모리 관리를 위한 잠시 대기
          if (index % 5 === 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error) {
          console.error(`❌ 파일 처리 실패: ${file} - ${error}`);
        }
      }

      return results;
    } catch (error) {
      console.error(`❌ 디렉토리 처리 실패: ${error}`);
      throw error;
    }
  }

  /**
   * OCR 처리
   */
  private async performOCR(pdfBuffer: Buffer): Promise<string> {
    try {
      await this.initOCRWorker();
      
      // PDF를 이미지로 변환 후 OCR
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      const pageCount = pdfDoc.getPageCount();
      
      let ocrText = "";
      
      // 처음 5페이지만 OCR 처리 (시간 절약)
      const maxPages = Math.min(pageCount, 5);
      
      for (let i = 0; i < maxPages; i++) {
        try {
          // 여기서는 간단히 텍스트만 반환
          // 실제로는 pdf2pic로 이미지 변환 후 OCR 처리해야 함
          const { data } = await this.ocrWorker.recognize(pdfBuffer);
          ocrText += data.text + "\n";
          break; // 첫 번째 페이지만 처리
        } catch (error) {
          console.error(`OCR 페이지 ${i + 1} 처리 실패: ${error}`);
        }
      }
      
      return ocrText;
    } catch (error) {
      console.error(`OCR 처리 실패: ${error}`);
      return "";
    }
  }

  /**
   * 파일명에서 제목 추출
   */
  private extractTitleFromFileName(fileName: string): string {
    let title = fileName.replace(/\.pdf$/i, "");
    
    // 일반적인 접두사 제거
    title = title.replace(/^\(용지\d+\)\s*/, "");
    title = title.replace(/^\[\d+\+\d+\]\s*/, "");
    title = title.replace(/^\[[\w가-힣]+\]\s*/, "");
    title = title.replace(/_3c_r5_2d.*$/, "");
    title = title.replace(/\s*\(\d+\)$/, "");
    
    return title.trim();
  }

  /**
   * 과목 분류
   */
  private classifySubject(fileName: string): string {
    const lowerName = fileName.toLowerCase();
    
    if (lowerName.includes("생리") || lowerName.includes("physiology")) {
      return "수목생리학";
    }
    if (lowerName.includes("병리") || lowerName.includes("병학") || lowerName.includes("병해")) {
      return "수목병리학";
    }
    if (lowerName.includes("해충") || lowerName.includes("곤충")) {
      return "수목해충학";
    }
    if (lowerName.includes("관리") || lowerName.includes("식재") || lowerName.includes("조경")) {
      return "수목관리학";
    }
    if (lowerName.includes("보호법") || lowerName.includes("법령")) {
      return "나무보호법";
    }
    if (lowerName.includes("토양")) {
      return "토양학";
    }
    if (lowerName.includes("형태") || lowerName.includes("구조")) {
      return "식물형태학";
    }
    if (lowerName.includes("일반식물") || lowerName.includes("식물학")) {
      return "일반식물학";
    }
    if (lowerName.includes("진단") || lowerName.includes("치료") || lowerName.includes("의학")) {
      return "수목의학";
    }
    if (lowerName.includes("기출") || lowerName.includes("문제")) {
      return "기출문제";
    }
    if (lowerName.includes("나무쌤") || lowerName.includes("이론서")) {
      return "종합이론";
    }
    
    return "일반";
  }

  /**
   * 마크다운 변환
   */
  private convertToMarkdown(content: string, title: string, subject: string): string {
    let markdown = `# ${title}\n\n`;
    markdown += `**과목**: ${subject}\n\n`;
    markdown += `---\n\n`;

    // 내용을 섹션별로 분할
    const sections = this.splitIntoSections(content);
    
    sections.forEach((section, index) => {
      if (section.title) {
        markdown += `## ${section.title}\n\n`;
      }
      
      if (section.content) {
        // 단락 구분
        const paragraphs = section.content.split(/\n\s*\n/);
        paragraphs.forEach(paragraph => {
          if (paragraph.trim()) {
            markdown += `${paragraph.trim()}\n\n`;
          }
        });
      }
    });

    return markdown;
  }

  /**
   * 텍스트를 섹션별로 분할
   */
  private splitIntoSections(content: string): PDFChapter[] {
    const sections: PDFChapter[] = [];
    
    // 간단한 섹션 분할 (실제로는 더 정교한 분할 필요)
    const lines = content.split('\n');
    let currentSection: PDFChapter = {
      title: "",
      content: "",
      pageStart: 1,
      pageEnd: 1,
      level: 1
    };

    let sectionCount = 0;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // 제목으로 보이는 패턴 감지
      if (this.isTitle(trimmedLine)) {
        if (currentSection.content) {
          sections.push({ ...currentSection });
          sectionCount++;
        }
        
        currentSection = {
          title: trimmedLine,
          content: "",
          pageStart: sectionCount + 1,
          pageEnd: sectionCount + 1,
          level: this.getTitleLevel(trimmedLine)
        };
      } else if (trimmedLine) {
        currentSection.content += line + "\n";
      }
    }
    
    if (currentSection.content) {
      sections.push(currentSection);
    }

    return sections;
  }

  /**
   * 제목 판별
   */
  private isTitle(line: string): boolean {
    // 제목 패턴들
    const titlePatterns = [
      /^제\s*\d+\s*장/,  // 제1장
      /^제\s*\d+\s*절/,  // 제1절
      /^\d+\.\s*[가-힣]/, // 1. 개요
      /^[가-힣]{2,10}$/,  // 단일 한글 제목
      /^[A-Z][a-z]+\s+[A-Z][a-z]+/, // 영어 제목
      /^●\s*[가-힣]/,    // ● 항목
      /^◆\s*[가-힣]/,    // ◆ 항목
    ];
    
    return titlePatterns.some(pattern => pattern.test(line)) && line.length < 100;
  }

  /**
   * 제목 레벨 판별
   */
  private getTitleLevel(title: string): number {
    if (title.match(/^제\s*\d+\s*장/)) return 1;
    if (title.match(/^제\s*\d+\s*절/)) return 2;
    if (title.match(/^\d+\.\s*/)) return 3;
    if (title.match(/^[가-힣]{2,10}$/)) return 2;
    return 3;
  }

  /**
   * 리소스 정리
   */
  async cleanup(): Promise<void> {
    if (this.ocrWorker) {
      await this.ocrWorker.terminate();
      this.ocrWorker = null;
    }
  }
}