#!/usr/bin/env node

console.log("🌳 나무의사 PDF Q&A MCP 서버 테스트 시작");
console.log("=".repeat(50));

// Import the server but don't start it
import('./dist/index.js').then(() => {
  console.log("✅ MCP 서버 모듈 로드 성공");
  console.log("📌 Claude Desktop을 재시작하면 사용할 수 있습니다.");
  console.log("=".repeat(50));
  process.exit(0);
}).catch(err => {
  console.error("❌ MCP 서버 로드 실패:", err.message);
  process.exit(1);
});