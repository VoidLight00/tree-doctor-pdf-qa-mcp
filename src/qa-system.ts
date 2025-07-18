import { DatabaseManager, PDFContent } from "./database.js";
import { PDFManager } from "./pdf-manager.js";
import Fuse from "fuse.js";

export interface QAResult {
  id: number;
  filePath: string;
  bookTitle: string;
  page: number;
  content: string;
  score: number;
  context: string;
}

export class QASystem {
  private dbManager: DatabaseManager;
  private pdfManager: PDFManager;
  private fuse: Fuse<PDFContent> | null = null;
  private lastIndexUpdate: number = 0;

  constructor(dbManager: DatabaseManager, pdfManager: PDFManager) {
    this.dbManager = dbManager;
    this.pdfManager = pdfManager;
  }

  /**
   * PDF에서 질문에 대한 답변 검색
   */
  async searchPDF(query: string, maxResults: number = 5): Promise<QAResult[]> {
    try {
      // 데이터베이스에서 기본 검색
      const dbResults = await this.dbManager.searchPDFContent(query, maxResults * 2);
      
      // Fuse.js로 의미적 검색 수행
      const fuseResults = await this.performFuzzySearch(query, maxResults);
      
      // 결과 통합 및 중복 제거
      const combinedResults = this.combineAndRankResults(dbResults, fuseResults, maxResults);
      
      // 컨텍스트 정보 추가
      const enrichedResults = await this.enrichWithContext(combinedResults);
      
      return enrichedResults;
    } catch (error) {
      console.error(`PDF 검색 실패: ${error}`);
      return [];
    }
  }

  /**
   * 기출문제에 대한 교재 근거 찾기
   */
  async findSource(question: string, options?: string[]): Promise<QAResult[]> {
    try {
      // 문제에서 키워드 추출
      const keywords = this.extractKeywords(question);
      
      // 선택지가 있는 경우 키워드에 추가
      if (options && options.length > 0) {
        const optionKeywords = options.flatMap(option => this.extractKeywords(option));
        keywords.push(...optionKeywords);
      }
      
      // 각 키워드로 검색
      const allResults: QAResult[] = [];
      
      for (const keyword of keywords) {
        const results = await this.searchPDF(keyword, 3);
        allResults.push(...results);
      }
      
      // 중복 제거 및 관련도 순 정렬
      const uniqueResults = this.removeDuplicates(allResults);
      const rankedResults = this.rankByRelevance(uniqueResults, question);
      
      return rankedResults.slice(0, 5);
    } catch (error) {
      console.error(`교재 근거 찾기 실패: ${error}`);
      return [];
    }
  }

