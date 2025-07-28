# Phase 1.2: RAG Implementation Task Breakdown

**Branch**: `backend_phase1p2_rag_system`  
**Timeline**: Days 3-4 (16 hours)  
**Goal**: Multi-source data ingestion and enhanced RAG implementation  
**Created**: 2025-01-28

## Executive Summary

Phase 1.2 extends AnythingLLM's existing document processing and vector search capabilities to support multi-source data ingestion with enhanced retrieval features. The implementation leverages AnythingLLM's modular architecture, requiring minimal schema changes while adding powerful new capabilities for B2B e-commerce use cases.

## Technical Architecture Overview

### Current State
- **Document Processing**: Modular pipeline with support for PDF, DOCX, TXT, etc.
- **Vector Storage**: Multi-provider support (PGVector, Pinecone, etc.) with caching
- **Sync Infrastructure**: Existing DocumentSyncQueue for automated updates
- **Metadata System**: Flexible JSON metadata fields on documents

### Target State
- **Multi-Source Tracking**: Source attribution for every document chunk
- **Enhanced Retrieval**: Category filtering, relevance scoring, confidence metrics
- **Sync Scheduling**: Per-source update schedules with webhook support
- **Query Logging**: Foundation for LLM-as-judge evaluation

## Day 3: Document Ingestion Enhancement (8 hours)

### 3.1 Multi-Source Document Upload Extension (2 hours)
**Complexity**: Medium  
**Dependencies**: None  
**Files to Modify**:
- `server/endpoints/document.js`
- `collector/processSingleFile/index.js`
- `server/models/documents.js`

**Tasks**:
- [ ] Add source metadata fields to document upload API
- [ ] Extend `processDocument()` to capture source information
- [ ] Update document creation to include:
  - `sourceType`: 'manual', 'api', 'sync', 'webhook'
  - `sourceUrl`: Original source URL/identifier
  - `syncEnabled`: Boolean for auto-updates
  - `categories`: Array of category tags
- [ ] Add validation for source metadata
- [ ] Update existing document processor to preserve backward compatibility

**Implementation Details**:
```javascript
// Extend POST /api/workspace/:slug/documents
{
  "files": [...],
  "sourceMetadata": {
    "type": "manual|api|sync",
    "url": "https://source.url",
    "syncSchedule": "daily|weekly|realtime",
    "categories": ["policies", "faqs"]
  }
}
```

### 3.2 Product Catalog CSV/JSON Parser (2 hours)
**Complexity**: Medium  
**Dependencies**: 3.1  
**Files to Create**:
- `collector/processSingleFile/convert/asCatalog.js`
- `server/utils/parsers/productCatalog.js`

**Tasks**:
- [ ] Create CSV parser for product data with field mapping
- [ ] Implement JSON catalog parser with schema validation
- [ ] Extract structured product information:
  - SKU, name, description, price
  - Categories, tags, specifications
  - Image URLs, documentation links
- [ ] Convert products to searchable documents
- [ ] Handle batch processing for large catalogs (1000+ products)
- [ ] Add progress tracking for UI feedback

**Schema Support**:
```javascript
// Flexible field mapping configuration
{
  "csv_mapping": {
    "sku": "Product ID",
    "name": "Product Name",
    "description": "Description",
    "price": "Price",
    "category": "Category"
  }
}
```

### 3.3 PDF Link Extraction from Spreadsheets (1.5 hours)
**Complexity**: Low  
**Dependencies**: 3.2  
**Files to Modify**:
- `collector/processSingleFile/convert/asXlsx.js`
- `collector/utils/files/index.js`

**Tasks**:
- [ ] Scan Excel/CSV cells for PDF URLs during processing
- [ ] Queue discovered PDFs for download and processing
- [ ] Maintain parent-child document relationships
- [ ] Handle authentication for protected PDFs
- [ ] Add retry logic for failed downloads
- [ ] Track processing status for linked documents

**Implementation Pattern**:
```javascript
// Extend Excel processor to extract PDF links
function extractPDFLinks(worksheet) {
  const pdfLinks = [];
  // Scan cells for URLs ending in .pdf
  // Queue for background processing
  return pdfLinks;
}
```

### 3.4 FAQ Structure Recognition (1.5 hours)
**Complexity**: Medium  
**Dependencies**: None  
**Files to Create**:
- `server/utils/parsers/faqDetector.js`

**Tasks**:
- [ ] Implement pattern recognition for Q&A formats
- [ ] Support multiple FAQ patterns:
  - "Q: ... A: ..."
  - "Question: ... Answer: ..."
  - Numbered lists with consistent structure
- [ ] Extract question-answer pairs as separate chunks
- [ ] Preserve FAQ context in metadata
- [ ] Add confidence scoring for pattern matches
- [ ] Handle multi-paragraph answers

**Pattern Examples**:
```javascript
const FAQ_PATTERNS = [
  /Q:\s*(.+?)\s*A:\s*(.+)/,
  /Question:\s*(.+?)\s*Answer:\s*(.+)/,
  /\d+\.\s*(.+?)\?\s*(.+)/
];
```

