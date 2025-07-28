# Test Plan: backend_v0p1_p1_content - Phase 1 Enhanced Knowledge MVP

## Test Plan Overview
- **Branch**: backend_v0p1_p1_content
- **Phase**: 1.1-1.4 Enhanced Knowledge MVP  
- **Duration**: Days 1-14 (Week 1-2)
- **Focus**: Multi-source data ingestion with real-time RAG capabilities

## Testing Strategy

### 1. Foundation Testing (AnythingLLM Base)
**Objective**: Ensure AnythingLLM foundation remains stable with enhancements

#### Test Cases:
- **T1.1**: Basic chat functionality remains operational
- **T1.2**: Existing document upload still works
- **T1.3**: Vector search maintains performance
- **T1.4**: User authentication functions correctly
- **T1.5**: Workspace isolation works properly

### 2. Enhanced API Testing (Phase 1.1)
**Objective**: Validate enhanced chat API endpoints with B2B features

#### Test Cases:
- **T2.1**: Enhanced `/api/v1/chat` endpoint handles product queries
- **T2.2**: Enhanced `/api/v1/messages` supports source attribution
- **T2.3**: JWT authentication with API key management
- **T2.4**: Webhook receiver accepts and processes updates
- **T2.5**: Multi-tenant workspace model functions

### 3. Multi-Source Data Ingestion (Phase 1.2)
**Objective**: Test enhanced document processing for multiple data sources

#### Test Cases:
- **T3.1**: Document upload (PDF, DOCX, TXT) with source tracking
- **T3.2**: Product catalog CSV/JSON import functionality
- **T3.3**: Policy document parsing with categorization
- **T3.4**: FAQ structure recognition and processing
- **T3.5**: Knowledge base versioning system
- **T3.6**: CSV/Excel parsing with PDF link extraction
- **T3.7**: Query/response logging for evaluation
- **T3.8**: Sync schedule configuration per source

### 4. Enhanced RAG Testing (Phase 1.2)
**Objective**: Validate improved retrieval with source attribution

#### Test Cases:
- **T4.1**: Product description embeddings accuracy
- **T4.2**: Semantic search for policies and FAQs
- **T4.3**: Category-based filtering functionality
- **T4.4**: Relevance scoring accuracy
- **T4.5**: Fallback responses for no matches
- **T4.6**: Source tracking for embedded chunks
- **T4.7**: Confidence scoring implementation

### 5. Knowledge-Focused Prompts (Phase 1.3)
**Objective**: Test optimized prompts for informational queries

#### Test Cases:
- **T5.1**: Knowledge-focused system prompts effectiveness
- **T5.2**: Context injection for product queries
- **T5.3**: Source citation in responses
- **T5.4**: Friendly, helpful tone consistency
- **T5.5**: "I don't know" handling accuracy
- **T5.6**: Fact-checking against knowledge base
- **T5.7**: Response length optimization
- **T5.8**: Follow-up question suggestions

### 6. Admin Interface Testing (Phase 1.4)
**Objective**: Validate knowledge management interface

#### Test Cases:
- **T6.1**: Document upload interface functionality
- **T6.2**: Product catalog management tools
- **T6.3**: Knowledge base browser navigation
- **T6.4**: Content version control system
- **T6.5**: Basic chat testing interface

## Performance Testing

### Response Time Requirements
- **Knowledge queries**: <1 second response time
- **Product information**: <800ms retrieval
- **Document upload**: <5 seconds for standard files
- **Vector search**: <500ms for semantic queries

### Load Testing Scenarios
- **Concurrent users**: 10-50 users (MVP target)
- **Document volume**: 100-1000 documents
- **Query volume**: 100-500 queries per hour
- **Storage capacity**: 1-10GB knowledge base

## Integration Testing

### AnythingLLM Integration
- **T7.1**: Enhanced features don't break existing functionality
- **T7.2**: Database migrations work correctly
- **T7.3**: New API endpoints integrate with existing auth
- **T7.4**: Vector database enhancements maintain performance
- **T7.5**: Frontend components work with enhanced backend

### External Systems
- **T8.1**: Webhook integration with external data sources
- **T8.2**: File processing pipeline handles various formats
- **T8.3**: Email notification system (if implemented)
- **T8.4**: Real-time sync capabilities

## Test Execution Plan

### Setting Up Testing Infrastructure
Since AnythingLLM has test files but no test runner configured, we need to first set up Jest:

```bash
# Install Jest for testing
cd server
npm install --save-dev jest
npm install --save-dev @types/jest

# Add test script to package.json
npm pkg set scripts.test="jest"
npm pkg set scripts.test:watch="jest --watch"
npm pkg set scripts.test:coverage="jest --coverage"
```

### Phase 1.1 Testing (Days 1-2)
```bash
# Test existing functionality first
npm test -- __tests__/utils/safeJSONStringify/safeJSONStringify.test.js
npm test -- __tests__/utils/chats/openaiHelpers.test.js

# Manual API testing using curl/Postman
curl -X POST http://localhost:3001/api/v1/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"message": "Test knowledge query", "workspace": "test"}'

# Database schema validation
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.\$queryRaw\`SELECT name FROM sqlite_master WHERE type='table'\`.then(console.log)"
```

### Phase 1.2 Testing (Days 3-4)  
```bash
# Document processing tests using existing files
npm test -- __tests__/utils/TextSplitter/index.test.js
npm test -- __tests__/utils/DataSourceConnectors/

# Manual document upload testing
curl -X POST http://localhost:3001/api/admin/workspace-settings \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@test-document.pdf"
```

### Phase 1.3 Testing (Days 5-6)
```bash
# Chat functionality tests
npm test -- __tests__/utils/chats/

# Manual prompt testing via admin interface
# Test knowledge-focused responses
# Verify source citations work
```

### Phase 1.4 Testing (Days 7)
```bash
# Full integration testing
npm test
npm run lint
npm run start # Verify server starts without errors

# Manual end-to-end testing
# - Admin interface navigation
# - Document upload workflow
# - Chat interface functionality
```

## Success Criteria

### MVP Success Metrics
- [ ] **Knowledge Management**: Successfully ingest and query documents/FAQs
- [ ] **Product Information**: Accurate product details retrieval  
- [ ] **Performance**: <1s response time for knowledge queries
- [ ] **Multi-Source**: At least 3 different data source types working
- [ ] **Admin Interface**: Document upload and management functional

### Quality Gates
- [ ] **Test Coverage**: >80% code coverage for new features
- [ ] **Performance**: All response time requirements met
- [ ] **Integration**: No regression in existing AnythingLLM features
- [ ] **User Experience**: Smooth knowledge management workflow
- [ ] **Documentation**: All APIs documented and tested

## Test Data Requirements

### Sample Documents
- **PDFs**: Product manuals, policy documents
- **CSVs**: Product catalogs with 100+ items
- **Word Docs**: FAQ documents, knowledge articles
- **Text Files**: Simple policies and procedures

### Test Queries
- **Product questions**: "What are the features of Product X?"
- **Policy queries**: "What is our return policy?"
- **FAQ searches**: "How do I track my order?"
- **General knowledge**: "Tell me about shipping options"

## Risk Mitigation

### Technical Risks
- **AnythingLLM compatibility**: Extensive regression testing
- **Performance degradation**: Continuous performance monitoring
- **Data consistency**: Automated data validation tests
- **Vector search accuracy**: Relevance scoring validation

### Test Environment
- **Development**: Local AnythingLLM instance with test data
- **Staging**: Production-like environment for integration testing
- **Performance**: Dedicated environment for load testing

## Test Automation

### Setting Up Jest Testing Framework
First, add Jest to the server package.json:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch", 
    "test:coverage": "jest --coverage"
  },
  "devDependencies": {
    "jest": "^29.0.0",
    "@types/jest": "^29.0.0"
  }
}
```

### Jest Configuration (jest.config.js)
```javascript
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'utils/**/*.js',
    'models/**/*.js',
    'endpoints/**/*.js'
  ],
  coverageExcludePatterns: [
    'node_modules/',
    'storage/',
    'prisma/'
  ]
};
```

### Continuous Integration (Future)
```yaml
# .github/workflows/test.yml
name: Backend Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
      - name: Install server dependencies
        run: cd server && npm install
      - name: Setup Jest
        run: cd server && npm install --save-dev jest @types/jest
      - name: Run tests
        run: cd server && npm test
```

## Reporting

### Test Reports
- **Daily**: Test execution summary
- **Weekly**: Performance and quality metrics
- **Phase completion**: Comprehensive test report

### Metrics to Track
- Test pass/fail rates
- Response time measurements  
- Code coverage percentages
- Defect discovery and resolution rates
- User acceptance feedback

---

**Test Plan Created**: 2025-01-28  
**Status**: Ready for Phase 1.1 testing  
**Next Review**: After Phase 1.1 completion