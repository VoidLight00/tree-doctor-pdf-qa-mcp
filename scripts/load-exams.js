#!/usr/bin/env node

// 나무의사 기출문제를 MCP 시스템에 로드하는 스크립트

const path = require('path');
const fs = require('fs').promises;

async function loadExamFiles() {
  console.log('🌳 나무의사 기출문제 로드 시작\n');
  
  const dataDir = path.join(__dirname, '..', 'data');
  
  // 이미 변환된 마크다운 파일들 확인
  const examFiles = [
    'exam-5th-complete.md',
    'exam-6th-complete.md', 
    'exam-7th-complete.md',
    'exam-8th-complete.md',
    'exam-9th-complete.md',
    'exam-10th-complete.md',
    'exam-11th-complete.md'
  ];
  
  const results = [];
  
  for (const file of examFiles) {
    const filePath = path.join(dataDir, file);
    try {
      const stats = await fs.stat(filePath);
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n').length;
      
      // 문제 수 계산 (대략적)
      const questionCount = (content.match(/문제 \d+/g) || []).length;
      
      results.push({
        file: file,
        size: (stats.size / 1024).toFixed(2) + ' KB',
        lines: lines,
        questions: questionCount,
        exists: true
      });
      
      console.log(`✅ ${file}: ${lines}줄, ${questionCount}개 문제`);
      
    } catch (error) {
      results.push({
        file: file,
        exists: false,
        error: error.message
      });
      console.log(`❌ ${file}: 파일 없음`);
    }
  }
  
  // 요약 리포트
  console.log('\n📊 기출문제 파일 요약:');
  const existing = results.filter(r => r.exists);
  const totalQuestions = existing.reduce((sum, r) => sum + r.questions, 0);
  const totalLines = existing.reduce((sum, r) => sum + r.lines, 0);
  
  console.log(`- 파일 수: ${existing.length}/7개`);
  console.log(`- 총 라인 수: ${totalLines.toLocaleString()}줄`);
  console.log(`- 추출된 문제 수: ${totalQuestions}개`);
  
  // MCP 시스템 활용 가이드
  console.log('\n💡 MCP 시스템 활용 방법:');
  console.log('1. Claude Desktop에서 다음 명령 사용:');
  console.log('   - "5회 기출문제를 검색해줘"');
  console.log('   - "수목병리학 관련 기출문제를 찾아줘"');
  console.log('   - "소나무재선충병 문제를 보여줘"');
  console.log('\n2. 개선이 필요한 부분:');
  console.log('   - OCR 품질 향상 필요');
  console.log('   - 문제 구조화 필요');
  console.log('   - 정답/해설 매칭 필요');
  
  // 리포트 저장
  const report = {
    timestamp: new Date().toISOString(),
    files: results,
    summary: {
      totalFiles: existing.length,
      totalLines: totalLines,
      totalQuestions: totalQuestions,
      averageQuestionsPerFile: (totalQuestions / existing.length).toFixed(1)
    }
  };
  
  await fs.writeFile(
    path.join(dataDir, 'exam-files-status.json'),
    JSON.stringify(report, null, 2),
    'utf-8'
  );
  
  console.log('\n✅ 상태 리포트 저장: data/exam-files-status.json');
}

// 실행
loadExamFiles().catch(console.error);