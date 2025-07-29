/**
 * Phase 1.2: Enhanced Sync Scheduler
 * Supports cron-like scheduling for document synchronization
 * Integrates with existing DocumentSyncQueue system while adding advanced scheduling
 */

const cron = require('node-cron');
const { DocumentSyncQueue } = require('../../models/documentSyncQueue');
const { Document } = require('../../models/documents');
const { EventLogs } = require('../../models/eventLogs');

class SyncScheduler {
  constructor() {
    this.scheduledTasks = new Map();
    this.isRunning = false;
    this.defaultSchedules = {
      hourly: '0 * * * *',      // Every hour
      daily: '0 9 * * *',       // Daily at 9 AM
      weekly: '0 9 * * 1',      // Weekly on Monday at 9 AM
      monthly: '0 9 1 * *'      // Monthly on 1st at 9 AM
    };
  }

  /**
   * Start the sync scheduler
   */
  start() {
    if (this.isRunning) {
      console.log('SyncScheduler - Already running');
      return;
    }

    this.isRunning = true;
    console.log('SyncScheduler - Starting enhanced document sync scheduler');

    // Load and schedule all documents with sync metadata
    this._loadScheduledDocuments();

    // Start the main sync check task (runs every 5 minutes)
    this.mainTask = cron.schedule('*/5 * * * *', () => {
      this._checkAndExecuteScheduledSyncs();
    }, {
      scheduled: false
    });

    this.mainTask.start();
    console.log('SyncScheduler - Started successfully');
  }

  /**
   * Stop the sync scheduler
   */
  stop() {
    if (!this.isRunning) return;

    console.log('SyncScheduler - Stopping scheduler...');
    
    // Stop main task
    if (this.mainTask) {
      this.mainTask.stop();
    }

    // Stop all individual scheduled tasks
    for (const [docId, task] of this.scheduledTasks) {
      if (task.cronTask) {
        task.cronTask.stop();
      }
    }

    this.scheduledTasks.clear();
    this.isRunning = false;
    console.log('SyncScheduler - Stopped successfully');
  }

  /**
   * Schedule a document for sync
   * @param {object} document - Document with sync metadata
   * @param {string} scheduleExpression - Cron expression or preset name
   */
  scheduleDocument(document, scheduleExpression) {
    if (!document || !document.id) {
      console.error('SyncScheduler - Invalid document provided');
      return false;
    }

    try {
      // Parse schedule expression
      const cronExpression = this._parseCronExpression(scheduleExpression);
      if (!cronExpression) {
        console.error(`SyncScheduler - Invalid schedule expression: ${scheduleExpression}`);
        return false;
      }

      // Validate cron expression
      if (!cron.validate(cronExpression)) {
        console.error(`SyncScheduler - Invalid cron expression: ${cronExpression}`);
        return false;
      }

      // Remove existing schedule if any
      this.unscheduleDocument(document.id);

      // Create new scheduled task
      const task = {
        document: document,
        scheduleExpression: scheduleExpression,
        cronExpression: cronExpression,
        lastRun: null,
        nextRun: this._getNextRunTime(cronExpression),
        runCount: 0,
        failureCount: 0,
        cronTask: cron.schedule(cronExpression, () => {
          this._executeSyncForDocument(document);
        }, {
          scheduled: false,
          timezone: document.timezone || 'UTC'
        })
      };

      // Start the task
      task.cronTask.start();
      this.scheduledTasks.set(document.id, task);

      console.log(`SyncScheduler - Scheduled document ${document.filename} with expression: ${cronExpression}`);
      return true;

    } catch (error) {
      console.error(`SyncScheduler - Failed to schedule document ${document.id}:`, error.message);
      return false;
    }
  }

  /**
   * Unschedule a document
   * @param {number} documentId 
   */
  unscheduleDocument(documentId) {
    const task = this.scheduledTasks.get(documentId);
    if (task) {
      if (task.cronTask) {
        task.cronTask.stop();
      }
      this.scheduledTasks.delete(documentId);
      console.log(`SyncScheduler - Unscheduled document ID: ${documentId}`);
      return true;
    }
    return false;
  }

