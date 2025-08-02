#!/usr/bin/env node

/**
 * 마크다운 파일을 구조화된 JSON으로 변환하는 스크립트
 * exam-*-final-150.md 파일들을 파싱하여 데이터베이스에 로드할 수 있는 형식으로 변환
 */

const fs = require('fs').promises;
const path = require('path');

class MarkdownToJsonConverter {
  constructor() {
    this.dataDir = path.join(__dirname, '..', 'data');
    this.structuredDir = path.join(this.dataDir, 'structured');
    this.subjects = {
      '수목병리': '수목병리학',
      '수목해충': '수목해충학', 
      '수목생리': '수목생리학',
      '수목관리': '수목관리학',
      '임업': '임업일반',
      '토양': '토양학',
      '병리': '수목병리학',
      '해충': '수목해충학',
      '생리': '수목생리학',
      '관리': '수목관리학'
    };
  }

  async convertAll() {
    console.log('📄 마크다운 → JSON 변환 시작...\n');

    // structured 디렉토리 생성
    await fs.mkdir(this.structuredDir, { recursive: true });

    const markdownFiles = [
      { file: 'exam-6th-final-150.md', examYear: 6 },
      { file: 'exam-7th-final-150.md', examYear: 7 },
      { file: 'exam-8th-final-150.md', examYear: 8 },
      { file: 'exam-9th-final-150.md', examYear: 9 },
      { file: 'exam-10th-final-150.md', examYear: 10 },
      { file: 'exam-11th-perfect.md', examYear: 11 }
    ];

    let totalConverted = 0;

    for (const { file, examYear } of markdownFiles) {
      try {
        const filePath = path.join(this.dataDir, file);
        const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
        
        if (!fileExists) {
          console.log(`⚠️  ${file}: 파일 없음`);
          continue;
        }

        const content = await fs.readFile(filePath, 'utf-8');
        const questions = this.parseMarkdown(content, examYear);
        
        if (questions.length > 0) {
          const outputFile = `exam-${examYear}th-converted.json`;
          const outputPath = path.join(this.structuredDir, outputFile);
          
          const jsonData = {
            exam_year: examYear,
            total_questions: questions.length,
            complete_questions: questions.filter(q => q.answer).length,
            questions: questions
          };

          await fs.writeFile(outputPath, JSON.stringify(jsonData, null, 2));
          totalConverted += questions.length;
          
          console.log(`✅ ${file} → ${outputFile} (${questions.length}개 문제)`);
        }
      } catch (error) {
        console.error(`❌ ${file} 변환 실패:`, error.message);
      }
    }

    console.log(`\n📊 총 ${totalConverted}개 문제 변환 완료`);
  }

  parseMarkdown(content, examYear) {
    const questions = [];
    const lines = content.split('\n');
    
    let currentQuestion = null;
    let collectingChoices = false;
    let collectingExplanation = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';

      // 문제 번호 패턴 매칭
      const questionMatch = line.match(/^##?\s*(\d+)\s*[.)]\s*(.+)/);
      const altQuestionMatch = line.match(/^##?\s*문제\s*(\d+)\s*[.:]\s*(.+)/);
      const numberedMatch = line.match(/^(\d+)\s*[.)]\s*(.+)/);

      if (questionMatch || altQuestionMatch || (numberedMatch && this.isLikelyQuestion(line))) {
        // 이전 문제 저장
        if (currentQuestion) {
          questions.push(this.finalizeQuestion(currentQuestion));
        }

        const match = questionMatch || altQuestionMatch || numberedMatch;
        currentQuestion = {
          number: parseInt(match[1]),
          question: this.cleanText(match[2]),
          subject: this.detectSubject(match[2]),
          choices: {},
          answer: null,
          explanation: '',
          keywords: []
        };
        collectingChoices = true;
        collectingExplanation = false;
      } 
      // 선택지 패턴 매칭
      else if (collectingChoices && currentQuestion) {
        const choiceMatch = line.match(/^([①②③④⑤]|\d)\s*[.)]*\s*(.+)/);
        if (choiceMatch) {
          const choiceNum = this.normalizeChoiceNumber(choiceMatch[1]);
          if (choiceNum >= 1 && choiceNum <= 5) {
            currentQuestion.choices[choiceNum] = this.cleanText(choiceMatch[2]);
          }
        }
        // 정답 패턴
        else if (line.match(/^(정답|답)\s*[:：]/)) {
          const answerMatch = line.match(/^(정답|답)\s*[:：]\s*([①②③④⑤\d])/);
          if (answerMatch) {
            currentQuestion.answer = this.normalizeChoiceNumber(answerMatch[2]);
          }
          collectingChoices = false;
          collectingExplanation = true;
        }
      }
      // 해설 수집
      else if (collectingExplanation && currentQuestion) {
        if (line.match(/^(해설|설명)\s*[:：]/) || currentQuestion.explanation) {
          const explanationText = line.replace(/^(해설|설명)\s*[:：]\s*/, '');
          if (explanationText) {
            currentQuestion.explanation += explanationText + ' ';
          }
        }
      }
      // 문제 내용 추가
      else if (currentQuestion && !collectingChoices && line && !line.startsWith('#')) {
        currentQuestion.question += ' ' + this.cleanText(line);
      }
    }

