/**
 * @fileoverview Test suite for Phase 1.4 Admin API Endpoints
 * Tests knowledge management, document operations, and chat testing functionality
 */

const request = require('supertest');
const express = require('express');
const { adminKnowledgeEndpoints } = require('../../../endpoints/api/admin/knowledge');
const { adminDocumentEndpoints } = require('../../../endpoints/api/admin/documents');
const { adminChatTestingEndpoints } = require('../../../endpoints/api/admin/chat-testing');

// Mock dependencies
jest.mock('../../../models/documents');
jest.mock('../../../models/workspace');
jest.mock('../../../models/eventLogs');
jest.mock('../../../utils/middleware/validApiKey');
jest.mock('../../../utils/http');
jest.mock('../../../utils/helpers');

const { Document } = require('../../../models/documents');
const { Workspace } = require('../../../models/workspace');
const { EventLogs } = require('../../../models/eventLogs');
const { validApiKey } = require('../../../utils/middleware/validApiKey');
const { reqBody, safeJsonParse } = require('../../../utils/http');

describe('Phase 1.4 Admin API Endpoints', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    
    // Initialize endpoints
    adminKnowledgeEndpoints(app);
    adminDocumentEndpoints(app);
    adminChatTestingEndpoints(app);
    
    // Mock middleware to always pass
    validApiKey.mockImplementation((req, res, next) => next());
    reqBody.mockImplementation((req) => req.body);
    safeJsonParse.mockImplementation((str, defaultValue) => {
      try {
        return typeof str === 'string' ? JSON.parse(str) : str || defaultValue;
      } catch {
        return defaultValue;
      }
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Knowledge Base API', () => {
    describe('GET /v1/admin/knowledge', () => {
      beforeEach(() => {
        Document.count = jest.fn().mockResolvedValue(150);
        Document.where = jest.fn().mockResolvedValue([
          {
            id: 1,
            docpath: 'test-doc.pdf',
            category: 'documentation',
            sourceType: 'manual_upload',
            workspaceId: 1,
            workspace: { name: 'Test Workspace', slug: 'test' },
            createdAt: new Date(),
            updatedAt: new Date(),
            metadata: JSON.stringify({
              title: 'Test Document',
              wordCount: 500,
              token_count_estimate: 750
            }),
            priority: 1,
            pinned: false,
            watched: false
          }
        ]);
        EventLogs.logEvent = jest.fn().mockResolvedValue(true);
      });

      it('should return paginated knowledge base content', async () => {
        const response = await request(app)
          .get('/v1/admin/knowledge')
          .query({ page: 1, limit: 20 });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.documents).toHaveLength(1);
        expect(response.body.pagination).toEqual({
          page: 1,
          limit: 20,
          total: 150,
          totalPages: 8,
          hasNextPage: true,
          hasPrevPage: false
        });
        expect(response.body.stats).toBeDefined();
        expect(response.body.stats.totalDocuments).toBe(150);
      });

      it('should handle filtering by category', async () => {
        const response = await request(app)
          .get('/v1/admin/knowledge')
          .query({ category: 'documentation', limit: 10 });

        expect(response.status).toBe(200);
        expect(Document.where).toHaveBeenCalledWith(
          expect.objectContaining({ category: 'documentation' }),
          10,
          { createdAt: 'desc' },
          expect.any(Object)
        );
      });

      it('should handle search queries', async () => {
        const response = await request(app)
          .get('/v1/admin/knowledge')
          .query({ search: 'test document' });

        expect(response.status).toBe(200);
        expect(Document.where).toHaveBeenCalledWith(
          expect.objectContaining({
            OR: expect.arrayContaining([
              { docpath: { contains: 'test document' } },
              { metadata: { contains: 'test document' } }
            ])
          }),
          expect.any(Number),
          expect.any(Object),
          expect.any(Object)
        );
      });

      it('should log admin access', async () => {
        await request(app).get('/v1/admin/knowledge');
        
        expect(EventLogs.logEvent).toHaveBeenCalledWith(
          'admin_knowledge_accessed',
          expect.objectContaining({
            page: 1,
            limit: 20,
            totalReturned: 1
          })
        );
      });
    });

    describe('GET /v1/admin/knowledge/search', () => {
      beforeEach(() => {
        Document.where = jest.fn().mockResolvedValue([
          {
            id: 1,
            docpath: 'search-result.pdf',
            category: 'documentation',
            sourceType: 'manual_upload',
            workspaceId: 1,
            workspace: { name: 'Test Workspace', slug: 'test' },
            createdAt: new Date(),
            updatedAt: new Date(),
            metadata: JSON.stringify({
              title: 'Search Result Document',
              description: 'A document for search testing',
              wordCount: 300
            })
          }
        ]);
      });

      it('should perform advanced search with relevance scoring', async () => {
        const response = await request(app)
          .get('/v1/admin/knowledge/search')
          .query({ q: 'search document', limit: 10 });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.query).toBe('search document');
        expect(response.body.results).toHaveLength(1);
        expect(response.body.results[0]).toHaveProperty('relevanceScore');
        expect(response.body.results[0]).toHaveProperty('snippet');
      });

      it('should require search query', async () => {
        const response = await request(app)
          .get('/v1/admin/knowledge/search');

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Search query is required');
      });

      it('should handle category filtering in search', async () => {
        const response = await request(app)
          .get('/v1/admin/knowledge/search')
          .query({ q: 'test', category: 'documentation' });

        expect(response.status).toBe(200);
        expect(Document.where).toHaveBeenCalledWith(
          expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({
                OR: expect.any(Array)
              }),
              { category: 'documentation' }
            ])
          }),
          expect.any(Number),
          expect.any(Object),
          expect.any(Object)
        );
      });
    });

    describe('GET /v1/admin/knowledge/:id', () => {
      beforeEach(() => {
        Document.get = jest.fn().mockResolvedValue({
          id: 1,
          docpath: 'detailed-doc.pdf',
          category: 'documentation',
          sourceType: 'manual_upload',
          workspaceId: 1,
          priority: 1,
          pinned: false,
          watched: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastUpdatedAt: new Date(),
          metadata: JSON.stringify({
            title: 'Detailed Document',
            description: 'A document with full details',
            wordCount: 800,
            token_count_estimate: 1200,
            chunkCount: 5
          }),
          syncMetadata: JSON.stringify({
            status: 'synced',
            lastSync: new Date().toISOString(),
            errorCount: 0
          }),
          businessContext: JSON.stringify({
            rules: ['rule1', 'rule2']
          })
        });

        Workspace.get = jest.fn().mockResolvedValue({
          id: 1,
          name: 'Test Workspace',
          slug: 'test'
        });
      });

      it('should return detailed document information', async () => {
        const response = await request(app)
          .get('/v1/admin/knowledge/1');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.document).toBeDefined();
        expect(response.body.document.id).toBe(1);
        expect(response.body.document.filename).toBe('Detailed Document');
        expect(response.body.document.metadata).toBeDefined();
        expect(response.body.document.syncInfo).toBeDefined();
        expect(response.body.document.businessContext).toBeDefined();
        expect(response.body.document.versionInfo).toBeDefined();
      });

      it('should handle invalid document ID', async () => {
        const response = await request(app)
          .get('/v1/admin/knowledge/invalid');

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Invalid document ID');
      });

      it('should handle document not found', async () => {
        Document.get.mockResolvedValue(null);

        const response = await request(app)
          .get('/v1/admin/knowledge/999');

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Document not found');
      });
    });

    describe('GET /v1/admin/knowledge/stats', () => {
      beforeEach(() => {
        const mockDocuments = [
          {
            id: 1,
            category: 'documentation',
            sourceType: 'manual_upload',
            workspaceId: 1,
            createdAt: new Date(),
            metadata: JSON.stringify({ wordCount: 500, token_count_estimate: 750 }),
            syncMetadata: JSON.stringify({ status: 'synced', errorCount: 0 })
          },
          {
            id: 2,
            category: 'faq',
            sourceType: 'api_sync',
            workspaceId: 1,
            createdAt: new Date(),
            metadata: JSON.stringify({ wordCount: 300, token_count_estimate: 450 }),
            syncMetadata: JSON.stringify({ status: 'pending', errorCount: 1 })
          }
        ];

        Document.where = jest.fn()
          .mockResolvedValueOnce(mockDocuments) // All documents
          .mockResolvedValueOnce(mockDocuments.slice(0, 1)); // Recent documents
      });

      it('should return comprehensive statistics', async () => {
        const response = await request(app)
          .get('/v1/admin/knowledge/stats')
          .query({ period: '30d' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.stats).toBeDefined();
        expect(response.body.stats.overview).toBeDefined();
        expect(response.body.stats.byCategory).toBeDefined();
        expect(response.body.stats.bySourceType).toBeDefined();
        expect(response.body.stats.syncStatus).toBeDefined();
        expect(response.body.stats.healthMetrics).toBeDefined();
        expect(response.body.period).toBe('30d');
      });

      it('should handle different time periods', async () => {
        const response = await request(app)
          .get('/v1/admin/knowledge/stats')
          .query({ period: '7d' });

        expect(response.status).toBe(200);
        expect(response.body.period).toBe('7d');
      });
    });

    describe('POST /v1/admin/knowledge/validate', () => {
      beforeEach(() => {
        Document.where = jest.fn().mockResolvedValue([
          {
            id: 1,
            docpath: 'valid-doc.pdf',
            workspaceId: 1,
            metadata: JSON.stringify({
              title: 'Valid Document',
              chunkCount: 5
            }),
            syncMetadata: JSON.stringify({
              status: 'synced',
              errorCount: 0
            })
          },
          {
            id: 2,
            docpath: 'problematic-doc.pdf',
            workspaceId: 999, // Non-existent workspace
            metadata: JSON.stringify({
              chunkCount: 0 // No embeddings
            }),
            syncMetadata: JSON.stringify({
              status: 'error',
              errorCount: 10
            })
          }
        ]);

        Workspace.get = jest.fn()
          .mockResolvedValueOnce({ id: 1, name: 'Valid Workspace' })
          .mockResolvedValueOnce(null); // Non-existent workspace
      });

      it('should validate knowledge base integrity', async () => {
        const response = await request(app)
          .post('/v1/admin/knowledge/validate')
          .send({
            checkEmbeddings: true,
            checkOrphans: true,
            fixIssues: false
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.results).toBeDefined();
        expect(response.body.results.totalDocuments).toBe(2);
        expect(response.body.results.issues).toHaveLength(2);
        expect(response.body.summary).toBeDefined();
        expect(response.body.summary.overallHealth).toBeDefined();
      });

      it('should fix issues when requested', async () => {
        Document.update = jest.fn().mockResolvedValue(true);

        const response = await request(app)
          .post('/v1/admin/knowledge/validate')
          .send({
            checkEmbeddings: true,
            checkOrphans: true,
            fixIssues: true
          });

        expect(response.status).toBe(200);
        expect(response.body.results.fixed).toBeDefined();
      });
    });
  });

  describe('Document Management API', () => {
    describe('POST /v1/admin/documents/bulk-update', () => {
      beforeEach(() => {
        Document.where = jest.fn().mockResolvedValue([
          { id: 1, docpath: 'doc1.pdf', metadata: JSON.stringify({}) },
          { id: 2, docpath: 'doc2.pdf', metadata: JSON.stringify({}) }
        ]);
        Document.update = jest.fn().mockResolvedValue(true);
        Workspace.get = jest.fn().mockResolvedValue({ id: 1, name: 'Test Workspace' });
      });

      it('should bulk update multiple documents', async () => {
        const response = await request(app)
          .post('/v1/admin/documents/bulk-update')
          .send({
            documentIds: [1, 2],
            updates: {
              category: 'updated-category',
              priority: 2,
              tags: ['tag1', 'tag2']
            },
            options: {
              updateEmbeddings: false,
              validateWorkspaces: true
            }
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.updated).toHaveLength(2);
        expect(response.body.failed).toHaveLength(0);
        expect(response.body.summary.successful).toBe(2);
        expect(Document.update).toHaveBeenCalledTimes(2);
      });

      it('should validate document IDs exist', async () => {
        Document.where.mockResolvedValue([{ id: 1, docpath: 'doc1.pdf' }]);

        const response = await request(app)
          .post('/v1/admin/documents/bulk-update')
          .send({
            documentIds: [1, 999],
            updates: { category: 'test' }
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Documents not found: 999');
      });

      it('should limit bulk operations', async () => {
        const largeArray = Array.from({ length: 1001 }, (_, i) => i + 1);

        const response = await request(app)
          .post('/v1/admin/documents/bulk-update')
          .send({
            documentIds: largeArray,
            updates: { category: 'test' }
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('Cannot update more than 1000');
      });
    });

    describe('DELETE /v1/admin/documents/bulk', () => {
      beforeEach(() => {
        Document.where = jest.fn().mockResolvedValue([
          {
            id: 1,
            docpath: 'doc1.pdf',
            category: 'test',
            workspaceId: 1,
            workspace: { id: 1, name: 'Test Workspace', slug: 'test' }
          },
          {
            id: 2,
            docpath: 'doc2.pdf',
            category: 'test',
            workspaceId: 1,
            workspace: { id: 1, name: 'Test Workspace', slug: 'test' }
          }
        ]);
        Document.delete = jest.fn().mockResolvedValue(true);
      });

      it('should safely delete multiple documents', async () => {
        const response = await request(app)
          .delete('/v1/admin/documents/bulk')
          .send({
            documentIds: [1, 2],
            options: {
              removeFromWorkspaces: true,
              cleanupEmbeddings: true,
              notifyWorkspaces: true
            },
            reason: 'Test cleanup'
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.deleted).toHaveLength(2);
        expect(response.body.failed).toHaveLength(0);
        expect(response.body.summary.successful).toBe(2);
        expect(Document.delete).toHaveBeenCalledTimes(2);
      });

      it('should require confirmation for large deletions', async () => {
        const largeArray = Array.from({ length: 51 }, (_, i) => i + 1);

        const response = await request(app)
          .delete('/v1/admin/documents/bulk')
          .send({
            documentIds: largeArray,
            options: {}
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('Confirmation token required');
        expect(response.body.confirmationRequired).toBe(true);
      });

      it('should limit bulk deletions', async () => {
        const largeArray = Array.from({ length: 501 }, (_, i) => i + 1);

        const response = await request(app)
          .delete('/v1/admin/documents/bulk')
          .send({
            documentIds: largeArray,
            options: { confirmationToken: 'test' }
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('Cannot delete more than 500');
      });
    });

    describe('POST /v1/admin/documents/merge', () => {
      beforeEach(() => {
        Document.where = jest.fn().mockResolvedValue([
          {
            id: 1,
            docpath: 'primary.pdf',
            metadata: JSON.stringify({
              title: 'Primary Document',
              pageContent: 'Primary content',
              wordCount: 100,
              token_count_estimate: 150
            })
          },
          {
            id: 2,
            docpath: 'secondary.pdf',
            metadata: JSON.stringify({
              title: 'Secondary Document',
              pageContent: 'Secondary content',
              wordCount: 80,
              token_count_estimate: 120
            })
          }
        ]);
        Document.update = jest.fn().mockResolvedValue(true);
        Document.delete = jest.fn().mockResolvedValue(true);
      });

      it('should merge documents with append_content strategy', async () => {
        const response = await request(app)
          .post('/v1/admin/documents/merge')
          .send({
            primaryDocumentId: 1,
            secondaryDocumentIds: [2],
            mergeStrategy: 'append_content',
            options: {
              preserveVersionHistory: true,
              updateEmbeddings: true,
              deleteSecondary: true
            }
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.mergedDocument).toBeDefined();
        expect(response.body.mergedDocument.id).toBe(1);
        expect(response.body.mergeLog).toBeDefined();
        expect(response.body.deletedDocuments).toHaveLength(1);
        expect(Document.update).toHaveBeenCalled();
        expect(Document.delete).toHaveBeenCalled();
      });

      it('should validate merge strategy', async () => {
        const response = await request(app)
          .post('/v1/admin/documents/merge')
          .send({
            primaryDocumentId: 1,
            secondaryDocumentIds: [2],
            mergeStrategy: 'invalid_strategy'
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('Invalid merge strategy');
      });

      it('should prevent merging primary with itself', async () => {
        const response = await request(app)
          .post('/v1/admin/documents/merge')
          .send({
            primaryDocumentId: 1,
            secondaryDocumentIds: [1, 2],
            mergeStrategy: 'append_content'
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('Primary document cannot be included');
      });
    });

    describe('GET /v1/admin/documents/duplicates', () => {
      beforeEach(() => {
        Document.where = jest.fn().mockResolvedValue([
          {
            id: 1,
            docpath: 'similar-doc-1.pdf',
            category: 'documentation',
            sourceType: 'manual_upload',
            workspaceId: 1,
            createdAt: new Date(),
            metadata: JSON.stringify({
              title: 'Similar Document One',
              wordCount: 500
            })
          },
          {
            id: 2,
            docpath: 'similar-doc-2.pdf',
            category: 'documentation',
            sourceType: 'manual_upload',
            workspaceId: 1,
            createdAt: new Date(),
            metadata: JSON.stringify({
              title: 'Similar Document Two',
              wordCount: 480
            })
          }
        ]);
      });

      it('should find potential duplicate documents', async () => {
        const response = await request(app)
          .get('/v1/admin/documents/duplicates')
          .query({ threshold: 0.8 });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.duplicateGroups).toBeDefined();
        expect(response.body.summary).toBeDefined();
      });

      it('should handle different similarity thresholds', async () => {
        const response = await request(app)
          .get('/v1/admin/documents/duplicates')
          .query({ threshold: 0.5 });

        expect(response.status).toBe(200);
      });

      it('should handle insufficient documents', async () => {
        Document.where.mockResolvedValue([]);

        const response = await request(app)
          .get('/v1/admin/documents/duplicates');

        expect(response.status).toBe(200);
        expect(response.body.duplicateGroups).toHaveLength(0);
        expect(response.body.message).toContain('Not enough documents');
      });
    });
  });

  describe('Chat Testing API', () => {
    describe('POST /v1/admin/chat/test', () => {
      beforeEach(() => {
        Workspace.get = jest.fn().mockResolvedValue({
          id: 1,
          name: 'Test Workspace',
          slug: 'test',
          openAiModel: 'gpt-3.5-turbo'
        });

        // Mock chat function
        jest.doMock('../../../utils/chats', () => ({
          chatWithWorkspace: jest.fn().mockResolvedValue({
            textResponse: 'Test response from AI',
            sources: [{ title: 'Test Source', url: 'test.pdf' }],
            type: 'chat',
            debugInfo: {
              steps: ['retrieval', 'generation'],
              prompt: 'Test prompt',
              tokensUsed: 100
            },
            responseTime: 1500
          })
        }));
      });

      it('should test chat response generation', async () => {
        const response = await request(app)
          .post('/v1/admin/chat/test')
          .send({
            message: 'What is the return policy?',
            workspaceId: 1,
            models: ['gpt-3.5-turbo'],
            includeDebugInfo: true,
            testPromptVariations: false,
            analysisLevel: 'basic'
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.testSession).toBeDefined();
        expect(response.body.testSession.message).toBe('What is the return policy?');
        expect(response.body.testSession.results).toHaveLength(1);
        expect(response.body.testSession.summary).toBeDefined();
      });

      it('should validate required fields', async () => {
        const response = await request(app)
          .post('/v1/admin/chat/test')
          .send({});

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('Message is required');
      });

      it('should handle invalid workspace', async () => {
        Workspace.get.mockResolvedValue(null);

        const response = await request(app)
          .post('/v1/admin/chat/test')
          .send({
            message: 'Test message',
            workspaceId: 999
          });

        expect(response.status).toBe(404);
        expect(response.body.error).toContain('Workspace 999 not found');
      });
    });

    describe('POST /v1/admin/chat/test/batch', () => {
      beforeEach(() => {
        Workspace.get = jest.fn().mockResolvedValue({
          id: 1,
          name: 'Test Workspace',
          slug: 'test',
          openAiModel: 'gpt-3.5-turbo'
        });
      });

      it('should execute batch testing', async () => {
        const response = await request(app)
          .post('/v1/admin/chat/test/batch')
          .send({
            queries: [
              'What is the return policy?',
              'How do I track my order?',
              'What payment methods do you accept?'
            ],
            workspaceId: 1,
            models: ['gpt-3.5-turbo'],
            parallelLimit: 2,
            includeAnalysis: true
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.batchSession).toBeDefined();
        expect(response.body.batchSession.queries).toHaveLength(3);
        expect(response.body.batchSession.summary).toBeDefined();
      });

      it('should limit batch size', async () => {
        const largeQueries = Array.from({ length: 101 }, (_, i) => `Query ${i + 1}`);

        const response = await request(app)
          .post('/v1/admin/chat/test/batch')
          .send({
            queries: largeQueries,
            workspaceId: 1
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('Cannot test more than 100');
      });
    });

    describe('GET /v1/admin/chat/test/history', () => {
      beforeEach(() => {
        EventLogs.where = jest.fn().mockResolvedValue([
          {
            eventType: 'admin_chat_test_executed',
            createdAt: new Date(),
            metadata: JSON.stringify({
              testSessionId: 'test-123',
              workspaceId: 1,
              modelsCount: 1,
              successfulTests: 1,
              failedTests: 0,
              averageResponseTime: 1500
            })
          }
        ]);
        EventLogs.count = jest.fn().mockResolvedValue(1);
      });

      it('should retrieve test history', async () => {
        const response = await request(app)
          .get('/v1/admin/chat/test/history')
          .query({ page: 1, limit: 20 });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.testSessions).toHaveLength(1);
        expect(response.body.pagination).toBeDefined();
      });

      it('should handle filtering by workspace', async () => {
        const response = await request(app)
          .get('/v1/admin/chat/test/history')
          .query({ workspaceId: 1 });

        expect(response.status).toBe(200);
        expect(EventLogs.where).toHaveBeenCalledWith(
          expect.objectContaining({
            metadata: {
              path: ['workspaceId'],
              equals: 1
            }
          }),
          expect.any(Number),
          expect.any(Object)
        );
      });
    });

    describe('POST /v1/admin/chat/analyze', () => {
      it('should analyze response quality', async () => {
        const response = await request(app)
          .post('/v1/admin/chat/analyze')
          .send({
            query: 'What is the return policy?',
            response: 'Our return policy allows returns within 30 days of purchase. Items must be in original condition.',
            workspaceId: 1,
            analysisType: 'comprehensive'
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.analysis).toBeDefined();
        expect(response.body.analysis.qualityScore).toBeDefined();
        expect(response.body.analysis.criteria).toBeDefined();
        expect(response.body.analysis.recommendations).toBeDefined();
      });

      it('should require query and response', async () => {
        const response = await request(app)
          .post('/v1/admin/chat/analyze')
          .send({});

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('Query and response are required');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      Document.where.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/v1/admin/knowledge');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Failed to retrieve knowledge base');
    });

    it('should handle malformed JSON in metadata', async () => {
      Document.where.mockResolvedValue([
        {
          id: 1,
          docpath: 'malformed.pdf',
          metadata: 'invalid json{{{',
          category: null,
          sourceType: null,
          workspaceId: 1
        }
      ]);
      Document.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/v1/admin/knowledge');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      // Should handle malformed JSON gracefully
    });
  });

  describe('Performance', () => {
    it('should handle large datasets efficiently', async () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        docpath: `doc-${i + 1}.pdf`,
        category: `category-${i % 10}`,
        sourceType: 'manual_upload',
        workspaceId: 1,
        metadata: JSON.stringify({ wordCount: 500 }),
        createdAt: new Date()
      }));

      Document.where.mockResolvedValue(largeDataset.slice(0, 20));
      Document.count.mockResolvedValue(1000);

      const startTime = Date.now();
      const response = await request(app)
        .get('/v1/admin/knowledge')
        .query({ limit: 20 });

      const responseTime = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(5000); // Should respond within 5 seconds
      expect(response.body.documents).toHaveLength(20);
    });
  });
});