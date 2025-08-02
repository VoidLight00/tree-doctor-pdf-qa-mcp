#!/usr/bin/env node

/**
 * 고급 PDF 문제 추출기
 * markitdown MCP를 활용한 정확한 텍스트 추출
 */

import fs from 'fs/promises';
import path from 'path';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AdvancedPDFExtractor {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.dataDir = path.join(this.projectRoot, 'data');
    this.dbPath = path.join(this.projectRoot, 'tree-doctor-pdf-qa.db');
    this.db = null;
    this.mcpClient = null;
  }

  async initialize() {
    this.db = new sqlite3.Database(this.dbPath);
    console.log('🚀 고급 PDF 추출기 시작...\n');
    
    // MCP 클라이언트 초기화
    await this.initializeMCP();
  }

  async initializeMCP() {
    try {
      const transport = new StdioClientTransport({
        command: 'npx',
        args: ['-y', '@kozakatak/markitdown-mcp']
      });

      this.mcpClient = new Client({
        name: 'pdf-extractor',
        version: '1.0.0'
      }, {
        capabilities: {}
      });

      await this.mcpClient.connect(transport);
      console.log('✅ MCP 클라이언트 연결 완료');
    } catch (error) {
      console.error('❌ MCP 초기화 실패:', error);
      throw error;
    }
  }

  // PDF를 텍스트로 변환
  async convertPDFToText(pdfPath) {
    console.log(`📄 PDF 변환 중: ${path.basename(pdfPath)}`);
    
    try {
      // markitdown을 사용하여 PDF 변환
      const result = await this.mcpClient.callTool('convert_to_markdown', {
        file_path: pdfPath,
        format: 'pdf'
      });
      
      if (result && result.content) {
        const outputPath = pdfPath.replace('.pdf', '-extracted.md');
        await fs.writeFile(outputPath, result.content, 'utf-8');
        console.log(`✅ 변환 완료: ${path.basename(outputPath)}`);
        return result.content;
      }
    } catch (error) {
      console.error('❌ PDF 변환 실패:', error);
      return null;
    }
  }

  // 문제 구조 파싱
  parseQuestions(content, examYear) {
    const questions = [];
    const lines = content.split('\n');
    
    let currentQuestion = null;
    let inQuestion = false;
    let questionBuffer = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // 문제 번호 패턴 매칭 (다양한 형식 지원)
      const patterns = [
        /^(\d{1,3})\.\s+(.+)/,           // 1. 문제
        /^(\d{1,3})\)\s*(.+)/,           // 1) 문제
        /^문제\s*(\d{1,3})[.)\s]*(.+)/,  // 문제 1. 또는 문제 1)
        /^Q(\d{1,3})[.)\s]*(.+)/,        // Q1. 또는 Q1)
        /^【(\d{1,3})】\s*(.+)/          // 【1】 문제
      ];
      
      let questionMatch = null;
      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match) {
          questionMatch = match;
          break;
        }
      }
      
      if (questionMatch) {
        // 이전 문제 저장
        if (currentQuestion && this.validateQuestion(currentQuestion)) {
          questions.push(currentQuestion);
        }
        
        const num = parseInt(questionMatch[1]);
        if (num >= 1 && num <= 150) {
          currentQuestion = {
            number: num,
            text: questionMatch[2],
            choices: {},
            examYear: examYear,
            subject: null
          };
          inQuestion = true;
          questionBuffer = [questionMatch[2]];
        }
      }
      // 선택지 패턴
      else if (inQuestion && currentQuestion) {
        const choicePatterns = [
          /^([①②③④⑤])\s*(.+)/,
          /^([1-5])[.)]\s*(.+)/,
          /^\(([1-5])\)\s*(.+)/
        ];
        
        let choiceMatch = null;
        for (const pattern of choicePatterns) {
          const match = line.match(pattern);
          if (match) {
            choiceMatch = match;
            break;
          }
        }
        
        if (choiceMatch) {
          const choiceNum = this.normalizeChoiceNumber(choiceMatch[1]);
          if (choiceNum) {
            currentQuestion.choices[choiceNum] = choiceMatch[2].trim();
          }
        } else if (line && !line.match(/^(정답|해설|답안|해답|설명)/)) {
          // 문제 텍스트 계속
          questionBuffer.push(line);
        }
      }
    }
    
    // 마지막 문제 저장
    if (currentQuestion && this.validateQuestion(currentQuestion)) {
      questions.push(currentQuestion);
    }
    
    // 문제 텍스트 정리 및 과목 분류
    questions.forEach(q => {
      if (questionBuffer.length > 1) {
        q.text = questionBuffer.join(' ').trim();
      }
      q.subject = this.detectSubject(q.text);
    });
    
    return questions;
  }

  // 선택지 번호 정규화
  normalizeChoiceNumber(num) {
    const mapping = {
      '①': 1, '②': 2, '③': 3, '④': 4, '⑤': 5,
      '1': 1, '2': 2, '3': 3, '4': 4, '5': 5,
      '➀': 1, '➁': 2, '➂': 3, '➃': 4, '➄': 5
    };
    return mapping[num] || null;
  }

  // 문제 검증
  validateQuestion(question) {
    if (!question.text || question.text.length < 5) return false;
    if (!question.choices || Object.keys(question.choices).length < 4) return false;
    if (!question.number || question.number < 1 || question.number > 150) return false;
    
    // 중복 선택지 확인
    const choiceTexts = Object.values(question.choices);
    const uniqueChoices = new Set(choiceTexts);
    if (uniqueChoices.size < 4) return false;
    
    return true;
  }

  // 과목 분류
  detectSubject(text) {
    const patterns = {
      '수목병리학': /병원체|병원균|감염|세균|바이러스|진균|곰팡이|병해|살균제|병징|병반|흰가루병|탄저병|마름병/,
      '수목해충학': /해충|곤충|천적|유충|번데기|성충|살충제|천공|가해|나방|딱정벌레|진딧물|깍지벌레/,
      '수목생리학': /광합성|호흡|증산|영양|생장|식물호르몬|굴광성|굴지성|옥신|지베렐린|시토키닌/,
      '수목관리학': /전정|시비|관리|진단|식재|이식|멀칭|전지|가지치기|병충해방제|수목진단/,
      '토양학': /토양|pH|양분|비료|유기물|배수|통기성|양이온교환|부식|토성/,
      '임업일반': /산림|조림|벌채|갱신|임분|임목|천연갱신|인공조림|육림|산림경영/
    };
    
    for (const [subject, pattern] of Object.entries(patterns)) {
      if (pattern.test(text)) return subject;
    }
    
    return '미분류';
  }

  // 데이터베이스에 저장
  async saveQuestions(questions) {
    let saved = 0;
    let skipped = 0;
    
    for (const q of questions) {
      try {
        // 중복 확인
        const exists = await new Promise((resolve, reject) => {
          this.db.get(
            `SELECT id FROM exam_questions 
             WHERE exam_year = ? AND question_number = ?`,
            [q.examYear, q.number],
            (err, row) => {
              if (err) reject(err);
              else resolve(!!row);
            }
          );
        });
        
        if (exists) {
          skipped++;
          continue;
        }
        
        // 문제 저장
        const questionId = await new Promise((resolve, reject) => {
          this.db.run(
            `INSERT INTO exam_questions (
              exam_year, exam_round, question_number, subject,
              question_text, question_type, points, is_incomplete
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              q.examYear, 1, q.number, q.subject,
              q.text, 'multiple_choice', 1, 0
            ],
            function(err) {
              if (err) reject(err);
              else resolve(this.lastID);
            }
          );
        });
        
        // 선택지 저장
        for (const [num, text] of Object.entries(q.choices)) {
          await new Promise((resolve, reject) => {
            this.db.run(
              `INSERT INTO exam_choices (
                question_id, choice_number, choice_text, is_correct
              ) VALUES (?, ?, ?, ?)`,
              [questionId, parseInt(num), text, 0],
              err => err ? reject(err) : resolve()
            );
          });
        }
        
        saved++;
        
        if (saved % 10 === 0) {
          console.log(`💾 ${saved}개 저장 완료...`);
        }
      } catch (error) {
        console.error(`❌ 문제 ${q.number} 저장 실패:`, error.message);
      }
    }
    
    console.log(`\n✅ 저장 완료: ${saved}개 추가, ${skipped}개 중복 제외`);
    return { saved, skipped };
  }

  // PDF 파일 처리
  async processPDF(pdfPath, examYear) {
    console.log(`\n📚 ${examYear}회차 처리 시작...`);
    
    // PDF를 텍스트로 변환
    const text = await this.convertPDFToText(pdfPath);
    if (!text) {
      console.error('❌ PDF 변환 실패');
      return { saved: 0, skipped: 0 };
    }
    
    // 문제 추출
    const questions = this.parseQuestions(text, examYear);
    console.log(`🔍 ${questions.length}개 문제 추출됨`);
    
    // 데이터베이스 저장
    const result = await this.saveQuestions(questions);
    
    return result;
  }

  // 통계 표시
  async showStats() {
    return new Promise((resolve) => {
      this.db.all(
        `SELECT exam_year, COUNT(*) as count 
         FROM exam_questions 
         GROUP BY exam_year 
         ORDER BY exam_year`,
        (err, rows) => {
          if (err) {
            console.error('통계 조회 실패:', err);
            resolve();
            return;
          }
          
          console.log('\n📊 현재 데이터베이스 상태:');
          console.log('━'.repeat(40));
          
          let total = 0;
          rows.forEach(row => {
            const percent = ((row.count / 150) * 100).toFixed(1);
            console.log(`${row.exam_year}회차: ${row.count}/150 (${percent}%)`);
            total += row.count;
          });
          
          console.log('━'.repeat(40));
          console.log(`전체: ${total}/750 문제`);
          console.log();
          
          resolve();
        }
      );
    });
  }

  async run() {
    await this.initialize();
    await this.showStats();
    
    // PDF 파일 처리
    const pdfs = [
      { path: path.join(this.dataDir, '제11회 나무의사 자격시험 1차 시험지.pdf'), year: 11 },
      { path: path.join(this.dataDir, 'exam-10th.pdf'), year: 10 }
    ];
    
    for (const pdf of pdfs) {
      if (await this.fileExists(pdf.path)) {
        await this.processPDF(pdf.path, pdf.year);
      } else {
        console.log(`⚠️ 파일 없음: ${pdf.path}`);
      }
    }
    
    // 최종 통계
    await this.showStats();
    
    // 정리
    if (this.mcpClient) {
      await this.mcpClient.close();
    }
    this.db.close();
    
    console.log('✅ 추출 완료!');
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

// 실행
const extractor = new AdvancedPDFExtractor();
extractor.run().catch(console.error);