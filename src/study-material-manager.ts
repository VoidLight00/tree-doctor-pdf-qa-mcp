import { DatabaseManager, Concept, Flashcard, StudyMaterial } from "./database.js";

export interface ConceptCluster {
  mainConcept: string;
  relatedConcepts: Concept[];
  frequency: number;
  subjects: string[];
}

export interface StudySession {
  date: string;
  materialsReviewed: number;
  timeSpent: number;
  subjects: string[];
}

export class StudyMaterialManager {
  private dbManager: DatabaseManager;

  constructor(dbManager: DatabaseManager) {
    this.dbManager = dbManager;
  }

  /**
   * 텍스트에서 중요한 개념 추출
   */
  async extractConcepts(text: string, subject?: string): Promise<Concept[]> {
    try {
      const concepts: Concept[] = [];
      
      // 정의문 패턴 찾기
      const definitionPatterns = [
        /(.+)는\s+(.+)이다/g,
        /(.+)란\s+(.+)이다/g,
        /(.+)는\s+(.+)을\s+말한다/g,
        /(.+)는\s+(.+)을\s+의미한다/g,
      ];
      
      definitionPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(text)) !== null) {
          const keyword = match[1].trim();
          const description = match[2].trim();
          
          if (keyword.length >= 2 && keyword.length <= 20 && description.length >= 5) {
            concepts.push({
              id: 0, // 임시 ID
              keyword,
              description,
              subject,
              createdAt: new Date().toISOString(),
            });
          }
        }
      });
      
      // 중요한 용어 추출 (괄호 안의 설명 포함)
      const termPattern = /([가-힣a-zA-Z0-9]{2,20})\s*\(([^)]+)\)/g;
      let match;
      while ((match = termPattern.exec(text)) !== null) {
        const keyword = match[1].trim();
        const description = match[2].trim();
        
        if (description.length >= 5) {
          concepts.push({
            id: 0,
            keyword,
            description,
            subject,
            createdAt: new Date().toISOString(),
          });
        }
      }
      
      // 데이터베이스에 저장
      const savedConcepts: Concept[] = [];
      for (const concept of concepts) {
        try {
          const saved = await this.dbManager.createConcept(
            concept.keyword, 
            concept.description, 
            concept.subject
          );
          savedConcepts.push(saved);
        } catch (error) {
          console.error(`개념 저장 실패: ${concept.keyword} - ${error}`);
        }
      }
      
      return savedConcepts;
    } catch (error) {
      throw new Error(`개념 추출 실패: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 암기카드 생성
   */
  async createFlashcard(front: string, back: string, subject: string, concepts?: string[]): Promise<Flashcard> {
    try {
      // 클로즈 카드 형식 처리
      const processedFront = this.processClozeDeletion(front);
      
      return await this.dbManager.createFlashcard(processedFront, back, subject, concepts);
    } catch (error) {
      throw new Error(`암기카드 생성 실패: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 개념에서 자동으로 암기카드 생성
   */
  async createFlashcardFromConcept(concept: Concept): Promise<Flashcard> {
    try {
      // 앞면: 키워드를 가린 정의문
      const front = `${concept.description}에서 설명하는 것은?`;
      
      // 뒷면: 키워드
      const back = concept.keyword;
      
      return await this.createFlashcard(front, back, concept.subject || "일반", [concept.keyword]);
    } catch (error) {
      throw new Error(`개념 기반 암기카드 생성 실패: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 학습 자료 조회
   */
  async getStudyMaterials(type: string, subject?: string): Promise<StudyMaterial[]> {
    try {
      return await this.dbManager.getStudyMaterials(type, subject);
    } catch (error) {
      throw new Error(`학습 자료 조회 실패: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 반복 개념 클러스터링
   */
  async clusterRepeatedConcepts(): Promise<ConceptCluster[]> {
    try {
      const concepts = await this.getStudyMaterials("concepts");
      const clusters: Map<string, ConceptCluster> = new Map();
      
      concepts.forEach(concept => {
        const keyword = concept.keyword || "";
        const subject = concept.subject || "일반";
        
        if (!clusters.has(keyword)) {
          clusters.set(keyword, {
            mainConcept: keyword,
            relatedConcepts: [],
            frequency: 0,
            subjects: []
          });
        }
        
        const cluster = clusters.get(keyword)!;
        cluster.relatedConcepts.push(concept as Concept);
        cluster.frequency++;
        
        if (!cluster.subjects.includes(subject)) {
          cluster.subjects.push(subject);
        }
      });
      
      // 빈도가 높은 순으로 정렬
      return Array.from(clusters.values())
        .filter(cluster => cluster.frequency >= 2)
        .sort((a, b) => b.frequency - a.frequency);
    } catch (error) {
      throw new Error(`개념 클러스터링 실패: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 복습 주기 계산
   */
  calculateReviewSchedule(reviewCount: number): Date {
    const intervals = [1, 3, 7, 14, 30, 60, 120]; // 일 단위
    const intervalIndex = Math.min(reviewCount, intervals.length - 1);
    const interval = intervals[intervalIndex];
    
    const reviewDate = new Date();
    reviewDate.setDate(reviewDate.getDate() + interval);
    
    return reviewDate;
  }

  /**
   * 오늘 복습할 암기카드 가져오기
   */
  async getTodayReviewCards(): Promise<Flashcard[]> {
    try {
      const allCards = await this.getStudyMaterials("flashcards");
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // StudyMaterial을 Flashcard로 변환
      const flashcards = allCards.map(card => ({
        id: card.id,
        front: card.title || "",
        back: card.content || "",
        subject: card.subject || "일반",
        concepts: [],
        reviewCount: 0,
        lastReviewed: undefined,
        createdAt: card.createdAt,
      } as Flashcard));
      
      return flashcards.filter(card => {
        if (!card.lastReviewed) return true; // 한 번도 복습하지 않은 카드
        
        const nextReview = this.calculateReviewSchedule(card.reviewCount);
        return nextReview <= today;
      });
    } catch (error) {
      throw new Error(`오늘의 복습 카드 조회 실패: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 학습 통계 생성
   */
  async generateStudyStats(): Promise<any> {
    try {
      const concepts = await this.getStudyMaterials("concepts");
      const flashcards = await this.getStudyMaterials("flashcards");
      const bookmarks = await this.getStudyMaterials("bookmarks");
      
      const stats = {
        totalConcepts: concepts.length,
        totalFlashcards: flashcards.length,
        totalBookmarks: bookmarks.length,
        bySubject: {} as Record<string, any>,
        recentActivity: [] as any[],
        reviewSchedule: {} as Record<string, number>,
      };
      
      // 과목별 통계
      const allMaterials = [...concepts, ...flashcards, ...bookmarks];
      allMaterials.forEach(material => {
        const subject = material.subject || "일반";
        if (!stats.bySubject[subject]) {
          stats.bySubject[subject] = {
            concepts: 0,
            flashcards: 0,
            bookmarks: 0,
          };
        }
        
        if (material.type === "concept") stats.bySubject[subject].concepts++;
        else if (material.type === "flashcard") stats.bySubject[subject].flashcards++;
        else if (material.type?.includes("bookmark")) stats.bySubject[subject].bookmarks++;
      });
      
      // 복습 스케줄
      const reviewCards = await this.getTodayReviewCards();
      stats.reviewSchedule = {
        today: reviewCards.length,
        thisWeek: reviewCards.filter(card => {
          const nextReview = this.calculateReviewSchedule(card.reviewCount);
          const weekFromNow = new Date();
          weekFromNow.setDate(weekFromNow.getDate() + 7);
          return nextReview <= weekFromNow;
        }).length,
      };
      
      return stats;
    } catch (error) {
      throw new Error(`학습 통계 생성 실패: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 클로즈 카드 처리
   */
  private processClozeDeletion(text: string): string {
    // {{키워드}} 형태를 ___로 변환
    return text.replace(/\{\{([^}]+)\}\}/g, "___");
  }

  /**
   * 중요도 점수 계산
   */
  private calculateImportanceScore(text: string): number {
    let score = 0;
    
    // 중요도 키워드 포함 여부
    const importanceKeywords = ["중요", "핵심", "필수", "반드시", "주의", "기출"];
    importanceKeywords.forEach(keyword => {
      if (text.includes(keyword)) score += 1;
    });
    
    // 길이 기반 점수
    if (text.length >= 100) score += 1;
    if (text.length >= 200) score += 1;
    
    // 숫자나 공식 포함 여부
    if (/[0-9]/.test(text)) score += 1;
    if (/[=+\-*/]/.test(text)) score += 1;
    
    return score;
  }

  /**
   * 학습 자료 자동 분류
   */
  async autoClassifyMaterials(): Promise<{ classified: number; errors: number }> {
    try {
      const allMaterials = await this.getStudyMaterials("all");
      let classified = 0;
      let errors = 0;
      
      for (const material of allMaterials) {
        try {
          const content = material.content || material.description || "";
          const importance = this.calculateImportanceScore(content);
          
          // 중요도가 높은 자료는 자동으로 암기카드 생성
          if (importance >= 3 && material.type === "concept") {
            await this.createFlashcardFromConcept(material as Concept);
            classified++;
          }
        } catch (error) {
          errors++;
          console.error(`자료 분류 실패: ${material.id} - ${error}`);
        }
      }
      
      return { classified, errors };
    } catch (error) {
      throw new Error(`학습 자료 자동 분류 실패: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 오답 노트 생성
   */
  async createMistakeNote(question: string, wrongAnswer: string, correctAnswer: string, explanation: string): Promise<any> {
    try {
      // 오답을 북마크로 저장
      const title = `오답: ${question.substring(0, 50)}...`;
      const content = `
**문제**: ${question}

**내가 선택한 답**: ${wrongAnswer}
**정답**: ${correctAnswer}

**해설**:
${explanation}

**실수 유형**: 추후 분석 필요
**복습 필요도**: 높음
      `;
      
      // 이 부분은 BookmarkManager를 통해 처리해야 함
      // 현재는 개념적 구현만 제공
      return {
        title,
        content,
        type: "mistake",
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(`오답 노트 생성 실패: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}