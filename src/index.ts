#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { DatabaseManager } from "./database.js";
import { PDFManager } from "./pdf-manager.js";
import { QASystem } from "./qa-system.js";
import { BookmarkManager } from "./bookmark-manager.js";
import { StudyMaterialManager } from "./study-material-manager.js";
import { TextbookManager } from "./textbook-manager.js";
import { ExamManager } from "./exam-manager.js";
import { MVPIntegration } from "./mvp-integration.js";

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

// 기출문제 관련 스키마
const SearchExamQuestionsSchema = z.object({
  query: z.string().describe("검색할 문제 내용 또는 키워드"),
  subject: z.string().optional().describe("과목명"),
  yearFrom: z.number().optional().describe("시작 연도"),
  yearTo: z.number().optional().describe("종료 연도"),
  questionType: z.enum(["multiple_choice", "essay", "short_answer"]).optional().describe("문제 유형"),
  maxResults: z.number().optional().default(20).describe("최대 결과 수"),
});

const GetExamByYearSchema = z.object({
  year: z.number().describe("시험 연도"),
  round: z.number().optional().describe("시험 회차"),
});

const FindSimilarQuestionsSchema = z.object({
  questionId: z.number().describe("기준 문제 ID"),
  maxResults: z.number().optional().default(10).describe("최대 결과 수"),
});

const GenerateMockExamSchema = z.object({
  subjects: z.array(z.string()).optional().describe("포함할 과목 목록"),
  questionCount: z.number().optional().default(50).describe("문제 수"),
  difficulty: z.enum(["easy", "medium", "hard", "mixed"]).optional().default("mixed").describe("난이도"),
  yearFrom: z.number().optional().describe("시작 연도"),
  yearTo: z.number().optional().describe("종료 연도"),
});

// MVP 통합 관련 스키마
const GetMVPStatusSchema = z.object({});

const GetExamStructureSchema = z.object({
  examYear: z.string().describe("시험 회차 (예: '5회', '6회')"),
});

const SearchMVPDataSchema = z.object({
  query: z.string().describe("검색어 (과목명, 문제번호 등)"),
  includeTemplates: z.boolean().optional().default(false).describe("템플릿 포함 여부"),
});

const InitializeMVPDataSchema = z.object({
  importSampleData: z.boolean().optional().default(true).describe("샘플 데이터 임포트 여부"),
  generateTemplates: z.boolean().optional().default(false).describe("템플릿 생성 여부"),
});

