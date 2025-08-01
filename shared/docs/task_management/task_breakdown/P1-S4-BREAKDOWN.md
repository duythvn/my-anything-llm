# Phase 1.4: Admin API Endpoints - Task Breakdown

## Overview
**Phase**: 1.4 - Admin API Endpoints  
**Duration**: Days 13-14 (2 days)  
**Status**: Ready for Implementation  
**Prerequisites**: Phases 1.1 (Core API), 1.2 (RAG), 1.3 (Knowledge Prompts) completed  

## Goals
Transform AnythingLLM into a comprehensive knowledge management platform by providing robust admin APIs for:
- Document and knowledge base management
- Product catalog operations  
- Content version control
- Internal chat testing and validation
- Analytics and monitoring

## Technical Requirements

### Core Technologies
- **Framework**: Express.js (existing AnythingLLM foundation)
- **Database**: PostgreSQL with Prisma ORM
- **Validation**: Input validation middleware
- **Authentication**: JWT-based admin authentication
- **Caching**: Redis for performance optimization
- **File Storage**: Local filesystem with S3 compatibility

### API Design Principles
- RESTful design patterns
- Consistent error handling
- Comprehensive request/response logging
- Rate limiting for admin endpoints
- Swagger documentation

## Task Breakdown

### Task 1: Knowledge Base Content API (4-5 hours)
Create comprehensive API endpoints for retrieving and managing knowledge base content.

#### Subtasks:
1. **GET /api/v1/admin/knowledge** (1.5 hours)
   - Implement paginated knowledge base retrieval
   - Add filtering by category, source type, sync status
   - Include document statistics and metadata
   - Response format:
   ```json
   {
     "documents": [...],
     "pagination": {
       "page": 1,
       "limit": 20,
       "total": 150,
       "totalPages": 8
     },
     "stats": {
       "totalDocuments": 150,
       "byCategory": {...},
       "bySourceType": {...}
     }
   }
   ```

2. **GET /api/v1/admin/knowledge/search** (1 hour)
   - Full-text search across knowledge base
   - Relevance scoring and highlighting
   - Filter by date range, category, workspace
   - Include source attribution

3. **GET /api/v1/admin/knowledge/:id** (30 mins)
   - Retrieve single document with full content
   - Include version history summary
   - Show embedding status and vector stats

4. **GET /api/v1/admin/knowledge/stats** (1 hour)
   - Comprehensive knowledge base statistics
   - Growth trends and usage patterns
   - Category distribution
   - Source type breakdown

5. **POST /api/v1/admin/knowledge/validate** (1 hour)
   - Validate knowledge base integrity
   - Check for orphaned documents
   - Verify embeddings consistency
   - Generate health report

### Task 2: Content Version Control API (3-4 hours)
Implement version tracking and rollback capabilities for documents.

#### Subtasks:
1. **GET /api/v1/admin/documents/:id/versions** (1 hour)
   - List all versions of a document
   - Include change summary and author
   - Show version size and timestamps

2. **GET /api/v1/admin/documents/:id/versions/:versionId** (45 mins)
   - Retrieve specific version content
   - Include diff from previous version
   - Show metadata changes

3. **POST /api/v1/admin/documents/:id/restore** (1 hour)
   - Restore document to specific version
   - Create audit log entry
   - Re-process embeddings if needed
   - Request body:
   ```json
   {
     "versionId": "uuid",
     "reason": "Reverting incorrect information",
     "notifyWorkspaces": true
   }
   ```

4. **GET /api/v1/admin/documents/changes** (45 mins)
   - Recent changes across all documents
   - Filter by date, user, change type
   - Include before/after preview

5. **Database Schema Updates** (30 mins)
   - Add document_versions table
   - Create version tracking triggers
   - Index for efficient queries

### Task 3: Chat Testing API (3-4 hours)
Create endpoints for testing chat responses without affecting production data.

#### Subtasks:
1. **POST /api/v1/admin/chat/test** (1.5 hours)
   - Test chat response generation
   - Compare different model outputs
   - No logging to chat history
   - Request format:
   ```json
   {
     "message": "What are your return policies?",
     "workspaceId": 1,
     "models": ["gpt-3.5-turbo", "gpt-4"],
     "includeDebugInfo": true,
     "testPromptVariations": true
   }
   ```

2. **POST /api/v1/admin/chat/test/batch** (1 hour)
   - Batch test multiple queries
   - CSV upload support
   - Parallel processing
   - Export results

3. **GET /api/v1/admin/chat/test/history** (45 mins)
   - Retrieve test session history
   - Filter by date, user, workspace
   - Include performance metrics

4. **POST /api/v1/admin/chat/analyze** (45 mins)
   - Analyze response quality
   - Check source attribution accuracy
   - Validate business rule application
   - Confidence score validation

### Task 4: Enhanced Document Management APIs (2-3 hours)
Extend existing document APIs with admin-specific bulk operations.

