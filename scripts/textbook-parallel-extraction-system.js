#!/usr/bin/env node

/**
 * 나무의사 교재 병렬 텍스트 추출 시스템
 * 18개 교재를 효율적으로 처리하기 위한 멀티 에이전트 시스템
 */

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TextbookParallelExtractor {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.textbooksDir = path.join(this.projectRoot, 'textbooks');
    this.extractedDir = path.join(this.projectRoot, 'textbooks-extracted');
    this.agentsDir = path.join(this.projectRoot, 'textbook-agents');
    
    // 교재 소스 경로
    this.sourcePaths = [
      '/Users/voidlight/Downloads/나무의사책들..1',
      '/Users/voidlight/Downloads/나무의사책들.2',
      '/Users/voidlight/Downloads/나무의사책들.3'
    ];
    
    // 에이전트 설정 (교재 크기와 중요도에 따라 그룹화)
    this.agentGroups = [
      {
        id: 'large-textbooks-agent',
        name: '대용량 교재 전문 에이전트',
        role: '500MB 이상 대용량 교재 처리',
        maxFileSize: 1000 * 1024 * 1024, // 1GB
        minFileSize: 500 * 1024 * 1024,  // 500MB
        concurrent: 2 // 동시 처리 수
      },
      {
        id: 'medium-textbooks-agent',
        name: '중간 크기 교재 에이전트',
        role: '200-500MB 교재 고속 처리',
        maxFileSize: 500 * 1024 * 1024,
        minFileSize: 200 * 1024 * 1024,
        concurrent: 3
      },
      {
        id: 'small-textbooks-agent',
        name: '소형 교재 에이전트',
        role: '200MB 미만 교재 대량 처리',
        maxFileSize: 200 * 1024 * 1024,
        minFileSize: 0,
        concurrent: 5
      },
      {
        id: 'quality-checker-agent',
        name: '품질 검증 에이전트',
        role: '추출된 텍스트 품질 검증 및 보완',
        concurrent: 1
      }
    ];
  }
  
  async initialize() {
    // 디렉토리 생성
    await fs.mkdir(this.textbooksDir, { recursive: true });
    await fs.mkdir(this.extractedDir, { recursive: true });
    await fs.mkdir(this.agentsDir, { recursive: true });
    
    console.log('🚀 나무의사 교재 병렬 추출 시스템 시작...\n');
  }
  
  async collectTextbooks() {
    console.log('📚 교재 파일 수집 중...');
    const allTextbooks = [];
    
    for (const sourcePath of this.sourcePaths) {
      try {
        const files = await fs.readdir(sourcePath);
        for (const file of files) {
          if (file.endsWith('.pdf')) {
            const fullPath = path.join(sourcePath, file);
            const stats = await fs.stat(fullPath);
            
            allTextbooks.push({
              name: file,
              path: fullPath,
              size: stats.size,
              sizeMB: Math.round(stats.size / 1024 / 1024),
              category: this.categorizeTextbook(file)
            });
          }
        }
      } catch (err) {
        console.log(`⚠️ ${sourcePath} 접근 실패:`, err.message);
      }
    }
    
    // 크기별로 정렬
    allTextbooks.sort((a, b) => b.size - a.size);
    
    console.log(`✅ 총 ${allTextbooks.length}개 교재 발견\n`);
    this.printTextbooksSummary(allTextbooks);
    
    return allTextbooks;
  }
  
  categorizeTextbook(filename) {
    const categories = {
      '생리학': /생리학|physiology/i,
      '병리학': /병리학|병해|pathology/i,
      '해충학': /해충|곤충|insect/i,
      '토양학': /토양|soil/i,
      '수목진단': /진단|diagnosis/i,
      '수목의학': /수목의학|medicine/i,
      '형태학': /형태학|morphology/i,
      '일반': /일반|general/i,
      '기출문제': /기출|시험|문제/i,
      '2차시험': /2차|서술/i
    };
    
    for (const [category, pattern] of Object.entries(categories)) {
      if (pattern.test(filename)) return category;
    }
    return '기타';
  }
  
  printTextbooksSummary(textbooks) {
    console.log('📊 교재 분석 결과:');
    console.log('='.repeat(80));
    
    // 카테고리별 통계
    const categoryStats = {};
    let totalSize = 0;
    
    textbooks.forEach(book => {
      if (!categoryStats[book.category]) {
        categoryStats[book.category] = { count: 0, size: 0 };
      }
      categoryStats[book.category].count++;
      categoryStats[book.category].size += book.sizeMB;
      totalSize += book.sizeMB;
    });
    
    console.log('카테고리별 현황:');
    for (const [category, stats] of Object.entries(categoryStats)) {
      console.log(`- ${category}: ${stats.count}개 (${stats.size}MB)`);
    }
    
    console.log('\n크기별 분류:');
    console.log(`- 대용량 (500MB+): ${textbooks.filter(b => b.size >= 500*1024*1024).length}개`);
    console.log(`- 중간 (200-500MB): ${textbooks.filter(b => b.size >= 200*1024*1024 && b.size < 500*1024*1024).length}개`);
    console.log(`- 소형 (<200MB): ${textbooks.filter(b => b.size < 200*1024*1024).length}개`);
    
    console.log(`\n총 용량: ${(totalSize / 1024).toFixed(1)}GB`);
    console.log('='.repeat(80) + '\n');
  }
  
  async createAgentScript(agent, textbooks) {
    const scriptContent = `#!/usr/bin/env node
/**
 * ${agent.name}
 * 역할: ${agent.role}
 */

import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TextbookAgent {
  constructor() {
    this.agentId = '${agent.id}';
    this.textbooks = ${JSON.stringify(textbooks, null, 2)};
    this.extractedDir = '${this.extractedDir}';
    this.results = [];
  }
  
  async run() {
    console.log('🤖 ${agent.name} 시작');
    console.log('처리할 교재: ' + this.textbooks.length + '개\\n');
    
    for (const textbook of this.textbooks) {
      console.log('📖 처리 중: ' + textbook.name + ' (' + textbook.sizeMB + 'MB)');
      
      try {
        const outputPath = path.join(this.extractedDir, textbook.name.replace('.pdf', '.txt'));
        
        // markitdown 사용하여 텍스트 추출
        const result = await this.extractWithMarkitdown(textbook.path, outputPath);
        
        if (result.success) {
          // 추출된 텍스트 검증
          const quality = await this.validateExtraction(outputPath);
          
          this.results.push({
            textbook: textbook.name,
            success: true,
            outputPath,
            quality,
            size: result.size,
            extractionTime: result.time
          });
          
          console.log('✅ 완료: ' + textbook.name + ' (품질: ' + quality.score + '%)');
        } else {
          throw new Error(result.error);
        }
      } catch (error) {
        console.error('❌ 실패: ' + textbook.name);
        console.error('오류:', error.message);
        
        this.results.push({
          textbook: textbook.name,
          success: false,
          error: error.message
        });
      }
      
      console.log('');
    }
    
    // 결과 저장
    await fs.writeFile(
      path.join(__dirname, '${agent.id}-results.json'),
      JSON.stringify({
        agentId: this.agentId,
        processed: this.textbooks.length,
        successful: this.results.filter(r => r.success).length,
        results: this.results
      }, null, 2)
    );
    
    console.log('✅ ${agent.name} 완료!');
  }
  
  async extractWithMarkitdown(pdfPath, outputPath) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const pythonScript = \`
import sys
from markitdown import MarkItDown

md = MarkItDown()
try:
    result = md.convert(sys.argv[1])
    with open(sys.argv[2], 'w', encoding='utf-8') as f:
        f.write(result.text_content)
    print("SUCCESS")
except Exception as e:
    print(f"ERROR: {str(e)}")
\`;
      
      const child = spawn('python3', ['-c', pythonScript, pdfPath, outputPath]);
      
      let output = '';
      child.stdout.on('data', (data) => { output += data.toString(); });
      child.stderr.on('data', (data) => { output += data.toString(); });
      
      child.on('close', async (code) => {
        const endTime = Date.now();
        
        if (output.includes('SUCCESS')) {
          const stats = await fs.stat(outputPath);
          resolve({
            success: true,
            size: stats.size,
            time: (endTime - startTime) / 1000
          });
        } else {
          resolve({
            success: false,
            error: output
          });
        }
      });
    });
  }
  
  async validateExtraction(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\\n');
      
      // 품질 평가 기준
      const quality = {
        totalLines: lines.length,
        nonEmptyLines: lines.filter(l => l.trim().length > 0).length,
        avgLineLength: content.length / lines.length,
        hasKorean: /[가-힣]/.test(content),
        hasNumbers: /\\d/.test(content),
        hasTables: /\\|/.test(content) || /\\t/.test(content),
        score: 0
      };
      
      // 점수 계산
      if (quality.nonEmptyLines > 1000) quality.score += 30;
      else if (quality.nonEmptyLines > 500) quality.score += 20;
      else if (quality.nonEmptyLines > 100) quality.score += 10;
      
      if (quality.avgLineLength > 20 && quality.avgLineLength < 200) quality.score += 20;
      if (quality.hasKorean) quality.score += 20;
      if (quality.hasNumbers) quality.score += 10;
      if (quality.hasTables) quality.score += 20;
      
      return quality;
    } catch (error) {
      return { score: 0, error: error.message };
    }
  }
}

// 실행
const agent = new TextbookAgent();
agent.run().catch(console.error);
`;
    
    const scriptPath = path.join(this.agentsDir, `${agent.id}.js`);
    await fs.writeFile(scriptPath, scriptContent);
    return scriptPath;
  }
  
  async distributeTextbooks(textbooks) {
    const distribution = {};
    
    // 크기별로 에이전트에 할당
    for (const agent of this.agentGroups) {
      if (agent.id === 'quality-checker-agent') continue;
      
      distribution[agent.id] = textbooks.filter(book => 
        book.size >= agent.minFileSize && book.size < agent.maxFileSize
      );
    }
    
    return distribution;
  }
  
  async runParallelExtraction(distribution) {
    console.log('🎯 병렬 추출 시작...\n');
    
    const promises = [];
    const startTime = Date.now();
    
    // 각 에이전트별로 스크립트 생성 및 실행
    for (const agent of this.agentGroups) {
      if (agent.id === 'quality-checker-agent') continue;
      
      const agentTextbooks = distribution[agent.id] || [];
      if (agentTextbooks.length === 0) continue;
      
      const scriptPath = await this.createAgentScript(agent, agentTextbooks);
      
      // 병렬 실행
      const promise = new Promise((resolve, reject) => {
        const child = spawn('node', [scriptPath], {
          stdio: 'inherit' // 콘솔 출력 실시간 표시
        });
        
        child.on('close', (code) => {
          if (code === 0) {
            resolve({ agent: agent.id, success: true });
          } else {
            reject({ agent: agent.id, success: false });
          }
        });
      });
      
      promises.push(promise);
    }
    
    // 모든 에이전트 완료 대기
    const results = await Promise.allSettled(promises);
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000 / 60).toFixed(1);
    
    console.log(`\n✅ 병렬 추출 완료! (소요시간: ${duration}분)`);
    
    return results;
  }
  
  async runQualityCheck() {
    console.log('\n🔍 품질 검증 시작...');
    
    // 품질 검증 에이전트 실행
    const agent = this.agentGroups.find(a => a.id === 'quality-checker-agent');
    const scriptPath = await this.createQualityCheckerScript(agent);
    
    return new Promise((resolve, reject) => {
      const child = spawn('node', [scriptPath], {
        stdio: 'inherit'
      });
      
      child.on('close', (code) => {
        if (code === 0) {
          console.log('✅ 품질 검증 완료!');
          resolve(true);
        } else {
          reject(new Error('품질 검증 실패'));
        }
      });
    });
  }
  
  async createQualityCheckerScript(agent) {
    const scriptContent = `#!/usr/bin/env node
/**
 * ${agent.name}
 * 역할: ${agent.role}
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class QualityChecker {
  constructor() {
    this.extractedDir = '${this.extractedDir}';
    this.agentsDir = '${this.agentsDir}';
  }
  
  async run() {
    console.log('🔍 추출된 교재 품질 검증 중...');
    
    // 모든 에이전트 결과 수집
    const allResults = [];
    const files = await fs.readdir(this.agentsDir);
    
    for (const file of files) {
      if (file.endsWith('-results.json')) {
        const content = await fs.readFile(path.join(this.agentsDir, file), 'utf-8');
        allResults.push(JSON.parse(content));
      }
    }
    
    // 전체 통계
    let totalProcessed = 0;
    let totalSuccess = 0;
    let totalSize = 0;
    let avgQuality = 0;
    
    allResults.forEach(agentResult => {
      totalProcessed += agentResult.processed;
      totalSuccess += agentResult.successful;
      
      agentResult.results.forEach(result => {
        if (result.success && result.quality) {
          avgQuality += result.quality.score;
          totalSize += result.size || 0;
        }
      });
    });
    
    avgQuality = avgQuality / totalSuccess;
    
    // 최종 보고서 생성
    const report = {
      summary: {
        totalTextbooks: totalProcessed,
        successfulExtractions: totalSuccess,
        failedExtractions: totalProcessed - totalSuccess,
        averageQuality: avgQuality.toFixed(1) + '%',
        totalExtractedSize: (totalSize / 1024 / 1024).toFixed(1) + 'MB'
      },
      agentResults: allResults,
      timestamp: new Date().toISOString()
    };
    
    await fs.writeFile(
      path.join(this.extractedDir, 'extraction-report.json'),
      JSON.stringify(report, null, 2)
    );
    
    console.log('\\n📊 최종 결과:');
    console.log('- 전체 교재: ' + report.summary.totalTextbooks + '개');
    console.log('- 성공: ' + report.summary.successfulExtractions + '개');
    console.log('- 실패: ' + report.summary.failedExtractions + '개');
    console.log('- 평균 품질: ' + report.summary.averageQuality);
    console.log('- 총 추출 크기: ' + report.summary.totalExtractedSize);
  }
}

const checker = new QualityChecker();
checker.run().catch(console.error);
`;
    
    const scriptPath = path.join(this.agentsDir, `${agent.id}.js`);
    await fs.writeFile(scriptPath, scriptContent);
    return scriptPath;
  }
  
  async generateFinalReport() {
    console.log('\n📄 최종 리포트 생성 중...');
    
    const reportPath = path.join(this.projectRoot, 'TEXTBOOK-EXTRACTION-REPORT.md');
    let report = `# 📚 나무의사 교재 텍스트 추출 보고서\n\n`;
    report += `**생성일**: ${new Date().toISOString()}\n\n`;
    
    // 추출 결과 읽기
    try {
      const extractionReport = JSON.parse(
        await fs.readFile(path.join(this.extractedDir, 'extraction-report.json'), 'utf-8')
      );
      
      report += `## 📊 전체 결과\n\n`;
      report += `- **전체 교재**: ${extractionReport.summary.totalTextbooks}개\n`;
      report += `- **성공**: ${extractionReport.summary.successfulExtractions}개\n`;
      report += `- **실패**: ${extractionReport.summary.failedExtractions}개\n`;
      report += `- **평균 품질**: ${extractionReport.summary.averageQuality}\n`;
      report += `- **총 추출 크기**: ${extractionReport.summary.totalExtractedSize}\n\n`;
      
      report += `## 🤖 에이전트별 성과\n\n`;
      
      extractionReport.agentResults.forEach(agent => {
        report += `### ${agent.agentId}\n`;
        report += `- 처리: ${agent.processed}개\n`;
        report += `- 성공: ${agent.successful}개\n`;
        report += `- 성공률: ${((agent.successful / agent.processed) * 100).toFixed(1)}%\n\n`;
      });
      
    } catch (error) {
      report += `## ⚠️ 보고서 생성 오류\n\n`;
      report += error.message + '\n';
    }
    
    await fs.writeFile(reportPath, report);
    console.log(`✅ 리포트 생성 완료: ${reportPath}`);
  }
  
  async run() {
    await this.initialize();
    
    // 1. 교재 수집
    const textbooks = await this.collectTextbooks();
    
    // 2. 교재 분배
    const distribution = await this.distributeTextbooks(textbooks);
    
    // 3. 병렬 추출 실행
    await this.runParallelExtraction(distribution);
    
    // 4. 품질 검증
    await this.runQualityCheck();
    
    // 5. 최종 리포트 생성
    await this.generateFinalReport();
    
    console.log('\n🎉 모든 작업 완료!');
  }
}

// 실행
async function main() {
  const extractor = new TextbookParallelExtractor();
  await extractor.run();
}

main().catch(console.error);