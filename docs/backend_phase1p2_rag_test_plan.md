# Test Plan: Phase 1.2 RAG Implementation
**Branch**: backend_phase1p2_rag_system  
**Stage**: Phase 1.2 - Multi-source Data Ingestion & Vector Search Enhancement  
**Created**: 2025-07-29  
**Status**: ACTIVE

## Executive Summary
This test plan validates the Phase 1.2 RAG implementation for AnythingLLM B2B E-commerce Chat Solution. It covers multi-source data ingestion capabilities and advanced vector search enhancements including source attribution, category filtering, relevance scoring, and fallback mechanisms.

## Test Objectives
1. Validate enhanced document upload API with source metadata
2. Test multi-source data ingestion capabilities
3. Verify vector search enhancements work correctly
4. Ensure backward compatibility with existing functionality
5. Measure performance impact of new features
6. Validate fallback mechanisms for low-confidence queries

## Test Scope

### In Scope
- Enhanced document upload API endpoints
- Source attribution in embeddings
- Category-based filtering system
- Relevance scoring algorithm
- Fallback response system
- Multi-source retrieval optimization
- Query logging for LLM-as-judge
- Sync scheduling functionality

### Out of Scope
- UI/Frontend testing (Phase 1.3)
- Widget deployment (Phase 1.3)
- Production scaling tests
- Third-party API integrations

## Test Environment


### Setup Instructions
```bash
# 1. Navigate to test environment
cd /home/duyth/projects/anythingllm/worktrees/backend/backend_phase1p2_rag_system

# 2. Start the server
npm run dev:server

# 3. Verify server is running on port 3001
curl http://localhost:3001/api/ping
```

## Test Categories

### 1. Unit Tests - New Components

#### 1.1 SourceAttributionEnhancer Tests
**File**: `server/utils/vectorDbProviders/SourceAttributionEnhancer.js`

```javascript
// Test Cases:
- Test metadata enhancement with all fields
- Test with minimal metadata
- Test temporal information calculation
- Test business context preservation
- Test chunk indexing accuracy
- Test source type validation
```

#### 1.2 CategoryFilter Tests
**File**: `server/utils/vectorDbProviders/CategoryFilter.js`

```javascript
// Test Cases:
- Test include strategy
- Test exclude strategy  
- Test hierarchical strategy with nested categories
- Test weighted strategy with custom weights
- Test dynamic filter building from queries
- Test category statistics generation
- Test config validation
- Test config merging
```

#### 1.3 RelevanceScorer Tests
**File**: `server/utils/vectorDbProviders/RelevanceScorer.js`

```javascript
// Test Cases:
- Test vector similarity scoring
- Test text matching with keywords
- Test source reliability calculation
- Test freshness decay calculation
- Test category match scoring
- Test user preference scoring
- Test weight normalization
- Test diversity boosting
- Test score explanation generation
```

#### 1.4 FallbackSystem Tests
**File**: `server/utils/vectorDbProviders/FallbackSystem.js`

```javascript
// Test Cases:
- Test confidence threshold detection
- Test expand search strategy
- Test semantic alternatives generation
- Test category broadening logic
- Test general knowledge fallback
- Test human escalation trigger
- Test response formatting
- Test escalation priority calculation
```

### 2. Integration Tests

#### 2.1 Enhanced Document Upload
**Endpoint**: `/v1/document/upload`

```bash
# Test enhanced metadata upload
curl -X POST http://localhost:3001/api/v1/document/upload \
  -H "Authorization: Bearer $API_KEY" \
  -F "file=@test-product-catalog.pdf" \
  -F "sourceType=product_catalog" \
  -F "sourceUrl=https://example.com/catalog.pdf" \
  -F "category=Products/Electronics" \
  -F "priority=high" \
  -F "syncEnabled=true" \
  -F "syncSchedule=0 */6 * * *" \
  -F "businessContext={\"department\":\"sales\",\"region\":\"US\"}"
```

**Expected Results**:
- Document uploaded successfully
- Metadata stored in workspace_documents
- Source attribution in vector embeddings
- Sync schedule validated and stored

#### 2.2 Product Catalog Processing
**Endpoint**: `/v1/document/upload-catalog`

```bash
# Test CSV catalog upload
curl -X POST http://localhost:3001/api/v1/document/upload-catalog \
  -H "Authorization: Bearer $API_KEY" \
  -F "file=@products.csv" \
  -F "type=csv" \
  -F "category=Products"
```

**Expected Results**:
- CSV parsed successfully
- Products added to knowledge base
- Category assignments correct
- Vector embeddings created

#### 2.3 Enhanced Similarity Search
**Test the new performEnhancedSimilaritySearch method**

```javascript
// Test search with category filter
const results = await LanceDb.performEnhancedSimilaritySearch({
  namespace: "test-workspace",
  input: "What is the return policy for electronics?",
  LLMConnector: llm,
  categoryFilter: {
    strategy: 'include',
    categories: ['Policies/Returns', 'Products/Electronics']
  },
  relevanceWeights: {
    textMatch: 0.3,
    categoryMatch: 0.3,
    sourceReliability: 0.2,
    freshness: 0.2
  },
  enableFallback: true
});

// Verify results
expect(results.sources).toBeDefined();
expect(results.categoryDistribution).toBeDefined();
expect(results.confidence).toBeGreaterThan(0);
```

#### 2.4 Fallback Response Testing
**Test low confidence query handling**

