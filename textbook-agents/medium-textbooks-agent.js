#!/usr/bin/env node
/**
 * 중간 크기 교재 에이전트
 * 역할: 200-500MB 교재 고속 처리
 */

import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TextbookAgent {
  constructor() {
    this.agentId = 'medium-textbooks-agent';
    this.textbooks = [
  {
    "name": "(용지2) 식물형태학 - 새롭고 알기 쉬운 식물의 구조와 기능_3c_r5_2d.pdf",
    "path": "/Users/voidlight/Downloads/나무의사책들..1/(용지2) 식물형태학 - 새롭고 알기 쉬운 식물의 구조와 기능_3c_r5_2d.pdf",
    "size": 463531718,
    "sizeMB": 442,
    "category": "기타"
  },
  {
    "name": "나무쌤의 나무의사 2차 해충편 DVD_3c_r5_2d.pdf",
    "path": "/Users/voidlight/Downloads/나무의사책들.2/나무쌤의 나무의사 2차 해충편 DVD_3c_r5_2d.pdf",
    "size": 441972059,
    "sizeMB": 421,
    "category": "기타"
  },
  {
    "name": "2024 개정판 유튜버 나무쌤 나무의사 필기 - 핵심 이론서 + 단원별 마무리 문제집_3c_r5_2d.pdf",
    "path": "/Users/voidlight/Downloads/나무의사책들.2/2024 개정판 유튜버 나무쌤 나무의사 필기 - 핵심 이론서 + 단원별 마무리 문제집_3c_r5_2d.pdf",
    "size": 316062119,
    "sizeMB": 301,
    "category": "기타"
  },
  {
    "name": "나무쌤의 나무의사 2차 병해편 DVD_3c_r5_2d (1).pdf",
    "path": "/Users/voidlight/Downloads/나무의사책들.2/나무쌤의 나무의사 2차 병해편 DVD_3c_r5_2d (1).pdf",
    "size": 294447799,
    "sizeMB": 281,
    "category": "기타"
  },
  {
    "name": "수목의학 - 2차 수정판_3c_r5_2d (1).pdf",
    "path": "/Users/voidlight/Downloads/나무의사책들.3/수목의학 - 2차 수정판_3c_r5_2d (1).pdf",
    "size": 245959690,
    "sizeMB": 235,
    "category": "기타"
  },
  {
    "name": "[2+7] 삼고 산림보호학_3c_r5_2d (1).pdf",
    "path": "/Users/voidlight/Downloads/나무의사책들..1/[2+7] 삼고 산림보호학_3c_r5_2d (1).pdf",
    "size": 238078248,
    "sizeMB": 227,
    "category": "기타"
  },
  {
    "name": "2026 시대에듀 나무의사 필기 기출문제해설 한권으로 끝내기 - 2019~2025년 기출문제와 핵심요_3c_r5_2d (1).pdf",
    "path": "/Users/voidlight/Downloads/나무의사책들.2/2026 시대에듀 나무의사 필기 기출문제해설 한권으로 끝내기 - 2019~2025년 기출문제와 핵심요_3c_r5_2d (1).pdf",
    "size": 234538490,
    "sizeMB": 224,
    "category": "기타"
  },
  {
    "name": "[2+17] 토양학 (김계훈 외)_3c_r5_2d (1).pdf",
    "path": "/Users/voidlight/Downloads/나무의사책들..1/[2+17] 토양학 (김계훈 외)_3c_r5_2d (1).pdf",
    "size": 225346678,
    "sizeMB": 215,
    "category": "기타"
  }
];
    this.extractedDir = '/Users/voidlight/tree-doctor-pdf-qa-mcp/textbooks-extracted';
    this.results = [];
  }
  
  async run() {
    console.log('🤖 중간 크기 교재 에이전트 시작');
    console.log('처리할 교재: ' + this.textbooks.length + '개\n');
    
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
      path.join(__dirname, 'medium-textbooks-agent-results.json'),
      JSON.stringify({
        agentId: this.agentId,
        processed: this.textbooks.length,
        successful: this.results.filter(r => r.success).length,
        results: this.results
      }, null, 2)
    );
    
    console.log('✅ 중간 크기 교재 에이전트 완료!');
  }
  
  async extractWithMarkitdown(pdfPath, outputPath) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const pythonScript = `
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
`;
      
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
      const lines = content.split('\n');
      
      // 품질 평가 기준
      const quality = {
        totalLines: lines.length,
        nonEmptyLines: lines.filter(l => l.trim().length > 0).length,
        avgLineLength: content.length / lines.length,
        hasKorean: /[가-힣]/.test(content),
        hasNumbers: /\d/.test(content),
        hasTables: /\|/.test(content) || /\t/.test(content),
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
