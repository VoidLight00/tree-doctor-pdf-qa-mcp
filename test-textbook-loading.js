#!/usr/bin/env node

import { spawn } from 'child_process';
import { writeFileSync } from 'fs';
import path from 'path';

// MCP 서버 테스트를 위한 간단한 스크립트
const testCommands = [
  {
    name: "load_textbooks",
    arguments: {
      directoryPath: "/Users/voidlight/Downloads/나무의사책들"
    }
  },
  {
    name: "get_textbook_stats",
    arguments: {}
  },
  {
    name: "get_subjects",
    arguments: {}
  },
  {
    name: "search_textbooks",
    arguments: {
      query: "광합성",
      maxResults: 5
    }
  },
  {
    name: "search_textbooks",
    arguments: {
      query: "나무보호법",
      maxResults: 3
    }
  },
  {
    name: "get_textbooks",
    arguments: {
      subject: "수목생리학"
    }
  }
];

console.log('🧪 나무의사 교재 로딩 테스트를 시작합니다...\n');

async function runTest(command) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', ['dist/index.js'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: '/Users/voidlight/Documents/암흑물질/400-프로젝트/tree-doctor-pdf-qa-mcp'
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Process exited with code ${code}\n${stderr}`));
      }
    });

    // MCP 메시지 전송
    const message = {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name: command.name,
        arguments: command.arguments
      }
    };

    child.stdin.write(JSON.stringify(message) + '\n');
    child.stdin.end();
  });
}

// 순차적으로 테스트 실행
for (const [index, command] of testCommands.entries()) {
  console.log(`\n${index + 1}. ${command.name} 테스트 중...`);
  
  try {
    const result = await runTest(command);
    console.log(`✅ ${command.name} 성공`);
    console.log(`📊 결과: ${result.stdout.substring(0, 200)}...`);
  } catch (error) {
    console.log(`❌ ${command.name} 실패: ${error.message}`);
  }
  
  // 각 테스트 사이에 잠시 대기
  await new Promise(resolve => setTimeout(resolve, 2000));
}

console.log('\n🎉 모든 테스트가 완료되었습니다!');