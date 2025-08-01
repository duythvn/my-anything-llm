# Phase 1.4 Admin API External Test Plan

## Test Plan Overview
**Phase**: 1.4 Admin API Endpoints  
**Branch**: backend_phase1p4_admin_api  
**Focus**: Comprehensive validation of admin APIs for knowledge management, document operations, and chat testing  
**Test Duration**: 45-60 minutes  
**Test Date**: Ready for execution  

## Implementation Status ✅
- **Knowledge Base API**: 5 endpoints implemented (618 lines)
- **Document Management API**: 4 endpoints implemented (585 lines) 
- **Chat Testing API**: 4 endpoints implemented (566 lines)
- **Test Suite**: 86 comprehensive tests created (450+ lines)
- **Documentation**: Complete implementation summary available

## Test Categories

### 1. Knowledge Base Content API Testing (15-20 minutes)

#### 1.1 GET /v1/admin/knowledge - Paginated Retrieval
**Priority**: Critical
**Test Steps**:
```bash
# Test basic pagination
curl -X GET "http://localhost:3001/api/v1/admin/knowledge?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_API_KEY"

# Test filtering by category
curl -X GET "http://localhost:3001/api/v1/admin/knowledge?category=documentation&limit=10" \
  -H "Authorization: Bearer YOUR_API_KEY"

# Test search functionality  
curl -X GET "http://localhost:3001/api/v1/admin/knowledge?search=return policy" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Expected Results**:
- ✅ Returns paginated document list with metadata
- ✅ Pagination object includes total, pages, navigation flags
- ✅ Statistics object shows category/source type breakdown
- ✅ Response time <200ms
- ✅ Proper error handling for invalid parameters

#### 1.2 GET /v1/admin/knowledge/search - Advanced Search
**Priority**: Critical
**Test Steps**:
```bash
# Test search with relevance scoring
curl -X GET "http://localhost:3001/api/v1/admin/knowledge/search?q=shipping policy&limit=10" \
  -H "Authorization: Bearer YOUR_API_KEY"

# Test search with filters
curl -X GET "http://localhost:3001/api/v1/admin/knowledge/search?q=product&category=catalog&workspaceId=1" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Expected Results**:
- ✅ Returns search results with relevance scores
- ✅ Includes result snippets with search term highlighting
- ✅ Search metadata shows execution time and filters applied
- ✅ Handles empty queries with proper error message
- ✅ Response time <500ms for complex searches

#### 1.3 GET /v1/admin/knowledge/:id - Document Details
**Priority**: High
**Test Steps**:
```bash
# Test document retrieval
curl -X GET "http://localhost:3001/api/v1/admin/knowledge/1" \
  -H "Authorization: Bearer YOUR_API_KEY"

# Test invalid document ID
curl -X GET "http://localhost:3001/api/v1/admin/knowledge/999999" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Expected Results**:
- ✅ Returns detailed document information with all metadata
- ✅ Includes workspace information, sync status, business context
- ✅ Shows version information and vector database stats
- ✅ Proper 404 error for non-existent documents
- ✅ Logs document access in audit trail

#### 1.4 GET /v1/admin/knowledge/stats - Statistics
**Priority**: High
**Test Steps**:
```bash
# Test statistics generation
curl -X GET "http://localhost:3001/api/v1/admin/knowledge/stats?period=30d" \
  -H "Authorization: Bearer YOUR_API_KEY"

# Test different time periods
curl -X GET "http://localhost:3001/api/v1/admin/knowledge/stats?period=7d" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Expected Results**:
- ✅ Returns comprehensive statistics dashboard
- ✅ Includes growth trends, category distribution, health metrics
- ✅ Performance metrics and content statistics
- ✅ Response time <1s for statistics calculation
- ✅ Statistics accurately reflect current data state

#### 1.5 POST /v1/admin/knowledge/validate - Validation
**Priority**: High  
**Test Steps**:
```bash
# Test knowledge base validation
curl -X POST "http://localhost:3001/api/v1/admin/knowledge/validate" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "checkEmbeddings": true,
    "checkOrphans": true,
    "fixIssues": false
  }'

# Test with auto-fix enabled
curl -X POST "http://localhost:3001/api/v1/admin/knowledge/validate" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "checkEmbeddings": true,
    "checkOrphans": true, 
    "fixIssues": true
  }'
```

**Expected Results**:
- ✅ Returns validation report with issue categorization
- ✅ Shows overall health score and recommendations
- ✅ Auto-fix functionality works when enabled
- ✅ Comprehensive logging of validation activities
- ✅ Validation results are actionable and specific

