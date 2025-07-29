#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🌳 Tree Doctor PDF Q&A MCP - MVP Integration Test');
console.log('=================================================');

// MCP 서버 프로세스 시작
const serverPath = join(__dirname, 'dist', 'index.js');
const server = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'inherit']
});

// JSON-RPC 요청 보내기
function sendRequest(method, params) {
  const request = {
    jsonrpc: '2.0',
    id: Date.now(),
    method,
    params
  };
  
  server.stdin.write(JSON.stringify(request) + '\n');
}

// 응답 처리
let buffer = '';
server.stdout.on('data', (data) => {
  buffer += data.toString();
  const lines = buffer.split('\n');
  
  for (let i = 0; i < lines.length - 1; i++) {
    try {
      const response = JSON.parse(lines[i]);
      console.log('\n📥 Response:', JSON.stringify(response, null, 2));
      
      if (response.result && response.result.content) {
        console.log('\n📄 Content:', response.result.content[0].text);
      }
    } catch (e) {
      // 무시 - 완전하지 않은 JSON일 수 있음
    }
  }
  
  buffer = lines[lines.length - 1];
});

// 테스트 시퀀스
async function runTests() {
  console.log('\n1️⃣ MVP 상태 확인...');
  sendRequest('tools/call', {
    name: 'get_mvp_status',
    arguments: {}
  });
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('\n2️⃣ 시험 구조 조회 (5회)...');
  sendRequest('tools/call', {
    name: 'get_exam_structure',
    arguments: {
      examYear: '5회'
    }
  });
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('\n3️⃣ MVP 데이터 검색 (수목병리학)...');
  sendRequest('tools/call', {
    name: 'search_mvp_data',
    arguments: {
      query: '수목병리학',
      includeTemplates: false
    }
  });
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('\n4️⃣ MVP 데이터 초기화 (샘플 데이터만)...');
  sendRequest('tools/call', {
    name: 'initialize_mvp_data',
    arguments: {
      importSampleData: true,
      generateTemplates: false
    }
  });
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  console.log('\n5️⃣ 초기화 후 상태 재확인...');
  sendRequest('tools/call', {
    name: 'get_mvp_status',
    arguments: {}
  });
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('\n✅ 테스트 완료!');
  process.exit(0);
}

// 서버 시작 대기 후 테스트 실행
setTimeout(runTests, 1000);

// 에러 처리
server.on('error', (err) => {
  console.error('❌ Server error:', err);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\n👋 종료합니다...');
  server.kill();
  process.exit(0);
});