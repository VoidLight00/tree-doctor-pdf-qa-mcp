#!/usr/bin/env node

import sqlite3 from 'sqlite3';
const db = new sqlite3.Database('./tree-doctor-pdf-qa.db');

db.all(`
  SELECT 
    exam_year,
    COUNT(DISTINCT q.id) as question_count,
    COUNT(DISTINCT c.id) as choice_count,
    COUNT(DISTINCT a.id) as answer_count,
    SUM(CASE WHEN q.subject = '미분류' THEN 1 ELSE 0 END) as unclassified
  FROM exam_questions q
  LEFT JOIN exam_choices c ON q.id = c.question_id
  LEFT JOIN exam_answers a ON q.id = a.question_id
  GROUP BY exam_year
  ORDER BY exam_year
`, (err, rows) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log('회차별 데이터 품질:');
  console.log('='.repeat(70));
  console.log('회차 | 문제수 | 선택지수 | 정답수 | 미분류');
  console.log('-'.repeat(70));
  rows.forEach(row => {
    console.log(`${row.exam_year}회   | ${row.question_count.toString().padEnd(6)} | ${row.choice_count.toString().padEnd(8)} | ${row.answer_count.toString().padEnd(6)} | ${row.unclassified}`);
  });
  console.log('='.repeat(70));
  db.close();
});