### 2. Document Management API Testing (15-20 minutes)

#### 2.1 POST /v1/admin/documents/bulk-update - Bulk Updates
**Priority**: Critical
**Test Steps**:
```bash
# Test bulk update of multiple documents
curl -X POST "http://localhost:3001/api/v1/admin/documents/bulk-update" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "documentIds": [1, 2, 3],
    "updates": {
      "category": "updated-category",
      "priority": 2,
      "tags": ["important", "reviewed"]
    },
    "options": {
      "updateEmbeddings": false,
      "validateWorkspaces": true
    }
  }'

# Test bulk update limits
curl -X POST "http://localhost:3001/api/v1/admin/documents/bulk-update" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "documentIds": '$(python3 -c "print(list(range(1, 1002)))")'),
    "updates": {"category": "test"}
  }'
```

**Expected Results**:
- ✅ Successfully updates multiple documents
- ✅ Returns detailed results with success/failure breakdown
- ✅ Enforces 1000 document limit with proper error message
- ✅ Validates document IDs exist before processing
- ✅ Comprehensive audit logging of all changes

#### 2.2 DELETE /v1/admin/documents/bulk - Bulk Deletion
**Priority**: Critical
**Test Steps**:
```bash
# Test bulk deletion with small set
curl -X DELETE "http://localhost:3001/api/v1/admin/documents/bulk" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "documentIds": [1, 2],
    "options": {
      "removeFromWorkspaces": true,
      "cleanupEmbeddings": true,
      "notifyWorkspaces": true
    },
    "reason": "Test cleanup"
  }'

# Test confirmation requirement for large deletions
curl -X DELETE "http://localhost:3001/api/v1/admin/documents/bulk" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "documentIds": '$(python3 -c "print(list(range(1, 52)))")'},
    "options": {}
  }'
```

**Expected Results**:
- ✅ Successfully deletes documents with proper cleanup
- ✅ Requires confirmation for >50 documents
- ✅ Enforces 500 document deletion limit
- ✅ Workspace notifications sent when configured
- ✅ Comprehensive deletion audit trail

#### 2.3 POST /v1/admin/documents/merge - Document Merging
**Priority**: High
**Test Steps**:
```bash
# Test document merging with append_content strategy
curl -X POST "http://localhost:3001/api/v1/admin/documents/merge" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "primaryDocumentId": 1,
    "secondaryDocumentIds": [2, 3],
    "mergeStrategy": "append_content",
    "options": {
      "preserveVersionHistory": true,
      "updateEmbeddings": true,
      "deleteSecondary": true
    }
  }'

# Test merge validation
curl -X POST "http://localhost:3001/api/v1/admin/documents/merge" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "primaryDocumentId": 1,
    "secondaryDocumentIds": [1],
    "mergeStrategy": "append_content"
  }'
```

**Expected Results**:
- ✅ Successfully merges documents with chosen strategy
- ✅ Returns detailed merge log with actions taken
- ✅ Prevents merging document with itself
- ✅ Validates merge strategy is supported
- ✅ Optional secondary document deletion works

#### 2.4 GET /v1/admin/documents/duplicates - Duplicate Detection
**Priority**: Medium
**Test Steps**:
```bash
# Test duplicate detection with default threshold
curl -X GET "http://localhost:3001/api/v1/admin/documents/duplicates?threshold=0.8" \
  -H "Authorization: Bearer YOUR_API_KEY"

# Test with different similarity threshold
curl -X GET "http://localhost:3001/api/v1/admin/documents/duplicates?threshold=0.5&workspaceId=1" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Expected Results**:
- ✅ Returns potential duplicate groups with similarity scores
- ✅ Includes recommendations for merge actions
- ✅ Handles insufficient documents gracefully
- ✅ Similarity threshold parameter works correctly
- ✅ Workspace filtering functions properly

### 3. Chat Testing API Testing (10-15 minutes)

#### 3.1 POST /v1/admin/chat/test - Single Chat Test
**Priority**: Critical
**Test Steps**:
```bash
# Test single query with multiple models
curl -X POST "http://localhost:3001/api/v1/admin/chat/test" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is your return policy?",
    "workspaceId": 1,
    "models": ["gpt-3.5-turbo"],
    "includeDebugInfo": true,
    "testPromptVariations": false,
    "analysisLevel": "basic"
  }'

# Test invalid workspace
curl -X POST "http://localhost:3001/api/v1/admin/chat/test" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Test message",
    "workspaceId": 999999
  }'
