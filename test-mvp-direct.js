import { DatabaseManager } from "./dist/database.js";
import { ExamManager } from "./dist/exam-manager.js";
import { MVPIntegration } from "./dist/mvp-integration.js";

async function testMVP() {
  console.log("🌳 Tree Doctor PDF Q&A MCP - MVP Direct Test\n");

  const dbManager = new DatabaseManager();
  await dbManager.initialize();
  
  const examManager = new ExamManager(dbManager);
  await examManager.initialize();
  
  const mvpIntegration = new MVPIntegration(dbManager, examManager);
  await mvpIntegration.initialize();

  console.log("1️⃣ 샘플 데이터 임포트...");
  try {
    await mvpIntegration.importSampleData();
    console.log("✅ 샘플 데이터 임포트 성공!\n");
  } catch (error) {
    console.error("❌ 샘플 데이터 임포트 실패:", error, "\n");
  }

  console.log("2️⃣ MVP 상태 확인...");
  try {
    const stats = await mvpIntegration.getAvailableDataStats();
    console.log("📊 전체 데이터 현황:");
    console.log(`- 총 문제 수: ${stats.totalQuestions}개`);
    console.log(`- 고품질 데이터: ${stats.highQualityCount}개`);
    console.log(`- 템플릿 데이터: ${stats.templateCount}개\n`);
  } catch (error) {
    console.error("❌ 상태 확인 실패:", error, "\n");
  }

  console.log("3️⃣ 시험 구조 조회 (5회)...");
  const structure = await mvpIntegration.getTemplateStructure("5회");
  if (structure) {
    console.log(`📚 5회 시험 구조:`);
    console.log(`총 문제 수: ${structure.totalQuestions}문제`);
    for (const [subject, info] of Object.entries(structure.subjects)) {
      console.log(`- ${subject}: ${info.range}`);
    }
    console.log("");
  }

  console.log("4️⃣ 데이터 검색 (수목병리학)...");
  try {
    const results = await mvpIntegration.searchPartialData("수목병리학", false);
    console.log(`🔍 검색 결과: ${results.length}개 발견`);
    if (results.length > 0) {
      const first = results[0];
      console.log(`첫 번째 결과: ${first.examYear} 문제 ${first.questionNumber} - ${first.subject}`);
      if (first.questionText) {
        console.log(`문제 내용: ${first.questionText.substring(0, 50)}...`);
      }
    }
    console.log("");
  } catch (error) {
    console.error("❌ 검색 실패:", error, "\n");
  }

  console.log("5️⃣ 기출문제 검색 (병원체)...");
  try {
    const examResults = await examManager.searchExamQuestions("병원체", {}, 5);
    console.log(`📖 기출문제 검색 결과: ${examResults.length}개`);
    if (examResults.length > 0) {
      const q = examResults[0].question;
      console.log(`첫 번째 문제: [${q.examYear}년 ${q.examRound}회 문제 ${q.questionNumber}]`);
      console.log(`문제: ${q.questionText}`);
      if (q.answer) {
        console.log(`정답: ${q.answer.correctAnswer}`);
      }
    }
  } catch (error) {
    console.error("❌ 기출문제 검색 실패:", error);
  }

  await dbManager.close();
  console.log("\n✅ 테스트 완료!");
}

testMVP().catch(console.error);