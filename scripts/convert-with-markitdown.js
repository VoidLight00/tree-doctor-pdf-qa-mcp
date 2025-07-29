#!/usr/bin/env node
import { Markitdown } from 'markitdown-js';
import fs from 'fs/promises';
import path from 'path';

// PDF 파일 목록
const pdfFiles = [
  { input: '/Users/voidlight/Downloads/[Codekiller]제5회 기출문제 해설집(v1.0).pdf', output: 'exam-5th-markitdown.md' },
  { input: '/Users/voidlight/Downloads/[Codekiller]제6회 기출문제 해설집(v1.0).pdf', output: 'exam-6th-markitdown.md' },
  { input: '/Users/voidlight/Downloads/[Codekiller]제7회 기출문제 해설집(v1.0).pdf', output: 'exam-7th-markitdown.md' },
  { input: '/Users/voidlight/Downloads/[Codekiller]제8회 기출문제 해설집(v1.0).pdf', output: 'exam-8th-markitdown.md' },
  { input: '/Users/voidlight/Downloads/[Codekiller]제9회 기출문제 해설집(v1.0).pdf', output: 'exam-9th-markitdown.md' },
  { input: '/Users/voidlight/Downloads/[Codekiller]제10회 기출문제 해설집(v1.0).pdf', output: 'exam-10th-markitdown.md' },
  { input: '/Users/voidlight/Downloads/제11회 나무의사 자격시험 1차 시험지.pdf', output: 'exam-11th-markitdown.md' }
];

async function convertPDF(pdfPath, outputName) {
  try {
    console.log(`변환 시작: ${path.basename(pdfPath)}`);
    
    const markitdown = new Markitdown({
      // PDF 변환 옵션
      extractImages: true,
      ocrEnabled: true,
      ocrLanguage: 'kor',  // 한국어 OCR
      pdfOptions: {
        dpi: 300,  // 고해상도
        preserveLayout: true
      }
    });
    
    // PDF 변환
    const markdown = await markitdown.convertFile(pdfPath);
    
    // 결과 저장
    const outputPath = path.join('/Users/voidlight/tree-doctor-pdf-qa-mcp/data', outputName);
    await fs.writeFile(outputPath, markdown, 'utf-8');
    
    // 라인 수 계산
    const lines = markdown.split('\n').length;
    console.log(`✅ 완료: ${outputName} (${lines}줄)`);
    
    return { success: true, lines, file: outputName };
  } catch (error) {
    console.error(`❌ 실패: ${path.basename(pdfPath)} - ${error.message}`);
    return { success: false, error: error.message, file: outputName };
  }
}

async function main() {
  console.log('🌳 나무의사 기출문제 PDF → Markdown 변환 시작\n');
  console.log('markitdown-js 라이브러리 사용\n');
  
  const results = [];
  
  // 순차적으로 처리 (메모리 관리)
  for (const pdf of pdfFiles) {
    const result = await convertPDF(pdf.input, pdf.output);
    results.push(result);
    
    // 잠시 대기 (메모리 정리)
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // 결과 요약
  console.log('\n📊 변환 결과 요약:');
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ 성공: ${successful.length}개`);
  successful.forEach(r => {
    console.log(`   - ${r.file}: ${r.lines}줄`);
  });
  
  if (failed.length > 0) {
    console.log(`\n❌ 실패: ${failed.length}개`);
    failed.forEach(r => {
      console.log(`   - ${r.file}: ${r.error}`);
    });
  }
  
  // 리포트 저장
  const report = {
    timestamp: new Date().toISOString(),
    total: pdfFiles.length,
    successful: successful.length,
    failed: failed.length,
    results: results
  };
  
  await fs.writeFile(
    '/Users/voidlight/tree-doctor-pdf-qa-mcp/data/markitdown-conversion-report.json',
    JSON.stringify(report, null, 2),
    'utf-8'
  );
  
  console.log('\n✅ 변환 완료! 리포트: data/markitdown-conversion-report.json');
}

// 실행
main().catch(console.error);