# AnythingLLM Backend Technical Report
## Phase 1 Implementation Summary for Frontend Development

**Generated**: January 31, 2025  
**Purpose**: Document backend components and APIs available for frontend visual testing  
**Status**: Phase 1.1-1.4 Complete, Ready for Frontend Integration

---

## Table of Contents
1. [Overview](#overview)
2. [Core API Endpoints](#core-api-endpoints)
3. [Authentication & Security](#authentication--security)
4. [Data Models](#data-models)
5. [Key Features Implemented](#key-features-implemented)
6. [Integration Points](#integration-points)
7. [Testing Considerations](#testing-considerations)

---

## Overview

AnythingLLM has been enhanced into a B2B e-commerce chat solution with comprehensive backend APIs. The implementation follows a phased approach with Phase 1 (MVP) now complete, providing:

- **Multi-source knowledge management** with RAG capabilities
- **Product information queries** and catalog management
- **Administrative APIs** for bulk operations and testing
- **Enhanced chat system** with multi-model support
- **Real-time data synchronization** foundations

### Technology Stack
- **Backend**: Node.js with Express
- **Database**: SQLite (via Prisma ORM)
- **Vector Store**: Multiple providers supported (Pinecone, ChromaDB, etc.)
- **Authentication**: JWT tokens + API keys
- **LLM Providers**: OpenAI, Anthropic, and others via unified interface

---

## Core API Endpoints

### 1. Authentication & Authorization
```javascript
// Base authentication headers required for all API calls
{
  "Authorization": "Bearer {jwt_token}"
}
```

**Endpoints**:
- `POST /api/v1/auth/login` - User authentication
- `POST /api/v1/auth/logout` - Session termination
- `GET /api/v1/auth/me` - Current user info
- `POST /api/v1/auth/api-key` - Generate API keys

### 2. Workspace Management
**Base**: `/api/v1/workspaces`

```javascript
// Core workspace operations
GET    /api/v1/workspaces              // List all workspaces
POST   /api/v1/workspaces/new          // Create workspace
GET    /api/v1/workspaces/:slug        // Get workspace details
POST   /api/v1/workspaces/:slug/update // Update workspace
DELETE /api/v1/workspaces/:slug        // Delete workspace
```

**Workspace Features**:
- Isolated knowledge bases per workspace
- Custom LLM settings per workspace
- User access control
- Chat history management

### 3. Chat API
**Base**: `/api/v1/workspace/:slug/chat`

```javascript
// Chat operations
POST /api/v1/workspace/:slug/chat      // Send message & get response
GET  /api/v1/workspace/:slug/chats     // Get chat history
POST /api/v1/workspace/:slug/stream-chat // Streaming responses
```

**Chat Features**:
- Multi-model support (GPT-3.5, GPT-4, Claude, etc.)
- Streaming responses via SSE
- Context-aware responses using RAG
- Source attribution in responses

### 4. Document Management API
**Base**: `/api/v1/documents`

```javascript
// Document operations
POST   /api/v1/documents/upload         // Upload documents
GET    /api/v1/documents                // List documents
DELETE /api/v1/documents/:id            // Delete document
POST   /api/v1/documents/update-metadata // Update document metadata
```

**Supported File Types**:
- PDF, DOCX, TXT
- CSV with product data
- JSON catalogs
- Web page scraping via URL

### 5. Admin Knowledge Base API (Phase 1.4)
**Base**: `/api/v1/admin/knowledge`

```javascript
// Knowledge management
GET  /api/v1/admin/knowledge           // Paginated knowledge list
GET  /api/v1/admin/knowledge/search    // Advanced search
GET  /api/v1/admin/knowledge/:id       // Document details
GET  /api/v1/admin/knowledge/stats     // Analytics & statistics
POST /api/v1/admin/knowledge/validate  // Integrity validation
```

**Features**:
- Advanced filtering (category, source, workspace)
- Full-text search with relevance scoring
- Growth trends and health metrics
- Automatic issue detection

### 6. Admin Document Operations API
**Base**: `/api/v1/admin/documents`

```javascript
// Bulk operations
POST   /api/v1/admin/documents/bulk-update  // Update multiple docs
DELETE /api/v1/admin/documents/bulk         // Bulk deletion
POST   /api/v1/admin/documents/merge        // Merge duplicates
GET    /api/v1/admin/documents/duplicates   // Find duplicates
```

**Safety Features**:
- Confirmation required for large operations
- Audit logging for all admin actions
- Workspace notifications on changes

### 7. Chat Testing API
**Base**: `/api/v1/admin/chat`

```javascript
// Testing endpoints
POST /api/v1/admin/chat/test           // Test single query
POST /api/v1/admin/chat/test/batch     // Batch testing
GET  /api/v1/admin/chat/test/history   // Test history
POST /api/v1/admin/chat/analyze        // Quality analysis
```

**Testing Capabilities**:
- Multi-model comparison
- Response quality scoring
- Performance metrics
- Debug information

### 8. Product Catalog API
**Base**: `/api/v1/products`

```javascript
// Product operations
POST /api/v1/products/import           // Import catalog
GET  /api/v1/products                  // List products
GET  /api/v1/products/:id              // Product details
GET  /api/v1/products/search           // Search products
```

---

## Authentication & Security

### JWT Token Flow
1. User logs in with credentials
2. Server returns JWT token (24hr expiry)
3. Client includes token in Authorization header
4. Server validates token on each request

### API Key Authentication
- Generated per user for programmatic access
- No expiry (manually revoked)
- Scoped permissions available
- Rate limiting enforced

### Security Features
- Input validation on all endpoints
- SQL injection prevention via Prisma
- XSS protection
- Rate limiting (100 req/min default)
- Audit logging for sensitive operations

---

## Data Models

### 1. Workspace Model
```javascript
{
  id: number,
  name: string,
  slug: string,
  createdAt: timestamp,
  openAiTemp: float,
  openAiModel: string,
  openAiHistory: number,
  lastUpdatedAt: timestamp,
  users: User[],
  documents: Document[]
}
```

### 2. Document Model
```javascript
{
  id: number,
  docId: string,
  filename: string,
  docpath: string,
  workspaceId: number,
  metadata: {
    title: string,
    category: string,
    sourceType: string,
    sourceUrl: string,
    lastSync: timestamp
  },
  createdAt: timestamp,
  lastUpdatedAt: timestamp
}
```

### 3. Chat Model
```javascript
{
  id: number,
  workspaceId: number,
  prompt: string,
  response: text,
  sources: object[],
  model: string,
  createdAt: timestamp,
  user: User,
  feedback: boolean
}
```

### 4. Vector/Embedding Model
```javascript
{
  id: number,
  docId: string,
  vectorId: string,
  text: string,
  metadata: {
    sourceDocument: string,
    chunkIndex: number,
    totalChunks: number
  }
}
```

---

## Key Features Implemented

### Phase 1.1: Core Infrastructure ✅
- Basic chat API with workspace isolation
- JWT authentication system
- API key management for widgets
- Webhook receiver for real-time updates
- Multi-source data tracking schema

### Phase 1.2: RAG System ✅
- Document upload and processing pipeline
- Vector embeddings with source attribution
- Semantic search with category filtering
- Relevance scoring and fallback responses
- CSV/Excel parsing with link extraction

### Phase 1.3: Knowledge Prompts ✅
- Context-aware prompt engineering
- Source citation in responses
- Confidence scoring system
- Follow-up question generation
- "I don't know" handling for accuracy

### Phase 1.4: Admin APIs ✅
- Comprehensive knowledge management
- Bulk document operations
- Chat testing without logging
- Quality analysis and metrics
- 13 new admin endpoints

---

## Integration Points

### 1. Vector Database
- **Providers**: Pinecone, ChromaDB, Weaviate, QDrant
- **Operations**: Add, search, update, delete embeddings
- **Features**: Namespace isolation per workspace

### 2. LLM Providers
- **OpenAI**: GPT-3.5, GPT-4
- **Anthropic**: Claude models
- **Local**: Ollama, LM Studio
- **Features**: Unified interface, per-workspace config

### 3. File Processing
- **Document Parser**: Handles multiple formats
- **Chunking**: Smart text splitting
- **Metadata**: Extraction and preservation
- **Queue**: Background processing for large files

### 4. External Webhooks
- **Endpoint**: `/api/v1/webhook/receive`
- **Events**: Document updates, sync status
- **Format**: JSON with HMAC signatures
- **Retry**: Exponential backoff

---

## Testing Considerations

### Frontend Testing Requirements
1. **Authentication Flow**
   - Login/logout functionality
   - Token refresh handling
   - API key generation UI

2. **Workspace Operations**
   - Create/edit/delete workspaces
   - Switch between workspaces
   - Workspace settings management

3. **Chat Interface**
   - Message sending/receiving
   - Streaming response display
   - Source attribution viewing
   - Multi-model selection

4. **Document Management**
   - File upload (drag & drop)
   - Bulk upload progress
   - Document listing/filtering
   - Metadata editing

5. **Admin Features**
   - Knowledge base browser
   - Search functionality
   - Bulk operations UI
   - Analytics dashboards

### Performance Targets
- Chat response: <2s initial response
- Document upload: 10MB/s minimum
- Search queries: <500ms
- Bulk operations: 100 items in <5s

### Error Handling
All APIs return consistent error format:
```json
{
  "success": false,
  "error": "Error message",
  "details": { ... }  // Optional
}
```

### Rate Limits
- Standard users: 100 requests/minute
- Admin operations: 50 requests/minute
- Bulk operations: 10 requests/minute
- File uploads: 20 files/minute

---

## Next Steps for Frontend

1. **Setup Development Environment**
   - Clone existing frontend structure
   - Configure API_BASE URL
   - Setup authentication flow

2. **Implement Core Features**
   - Workspace selection UI
   - Basic chat interface
   - Document upload component
   - Knowledge browser

3. **Add Admin Testing Tools**
   - Bulk operation interfaces
   - Chat testing panel
   - Analytics viewers
   - System health dashboard

4. **Validate Integration**
   - Test all API endpoints
   - Verify error handling
   - Check performance targets
   - Ensure security compliance

---

## Conclusion

The backend provides a comprehensive API surface for building a feature-rich frontend testing interface. All Phase 1 features are implemented and tested, with clear documentation and consistent patterns throughout. The frontend can leverage these APIs to validate the complete B2B e-commerce chat solution functionality.