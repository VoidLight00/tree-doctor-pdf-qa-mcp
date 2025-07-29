# Tree Doctor PDF Q&A MCP Server Test Report

Generated: 2025-07-23T14:44:19.075Z

## Summary

- Total Tests: 49
- Passed: 49
- Failed: 0
- Pass Rate: 100.0%

## Detailed Results

### Starting MCP Server

| Test | Status | Details |
|------|--------|----------|
| Server Build | ✅ PASS |  |
| Server Start | ✅ PASS | Server process started successfully |

### Testing tools/list

| Test | Status | Details |
|------|--------|----------|
| tools/list Response | ✅ PASS | Received valid response |
| Tool: search_pdf | ✅ PASS | Found with valid schema |
| Schema validation for search_pdf | ✅ PASS | Valid JSON Schema |
| Tool: find_source | ✅ PASS | Found with valid schema |
| Schema validation for find_source | ✅ PASS | Valid JSON Schema |
| Tool: generate_explanation | ✅ PASS | Found with valid schema |
| Schema validation for generate_explanation | ✅ PASS | Valid JSON Schema |
| Tool: extract_concepts | ✅ PASS | Found with valid schema |
| Schema validation for extract_concepts | ✅ PASS | Valid JSON Schema |
| Tool: create_bookmark | ✅ PASS | Found with valid schema |
| Schema validation for create_bookmark | ✅ PASS | Valid JSON Schema |
| Tool: get_bookmarks | ✅ PASS | Found with valid schema |
| Schema validation for get_bookmarks | ✅ PASS | Valid JSON Schema |
| Tool: create_flashcard | ✅ PASS | Found with valid schema |
| Schema validation for create_flashcard | ✅ PASS | Valid JSON Schema |
| Tool: get_study_materials | ✅ PASS | Found with valid schema |
| Schema validation for get_study_materials | ✅ PASS | Valid JSON Schema |
| Tool: load_textbooks | ✅ PASS | Found with valid schema |
| Schema validation for load_textbooks | ✅ PASS | Valid JSON Schema |
| Tool: search_textbooks | ✅ PASS | Found with valid schema |
| Schema validation for search_textbooks | ✅ PASS | Valid JSON Schema |
| Tool: get_textbooks | ✅ PASS | Found with valid schema |
| Schema validation for get_textbooks | ✅ PASS | Valid JSON Schema |
| Tool: get_textbook_contents | ✅ PASS | Found with valid schema |
| Schema validation for get_textbook_contents | ✅ PASS | Valid JSON Schema |
| Tool: get_subjects | ✅ PASS | Found with valid schema |
| Schema validation for get_subjects | ✅ PASS | Valid JSON Schema |
| Tool: get_textbook_stats | ✅ PASS | Found with valid schema |
| Schema validation for get_textbook_stats | ✅ PASS | Valid JSON Schema |

### Testing tool: get_textbook_stats

| Test | Status | Details |
|------|--------|----------|
| get_textbook_stats call | ✅ PASS | Get textbook statistics |
| get_textbook_stats response content | ✅ PASS | Valid text content received |

### Testing tool: get_subjects

| Test | Status | Details |
|------|--------|----------|
| get_subjects call | ✅ PASS | Get subjects list |
| get_subjects response content | ✅ PASS | Valid text content received |

### Testing tool: search_textbooks

| Test | Status | Details |
|------|--------|----------|
| search_textbooks call | ✅ PASS | Search with English query |
| search_textbooks response content | ✅ PASS | Valid text content received |
| search_textbooks call | ✅ PASS | Korean query for tree pest control |
| search_textbooks response content | ✅ PASS | Valid text content received |
| search_textbooks call | ✅ PASS | Missing required parameter |
| search_textbooks response content | ✅ PASS | Valid text content received |
| search_textbooks call | ✅ PASS | Invalid parameter types |
| search_textbooks response content | ✅ PASS | Valid text content received |

### Testing tool: create_bookmark

| Test | Status | Details |
|------|--------|----------|
| create_bookmark call | ✅ PASS | Korean bookmark creation |
| create_bookmark response content | ✅ PASS | Valid text content received |

### Testing tool: create_flashcard

| Test | Status | Details |
|------|--------|----------|
| create_flashcard call | ✅ PASS | Korean flashcard with technical terms |
| create_flashcard response content | ✅ PASS | Valid text content received |

### Testing tool: invalid_tool

| Test | Status | Details |
|------|--------|----------|
| invalid_tool call | ✅ PASS | Invalid tool name handling |
| invalid_tool response content | ✅ PASS | Valid text content received |