```

**Expected Results**:
- ✅ Returns test session with response analysis
- ✅ Debug information included when requested
- ✅ Performance metrics captured (response time, tokens)
- ✅ Proper error handling for invalid workspace
- ✅ No production chat logs created

#### 3.2 POST /v1/admin/chat/test/batch - Batch Testing
**Priority**: High
**Test Steps**:
```bash
# Test batch processing
curl -X POST "http://localhost:3001/api/v1/admin/chat/test/batch" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "queries": [
      "What is the return policy?",
      "How do I track my order?", 
      "What payment methods do you accept?"
    ],
    "workspaceId": 1,
    "models": ["gpt-3.5-turbo"],
    "parallelLimit": 2,
    "includeAnalysis": true
  }'

# Test batch size limits
curl -X POST "http://localhost:3001/api/v1/admin/chat/test/batch" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "queries": '$(python3 -c "print([f\"Query {i}\" for i in range(1, 102)])")'),
    "workspaceId": 1
  }'
```

**Expected Results**:
- ✅ Processes multiple queries with parallel execution
- ✅ Returns comprehensive batch session summary
- ✅ Enforces 100 query limit with proper error
- ✅ Parallel processing respects specified limits
- ✅ Quality analysis included when requested

#### 3.3 GET /v1/admin/chat/test/history - Test History
**Priority**: Medium
**Test Steps**:
```bash
# Test history retrieval
curl -X GET "http://localhost:3001/api/v1/admin/chat/test/history?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_API_KEY"

# Test history filtering
curl -X GET "http://localhost:3001/api/v1/admin/chat/test/history?workspaceId=1&sessionType=batch" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Expected Results**:
- ✅ Returns paginated test session history
- ✅ Filtering by workspace and session type works
- ✅ Session summaries include key performance metrics
- ✅ Date range filtering functions correctly
- ✅ Proper pagination with navigation flags

#### 3.4 POST /v1/admin/chat/analyze - Response Analysis
**Priority**: Medium
**Test Steps**:
```bash
# Test response quality analysis
curl -X POST "http://localhost:3001/api/v1/admin/chat/analyze" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is the return policy?",
    "response": "Our return policy allows returns within 30 days of purchase. Items must be in original condition.",
    "workspaceId": 1,
    "analysisType": "comprehensive"
  }'

# Test analysis validation
curl -X POST "http://localhost:3001/api/v1/admin/chat/analyze" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Results**:
- ✅ Returns detailed quality analysis with scoring
- ✅ Includes recommendations for improvement
- ✅ Different analysis levels provide appropriate detail
- ✅ Validates required query and response parameters
- ✅ Custom criteria evaluation works when provided

### 4. Security & Authentication Testing (5-10 minutes)

#### 4.1 API Key Validation
**Priority**: Critical
**Test Steps**:
```bash
# Test without API key
curl -X GET "http://localhost:3001/api/v1/admin/knowledge"

# Test with invalid API key
curl -X GET "http://localhost:3001/api/v1/admin/knowledge" \
  -H "Authorization: Bearer invalid_key_123"

# Test with expired/revoked key (if applicable)
curl -X GET "http://localhost:3001/api/v1/admin/knowledge" \
  -H "Authorization: Bearer expired_key"
```

**Expected Results**:
- ✅ Rejects requests without API key (401/403)
- ✅ Rejects requests with invalid API key (401/403)
- ✅ Proper error messages for authentication failures
- ✅ No sensitive information leaked in error responses

#### 4.2 Input Validation & Sanitization
**Priority**: Critical
**Test Steps**:
```bash
# Test SQL injection protection
curl -X GET "http://localhost:3001/api/v1/admin/knowledge/search?q='; DROP TABLE documents; --" \
  -H "Authorization: Bearer YOUR_API_KEY"

# Test XSS protection
curl -X POST "http://localhost:3001/api/v1/admin/documents/bulk-update" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "documentIds": [1],
    "updates": {
      "category": "<script>alert(\"xss\")</script>"
    }
  }'

# Test parameter validation
curl -X GET "http://localhost:3001/api/v1/admin/knowledge?page=-1&limit=999999" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Expected Results**:
- ✅ Prevents SQL injection attempts
- ✅ Sanitizes potentially harmful input
- ✅ Validates parameter ranges and types
- ✅ Returns appropriate error messages for invalid input
- ✅ No system information leaked in error responses

### 5. Performance & Load Testing (5-10 minutes)

