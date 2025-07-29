-- 기출문제 관련 테이블 스키마
-- Tree Doctor PDF Q&A MCP 시스템 확장

-- 기출문제 테이블
CREATE TABLE IF NOT EXISTS exam_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_year INTEGER NOT NULL,                -- 시험 연도
    exam_round INTEGER NOT NULL,               -- 시험 회차
    question_number INTEGER NOT NULL,          -- 문제 번호
    subject TEXT NOT NULL,                     -- 과목명
    question_text TEXT NOT NULL,               -- 문제 내용
    question_type TEXT NOT NULL CHECK(question_type IN ('multiple_choice', 'essay', 'short_answer')),
    difficulty_level INTEGER CHECK(difficulty_level BETWEEN 1 AND 5),
    points INTEGER DEFAULT 1,                  -- 배점
    image_path TEXT,                          -- 문제 이미지 경로 (있는 경우)
    is_incomplete BOOLEAN DEFAULT 0,          -- OCR 오류 등으로 불완전한 데이터 표시
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(exam_year, exam_round, question_number)
);

-- 객관식 선택지 테이블
CREATE TABLE IF NOT EXISTS exam_choices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id INTEGER NOT NULL,
    choice_number INTEGER NOT NULL,           -- 선택지 번호 (1, 2, 3, 4, 5)
    choice_text TEXT NOT NULL,                -- 선택지 내용
    is_correct BOOLEAN DEFAULT 0,             -- 정답 여부
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES exam_questions(id) ON DELETE CASCADE,
    UNIQUE(question_id, choice_number)
);

-- 정답 및 해설 테이블
CREATE TABLE IF NOT EXISTS exam_answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id INTEGER NOT NULL UNIQUE,
    correct_answer TEXT NOT NULL,             -- 정답 (객관식의 경우 번호, 주관식의 경우 텍스트)
    explanation TEXT,                         -- 해설
    textbook_reference TEXT,                  -- 교재 참조 정보
    page_references TEXT,                     -- 페이지 참조 (JSON 형식)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES exam_questions(id) ON DELETE CASCADE
);

-- 문제별 키워드 테이블
CREATE TABLE IF NOT EXISTS exam_keywords (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id INTEGER NOT NULL,
    keyword TEXT NOT NULL,
    importance INTEGER DEFAULT 1,             -- 키워드 중요도 (1-5)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES exam_questions(id) ON DELETE CASCADE,
    UNIQUE(question_id, keyword)
);

-- 문제와 교재 내용 연결 테이블
CREATE TABLE IF NOT EXISTS exam_textbook_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id INTEGER NOT NULL,
    textbook_id INTEGER,
    textbook_content_id INTEGER,
    relevance_score REAL DEFAULT 0.0,         -- 관련성 점수 (0.0-1.0)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES exam_questions(id) ON DELETE CASCADE
);

-- 유사 문제 연결 테이블
CREATE TABLE IF NOT EXISTS exam_similar_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id_1 INTEGER NOT NULL,
    question_id_2 INTEGER NOT NULL,
    similarity_score REAL NOT NULL,           -- 유사도 점수 (0.0-1.0)
    similarity_type TEXT,                     -- 유사성 타입 (concept, pattern, topic)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id_1) REFERENCES exam_questions(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id_2) REFERENCES exam_questions(id) ON DELETE CASCADE,
    CHECK (question_id_1 < question_id_2),    -- 중복 방지
    UNIQUE(question_id_1, question_id_2)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_exam_year_round ON exam_questions(exam_year, exam_round);
CREATE INDEX IF NOT EXISTS idx_exam_subject ON exam_questions(subject);
CREATE INDEX IF NOT EXISTS idx_exam_question_text ON exam_questions(question_text);
CREATE INDEX IF NOT EXISTS idx_exam_keywords ON exam_keywords(keyword);
CREATE INDEX IF NOT EXISTS idx_exam_similarity ON exam_similar_questions(similarity_score);
CREATE INDEX IF NOT EXISTS idx_exam_textbook_links ON exam_textbook_links(question_id, relevance_score);

-- 뷰 생성: 문제와 정답 통합 뷰
CREATE VIEW IF NOT EXISTS exam_questions_with_answers AS
SELECT 
    q.id,
    q.exam_year,
    q.exam_round,
    q.question_number,
    q.subject,
    q.question_text,
    q.question_type,
    q.difficulty_level,
    q.points,
    a.correct_answer,
    a.explanation,
    a.textbook_reference,
    a.page_references,
    q.is_incomplete,
    q.created_at
FROM exam_questions q
LEFT JOIN exam_answers a ON q.id = a.question_id;

-- 뷰 생성: 과목별 문제 통계
CREATE VIEW IF NOT EXISTS exam_subject_stats AS
SELECT 
    subject,
    COUNT(*) as total_questions,
    COUNT(DISTINCT exam_year) as years_covered,
    COUNT(DISTINCT exam_round) as total_rounds,
    AVG(difficulty_level) as avg_difficulty,
    SUM(CASE WHEN question_type = 'multiple_choice' THEN 1 ELSE 0 END) as multiple_choice_count,
    SUM(CASE WHEN question_type = 'essay' THEN 1 ELSE 0 END) as essay_count,
    SUM(CASE WHEN question_type = 'short_answer' THEN 1 ELSE 0 END) as short_answer_count
FROM exam_questions
GROUP BY subject;