### 3.5 Sync Schedule Configuration (1 hour)
**Complexity**: Low  
**Dependencies**: 3.1  
**Files to Modify**:
- `server/models/documentSyncQueue.js`
- `server/jobs/sync-watched-documents.js`

**Tasks**:
- [ ] Extend DocumentSyncQueue model with schedule options
- [ ] Add cron-like scheduling support:
  - Hourly, Daily, Weekly options
  - Custom cron expressions
  - Timezone handling
- [ ] Implement per-source sync configuration
- [ ] Add sync status tracking and history
- [ ] Create sync management API endpoints

**Configuration Schema**:
```javascript
{
  "syncSchedule": {
    "frequency": "hourly|daily|weekly|custom",
    "customCron": "0 */6 * * *",
    "timezone": "UTC",
    "enabled": true
  }
}
```

### 3.6 Query/Response Logging System (1 hour)
**Complexity**: Low  
**Dependencies**: None  
**Files to Create**:
- `server/models/queryLogs.js`
- `server/utils/logging/queryLogger.js`

**Tasks**:
- [ ] Create query_logs table schema
- [ ] Log all chat queries with metadata:
  - Query text, timestamp, workspace
  - Retrieved documents and scores
  - Response text and confidence
  - User feedback (if provided)
- [ ] Add privacy controls for sensitive data
- [ ] Implement log retention policies
- [ ] Create export functionality for analysis

**Schema Design**:
```sql
CREATE TABLE query_logs (
  id SERIAL PRIMARY KEY,
  workspace_id INTEGER,
  query TEXT,
  retrieved_docs JSONB,
  response TEXT,
  confidence FLOAT,
  created_at TIMESTAMP
);
```

## Day 4: Vector Search Enhancement (8 hours)

### 4.1 Source Attribution in Embeddings (2 hours)
**Complexity**: Medium  
**Dependencies**: Day 3 tasks  
**Files to Modify**:
- `server/utils/vectorDbProviders/[provider]/index.js`
- `server/utils/chats/index.js`

**Tasks**:
- [ ] Extend vector metadata with source information
- [ ] Modify embedding process to include:
  - Source document ID
  - Source type and URL
  - Last update timestamp
  - Confidence score
- [ ] Update retrieval to return source metadata
- [ ] Implement source deduplication in results
- [ ] Add source weighting configuration

**Metadata Structure**:
```javascript
{
  "text": "chunk content",
  "metadata": {
    "source": "products.csv",
    "sourceType": "csv",
    "sourceUrl": "https://...",
    "docId": "uuid",
    "lastUpdated": "2025-01-28",
    "categories": ["electronics"]
  }
}
```

### 4.2 Category-Based Filtering (2 hours)
**Complexity**: Medium  
**Dependencies**: 4.1  
**Files to Modify**:
- `server/utils/vectorDbProviders/[provider]/index.js`
- `server/utils/chats/index.js`

**Tasks**:
- [ ] Add category metadata to vector storage
- [ ] Implement pre-filtering by categories:
  - Include/exclude specific categories
  - Category priority weighting
  - Dynamic category detection
- [ ] Create category management APIs
- [ ] Add category suggestions based on content
- [ ] Support hierarchical categories

**Filter Implementation**:
```javascript
// Category filter in similarity search
async function searchWithCategories(query, categories = []) {
  const filter = categories.length > 0 
    ? { categories: { $in: categories } }
    : {};
  return await vectorDb.similaritySearch(query, filter);
}
```

### 4.3 Relevance Scoring Algorithm (2 hours)
**Complexity**: High  
**Dependencies**: 4.1, 4.2  
**Files to Create**:
- `server/utils/scoring/relevanceScorer.js`

**Tasks**:
- [ ] Implement multi-factor scoring:
  - Semantic similarity (0.4 weight)
  - Source freshness (0.2 weight)
  - Category match (0.2 weight)
  - Document popularity (0.1 weight)
  - Source authority (0.1 weight)
- [ ] Add configurable scoring weights
- [ ] Create score explanation system
- [ ] Implement score normalization
- [ ] Add A/B testing support for scoring

**Scoring Algorithm**:
```javascript
function calculateRelevance(chunk, query, context) {
  const semanticScore = chunk.similarity;
  const freshnessScore = calculateFreshness(chunk.lastUpdated);
  const categoryScore = calculateCategoryMatch(chunk.categories, context.categories);
  const authorityScore = SOURCE_WEIGHTS[chunk.sourceType] || 0.5;
  
  return {
    total: weighted_sum(scores, weights),
    breakdown: { semantic, freshness, category, authority }
  };
}
```

### 4.4 Fallback Response System (1 hour)
**Complexity**: Low  
**Dependencies**: 4.3  
**Files to Create**:
- `server/utils/responses/fallbackHandler.js`

**Tasks**:
- [ ] Define confidence thresholds for responses
- [ ] Create fallback response templates:
  - "I don't have specific information about..."
  - "Based on available data, I can tell you..."
  - Suggest related topics
