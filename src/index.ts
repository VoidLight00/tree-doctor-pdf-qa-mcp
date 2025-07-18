#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { DatabaseManager } from "./database.js";
import { PDFManager } from "./pdf-manager.js";
import { QASystem } from "./qa-system.js";
import { BookmarkManager } from "./bookmark-manager.js";
import { StudyMaterialManager } from "./study-material-manager.js";
import { TextbookManager } from "./textbook-manager.js";

// 스키마 정의
const SearchPDFSchema = z.object({
  query: z.string().describe("검색할 질문 또는 키워드"),
  maxResults: z.number().optional().default(5).describe("최대 결과 수"),
});

const FindSourceSchema = z.object({
  question: z.string().describe("기출문제 내용"),
  options: z.array(z.string()).optional().describe("객관식 선택지"),
});

const GenerateExplanationSchema = z.object({
  question: z.string().describe("문제 내용"),
  answer: z.string().describe("정답"),
  sources: z.array(z.string()).optional().describe("근거 자료"),
});

const ExtractConceptsSchema = z.object({
  text: z.string().describe("개념을 추출할 텍스트"),
  subject: z.string().optional().describe("과목명"),
});

const CreateBookmarkSchema = z.object({
  title: z.string().describe("북마크 제목"),
  content: z.string().describe("북마크 내용"),
  type: z.enum(["question", "concept", "explanation", "source"]).describe("북마크 타입"),
  tags: z.array(z.string()).optional().describe("태그"),
});

const GetBookmarksSchema = z.object({
  type: z.enum(["question", "concept", "explanation", "source", "all"]).optional().default("all").describe("북마크 타입"),
  tags: z.array(z.string()).optional().describe("필터링할 태그"),
});

const CreateFlashcardSchema = z.object({
  front: z.string().describe("앞면 (질문)"),
  back: z.string().describe("뒷면 (답변)"),
  subject: z.string().describe("과목명"),
  concepts: z.array(z.string()).optional().describe("관련 개념"),
});

const GetStudyMaterialsSchema = z.object({
  type: z.enum(["concepts", "flashcards", "mistakes", "bookmarks", "all"]).optional().default("all").describe("학습 자료 타입"),
  subject: z.string().optional().describe("과목명"),
});

const LoadTextbooksSchema = z.object({
  directoryPath: z.string().describe("교재 PDF 파일이 있는 디렉토리 경로"),
});

const SearchTextbooksSchema = z.object({
  query: z.string().describe("검색할 질문 또는 키워드"),
  subject: z.string().optional().describe("과목명"),
  maxResults: z.number().optional().default(10).describe("최대 결과 수"),
});

const GetTextbooksSchema = z.object({
  subject: z.string().optional().describe("과목명"),
});

const GetTextbookContentsSchema = z.object({
  textbookId: z.number().describe("교재 ID"),
});

class TreeDoctorPDFQAServer {
  private server: Server;
  private dbManager: DatabaseManager;
  private pdfManager: PDFManager;
  private qaSystem: QASystem;
  private bookmarkManager: BookmarkManager;
  private studyMaterialManager: StudyMaterialManager;
  private textbookManager: TextbookManager;

