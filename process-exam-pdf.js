import { PDFProcessor } from './dist/pdf-processor.js';
import fs from 'fs/promises';
import path from 'path';

async function processExamPDF() {
  const processor = new PDFProcessor();
  const pdfPath = '/Users/voidlight/Downloads/[Codekiller]제5회 기출문제 해설집(v1.0).pdf';
  const outputPath = '/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-5th.md';
  
  try {
    console.log('PDF 처리 시작...');
    const result = await processor.processPDF(pdfPath);
    
    console.log(`처리 완료: ${result.fileName}`);
    console.log(`페이지 수: ${result.pageCount}`);
    console.log(`처리 방법: ${result.processingMethod}`);
    console.log(`내용 길이: ${result.content.length} 글자`);
    
    // 마크다운 파일로 저장
    await fs.writeFile(outputPath, result.markdown, 'utf-8');
    console.log(`마크다운 파일 저장 완료: ${outputPath}`);
    
    // 원본 텍스트도 저장
    const rawTextPath = outputPath.replace('.md', '-raw.txt');
    await fs.writeFile(rawTextPath, result.content, 'utf-8');
    console.log(`원본 텍스트 저장 완료: ${rawTextPath}`);
    
  } catch (error) {
    console.error('처리 중 오류 발생:', error);
  } finally {
    await processor.cleanup();
  }
}

processExamPDF();