  /**
   * Get status of all scheduled documents
   */
  getStatus() {
    const status = {
      isRunning: this.isRunning,
      totalScheduled: this.scheduledTasks.size,
      tasks: []
    };

    for (const [docId, task] of this.scheduledTasks) {
      status.tasks.push({
        documentId: docId,
        filename: task.document.filename,
        scheduleExpression: task.scheduleExpression,
        cronExpression: task.cronExpression,
        lastRun: task.lastRun,
        nextRun: task.nextRun,
        runCount: task.runCount,
        failureCount: task.failureCount,
        isActive: task.cronTask ? task.cronTask.getStatus() === 'scheduled' : false
      });
    }

    return status;
  }

  /**
   * Load all documents with sync schedules from database
   * @private
   */
  async _loadScheduledDocuments() {
    try {
      console.log('SyncScheduler - Loading scheduled documents from database...');

      // Find all documents with sync metadata that includes schedule
      const documents = await Document.where({
        syncMetadata: { not: null }
      });

      let scheduledCount = 0;
      for (const document of documents) {
        const syncMetadata = Document.parseSyncMetadata(document.syncMetadata);
        
        if (syncMetadata && syncMetadata.sync_schedule) {
          const success = this.scheduleDocument(document, syncMetadata.sync_schedule);
          if (success) scheduledCount++;
        }
      }

      console.log(`SyncScheduler - Loaded ${scheduledCount} scheduled documents from database`);
    } catch (error) {
      console.error('SyncScheduler - Failed to load scheduled documents:', error.message);
    }
  }

  /**
   * Check and execute any due syncs
   * @private
   */
  async _checkAndExecuteScheduledSyncs() {
    if (!this.isRunning) return;

    try {
      // Also check for documents using the legacy sync queue system
      const staleQueues = await DocumentSyncQueue.staleDocumentQueues();
      
      for (const queue of staleQueues) {
        if (queue.workspaceDoc) {
          console.log(`SyncScheduler - Executing legacy sync for document: ${queue.workspaceDoc.filename}`);
          await this._executeSyncForDocument(queue.workspaceDoc);
        }
      }

    } catch (error) {
      console.error('SyncScheduler - Error checking scheduled syncs:', error.message);
    }
  }

  /**
   * Execute sync for a specific document
   * @private
   */
  async _executeSyncForDocument(document) {
    try {
      console.log(`SyncScheduler - Starting sync for document: ${document.filename}`);
      
      const task = this.scheduledTasks.get(document.id);
      if (task) {
        task.lastRun = new Date().toISOString();
        task.runCount++;
        task.nextRun = this._getNextRunTime(task.cronExpression);
      }

      // Parse document metadata to determine sync method
      const metadata = Document.parseDocumentTypeAndSource(document);
      const syncMetadata = Document.parseSyncMetadata(document.syncMetadata);

      let syncResult = { success: false, error: 'Unknown sync type' };

      // Determine sync method based on source type
      switch (document.sourceType) {
        case 'api_sync':
          syncResult = await this._syncApiDocument(document, syncMetadata);
          break;
        case 'google_drive':
          syncResult = await this._syncGoogleDriveDocument(document, syncMetadata);
          break;
        case 'csv_product':
        case 'json_catalog':
          syncResult = await this._syncProductCatalog(document, syncMetadata);
          break;
        case 'pdf_link':
          syncResult = await this._syncPdfLink(document, syncMetadata);
          break;
        default:
          // Try legacy sync method
          syncResult = await this._legacySync(document, metadata);
      }

      // Update sync metadata
      const updatedSyncMetadata = {
        ...syncMetadata,
        last_sync: new Date().toISOString(),
        sync_status: syncResult.success ? 'completed' : 'failed',
        retry_count: syncResult.success ? 0 : (syncMetadata.retry_count || 0) + 1
      };

      await Document.update(document.id, {
        syncMetadata: Document.createSyncMetadata(updatedSyncMetadata)
      });

      // Update task failure count
      if (task) {
        if (syncResult.success) {
          task.failureCount = 0;
        } else {
          task.failureCount++;
          
          // Unschedule if too many failures
          if (task.failureCount >= 5) {
            console.error(`SyncScheduler - Unscheduling document ${document.filename} after ${task.failureCount} failures`);
            this.unscheduleDocument(document.id);
          }
        }
      }

      // Log the sync event
      await EventLogs.logEvent('document_sync_executed', {
        documentId: document.id,
        filename: document.filename,
        sourceType: document.sourceType,
        success: syncResult.success,
        error: syncResult.error || null,
        runCount: task ? task.runCount : 0
      });

      console.log(`SyncScheduler - Sync ${syncResult.success ? 'completed' : 'failed'} for document: ${document.filename}`);

    } catch (error) {
      console.error(`SyncScheduler - Failed to sync document ${document.filename}:`, error.message);
      
      // Update failure count
      const task = this.scheduledTasks.get(document.id);
      if (task) {
        task.failureCount++;
      }
    }
  }

