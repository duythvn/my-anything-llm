# Phase 1.4: Admin API Endpoints - Task Breakdown

## Overview
Phase 1.4 focuses on building administrative API endpoints for knowledge management and testing within the AnythingLLM B2B E-commerce Chat Solution. This phase consolidates and enhances existing endpoints while adding critical administrative capabilities for managing knowledge bases, testing chat responses, and handling content versioning.

**Duration**: Days 13-14 (2 days)
**Total Estimated Time**: 14-16 hours

## Goals
1. Consolidate and enhance existing document and product management APIs
2. Create knowledge base content retrieval APIs with advanced filtering
3. Implement content version control capabilities
4. Build chat testing endpoints for internal validation
5. Add administrative analytics and monitoring endpoints

## Technical Requirements

### API Authentication & Authorization
- All admin endpoints require valid API key authentication
- Enhanced role-based access control for admin operations
- Rate limiting for resource-intensive operations
- Audit logging for all administrative actions

### Core Technologies
- Node.js/Express (existing AnythingLLM backend)
- PostgreSQL with existing models
- Redis for caching and rate limiting
- Existing authentication middleware

## Task Breakdown

### Task 1: Knowledge Base Content API (4-5 hours)
**Objective**: Create comprehensive API for retrieving and managing knowledge base content

#### Subtasks:
1. **Create GET /api/admin/knowledge endpoint** (1.5 hours)
   - Retrieve all knowledge base content with pagination
   - Support filtering by source type, category, workspace
   - Include metadata like last sync time, confidence scores
   - Implement caching for performance

2. **Create GET /api/admin/knowledge/search endpoint** (1.5 hours)
   - Full-text search across knowledge base
   - Filter by date range, source type, priority
   - Support fuzzy matching and relevance scoring
   - Return highlighted snippets

3. **Create GET /api/admin/knowledge/stats endpoint** (1 hour)
   - Knowledge base statistics by source type
   - Document count, token count, embedding status
   - Sync status and error rates
   - Category distribution

4. **Create POST /api/admin/knowledge/validate endpoint** (1 hour)
   - Validate knowledge base integrity
   - Check for duplicate content
   - Verify embeddings are up-to-date
   - Return validation report

#### Technical Specifications:
```javascript
// GET /api/admin/knowledge
{
  query: {
    page: number,
    limit: number,
    sourceType: string,
    category: string,
    workspaceId: number,
    syncStatus: 'active' | 'paused' | 'error',
    lastSyncAfter: ISO8601,
    sortBy: 'createdAt' | 'updatedAt' | 'priority'
  },
  response: {
    success: boolean,
    data: [{
      id: string,
      title: string,
      content: string,
      sourceType: string,
      sourceUrl: string,
      category: string,
      priority: number,
      metadata: object,
      syncEnabled: boolean,
      lastSyncAt: ISO8601,
      embeddingStatus: string,
      workspaces: [{ id, name }]
    }],
    pagination: { page, limit, total, pages }
  }
}
```

### Task 2: Content Version Control API (3-4 hours)
**Objective**: Implement version control for knowledge base content

#### Subtasks:
1. **Create GET /api/admin/content/:id/versions endpoint** (1 hour)
   - Retrieve version history for a document
   - Include diff between versions
   - Show who made changes and when

2. **Create POST /api/admin/content/:id/restore endpoint** (1 hour)
   - Restore content to a previous version
   - Create audit log entry
   - Re-trigger embedding generation

3. **Create GET /api/admin/content/changes endpoint** (1 hour)
   - Recent changes across all content
   - Filter by user, date range, change type
   - Include before/after preview

4. **Database schema updates** (1 hour)
   - Add content_versions table if not exists
   - Add version tracking triggers
   - Create indices for performance

#### Technical Specifications:
```javascript
// Content Version Schema
{
  id: number,
  documentId: string,
  version: number,
  content: text,
  metadata: jsonb,
  changeType: 'create' | 'update' | 'delete',
  changedBy: userId,
  changedAt: timestamp,
  changeReason: string,
  diff: jsonb
}
```

### Task 3: Chat Testing API (3-4 hours)
**Objective**: Build endpoints for testing chat responses internally

#### Subtasks:
1. **Create POST /api/admin/chat/test endpoint** (1.5 hours)
   - Test chat responses without logging
   - Support different LLM models
   - Include knowledge base context
   - Return detailed response analysis

2. **Create POST /api/admin/chat/batch-test endpoint** (1.5 hours)
   - Test multiple queries in batch
   - Compare responses across models
   - Generate test reports
   - Support CSV upload for test cases

3. **Create GET /api/admin/chat/test-history endpoint** (1 hour)
   - Retrieve past test results
   - Filter by date, model, test type
   - Export capabilities

#### Technical Specifications:
```javascript
// POST /api/admin/chat/test
{
  body: {
    query: string,
    workspaceId: number,
    model: string,
    temperature: number,
    includeContext: boolean,
    contextFilters: {
      sourceTypes: string[],
      categories: string[],
      minConfidence: number
    },
    compareWith: string[] // other models to compare
  },
  response: {
    success: boolean,
    results: [{
      model: string,
      response: string,
      tokensUsed: number,
      latency: number,
      context: [{
        source: string,
        relevance: number,
        content: string
      }],
      confidence: number,
      analysis: {
        sentiment: string,
        topics: string[],
        quality_score: number
      }
    }]
  }
}
```

### Task 4: Enhanced Document Management APIs (2-3 hours)
**Objective**: Enhance existing document APIs with admin-specific features

#### Subtasks:
1. **Enhance POST /api/admin/documents/bulk-update endpoint** (1 hour)
   - Bulk update document metadata
   - Change categories, priorities
   - Enable/disable sync
   - Update business context

