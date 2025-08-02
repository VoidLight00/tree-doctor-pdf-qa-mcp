#!/usr/bin/env node

/**
 * 나무의사 교재 병렬 추출 시스템 (개선된 버전)
 * PyMuPDF와 pdfplumber를 활용한 안정적인 추출
 */

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ImprovedTextbookExtractor {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.textbooksDir = path.join(this.projectRoot, 'textbooks');
    this.extractedDir = path.join(this.projectRoot, 'textbooks-extracted');
    this.dbPath = path.join(this.projectRoot, 'tree-doctor-pdf-qa.db');
    
    // 교재 소스
    this.sourcePaths = [
      '/Users/voidlight/Downloads/나무의사책들..1',
      '/Users/voidlight/Downloads/나무의사책들.2',
      '/Users/voidlight/Downloads/나무의사책들.3'
    ];
  }
  
  async initialize() {
    await fs.mkdir(this.textbooksDir, { recursive: true });
    await fs.mkdir(this.extractedDir, { recursive: true });
    console.log('🚀 개선된 교재 추출 시스템 시작...\n');
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
    
    console.log(`✅ 총 ${allTextbooks.length}개 교재 발견\n`);
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
  
  async extractTextbook(textbook) {
    console.log(`\n📖 처리 중: ${textbook.name} (${textbook.sizeMB}MB)`);
    
    const outputPath = path.join(this.extractedDir, textbook.name.replace('.pdf', '.txt'));
    
    // Python 스크립트로 추출
    const pythonScript = `
import sys
import pdfplumber
import fitz  # PyMuPDF

def extract_with_pdfplumber(pdf_path):
    text = ""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for i, page in enumerate(pdf.pages):
                page_text = page.extract_text()
                if page_text:
                    text += f"\\n--- 페이지 {i+1} ---\\n"
                    text += page_text
                    text += "\\n"
    except Exception as e:
        print(f"pdfplumber 오류: {e}")
    return text

def extract_with_pymupdf(pdf_path):
    text = ""
    try:
        pdf_document = fitz.open(pdf_path)
        for i, page in enumerate(pdf_document):
            page_text = page.get_text()
            if page_text:
                text += f"\\n--- 페이지 {i+1} ---\\n"
                text += page_text
                text += "\\n"
        pdf_document.close()
    except Exception as e:
        print(f"PyMuPDF 오류: {e}")
    return text

# 두 방법으로 추출 시도
pdf_path = sys.argv[1]
output_path = sys.argv[2]

print(f"추출 시작: {pdf_path}")

# pdfplumber로 먼저 시도
text1 = extract_with_pdfplumber(pdf_path)

# PyMuPDF로도 시도
text2 = extract_with_pymupdf(pdf_path)

# 더 많은 텍스트를 추출한 것 선택
final_text = text1 if len(text1) > len(text2) else text2

if final_text:
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(final_text)
    print(f"SUCCESS: {len(final_text)} 글자 추출됨")
else:
    print("ERROR: 텍스트 추출 실패")
`;
    
    return new Promise((resolve) => {
      const child = spawn('python3', ['-c', pythonScript, textbook.path, outputPath]);
      
      let output = '';
      child.stdout.on('data', (data) => { output += data.toString(); });
      child.stderr.on('data', (data) => { output += data.toString(); });
      
      child.on('close', async (code) => {
        if (output.includes('SUCCESS')) {
          const stats = await fs.stat(outputPath);
          console.log(`✅ 성공: ${textbook.name} (${(stats.size / 1024).toFixed(1)}KB)`);
          resolve({ success: true, outputPath, size: stats.size });
        } else {
          console.log(`❌ 실패: ${textbook.name}`);
          console.log(`오류: ${output}`);
          resolve({ success: false, error: output });
        }
      });
    });
  }
  
  async extractAllTextbooks(textbooks) {
    console.log('\n🎯 교재 추출 시작...');
    
    const results = [];
    const batchSize = 3; // 동시 처리할 교재 수
    
    // 배치별로 처리
    for (let i = 0; i < textbooks.length; i += batchSize) {
      const batch = textbooks.slice(i, i + batchSize);
      const promises = batch.map(textbook => this.extractTextbook(textbook));
      
      const batchResults = await Promise.all(promises);
      results.push(...batchResults);
      
      console.log(`\n진행상황: ${Math.min(i + batchSize, textbooks.length)}/${textbooks.length}`);
    }
    
    return results;
  }
  
  async createDatabaseSchema() {
    console.log('\n📋 데이터베이스 스키마 생성...');
    
    const createTableSQL = `
    CREATE TABLE IF NOT EXISTS textbook_contents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      textbook_name TEXT NOT NULL,
      category TEXT,
      chapter_number INTEGER,
      chapter_title TEXT,
      content TEXT NOT NULL,
      page_start INTEGER,
      page_end INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(textbook_name, chapter_number)
    );
    
    CREATE INDEX IF NOT EXISTS idx_textbook_category ON textbook_contents(category);
    CREATE INDEX IF NOT EXISTS idx_textbook_name ON textbook_contents(textbook_name);
    CREATE VIRTUAL TABLE IF NOT EXISTS textbook_search USING fts5(
      textbook_name, chapter_title, content,
      content=textbook_contents
    );
    `;
    
    const sqlite3 = (await import('sqlite3')).default;
    const db = new sqlite3.Database(this.dbPath);
    
    return new Promise((resolve, reject) => {
      db.exec(createTableSQL, (err) => {
        if (err) reject(err);
        else {
          console.log('✅ 스키마 생성 완료');
          db.close();
          resolve();
        }
      });
    });
  }
  
  async importToDatabase(results) {
    console.log('\n📥 데이터베이스에 교재 내용 저장 중...');
    
    const sqlite3 = (await import('sqlite3')).default;
    const db = new sqlite3.Database(this.dbPath);
    
    let totalImported = 0;
    
    for (const result of results) {
      if (!result.success) continue;
      
      try {
        const content = await fs.readFile(result.outputPath, 'utf-8');
        const textbookName = path.basename(result.outputPath).replace('.txt', '');
        
        // 챕터별로 분할 (페이지 구분자 활용)
        const chapters = content.split(/--- 페이지 \d+ ---/).filter(ch => ch.trim());
        
        for (let i = 0; i < chapters.length; i++) {
          const chapterContent = chapters[i].trim();
          if (chapterContent.length < 100) continue; // 너무 짧은 내용은 제외
          
          await new Promise((resolve, reject) => {
            db.run(
              `INSERT OR REPLACE INTO textbook_contents 
               (textbook_name, category, chapter_number, content, page_start)
               VALUES (?, ?, ?, ?, ?)`,
              [textbookName, this.categorizeTextbook(textbookName), i + 1, chapterContent, i + 1],
              (err) => {
                if (err) reject(err);
                else resolve();
              }
            );
          });
        }
        
        totalImported++;
        console.log(`✅ ${textbookName}: ${chapters.length}개 챕터 저장됨`);
        
      } catch (error) {
        console.error(`❌ 저장 실패:`, error.message);
      }
    }
    
    // FTS 인덱스 업데이트
    await new Promise((resolve) => {
      db.run(`INSERT INTO textbook_search(textbook_search) VALUES('rebuild')`, () => {
        db.close();
        resolve();
      });
    });
    
    console.log(`\n✅ 총 ${totalImported}개 교재 데이터베이스 저장 완료`);
  }
  
  async generateReport(textbooks, results) {
    console.log('\n📄 최종 리포트 생성 중...');
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const totalSize = results.reduce((sum, r) => sum + (r.size || 0), 0);
    
    let report = `# 📚 나무의사 교재 텍스트 추출 보고서\n\n`;
    report += `**생성일**: ${new Date().toISOString()}\n\n`;
    report += `## 📊 전체 결과\n\n`;
    report += `- **전체 교재**: ${textbooks.length}개\n`;
    report += `- **성공**: ${successful}개 (${((successful/textbooks.length)*100).toFixed(1)}%)\n`;
    report += `- **실패**: ${failed}개\n`;
    report += `- **총 추출 크기**: ${(totalSize / 1024 / 1024).toFixed(1)}MB\n\n`;
    
    report += `## 📚 카테고리별 결과\n\n`;
    const categoryStats = {};
    
    textbooks.forEach((book, idx) => {
      const result = results[idx];
      if (!categoryStats[book.category]) {
        categoryStats[book.category] = { total: 0, success: 0 };
      }
      categoryStats[book.category].total++;
      if (result && result.success) {
        categoryStats[book.category].success++;
      }
    });
    
    for (const [category, stats] of Object.entries(categoryStats)) {
      report += `- **${category}**: ${stats.success}/${stats.total}개 성공\n`;
    }
    
    report += `\n## 🚀 다음 단계\n\n`;
    report += `1. MCP 서버에서 교재 검색 기능 활용\n`;
    report += `2. Claude Desktop에서 교재 내용 질문\n`;
    report += `3. 기출문제와 교재 내용 연계 학습\n`;
    
    const reportPath = path.join(this.projectRoot, 'TEXTBOOK-EXTRACTION-REPORT.md');
    await fs.writeFile(reportPath, report);
    console.log(`✅ 리포트 생성 완료: ${reportPath}`);
  }
  
  async run() {
    await this.initialize();
    
    // 1. 교재 수집
    const textbooks = await this.collectTextbooks();
    
    // 2. 교재 추출 (병렬 처리)
    const results = await this.extractAllTextbooks(textbooks);
    
    // 3. 데이터베이스 스키마 생성
    await this.createDatabaseSchema();
    
    // 4. 데이터베이스에 저장
    await this.importToDatabase(results);
    
    // 5. 리포트 생성
    await this.generateReport(textbooks, results);
    
    console.log('\n🎉 모든 작업 완료!');
    console.log('이제 다른 PC에서도 교재 내용을 검색할 수 있습니다.');
  }
}

// 실행
async function main() {
  const extractor = new ImprovedTextbookExtractor();
  await extractor.run();
}

main().catch(console.error);