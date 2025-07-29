import { PDFProcessor } from "../src/pdf-processor.js";
import { DatabaseManager } from "../src/database.js";
import { TextbookManager } from "../src/textbook-manager.js";
import fs from "fs/promises";
import path from "path";

const examPDFs = [
  '/Users/voidlight/Downloads/[Codekiller]제5회 기출문제 해설집(v1.0).pdf',
  '/Users/voidlight/Downloads/[Codekiller]제6회 기출문제 해설집(v1.0).pdf',
  '/Users/voidlight/Downloads/[Codekiller]제7회 기출문제 해설집(v1.0).pdf',
  '/Users/voidlight/Downloads/[Codekiller]제8회 기출문제 해설집(v1.0).pdf',
  '/Users/voidlight/Downloads/[Codekiller]제9회 기출문제 해설집(v1.0).pdf',
  '/Users/voidlight/Downloads/[Codekiller]제10회 기출문제 해설집(v1.0).pdf',
  '/Users/voidlight/Downloads/제11회 나무의사 자격시험 1차 시험지.pdf'
];

async function processExams() {
  console.log('🌳 나무의사 기출문제 처리 시작 (기존 시스템 활용)\n');
  
  const dbPath = path.join(process.cwd(), "tree-doctor-pdf-qa.db");
  const dbManager = new DatabaseManager(dbPath);
  const pdfProcessor = new PDFProcessor();
  const textbookManager = new TextbookManager(dbManager, pdfProcessor);
  
  try {
    // 데이터베이스 초기화
    await dbManager.initialize();
    
    // 각 PDF 처리
    for (const pdfPath of examPDFs) {
      try {
        console.log(`\n처리 중: ${path.basename(pdfPath)}`);
        
        // PDF 처리 (하이브리드 모드: 텍스트 추출 + OCR)
        const processed = await pdfProcessor.processPDF(pdfPath);
        
        // 마크다운 파일로 저장
        const examNumber = pdfPath.match(/제(\d+)회/)?.[1] || '0';
        const outputPath = path.join(
          process.cwd(), 
          'data', 
          `exam-${examNumber}th-processed.md`
        );
        
        await fs.writeFile(outputPath, processed.markdown, 'utf-8');
        
        console.log(`✅ 완료: ${path.basename(outputPath)}`);
        console.log(`   - 페이지 수: ${processed.pageCount}`);
        console.log(`   - 처리 방법: ${processed.processingMethod}`);
        console.log(`   - 과목: ${processed.subject}`);
        
        // 데이터베이스에도 저장
        const textbookId = await dbManager.run(
          `INSERT INTO textbooks (title, file_path, subject, page_count, processing_method, processed_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            processed.title,
            pdfPath,
            processed.subject,
            processed.pageCount,
            processed.processingMethod,
            new Date().toISOString()
          ]
        );
        
        // 챕터별로 저장
        const chapters = textbookManager.extractChapters(processed.markdown);
        for (const chapter of chapters) {
          await dbManager.run(
            `INSERT INTO textbook_contents (textbook_id, title, content, page_start, page_end, level)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              textbookId.lastID,
              chapter.title,
              chapter.content,
              chapter.pageStart,
              chapter.pageEnd,
              chapter.level
            ]
          );
        }
        
      } catch (error) {
        console.error(`❌ 실패: ${path.basename(pdfPath)} - ${error.message}`);
      }
    }
    
    // 통계 출력
    const stats = await dbManager.get(
      `SELECT COUNT(*) as count, 
              SUM(page_count) as total_pages 
       FROM textbooks 
       WHERE title LIKE '%기출문제%'`
    );
    
    console.log('\n📊 처리 결과:');
    console.log(`   - 총 파일 수: ${stats.count}`);
    console.log(`   - 총 페이지 수: ${stats.total_pages}`);
    
  } catch (error) {
    console.error('처리 중 오류:', error);
  } finally {
    await dbManager.close();
  }
}

// 실행
processExams().catch(console.error);