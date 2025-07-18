import { DatabaseManager, Bookmark } from "./database.js";
import { v4 as uuidv4 } from "uuid";

export interface BookmarkSummary {
  totalBookmarks: number;
  byType: Record<string, number>;
  byTags: Record<string, number>;
  recentBookmarks: Bookmark[];
}

export class BookmarkManager {
  private dbManager: DatabaseManager;

  constructor(dbManager: DatabaseManager) {
    this.dbManager = dbManager;
  }

  /**
   * 북마크 생성
   */
  async createBookmark(
    title: string,
    content: string,
    type: "question" | "concept" | "explanation" | "source",
    tags?: string[]
  ): Promise<Bookmark> {
    try {
      // 제목이 너무 길면 자동으로 줄임
      const truncatedTitle = title.length > 100 ? title.substring(0, 100) + "..." : title;
      
      // 중복 체크 (제목과 타입이 같은 경우)
      const existingBookmarks = await this.dbManager.getBookmarks(type);
      const duplicate = existingBookmarks.find(b => b.title === truncatedTitle);
      
      if (duplicate) {
        throw new Error(`이미 같은 제목의 북마크가 존재합니다: ${truncatedTitle}`);
      }
      
      // 태그 정규화
      const normalizedTags = tags?.map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0);
      
      return await this.dbManager.createBookmark(truncatedTitle, content, type, normalizedTags);
    } catch (error) {
      throw new Error(`북마크 생성 실패: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 북마크 조회
   */
  async getBookmarks(type?: string, tags?: string[]): Promise<Bookmark[]> {
    try {
      const normalizedTags = tags?.map(tag => tag.trim().toLowerCase());
      return await this.dbManager.getBookmarks(type, normalizedTags);
    } catch (error) {
      throw new Error(`북마크 조회 실패: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 북마크 검색
   */
  async searchBookmarks(query: string, type?: string): Promise<Bookmark[]> {
    try {
      const allBookmarks = await this.getBookmarks(type);
      const searchKeywords = query.toLowerCase().split(/\s+/);
      
      return allBookmarks.filter(bookmark => {
        const searchableText = `${bookmark.title} ${bookmark.content}`.toLowerCase();
        return searchKeywords.every(keyword => searchableText.includes(keyword));
      });
    } catch (error) {
      throw new Error(`북마크 검색 실패: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 북마크 요약 정보
   */
  async getBookmarkSummary(): Promise<BookmarkSummary> {
    try {
      const allBookmarks = await this.getBookmarks();
      
      const byType: Record<string, number> = {};
      const byTags: Record<string, number> = {};
      
      allBookmarks.forEach(bookmark => {
        // 타입별 카운트
        byType[bookmark.type] = (byType[bookmark.type] || 0) + 1;
        
        // 태그별 카운트
        if (bookmark.tags) {
          bookmark.tags.forEach(tag => {
            byTags[tag] = (byTags[tag] || 0) + 1;
          });
        }
      });
      
      const recentBookmarks = allBookmarks.slice(0, 10); // 최근 10개
      
      return {
        totalBookmarks: allBookmarks.length,
        byType,
        byTags,
        recentBookmarks,
      };
    } catch (error) {
      throw new Error(`북마크 요약 정보 조회 실패: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 시험 전날용 요약 생성
   */
  async generateExamSummary(): Promise<string> {
    try {
      const bookmarks = await this.getBookmarks();
      
      let summary = `# 🎯 시험 전날 요약\n\n`;
      summary += `📅 생성일: ${new Date().toLocaleString("ko-KR")}\n`;
      summary += `📌 총 북마크: ${bookmarks.length}개\n\n`;
      
      // 타입별로 분류
      const byType = bookmarks.reduce((acc, bookmark) => {
        if (!acc[bookmark.type]) acc[bookmark.type] = [];
        acc[bookmark.type].push(bookmark);
        return acc;
      }, {} as Record<string, Bookmark[]>);
      
      // 중요 개념
      if (byType.concept) {
        summary += `## 🧠 중요 개념 (${byType.concept.length}개)\n\n`;
        byType.concept.forEach((bookmark, index) => {
          summary += `### ${index + 1}. ${bookmark.title}\n`;
          summary += `${bookmark.content}\n\n`;
        });
      }
      
      // 기출문제
      if (byType.question) {
        summary += `## 📝 중요 기출문제 (${byType.question.length}개)\n\n`;
        byType.question.forEach((bookmark, index) => {
          summary += `### ${index + 1}. ${bookmark.title}\n`;
          summary += `${bookmark.content}\n\n`;
        });
      }
      
      // 해설
      if (byType.explanation) {
        summary += `## 💡 중요 해설 (${byType.explanation.length}개)\n\n`;
        byType.explanation.forEach((bookmark, index) => {
          summary += `### ${index + 1}. ${bookmark.title}\n`;
          summary += `${bookmark.content}\n\n`;
        });
      }
      
      // 교재 근거
      if (byType.source) {
        summary += `## 📚 중요 교재 근거 (${byType.source.length}개)\n\n`;
        byType.source.forEach((bookmark, index) => {
          summary += `### ${index + 1}. ${bookmark.title}\n`;
          summary += `${bookmark.content}\n\n`;
        });
      }
      
      summary += `---\n\n`;
      summary += `💪 **화이팅! 좋은 결과 있으시길 바랍니다!**\n`;
      
      return summary;
    } catch (error) {
      throw new Error(`시험 요약 생성 실패: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 북마크를 Markdown 형태로 내보내기
   */
  async exportBookmarksToMarkdown(type?: string, tags?: string[]): Promise<string> {
    try {
      const bookmarks = await this.getBookmarks(type, tags);
      
      let markdown = `# 📌 북마크 모음\n\n`;
      markdown += `📅 내보내기 날짜: ${new Date().toLocaleString("ko-KR")}\n`;
      markdown += `📊 총 북마크: ${bookmarks.length}개\n\n`;
      
      if (type && type !== "all") {
        markdown += `🔍 필터: ${type}\n\n`;
      }
      
      if (tags && tags.length > 0) {
        markdown += `🏷️ 태그: ${tags.join(", ")}\n\n`;
      }
      
      markdown += `---\n\n`;
      
      bookmarks.forEach((bookmark, index) => {
        markdown += `## ${index + 1}. ${bookmark.title}\n\n`;
        markdown += `**타입**: ${bookmark.type}\n\n`;
        
        if (bookmark.tags && bookmark.tags.length > 0) {
          markdown += `**태그**: ${bookmark.tags.join(", ")}\n\n`;
        }
        
        markdown += `**내용**:\n${bookmark.content}\n\n`;
        markdown += `**생성일**: ${new Date(bookmark.createdAt).toLocaleString("ko-KR")}\n\n`;
        markdown += `---\n\n`;
      });
      
      return markdown;
    } catch (error) {
      throw new Error(`북마크 내보내기 실패: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 북마크 자동 태그 추천
   */
  async suggestTags(content: string): Promise<string[]> {
    try {
      const suggestions: string[] = [];
      
      // 과목별 키워드 매칭
      const subjectKeywords = {
        "수목생리학": ["광합성", "호흡", "증산", "양분", "수분", "영양", "생장"],
        "수목병리학": ["병해", "곰팡이", "세균", "바이러스", "진단", "방제"],
        "수목해충학": ["해충", "진딧물", "나방", "딱정벌레", "방제", "천적"],
        "수목관리학": ["전정", "시비", "관수", "식재", "관리", "유지"],
        "나무보호법": ["법령", "허가", "신고", "처벌", "보호수", "금지"]
      };
      
      const contentLower = content.toLowerCase();
      
      for (const [subject, keywords] of Object.entries(subjectKeywords)) {
        const matchCount = keywords.filter(keyword => 
          contentLower.includes(keyword)
        ).length;
        
        if (matchCount >= 2) {
          suggestions.push(subject);
        }
      }
      
      // 중요도 키워드 매칭
      const importanceKeywords = {
        "중요": ["중요", "핵심", "필수", "반드시"],
        "기출": ["기출", "문제", "시험", "출제"],
        "암기": ["암기", "외우", "기억", "정리"],
        "이해": ["이해", "원리", "원인", "메커니즘"]
      };
      
      for (const [importance, keywords] of Object.entries(importanceKeywords)) {
        const hasMatch = keywords.some(keyword => 
          contentLower.includes(keyword)
        );
        
        if (hasMatch) {
          suggestions.push(importance);
        }
      }
      
      return [...new Set(suggestions)];
    } catch (error) {
      console.error(`태그 추천 실패: ${error}`);
      return [];
    }
  }

  /**
   * 북마크 정리 (중복 제거 등)
   */
  async cleanupBookmarks(): Promise<{ removed: number; duplicates: number }> {
    try {
      const allBookmarks = await this.getBookmarks();
      
      // 중복 찾기 (제목과 타입이 같은 경우)
      const duplicates: number[] = [];
      const seen = new Set<string>();
      
      allBookmarks.forEach(bookmark => {
        const key = `${bookmark.title}-${bookmark.type}`;
        if (seen.has(key)) {
          duplicates.push(bookmark.id);
        } else {
          seen.add(key);
        }
      });
      
      // 여기서는 실제 삭제 대신 통계만 반환
      // 실제 구현에서는 DELETE 쿼리 실행
      
      return {
        removed: 0, // 실제 삭제된 항목 수
        duplicates: duplicates.length,
      };
    } catch (error) {
      throw new Error(`북마크 정리 실패: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}