```javascript
// Test with obscure query
const results = await LanceDb.performEnhancedSimilaritySearch({
  namespace: "test-workspace",
  input: "What about quantum flux capacitors?",
  LLMConnector: llm,
  enableFallback: true
});

// Verify fallback was triggered
expect(results.fallbackUsed).toBe(true);
expect(results.fallbackStrategy).toBeDefined();
expect(results.message).toContain("I'll need to connect you");
```

### 3. API Endpoint Tests

#### 3.1 Query Logging
**Test query/response logging for LLM-as-judge**

```javascript
// Make a query
const response = await chatAPI.query({
  message: "What products do you offer?",
  workspaceId: 1
});

// Verify query was logged
const logs = await QueryLogs.getRecentLogs(1);
expect(logs[0].query).toBe("What products do you offer?");
expect(logs[0].responseTime).toBeDefined();
expect(logs[0].sources).toBeDefined();
```

#### 3.2 Sync Scheduler
**Test cron-based sync scheduling**

```javascript
// Create sync schedule
const schedule = await SyncScheduler.create({
  documentId: 123,
  cronExpression: "0 */6 * * *",
  enabled: true
});

// Verify cron validation
expect(schedule.nextSync).toBeDefined();
expect(schedule.isValid).toBe(true);

// Test invalid cron
const invalid = await SyncScheduler.validateCron("invalid cron");
expect(invalid).toBe(false);
```

### 4. Performance Tests

#### 4.1 Vector Search Performance
```javascript
// Measure enhanced search performance
const start = Date.now();
const results = await performEnhancedSimilaritySearch({
  // ... search params
  topN: 10
});
const duration = Date.now() - start;

// Should complete within 2 seconds
expect(duration).toBeLessThan(2000);
```

#### 4.2 Relevance Scoring Performance
```javascript
// Test scoring 100 results
const scorer = new RelevanceScorer();
const mockResults = generateMockResults(100);

const start = Date.now();
const scored = scorer.scoreResults(mockResults, context);
const duration = Date.now() - start;

// Should score 100 results in < 100ms
expect(duration).toBeLessThan(100);
```

### 5. Backward Compatibility Tests

#### 5.1 Existing Document Upload
```bash
# Test that existing upload still works
curl -X POST http://localhost:3001/api/v1/document/upload \
  -H "Authorization: Bearer $API_KEY" \
  -F "file=@legacy-doc.pdf"
```

#### 5.2 Standard Similarity Search
```javascript
// Verify original performSimilaritySearch still works
const results = await LanceDb.performSimilaritySearch({
  namespace: "test-workspace",
  input: "test query",
  LLMConnector: llm
});

expect(results.contextTexts).toBeDefined();
expect(results.sources).toBeDefined();
```

## Test Data Requirements

### Sample Documents
1. **product-catalog.csv** - Sample product data with categories
2. **policies.pdf** - Company policies document
3. **faq.txt** - FAQ document with Q&A structure
4. **legacy-doc.pdf** - Document without metadata for compatibility

### Test Categories
- Products/Electronics/Phones
- Products/Electronics/Laptops
- Policies/Returns
- Policies/Shipping
- Support/FAQ

## Success Criteria

### Functional Requirements
- [ ] All enhanced API endpoints return correct responses
- [ ] Source metadata is preserved throughout pipeline
- [ ] Category filtering works with all strategies
- [ ] Relevance scoring improves result quality
- [ ] Fallback system handles low confidence queries
- [ ] Query logging captures all required data

### Performance Requirements
- [ ] Enhanced search completes in < 2 seconds
- [ ] Relevance scoring adds < 100ms overhead
- [ ] Category filtering reduces search space effectively
- [ ] No memory leaks in long-running tests

### Compatibility Requirements
- [ ] Existing APIs continue to function
- [ ] No breaking changes to database schema
- [ ] Legacy documents work without metadata

## Test Execution Instructions

### Running All Tests
```bash
# 1. Run unit tests for new components
npm test -- --testPathPattern="SourceAttributionEnhancer|CategoryFilter|RelevanceScorer|FallbackSystem"

# 2. Run integration tests
npm test -- --testPathPattern="integration/phase1p2"

# 3. Run API tests
./test-scripts/phase1p2-api-tests.sh

# 4. Run performance benchmarks
npm run test:performance:phase1p2
```

### Manual Testing Checklist
1. [ ] Upload document with full metadata
2. [ ] Upload CSV product catalog
3. [ ] Search with category filter
4. [ ] Trigger fallback response
5. [ ] Check query logs
6. [ ] Verify sync schedules

## Risk Mitigation

### Known Risks
1. **Performance degradation** - Mitigated by efficient algorithms and caching
2. **Backward compatibility** - Mitigated by preserving original methods
3. **Database migrations** - Mitigated by careful schema design

### Rollback Plan
1. Revert to previous commit
2. Run rollback migration: `npx prisma migrate rollback`
3. Restart services
4. Verify original functionality restored

## Test Report Template

### Summary
- **Total Tests**: [X]
- **Passed**: [X]
- **Failed**: [X]
- **Skipped**: [X]
- **Pass Rate**: [X]%

### Failed Tests
- Test Name: [Description]
  - Expected: [X]
  - Actual: [Y]
  - Root Cause: [Analysis]

### Performance Results
- Enhanced Search: [X]ms average
- Relevance Scoring: [X]ms average
- Category Filtering: [X]ms average

### Recommendations
- [List any improvements or fixes needed]

---

**Test Plan Status**: READY FOR EXECUTION
**Next Step**: Run tests using `/testgo` command