import { PDFProcessor } from "./src/pdf-processor";
import * as fs from "fs/promises";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

interface ExamPDF {
  inputPath: string;
  outputPath: string;
  examNumber: string;
}

interface ExamProblem {
  number: string;
  question: string;
  choices: { [key: string]: string };
  answer: string;
  explanation: string;
}

class ExamPDFProcessor extends PDFProcessor {
  /**
   * 기출문제 전용 마크다운 변환
   */
  private convertExamToMarkdown(content: string, examNumber: string): string {
    const problems = this.parseExamContent(content);
    
    let markdown = `# 제${examNumber}회 기출문제 해설집\n\n`;
    markdown += `---\n\n`;
    
    problems.forEach((problem) => {
      markdown += `## 문제 ${problem.number}\n\n`;
      markdown += `**문제:** ${problem.question}\n\n`;
      
      if (Object.keys(problem.choices).length > 0) {
        markdown += `**선택지:**\n`;
        ['①', '②', '③', '④'].forEach(num => {
          if (problem.choices[num]) {
            markdown += `- ${num} ${problem.choices[num]}\n`;
          }
        });
        markdown += `\n`;
      }
      
      if (problem.answer) {
        markdown += `**정답:** ${problem.answer}\n\n`;
      }
      
      if (problem.explanation) {
        markdown += `**해설:** ${problem.explanation}\n\n`;
      }
      
      markdown += `---\n\n`;
    });
    
    return markdown;
  }
  
  /**
   * 기출문제 내용 파싱
   */
  private parseExamContent(content: string): ExamProblem[] {
    const problems: ExamProblem[] = [];
    
    // 다양한 문제 패턴 매칭
    const problemPatterns = [
      /(\d+)\.\s*([^①②③④]+?)(?=①)/g,
      /문제\s*(\d+)[.:]?\s*([^①②③④]+?)(?=①)/g,
      /\[(\d+)\]\s*([^①②③④]+?)(?=①)/g
    ];
    
    // 텍스트를 문제 단위로 분할
    const sections = content.split(/(?=\d+\.|문제\s*\d+|\[\d+\])/);
    
    sections.forEach(section => {
      if (!section.trim() || section.trim().length < 10) return;
      
      // 문제 번호와 내용 추출
      let problemMatch: RegExpMatchArray | null = null;
      for (const pattern of problemPatterns) {
        const matches = section.matchAll(pattern);
        for (const match of matches) {
          problemMatch = match;
          break;
        }
        if (problemMatch) break;
      }
      
      if (!problemMatch) return;
      
      const problemNum = problemMatch[1];
      const problemText = problemMatch[2].trim().replace(/\n/g, ' ');
      
      // 선택지 추출
      const choicePattern = /([①②③④])\s*([^①②③④]+?)(?=[①②③④]|정답|해설|\n\n|문제\s*\d+|$)/g;
      const choices: { [key: string]: string } = {};
      const choiceMatches = section.matchAll(choicePattern);
      
      for (const match of choiceMatches) {
        const choiceNum = match[1];
        const choiceText = match[2].trim().replace(/\n/g, ' ');
        choices[choiceNum] = choiceText;
      }
      
      // 정답 추출
      const answerPatterns = [
        /정답\s*[:：]\s*([①②③④])/,
        /답\s*[:：]\s*([①②③④])/,
        /\[정답\]\s*([①②③④])/,
        /정답은\s*([①②③④])/
      ];
      
      let answer = '';
      for (const pattern of answerPatterns) {
        const answerMatch = section.match(pattern);
        if (answerMatch) {
          answer = answerMatch[1];
          break;
        }
      }
      
      // 해설 추출
      const explanationPatterns = [
        /해설\s*[:：]\s*(.+?)(?=\d+\.|문제\s*\d+|$)/s,
        /\[해설\]\s*(.+?)(?=\d+\.|문제\s*\d+|$)/s,
        /설명\s*[:：]\s*(.+?)(?=\d+\.|문제\s*\d+|$)/s
      ];
      
      let explanation = '';
      for (const pattern of explanationPatterns) {
        const explanationMatch = section.match(pattern);
        if (explanationMatch) {
          explanation = explanationMatch[1].trim().replace(/\n/g, ' ');
          break;
        }
      }
      
      problems.push({
        number: problemNum,
        question: problemText,
        choices,
        answer,
        explanation
      });
    });
    
    return problems;
  }
  
