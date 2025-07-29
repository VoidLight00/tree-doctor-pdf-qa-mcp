const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');

const ajv = new Ajv();

// JSON Schema for question validation
const questionSchema = {
  type: "object",
  required: ["id", "year", "round", "subject", "questionNumber", "question", "options", "answer", "contributor", "source"],
  properties: {
    id: { type: "string", pattern: "^\\d{4}-\\d+-\\d{3}$" },
    year: { type: "integer", minimum: 2020, maximum: 2030 },
    round: { type: "integer", minimum: 1, maximum: 10 },
    subject: { 
      type: "string", 
      enum: ["수목생리학", "수목병리학", "수목해충학", "수목관리학", "나무보호법"] 
    },
    questionNumber: { type: "integer", minimum: 1, maximum: 200 },
    question: { type: "string", minLength: 10 },
    options: {
      type: "array",
      items: { type: "string" },
      minItems: 4,
      maxItems: 4
    },
    answer: { type: "integer", minimum: 1, maximum: 4 },
    explanation: { type: ["string", "null"] },
    image: { type: ["string", "null"] },
    difficulty: { type: "string", enum: ["상", "중", "하"] },
    tags: {
      type: "array",
      items: { type: "string" }
    },
    contributor: { type: "string" },
    verifiedBy: {
      type: "array",
      items: { type: "string" }
    },
    source: { type: "string" }
  }
};

const validate = ajv.compile(questionSchema);

// Validate all JSON files
function validateAllFiles(dir) {
  let totalFiles = 0;
  let validFiles = 0;
  let errors = [];

  function processDirectory(currentDir) {
    const files = fs.readdirSync(currentDir);
    
    for (const file of files) {
      const filePath = path.join(currentDir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        processDirectory(filePath);
      } else if (file.endsWith('.json') && !file.startsWith('_')) {
        totalFiles++;
        
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          const data = JSON.parse(content);
          
          if (validate(data)) {
            validFiles++;
            console.log(`✅ ${filePath}`);
          } else {
            errors.push({
              file: filePath,
              errors: validate.errors
            });
            console.log(`❌ ${filePath}`);
            console.log(`   ${JSON.stringify(validate.errors, null, 2)}`);
          }
        } catch (e) {
          errors.push({
            file: filePath,
            errors: [{ message: e.message }]
          });
          console.log(`❌ ${filePath}: ${e.message}`);
        }
      }
    }
  }

  if (fs.existsSync('data')) {
    processDirectory('data');
  }

  console.log(`\n📊 검증 결과:`);
  console.log(`총 파일: ${totalFiles}`);
  console.log(`유효한 파일: ${validFiles}`);
  console.log(`오류 파일: ${errors.length}`);

  if (errors.length > 0) {
    console.log('\n❌ 오류 상세:');
    errors.forEach(({ file, errors }) => {
      console.log(`\n${file}:`);
      errors.forEach(err => {
        console.log(`  - ${err.message || JSON.stringify(err)}`);
      });
    });
    process.exit(1);
  }
}

// Run validation
validateAllFiles('.');
console.log('\n✅ 모든 파일이 유효합니다!');