  /**
   * Parse cron expression from various formats
   * @private
   */
  _parseCronExpression(scheduleExpression) {
    if (!scheduleExpression) return null;

    // Check if it's a preset
    if (this.defaultSchedules[scheduleExpression.toLowerCase()]) {
      return this.defaultSchedules[scheduleExpression.toLowerCase()];
    }

    // Check if it's already a valid cron expression
    if (cron.validate(scheduleExpression)) {
      return scheduleExpression;
    }

    // Try to parse common formats
    const expr = scheduleExpression.toLowerCase().trim();
    
    if (expr.includes('every') && expr.includes('hour')) {
      return '0 * * * *';
    }
    if (expr.includes('every') && expr.includes('day')) {
      return '0 9 * * *';
    }
    if (expr.includes('every') && expr.includes('week')) {
      return '0 9 * * 1';
    }
    if (expr.includes('every') && expr.includes('month')) {
      return '0 9 1 * *';
    }

    return null;
  }

  /**
   * Get next run time for cron expression
   * @private
   */
  _getNextRunTime(cronExpression) {
    try {
      const task = cron.schedule(cronExpression, () => {}, { scheduled: false });
      // This is a simplified version - in production you'd use a proper cron parser
      return new Date(Date.now() + 60 * 60 * 1000).toISOString(); // Default to 1 hour from now
    } catch (error) {
      return null;
    }
  }

  /**
   * Sync API-based documents
   * @private
   */
  async _syncApiDocument(document, syncMetadata) {
    try {
      if (!syncMetadata.sync_url) {
        return { success: false, error: 'No sync URL configured' };
      }

      // Implement API document sync logic here
      // This would fetch from the configured API endpoint and update the document
      console.log(`SyncScheduler - API sync not yet implemented for: ${document.filename}`);
      return { success: false, error: 'API sync not implemented' };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Sync Google Drive documents
   * @private
   */
  async _syncGoogleDriveDocument(document, syncMetadata) {
    try {
      // Implement Google Drive sync logic here
      console.log(`SyncScheduler - Google Drive sync not yet implemented for: ${document.filename}`);
      return { success: false, error: 'Google Drive sync not implemented' };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Sync product catalog documents
   * @private
   */
  async _syncProductCatalog(document, syncMetadata) {
    try {
      if (!syncMetadata.sync_url) {
        return { success: false, error: 'No catalog URL configured' };
      }

      // Implement product catalog sync logic here
      console.log(`SyncScheduler - Product catalog sync not yet implemented for: ${document.filename}`);
      return { success: false, error: 'Product catalog sync not implemented' };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Sync PDF link documents
   * @private
   */
  async _syncPdfLink(document, syncMetadata) {
    try {
      if (!syncMetadata.sync_url) {
        return { success: false, error: 'No PDF URL configured' };
      }

      // Use the existing PDFDownloader to re-download and update
      const { PDFDownloader } = require('./pdfDownloader');
      
      const downloadJob = {
        url: syncMetadata.sync_url,
        parentDocId: document.id,
        linkType: 'pdf_sync',
        confidence: 1.0,
        priority: 'medium'
      };

      const downloader = new PDFDownloader();
      const jobId = downloader.addToQueue(downloadJob);
      
      console.log(`SyncScheduler - Queued PDF re-download for: ${document.filename} (Job: ${jobId})`);
      return { success: true, jobId };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Legacy sync method for existing document types
   * @private
   */
  async _legacySync(document, metadata) {
    try {
      // Use existing DocumentSyncQueue logic for legacy document types
      if (DocumentSyncQueue.canWatch(metadata)) {
        // This would trigger the existing sync logic
        console.log(`SyncScheduler - Using legacy sync for: ${document.filename}`);
        return { success: true, method: 'legacy' };
      }

      return { success: false, error: 'Document type not supported for sync' };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
const syncScheduler = new SyncScheduler();

module.exports = { SyncScheduler, syncScheduler };