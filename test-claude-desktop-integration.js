#!/usr/bin/env node

import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

class ClaudeDesktopIntegrationTest {
  constructor() {
    this.testResults = [];
  }

  log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
  }

  logSection(title) {
    console.log('\n' + '='.repeat(60));
    this.log(`🔧 ${title}`, colors.cyan);
    console.log('='.repeat(60) + '\n');
  }

  logTest(testName, status, details = '') {
    const statusIcon = status === 'PASS' ? '✅' : '❌';
    const statusColor = status === 'PASS' ? colors.green : colors.red;
    
    this.log(`${statusIcon} ${testName}: ${statusColor}${status}${colors.reset}`);
    if (details) {
      this.log(`   ${details}`, colors.gray);
    }
    
    this.testResults.push({ test: testName, status, details });
  }

  async checkClaudeDesktopConfig() {
    this.logSection('Checking Claude Desktop Configuration');
    
    const platform = os.platform();
    let configPath;
    
    if (platform === 'darwin') {
      configPath = path.join(os.homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
    } else if (platform === 'win32') {
      configPath = path.join(process.env.APPDATA || '', 'Claude', 'claude_desktop_config.json');
    } else {
      configPath = path.join(os.homedir(), '.config', 'claude', 'claude_desktop_config.json');
    }
    
    this.log(`Platform: ${platform}`, colors.blue);
    this.log(`Config path: ${configPath}`, colors.blue);
    
    try {
      const configContent = await fs.readFile(configPath, 'utf8');
      const config = JSON.parse(configContent);
      
      this.logTest('Claude Desktop config file exists', 'PASS');
      
      // Check if MCP servers section exists
      if (config.mcpServers) {
        this.logTest('MCP servers section exists', 'PASS');
        
        // Check if tree-doctor-pdf-qa-mcp is configured
        if (config.mcpServers['tree-doctor-pdf-qa-mcp']) {
          this.logTest('tree-doctor-pdf-qa-mcp server configured', 'PASS');
          
          const serverConfig = config.mcpServers['tree-doctor-pdf-qa-mcp'];
          
          // Validate server configuration
          if (serverConfig.command === 'node') {
            this.logTest('Command is set to "node"', 'PASS');
          } else {
            this.logTest('Command validation', 'FAIL', `Expected "node", got "${serverConfig.command}"`);
          }
          
          if (serverConfig.args && serverConfig.args.length > 0) {
            const scriptPath = serverConfig.args[0];
            this.logTest('Script path configured', 'PASS', scriptPath);
            
            // Check if the path exists
            try {
              await fs.access(scriptPath);
              this.logTest('Script file exists', 'PASS');
            } catch {
              this.logTest('Script file exists', 'FAIL', 'File not found');
            }
          } else {
            this.logTest('Script path validation', 'FAIL', 'No args configured');
          }
          
          // Check environment variables
          if (serverConfig.env) {
            this.logTest('Environment variables configured', 'PASS');
            
            if (serverConfig.env.NODE_ENV) {
              this.log(`  NODE_ENV: ${serverConfig.env.NODE_ENV}`, colors.gray);
            }
            if (serverConfig.env.DATA_DIR) {
              this.log(`  DATA_DIR: ${serverConfig.env.DATA_DIR}`, colors.gray);
              
              // Check if data directory exists
              try {
                await fs.access(serverConfig.env.DATA_DIR);
                this.logTest('Data directory exists', 'PASS');
              } catch {
                this.logTest('Data directory exists', 'FAIL', 'Directory not found');
              }
            }
          }
          
          // Display full configuration
          this.log('\nFull server configuration:', colors.blue);
          console.log(JSON.stringify(serverConfig, null, 2));
          
        } else {
          this.logTest('tree-doctor-pdf-qa-mcp server configured', 'FAIL', 'Not found in config');
          
          this.log('\nAvailable MCP servers:', colors.yellow);
          Object.keys(config.mcpServers).forEach(server => {
            this.log(`  - ${server}`, colors.gray);
          });
        }
      } else {
        this.logTest('MCP servers section exists', 'FAIL', 'mcpServers section not found');
      }
      
    } catch (error) {
      if (error.code === 'ENOENT') {
        this.logTest('Claude Desktop config file exists', 'FAIL', 'File not found');
        this.log('\nTo set up the integration, create the config file with:', colors.yellow);
        this.log(`${configPath}`, colors.blue);
      } else {
        this.logTest('Config file parsing', 'FAIL', error.message);
      }
    }
  }

  async checkProjectStructure() {
    this.logSection('Checking Project Structure');
    
    const projectRoot = process.cwd();
    const requiredFiles = [
      'package.json',
      'tsconfig.json',
      'src/index.ts',
      'dist/index.js',
      'data/tree-doctor.db'
    ];
    
    for (const file of requiredFiles) {
      const filePath = path.join(projectRoot, file);
      try {
        await fs.access(filePath);
        this.logTest(`${file} exists`, 'PASS');
        
        // Check file size for database
        if (file === 'data/tree-doctor.db') {
          const stats = await fs.stat(filePath);
          const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
          this.log(`  Database size: ${sizeMB} MB`, colors.gray);
        }
      } catch {
        this.logTest(`${file} exists`, 'FAIL');
      }
    }
  }

  async validateMCPServerSetup() {
    this.logSection('Validating MCP Server Setup');
    
    // Check if the server can be started
    const { spawn } = await import('child_process');
    
    try {
      this.log('Testing server startup...', colors.yellow);
      
      const server = spawn('node', ['dist/index.js'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: process.cwd()
      });
      
      let serverReady = false;
      let errorOutput = '';
      
      server.stderr.on('data', (data) => {
        const output = data.toString();
        errorOutput += output;
        
        if (output.includes('나무의사 PDF Q&A MCP 서버가 시작되었습니다')) {
          serverReady = true;
        }
      });
      
      // Wait for server to start
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      if (serverReady) {
        this.logTest('Server starts successfully', 'PASS');
        this.log('  Server is ready to accept MCP connections', colors.gray);
      } else {
        this.logTest('Server starts successfully', 'FAIL', 'Server did not report ready state');
        if (errorOutput) {
          this.log(`  Error output: ${errorOutput}`, colors.red);
        }
      }
      
      // Clean up
      server.kill();
      
    } catch (error) {
      this.logTest('Server startup test', 'FAIL', error.message);
    }
  }

  async generateSetupInstructions() {
    this.logSection('Setup Instructions for Claude Desktop');
    
    const projectPath = process.cwd();
    const scriptPath = path.join(projectPath, 'dist', 'index.js');
    const dataPath = path.join(projectPath, 'data');
    
    const config = {
      "tree-doctor-pdf-qa-mcp": {
        "command": "node",
        "args": [scriptPath],
        "env": {
          "NODE_ENV": "production",
          "DATA_DIR": dataPath
        }
      }
    };
    
    this.log('Add this to your Claude Desktop configuration:', colors.yellow);
    this.log('\nIn the "mcpServers" section of claude_desktop_config.json:', colors.blue);
    console.log(JSON.stringify(config, null, 2));
    
    this.log('\nComplete example configuration:', colors.blue);
    const fullExample = {
      "mcpServers": {
        "tree-doctor-pdf-qa-mcp": config["tree-doctor-pdf-qa-mcp"]
      }
    };
    console.log(JSON.stringify(fullExample, null, 2));
  }

  async generateReport() {
    this.logSection('Integration Test Summary');
    
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(t => t.status === 'PASS').length;
    const failedTests = this.testResults.filter(t => t.status === 'FAIL').length;
    
    this.log(`Total Tests: ${totalTests}`, colors.blue);
    this.log(`Passed: ${passedTests} ✅`, colors.green);
    this.log(`Failed: ${failedTests} ❌`, colors.red);
    
    if (failedTests === 0) {
      this.log('\n🎉 Claude Desktop integration is fully configured!', colors.green);
      this.log('The MCP server is ready to use in Claude Desktop.', colors.green);
    } else {
      this.log('\n⚠️  Some configuration steps are needed', colors.yellow);
      this.log('Please follow the setup instructions above.', colors.yellow);
    }
    
    // Save integration report
    let report = `# Claude Desktop Integration Test Report\n\n`;
    report += `Generated: ${new Date().toISOString()}\n\n`;
    report += `## Summary\n\n`;
    report += `- Total Tests: ${totalTests}\n`;
    report += `- Passed: ${passedTests}\n`;
    report += `- Failed: ${failedTests}\n\n`;
    
    report += `## Test Results\n\n`;
    report += `| Test | Status | Details |\n`;
    report += `|------|--------|----------|\n`;
    
    for (const result of this.testResults) {
      const status = result.status === 'PASS' ? '✅ PASS' : '❌ FAIL';
      const details = result.details.replace(/\|/g, '\\|');
      report += `| ${result.test} | ${status} | ${details} |\n`;
    }
    
    const reportPath = path.join(process.cwd(), 'claude-desktop-integration-report.md');
    await fs.writeFile(reportPath, report);
    this.log(`\nIntegration report saved to: ${reportPath}`, colors.green);
  }

  async runAllTests() {
    try {
      await this.checkProjectStructure();
      await this.checkClaudeDesktopConfig();
      await this.validateMCPServerSetup();
      await this.generateSetupInstructions();
      await this.generateReport();
    } catch (error) {
      this.log(`\nUnexpected error: ${error.message}`, colors.red);
      console.error(error);
    }
  }
}

// Run the tests
const tester = new ClaudeDesktopIntegrationTest();
tester.runAllTests().catch(console.error);