    // 마지막 문제 저장
    if (currentQuestion) {
      questions.push(this.finalizeQuestion(currentQuestion));
    }

    return questions;
  }

  isLikelyQuestion(line) {
    // 문제로 보이는 패턴 체크
    const questionPatterns = [
      /다음.*?중/,
      /다음.*?것은/,
      /다음.*?아닌/,
      /다음.*?맞는/,
      /다음.*?설명/,
      /무엇.*?\?/,
      /어느.*?\?/,
      /어떤.*?\?/
    ];
    
    return questionPatterns.some(pattern => pattern.test(line));
  }

  detectSubject(text) {
    // 텍스트에서 과목 추정
    for (const [keyword, subject] of Object.entries(this.subjects)) {
      if (text.includes(keyword)) {
        return subject;
      }
    }

    // 특정 키워드로 과목 추정
    if (text.match(/병원체|감염|세균|바이러스|진균/)) return '수목병리학';
    if (text.match(/해충|곤충|천적|유충/)) return '수목해충학';
    if (text.match(/광합성|호흡|증산|영양/)) return '수목생리학';
    if (text.match(/전정|시비|관리|진단/)) return '수목관리학';
    if (text.match(/토양|pH|양분|비료/)) return '토양학';
    
    return '미분류';
  }

  normalizeChoiceNumber(choice) {
    const mapping = {
      '①': 1, '②': 2, '③': 3, '④': 4, '⑤': 5,
      '1': 1, '2': 2, '3': 3, '4': 4, '5': 5
    };
    return mapping[choice] || 0;
  }

  cleanText(text) {
    if (!text) return '';
    
    // OCR 오류 패턴 수정
    const corrections = {
      '몬도': '온도',
      '뮤효': '유효',
      '뮤발': '유발',
      'AES': '것은',
      'GALLS': '혹',
      'HAMAS': 'DNA를',
      'SSes': '에서',
      'Bay': '염색',
      'BIOS S': '피어스병',
      'DELLS': '것은',
      'Az}Hel': '곰팡이',
      'ARS': '병원균',
      'SASS': '양분',
      'ASaw': '고사'
    };

    let cleaned = text.trim();
    
    // OCR 오류 수정
    for (const [wrong, correct] of Object.entries(corrections)) {
      cleaned = cleaned.replace(new RegExp(wrong, 'g'), correct);
    }

    // 불필요한 기호 제거
    cleaned = cleaned
      .replace(/\*\*/g, '')
      .replace(/---/g, '')
      .replace(/##/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    return cleaned;
  }

  finalizeQuestion(question) {
    // 문제 텍스트 정리
    question.question = this.cleanText(question.question);
    
    // 키워드 추출
    question.keywords = this.extractKeywords(question.question);
    
    // 해설 정리
    if (question.explanation) {
      question.explanation = this.cleanText(question.explanation);
    }

    // 선택지가 없으면 주관식으로 표시
    if (Object.keys(question.choices).length === 0) {
      question.question_type = 'short_answer';
    } else {
      question.question_type = 'multiple_choice';
    }

    return question;
  }

  extractKeywords(text) {
    const keywords = [];
    
    // 주요 용어 패턴
    const patterns = [
      /[가-힣]+병/g,
      /[가-힣]+균/g,
      /[가-힣]+충/g,
      /[가-힣]+나무/g,
      /방제|진단|감염|병원체|해충|천적/g
    ];

    patterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        keywords.push(...matches);
      }
    });

    // 중복 제거
    return [...new Set(keywords)].slice(0, 5);
  }
}

// 실행
async function main() {
  const converter = new MarkdownToJsonConverter();
  await converter.convertAll();
}

main().catch(console.error);