- [ ] Implement escalation to human support
- [ ] Add configuration for fallback behavior
- [ ] Track fallback usage for gap analysis

**Fallback Logic**:
```javascript
function handleLowConfidenceResponse(results, query) {
  if (results.maxScore < 0.5) {
    return {
      response: generateFallbackResponse(query),
      suggestedTopics: findRelatedTopics(query),
      escalateToHuman: true
    };
  }
}
```

### 4.5 Multi-Source Retrieval Optimization (1 hour)
**Complexity**: Medium  
**Dependencies**: All Day 4 tasks  
**Files to Modify**:
- `server/utils/chats/index.js`
- `server/utils/vectorDbProviders/[provider]/index.js`

**Tasks**:
- [ ] Implement parallel retrieval from multiple sources
- [ ] Add source diversity requirements:
  - Ensure results from different source types
  - Prevent single-source dominance
- [ ] Optimize retrieval performance:
  - Implement result caching
  - Add query result pagination
  - Use connection pooling
- [ ] Create retrieval analytics

**Optimization Strategy**:
```javascript
async function diversifiedRetrieval(query, options) {
  // Retrieve from each source type
  const results = await Promise.all([
    retrieveFromProducts(query, limit = 3),
    retrieveFromPolicies(query, limit = 2),
    retrieveFromFAQs(query, limit = 2)
  ]);
  
  return mergeAndRank(results, options.diversity);
}
```

## Testing Requirements

### Unit Tests (2 hours throughout)
- [ ] Document parser tests for each format
- [ ] Source attribution verification
- [ ] Category filtering accuracy
- [ ] Relevance scoring validation
- [ ] Fallback trigger conditions

### Integration Tests
- [ ] End-to-end document ingestion flow
- [ ] Multi-source retrieval accuracy
- [ ] Performance benchmarks:
  - < 500ms for retrieval
  - < 2s for document processing
  - Support 50+ concurrent queries

### Test Data Requirements
- Sample product catalogs (CSV/JSON)
- FAQ documents in various formats
- Mixed-source knowledge base
- Category hierarchies

## Configuration & Deployment

### Environment Variables
```bash
# Multi-source configuration
ENABLE_MULTI_SOURCE=true
MAX_SYNC_WORKERS=4
DEFAULT_SYNC_SCHEDULE=daily
SOURCE_ATTRIBUTION=true

# Performance tuning
VECTOR_CACHE_TTL=3600
MAX_RETRIEVAL_SOURCES=5
CONFIDENCE_THRESHOLD=0.5
```

### Database Migrations
```sql
-- Add source tracking to documents
ALTER TABLE workspace_documents 
ADD COLUMN source_type VARCHAR(50),
ADD COLUMN source_url TEXT,
ADD COLUMN sync_enabled BOOLEAN DEFAULT false,
ADD COLUMN last_sync_at TIMESTAMP,
ADD COLUMN categories JSONB;

-- Create query logs table
CREATE TABLE query_logs (
  id SERIAL PRIMARY KEY,
  workspace_id INTEGER REFERENCES workspaces(id),
  query TEXT NOT NULL,
  retrieved_docs JSONB,
  response TEXT,
  confidence FLOAT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_query_logs_workspace ON query_logs(workspace_id);
CREATE INDEX idx_documents_source_type ON workspace_documents(source_type);
```

## Risk Mitigation

### Technical Risks
1. **Vector DB Performance**
   - Risk: Slower retrieval with metadata filtering
   - Mitigation: Implement caching, optimize indexes

2. **Large Catalog Processing**
   - Risk: Memory issues with 10k+ products
   - Mitigation: Streaming parser, batch processing

3. **Source Sync Failures**
   - Risk: Stale data from failed syncs
   - Mitigation: Retry logic, failure notifications

### Performance Considerations
- Implement request queuing for large imports
- Use database transactions for consistency
- Add circuit breakers for external sources
- Monitor vector DB query performance

## Success Criteria

### Functional Requirements
- ✅ Support 5+ document formats with source tracking
- ✅ Process 1000+ product catalog in < 5 minutes
- ✅ Retrieve with source attribution in < 500ms
- ✅ Category filtering reduces results by 70%+
- ✅ Fallback responses for low confidence queries

### Performance Targets
- Document processing: < 2s per document
- Retrieval latency: < 500ms (p95)
- Concurrent queries: 50+ simultaneous
- Source sync: < 10 minutes for full catalog

### Quality Metrics
- Source attribution accuracy: 100%
- Category classification: 85%+ accuracy
- Relevance improvement: 20%+ over baseline
- Fallback rate: < 5% of queries

## Next Steps

### Immediate Actions (Post-Implementation)
1. Run comprehensive test suite
2. Performance profiling and optimization
3. Documentation update
4. Prepare for Phase 1.3 (Knowledge-Focused Prompts)

### Future Enhancements
1. Machine learning for category detection
2. Advanced source quality scoring
3. Real-time sync via webhooks
4. Multi-language support preparation

---

**Last Updated**: 2025-01-28  
**Status**: Ready for Implementation  
**Estimated Completion**: 16 hours (2 days)