#### Subtasks:
1. **POST /api/v1/admin/documents/bulk-update** (1 hour)
   - Update multiple documents metadata
   - Category reassignment
   - Priority changes
   - Sync schedule updates

2. **DELETE /api/v1/admin/documents/bulk** (45 mins)
   - Safe bulk deletion with confirmations
   - Workspace notification
   - Embedding cleanup
   - Audit logging

3. **POST /api/v1/admin/documents/merge** (45 mins)
   - Merge duplicate documents
   - Combine embeddings
   - Update references
   - Preserve version history

4. **GET /api/v1/admin/documents/duplicates** (30 mins)
   - Find potential duplicate content
   - Similarity scoring
   - Merge recommendations

### Task 5: Analytics and Monitoring APIs (2 hours)
Provide insights into knowledge base usage and performance.

#### Subtasks:
1. **GET /api/v1/admin/analytics/knowledge** (45 mins)
   - Document usage statistics
   - Popular search queries
   - Category performance
   - Response accuracy trends

2. **GET /api/v1/admin/analytics/sync-status** (30 mins)
   - Sync job monitoring
   - Failed sync reports
   - Schedule adherence
   - Source availability

3. **GET /api/v1/admin/analytics/performance** (30 mins)
   - Query response times
   - Embedding generation stats
   - Cache hit rates
   - System resource usage

4. **POST /api/v1/admin/analytics/export** (15 mins)
   - Export analytics data
   - Multiple format support
   - Scheduled reports

## Implementation Order
1. Knowledge Base Content API (establishes foundation)
2. Enhanced Document Management APIs (builds on existing)
3. Content Version Control API (adds history tracking)
4. Chat Testing API (validates knowledge quality)
5. Analytics and Monitoring APIs (provides insights)

## Data Models

### DocumentVersion Schema
```prisma
model DocumentVersion {
  id            String   @id @default(cuid())
  documentId    Int
  content       Json
  metadata      Json?
  changeType    String   // created, updated, deleted
  changeReason  String?
  userId        Int?
  createdAt     DateTime @default(now())
  
  document      Document @relation(fields: [documentId], references: [id])
  user          User?    @relation(fields: [userId], references: [id])
}
```

### ChatTestSession Schema
```prisma
model ChatTestSession {
  id            String   @id @default(cuid())
  query         String
  workspaceId   Int
  models        Json     // Array of models tested
  responses     Json     // Model responses
  metrics       Json     // Performance metrics
  userId        Int
  createdAt     DateTime @default(now())
  
  workspace     Workspace @relation(fields: [workspaceId], references: [id])
  user          User      @relation(fields: [userId], references: [id])
}
```

## Integration Points

### Existing Systems
- **Document Model**: Extend with version tracking
- **Product Model**: Enhance bulk operations
- **Workspace Model**: Add test mode support
- **EventLogs**: Comprehensive admin action logging

### External Services
- **Vector Database**: Bulk operations support
- **LLM Providers**: Test mode configuration
- **Cache Layer**: Admin-specific caching strategies

## Testing Requirements

### Unit Tests
- All endpoint input validation
- Business logic for each operation
- Error handling scenarios
- Permission checks

### Integration Tests
- End-to-end API workflows
- Database transaction handling
- Cache invalidation
- File system operations

### Performance Tests
- Bulk operation limits
- Concurrent request handling
- Large dataset queries
- Cache effectiveness

## Security Considerations
- Admin-only authentication required
- Rate limiting: 100 requests/minute
- Input sanitization for all endpoints
- Audit logging for all operations
- Separate test database for chat testing

## Success Criteria
1. ✅ All 5 API endpoint groups implemented and tested
2. ✅ Response times < 200ms for standard queries
3. ✅ Bulk operations handle 1000+ items efficiently
4. ✅ Version control tracks all document changes
5. ✅ Chat testing provides actionable insights
6. ✅ Analytics deliver real-time metrics
7. ✅ 100% test coverage for critical paths
8. ✅ Comprehensive Swagger documentation
9. ✅ Admin audit trail for all operations
10. ✅ Zero breaking changes to existing APIs

## Estimated Timeline
- **Day 1 (8 hours)**:
  - Knowledge Base Content API: 4 hours
  - Enhanced Document Management APIs: 2 hours
  - Content Version Control API (start): 2 hours

- **Day 2 (8 hours)**:
  - Content Version Control API (complete): 2 hours
  - Chat Testing API: 4 hours
  - Analytics and Monitoring APIs: 2 hours

**Total: 16 hours over 2 days**

## Risk Mitigation
- **Performance**: Implement caching early, use database indexes
- **Data Integrity**: Comprehensive transaction handling
- **Backwards Compatibility**: Extend rather than modify existing APIs
- **Testing Overhead**: Reuse existing test utilities where possible

## Notes
- Build upon existing `/v1/document/` and `/v1/products/` endpoints
- Maintain consistency with AnythingLLM's architecture
- Focus on admin workflows for efficient knowledge management
- Ensure all operations are reversible where applicable