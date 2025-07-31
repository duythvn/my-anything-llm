# Phase 1.4 Admin API - Secure External Test Plan

## Overview
This test plan validates all Phase 1.4 Admin API endpoints using secure testing methods without dynamic code execution.

## Prerequisites
- AnythingLLM server running on `http://localhost:3001`
- Valid API key: Use the key from your database or create one via the admin interface
- `curl` command available in the terminal

## Test Configuration
```bash
# Set these variables before running tests
export API_KEY="your-api-key-here"
export BASE_URL="http://localhost:3001/api/v1/admin"
```

## Test Suite

### 1. Knowledge Base Management API

#### 1.1 Get Knowledge Base Content (Paginated)
```bash
# Basic retrieval
curl -X GET "$BASE_URL/knowledge" \
  -H "Authorization: Bearer $API_KEY"

# With pagination
curl -X GET "$BASE_URL/knowledge?page=1&limit=10" \
  -H "Authorization: Bearer $API_KEY"

# With filters
curl -X GET "$BASE_URL/knowledge?category=documents&sourceType=manual_upload" \
  -H "Authorization: Bearer $API_KEY"
```

#### 1.2 Search Knowledge Base
```bash
# Simple search
curl -X GET "$BASE_URL/knowledge/search?q=test" \
  -H "Authorization: Bearer $API_KEY"

# Search with spaces (URL encoded)
curl -X GET "$BASE_URL/knowledge/search?q=test%20query" \
  -H "Authorization: Bearer $API_KEY"

# Search with filters
curl -X GET "$BASE_URL/knowledge/search?q=documentation&category=guides&limit=5" \
  -H "Authorization: Bearer $API_KEY"
```

#### 1.3 Get Knowledge Base Statistics
```bash
# Default 30-day stats
curl -X GET "$BASE_URL/knowledge/stats" \
  -H "Authorization: Bearer $API_KEY"

# 7-day stats
curl -X GET "$BASE_URL/knowledge/stats?period=7d" \
  -H "Authorization: Bearer $API_KEY"
```

#### 1.4 Get Document Details
```bash
# Get document by ID (replace 1 with actual document ID)
curl -X GET "$BASE_URL/knowledge/1" \
  -H "Authorization: Bearer $API_KEY"
```

#### 1.5 Validate Knowledge Base Integrity
```bash
# Basic validation
curl -X POST "$BASE_URL/knowledge/validate" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'

# Full validation with auto-fix
curl -X POST "$BASE_URL/knowledge/validate" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "checkEmbeddings": true,
    "checkOrphans": true,
    "autoFix": true
  }'
```

### 2. Document Management API

#### 2.1 Bulk Update Documents
```bash
curl -X POST "$BASE_URL/documents/bulk-update" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "updates": [
      {
        "id": 1,
        "changes": {
          "category": "updated-category",
          "priority": 5
        }
      }
    ],
    "dryRun": true
  }'
```

#### 2.2 Bulk Delete Documents
```bash
curl -X POST "$BASE_URL/documents/bulk-delete" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "documentIds": [1, 2, 3],
    "dryRun": true,
    "confirmationToken": "test-delete-123"
  }'
```

#### 2.3 Merge Documents
```bash
curl -X POST "$BASE_URL/documents/merge" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceDocumentIds": [1, 2],
    "targetDocumentId": 3,
    "strategy": "append_content",
    "preserveMetadata": true
  }'
```

#### 2.4 Find Duplicate Documents
```bash
curl -X POST "$BASE_URL/documents/find-duplicates" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "threshold": 0.8,
    "checkContent": true,
    "checkMetadata": true
  }'
```

### 3. Chat Testing API

#### 3.1 Single Chat Test
```bash
curl -X POST "$BASE_URL/chat/test" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is AnythingLLM?",
    "workspaceId": 1,
    "models": ["gpt-3.5-turbo"],
    "options": {
      "temperature": 0.7,
      "includeAnalysis": true
    }
  }'
```

#### 3.2 Batch Chat Testing
```bash
curl -X POST "$BASE_URL/chat/test/batch" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "queries": [
      "What is AnythingLLM?",
      "How do I create a workspace?",
      "What file formats are supported?"
    ],
    "workspaceId": 1,
    "models": ["gpt-3.5-turbo", "gpt-4"],
    "options": {
      "temperature": 0.7,
      "includeAnalysis": true,
      "parallel": false
    }
  }'
```

#### 3.3 Get Test History
```bash
# Basic history
curl -X GET "$BASE_URL/chat/test/history" \
  -H "Authorization: Bearer $API_KEY"

# Filtered history
curl -X GET "$BASE_URL/chat/test/history?workspaceId=1&limit=5" \
  -H "Authorization: Bearer $API_KEY"
```

#### 3.4 Analyze Response Quality
```bash
curl -X POST "$BASE_URL/chat/analyze" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is machine learning?",
    "response": "Machine learning is a subset of artificial intelligence that enables computers to learn and improve from experience without being explicitly programmed.",
    "analysisType": "comprehensive",
    "workspaceId": 1
  }'
```

## Expected Results

### Success Criteria
- All endpoints return HTTP 200 status for valid requests
- Response format matches API specification (JSON with success field)
- Authentication works correctly (403 for invalid API keys)
- URL encoding is handled properly for search queries with spaces
- Stats endpoint returns without requiring document ID parameter
- Chat analyze endpoint processes requests without runtime errors

### Error Handling
- Invalid API keys return 403 Forbidden
- Missing required fields return 400 Bad Request
- Non-existent resources return 404 Not Found
- Malformed JSON returns 400 Bad Request

## Security Validation

### Authentication Tests
```bash
# Test with invalid API key
curl -X GET "$BASE_URL/knowledge" \
  -H "Authorization: Bearer invalid-key"
# Expected: 403 Forbidden

# Test with missing authorization
curl -X GET "$BASE_URL/knowledge"
# Expected: 403 Forbidden
```

### Input Validation Tests
```bash
# Test with malformed JSON
curl -X POST "$BASE_URL/chat/test" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "test", "invalid": json}'
# Expected: 400 Bad Request

# Test with missing required fields
curl -X POST "$BASE_URL/chat/analyze" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
# Expected: 400 Bad Request
```

## Performance Benchmarks
- Response times should be under 2 seconds for most endpoints
- Stats calculation should complete within 5 seconds
- Batch operations should provide progress feedback
- Search operations should be optimized for large datasets

## Notes
- Replace placeholder values (API_KEY, document IDs, workspace IDs) with actual values from your system
- Some tests require existing data in the database to return meaningful results
- Use dryRun=true for destructive operations during testing
- Monitor server logs for any errors during testing