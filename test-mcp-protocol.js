#!/usr/bin/env node

import { spawn } from 'child_process';
import { promises as fs } from 'fs';

// Direct MCP protocol test - sends raw JSON-RPC messages
async function testMCPProtocol() {
  console.log('🧪 Direct MCP Protocol Test\n');
  
  // Build the server first
  console.log('Building server...');
  const buildProcess = spawn('npm', ['run', 'build'], { stdio: 'inherit' });
  await new Promise((resolve) => buildProcess.on('close', resolve));
  
  // Start the server
  console.log('\nStarting MCP server...');
  const server = spawn('node', ['dist/index.js'], {
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  let responseBuffer = '';
  let responses = [];
  
  // Capture server output
  server.stdout.on('data', (data) => {
    responseBuffer += data.toString();
    
    // Try to parse complete JSON responses
    const lines = responseBuffer.split('\n');
    for (let i = 0; i < lines.length - 1; i++) {
      const line = lines[i].trim();
      if (line) {
        try {
          const parsed = JSON.parse(line);
          responses.push(parsed);
          console.log('\n✅ Received response:', JSON.stringify(parsed, null, 2));
        } catch (e) {
          console.log('⚠️  Non-JSON output:', line);
        }
      }
    }
    responseBuffer = lines[lines.length - 1];
  });
  
  server.stderr.on('data', (data) => {
    console.error('Server error:', data.toString());
  });
  
  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test 1: List tools
  console.log('\n📤 Test 1: Sending tools/list request...');
  const listToolsRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list',
    params: {}
  };
  server.stdin.write(JSON.stringify(listToolsRequest) + '\n');
  
  // Wait for response
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test 2: Call get_textbook_stats
  console.log('\n📤 Test 2: Calling get_textbook_stats...');
  const getStatsRequest = {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: {
      name: 'get_textbook_stats',
      arguments: {}
    }
  };
  server.stdin.write(JSON.stringify(getStatsRequest) + '\n');
  
  // Wait for response
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test 3: Korean text handling
  console.log('\n📤 Test 3: Testing Korean text with search_textbooks...');
  const koreanSearchRequest = {
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'search_textbooks',
      arguments: {
        query: '나무의사 자격증',
        maxResults: 3
      }
    }
  };
  server.stdin.write(JSON.stringify(koreanSearchRequest) + '\n');
  
  // Wait for response
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test 4: Error handling - invalid tool
  console.log('\n📤 Test 4: Testing error handling with invalid tool...');
  const invalidToolRequest = {
    jsonrpc: '2.0',
    id: 4,
    method: 'tools/call',
    params: {
      name: 'non_existent_tool',
      arguments: {}
    }
  };
  server.stdin.write(JSON.stringify(invalidToolRequest) + '\n');
  
  // Wait for response
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test 5: Schema validation - missing required parameter
  console.log('\n📤 Test 5: Testing schema validation...');
  const invalidParamsRequest = {
    jsonrpc: '2.0',
    id: 5,
    method: 'tools/call',
    params: {
      name: 'search_textbooks',
      arguments: {
        // Missing required 'query' parameter
        maxResults: 5
      }
    }
  };
  server.stdin.write(JSON.stringify(invalidParamsRequest) + '\n');
  
  // Wait for final responses
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary:');
  console.log(`Total responses received: ${responses.length}`);
  console.log(`Successful responses: ${responses.filter(r => r.result).length}`);
  console.log(`Error responses: ${responses.filter(r => r.error).length}`);
  
  // Validate responses
  let allTestsPassed = true;
  
  // Check tools/list response
  const toolsListResponse = responses.find(r => r.id === 1);
  if (toolsListResponse && toolsListResponse.result && toolsListResponse.result.tools) {
    console.log(`\n✅ tools/list returned ${toolsListResponse.result.tools.length} tools`);
  } else {
    console.log('\n❌ tools/list response invalid');
    allTestsPassed = false;
  }
  
  // Check other responses
  for (let i = 2; i <= 5; i++) {
    const response = responses.find(r => r.id === i);
    if (response) {
      if (i <= 3 && response.result) {
        console.log(`✅ Test ${i} passed`);
      } else if (i > 3 && response.result && response.result.content) {
        // Error tests should return error messages in content
        console.log(`✅ Test ${i} handled error correctly`);
      } else {
        console.log(`❌ Test ${i} failed`);
        allTestsPassed = false;
      }
    } else {
      console.log(`❌ No response for test ${i}`);
      allTestsPassed = false;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  if (allTestsPassed) {
    console.log('🎉 All MCP protocol tests PASSED!');
    console.log('✅ The server is correctly implementing the MCP protocol');
  } else {
    console.log('⚠️  Some tests failed - check the output above');
  }
  console.log('='.repeat(60));
  
  // Clean up
  server.kill();
  process.exit(allTestsPassed ? 0 : 1);
}

// Run the test
testMCPProtocol().catch(console.error);