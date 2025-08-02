#!/usr/bin/env node

/**
 * 병렬 서브에이전트 시스템
 * 각 회차별로 전문 에이전트를 할당하여 동시에 문제 추출
 */

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ParallelExtractionSystem {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.dataDir = path.join(this.projectRoot, 'data');
    this.agentsDir = path.join(this.projectRoot, 'extraction-agents');
    this.agents = [];
  }

  async initialize() {
    // 에이전트 디렉토리 생성
    await fs.mkdir(this.agentsDir, { recursive: true });
    
    console.log('🚀 병렬 추출 시스템 초기화...\n');
    
    // 각 회차별 에이전트 설정
    this.agents = [
      {
        id: 'agent-7',
        examYear: 7,
        targetFile: 'exam-7th-final-150.md',
        role: 'OCR 오류 수정 및 패턴 인식 전문',
        status: 'ready',
        missing: 145
      },
      {
        id: 'agent-8',
        examYear: 8,
        targetFile: 'exam-8th-final-150.md',
        role: '구조화 및 선택지 추출 전문',
        status: 'ready',
        missing: 145
      },
      {
        id: 'agent-9',
        examYear: 9,
        targetFile: 'exam-9th-final-150.md',
        role: '부분 완성 문제 보완 전문',
        status: 'ready',
        missing: 91
      },
      {
        id: 'agent-11',
        examYear: 11,
        targetFile: 'exam-11th-perfect.md',
        role: '정밀 추출 및 검증 전문',
        status: 'ready',
        missing: 145
      }
    ];
  }

  async createAgentScript(agent) {
    const scriptContent = `#!/usr/bin/env node
/**
 * ${agent.id} - ${agent.examYear}회차 전문 추출 에이전트
 * 역할: ${agent.role}
 */

import fs from 'fs/promises';
import path from 'path';
import sqlite3 from 'sqlite3';

class ExtractionAgent${agent.examYear} {
  constructor() {
    this.examYear = ${agent.examYear};
    this.dataDir = '${this.dataDir}';
    this.targetFile = '${agent.targetFile}';
    this.dbPath = '${path.join(this.projectRoot, 'tree-doctor-pdf-qa.db')}';
    this.results = [];
  }

  async run() {
    console.log('🤖 ${agent.id} 시작 - ${agent.examYear}회차 (누락: ${agent.missing}개)');
    
    try {
      // 마크다운 파일 읽기
      const content = await fs.readFile(
        path.join(this.dataDir, this.targetFile), 
        'utf-8'
      );
      
      // 회차별 특화 추출 로직
      const questions = await this.extractQuestions(content);
      
      // 데이터베이스에 저장
      await this.saveToDatabase(questions);
      
      console.log('✅ ${agent.id} 완료: ' + questions.length + '개 문제 추출');
      
      // 결과 저장
      await fs.writeFile(
        path.join('${this.agentsDir}', '${agent.id}-results.json'),
        JSON.stringify({
          agentId: '${agent.id}',
          examYear: ${agent.examYear},
          extracted: questions.length,
          questions: questions
        }, null, 2)
      );
      
    } catch (error) {
      console.error('❌ ${agent.id} 오류:', error.message);
    }
  }

  async extractQuestions(content) {
    const questions = [];
    const lines = content.split('\\n');
    
    ${this.getExtractionLogic(agent.examYear)}
    
    return questions;
  }
  
  ${this.getHelperFunctions()}

  async saveToDatabase(questions) {
    const db = new sqlite3.Database(this.dbPath);
    
    for (const q of questions) {
      await new Promise((resolve, reject) => {
        db.run(\`
          INSERT OR IGNORE INTO exam_questions (
            exam_year, exam_round, question_number, subject,
            question_text, question_type, points, is_incomplete
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        \`, [
          this.examYear, 1, q.number, q.subject || '미분류',
          q.text, 'multiple_choice', 1, 0
        ], function(err) {
          if (!err) {
            const qId = this.lastID;
            // 선택지 저장
            if (q.choices) {
              Object.entries(q.choices).forEach(([num, text], idx) => {
                db.run(\`
                  INSERT OR IGNORE INTO exam_choices (
                    question_id, choice_number, choice_text, is_correct
                  ) VALUES (?, ?, ?, ?)
                \`, [qId, idx + 1, text, q.answer == (idx + 1) ? 1 : 0]);
              });
            }
          }
          resolve();
        });
      });
    }
    
    db.close();
  }
}

// 실행
const agent = new ExtractionAgent${agent.examYear}();
agent.run().catch(console.error);
`;

    const scriptPath = path.join(this.agentsDir, `${agent.id}.js`);
    await fs.writeFile(scriptPath, scriptContent);
    return scriptPath;
  }

  getExtractionLogic(examYear) {
    // 회차별 특화 로직
    const logics = {
      7: `
    // 7회차: OCR 오류가 심한 패턴 처리
    let currentQuestion = null;
    let questionNum = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // 문제 번호 패턴 - OCR 오류 고려
      if (line.match(/^\\d+[.)\\s]|^문제\\s*\\d+/)) {
        if (currentQuestion) questions.push(currentQuestion);
        
        questionNum++;
        const text = line.replace(/^\\d+[.)\\s]|^문제\\s*\\d+[.:]/g, '').trim();
        
        currentQuestion = {
          number: questionNum,
          text: this.fixOCRErrors(text),
          choices: {},
          subject: this.detectSubject(text)
        };
      }
      // 선택지 패턴
      else if (currentQuestion && line.match(/^[①②③④⑤1-5][.)]/)) {
        const num = line.match(/^([①②③④⑤1-5])/)[1];
        const choiceNum = this.normalizeNumber(num);
        const choiceText = line.replace(/^[①②③④⑤1-5][.)\\s]/, '');
        currentQuestion.choices[choiceNum] = this.fixOCRErrors(choiceText);
      }
    }
    
    if (currentQuestion) questions.push(currentQuestion);
      `,
      8: `
    // 8회차: 구조화 중심 추출
    const questionBlocks = content.split(/(?=\\d+\\s*[.)\\]])/);
    
    for (const block of questionBlocks) {
      if (!block.trim()) continue;
      
      const lines = block.split('\\n');
      const firstLine = lines[0];
      
      const numMatch = firstLine.match(/^(\\d+)/);
      if (!numMatch) continue;
      
      const question = {
        number: parseInt(numMatch[1]),
        text: '',
        choices: {},
        subject: '미분류'
      };
      
      // 문제 텍스트 수집
      let inChoices = false;
      for (const line of lines) {
        if (line.match(/^[①②③④⑤]/)) {
          inChoices = true;
          const [num, ...text] = line.split(/[.)]/);
          question.choices[this.normalizeNumber(num)] = text.join(')').trim();
        } else if (!inChoices && line.trim()) {
          question.text += ' ' + line.trim();
        }
      }
      
      question.text = question.text.trim();
      question.subject = this.detectSubject(question.text);
      
      if (question.text) questions.push(question);
    }
      `,
      9: `
    // 9회차: 부분 완성 보완
    let questionNum = 59; // 이미 59개 있음
    
    // 누락된 구간 찾기
    const existingNumbers = new Set([/* 기존 문제 번호들 */]);
    
    for (let targetNum = 1; targetNum <= 150; targetNum++) {
      if (existingNumbers.has(targetNum)) continue;
      
      // 해당 번호 문제 찾기
      const pattern = new RegExp(\`^\\\\s*\${targetNum}\\\\s*[.)\\\\]]\`);
      const lineIdx = lines.findIndex(line => pattern.test(line));
      
      if (lineIdx !== -1) {
        const question = {
          number: targetNum,
          text: '',
          choices: {},
          subject: '미분류'
        };
        
        // 문제 내용 추출
        for (let i = lineIdx; i < lines.length && i < lineIdx + 10; i++) {
          const line = lines[i];
          if (line.match(/^[①②③④⑤]/)) {
            const [num, text] = line.split(/[.)]/);
            question.choices[this.normalizeNumber(num)] = text.trim();
          } else if (line.match(/^\\d+[.)]/)) {
            break; // 다음 문제
          } else {
            question.text += ' ' + line.trim();
          }
        }
        
        if (question.text) questions.push(question);
      }
    }
      `,
      11: `
    // 11회차: 정밀 추출
    const cleanContent = content
      .replace(/\\*\\*/g, '')
      .replace(/##/g, '')
      .replace(/---/g, '');
    
    // 문제 구분자로 분리
    const sections = cleanContent.split(/(?=\\b\\d{1,3}\\b\\.\\s)/);
    
    for (const section of sections) {
      const match = section.match(/^(\\d+)\\.\\s+(.+)/s);
      if (!match) continue;
      
      const num = parseInt(match[1]);
      if (num < 1 || num > 150) continue;
      
      const lines = match[2].split('\\n');
      const question = {
        number: num,
        text: '',
        choices: {},
        subject: '미분류'
      };
      
      let choiceCount = 0;
      for (const line of lines) {
        const choiceMatch = line.match(/^\\s*([①②③④⑤]|\\d[.)])\\s*(.+)/);
        if (choiceMatch) {
          choiceCount++;
          question.choices[choiceCount] = choiceMatch[2].trim();
        } else if (choiceCount === 0) {
          question.text += ' ' + line.trim();
        }
      }
      
      question.text = question.text.trim();
      question.subject = this.detectSubject(question.text);
      
      if (question.text && Object.keys(question.choices).length >= 3) {
        questions.push(question);
      }
    }
      `
    };
    
    return logics[examYear] || logics[7];
  }

  async runAllAgents() {
    console.log('🎯 병렬 추출 시작...\n');
    
    const startTime = Date.now();
    const promises = [];
    
    // 각 에이전트 스크립트 생성 및 실행
    for (const agent of this.agents) {
      const scriptPath = await this.createAgentScript(agent);
      
      const promise = new Promise((resolve, reject) => {
        const child = spawn('node', [scriptPath], {
          stdio: 'pipe'
        });
        
        let output = '';
        
        child.stdout.on('data', (data) => {
          output += data.toString();
          console.log(`[${agent.id}] ${data.toString().trim()}`);
        });
        
        child.stderr.on('data', (data) => {
          console.error(`[${agent.id}] 오류: ${data.toString()}`);
        });
        
        child.on('close', (code) => {
          if (code === 0) {
            resolve({ agent: agent.id, success: true, output });
          } else {
            reject({ agent: agent.id, success: false, error: output });
          }
        });
      });
      
      promises.push(promise);
    }
    
    // 모든 에이전트 완료 대기
    const results = await Promise.allSettled(promises);
    
    // 결과 집계
    const summary = {
      totalTime: ((Date.now() - startTime) / 1000).toFixed(2) + 's',
      timestamp: new Date().toISOString(),
      agents: {}
    };
    
    for (const result of results) {
      if (result.status === 'fulfilled') {
        summary.agents[result.value.agent] = {
          success: true,
          extracted: await this.getExtractedCount(result.value.agent)
        };
      } else {
        summary.agents[result.reason.agent] = {
          success: false,
          error: result.reason.error
        };
      }
    }
    
    // 최종 리포트 생성
    await this.generateReport(summary);
    
    console.log('\n✅ 병렬 추출 완료!');
    console.log(`⏱️  소요 시간: ${summary.totalTime}`);
  }

  async getExtractedCount(agentId) {
    try {
      const resultPath = path.join(this.agentsDir, `${agentId}-results.json`);
      const data = JSON.parse(await fs.readFile(resultPath, 'utf-8'));
      return data.extracted || 0;
    } catch {
      return 0;
    }
  }

  async generateReport(summary) {
    const reportPath = path.join(this.projectRoot, 'PARALLEL-EXTRACTION-REPORT.md');
    
    let report = `# 🤖 병렬 추출 결과 리포트\n\n`;
    report += `**실행 시간**: ${summary.timestamp}\n`;
    report += `**총 소요 시간**: ${summary.totalTime}\n\n`;
    
    report += `## 에이전트별 결과\n\n`;
    
    let totalExtracted = 0;
    
    for (const [agentId, result] of Object.entries(summary.agents)) {
      const agent = this.agents.find(a => a.id === agentId);
      if (result.success) {
        report += `### ✅ ${agentId} (${agent.examYear}회차)\n`;
        report += `- 추출: ${result.extracted}개\n`;
        report += `- 목표: ${agent.missing}개\n`;
        report += `- 달성률: ${((result.extracted / agent.missing) * 100).toFixed(1)}%\n\n`;
        totalExtracted += result.extracted;
      } else {
        report += `### ❌ ${agentId} (${agent.examYear}회차)\n`;
        report += `- 상태: 실패\n`;
        report += `- 오류: ${result.error}\n\n`;
      }
    }
    
    report += `## 📊 종합 결과\n`;
    report += `- 총 추출: ${totalExtracted}개\n`;
    report += `- 병렬 처리로 시간 단축\n`;
    
    await fs.writeFile(reportPath, report);
    console.log(`\n📄 리포트 생성: ${reportPath}`);
  }

  // 헬퍼 함수들을 각 에이전트 스크립트에 직접 포함
  getHelperFunctions() {
    return `
  // OCR 오류 수정
  fixOCRErrors(text) {
    const corrections = {
      '뮤효': '유효', '몬도': '온도', 'AES': '것은',
      'GALLS': '혹', 'HAMAS': 'DNA를', 'SSes': '에서',
      'Bay': '염색', 'BIOS S': '피어스병', '®': '②'
    };
    
    let fixed = text;
    for (const [wrong, correct] of Object.entries(corrections)) {
      fixed = fixed.replace(new RegExp(wrong, 'g'), correct);
    }
    return fixed;
  }
  
  // 번호 정규화
  normalizeNumber(num) {
    const mapping = {
      '①': 1, '②': 2, '③': 3, '④': 4, '⑤': 5,
      '1': 1, '2': 2, '3': 3, '4': 4, '5': 5
    };
    return mapping[num] || 0;
  }
  
  // 과목 분류
  detectSubject(text) {
    if (text.match(/병원체|감염|세균|바이러스|진균/)) return '수목병리학';
    if (text.match(/해충|곤충|천적|유충/)) return '수목해충학';
    if (text.match(/광합성|호흡|증산|영양/)) return '수목생리학';
    if (text.match(/전정|시비|관리|진단/)) return '수목관리학';
    if (text.match(/토양|pH|양분|비료/)) return '토양학';
    if (text.match(/산림|조림|벌채|갱신/)) return '임업일반';
    return '미분류';
  }`;
  }
}

// 실행
async function main() {
  const system = new ParallelExtractionSystem();
  await system.initialize();
  await system.runAllAgents();
}

main().catch(console.error);