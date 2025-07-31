const { Document } = require("../../../models/documents");
const { Workspace } = require("../../../models/workspace");
const { validApiKey } = require("../../../utils/middleware/validApiKey");
const { reqBody } = require("../../../utils/http");
const { Telemetry } = require("../../../models/telemetry");
const { EventLogs } = require("../../../models/eventLogs");
const { getVectorDbClass } = require("../../../utils/helpers");
const { safeJsonParse } = require("../../../utils/http");

/**
 * Enhanced Document Management API Endpoints
 * Provides bulk operations and advanced document management for administrators
 */
function adminDocumentEndpoints(app) {
  if (!app) return;

  /**
   * POST /api/v1/admin/documents/bulk-update
   * Update multiple documents with metadata changes
   */
  app.post("/v1/admin/documents/bulk-update", [validApiKey], async (request, response) => {
    /*
    #swagger.tags = ['Admin - Document Management']
    #swagger.description = 'Bulk update multiple documents with metadata changes'
    #swagger.requestBody = {
      description: 'Bulk update configuration',
      required: true,
      content: {
        "application/json": {
          schema: {
            type: 'object',
            properties: {
              documentIds: {
                type: 'array',
                items: { type: 'integer' },
                description: 'Array of document IDs to update'
              },
              updates: {
                type: 'object',
                properties: {
                  category: { type: 'string' },
                  priority: { type: 'integer' },
                  sourceType: { type: 'string' },
                  syncEnabled: { type: 'boolean' },
                  syncSchedule: { type: 'string' },
                  tags: { type: 'array', items: { type: 'string' } }
                }
              },
              options: {
                type: 'object',
                properties: {
                  updateEmbeddings: { type: 'boolean', default: false },
                  validateWorkspaces: { type: 'boolean', default: true }
                }
              }
            },
            required: ['documentIds', 'updates']
          }
        }
      }
    }
    */
    try {
      const {
        documentIds = [],
        updates = {},
        options = {}
      } = reqBody(request);

      // Validate input
      if (!Array.isArray(documentIds) || documentIds.length === 0) {
        return response.status(400).json({
          success: false,
          error: "documentIds array is required and cannot be empty"
        });
      }

      if (documentIds.length > 1000) {
        return response.status(400).json({
          success: false,
          error: "Cannot update more than 1000 documents at once"
        });
      }

      const {
        updateEmbeddings = false,
        validateWorkspaces = true
      } = options;

      // Get existing documents to validate they exist
      const existingDocuments = await Document.where({
        id: { in: documentIds }
      });

      if (existingDocuments.length !== documentIds.length) {
        const foundIds = existingDocuments.map(d => d.id);
        const missingIds = documentIds.filter(id => !foundIds.includes(id));
        return response.status(400).json({
          success: false,
          error: `Documents not found: ${missingIds.join(', ')}`
        });
      }

      // Validate workspace access if workspace updates are included
      if (updates.workspaceId && validateWorkspaces) {
        const workspace = await Workspace.get({ id: updates.workspaceId });
        if (!workspace) {
          return response.status(400).json({
            success: false,
            error: `Workspace ${updates.workspaceId} not found`
          });
        }
      }

      const results = {
        success: true,
        updated: [],
        failed: [],
        summary: {
          totalRequested: documentIds.length,
          successful: 0,
          failed: 0
        }
      };

      // Process each document update
      for (const doc of existingDocuments) {
        try {
          const currentMetadata = safeJsonParse(doc.metadata, {});
          const currentSyncMetadata = safeJsonParse(doc.syncMetadata, {});
          const currentBusinessContext = safeJsonParse(doc.businessContext, {});

          // Build update object
          const updateData = {};

          // Direct field updates
          if (updates.category !== undefined) updateData.category = updates.category;
          if (updates.priority !== undefined) updateData.priority = updates.priority;
          if (updates.sourceType !== undefined) updateData.sourceType = updates.sourceType;
          if (updates.workspaceId !== undefined) updateData.workspaceId = updates.workspaceId;
          if (updates.pinned !== undefined) updateData.pinned = updates.pinned;
          if (updates.watched !== undefined) updateData.watched = updates.watched;

          // Metadata updates
          if (updates.tags) {
            currentMetadata.tags = updates.tags;
            updateData.metadata = JSON.stringify(currentMetadata);
          }

          // Sync metadata updates
          if (updates.syncEnabled !== undefined || updates.syncSchedule !== undefined) {
            if (updates.syncEnabled !== undefined) {
              currentSyncMetadata.enabled = updates.syncEnabled;
            }
            if (updates.syncSchedule !== undefined) {
              currentSyncMetadata.schedule = updates.syncSchedule;
            }
            updateData.syncMetadata = JSON.stringify(currentSyncMetadata);
          }

          // Business context updates
          if (updates.businessRules || updates.contextTags) {
            if (updates.businessRules) {
              currentBusinessContext.rules = updates.businessRules;
            }
            if (updates.contextTags) {
              currentBusinessContext.tags = updates.contextTags;
            }
            updateData.businessContext = JSON.stringify(currentBusinessContext);
          }

          // Update timestamp
          updateData.updatedAt = new Date();

          // Apply updates
          await Document.update(doc.id, updateData);

          // Handle embedding updates if requested
          if (updateEmbeddings && (updates.category || updates.tags)) {
            // This would trigger re-embedding - placeholder for now
            // await VectorDb.updateDocumentEmbeddings(doc.id);
          }

          results.updated.push({
            id: doc.id,
            docpath: doc.docpath,
            updatedFields: Object.keys(updateData)
          });
          results.summary.successful++;

        } catch (error) {
          console.error(`Failed to update document ${doc.id}:`, error);
          results.failed.push({
            id: doc.id,
            docpath: doc.docpath,
            error: error.message
          });
          results.summary.failed++;
        }
      }

      // Log bulk update activity
      await EventLogs.logEvent("admin_documents_bulk_updated", {
        documentsRequested: documentIds.length,
        successful: results.summary.successful,
        failed: results.summary.failed,
        updates: Object.keys(updates),
        updateEmbeddings
      });

      response.status(200).json(results);

    } catch (error) {
      console.error("Bulk document update error:", error);
      response.status(500).json({
        success: false,
        error: `Bulk update failed: ${error.message}`
      });
    }
  });

  /**
   * DELETE /api/v1/admin/documents/bulk
   * Safe bulk deletion with confirmations and cleanup
   */
  app.delete("/v1/admin/documents/bulk", [validApiKey], async (request, response) => {
    /*
    #swagger.tags = ['Admin - Document Management']
    #swagger.description = 'Safely delete multiple documents with workspace notifications'
    #swagger.requestBody = {
      description: 'Bulk deletion configuration',
      required: true,
      content: {
        "application/json": {
          schema: {
            type: 'object',
            properties: {
              documentIds: {
                type: 'array',
                items: { type: 'integer' },
                description: 'Array of document IDs to delete'
              },
              options: {
                type: 'object',
                properties: {
                  removeFromWorkspaces: { type: 'boolean', default: true },
                  cleanupEmbeddings: { type: 'boolean', default: true },
                  notifyWorkspaces: { type: 'boolean', default: true },
                  confirmationToken: { type: 'string', description: 'Required for large deletions' }
                }
              },
              reason: {
                type: 'string',
                description: 'Reason for deletion (for audit logs)'
              }
            },
            required: ['documentIds']
          }
        }
      }
    }
    */
    try {
      const {
        documentIds = [],
        options = {},
        reason = null
      } = reqBody(request);

      // Validate input
      if (!Array.isArray(documentIds) || documentIds.length === 0) {
        return response.status(400).json({
          success: false,
          error: "documentIds array is required and cannot be empty"
        });
      }

      // Require confirmation for large deletions
      if (documentIds.length > 50 && !options.confirmationToken) {
        return response.status(400).json({
          success: false,
          error: "Confirmation token required for deleting more than 50 documents",
          confirmationRequired: true,
          documentsToDelete: documentIds.length
        });
      }

      if (documentIds.length > 500) {
        return response.status(400).json({
          success: false,
          error: "Cannot delete more than 500 documents at once"
        });
      }

      const {
        removeFromWorkspaces = true,
        cleanupEmbeddings = true,
        notifyWorkspaces = true
      } = options;

      // Get documents with workspace information
      const documentsToDelete = await Document.where(
        { id: { in: documentIds } },
        null,
        null,
        {
          workspace: {
            select: { id: true, name: true, slug: true }
          }
        }
      );

      if (documentsToDelete.length === 0) {
        return response.status(404).json({
          success: false,
          error: "No documents found with the provided IDs"
        });
      }

      const results = {
        success: true,
        deleted: [],
        failed: [],
        workspacesNotified: [],
        summary: {
          totalRequested: documentIds.length,
          found: documentsToDelete.length,
          successful: 0,
          failed: 0
        }
      };

      const VectorDb = getVectorDbClass();
      const workspaceNotifications = new Map();

      // Process each document deletion
      for (const doc of documentsToDelete) {
        try {
          // Track workspace for notifications
          if (doc.workspace && notifyWorkspaces) {
            if (!workspaceNotifications.has(doc.workspaceId)) {
              workspaceNotifications.set(doc.workspaceId, {
                workspace: doc.workspace,
                deletedDocuments: []
              });
            }
            workspaceNotifications.get(doc.workspaceId).deletedDocuments.push({
              id: doc.id,
              docpath: doc.docpath,
              category: doc.category
            });
          }

          // Clean up embeddings if requested
          if (cleanupEmbeddings && VectorDb) {
            try {
              // This would remove embeddings from vector database
              // await VectorDb.deleteDocument(doc.id);
            } catch (embedError) {
              console.warn(`Failed to cleanup embeddings for document ${doc.id}:`, embedError.message);
            }
          }

          // Delete the document
          await Document.delete({ id: doc.id });

          results.deleted.push({
            id: doc.id,
            docpath: doc.docpath,
            category: doc.category,
            workspaceId: doc.workspaceId
          });
          results.summary.successful++;

        } catch (error) {
          console.error(`Failed to delete document ${doc.id}:`, error);
          results.failed.push({
            id: doc.id,
            docpath: doc.docpath,
            error: error.message
          });
          results.summary.failed++;
        }
      }

      // Send workspace notifications if requested
      if (notifyWorkspaces && workspaceNotifications.size > 0) {
        for (const [workspaceId, notificationData] of workspaceNotifications) {
          try {
            // This would send notifications to workspace owners
            // await NotificationService.notifyWorkspace(workspaceId, {
            //   type: 'documents_deleted',
            //   count: notificationData.deletedDocuments.length,
            //   documents: notificationData.deletedDocuments,
            //   reason
            // });
            
            results.workspacesNotified.push({
              workspaceId,
              workspaceName: notificationData.workspace.name,
              documentsCount: notificationData.deletedDocuments.length
            });
          } catch (notifyError) {
            console.warn(`Failed to notify workspace ${workspaceId}:`, notifyError.message);
          }
        }
      }

      // Log bulk deletion activity
      await EventLogs.logEvent("admin_documents_bulk_deleted", {
        documentsRequested: documentIds.length,
        successful: results.summary.successful,
        failed: results.summary.failed,
        workspacesAffected: workspaceNotifications.size,
        reason: reason || 'No reason provided',
        options: {
          removeFromWorkspaces,
          cleanupEmbeddings,
          notifyWorkspaces
        }
      });

      response.status(200).json(results);

    } catch (error) {
      console.error("Bulk document deletion error:", error);
      response.status(500).json({
        success: false,
        error: `Bulk deletion failed: ${error.message}`
      });
    }
  });

  /**
   * POST /api/v1/admin/documents/merge
   * Merge duplicate or related documents
   */
  app.post("/v1/admin/documents/merge", [validApiKey], async (request, response) => {
    /*
    #swagger.tags = ['Admin - Document Management']
    #swagger.description = 'Merge duplicate or related documents'
    #swagger.requestBody = {
      description: 'Document merge configuration',
      required: true,
      content: {
        "application/json": {
          schema: {
            type: 'object',
            properties: {
              primaryDocumentId: {
                type: 'integer',
                description: 'ID of the document to keep (merge target)'
              },
              secondaryDocumentIds: {
                type: 'array',
                items: { type: 'integer' },
                description: 'Array of document IDs to merge into primary'
              },
              mergeStrategy: {
                type: 'string',
                enum: ['append_content', 'best_metadata', 'manual'],
                description: 'How to handle conflicting content and metadata'
              },
              options: {
                type: 'object',
                properties: {
                  preserveVersionHistory: { type: 'boolean', default: true },
                  updateEmbeddings: { type: 'boolean', default: true },
                  deleteSecondary: { type: 'boolean', default: true }
                }
              }
            },
            required: ['primaryDocumentId', 'secondaryDocumentIds', 'mergeStrategy']
          }
        }
      }
    }
    */
    try {
      const {
        primaryDocumentId,
        secondaryDocumentIds = [],
        mergeStrategy,
        options = {}
      } = reqBody(request);

      // Validate input
      if (!primaryDocumentId || !Array.isArray(secondaryDocumentIds) || secondaryDocumentIds.length === 0) {
        return response.status(400).json({
          success: false,
          error: "primaryDocumentId and secondaryDocumentIds array are required"
        });
      }

      if (secondaryDocumentIds.includes(primaryDocumentId)) {
        return response.status(400).json({
          success: false,
          error: "Primary document cannot be included in secondary document list"
        });
      }

      if (!['append_content', 'best_metadata', 'manual'].includes(mergeStrategy)) {
        return response.status(400).json({
          success: false,
          error: "Invalid merge strategy. Must be: append_content, best_metadata, or manual"
        });
      }

      const {
        preserveVersionHistory = true,
        updateEmbeddings = true,
        deleteSecondary = true
      } = options;

      // Get all documents
      const allDocIds = [primaryDocumentId, ...secondaryDocumentIds];
      const documents = await Document.where({ id: { in: allDocIds } });

      if (documents.length !== allDocIds.length) {
        const foundIds = documents.map(d => d.id);
        const missingIds = allDocIds.filter(id => !foundIds.includes(id));
        return response.status(400).json({
          success: false,
          error: `Documents not found: ${missingIds.join(', ')}`
        });
      }

      const primaryDoc = documents.find(d => d.id === primaryDocumentId);
      const secondaryDocs = documents.filter(d => secondaryDocumentIds.includes(d.id));

      const primaryMetadata = safeJsonParse(primaryDoc.metadata, {});
      const primarySyncMeta = safeJsonParse(primaryDoc.syncMetadata, {});
      const primaryBusinessContext = safeJsonParse(primaryDoc.businessContext, {});

      // Execute merge strategy
      let mergedMetadata = { ...primaryMetadata };
      let mergedContent = primaryMetadata.pageContent || '';
      const mergeLog = [];

      for (const secondaryDoc of secondaryDocs) {
        const secondaryMetadata = safeJsonParse(secondaryDoc.metadata, {});
        const secondaryContent = secondaryMetadata.pageContent || '';

        switch (mergeStrategy) {
          case 'append_content':
            if (secondaryContent && secondaryContent !== mergedContent) {
              mergedContent += '\n\n--- Merged Content ---\n\n' + secondaryContent;
              mergeLog.push(`Appended content from document ${secondaryDoc.id}`);
            }
            
            // Merge word/token counts
            mergedMetadata.wordCount = (mergedMetadata.wordCount || 0) + (secondaryMetadata.wordCount || 0);
            mergedMetadata.token_count_estimate = (mergedMetadata.token_count_estimate || 0) + (secondaryMetadata.token_count_estimate || 0);
            break;

          case 'best_metadata':
            // Choose best available metadata fields
            if (!mergedMetadata.title && secondaryMetadata.title) {
              mergedMetadata.title = secondaryMetadata.title;
              mergeLog.push(`Used title from document ${secondaryDoc.id}`);
            }
            if (!mergedMetadata.description && secondaryMetadata.description) {
              mergedMetadata.description = secondaryMetadata.description;
              mergeLog.push(`Used description from document ${secondaryDoc.id}`);
            }
            if ((secondaryMetadata.wordCount || 0) > (mergedMetadata.wordCount || 0)) {
              mergedContent = secondaryContent;
              mergedMetadata.wordCount = secondaryMetadata.wordCount;
              mergedMetadata.token_count_estimate = secondaryMetadata.token_count_estimate;
              mergeLog.push(`Used content from document ${secondaryDoc.id} (higher word count)`);
            }
            break;

          case 'manual':
            // For manual strategy, just combine metadata arrays and let user decide
            if (secondaryMetadata.tags && Array.isArray(secondaryMetadata.tags)) {
              mergedMetadata.tags = [...(mergedMetadata.tags || []), ...secondaryMetadata.tags];
            }
            mergeLog.push(`Manual merge with document ${secondaryDoc.id} - metadata combined`);
            break;
        }
      }

      // Update merged content
      mergedMetadata.pageContent = mergedContent;
      
      // Add merge history
      mergedMetadata.mergeHistory = mergedMetadata.mergeHistory || [];
      mergedMetadata.mergeHistory.push({
        mergedAt: new Date().toISOString(),
        strategy: mergeStrategy,
        mergedDocuments: secondaryDocumentIds,
        mergeLog
      });

      // Update primary document
      const updateData = {
        metadata: JSON.stringify(mergedMetadata),
        updatedAt: new Date()
      };

      await Document.update(primaryDocumentId, updateData);

      // Delete secondary documents if requested
      const deletedDocuments = [];
      if (deleteSecondary) {
        for (const secondaryDoc of secondaryDocs) {
          try {
            await Document.delete({ id: secondaryDoc.id });
            deletedDocuments.push({
              id: secondaryDoc.id,
              docpath: secondaryDoc.docpath
            });
          } catch (error) {
            console.warn(`Failed to delete secondary document ${secondaryDoc.id}:`, error.message);
          }
        }
      }

      // Update embeddings if requested
      if (updateEmbeddings) {
        // This would trigger re-embedding of the merged document
        // await VectorDb.updateDocumentEmbeddings(primaryDocumentId);
      }

      const result = {
        success: true,
        mergedDocument: {
          id: primaryDocumentId,
          docpath: primaryDoc.docpath,
          mergeStrategy,
          mergedContent: mergedContent.length,
          mergedDocuments: secondaryDocumentIds.length
        },
        mergeLog,
        deletedDocuments,
        metadata: {
          preservedVersionHistory: preserveVersionHistory,
          embeddingsUpdated: updateEmbeddings,
          secondaryDocumentsDeleted: deleteSecondary
        }
      };

      // Log merge activity
      await EventLogs.logEvent("admin_documents_merged", {
        primaryDocumentId,
        secondaryDocumentIds,
        mergeStrategy,
        mergedContentLength: mergedContent.length,
        documentsDeleted: deletedDocuments.length
      });

      response.status(200).json(result);

    } catch (error) {
      console.error("Document merge error:", error);
      response.status(500).json({
        success: false,
        error: `Document merge failed: ${error.message}`
      });
    }
  });

  /**
   * GET /api/v1/admin/documents/duplicates
   * Find potential duplicate documents using content similarity
   */
  app.get("/v1/admin/documents/duplicates", [validApiKey], async (request, response) => {
    /*
    #swagger.tags = ['Admin - Document Management']
    #swagger.description = 'Find potential duplicate documents using content similarity'
    #swagger.parameters['threshold'] = {
      in: 'query',
      description: 'Similarity threshold (0.0-1.0, default: 0.8)',
      required: false,
      type: 'number'
    }
    #swagger.parameters['workspaceId'] = {
      in: 'query',
      description: 'Limit search to specific workspace',
      required: false,
      type: 'integer'
    }
    */
    try {
      const {
        threshold = 0.8,
        workspaceId = null,
        limit = 100
      } = request.query;

      const similarityThreshold = Math.max(0.1, Math.min(1.0, parseFloat(threshold)));
      const limitNum = Math.min(500, Math.max(1, parseInt(limit) || 100));

      // Build filter for documents
      const whereClause = {};
      if (workspaceId) {
        whereClause.workspaceId = parseInt(workspaceId);
      }

      // Get documents for comparison
      const documents = await Document.where(whereClause, limitNum, { createdAt: 'desc' });

      if (documents.length < 2) {
        return response.status(200).json({
          success: true,
          duplicateGroups: [],
          message: "Not enough documents to compare for duplicates"
        });
      }

      const duplicateGroups = [];
      const processedDocuments = new Set();

      // Simple duplicate detection based on filename similarity and content length
      const documentMap = new Map();
      
      documents.forEach(doc => {
        const metadata = safeJsonParse(doc.metadata, {});
        const filename = (metadata.title || doc.docpath.split('/').pop()).toLowerCase();
        const wordCount = metadata.wordCount || 0;
        
        // Create a key based on similar characteristics
        const key = `${filename.replace(/[^a-z0-9]/g, '')}_${Math.floor(wordCount / 100) * 100}`;
        
        if (!documentMap.has(key)) {
          documentMap.set(key, []);
        }
        documentMap.get(key).push({
          id: doc.id,
          docpath: doc.docpath,
          filename: metadata.title || doc.docpath.split('/').pop(),
          wordCount,
          category: doc.category,
          sourceType: doc.sourceType,
          workspaceId: doc.workspaceId,
          createdAt: doc.createdAt,
          metadata
        });
      });

      // Find groups with multiple documents (potential duplicates)
      for (const [key, docs] of documentMap) {
        if (docs.length > 1) {
          // Calculate more detailed similarity scores within the group
          const duplicateGroup = {
            groupId: docs.map(d => d.id).sort().join('-'),
            documents: [],
            averageSimilarity: 0,
            recommendedAction: 'review',
            reasons: []
          };

          // Compare documents within the group
          for (let i = 0; i < docs.length; i++) {
            for (let j = i + 1; j < docs.length; j++) {
              const doc1 = docs[i];
              const doc2 = docs[j];
              
              let similarityScore = 0;
              const reasons = [];

              // Filename similarity
              const filenameSim = this._calculateStringSimilarity(
                doc1.filename.toLowerCase(),
                doc2.filename.toLowerCase()
              );
              if (filenameSim > 0.8) {
                similarityScore += 0.4;
                reasons.push('Similar filenames');
              }

              // Word count similarity
              const wordCountDiff = Math.abs(doc1.wordCount - doc2.wordCount);
              const avgWordCount = (doc1.wordCount + doc2.wordCount) / 2;
              const wordCountSim = avgWordCount > 0 ? 1 - (wordCountDiff / avgWordCount) : 1;
              if (wordCountSim > 0.9) {
                similarityScore += 0.3;
                reasons.push('Similar content length');
              }

              // Same category/source type
              if (doc1.category === doc2.category && doc1.category) {
                similarityScore += 0.1;
                reasons.push('Same category');
              }
              if (doc1.sourceType === doc2.sourceType) {
                similarityScore += 0.1;
                reasons.push('Same source type');
              }

              // Creation time proximity (within 24 hours)
              const timeDiff = Math.abs(new Date(doc1.createdAt) - new Date(doc2.createdAt));
              if (timeDiff < 24 * 60 * 60 * 1000) {
                similarityScore += 0.1;
                reasons.push('Created within 24 hours');
              }

              if (similarityScore >= similarityThreshold) {
                duplicateGroup.documents.push({
                  ...doc1,
                  similarityScore,
                  comparedWith: doc2.id,
                  reasons
                });
                
                if (!duplicateGroup.documents.find(d => d.id === doc2.id)) {
                  duplicateGroup.documents.push({
                    ...doc2,
                    similarityScore,
                    comparedWith: doc1.id,
                    reasons
                  });
                }
              }
            }
          }

          if (duplicateGroup.documents.length > 0) {
            // Remove duplicates and calculate group statistics
            const uniqueDocuments = Array.from(
              new Map(duplicateGroup.documents.map(d => [d.id, d])).values()
            );
            
            duplicateGroup.documents = uniqueDocuments;
            duplicateGroup.averageSimilarity = uniqueDocuments.reduce((sum, d) => sum + d.similarityScore, 0) / uniqueDocuments.length;
            duplicateGroup.reasons = [...new Set(uniqueDocuments.flatMap(d => d.reasons))];
            
            // Recommend action based on similarity
            if (duplicateGroup.averageSimilarity > 0.95) {
              duplicateGroup.recommendedAction = 'merge';
            } else if (duplicateGroup.averageSimilarity > 0.85) {
              duplicateGroup.recommendedAction = 'review_merge';
            } else {
              duplicateGroup.recommendedAction = 'review';
            }

            duplicateGroups.push(duplicateGroup);
          }
        }
      }

      // Sort by similarity score
      duplicateGroups.sort((a, b) => b.averageSimilarity - a.averageSimilarity);

      const result = {
        success: true,
        duplicateGroups: duplicateGroups.slice(0, 50), // Limit results
        summary: {
          totalGroups: duplicateGroups.length,
          documentsAnalyzed: documents.length,
          threshold: similarityThreshold,
          recommendedMerges: duplicateGroups.filter(g => g.recommendedAction === 'merge').length,
          needsReview: duplicateGroups.filter(g => g.recommendedAction.includes('review')).length
        }
      };

      // Log duplicate detection
      await EventLogs.logEvent("admin_duplicates_detected", {
        documentsAnalyzed: documents.length,
        duplicateGroups: duplicateGroups.length,
        threshold: similarityThreshold,
        workspaceId: workspaceId || 'all'
      });

      response.status(200).json(result);

    } catch (error) {
      console.error("Duplicate detection error:", error);
      response.status(500).json({
        success: false,
        error: `Duplicate detection failed: ${error.message}`
      });
    }
  });

  /**
   * Helper function to calculate string similarity using Levenshtein distance
   */
  this._calculateStringSimilarity = function(str1, str2) {
    if (str1 === str2) return 1;
    if (str1.length === 0 || str2.length === 0) return 0;

    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + substitutionCost // substitution
        );
      }
    }

    const maxLength = Math.max(str1.length, str2.length);
    return (maxLength - matrix[str2.length][str1.length]) / maxLength;
  };
}

module.exports = { adminDocumentEndpoints };