2. **Create DELETE /api/admin/documents/bulk endpoint** (1 hour)
   - Bulk delete with safety checks
   - Check workspace dependencies
   - Create deletion audit log
   - Option to soft delete

3. **Create POST /api/admin/documents/merge endpoint** (1 hour)
   - Merge duplicate documents
   - Combine metadata
   - Update references
   - Maintain version history

#### Technical Specifications:
```javascript
// POST /api/admin/documents/bulk-update
{
  body: {
    documentIds: string[],
    updates: {
      category: string,
      priority: number,
      syncEnabled: boolean,
      syncSchedule: string,
      metadata: object
    },
    validateBeforeUpdate: boolean
  },
  response: {
    success: boolean,
    updated: number,
    failed: number,
    errors: [{ documentId, error }]
  }
}
```

### Task 5: Analytics and Monitoring APIs (2 hours)
**Objective**: Create APIs for monitoring knowledge base health and usage

#### Subtasks:
1. **Create GET /api/admin/analytics/knowledge endpoint** (1 hour)
   - Knowledge base usage statistics
   - Most/least accessed content
   - Search query analysis
   - Response quality metrics

2. **Create GET /api/admin/monitoring/sync-status endpoint** (1 hour)
   - Real-time sync status for all sources
   - Error logs and retry attempts
   - Performance metrics
   - Queue status

#### Technical Specifications:
```javascript
// GET /api/admin/analytics/knowledge
{
  query: {
    startDate: ISO8601,
    endDate: ISO8601,
    groupBy: 'day' | 'week' | 'month'
  },
  response: {
    success: boolean,
    analytics: {
      totalQueries: number,
      uniqueUsers: number,
      avgResponseTime: number,
      topContent: [{ id, title, hits }],
      searchTerms: [{ term, count }],
      sourceTypeDistribution: object,
      confidenceDistribution: object
    }
  }
}
```

## Data Models

### Existing Models to Enhance:
- Document model - Add version tracking
- Product model - Already has good structure
- Workspace model - Add analytics fields

### New Models Needed:
```javascript
// ContentVersion model
{
  tableName: 'content_versions',
  fields: {
    id: 'SERIAL PRIMARY KEY',
    document_id: 'INTEGER REFERENCES documents(id)',
    version_number: 'INTEGER NOT NULL',
    content: 'TEXT',
    metadata: 'JSONB',
    created_by: 'INTEGER REFERENCES users(id)',
    created_at: 'TIMESTAMP DEFAULT NOW()',
    change_type: 'VARCHAR(20)',
    change_reason: 'TEXT'
  }
}

// ChatTest model
{
  tableName: 'chat_tests',
  fields: {
    id: 'SERIAL PRIMARY KEY',
    test_id: 'UUID DEFAULT gen_random_uuid()',
    query: 'TEXT NOT NULL',
    workspace_id: 'INTEGER REFERENCES workspaces(id)',
    model: 'VARCHAR(100)',
    response: 'TEXT',
    metadata: 'JSONB',
    created_by: 'INTEGER REFERENCES users(id)',
    created_at: 'TIMESTAMP DEFAULT NOW()'
  }
}
```

## Integration Points

### Existing Integrations to Leverage:
1. **Document Upload API** (/v1/document/upload)
   - Already has enhanced metadata support
   - Supports multiple source types
   - Has sync configuration

2. **Product Management API** (/v1/products)
   - Complete CRUD operations
   - Search and filtering
   - Bulk import capability

3. **Admin API** (/v1/admin)
   - User management
   - Workspace management
   - System preferences

### New Integration Requirements:
1. **Redis Integration**
   - Cache knowledge base queries
   - Rate limiting for admin endpoints
   - Session management for batch operations

2. **Background Workers**
   - Version cleanup jobs
   - Analytics aggregation
   - Sync monitoring

3. **Event System**
   - Emit events for content changes
   - Webhook notifications
   - Audit log integration

## Testing Requirements

### Unit Tests:
- Test all new endpoints with various inputs
- Validate permission checks
- Test error handling
- Mock external dependencies

### Integration Tests:
- Test version control workflow
- Test bulk operations
- Test chat testing pipeline
- Verify caching behavior

### Performance Tests:
- Load test knowledge retrieval endpoints
- Test bulk update performance
- Measure chat test latency
- Verify pagination efficiency

## Success Criteria

1. **Functional Requirements**
   - All endpoints return correct data
   - Version control tracks all changes
   - Chat testing provides accurate analysis
   - Bulk operations handle large datasets

2. **Performance Requirements**
   - Knowledge retrieval < 200ms for cached queries
   - Bulk updates process 1000 items < 5 seconds
   - Chat tests complete < 3 seconds per query
   - Analytics queries return < 1 second

3. **Security Requirements**
   - All endpoints require authentication
   - Admin operations are logged
   - Rate limiting prevents abuse
   - Input validation prevents injection

4. **Documentation Requirements**
   - OpenAPI/Swagger documentation updated
   - Admin guide for new features
   - API usage examples provided
   - Migration guide for existing users

## Implementation Order

1. **Day 13 (7-8 hours)**
   - Task 1: Knowledge Base Content API
   - Task 2: Content Version Control API
   - Start Task 3: Chat Testing API

2. **Day 14 (7-8 hours)**
   - Complete Task 3: Chat Testing API
   - Task 4: Enhanced Document Management APIs
   - Task 5: Analytics and Monitoring APIs
   - Final testing and documentation

## Notes

- Build on existing functionality rather than recreating
- Use existing middleware and helpers where possible
- Ensure backward compatibility with existing APIs
- Focus on admin use cases for internal management
- Consider future scaling needs in design decisions