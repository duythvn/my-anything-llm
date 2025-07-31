const { Document } = require("../../../models/documents");
const { Workspace } = require("../../../models/workspace");
const { validApiKey } = require("../../../utils/middleware/validApiKey");
const { reqBody } = require("../../../utils/http");
const { Telemetry } = require("../../../models/telemetry");
const { EventLogs } = require("../../../models/eventLogs");
const { getVectorDbClass } = require("../../../utils/helpers");
const { safeJsonParse } = require("../../../utils/http");

/**
 * Admin Knowledge Base API Endpoints
 * Provides comprehensive knowledge management functionality for administrators
 */
function adminKnowledgeEndpoints(app) {
  if (!app) return;

  /**
   * GET /api/v1/admin/knowledge
   * Paginated knowledge base retrieval with filtering and statistics
   */
  app.get("/v1/admin/knowledge", [validApiKey], async (request, response) => {
    /*
    #swagger.tags = ['Admin - Knowledge Base']
    #swagger.description = 'Get paginated knowledge base content with filtering and statistics'
    #swagger.parameters['page'] = {
      in: 'query',
      description: 'Page number (default: 1)',
      required: false,
      type: 'integer'
    }
    #swagger.parameters['limit'] = {
      in: 'query', 
      description: 'Items per page (default: 20, max: 100)',
      required: false,
      type: 'integer'
    }
    #swagger.parameters['category'] = {
      in: 'query',
      description: 'Filter by document category',
      required: false,
      type: 'string'
    }
    #swagger.parameters['sourceType'] = {
      in: 'query',
      description: 'Filter by source type (manual_upload, api_sync, etc.)',
      required: false,
      type: 'string'
    }
    #swagger.parameters['workspaceId'] = {
      in: 'query',
      description: 'Filter by workspace ID',
      required: false,
      type: 'integer'
    }
    */
    try {
      const {
        page = 1,
        limit = 20,
        category = null,
        sourceType = null,
        workspaceId = null,
        syncStatus = null,
        search = null
      } = request.query;

      // Validate and sanitize inputs
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
      const offset = (pageNum - 1) * limitNum;

      // Build filter conditions
      const whereClause = {};
      if (category) whereClause.category = category;
      if (sourceType) whereClause.sourceType = sourceType;
      if (workspaceId) whereClause.workspaceId = parseInt(workspaceId);

      // Basic text search if provided
      if (search) {
        whereClause.OR = [
          { docpath: { contains: search } },
          { metadata: { contains: search } }
        ];
      }

      // Get total count for pagination
      const totalDocuments = await Document.count(whereClause);
      const totalPages = Math.ceil(totalDocuments / limitNum);

      // Get paginated documents with metadata
      const documents = await Document.where(
        whereClause,
        limitNum,
        { createdAt: 'desc' },
        {
          workspace: {
            select: { name: true, slug: true }
          }
        }
      );

      // Parse and enrich document metadata
      const enrichedDocuments = documents.map(doc => {
        const metadata = safeJsonParse(doc.metadata, {});
        return {
          id: doc.id,
          docpath: doc.docpath,
          filename: metadata.title || doc.docpath.split('/').pop(),
          category: doc.category,
          sourceType: doc.sourceType,
          workspaceId: doc.workspaceId,
          workspace: doc.workspace,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
          wordCount: metadata.wordCount || 0,
          tokenCount: metadata.token_count_estimate || 0,
          lastSynced: doc.lastUpdatedAt,
          syncStatus: doc.syncMetadata ? safeJsonParse(doc.syncMetadata, {}).status : 'unknown',
          priority: doc.priority || 0,
          pinned: doc.pinned || false,
          watched: doc.watched || false
        };
      });

      // Calculate statistics
      const allDocuments = await Document.where({});
      const stats = {
        totalDocuments,
        byCategory: {},
        bySourceType: {},
        byWorkspace: {},
        totalWordCount: 0,
        totalTokenCount: 0,
        syncStatuses: {}
      };

      // Aggregate statistics
      allDocuments.forEach(doc => {
        const metadata = safeJsonParse(doc.metadata, {});
        
        // Category stats
        const cat = doc.category || 'uncategorized';
        stats.byCategory[cat] = (stats.byCategory[cat] || 0) + 1;
        
        // Source type stats
        const sourceType = doc.sourceType || 'unknown';
        stats.bySourceType[sourceType] = (stats.bySourceType[sourceType] || 0) + 1;
        
        // Workspace stats
        if (doc.workspaceId) {
          stats.byWorkspace[doc.workspaceId] = (stats.byWorkspace[doc.workspaceId] || 0) + 1;
        }
        
        // Content stats
        stats.totalWordCount += metadata.wordCount || 0;
        stats.totalTokenCount += metadata.token_count_estimate || 0;
        
        // Sync status stats
        const syncMeta = safeJsonParse(doc.syncMetadata, {});
        const syncStatus = syncMeta.status || 'unknown';
        stats.syncStatuses[syncStatus] = (stats.syncStatuses[syncStatus] || 0) + 1;
      });

      const result = {
        success: true,
        documents: enrichedDocuments,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalDocuments,
          totalPages,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        },
        stats,
        filters: {
          category,
          sourceType,
          workspaceId,
          syncStatus,
          search
        }
      };

      // Log admin access
      await EventLogs.logEvent("admin_knowledge_accessed", {
        page: pageNum,
        limit: limitNum,
        totalReturned: documents.length,
        filters: { category, sourceType, workspaceId, search }
      });

      response.status(200).json(result);

    } catch (error) {
      console.error("Admin knowledge retrieval error:", error);
      response.status(500).json({
        success: false,
        error: `Failed to retrieve knowledge base: ${error.message}`
      });
    }
  });

  /**
   * GET /api/v1/admin/knowledge/search
   * Advanced search across knowledge base with relevance scoring
   */
  app.get("/v1/admin/knowledge/search", [validApiKey], async (request, response) => {
    /*
    #swagger.tags = ['Admin - Knowledge Base']
    #swagger.description = 'Advanced search across knowledge base with relevance scoring'
    #swagger.parameters['q'] = {
      in: 'query',
      description: 'Search query',
      required: true,
      type: 'string'
    }
    #swagger.parameters['category'] = {
      in: 'query',
      description: 'Filter by category',
      required: false,
      type: 'string'
    }
    */
    try {
      const {
        q: query,
        category = null,
        workspaceId = null,
        dateFrom = null,
        dateTo = null,
        limit = 20
      } = request.query;

      if (!query || query.trim().length === 0) {
        return response.status(400).json({
          success: false,
          error: "Search query is required"
        });
      }

      const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));

      // Build search conditions
      const whereClause = {
        AND: []
      };

      // Text search across multiple fields
      whereClause.AND.push({
        OR: [
          { docpath: { contains: query, mode: 'insensitive' } },
          { metadata: { contains: query } }
        ]
      });

      // Apply filters
      if (category) {
        whereClause.AND.push({ category });
      }
      if (workspaceId) {
        whereClause.AND.push({ workspaceId: parseInt(workspaceId) });
      }
      if (dateFrom) {
        whereClause.AND.push({ createdAt: { gte: new Date(dateFrom) } });
      }
      if (dateTo) {
        whereClause.AND.push({ createdAt: { lte: new Date(dateTo) } });
      }

      // Execute search
      const documents = await Document.where(
        whereClause,
        limitNum,
        { createdAt: 'desc' },
        {
          workspace: {
            select: { name: true, slug: true }
          }
        }
      );

      // Calculate simple relevance scores
      const searchTerms = query.toLowerCase().split(/\s+/);
      const resultsWithScore = documents.map(doc => {
        const metadata = safeJsonParse(doc.metadata, {});
        const searchableText = `${doc.docpath} ${metadata.title || ''} ${metadata.description || ''}`.toLowerCase();
        
        // Simple relevance scoring based on term frequency and position
        let score = 0;
        searchTerms.forEach(term => {
          const termCount = (searchableText.match(new RegExp(term, 'g')) || []).length;
          const firstPosition = searchableText.indexOf(term);
          
          score += termCount * 10; // Frequency bonus
          if (firstPosition >= 0) {
            score += Math.max(0, 100 - firstPosition); // Position bonus
          }
        });

        return {
          id: doc.id,
          docpath: doc.docpath,
          filename: metadata.title || doc.docpath.split('/').pop(),
          category: doc.category,
          sourceType: doc.sourceType,
          workspaceId: doc.workspaceId,
          workspace: doc.workspace,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
          wordCount: metadata.wordCount || 0,
          tokenCount: metadata.token_count_estimate || 0,
          relevanceScore: score,
          snippet: _generateSnippet(metadata.description || searchableText, searchTerms, 150)
        };
      });

      // Sort by relevance score
      resultsWithScore.sort((a, b) => b.relevanceScore - a.relevanceScore);

      const result = {
        success: true,
        query,
        results: resultsWithScore,
        count: resultsWithScore.length,
        searchMetadata: {
          searchTerms,
          filters: { category, workspaceId, dateFrom, dateTo },
          executionTime: null
        }
      };

      // Log search activity
      await EventLogs.logEvent("admin_knowledge_searched", {
        query,
        resultsCount: resultsWithScore.length,
        filters: { category, workspaceId, dateFrom, dateTo }
      });

      response.status(200).json(result);

    } catch (error) {
      console.error("Admin knowledge search error:", error);
      response.status(500).json({
        success: false,
        error: `Search failed: ${error.message}`
      });
    }
  });


  /**
   * GET /api/v1/admin/knowledge/stats
   * Comprehensive knowledge base statistics and analytics
   */
  app.get("/v1/admin/knowledge/stats", [validApiKey], async (request, response) => {
    /*
    #swagger.tags = ['Admin - Knowledge Base']
    #swagger.description = 'Get comprehensive knowledge base statistics and analytics'
    #swagger.parameters['period'] = {
      in: 'query',
      description: 'Time period for trends (7d, 30d, 90d)',
      required: false,
      type: 'string'
    }
    */
    try {
      const { period = '30d' } = request.query;

      // Calculate date range for trends
      const periodDays = {
        '7d': 7,
        '30d': 30,
        '90d': 90
      };
      const days = periodDays[period] || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get all documents
      const allDocuments = await Document.where({});
      const recentDocuments = await Document.where({
        createdAt: { gte: startDate }
      });

      // Calculate comprehensive statistics
      const stats = {
        overview: {
          totalDocuments: allDocuments.length,
          recentDocuments: recentDocuments.length,
          totalWorkspaces: new Set(allDocuments.map(d => d.workspaceId).filter(Boolean)).size,
          averageDocumentSize: 0,
          totalContent: {
            wordCount: 0,
            tokenCount: 0,
            chunkCount: 0
          }
        },
        byCategory: {},
        bySourceType: {},
        byWorkspace: {},
        syncStatus: {},
        contentDistribution: {
          documentSizes: []
        },
        healthMetrics: {
          documentsWithoutEmbeddings: 0,
          syncErrors: 0,
          averageDocumentAge: 0
        },
        growthTrends: []
      };

      let totalWords = 0, totalTokens = 0, totalChunks = 0;
      const documentAges = [];

      for (const doc of allDocuments) {
        const metadata = safeJsonParse(doc.metadata, {});
        const syncMeta = safeJsonParse(doc.syncMetadata, {});
        
        // Content statistics
        const wordCount = metadata.wordCount || 0;
        const tokenCount = metadata.token_count_estimate || 0;
        const chunkCount = metadata.chunkCount || 0;

        // Category distribution
        const category = doc.category || 'uncategorized';
        if (!stats.byCategory[category]) {
          stats.byCategory[category] = { count: 0, words: 0, tokens: 0 };
        }
        stats.byCategory[category].count++;
        stats.byCategory[category].words += wordCount;
        stats.byCategory[category].tokens += tokenCount;

        // Source type distribution
        const sourceType = doc.sourceType || 'unknown';
        stats.bySourceType[sourceType] = (stats.bySourceType[sourceType] || 0) + 1;

        // Workspace distribution
        if (doc.workspaceId) {
          stats.byWorkspace[doc.workspaceId] = (stats.byWorkspace[doc.workspaceId] || 0) + 1;
        }

        // Sync status
        const syncStatus = syncMeta.status || 'unknown';
        stats.syncStatus[syncStatus] = (stats.syncStatus[syncStatus] || 0) + 1;

        // Health metrics
        if (!metadata.hasEmbeddings) {
          stats.healthMetrics.documentsWithoutEmbeddings++;
        }
        if (syncMeta.errorCount > 0) {
          stats.healthMetrics.syncErrors++;
        }

        // Totals
        totalWords += wordCount;
        totalTokens += tokenCount;
        totalChunks += chunkCount;

        // Document age for health metrics
        const ageInDays = (Date.now() - new Date(doc.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        documentAges.push(ageInDays);
        
        // Document size distribution
        stats.contentDistribution.documentSizes.push({
          id: doc.id,
          words: wordCount,
          tokens: tokenCount,
          category
        });
      }

      // Complete overview statistics
      stats.overview.totalContent.wordCount = totalWords;
      stats.overview.totalContent.tokenCount = totalTokens;
      stats.overview.totalContent.chunkCount = totalChunks;
      stats.overview.averageDocumentSize = allDocuments.length > 0 ? Math.round(totalWords / allDocuments.length) : 0;
      
      // Health metrics
      stats.healthMetrics.averageDocumentAge = documentAges.length > 0 ? 
        Math.round(documentAges.reduce((a, b) => a + b, 0) / documentAges.length) : 0;

      // Growth trends (simplified - daily document creation over period)
      const growthMap = new Map();
      recentDocuments.forEach(doc => {
        const date = doc.createdAt.toISOString().split('T')[0];
        growthMap.set(date, (growthMap.get(date) || 0) + 1);
      });
      
      stats.growthTrends = Array.from(growthMap.entries())
        .map(([date, count]) => ({ date, documentsAdded: count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      const result = {
        success: true,
        stats,
        period,
        generatedAt: new Date().toISOString()
      };

      // Log stats access
      await EventLogs.logEvent("admin_stats_accessed", {
        period,
        totalDocuments: allDocuments.length
      });

      response.status(200).json(result);

    } catch (error) {
      console.error("Admin stats calculation error:", error);
      response.status(500).json({
        success: false,
        error: `Failed to calculate statistics: ${error.message}`
      });
    }
  });

  /**
   * GET /api/v1/admin/knowledge/:id
   * Retrieve detailed information about a specific document
   */
  app.get("/v1/admin/knowledge/:id", [validApiKey], async (request, response) => {
    /*
    #swagger.tags = ['Admin - Knowledge Base']
    #swagger.description = 'Get detailed information about a specific document'
    #swagger.parameters['id'] = {
      in: 'path',
      description: 'Document ID',
      required: true,
      type: 'integer'
    }
    */
    try {
      const { id } = request.params;
      const documentId = parseInt(id);

      if (isNaN(documentId)) {
        return response.status(400).json({
          success: false,
          error: "Invalid document ID"
        });
      }

      // Get document with workspace info
      const document = await Document.get({ id: documentId });

      if (!document) {
        return response.status(404).json({
          success: false,
          error: "Document not found"
        });
      }

      // Get workspace information
      const workspace = await Workspace.get({ id: document.workspaceId });

      // Parse metadata
      const metadata = safeJsonParse(document.metadata, {});
      const syncMetadata = safeJsonParse(document.syncMetadata, {});
      const businessContext = safeJsonParse(document.businessContext, {});

      // Get vector database information if available
      const VectorDb = getVectorDbClass();
      let vectorInfo = null;
      try {
        if (VectorDb) {
          // This would require implementing vector database stats
          vectorInfo = {
            hasEmbeddings: true,
            vectorCount: metadata.chunkCount || 0,
            embeddingModel: metadata.embeddingModel || 'unknown'
          };
        }
      } catch (error) {
        console.warn("Could not retrieve vector information:", error.message);
      }

      const result = {
        success: true,
        document: {
          id: document.id,
          docpath: document.docpath,
          filename: metadata.title || document.docpath.split('/').pop(),
          category: document.category,
          sourceType: document.sourceType,
          workspaceId: document.workspaceId,
          workspace: workspace ? {
            id: workspace.id,
            name: workspace.name,
            slug: workspace.slug
          } : null,
          priority: document.priority || 0,
          pinned: document.pinned || false,
          watched: document.watched || false,
          createdAt: document.createdAt,
          updatedAt: document.updatedAt,
          lastSynced: document.lastUpdatedAt,
          
          // Content information
          metadata: {
            title: metadata.title,
            description: metadata.description,
            wordCount: metadata.wordCount || 0,
            tokenCount: metadata.token_count_estimate || 0,
            chunkCount: metadata.chunkCount || 0,
            docAuthor: metadata.docAuthor,
            published: metadata.published,
            url: metadata.url
          },
          
          // Sync information
          syncInfo: {
            status: syncMetadata.status || 'unknown',
            lastSync: syncMetadata.lastSync,
            nextSync: syncMetadata.nextSync,
            schedule: syncMetadata.schedule,
            errorCount: syncMetadata.errorCount || 0,
            lastError: syncMetadata.lastError
          },
          
          // Business context
          businessContext,
          
          // Vector database info
          vectorInfo,
          
          // Version information (placeholder for version control)
          versionInfo: {
            currentVersion: 1,
            totalVersions: 1,
            hasHistory: false
          }
        }
      };

      // Log document access
      await EventLogs.logEvent("admin_document_viewed", {
        documentId,
        docpath: document.docpath,
        workspaceId: document.workspaceId
      });

      response.status(200).json(result);

    } catch (error) {
      console.error("Admin document retrieval error:", error);
      response.status(500).json({
        success: false,
        error: `Failed to retrieve document: ${error.message}`
      });
    }
  });

  /**
   * GET /api/v1/admin/knowledge/stats
   * Comprehensive knowledge base statistics and analytics
   */
  app.get("/v1/admin/knowledge/stats", [validApiKey], async (request, response) => {
    /*
    #swagger.tags = ['Admin - Knowledge Base']
    #swagger.description = 'Get comprehensive knowledge base statistics and analytics'
    #swagger.parameters['period'] = {
      in: 'query',
      description: 'Time period for trends (7d, 30d, 90d)',
      required: false,
      type: 'string'
    }
    */
    try {
      const { period = '30d' } = request.query;

      // Calculate date range for trends
      const periodDays = {
        '7d': 7,
        '30d': 30,
        '90d': 90
      };
      const days = periodDays[period] || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get all documents
      const allDocuments = await Document.where({});
      const recentDocuments = await Document.where({
        createdAt: { gte: startDate }
      });

      // Calculate comprehensive statistics
      const stats = {
        overview: {
          totalDocuments: allDocuments.length,
          recentDocuments: recentDocuments.length,
          totalWorkspaces: new Set(allDocuments.map(d => d.workspaceId).filter(Boolean)).size,
          averageDocumentSize: 0,
          totalContent: {
            wordCount: 0,
            tokenCount: 0,
            chunkCount: 0
          }
        },
        byCategory: {},
        bySourceType: {},
        byWorkspace: {},
        syncStatus: {},
        growthTrends: [],
        contentDistribution: {
          documentSizes: [],
          categorySizes: {}
        },
        healthMetrics: {
          documentsWithoutEmbeddings: 0,
          orphanedDocuments: 0,
          syncErrors: 0,
          averageDocumentAge: 0
        }
      };

      // Process documents for statistics
      let totalWords = 0, totalTokens = 0, totalChunks = 0;
      const documentAges = [];
      const workspaceMap = new Map();

      for (const doc of allDocuments) {
        const metadata = safeJsonParse(doc.metadata, {});
        const syncMeta = safeJsonParse(doc.syncMetadata, {});
        
        // Content statistics
        const wordCount = metadata.wordCount || 0;
        const tokenCount = metadata.token_count_estimate || 0;
        const chunkCount = metadata.chunkCount || 0;
        
        totalWords += wordCount;
        totalTokens += tokenCount;
        totalChunks += chunkCount;
        
        // Category distribution
        const category = doc.category || 'uncategorized';
        if (!stats.byCategory[category]) {
          stats.byCategory[category] = { count: 0, words: 0, tokens: 0 };
        }
        stats.byCategory[category].count++;
        stats.byCategory[category].words += wordCount;
        stats.byCategory[category].tokens += tokenCount;
        
        // Source type distribution
        const sourceType = doc.sourceType || 'unknown';
        stats.bySourceType[sourceType] = (stats.bySourceType[sourceType] || 0) + 1;
        
        // Workspace distribution
        if (doc.workspaceId) {
          stats.byWorkspace[doc.workspaceId] = (stats.byWorkspace[doc.workspaceId] || 0) + 1;
        }
        
        // Sync status
        const syncStatus = syncMeta.status || 'unknown';
        stats.syncStatus[syncStatus] = (stats.syncStatus[syncStatus] || 0) + 1;
        
        // Health metrics
        if (!metadata.chunkCount || metadata.chunkCount === 0) {
          stats.healthMetrics.documentsWithoutEmbeddings++;
        }
        if (syncMeta.errorCount > 0) {
          stats.healthMetrics.syncErrors++;
        }
        
        // Document age calculation
        const ageInDays = (Date.now() - new Date(doc.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        documentAges.push(ageInDays);
        
        // Document size distribution
        stats.contentDistribution.documentSizes.push({
          id: doc.id,
          words: wordCount,
          tokens: tokenCount,
          category
        });
      }

      // Complete overview statistics
      stats.overview.totalContent.wordCount = totalWords;
      stats.overview.totalContent.tokenCount = totalTokens;
      stats.overview.totalContent.chunkCount = totalChunks;
      stats.overview.averageDocumentSize = allDocuments.length > 0 ? Math.round(totalWords / allDocuments.length) : 0;
      
      // Health metrics
      stats.healthMetrics.averageDocumentAge = documentAges.length > 0 ? 
        Math.round(documentAges.reduce((a, b) => a + b, 0) / documentAges.length) : 0;

      // Growth trends (simplified - daily document creation over period)
      const growthMap = new Map();
      recentDocuments.forEach(doc => {
        const date = doc.createdAt.toISOString().split('T')[0];
        growthMap.set(date, (growthMap.get(date) || 0) + 1);
      });
      
      stats.growthTrends = Array.from(growthMap.entries())
        .map(([date, count]) => ({ date, documentsAdded: count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      const result = {
        success: true,
        stats,
        period,
        generatedAt: new Date().toISOString(),
        metadata: {
          calculationTime: Date.now() - request.startTime,
          documentsAnalyzed: allDocuments.length
        }
      };

      // Log stats access
      await EventLogs.logEvent("admin_stats_accessed", {
        period,
        totalDocuments: allDocuments.length
      });

      response.status(200).json(result);

    } catch (error) {
      console.error("Admin stats calculation error:", error);
      response.status(500).json({
        success: false,
        error: `Failed to calculate statistics: ${error.message}`
      });
    }
  });

  /**
   * POST /api/v1/admin/knowledge/validate
   * Validate knowledge base integrity and generate health report
   */
  app.post("/v1/admin/knowledge/validate", [validApiKey], async (request, response) => {
    /*
    #swagger.tags = ['Admin - Knowledge Base']
    #swagger.description = 'Validate knowledge base integrity and generate health report'
    #swagger.requestBody = {
      description: 'Validation options',
      required: false,
      content: {
        "application/json": {
          schema: {
            type: 'object',
            properties: {
              checkEmbeddings: {
                type: 'boolean',
                description: 'Verify embeddings consistency',
                default: true
              },
              checkOrphans: {
                type: 'boolean', 
                description: 'Find orphaned documents',
                default: true
              },
              fixIssues: {
                type: 'boolean',
                description: 'Automatically fix detected issues',
                default: false
              }
            }
          }
        }
      }
    }
    */
    try {
      const {
        checkEmbeddings = true,
        checkOrphans = true,
        fixIssues = false
      } = reqBody(request);

      const validationReport = {
        success: true,
        validatedAt: new Date().toISOString(),
        options: { checkEmbeddings, checkOrphans, fixIssues },
        results: {
          totalDocuments: 0,
          validDocuments: 0,
          issues: [],
          fixed: [],
          warnings: []
        },
        summary: {
          overallHealth: 'unknown',
          criticalIssues: 0,
          warnings: 0,
          recommendations: []
        }
      };

      // Get all documents for validation
      const allDocuments = await Document.where({});
      validationReport.results.totalDocuments = allDocuments.length;

      let validCount = 0;
      const VectorDb = getVectorDbClass();

      for (const doc of allDocuments) {
        const metadata = safeJsonParse(doc.metadata, {});
        const syncMeta = safeJsonParse(doc.syncMetadata, {});
        let hasIssues = false;

        // Check 1: Document metadata completeness
        if (!metadata.title && !metadata.description) {
          validationReport.results.issues.push({
            type: 'missing_metadata',
            severity: 'warning',
            documentId: doc.id,
            docpath: doc.docpath,
            message: 'Document lacks basic metadata (title or description)'
          });
          hasIssues = true;
        }

        // Check 2: Embedding consistency
        if (checkEmbeddings) {
          if (!metadata.chunkCount || metadata.chunkCount === 0) {
            validationReport.results.issues.push({
              type: 'missing_embeddings',
              severity: 'critical',
              documentId: doc.id,
              docpath: doc.docpath,
              message: 'Document has no embeddings/chunks'
            });
            hasIssues = true;
          }
        }

        // Check 3: Workspace orphans
        if (checkOrphans && doc.workspaceId) {
          try {
            const workspace = await Workspace.get({ id: doc.workspaceId });
            if (!workspace) {
              validationReport.results.issues.push({
                type: 'orphaned_document',
                severity: 'critical',
                documentId: doc.id,
                docpath: doc.docpath,
                workspaceId: doc.workspaceId,
                message: 'Document references non-existent workspace'
              });
              hasIssues = true;
            }
          } catch (error) {
            validationReport.results.warnings.push({
              type: 'workspace_check_failed',
              documentId: doc.id,
              message: `Could not verify workspace: ${error.message}`
            });
          }
        }

        // Check 4: Sync status issues
        if (syncMeta.errorCount > 5) {
          validationReport.results.issues.push({
            type: 'sync_failures',
            severity: 'warning',
            documentId: doc.id,
            docpath: doc.docpath,
            errorCount: syncMeta.errorCount,
            message: `Document has ${syncMeta.errorCount} sync failures`
          });
          hasIssues = true;
        }

        if (!hasIssues) {
          validCount++;
        }
      }

      validationReport.results.validDocuments = validCount;

      // Apply fixes if requested
      if (fixIssues) {
        for (const issue of validationReport.results.issues) {
          try {
            if (issue.type === 'missing_metadata' && issue.severity === 'warning') {
              // Generate basic metadata from docpath
              const filename = issue.docpath.split('/').pop();
              const title = filename.replace(/\.[^/.]+$/, "").replace(/[-_]/g, ' ');
              
              await Document.update(issue.documentId, {
                metadata: JSON.stringify({
                  ...safeJsonParse((await Document.get({ id: issue.documentId })).metadata, {}),
                  title: title
                })
              });
              
              validationReport.results.fixed.push({
                type: issue.type,
                documentId: issue.documentId,
                action: 'Added basic title metadata'
              });
            }
          } catch (error) {
            validationReport.results.warnings.push({
              type: 'fix_failed',
              documentId: issue.documentId,
              message: `Could not fix issue: ${error.message}`
            });
          }
        }
      }

      // Generate summary and recommendations
      const criticalIssues = validationReport.results.issues.filter(i => i.severity === 'critical').length;
      const warningIssues = validationReport.results.issues.filter(i => i.severity === 'warning').length;
      
      validationReport.summary.criticalIssues = criticalIssues;
      validationReport.summary.warnings = warningIssues;
      
      if (criticalIssues === 0 && warningIssues === 0) {
        validationReport.summary.overallHealth = 'excellent';
      } else if (criticalIssues === 0) {
        validationReport.summary.overallHealth = 'good';
      } else if (criticalIssues < 5) {
        validationReport.summary.overallHealth = 'fair';
      } else {
        validationReport.summary.overallHealth = 'poor';
      }

      // Generate recommendations
      if (criticalIssues > 0) {
        validationReport.summary.recommendations.push(
          'Address critical issues immediately to ensure knowledge base functionality'
        );
      }
      if (warningIssues > 5) {
        validationReport.summary.recommendations.push(
          'Consider reviewing and updating document metadata for better searchability'
        );
      }
      if (validationReport.results.fixed.length > 0) {
        validationReport.summary.recommendations.push(
          `${validationReport.results.fixed.length} issues were automatically fixed`
        );
      }

      // Log validation activity
      await EventLogs.logEvent("admin_knowledge_validated", {
        totalDocuments: allDocuments.length,
        criticalIssues,
        warnings: warningIssues,
        fixesApplied: validationReport.results.fixed.length,
        overallHealth: validationReport.summary.overallHealth
      });

      response.status(200).json(validationReport);

    } catch (error) {
      console.error("Knowledge base validation error:", error);
      response.status(500).json({
        success: false,
        error: `Validation failed: ${error.message}`
      });
    }
  });

}

/**
 * Helper function to generate search result snippets
 */
function _generateSnippet(text, searchTerms, maxLength = 150) {
  if (!text || !searchTerms.length) return '';
  
  const lowerText = text.toLowerCase();
  let bestPosition = 0;
  let bestScore = 0;
  
  // Find the position with the most search terms
  for (let i = 0; i <= Math.max(0, text.length - maxLength); i += 20) {
    const segment = lowerText.slice(i, i + maxLength);
    const score = searchTerms.reduce((acc, term) => {
      return acc + (segment.includes(term) ? 1 : 0);
    }, 0);
    
    if (score > bestScore) {
      bestScore = score;
      bestPosition = i;
    }
  }
  
  let snippet = text.slice(bestPosition, bestPosition + maxLength);
  if (bestPosition > 0) snippet = '...' + snippet;
  if (bestPosition + maxLength < text.length) snippet = snippet + '...';
  
  return snippet;
}

module.exports = { adminKnowledgeEndpoints };