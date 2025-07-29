const { v4: uuidv4 } = require("uuid");
const { getVectorDbClass } = require("../utils/helpers");
const prisma = require("../utils/prisma");
const { Telemetry } = require("./telemetry");
const { EventLogs } = require("./eventLogs");
const { safeJsonParse } = require("../utils/http");
const { getModelTag } = require("../endpoints/utils");

const Document = {
  writable: ["pinned", "watched", "lastUpdatedAt", "sourceType", "syncMetadata", "businessContext", "category", "priority"],
  /**
   * @param {import("@prisma/client").workspace_documents} document - Document PrismaRecord
   * @returns {{
   *  metadata: (null|object),
   *  type: import("./documentSyncQueue.js").validFileType,
   *  source: string
   * }}
   */
  parseDocumentTypeAndSource: function (document) {
    const metadata = safeJsonParse(document.metadata, null);
    if (!metadata) return { metadata: null, type: null, source: null };

    // Parse the correct type of source and its original source path.
    const idx = metadata.chunkSource.indexOf("://");
    const [type, source] = [
      metadata.chunkSource.slice(0, idx),
      metadata.chunkSource.slice(idx + 3),
    ];
    return { metadata, type, source: this._stripSource(source, type) };
  },

  forWorkspace: async function (workspaceId = null) {
    if (!workspaceId) return [];
    return await prisma.workspace_documents.findMany({
      where: { workspaceId },
    });
  },

  delete: async function (clause = {}) {
    try {
      await prisma.workspace_documents.deleteMany({ where: clause });
      return true;
    } catch (error) {
      console.error(error.message);
      return false;
    }
  },

  get: async function (clause = {}) {
    try {
      const document = await prisma.workspace_documents.findFirst({
        where: clause,
      });
      return document || null;
    } catch (error) {
      console.error(error.message);
      return null;
    }
  },

  where: async function (
    clause = {},
    limit = null,
    orderBy = null,
    include = null,
    select = null
  ) {
    try {
      const results = await prisma.workspace_documents.findMany({
        where: clause,
        ...(limit !== null ? { take: limit } : {}),
        ...(orderBy !== null ? { orderBy } : {}),
        ...(include !== null ? { include } : {}),
        ...(select !== null ? { select: { ...select } } : {}),
      });
      return results;
    } catch (error) {
      console.error(error.message);
      return [];
    }
  },

  addDocuments: async function (workspace, additions = [], userId = null, enhancedMetadata = {}) {
    const VectorDb = getVectorDbClass();
    if (additions.length === 0) return { failed: [], embedded: [] };
    const { fileData } = require("../utils/files");
    const embedded = [];
    const failedToEmbed = [];
    const errors = new Set();

    for (const path of additions) {
      const data = await fileData(path);
      if (!data) continue;

      const docId = uuidv4();
      const { pageContent, ...metadata } = data;
      
      // Build enhanced document data with Phase 1.2 metadata
      const newDoc = {
        docId,
        filename: path.split("/")[1],
        docpath: path,
        workspaceId: workspace.id,
        metadata: JSON.stringify(metadata),
        // Phase 1.2 enhancements
        sourceType: enhancedMetadata.sourceType || 'manual_upload',
        category: enhancedMetadata.category || null,
        priority: enhancedMetadata.priority || 0,
        syncMetadata: enhancedMetadata.syncEnabled ? Document.createSyncMetadata({
          sync_schedule: enhancedMetadata.syncSchedule,
          sync_url: enhancedMetadata.sourceUrl,
          sync_status: 'idle'
        }) : null,
        businessContext: enhancedMetadata.businessContext ? Document.createBusinessContext(enhancedMetadata.businessContext) : null
      };

      // Add enhanced metadata to vector data for improved retrieval
      const vectorData = {
        ...data,
        docId,
        metadata: {
          ...metadata,
          sourceType: newDoc.sourceType,
          category: newDoc.category,
          priority: newDoc.priority,
          sourceUrl: enhancedMetadata.sourceUrl
        }
      };

      const { vectorized, error } = await VectorDb.addDocumentToNamespace(
        workspace.slug,
        vectorData,
        path
      );

      if (!vectorized) {
        console.error(
          "Failed to vectorize",
          metadata?.title || newDoc.filename
        );
        failedToEmbed.push(metadata?.title || newDoc.filename);
        errors.add(error);
        continue;
      }

      try {
        await prisma.workspace_documents.create({ data: newDoc });
        embedded.push(path);
        
        // Log enhanced metadata for debugging
        if (enhancedMetadata.sourceType && enhancedMetadata.sourceType !== 'manual_upload') {
          console.log(`Document ${newDoc.filename} added with enhanced metadata: sourceType=${newDoc.sourceType}, category=${newDoc.category}`);
        }
      } catch (error) {
        console.error("Failed to create workspace document:", error.message);
        errors.add(error.message);
      }
    }

    await Telemetry.sendTelemetry("documents_embedded_in_workspace", {
      LLMSelection: process.env.LLM_PROVIDER || "openai",
      Embedder: process.env.EMBEDDING_ENGINE || "inherit",
      VectorDbSelection: process.env.VECTOR_DB || "lancedb",
      TTSSelection: process.env.TTS_PROVIDER || "native",
      LLMModel: getModelTag(),
      // Phase 1.2 telemetry enhancements
      sourceType: enhancedMetadata.sourceType || 'manual_upload',
      hasCategory: !!enhancedMetadata.category,
      hasBusinessContext: !!enhancedMetadata.businessContext
    });
    
    await EventLogs.logEvent(
      "workspace_documents_added",
      {
        workspaceName: workspace?.name || "Unknown Workspace",
        numberOfDocumentsAdded: additions.length,
        sourceType: enhancedMetadata.sourceType || 'manual_upload',
        category: enhancedMetadata.category,
        priority: enhancedMetadata.priority || 0
      },
      userId
    );
    
    return { failedToEmbed, errors: Array.from(errors), embedded };
  },

  removeDocuments: async function (workspace, removals = [], userId = null) {
    const VectorDb = getVectorDbClass();
    if (removals.length === 0) return;

    for (const path of removals) {
      const document = await this.get({
        docpath: path,
        workspaceId: workspace.id,
      });
      if (!document) continue;
      await VectorDb.deleteDocumentFromNamespace(
        workspace.slug,
        document.docId
      );

      try {
        await prisma.workspace_documents.delete({
          where: { id: document.id, workspaceId: workspace.id },
        });
        await prisma.document_vectors.deleteMany({
          where: { docId: document.docId },
        });
      } catch (error) {
        console.error(error.message);
      }
    }

    await EventLogs.logEvent(
      "workspace_documents_removed",
      {
        workspaceName: workspace?.name || "Unknown Workspace",
        numberOfDocuments: removals.length,
      },
      userId
    );
    return true;
  },

  count: async function (clause = {}, limit = null) {
    try {
      const count = await prisma.workspace_documents.count({
        where: clause,
        ...(limit !== null ? { take: limit } : {}),
      });
      return count;
    } catch (error) {
      console.error("FAILED TO COUNT DOCUMENTS.", error.message);
      return 0;
    }
  },
  update: async function (id = null, data = {}) {
    if (!id) throw new Error("No workspace document id provided for update");

    const validKeys = Object.keys(data).filter((key) =>
      this.writable.includes(key)
    );
    if (validKeys.length === 0)
      return { document: { id }, message: "No valid fields to update!" };

    try {
      const document = await prisma.workspace_documents.update({
        where: { id },
        data,
      });
      return { document, message: null };
    } catch (error) {
      console.error(error.message);
      return { document: null, message: error.message };
    }
  },
  _updateAll: async function (clause = {}, data = {}) {
    try {
      await prisma.workspace_documents.updateMany({
        where: clause,
        data,
      });
      return true;
    } catch (error) {
      console.error(error.message);
      return false;
    }
  },
  content: async function (docId) {
    if (!docId) throw new Error("No workspace docId provided!");
    const document = await this.get({ docId: String(docId) });
    if (!document) throw new Error(`Could not find a document by id ${docId}`);

    const { fileData } = require("../utils/files");
    const data = await fileData(document.docpath);
    return { title: data.title, content: data.pageContent };
  },
  contentByDocPath: async function (docPath) {
    const { fileData } = require("../utils/files");
    const data = await fileData(docPath);
    return { title: data.title, content: data.pageContent };
  },

  // Some data sources have encoded params in them we don't want to log - so strip those details.
  _stripSource: function (sourceString, type) {
    if (["confluence", "github"].includes(type)) {
      const _src = new URL(sourceString);
      _src.search = ""; // remove all search params that are encoded for resync.
      return _src.toString();
    }

    return sourceString;
  },

  /**
   * Phase 1.2: Enhanced metadata parsing with multi-source support
   * Parse sync metadata from JSON string
   * @param {string|null} syncMetadataJson 
   * @returns {object|null}
   */
  parseSyncMetadata: function (syncMetadataJson) {
    return safeJsonParse(syncMetadataJson, null);
  },

  /**
   * Parse business context from JSON string
   * @param {string|null} businessContextJson 
   * @returns {object|null}
   */
  parseBusinessContext: function (businessContextJson) {
    return safeJsonParse(businessContextJson, null);
  },

  /**
   * Create sync metadata object for storage
   * @param {object} syncData - { last_sync, sync_schedule, sync_status, sync_url, retry_count }
   * @returns {string}
   */
  createSyncMetadata: function (syncData = {}) {
    const defaultSync = {
      last_sync: null,
      sync_schedule: null,
      sync_status: 'idle',
      sync_url: null,
      retry_count: 0,
      ...syncData
    };
    return JSON.stringify(defaultSync);
  },

  /**
   * Create business context object for storage
   * @param {object} contextData - { category, product_line, priority, tags, department }
   * @returns {string}
   */
  createBusinessContext: function (contextData = {}) {
    const defaultContext = {
      category: null,
      product_line: null,
      priority: 0,
      tags: [],
      department: null,
      ...contextData
    };
    return JSON.stringify(defaultContext);
  },

  /**
   * Get documents by category with optional filtering
   * @param {number} workspaceId 
   * @param {string|string[]} categories 
   * @param {object} filters - Additional filters
   * @returns {Promise<Array>}
   */
  getByCategory: async function (workspaceId, categories = [], filters = {}) {
    const categoryFilter = Array.isArray(categories) 
      ? { in: categories }
      : categories;

    const whereClause = {
      workspaceId,
      ...(categories.length > 0 ? { category: categoryFilter } : {}),
      ...filters
    };

    return await this.where(whereClause);
  },

  /**
   * Get unique categories for a workspace
   * @param {number} workspaceId 
   * @returns {Promise<string[]>}
   */
  getCategories: async function (workspaceId) {
    try {
      const results = await prisma.workspace_documents.findMany({
        where: { workspaceId, category: { not: null } },
        select: { category: true },
        distinct: ['category']
      });
      return results.map(r => r.category).filter(Boolean);
    } catch (error) {
      console.error("Failed to get categories:", error.message);
      return [];
    }
  },

  /**
   * Update document with enhanced metadata
   * @param {number} docId 
   * @param {object} enhancedData - Contains sourceType, syncMetadata, businessContext, etc.
   * @returns {Promise<object>}
   */
  updateEnhanced: async function (docId, enhancedData = {}) {
    const validData = {};
    
    // Process enhanced fields
    if (enhancedData.sourceType) validData.sourceType = enhancedData.sourceType;
    if (enhancedData.category) validData.category = enhancedData.category;
    if (enhancedData.priority !== undefined) validData.priority = enhancedData.priority;
    
    // Handle JSON fields
    if (enhancedData.syncMetadata) {
      validData.syncMetadata = typeof enhancedData.syncMetadata === 'string' 
        ? enhancedData.syncMetadata 
        : JSON.stringify(enhancedData.syncMetadata);
    }
    
    if (enhancedData.businessContext) {
      validData.businessContext = typeof enhancedData.businessContext === 'string'
        ? enhancedData.businessContext
        : JSON.stringify(enhancedData.businessContext);
    }

    return await this.update(docId, validData);
  },

  /**
   * Functions for the backend API endpoints - not to be used by the frontend or elsewhere.
   * @namespace api
   */
  api: {
    /**
     * Process a document upload from the API and upsert it into the database. This
     * functionality should only be used by the backend /v1/documents/upload endpoints for post-upload embedding.
     * @param {string} wsSlugs - The slugs of the workspaces to embed the document into, will be comma-separated list of workspace slugs
     * @param {string} docLocation - The location/path of the document that was uploaded
     * @param {object} enhancedMetadata - Optional enhanced metadata for Phase 1.2 features
     * @returns {Promise<boolean>} - True if the document was uploaded successfully, false otherwise
     */
    uploadToWorkspace: async function (wsSlugs = "", docLocation = null, enhancedMetadata = {}) {
      if (!docLocation)
        return console.log(
          "No document location provided for embedding",
          docLocation
        );

      const slugs = wsSlugs
        .split(",")
        .map((slug) => String(slug)?.trim()?.toLowerCase());
      if (slugs.length === 0)
        return console.log(`No workspaces provided got: ${wsSlugs}`);

      const { Workspace } = require("./workspace");
      const workspaces = await Workspace.where({ slug: { in: slugs } });
      if (workspaces.length === 0)
        return console.log("No valid workspaces found for slugs: ", slugs);

      // Upsert the document into each workspace - do this sequentially
      // because the document may be large and we don't want to overwhelm the embedder, plus on the first
      // upsert we will then have the cache of the document - making n+1 embeds faster. If we parallelize this
      // we will have to do a lot of extra work to ensure that the document is not embedded more than once.
      for (const workspace of workspaces) {
        const { failedToEmbed = [], errors = [] } = await Document.addDocuments(
          workspace,
          [docLocation],
          null, // userId
          enhancedMetadata // Pass enhanced metadata to addDocuments
        );
        if (failedToEmbed.length > 0)
          return console.log(
            `Failed to embed document into workspace ${workspace.slug}`,
            errors
          );
        console.log(`Document embedded into workspace ${workspace.slug} with enhanced metadata...`);
      }

      return true;
    },
  },
};

module.exports = { Document };
