# Testing Setup Guide for AnythingLLM B2B Enhancement

## Current Situation
AnythingLLM has 9 existing test files but no test runner configured in package.json. The test files use Jest syntax but Jest is not installed.

## Quick Setup (5 minutes)

### 1. Install Jest Testing Framework
```bash
cd server
npm install --save-dev jest @types/jest
```

### 2. Add Test Scripts to package.json
```bash
# Add test scripts to server/package.json
npm pkg set scripts.test="jest"
npm pkg set scripts.test:watch="jest --watch"
npm pkg set scripts.test:coverage="jest --coverage"
```

### 3. Create Jest Configuration
Create `server/jest.config.js`:
```javascript
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'utils/**/*.js',
    'models/**/*.js', 
    'endpoints/**/*.js'
  ],
  coveragePathIgnorePatterns: [
    'node_modules/',
    'storage/',
    'prisma/',
    'swagger/'
  ]
};
```

### 4. Verify Setup Works
```bash
# Run existing tests
npm test

# Expected: 9 test suites should run
# - safeJSONStringify.test.js
# - openaiHelpers.test.js  
# - openaiCompatible.test.js
# - executor.test.js
# - index.test.js (TextSplitter)
# - connectionParser.test.js
# - BaseConnector.test.js
# - WebsiteConnector.test.js
# - youtube-transcript.test.js (collector)
```

## Testing Strategy for Phase 1.1

### Foundation Testing (Before Enhancement)
1. **Run existing tests**: Ensure AnythingLLM baseline works
2. **Manual API testing**: Use curl/Postman for endpoints
3. **Database verification**: Check schema and connections

### Development Testing (During Enhancement)  
1. **TDD approach**: Write tests before implementing features
2. **Integration testing**: Test enhanced features don't break existing
3. **Performance monitoring**: Check response times stay under targets

### Available Test Files
```
server/__tests__/utils/
├── safeJSONStringify/safeJSONStringify.test.js     ✅ Ready
├── chats/openaiHelpers.test.js                     ✅ Ready  
├── chats/openaiCompatible.test.js                  ✅ Ready
├── agentFlows/executor.test.js                     ✅ Ready
├── TextSplitter/index.test.js                      ✅ Ready
├── SQLConnectors/connectionParser.test.js          ✅ Ready
└── DataSourceConnectors/
    ├── BaseConnector.test.js                       ✅ Ready
    └── WebsiteConnector.test.js                    ✅ Ready

collector/__tests__/utils/extensions/
└── YoutubeTranscript/YoutubeLoader/youtube-transcript.test.js ✅ Ready
```

## Manual Testing Approach

### API Endpoint Testing (Phase 1.1)
```bash
# Start the server
npm run dev

# Test basic chat endpoint
curl -X POST http://localhost:3001/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello", "workspace": "default"}'

# Test admin endpoints
curl -X GET http://localhost:3001/api/admin/system-preferences \
  -H "Authorization: Bearer <admin-token>"
```

### Database Testing
```bash
# Check database connection
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.findMany().then(users => {
  console.log('Database connection OK, users:', users.length);
}).catch(console.error);
"
```

### Document Processing Testing
```bash
# Test document upload via admin interface
# 1. Navigate to http://localhost:3000/admin/workspace-settings
# 2. Upload test PDF/DOCX file
# 3. Verify processing completes
# 4. Test chat queries about document content
```

## Phase-Specific Testing

### Phase 1.1: Core API Infrastructure
- **Focus**: JWT auth, enhanced endpoints, webhook receivers
- **Method**: Manual API testing + existing Jest tests
- **Success**: All existing tests pass + new features work

### Phase 1.2: RAG Implementation  
- **Focus**: Document processing, vector search, multi-source
- **Method**: Test document upload + retrieval accuracy
- **Success**: Documents processed correctly + searchable

### Phase 1.3: Knowledge-Focused Prompts
- **Focus**: Response quality, source citation, accuracy
- **Method**: Manual chat testing + prompt validation
- **Success**: Responses cite sources + maintain accuracy

### Phase 1.4: Basic Admin Interface
- **Focus**: Knowledge management UI, document browser
- **Method**: Manual UI testing + user workflow validation  
- **Success**: Complete document management workflow works

## Expected Test Results

### Current Baseline (After Setup)
```
Test Suites: 9 passed, 9 total
Tests: 25-30 passed, 25-30 total
Time: ~2-5 seconds
```

### Success Criteria
- ✅ All existing tests continue to pass
- ✅ New features have manual test validation
- ✅ No performance regression (response times <1s)
- ✅ Database schema changes work correctly
- ✅ Enhanced API endpoints function properly

## Next Steps After Setup

1. **Run the setup commands above**
2. **Verify all 9 test suites pass**
3. **Begin Phase 1.1 implementation**
4. **Use `/testgo` command to execute phase-specific tests**
5. **Maintain TDD approach for new features**

This approach provides immediate test capability while building toward more comprehensive testing as features are developed.