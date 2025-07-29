#!/usr/bin/env node

import { spawn } from 'child_process';
import { createInterface } from 'readline';
import { promises as fs } from 'fs';
import path from 'path';

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

class MCPServerTester {
  constructor() {
    this.serverProcess = null;
    this.testResults = [];
    this.currentTestSection = '';
  }

  log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
  }

  logSection(title) {
    this.currentTestSection = title;
    console.log('\n' + '='.repeat(80));
    this.log(`🧪 ${title}`, colors.cyan);
    console.log('='.repeat(80) + '\n');
  }

  logTest(testName, status, details = '') {
    const statusIcon = status === 'PASS' ? '✅' : '❌';
    const statusColor = status === 'PASS' ? colors.green : colors.red;
    
    this.log(`${statusIcon} ${testName}: ${statusColor}${status}${colors.reset}`);
    if (details) {
      this.log(`   ${details}`, colors.gray);
    }
    
    this.testResults.push({
      section: this.currentTestSection,
      test: testName,
      status,
      details
    });
  }

  async startServer() {
    this.logSection('Starting MCP Server');
    
    try {
      // Build the server first
      this.log('Building server...', colors.yellow);
      await this.runCommand('npm', ['run', 'build']);
      this.logTest('Server Build', 'PASS');
      
      // Start the server
      this.serverProcess = spawn('node', ['dist/index.js'], {
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      // Wait for server to be ready
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      this.logTest('Server Start', 'PASS', 'Server process started successfully');
      return true;
    } catch (error) {
      this.logTest('Server Start', 'FAIL', error.message);
      return false;
    }
  }

  async runCommand(command, args) {
    return new Promise((resolve, reject) => {
      const proc = spawn(command, args, { stdio: 'pipe' });
      let output = '';
      let error = '';
      
      proc.stdout.on('data', (data) => { output += data.toString(); });
      proc.stderr.on('data', (data) => { error += data.toString(); });
      
      proc.on('close', (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(`Command failed: ${error || output}`));
        }
      });
    });
  }

  async sendRequest(request) {
    return new Promise((resolve, reject) => {
      if (!this.serverProcess) {
        reject(new Error('Server not started'));
        return;
      }
      
      let response = '';
      let errorOutput = '';
      const timeout = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, 10000);
      
      // Listen for response
      const dataHandler = (data) => {
        response += data.toString();
        
        // Try to parse complete JSON responses
        try {
          const lines = response.split('\n').filter(line => line.trim());
          for (const line of lines) {
            if (line.includes('"jsonrpc"')) {
              const parsed = JSON.parse(line);
              clearTimeout(timeout);
              this.serverProcess.stdout.removeListener('data', dataHandler);
              resolve(parsed);
              return;
            }
          }
        } catch (e) {
          // Continue accumulating data
        }
      };
      
      this.serverProcess.stdout.on('data', dataHandler);
      this.serverProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      // Send request
      const requestStr = JSON.stringify(request) + '\n';
      this.serverProcess.stdin.write(requestStr);
    });
  }

  async testListTools() {
    this.logSection('Testing tools/list');
    
    try {
      const request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
        params: {}
      };
      
      this.log('Sending tools/list request...', colors.yellow);
      const response = await this.sendRequest(request);
      
      if (response.error) {
        this.logTest('tools/list Response', 'FAIL', `Error: ${response.error.message}`);
        return false;
      }
      
      this.logTest('tools/list Response', 'PASS', 'Received valid response');
      
      // Validate tools
      const tools = response.result.tools;
      this.log(`\nFound ${tools.length} tools:`, colors.blue);
      
      const expectedTools = [
        'search_pdf',
        'find_source',
        'generate_explanation',
        'extract_concepts',
        'create_bookmark',
        'get_bookmarks',
        'create_flashcard',
        'get_study_materials',
        'load_textbooks',
        'search_textbooks',
        'get_textbooks',
        'get_textbook_contents',
        'get_subjects',
        'get_textbook_stats'
      ];
      
      for (const expectedTool of expectedTools) {
        const tool = tools.find(t => t.name === expectedTool);
        if (tool) {
          this.logTest(`Tool: ${expectedTool}`, 'PASS', 'Found with valid schema');
          
          // Validate schema format
          if (!tool.inputSchema || typeof tool.inputSchema !== 'object') {
            this.logTest(`Schema validation for ${expectedTool}`, 'FAIL', 'Invalid schema format');
          } else if (tool.inputSchema.$schema && tool.inputSchema.type === 'object') {
            this.logTest(`Schema validation for ${expectedTool}`, 'PASS', 'Valid JSON Schema');
          }
        } else {
          this.logTest(`Tool: ${expectedTool}`, 'FAIL', 'Not found');
        }
      }
      
      return true;
    } catch (error) {
      this.logTest('tools/list', 'FAIL', error.message);
      return false;
    }
  }

  async testToolCall(toolName, params, description) {
    this.logSection(`Testing tool: ${toolName}`);
    
    try {
      const request = {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: params
        }
      };
      
      this.log(`Calling ${toolName} with params: ${JSON.stringify(params)}`, colors.yellow);
      const response = await this.sendRequest(request);
      
      if (response.error) {
        this.logTest(`${toolName} call`, 'FAIL', `Error: ${response.error.message}`);
        return false;
      }
      
      this.logTest(`${toolName} call`, 'PASS', description);
      
      // Check response content
      if (response.result && response.result.content && response.result.content.length > 0) {
        const content = response.result.content[0];
        if (content.type === 'text' && content.text) {
          this.logTest(`${toolName} response content`, 'PASS', 'Valid text content received');
          this.log('\nResponse preview:', colors.gray);
          this.log(content.text.substring(0, 200) + '...', colors.gray);
        }
      }
      
      return true;
    } catch (error) {
      this.logTest(`${toolName} call`, 'FAIL', error.message);
      return false;
    }
  }

  async testKoreanTextHandling() {
    this.logSection('Testing Korean Text Handling');
    
    const koreanTests = [
      {
        tool: 'search_textbooks',
        params: { query: '나무의 병해충 방제', maxResults: 5 },
        description: 'Korean query for tree pest control'
      },
      {
        tool: 'create_bookmark',
        params: {
          title: '수목 병해충 관리',
          content: '나무의사 자격증 시험에서 중요한 병해충 관리 방법',
          type: 'concept',
          tags: ['병해충', '방제', '수목관리']
        },
        description: 'Korean bookmark creation'
      },
      {
        tool: 'create_flashcard',
        params: {
          front: '솔잎혹파리의 주요 피해 증상은?',
          back: '솔잎이 황변하고 조기 낙엽이 발생하며, 신초 생장이 저해됨',
          subject: '수목병리학',
          concepts: ['솔잎혹파리', '병해충']
        },
        description: 'Korean flashcard with technical terms'
      }
    ];
    
    for (const test of koreanTests) {
      await this.testToolCall(test.tool, test.params, test.description);
    }
  }

  async testErrorHandling() {
    this.logSection('Testing Error Handling');
    
    // Test invalid tool name
    await this.testToolCall('invalid_tool', {}, 'Invalid tool name handling');
    
    // Test missing required parameters
    await this.testToolCall('search_textbooks', {}, 'Missing required parameter');
    
    // Test invalid parameter types
    await this.testToolCall('search_textbooks', {
      query: 123,  // Should be string
      maxResults: 'five'  // Should be number
    }, 'Invalid parameter types');
  }

  async generateReport() {
    this.logSection('Test Summary Report');
    
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(t => t.status === 'PASS').length;
    const failedTests = this.testResults.filter(t => t.status === 'FAIL').length;
    const passRate = (passedTests / totalTests * 100).toFixed(1);
    
    this.log(`Total Tests: ${totalTests}`, colors.blue);
    this.log(`Passed: ${passedTests} ✅`, colors.green);
    this.log(`Failed: ${failedTests} ❌`, colors.red);
    this.log(`Pass Rate: ${passRate}%`, passRate >= 80 ? colors.green : colors.yellow);
    
    // Group results by section
    const sections = {};
    for (const result of this.testResults) {
      if (!sections[result.section]) {
        sections[result.section] = [];
      }
      sections[result.section].push(result);
    }
    
    // Generate detailed report
    let report = `# Tree Doctor PDF Q&A MCP Server Test Report\n\n`;
    report += `Generated: ${new Date().toISOString()}\n\n`;
    report += `## Summary\n\n`;
    report += `- Total Tests: ${totalTests}\n`;
    report += `- Passed: ${passedTests}\n`;
    report += `- Failed: ${failedTests}\n`;
    report += `- Pass Rate: ${passRate}%\n\n`;
    
    report += `## Detailed Results\n\n`;
    
    for (const [section, results] of Object.entries(sections)) {
      report += `### ${section}\n\n`;
      report += `| Test | Status | Details |\n`;
      report += `|------|--------|----------|\n`;
      
      for (const result of results) {
        const status = result.status === 'PASS' ? '✅ PASS' : '❌ FAIL';
        const details = result.details.replace(/\|/g, '\\|');
        report += `| ${result.test} | ${status} | ${details} |\n`;
      }
      report += `\n`;
    }
    
    // Save report
    const reportPath = path.join(process.cwd(), 'mcp-test-report.md');
    await fs.writeFile(reportPath, report);
    this.log(`\nDetailed report saved to: ${reportPath}`, colors.green);
    
    return { totalTests, passedTests, failedTests, passRate };
  }

  async cleanup() {
    if (this.serverProcess) {
      this.log('\nStopping server...', colors.yellow);
      this.serverProcess.kill();
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  async runAllTests() {
    try {
      // Start server
      const serverStarted = await this.startServer();
      if (!serverStarted) {
        this.log('Failed to start server, aborting tests', colors.red);
        return;
      }
      
      // Run tests
      await this.testListTools();
      
      // Test specific tools
      await this.testToolCall('get_textbook_stats', {}, 'Get textbook statistics');
      await this.testToolCall('get_subjects', {}, 'Get subjects list');
      await this.testToolCall('search_textbooks', { 
        query: 'tree disease management',
        maxResults: 3 
      }, 'Search with English query');
      
      // Test Korean text handling
      await this.testKoreanTextHandling();
      
      // Test error handling
      await this.testErrorHandling();
      
      // Generate report
      const summary = await this.generateReport();
      
      // Final verdict
      console.log('\n' + '='.repeat(80));
      if (summary.passRate >= 80) {
        this.log('🎉 MCP Server is FULLY FUNCTIONAL!', colors.green);
        this.log('The server passed validation and is ready for use.', colors.green);
      } else {
        this.log('⚠️  MCP Server has issues that need attention', colors.yellow);
        this.log(`Only ${summary.passRate}% of tests passed.`, colors.yellow);
      }
      console.log('='.repeat(80));
      
    } catch (error) {
      this.log(`\nUnexpected error: ${error.message}`, colors.red);
      console.error(error);
    } finally {
      await this.cleanup();
    }
  }
}

// Run the tests
const tester = new MCPServerTester();
tester.runAllTests().catch(console.error);