#### 5.1 Response Time Validation
**Priority**: High
**Test Steps**:
```bash
# Measure response times for standard operations
time curl -X GET "http://localhost:3001/api/v1/admin/knowledge?limit=20" \
  -H "Authorization: Bearer YOUR_API_KEY"

# Test bulk operations performance
time curl -X POST "http://localhost:3001/api/v1/admin/documents/bulk-update" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "documentIds": '$(python3 -c "print(list(range(1, 101)))")'),
    "updates": {"category": "performance-test"}
  }'
```

**Expected Results**:
- ✅ Standard queries respond in <200ms
- ✅ Bulk operations complete in <2s for 100 items
- ✅ Search operations complete in <500ms
- ✅ Statistics generation completes in <1s
- ✅ No memory leaks or performance degradation

#### 5.2 Concurrent Request Handling
**Priority**: Medium
**Test Steps**:
```bash
# Test concurrent requests (run 10 simultaneous requests)
for i in {1..10}; do
  curl -X GET "http://localhost:3001/api/v1/admin/knowledge?page=$i" \
    -H "Authorization: Bearer YOUR_API_KEY" &
done
wait
```

**Expected Results**:
- ✅ Handles concurrent requests without errors
- ✅ No race conditions or data corruption
- ✅ Consistent response times under load
- ✅ Proper connection pooling and resource management

### 6. Integration & Compatibility Testing (5 minutes)

#### 6.1 Existing AnythingLLM Compatibility
**Priority**: Critical
**Test Steps**:
```bash
# Test existing admin endpoints still work
curl -X GET "http://localhost:3001/api/v1/admin/is-multi-user-mode" \
  -H "Authorization: Bearer YOUR_API_KEY"

# Test existing document endpoints compatibility
curl -X GET "http://localhost:3001/v1/documents" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Expected Results**:
- ✅ Existing admin endpoints function normally
- ✅ No breaking changes to current functionality
- ✅ Database queries don't conflict
- ✅ Consistent response formats maintained

## Test Success Criteria

### Must Pass (Critical)
- [ ] All 13 admin API endpoints return expected responses
- [ ] Authentication and authorization work correctly
- [ ] No SQL injection or XSS vulnerabilities
- [ ] Performance targets met (<200ms average response time)
- [ ] Bulk operations handle limits and confirmations properly
- [ ] Integration maintains existing system stability

### Should Pass (High Priority)
- [ ] Comprehensive error handling with meaningful messages
- [ ] Audit logging captures all admin actions
- [ ] Search functionality returns relevant results with scores
- [ ] Document validation detects and can fix issues
- [ ] Chat testing provides actionable quality insights

### Nice to Have (Medium Priority)
- [ ] Advanced filtering and sorting options work
- [ ] Duplicate detection accuracy is reasonable
- [ ] Response analysis provides detailed feedback
- [ ] Test history and analytics are comprehensive

## Test Environment Setup

### Prerequisites
1. **AnythingLLM Instance**: Running on localhost:3001
2. **Valid API Key**: Admin-level access required
3. **Test Data**: Documents, workspaces, and test content available
4. **Database**: PostgreSQL with test data populated
5. **Dependencies**: curl, python3 for test script generation

### Test Data Requirements
- At least 10 documents in various categories
- Multiple workspaces configured
- Sample product catalog data
- Previous chat testing history (if available)

## Post-Test Actions

### On Test Success ✅
1. **Archive Test Plan**: Move to `/shared_test_plans/archived/`
2. **Update Stage Progress**: Mark Phase 1.4 as ✅ COMPLETED in STAGE_PROGRESS.md
3. **Generate Test Report**: Document all test results and performance metrics
4. **Update Documentation**: Finalize implementation summary
5. **Stage Completion**: Ready for `/stage-complete` command

### On Test Failures ❌
1. **Document Failures**: Detailed log of all failing tests
2. **Performance Issues**: Identify bottlenecks and optimization needs
3. **Security Concerns**: Address any vulnerabilities discovered
4. **Bug Fixes**: Implement fixes for failing functionality
5. **Retest**: Execute test plan again after fixes

## Test Execution Commands

```bash
# Quick validation of all endpoints
./run_phase1p4_tests.sh

# Individual endpoint testing
./test_knowledge_api.sh
./test_document_management.sh  
./test_chat_testing.sh

# Performance benchmarking
./benchmark_admin_apis.sh

# Security audit
./security_test_admin_apis.sh
```

---

**Test Plan Created**: 2025-07-31  
**Ready for Execution**: Use `/testgo` to execute this test plan  
**Expected Duration**: 45-60 minutes for complete validation  
**Success Criteria**: All critical tests pass, performance targets met, no security issues