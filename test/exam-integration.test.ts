import { DatabaseManager } from "../src/database.js";
import { ExamManager } from "../src/exam-manager.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testExamIntegration() {
  console.log("🧪 기출문제 통합 테스트 시작...\n");

  const dbManager = new DatabaseManager();
  const examManager = new ExamManager(dbManager);

  try {
    // 1. 데이터베이스 초기화
    console.log("1️⃣ 데이터베이스 초기화");
    await dbManager.initialize();
    await examManager.initialize();
    console.log("✅ 데이터베이스 초기화 완료\n");

    // 2. 테스트 데이터 생성
    console.log("2️⃣ 테스트 데이터 생성");
    const testExamDir = path.join(__dirname, "test-exams");
    await fs.mkdir(testExamDir, { recursive: true });

    // 샘플 기출문제 마크다운 파일 생성
    const sampleExam = `# 2023년 1회 나무의사 기출문제

## 수목병리학

문제 1. 다음 중 수목의 주요 병원균에 대한 설명으로 옳은 것은?

① 바이러스는 세포벽을 가지고 있다
② 세균은 엽록체를 가지고 있다
③ 균류는 키틴질 세포벽을 가지고 있다
④ 파이토플라즈마는 세포벽이 있다
⑤ 선충은 단세포 생물이다

정답: ③
해설: 균류(진균)는 키틴질로 이루어진 세포벽을 가지고 있는 것이 특징입니다. 바이러스는 세포 구조가 없고, 세균은 펩티도글리칸 세포벽을 가지며, 파이토플라즈마는 세포벽이 없습니다.

문제 2. 소나무재선충병의 매개충은?

① 솔잎혹파리
② 솔수염하늘소
③ 솔껍질깍지벌레
④ 소나무좀
⑤ 솔나방

정답: ②
해설: 소나무재선충병은 솔수염하늘소와 북방수염하늘소가 매개하는 것으로 알려져 있습니다.

## 수목해충학

문제 3. 다음 중 천적을 이용한 생물학적 방제에 대한 설명으로 틀린 것은?

① 환경 친화적인 방제 방법이다
② 즉각적인 효과를 기대할 수 있다
③ 장기적으로 경제적일 수 있다
④ 생태계 균형 유지에 도움이 된다
⑤ 천적의 정착이 중요하다

정답: ②
해설: 생물학적 방제는 환경 친화적이고 장기적으로 효과적이지만, 화학적 방제에 비해 즉각적인 효과는 기대하기 어렵습니다.`;

    await fs.writeFile(path.join(testExamDir, "2023_1회_기출문제.md"), sampleExam);
    console.log("✅ 테스트 데이터 생성 완료\n");

    // 3. 기출문제 검색 테스트
    console.log("3️⃣ 기출문제 검색 테스트");
    const searchResults = await examManager.searchExamQuestions("병원균", { subject: "수목병리학" });
    console.log(`검색 결과: ${searchResults.length}개 문제 발견`);
    if (searchResults.length > 0) {
      console.log(`첫 번째 결과: ${searchResults[0].question.questionText.substring(0, 50)}...`);
    }
    console.log("✅ 검색 기능 테스트 완료\n");

    // 4. 연도별 문제 조회 테스트
    console.log("4️⃣ 연도별 문제 조회 테스트");
    const yearQuestions = await examManager.getExamByYear(2023, 1);
    console.log(`2023년 1회 문제: ${yearQuestions.length}개`);
    console.log("✅ 연도별 조회 테스트 완료\n");

    // 5. 모의고사 생성 테스트
    console.log("5️⃣ 모의고사 생성 테스트");
    const mockExam = await examManager.generateMockExam({
      subjects: ["수목병리학", "수목해충학"],
      questionCount: 5,
      difficulty: "mixed"
    });
    console.log(`모의고사 생성 완료: ${mockExam.questions.length}문제, 예상 시간: ${mockExam.estimatedTime}분`);
    console.log("✅ 모의고사 생성 테스트 완료\n");

    // 6. 통계 조회 테스트
    console.log("6️⃣ 통계 조회 테스트");
    const stats = await examManager.getExamStatistics();
    console.log(`총 문제 수: ${stats.totalQuestions}`);
    console.log(`과목별 분포:`, stats.bySubject);
    console.log("✅ 통계 조회 테스트 완료\n");

    // 7. 기존 시스템과의 연동 테스트
    console.log("7️⃣ 기존 시스템 연동 테스트");
    
    // 북마크 생성 테스트
    const bookmark = await dbManager.createBookmark(
      "소나무재선충병 매개충",
      "소나무재선충병은 솔수염하늘소와 북방수염하늘소가 매개한다.",
      "question",
      ["소나무재선충병", "매개충", "솔수염하늘소"]
    );
    console.log(`북마크 생성 완료: ID ${bookmark.id}`);

    // 플래시카드 생성 테스트
    const flashcard = await dbManager.createFlashcard(
      "균류의 세포벽 구성 성분은?",
      "키틴질",
      "수목병리학",
      ["균류", "세포벽"]
    );
    console.log(`플래시카드 생성 완료: ID ${flashcard.id}`);
    
    console.log("✅ 기존 시스템 연동 테스트 완료\n");

    // 테스트 데이터 정리
    await fs.rm(testExamDir, { recursive: true, force: true });
    
    console.log("🎉 모든 테스트 완료!");
    console.log("\n📊 테스트 결과 요약:");
    console.log("- 데이터베이스 초기화: ✅");
    console.log("- 기출문제 검색: ✅");
    console.log("- 연도별 조회: ✅");
    console.log("- 모의고사 생성: ✅");
    console.log("- 통계 조회: ✅");
    console.log("- 기존 시스템 연동: ✅");

  } catch (error) {
    console.error("❌ 테스트 실패:", error);
    process.exit(1);
  } finally {
    await dbManager.close();
  }
}

// 스크립트 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  testExamIntegration();
}