  constructor() {
    this.server = new Server(
      {
        name: "tree-doctor-pdf-qa-mcp",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.dbManager = new DatabaseManager();
    this.pdfManager = new PDFManager(this.dbManager);
    this.qaSystem = new QASystem(this.dbManager, this.pdfManager);
    this.bookmarkManager = new BookmarkManager(this.dbManager);
    this.studyMaterialManager = new StudyMaterialManager(this.dbManager);
    this.textbookManager = new TextbookManager(this.dbManager);

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "search_pdf",
            description: "PDF 교재에서 질문에 대한 답변을 검색합니다. 교재명, 페이지, 근거 문장을 포함한 정확한 답변을 제공합니다.",
            inputSchema: SearchPDFSchema,
          },
          {
            name: "find_source",
            description: "기출문제에 대한 교재 근거를 찾습니다. 해당 문제가 출제된 교재 단락과 페이지를 표시합니다.",
            inputSchema: FindSourceSchema,
          },
          {
            name: "generate_explanation",
            description: "기출문제에 대한 해설을 생성합니다. 교재 근거를 바탕으로 상세한 해설을 작성합니다.",
            inputSchema: GenerateExplanationSchema,
          },
          {
            name: "extract_concepts",
            description: "텍스트에서 중요한 개념을 추출합니다. 추출된 개념은 자동으로 학습 자료로 저장됩니다.",
            inputSchema: ExtractConceptsSchema,
          },
          {
            name: "create_bookmark",
            description: "중요한 내용을 북마크로 저장합니다. 문제, 개념, 해설, 교재 근거 등을 북마크할 수 있습니다.",
            inputSchema: CreateBookmarkSchema,
          },
          {
            name: "get_bookmarks",
            description: "저장된 북마크를 조회합니다. 타입과 태그로 필터링할 수 있습니다.",
            inputSchema: GetBookmarksSchema,
          },
          {
            name: "create_flashcard",
            description: "암기카드를 생성합니다. 중요한 개념을 암기하기 쉬운 형태로 저장합니다.",
            inputSchema: CreateFlashcardSchema,
          },
          {
            name: "get_study_materials",
            description: "학습 자료를 조회합니다. 개념, 암기카드, 오답, 북마크 등을 확인할 수 있습니다.",
            inputSchema: GetStudyMaterialsSchema,
          },
          {
            name: "load_textbooks",
            description: "지정된 디렉토리에서 교재 PDF 파일들을 로드하고 마크다운으로 변환하여 데이터베이스에 저장합니다.",
            inputSchema: LoadTextbooksSchema,
          },
          {
            name: "search_textbooks",
            description: "교재에서 질문에 대한 답변을 검색합니다. 교재명, 과목, 섹션 제목, 페이지 정보를 포함하여 제공합니다.",
            inputSchema: SearchTextbooksSchema,
          },
          {
            name: "get_textbooks",
            description: "로드된 교재 목록을 조회합니다. 과목별로 필터링할 수 있습니다.",
            inputSchema: GetTextbooksSchema,
          },
          {
            name: "get_textbook_contents",
            description: "특정 교재의 내용을 섹션별로 조회합니다.",
            inputSchema: GetTextbookContentsSchema,
          },
          {
            name: "get_subjects",
            description: "로드된 교재들의 과목 목록을 조회합니다.",
            inputSchema: z.object({}),
          },
          {
            name: "get_textbook_stats",
            description: "교재 통계 정보를 조회합니다 (총 교재 수, 과목 수, 페이지 수 등).",
            inputSchema: z.object({}),
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "search_pdf":
            return await this.handleSearchPDF(args);
          case "find_source":
            return await this.handleFindSource(args);
          case "generate_explanation":
            return await this.handleGenerateExplanation(args);
          case "extract_concepts":
            return await this.handleExtractConcepts(args);
          case "create_bookmark":
            return await this.handleCreateBookmark(args);
          case "get_bookmarks":
            return await this.handleGetBookmarks(args);
          case "create_flashcard":
            return await this.handleCreateFlashcard(args);
          case "get_study_materials":
            return await this.handleGetStudyMaterials(args);
          case "load_textbooks":
            return await this.handleLoadTextbooks(args);
          case "search_textbooks":
            return await this.handleSearchTextbooks(args);
          case "get_textbooks":
            return await this.handleGetTextbooks(args);
          case "get_textbook_contents":
            return await this.handleGetTextbookContents(args);
          case "get_subjects":
            return await this.handleGetSubjects(args);
          case "get_textbook_stats":
            return await this.handleGetTextbookStats(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    });
  }

  private async handleSearchPDF(args: any) {
    const { query, maxResults } = SearchPDFSchema.parse(args);
    
    const results = await this.qaSystem.searchPDF(query, maxResults);
    
    let response = `📚 **PDF 검색 결과**\n\n`;
    response += `🔍 **질문**: ${query}\n\n`;
    
    if (results.length === 0) {
      response += "❌ 검색 결과가 없습니다.\n";
    } else {
      results.forEach((result, index) => {
        response += `**${index + 1}. ${result.bookTitle}** (페이지 ${result.page})\n`;
        response += `📝 ${result.content}\n`;
        response += `🔗 [페이지 ${result.page}로 이동](file://${result.filePath}#page=${result.page})\n\n`;
      });
    }
    
    return {
      content: [
        {
          type: "text",
          text: response,
        },
      ],
    };
  }

  private async handleFindSource(args: any) {
    const { question, options } = FindSourceSchema.parse(args);
    
    const sources = await this.qaSystem.findSource(question, options);
    
    let response = `📖 **기출문제 교재 근거**\n\n`;
    response += `❓ **문제**: ${question}\n\n`;
    
    if (sources.length === 0) {
      response += "❌ 관련 교재 근거를 찾을 수 없습니다.\n";
    } else {
      sources.forEach((source, index) => {
        response += `**${index + 1}. ${source.bookTitle}** (페이지 ${source.page})\n`;
        response += `📝 ${source.content}\n`;
        response += `🔗 [페이지 ${source.page}로 이동](file://${source.filePath}#page=${source.page})\n\n`;
      });
    }
    
    return {
      content: [
        {
          type: "text",
          text: response,
        },
      ],
    };
  }

  private async handleGenerateExplanation(args: any) {
    const { question, answer, sources } = GenerateExplanationSchema.parse(args);
    
    const explanation = await this.qaSystem.generateExplanation(question, answer, sources);
    
    return {
      content: [
        {
          type: "text",
          text: explanation,
        },
      ],
    };
  }

  private async handleExtractConcepts(args: any) {
    const { text, subject } = ExtractConceptsSchema.parse(args);
    
    const concepts = await this.studyMaterialManager.extractConcepts(text, subject);
    
    let response = `🧠 **추출된 개념**\n\n`;
    
    if (concepts.length === 0) {
      response += "❌ 추출된 개념이 없습니다.\n";
    } else {
      concepts.forEach((concept, index) => {
        response += `**${index + 1}. ${concept.keyword}**\n`;
        response += `📝 ${concept.description}\n`;
        if (concept.subject) {
          response += `📚 과목: ${concept.subject}\n`;
        }
        response += `\n`;
      });
    }
    
    return {
      content: [
        {
          type: "text",
          text: response,
        },
      ],
    };
  }

  private async handleCreateBookmark(args: any) {
    const { title, content, type, tags } = CreateBookmarkSchema.parse(args);
    
    const bookmark = await this.bookmarkManager.createBookmark(title, content, type, tags);
    
    return {
      content: [
        {
          type: "text",
          text: `✅ **북마크 생성 완료**\n\n📌 **제목**: ${bookmark.title}\n📝 **타입**: ${bookmark.type}\n🏷️ **태그**: ${bookmark.tags?.join(", ") || "없음"}\n📅 **생성일**: ${new Date(bookmark.createdAt).toLocaleString("ko-KR")}`,
        },
      ],
    };
  }

  private async handleGetBookmarks(args: any) {
    const { type, tags } = GetBookmarksSchema.parse(args);
    
    const bookmarks = await this.bookmarkManager.getBookmarks(type, tags);
    
    let response = `📌 **북마크 목록**\n\n`;
    
    if (bookmarks.length === 0) {
      response += "❌ 북마크가 없습니다.\n";
    } else {
      bookmarks.forEach((bookmark, index) => {
        response += `**${index + 1}. ${bookmark.title}**\n`;
        response += `📝 타입: ${bookmark.type}\n`;
        response += `📄 ${bookmark.content.substring(0, 100)}${bookmark.content.length > 100 ? "..." : ""}\n`;
        response += `🏷️ 태그: ${bookmark.tags?.join(", ") || "없음"}\n`;
        response += `📅 ${new Date(bookmark.createdAt).toLocaleString("ko-KR")}\n\n`;
      });
    }
    
    return {
      content: [
        {
          type: "text",
          text: response,
        },
      ],
    };
  }

  private async handleCreateFlashcard(args: any) {
    const { front, back, subject, concepts } = CreateFlashcardSchema.parse(args);
    
    const flashcard = await this.studyMaterialManager.createFlashcard(front, back, subject, concepts);
    
    return {
      content: [
        {
          type: "text",
          text: `✅ **암기카드 생성 완료**\n\n❓ **앞면**: ${flashcard.front}\n✅ **뒷면**: ${flashcard.back}\n📚 **과목**: ${flashcard.subject}\n📅 **생성일**: ${new Date(flashcard.createdAt).toLocaleString("ko-KR")}`,
        },
      ],
    };
  }

  private async handleGetStudyMaterials(args: any) {
    const { type, subject } = GetStudyMaterialsSchema.parse(args);
    
    const materials = await this.studyMaterialManager.getStudyMaterials(type, subject);
    
    let response = `📚 **학습 자료**\n\n`;
    
    if (materials.length === 0) {
      response += "❌ 학습 자료가 없습니다.\n";
    } else {
      materials.forEach((material, index) => {
        response += `**${index + 1}. ${material.title || material.keyword || "제목 없음"}**\n`;
        response += `📝 타입: ${material.type || "미정"}\n`;
        if (material.subject) {
          response += `📚 과목: ${material.subject}\n`;
        }
        response += `📄 ${(material.content || material.description || "").substring(0, 100)}...\n`;
        response += `📅 ${new Date(material.createdAt).toLocaleString("ko-KR")}\n\n`;
      });
    }
    
    return {
      content: [
        {
          type: "text",
          text: response,
        },
      ],
    };
  }

  private async handleLoadTextbooks(args: any) {
    const { directoryPath } = LoadTextbooksSchema.parse(args);
    
    try {
      await this.textbookManager.initializeTextbooks();
      await this.textbookManager.loadTextbooksFromDirectory(directoryPath);
      
      const stats = await this.textbookManager.getTextbookStats();
      
      let response = `📚 **교재 로드 완료**\n\n`;
      response += `📊 **통계**:\n`;
      response += `- 총 교재 수: ${stats.totalTextbooks}개\n`;
      response += `- 과목 수: ${stats.totalSubjects}개\n`;
      response += `- 총 페이지 수: ${stats.totalPages}페이지\n\n`;
      
      response += `📋 **과목별 교재 수**:\n`;
      for (const [subject, count] of Object.entries(stats.bySubject)) {
        response += `- ${subject}: ${count}개\n`;
      }
      
      return {
        content: [
          {
            type: "text",
            text: response,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ 교재 로드 실패: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  private async handleSearchTextbooks(args: any) {
    const { query, subject, maxResults } = SearchTextbooksSchema.parse(args);
    
    const results = await this.textbookManager.searchTextbooks(query, subject, maxResults);
    
    let response = `📚 **교재 검색 결과**\n\n`;
    response += `🔍 **검색어**: ${query}\n`;
    if (subject) {
      response += `📖 **과목**: ${subject}\n`;
    }
    response += `📊 **결과 수**: ${results.length}개\n\n`;
    
    if (results.length === 0) {
      response += "❌ 검색 결과가 없습니다.\n";
    } else {
      results.forEach((result, index) => {
        response += `**${index + 1}. ${result.textbook.title}**\n`;
        response += `📚 과목: ${result.textbook.subject}\n`;
        if (result.content.sectionTitle) {
          response += `📄 섹션: ${result.content.sectionTitle}\n`;
        }
        response += `📄 페이지: ${result.content.pageStart}-${result.content.pageEnd}\n`;
        response += `🎯 관련도: ${result.relevanceScore.toFixed(2)}\n`;
        response += `📝 내용: ${result.matchedText}\n\n`;
      });
    }
    
    return {
      content: [
        {
          type: "text",
          text: response,
        },
      ],
    };
  }

  private async handleGetTextbooks(args: any) {
    const { subject } = GetTextbooksSchema.parse(args);
    
    const textbooks = await this.textbookManager.getTextbooks(subject);
    
    let response = `📚 **교재 목록**\n\n`;
    if (subject) {
      response += `📖 **과목**: ${subject}\n\n`;
    }
    
    if (textbooks.length === 0) {
      response += "❌ 교재가 없습니다.\n";
    } else {
      textbooks.forEach((textbook, index) => {
        response += `**${index + 1}. ${textbook.title}**\n`;
        response += `📚 과목: ${textbook.subject}\n`;
        response += `📄 페이지: ${textbook.pageCount}페이지\n`;
        response += `📊 내용 길이: ${textbook.contentLength.toLocaleString()}자\n`;
        response += `🔧 처리 방법: ${textbook.processingMethod}\n`;
        response += `📅 등록일: ${new Date(textbook.createdAt).toLocaleString("ko-KR")}\n\n`;
      });
    }
    
    return {
      content: [
        {
          type: "text",
          text: response,
        },
      ],
    };
  }

  private async handleGetTextbookContents(args: any) {
    const { textbookId } = GetTextbookContentsSchema.parse(args);
    
    const contents = await this.textbookManager.getTextbookContents(textbookId);
    
    let response = `📖 **교재 내용**\n\n`;
    
    if (contents.length === 0) {
      response += "❌ 교재 내용이 없습니다.\n";
    } else {
      contents.forEach((content, index) => {
        response += `**${index + 1}. ${content.sectionTitle || "제목 없음"}**\n`;
        response += `📄 페이지: ${content.pageStart}-${content.pageEnd}\n`;
        response += `📊 레벨: ${content.level}\n`;
        response += `📝 내용: ${content.content.substring(0, 200)}${content.content.length > 200 ? "..." : ""}\n\n`;
      });
    }
    
    return {
      content: [
        {
          type: "text",
          text: response,
        },
      ],
    };
  }

  private async handleGetSubjects(args: any) {
    const subjects = await this.textbookManager.getSubjects();
    
    let response = `📚 **과목 목록**\n\n`;
    
    if (subjects.length === 0) {
      response += "❌ 과목이 없습니다.\n";
    } else {
      subjects.forEach((subject, index) => {
        response += `${index + 1}. ${subject}\n`;
      });
    }
    
    return {
      content: [
        {
          type: "text",
          text: response,
        },
      ],
    };
  }

  private async handleGetTextbookStats(args: any) {
    const stats = await this.textbookManager.getTextbookStats();
    
    let response = `📊 **교재 통계**\n\n`;
    response += `📚 총 교재 수: ${stats.totalTextbooks}개\n`;
    response += `📖 과목 수: ${stats.totalSubjects}개\n`;
    response += `📄 총 페이지 수: ${stats.totalPages.toLocaleString()}페이지\n`;
    response += `📊 총 내용 길이: ${stats.totalContentLength.toLocaleString()}자\n\n`;
    
    response += `📋 **과목별 교재 수**:\n`;
    for (const [subject, count] of Object.entries(stats.bySubject)) {
      response += `- ${subject}: ${count}개\n`;
    }
    
    return {
      content: [
        {
          type: "text",
          text: response,
        },
      ],
    };
  }

  async run() {
    // 데이터베이스 초기화
    await this.dbManager.initialize();
    
    // 교재 관리 시스템 초기화
    await this.textbookManager.initializeTextbooks();
    
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    console.error("🌳 나무의사 PDF Q&A MCP 서버가 시작되었습니다.");
  }
}

const server = new TreeDoctorPDFQAServer();
server.run().catch(console.error);