  /**
   * 기출문제 PDF 처리
   */
  async processExamPDF(filePath: string, examNumber: string): Promise<void> {
    try {
      console.log(`\n📚 처리 중: 제${examNumber}회 기출문제`);
      
      // PDFProcessor의 기본 처리
      const result = await this.processPDF(filePath);
      
      // 기출문제 전용 마크다운 변환
      const examMarkdown = this.convertExamToMarkdown(result.content, examNumber);
      
      // 파일 저장
      const outputPath = path.join(
        path.dirname(filePath).replace('Downloads', 'tree-doctor-pdf-qa-mcp/data'),
        `exam-${examNumber}th.md`
      );
      
      await fs.writeFile(outputPath, examMarkdown, 'utf-8');
      console.log(`✅ 완료: ${outputPath}`);
      
      // 원본 텍스트도 저장 (디버깅용)
      const rawPath = outputPath.replace('.md', '-raw.txt');
      await fs.writeFile(rawPath, result.content, 'utf-8');
      console.log(`📄 원본 텍스트: ${rawPath}`);
      
    } catch (error) {
      console.error(`❌ 오류 (제${examNumber}회): ${error}`);
      throw error;
    }
  }
}

/**
 * markitdown을 사용한 보조 처리
 */
async function processWithMarkitdown(examPDF: ExamPDF): Promise<void> {
  try {
    console.log(`\n🔧 Markitdown 처리: 제${examPDF.examNumber}회`);
    
    const { stdout } = await execAsync(`markitdown "${examPDF.inputPath}"`);
    
    let markdown = `# 제${examPDF.examNumber}회 기출문제 해설집\n\n`;
    markdown += `---\n\n`;
    markdown += stdout;
    
    const markitdownPath = examPDF.outputPath.replace('.md', '-markitdown.md');
    await fs.writeFile(markitdownPath, markdown, 'utf-8');
    
    console.log(`✅ Markitdown 완료: ${markitdownPath}`);
  } catch (error) {
    console.error(`❌ Markitdown 오류: ${error}`);
  }
}

/**
 * 메인 함수
 */
async function main() {
  const examPDFs: ExamPDF[] = [
    {
      inputPath: "/Users/voidlight/Downloads/[Codekiller]제6회 기출문제 해설집(v1.0).pdf",
      outputPath: "/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-6th.md",
      examNumber: "6"
    },
    {
      inputPath: "/Users/voidlight/Downloads/[Codekiller]제7회 기출문제 해설집(v1.0).pdf",
      outputPath: "/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-7th.md",
      examNumber: "7"
    },
    {
      inputPath: "/Users/voidlight/Downloads/[Codekiller]제8회 기출문제 해설집(v1.0).pdf",
      outputPath: "/Users/voidlight/tree-doctor-pdf-qa-mcp/data/exam-8th.md",
      examNumber: "8"
    }
  ];
  
  console.log("🚀 나무의사 기출문제 PDF 변환 시작");
  console.log(`   총 ${examPDFs.length}개 파일 병렬 처리\n`);
  
  const processor = new ExamPDFProcessor();
  
  try {
    // 1. PDFProcessor 기반 병렬 처리
    console.log("📋 Phase 1: PDFProcessor 기반 처리");
    const processorPromises = examPDFs.map(exam => 
      processor.processExamPDF(exam.inputPath, exam.examNumber)
    );
    await Promise.all(processorPromises);
    
    // 2. markitdown 기반 병렬 처리
    console.log("\n📋 Phase 2: markitdown 보조 처리");
    const markitdownPromises = examPDFs.map(exam => 
      processWithMarkitdown(exam)
    );
    await Promise.all(markitdownPromises);
    
    console.log("\n✨ 모든 PDF 변환 작업 완료!");
    
    console.log("\n📁 생성된 파일:");
    for (const exam of examPDFs) {
      console.log(`   - ${exam.outputPath}`);
      console.log(`   - ${exam.outputPath.replace('.md', '-raw.txt')}`);
      console.log(`   - ${exam.outputPath.replace('.md', '-markitdown.md')}`);
    }
    
  } catch (error) {
    console.error("❌ 처리 중 오류 발생:", error);
  } finally {
    await processor.cleanup();
  }
}

// 실행
if (require.main === module) {
  main().catch(console.error);
}