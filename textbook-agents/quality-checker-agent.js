#!/usr/bin/env node
/**
 * 품질 검증 에이전트
 * 역할: 추출된 텍스트 품질 검증 및 보완
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class QualityChecker {
  constructor() {
    this.extractedDir = '/Users/voidlight/tree-doctor-pdf-qa-mcp/textbooks-extracted';
    this.agentsDir = '/Users/voidlight/tree-doctor-pdf-qa-mcp/textbook-agents';
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
    
    console.log('\n📊 최종 결과:');
    console.log('- 전체 교재: ' + report.summary.totalTextbooks + '개');
    console.log('- 성공: ' + report.summary.successfulExtractions + '개');
    console.log('- 실패: ' + report.summary.failedExtractions + '개');
    console.log('- 평균 품질: ' + report.summary.averageQuality);
    console.log('- 총 추출 크기: ' + report.summary.totalExtractedSize);
  }
}

const checker = new QualityChecker();
checker.run().catch(console.error);
