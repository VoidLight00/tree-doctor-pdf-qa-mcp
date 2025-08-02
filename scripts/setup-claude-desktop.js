#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Claude Desktop 설정 파일 경로
const getClaudeConfigPath = () => {
  const platform = os.platform();
  const homeDir = os.homedir();
  
  switch (platform) {
    case 'darwin': // macOS
      return path.join(homeDir, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
    case 'win32': // Windows
      return path.join(homeDir, 'AppData', 'Roaming', 'Claude', 'claude_desktop_config.json');
    default: // Linux
      return path.join(homeDir, '.config', 'claude-desktop', 'claude_desktop_config.json');
  }
};

// MCP 설정 생성
const createMCPConfig = (projectPath) => {
  return {
    mcpServers: {
      "tree-doctor-pdf-qa-mcp": {
        command: "node",
        args: [path.join(projectPath, "dist", "index.js")],
        env: {
          "NODE_ENV": "production"
        }
      }
    }
  };
};

async function setupClaudeDesktop() {
  try {
    console.log('🌳 나무의사 PDF Q&A MCP 서버 설정을 시작합니다...\n');
    
    // 프로젝트 루트 경로
    const projectPath = path.resolve(__dirname, '..');
    console.log(`📁 프로젝트 경로: ${projectPath}`);
    
    // 빌드된 파일 확인
    const distPath = path.join(projectPath, 'dist', 'index.js');
    try {
      await fs.access(distPath);
      console.log('✅ 빌드된 파일 확인 완료');
    } catch (error) {
      console.log('❌ 빌드된 파일을 찾을 수 없습니다. 먼저 빌드를 실행하세요:');
      console.log('   npm run build');
      process.exit(1);
    }
    
    // Claude Desktop 설정 파일 경로
    const configPath = getClaudeConfigPath();
    console.log(`📄 Claude Desktop 설정 파일: ${configPath}`);
    
    // 설정 디렉토리 생성
    const configDir = path.dirname(configPath);
    try {
      await fs.mkdir(configDir, { recursive: true });
      console.log('✅ 설정 디렉토리 생성 완료');
    } catch (error) {
      console.log('⚠️  설정 디렉토리 생성 실패 (이미 존재할 수 있음)');
    }
    
    // 기존 설정 파일 읽기
    let existingConfig = {};
    try {
      const existingConfigData = await fs.readFile(configPath, 'utf8');
      existingConfig = JSON.parse(existingConfigData);
      console.log('📖 기존 설정 파일 읽기 완료');
    } catch (error) {
      console.log('📝 새로운 설정 파일을 생성합니다');
    }
    
    // MCP 설정 통합
    const newConfig = createMCPConfig(projectPath);
    const mergedConfig = {
      ...existingConfig,
      mcpServers: {
        ...existingConfig.mcpServers,
        ...newConfig.mcpServers
      }
    };
    
    // 설정 파일 저장
    await fs.writeFile(configPath, JSON.stringify(mergedConfig, null, 2));
    console.log('✅ Claude Desktop 설정 파일 업데이트 완료');
    
    // 성공 메시지
    console.log('\n🎉 설정이 완료되었습니다!');
    console.log('\n📋 다음 단계:');
    console.log('1. Claude Desktop을 재시작하세요');
    console.log('2. 새로운 대화에서 다음과 같이 테스트해보세요:');
    console.log('   💬 "나무보호법 제1조에 대해 알려주세요"');
    console.log('   💬 "느티나무 잎에 갈색 반점이 생겼어요. 진단해주세요"');
    console.log('   💬 "수목병리학 모의고사 10문제 만들어주세요"');
    
    console.log('\n🛠️  사용 가능한 MCP 도구:');
    console.log('   - search_pdf: PDF 교재에서 질문에 대한 답변 검색');
    console.log('   - find_source: 기출문제에 대한 교재 근거 찾기');
    console.log('   - generate_explanation: 기출문제 해설 생성');
    console.log('   - extract_concepts: 텍스트에서 중요 개념 추출');
    console.log('   - create_bookmark: 북마크 생성');
    console.log('   - get_bookmarks: 북마크 조회');
    console.log('   - create_flashcard: 암기카드 생성');
    console.log('   - get_study_materials: 학습 자료 조회');
    
  } catch (error) {
    console.error('❌ 설정 중 오류가 발생했습니다:', error.message);
    process.exit(1);
  }
}

// 스크립트 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  setupClaudeDesktop();
}