class TreeDoctorPDFQAServer {
  private server: Server;
  private dbManager: DatabaseManager;
  private pdfManager: PDFManager;
  private qaSystem: QASystem;
  private bookmarkManager: BookmarkManager;
  private studyMaterialManager: StudyMaterialManager;
  private textbookManager: TextbookManager;
  private examManager: ExamManager;
  private mvpIntegration: MVPIntegration;

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
    this.examManager = new ExamManager(this.dbManager);
    this.mvpIntegration = new MVPIntegration(this.dbManager, this.examManager);

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "search_pdf",
            description: "PDF 교재에서 질문에 대한 답변을 검색합니다. 교재명, 페이지, 근거 문장을 포함한 정확한 답변을 제공합니다.",
            inputSchema: zodToJsonSchema(SearchPDFSchema),
          },
          {
            name: "find_source",
            description: "기출문제에 대한 교재 근거를 찾습니다. 해당 문제가 출제된 교재 단락과 페이지를 표시합니다.",
            inputSchema: zodToJsonSchema(FindSourceSchema),
          },
          {
            name: "generate_explanation",
            description: "기출문제에 대한 해설을 생성합니다. 교재 근거를 바탕으로 상세한 해설을 작성합니다.",
            inputSchema: zodToJsonSchema(GenerateExplanationSchema),
          },
          {
            name: "extract_concepts",
            description: "텍스트에서 중요한 개념을 추출합니다. 추출된 개념은 자동으로 학습 자료로 저장됩니다.",
            inputSchema: zodToJsonSchema(ExtractConceptsSchema),
          },
          {
            name: "create_bookmark",
            description: "중요한 내용을 북마크로 저장합니다. 문제, 개념, 해설, 교재 근거 등을 북마크할 수 있습니다.",
            inputSchema: zodToJsonSchema(CreateBookmarkSchema),
          },
          {
            name: "get_bookmarks",
            description: "저장된 북마크를 조회합니다. 타입과 태그로 필터링할 수 있습니다.",
            inputSchema: zodToJsonSchema(GetBookmarksSchema),
          },
          {
            name: "create_flashcard",
            description: "암기카드를 생성합니다. 중요한 개념을 암기하기 쉬운 형태로 저장합니다.",
            inputSchema: zodToJsonSchema(CreateFlashcardSchema),
          },
          {
            name: "get_study_materials",
            description: "학습 자료를 조회합니다. 개념, 암기카드, 오답, 북마크 등을 확인할 수 있습니다.",
            inputSchema: zodToJsonSchema(GetStudyMaterialsSchema),
          },
          {
            name: "load_textbooks",
            description: "지정된 디렉토리에서 교재 PDF 파일들을 로드하고 마크다운으로 변환하여 데이터베이스에 저장합니다.",
            inputSchema: zodToJsonSchema(LoadTextbooksSchema),
          },
          {
            name: "search_textbooks",
            description: "교재에서 질문에 대한 답변을 검색합니다. 교재명, 과목, 섹션 제목, 페이지 정보를 포함하여 제공합니다.",
            inputSchema: zodToJsonSchema(SearchTextbooksSchema),
          },
          {
            name: "get_textbooks",
            description: "로드된 교재 목록을 조회합니다. 과목별로 필터링할 수 있습니다.",
            inputSchema: zodToJsonSchema(GetTextbooksSchema),
          },
          {
            name: "get_textbook_contents",
            description: "특정 교재의 내용을 섹션별로 조회합니다.",
            inputSchema: zodToJsonSchema(GetTextbookContentsSchema),
          },
          {
            name: "get_subjects",
            description: "로드된 교재들의 과목 목록을 조회합니다.",
            inputSchema: zodToJsonSchema(z.object({})),
          },
          {
            name: "get_textbook_stats",
            description: "교재 통계 정보를 조회합니다 (총 교재 수, 과목 수, 페이지 수 등).",
            inputSchema: zodToJsonSchema(z.object({})),
          },
          // 기출문제 관련 도구
          {
            name: "search_exam_questions",
            description: "기출문제를 검색합니다. 키워드, 과목, 연도, 문제 유형 등으로 필터링할 수 있습니다.",
            inputSchema: zodToJsonSchema(SearchExamQuestionsSchema),
          },
          {
            name: "get_exam_by_year",
            description: "특정 연도와 회차의 기출문제를 조회합니다. 회차를 지정하지 않으면 해당 연도의 모든 문제를 반환합니다.",
            inputSchema: zodToJsonSchema(GetExamByYearSchema),
          },
          {
            name: "find_similar_questions",
            description: "특정 문제와 유사한 기출문제를 찾습니다. 키워드와 내용 유사도를 기반으로 검색합니다.",
            inputSchema: zodToJsonSchema(FindSimilarQuestionsSchema),
          },
          {
            name: "generate_mock_exam",
            description: "모의고사를 생성합니다. 과목, 문제 수, 난이도, 연도 범위 등을 지정할 수 있습니다.",
            inputSchema: zodToJsonSchema(GenerateMockExamSchema),
          },
          {
            name: "get_exam_statistics",
            description: "기출문제 통계를 조회합니다. 총 문제 수, 연도별/과목별/유형별 분포 등을 확인할 수 있습니다.",
            inputSchema: zodToJsonSchema(z.object({})),
          },
          // MVP 통합 도구
          {
            name: "get_mvp_status",
            description: "MVP 시스템의 현재 데이터 상태를 조회합니다. 고품질/중간품질/낮은품질/템플릿 데이터 수를 확인할 수 있습니다.",
            inputSchema: zodToJsonSchema(GetMVPStatusSchema),
          },
          {
            name: "get_exam_structure",
            description: "특정 회차의 시험 구조를 조회합니다. 과목별 문제 번호 배치 정보를 제공합니다.",
            inputSchema: zodToJsonSchema(GetExamStructureSchema),
          },
          {
            name: "search_mvp_data",
            description: "MVP 데이터를 검색합니다. 과목명, 문제번호 등으로 검색하며 템플릿 포함 여부를 선택할 수 있습니다.",
            inputSchema: zodToJsonSchema(SearchMVPDataSchema),
          },
          {
            name: "initialize_mvp_data",
            description: "MVP 데이터를 초기화합니다. 샘플 데이터 임포트 및 템플릿 생성을 수행합니다.",
            inputSchema: zodToJsonSchema(InitializeMVPDataSchema),
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
          // 기출문제 관련 핸들러
          case "search_exam_questions":
            return await this.handleSearchExamQuestions(args);
          case "get_exam_by_year":
            return await this.handleGetExamByYear(args);
          case "find_similar_questions":
            return await this.handleFindSimilarQuestions(args);
          case "generate_mock_exam":
            return await this.handleGenerateMockExam(args);
          case "get_exam_statistics":
            return await this.handleGetExamStatistics(args);
          // MVP 통합 핸들러
          case "get_mvp_status":
            return await this.handleGetMVPStatus(args);
          case "get_exam_structure":
            return await this.handleGetExamStructure(args);
          case "search_mvp_data":
            return await this.handleSearchMVPData(args);
          case "initialize_mvp_data":
            return await this.handleInitializeMVPData(args);
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
    
    // 기출문제 관리 시스템 초기화
    await this.examManager.initialize();
    
    // MVP 통합 시스템 초기화
    await this.mvpIntegration.initialize();
    
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    console.error("🌳 나무의사 PDF Q&A MCP 서버가 시작되었습니다.");
  }

  // 기출문제 관련 핸들러 메서드
  private async handleSearchExamQuestions(args: any) {
    const { query, subject, yearFrom, yearTo, questionType, maxResults } = SearchExamQuestionsSchema.parse(args);
    
    const results = await this.examManager.searchExamQuestions(
      query,
      { subject, yearFrom, yearTo, questionType },
      maxResults
    );
    
    let response = `📖 **기출문제 검색 결과**\n\n`;
    response += `🔍 **검색어**: ${query}\n`;
    if (subject) response += `📖 **과목**: ${subject}\n`;
    if (yearFrom || yearTo) response += `📅 **기간**: ${yearFrom || '-'} ~ ${yearTo || '-'}\n`;
    response += `\n`;
    
    if (results.length === 0) {
      response += "❌ 검색 결과가 없습니다.\n";
    } else {
      results.forEach((result, index) => {
        const q = result.question;
        response += `**${index + 1}. [${q.examYear}년 ${q.examRound}회 문제 ${q.questionNumber}]**\n`;
        response += `📘 과목: ${q.subject}\n`;
        response += `🔵 유형: ${q.questionType === 'multiple_choice' ? '객관식' : q.questionType === 'essay' ? '서술형' : '단답형'}\n`;
        response += `📋 문제: ${q.questionText}\n`;
        
        if (q.choices && q.choices.length > 0) {
          response += `\n객관식 선택지:\n`;
          q.choices.forEach(choice => {
            response += `  ${choice.choiceNumber}) ${choice.choiceText}${choice.isCorrect ? ' ✅' : ''}\n`;
          });
        }
        
        if (q.answer) {
          response += `\n✅ **정답**: ${q.answer.correctAnswer}\n`;
          if (q.answer.explanation) {
            response += `💡 **해설**: ${q.answer.explanation}\n`;
          }
        }
        
        if (result.matchedKeywords.length > 0) {
          response += `🎯 **매칭 키워드**: ${result.matchedKeywords.join(', ')}\n`;
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

  private async handleGetExamByYear(args: any) {
    const { year, round } = GetExamByYearSchema.parse(args);
    
    const questions = await this.examManager.getExamByYear(year, round);
    
    let response = `📅 **${year}년${round ? ` ${round}회` : ''} 기출문제**\n\n`;
    
    if (questions.length === 0) {
      response += "❌ 해당 연도/회차의 문제가 없습니다.\n";
    } else {
      // 과목별로 그룹핑
      const bySubject: { [key: string]: typeof questions } = {};
      questions.forEach(q => {
        if (!bySubject[q.subject]) bySubject[q.subject] = [];
        bySubject[q.subject].push(q);
      });
      
      Object.entries(bySubject).forEach(([subject, subjectQuestions]) => {
        response += `\n### 📖 ${subject} (${subjectQuestions.length}문제)\n\n`;
        
        subjectQuestions.forEach(q => {
          response += `**문제 ${q.questionNumber}**. ${q.questionText}\n`;
          
          if (q.choices && q.choices.length > 0) {
            q.choices.forEach(choice => {
              response += `  ${choice.choiceNumber}) ${choice.choiceText}\n`;
            });
          }
          
          if (q.answer) {
            response += `정답: ${q.answer.correctAnswer}\n`;
          }
          
          response += `\n`;
        });
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

  private async handleFindSimilarQuestions(args: any) {
    const { questionId, maxResults } = FindSimilarQuestionsSchema.parse(args);
    
    const results = await this.examManager.findSimilarQuestions(questionId, maxResults);
    
    let response = `🔍 **유사 문제 검색 결과**\n\n`;
    response += `🎯 **기준 문제 ID**: ${questionId}\n\n`;
    
    if (results.length === 0) {
      response += "❌ 유사한 문제를 찾을 수 없습니다.\n";
    } else {
      results.forEach((result, index) => {
        const q = result.question;
        response += `**${index + 1}. [${q.examYear}년 ${q.examRound}회 문제 ${q.questionNumber}]** (유사도: ${result.relevanceScore.toFixed(2)})\n`;
        response += `📘 과목: ${q.subject}\n`;
        response += `📋 ${q.questionText}\n\n`;
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

  private async handleGenerateMockExam(args: any) {
    const { subjects, questionCount, difficulty, yearFrom, yearTo } = GenerateMockExamSchema.parse(args);
    
    const mockExam = await this.examManager.generateMockExam({
      subjects,
      questionCount,
      difficulty,
      yearRange: yearFrom && yearTo ? { from: yearFrom, to: yearTo } : undefined
    });
    
    let response = `📝 **${mockExam.title}**\n\n`;
    response += `📈 **문제 수**: ${mockExam.questions.length}문제\n`;
    response += `🎯 **총 배점**: ${mockExam.totalPoints}점\n`;
    response += `⏰ **예상 시간**: ${mockExam.estimatedTime}분\n\n`;
    
    response += `---\n\n`;
    
    // 과목별로 그룹핑
    const bySubject: { [key: string]: typeof mockExam.questions } = {};
    mockExam.questions.forEach(q => {
      if (!bySubject[q.subject]) bySubject[q.subject] = [];
      bySubject[q.subject].push(q);
    });
    
    let questionNumber = 1;
    Object.entries(bySubject).forEach(([subject, subjectQuestions]) => {
      response += `### 📖 ${subject}\n\n`;
      
      subjectQuestions.forEach(q => {
        response += `**${questionNumber}**. ${q.questionText}\n`;
        
        if (q.choices && q.choices.length > 0) {
          q.choices.forEach(choice => {
            response += `  ${choice.choiceNumber}) ${choice.choiceText}\n`;
          });
        }
        
        response += `\n`;
        questionNumber++;
      });
    });
    
    response += `\n---\n\n`;
    response += `### 📌 정답\n\n`;
    
    questionNumber = 1;
    mockExam.questions.forEach(q => {
      if (q.answer) {
        response += `${questionNumber}. ${q.answer.correctAnswer}\n`;
      }
      questionNumber++;
    });
    
    return {
      content: [
        {
          type: "text",
          text: response,
        },
      ],
    };
  }

  private async handleGetExamStatistics(args: any) {
    const stats = await this.examManager.getExamStatistics();
    
    let response = `📊 **기출문제 통계**\n\n`;
    
    response += `### 📈 전체 통계\n`;
    response += `- 총 문제 수: ${stats.totalQuestions}개\n`;
    response += `- 정답 포함 문제: ${stats.withAnswers}개\n`;
    response += `- 해설 포함 문제: ${stats.withExplanations}개\n`;
    response += `- 불완전한 데이터: ${stats.incompleteCount}개\n\n`;
    
    response += `### 📅 연도별 분포\n`;
    stats.byYear.forEach((item: any) => {
      response += `- ${item.exam_year}년: ${item.count}개\n`;
    });
    response += `\n`;
    
    response += `### 📖 과목별 분포\n`;
    stats.bySubject.forEach((item: any) => {
      response += `- ${item.subject}: ${item.count}개\n`;
    });
    response += `\n`;
    
    response += `### 📝 문제 유형별 분포\n`;
    stats.byType.forEach((item: any) => {
      const typeMap: { [key: string]: string } = {
        'multiple_choice': '객관식',
        'essay': '서술형',
        'short_answer': '단답형'
      };
      const typeName = typeMap[item.question_type] || item.question_type;
      response += `- ${typeName}: ${item.count}개\n`;
    });
    
    return {
      content: [
        {
          type: "text",
          text: response,
        },
      ],
    };
  }

  // MVP 통합 핸들러 메서드들
  private async handleGetMVPStatus(args: any) {
    const stats = await this.mvpIntegration.getAvailableDataStats();
    
    let response = `📊 **MVP 시스템 현황**\n\n`;
    
    response += `### 📈 전체 데이터 현황\n`;
    response += `- 총 문제 수: ${stats.totalQuestions}개 (7회차 × 150문제)\n`;
    response += `- 고품질 데이터: ${stats.highQualityCount}개\n`;
    response += `- 중간품질 데이터: ${stats.mediumQualityCount}개\n`;
    response += `- 낮은품질 데이터: ${stats.lowQualityCount}개\n`;
    response += `- 템플릿 데이터: ${stats.templateCount}개\n\n`;
    
    response += `### 📊 완성도 통계\n`;
    response += `- 완성됨: ${stats.completenessStats.complete}개\n`;
    response += `- 부분완성: ${stats.completenessStats.partial}개\n`;
    response += `- 최소정보: ${stats.completenessStats.minimal}개\n\n`;
    
    response += `### 📖 과목별 문제 수 (전체)\n`;
    for (const [subject, count] of Object.entries(stats.bySubject)) {
      response += `- ${subject}: ${count}개\n`;
    }
    response += `\n`;
    
    response += `### 📅 회차별 입력 현황\n`;
    for (const [examYear, count] of Object.entries(stats.byExamYear)) {
      response += `- ${examYear}: ${count}개 입력됨\n`;
    }
    
    response += `\n💡 **현재 상태**: OCR 품질 문제로 대부분의 데이터가 템플릿 상태입니다.\n`;
    response += `수동 입력 또는 더 나은 OCR 처리가 필요합니다.\n`;
    
    return {
      content: [
        {
          type: "text",
          text: response,
        },
      ],
    };
  }

  private async handleGetExamStructure(args: any) {
    const { examYear } = GetExamStructureSchema.parse(args);
    
    const structure = await this.mvpIntegration.getTemplateStructure(examYear);
    
    if (!structure) {
      return {
        content: [
          {
            type: "text",
            text: `❌ ${examYear}의 구조 정보를 찾을 수 없습니다.`,
          },
        ],
      };
    }
    
    let response = `📚 **${examYear} 시험 구조**\n\n`;
    response += `총 문제 수: ${structure.totalQuestions}문제\n\n`;
    response += `### 📖 과목별 문제 배치\n`;
    
    for (const [subject, info] of Object.entries(structure.subjects)) {
      response += `- **${subject}**: ${info.range} (${info.endNumber - info.startNumber + 1}문제)\n`;
    }
    
    response += `\n💡 이 구조는 모든 회차에 동일하게 적용됩니다.\n`;
    
    return {
      content: [
        {
          type: "text",
          text: response,
        },
      ],
    };
  }

  private async handleSearchMVPData(args: any) {
    const { query, includeTemplates } = SearchMVPDataSchema.parse(args);
    
    const results = await this.mvpIntegration.searchPartialData(query, includeTemplates);
    
    let response = `🔍 **MVP 데이터 검색 결과**\n\n`;
    response += `검색어: "${query}"\n`;
    response += `템플릿 포함: ${includeTemplates ? '예' : '아니오'}\n\n`;
    
    if (results.length === 0) {
      response += "❌ 검색 결과가 없습니다.\n";
    } else {
      // 품질별로 그룹화
      const byQuality: { [key: string]: typeof results } = {};
      results.forEach(result => {
        const quality = result.qualityFlags.dataQuality;
        if (!byQuality[quality]) byQuality[quality] = [];
        byQuality[quality].push(result);
      });
      
      // 품질 순서대로 표시
      const qualityOrder = ['high', 'medium', 'low', 'template'];
      const qualityEmoji: { [key: string]: string } = {
        'high': '✅',
        'medium': '⚠️',
        'low': '❌',
        'template': '📝'
      };
      
      let index = 1;
      for (const quality of qualityOrder) {
        const qualityResults = byQuality[quality];
        if (!qualityResults || qualityResults.length === 0) continue;
        
        response += `\n### ${qualityEmoji[quality]} ${quality.toUpperCase()} 품질 (${qualityResults.length}개)\n\n`;
        
        qualityResults.slice(0, 10).forEach(result => {
          response += `**${index}. [${result.examYear} 문제 ${result.questionNumber}]**\n`;
          response += `📘 과목: ${result.subject}\n`;
          
          if (result.questionText && !result.isTemplate) {
            response += `📋 문제: ${result.questionText.substring(0, 100)}${result.questionText.length > 100 ? '...' : ''}\n`;
          }
          
          response += `📊 완성도: ${result.qualityFlags.completeness}\n`;
          response += `✔️ 검증상태: ${result.qualityFlags.verificationStatus}\n\n`;
          index++;
        });
      }
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

  private async handleInitializeMVPData(args: any) {
    const { importSampleData, generateTemplates } = InitializeMVPDataSchema.parse(args);
    
    let response = `🚀 **MVP 데이터 초기화**\n\n`;
    
    try {
      if (importSampleData) {
        response += `📥 샘플 데이터 임포트 중...\n`;
        await this.mvpIntegration.importSampleData();
        response += `✅ 샘플 데이터 임포트 완료 (5회차 1번 문제)\n\n`;
      }
      
      if (generateTemplates) {
        response += `📝 템플릿 생성 중...\n`;
        await this.mvpIntegration.generateQuestionTemplates();
        response += `✅ 템플릿 생성 완료 (1,050개 문제)\n\n`;
      }
      
      // 초기화 후 상태 표시
      const stats = await this.mvpIntegration.getAvailableDataStats();
      response += `### 📊 초기화 후 상태\n`;
      response += `- 고품질 데이터: ${stats.highQualityCount}개\n`;
      response += `- 템플릿 데이터: ${stats.templateCount}개\n`;
      response += `- 총 데이터: ${stats.highQualityCount + stats.mediumQualityCount + stats.lowQualityCount + stats.templateCount}개\n\n`;
      
      response += `💡 **다음 단계**:\n`;
      response += `1. 수동으로 문제 데이터 입력\n`;
      response += `2. 웹 입력 인터페이스 활용\n`;
      response += `3. 크라우드소싱으로 데이터 수집\n`;
      
    } catch (error) {
      response += `❌ 오류 발생: ${error}\n`;
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
}

const server = new TreeDoctorPDFQAServer();
server.run().catch(console.error);