  /**
   * 해설 생성
   */
  async generateExplanation(question: string, answer: string, sources?: string[]): Promise<string> {
    try {
      // 관련 교재 근거 찾기
      const sourceResults = await this.findSource(question);
      
      let explanation = `🔍 **문제 해설**\n\n`;
      explanation += `❓ **문제**: ${question}\n\n`;
      explanation += `✅ **정답**: ${answer}\n\n`;
      explanation += `📚 **해설**:\n`;
      
      if (sourceResults.length > 0) {
        explanation += `이 문제는 다음 교재 내용을 바탕으로 출제되었습니다:\n\n`;
        
        sourceResults.forEach((source, index) => {
          explanation += `**${index + 1}. ${source.bookTitle}** (페이지 ${source.page})\n`;
          explanation += `${source.content}\n\n`;
        });
        
        explanation += `🎯 **핵심 포인트**:\n`;
        explanation += this.extractKeyPoints(sourceResults, question, answer);
      } else {
        explanation += `관련 교재 근거를 찾을 수 없습니다. 기본적인 해설을 제공합니다.\n\n`;
        explanation += `이 문제의 정답은 "${answer}"입니다.\n`;
      }
      
      return explanation;
    } catch (error) {
      console.error(`해설 생성 실패: ${error}`);
      return `해설 생성 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  /**
   * Fuse.js를 이용한 퍼지 검색
   */
  private async performFuzzySearch(query: string, maxResults: number): Promise<QAResult[]> {
    try {
      // 인덱스 업데이트가 필요한지 확인
      if (!this.fuse || Date.now() - this.lastIndexUpdate > 300000) { // 5분마다 업데이트
        await this.updateFuseIndex();
      }
      
      if (!this.fuse) {
        return [];
      }
      
      const results = this.fuse.search(query, { limit: maxResults });
      
      return results.map(result => ({
        id: result.item.id,
        filePath: result.item.filePath,
        bookTitle: result.item.bookTitle,
        page: result.item.page,
        content: result.item.content,
        score: 1 - result.score!, // Fuse.js는 낮은 점수가 더 좋음
        context: result.item.content,
      }));
    } catch (error) {
      console.error(`퍼지 검색 실패: ${error}`);
      return [];
    }
  }

  /**
   * Fuse.js 인덱스 업데이트
   */
  private async updateFuseIndex(): Promise<void> {
    try {
      const allContent = await this.dbManager.searchPDFContent("", 10000); // 모든 내용 가져오기
      
      const fuseOptions = {
        keys: ['content', 'bookTitle'],
        threshold: 0.4,
        distance: 100,
        maxPatternLength: 32,
        minMatchCharLength: 2,
        includeScore: true,
        shouldSort: true,
      };
      
      this.fuse = new Fuse(allContent, fuseOptions);
      this.lastIndexUpdate = Date.now();
    } catch (error) {
      console.error(`Fuse 인덱스 업데이트 실패: ${error}`);
    }
  }

  /**
   * 결과 통합 및 순위 매기기
   */
  private combineAndRankResults(dbResults: PDFContent[], fuseResults: QAResult[], maxResults: number): QAResult[] {
    const resultMap = new Map<number, QAResult>();
    
    // 데이터베이스 결과 추가
    dbResults.forEach((result, index) => {
      resultMap.set(result.id, {
        id: result.id,
        filePath: result.filePath,
        bookTitle: result.bookTitle,
        page: result.page,
        content: result.content,
        score: 1 - (index * 0.1), // 순서에 따라 점수 부여
        context: result.content,
      });
    });
    
    // Fuse 결과 추가 (가중치 적용)
    fuseResults.forEach(result => {
      if (resultMap.has(result.id)) {
        // 이미 있는 경우 점수 평균
        const existing = resultMap.get(result.id)!;
        existing.score = (existing.score + result.score) / 2;
      } else {
        resultMap.set(result.id, result);
      }
    });
    
    // 점수 순으로 정렬
    const sortedResults = Array.from(resultMap.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);
    
    return sortedResults;
  }

  /**
   * 컨텍스트 정보 추가
   */
  private async enrichWithContext(results: QAResult[]): Promise<QAResult[]> {
    for (const result of results) {
      try {
        // 앞뒤 페이지 내용 가져오기
        const prevPage = await this.getPageContent(result.filePath, result.page - 1);
        const nextPage = await this.getPageContent(result.filePath, result.page + 1);
        
        let context = result.content;
        if (prevPage) context = prevPage.substring(-200) + "\n\n" + context;
        if (nextPage) context = context + "\n\n" + nextPage.substring(0, 200);
        
        result.context = context;
      } catch (error) {
        // 컨텍스트 추가 실패 시 원본 내용 유지
        result.context = result.content;
      }
    }
    
    return results;
  }

  /**
   * 페이지 내용 가져오기
   */
  private async getPageContent(filePath: string, page: number): Promise<string> {
    try {
      const results = await this.dbManager.searchPDFContent("", 1);
      const pageContent = results.find(r => r.filePath === filePath && r.page === page);
      return pageContent ? pageContent.content : "";
    } catch (error) {
      return "";
    }
  }

  /**
   * 키워드 추출
   */
  private extractKeywords(text: string): string[] {
    // 한국어 특성을 고려한 키워드 추출
    const keywords: string[] = [];
    
    // 명사 추출 (간단한 방법)
    const nouns = text.match(/[가-힣]{2,}/g) || [];
    keywords.push(...nouns);
    
    // 영어 단어 추출
    const englishWords = text.match(/[a-zA-Z]{3,}/g) || [];
    keywords.push(...englishWords);
    
    // 숫자 포함 단어 추출
    const numberWords = text.match(/[0-9]+[가-힣]*|[가-힣]*[0-9]+/g) || [];
    keywords.push(...numberWords);
    
    // 중복 제거 및 길이 필터링
    const uniqueKeywords = [...new Set(keywords)]
      .filter(keyword => keyword.length >= 2 && keyword.length <= 20);
    
    return uniqueKeywords;
  }

  /**
   * 중복 제거
   */
  private removeDuplicates(results: QAResult[]): QAResult[] {
    const seen = new Set<string>();
    return results.filter(result => {
      const key = `${result.filePath}-${result.page}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * 관련도 순 정렬
   */
  private rankByRelevance(results: QAResult[], query: string): QAResult[] {
    const queryKeywords = this.extractKeywords(query);
    
    return results.map(result => {
      const contentKeywords = this.extractKeywords(result.content);
      const matches = queryKeywords.filter(keyword => 
        contentKeywords.some(contentKeyword => 
          contentKeyword.includes(keyword) || keyword.includes(contentKeyword)
        )
      );
      
      result.score = matches.length / queryKeywords.length;
      return result;
    }).sort((a, b) => b.score - a.score);
  }

  /**
   * 핵심 포인트 추출
   */
  private extractKeyPoints(sources: QAResult[], question: string, answer: string): string {
    let keyPoints = "";
    
    // 문제와 답변에서 키워드 추출
    const questionKeywords = this.extractKeywords(question);
    const answerKeywords = this.extractKeywords(answer);
    
    // 교재에서 관련 문장 찾기
    const relevantSentences: string[] = [];
    
    sources.forEach(source => {
      const sentences = source.content.split(/[.!?]\s+/);
      sentences.forEach(sentence => {
        const sentenceKeywords = this.extractKeywords(sentence);
        const hasQuestionKeyword = questionKeywords.some(keyword => 
          sentenceKeywords.some(sk => sk.includes(keyword))
        );
        const hasAnswerKeyword = answerKeywords.some(keyword => 
          sentenceKeywords.some(sk => sk.includes(keyword))
        );
        
        if (hasQuestionKeyword || hasAnswerKeyword) {
          relevantSentences.push(sentence.trim());
        }
      });
    });
    
    // 중요한 문장들을 포인트로 정리
    const uniqueSentences = [...new Set(relevantSentences)];
    uniqueSentences.slice(0, 3).forEach((sentence, index) => {
      keyPoints += `• ${sentence}\n`;
    });
    
    return keyPoints || "• 제공된 교재 내용을 참고하여 학습하세요.\n";
  }
}