const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { DocumentLinks } = require('../../models/documentLinks');
const { Document } = require('../../models/documents');

/**
 * Phase 1.2: PDF Download Queue System
 * Background worker for downloading PDFs found in Excel/CSV files
 * Handles retry logic, progress tracking, and parent-child relationships
 */
class PDFDownloader {
  constructor(options = {}) {
    this.options = {
      // Download settings
      maxConcurrentDownloads: 3,
      requestTimeout: 30000, // 30 seconds
      maxFileSize: 50 * 1024 * 1024, // 50MB
      retryDelay: 5000, // 5 seconds between retries
      
      // User agent to avoid bot blocking
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      
      // Storage settings
      downloadDirectory: path.join(process.cwd(), 'server', 'storage', 'downloads'),
      tempDirectory: path.join(process.cwd(), 'server', 'storage', 'temp'),
      
      ...options
    };

    // Ensure directories exist
    this._ensureDirectories();

    // Track active downloads
    this.activeDownloads = new Map();
    this.downloadQueue = [];
    this.isProcessing = false;

    // Statistics
    this.stats = {
      totalQueued: 0,
      completed: 0,
      failed: 0,
      retried: 0
    };
  }

  /**
   * Add download job to queue
   * @param {object} downloadJob - Job details
   * @returns {string} - Job ID
   */
  addToQueue(downloadJob) {
    const jobId = downloadJob.id || uuidv4();
    
    const job = {
      id: jobId,
      url: downloadJob.url,
      parentDocId: downloadJob.parentDocId,
      linkType: downloadJob.linkType || 'pdf_extraction',
      confidence: downloadJob.confidence || 0.5,
      sourceContext: downloadJob.sourceContext || {},
      priority: downloadJob.priority || 'medium',
      maxRetries: downloadJob.maxRetries || 3,
      retryCount: 0,
      status: 'queued',
      createdAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null,
      error: null,
      filePath: null,
      metadata: {}
    };

    // Insert based on priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const insertIndex = this.downloadQueue.findIndex(
      queuedJob => priorityOrder[queuedJob.priority] > priorityOrder[job.priority]
    );

    if (insertIndex === -1) {
      this.downloadQueue.push(job);
    } else {
      this.downloadQueue.splice(insertIndex, 0, job);
    }

    this.stats.totalQueued++;
    console.log(`PDF Downloader - Added job ${jobId} to queue (${this.downloadQueue.length} total)`);

    // Start processing if not already running
    if (!this.isProcessing) {
      this.startProcessing();
    }

    return jobId;
  }

  /**
   * Start processing the download queue
   */
  async startProcessing() {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    console.log('PDF Downloader - Starting queue processing');

    while (this.downloadQueue.length > 0 || this.activeDownloads.size > 0) {
      // Start new downloads up to concurrent limit
      while (
        this.downloadQueue.length > 0 && 
        this.activeDownloads.size < this.options.maxConcurrentDownloads
      ) {
        const job = this.downloadQueue.shift();
        this._processJob(job);
      }

      // Wait a bit before checking again
      await this._sleep(1000);
    }

    this.isProcessing = false;
    console.log('PDF Downloader - Queue processing completed');
  }

  /**
   * Process a single download job
   * @private
   */
  async _processJob(job) {
    job.status = 'downloading';
    job.startedAt = new Date().toISOString();
    this.activeDownloads.set(job.id, job);

    console.log(`PDF Downloader - Starting download: ${job.url}`);

    try {
      const result = await this._downloadFile(job);
      
      if (result.success) {
        await this._handleSuccessfulDownload(job, result);
        job.status = 'completed';
        job.completedAt = new Date().toISOString();
        job.filePath = result.filePath;
        job.metadata = result.metadata;
        this.stats.completed++;
        
        console.log(`PDF Downloader - Successfully downloaded: ${job.url}`);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error(`PDF Downloader - Download failed: ${job.url}`, error.message);
      await this._handleFailedDownload(job, error);
    }

    this.activeDownloads.delete(job.id);
  }

  /**
   * Download file from URL
   * @private
   */
  async _downloadFile(job) {
    try {
      // Validate URL
      const url = new URL(job.url);
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('Invalid URL protocol');
      }

      // Generate unique filename
      const fileName = this._generateFileName(job.url, job.id);
      const tempPath = path.join(this.options.tempDirectory, fileName);
      const finalPath = path.join(this.options.downloadDirectory, fileName);

      // Download with streaming to handle large files
      const response = await axios({
        method: 'GET',
        url: job.url,
        responseType: 'stream',
        timeout: this.options.requestTimeout,
        maxContentLength: this.options.maxFileSize,
        headers: {
          'User-Agent': this.options.userAgent,
          'Accept': 'application/pdf,application/octet-stream,*/*'
        }
      });

      // Check content type
      const contentType = response.headers['content-type'] || '';
      if (!contentType.includes('pdf') && !contentType.includes('application/octet-stream')) {
        console.warn(`PDF Downloader - Unexpected content type: ${contentType} for ${job.url}`);
      }

      // Stream to temp file
      const writer = fs.createWriteStream(tempPath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          // Move from temp to final location
          fs.renameSync(tempPath, finalPath);
          
          const stats = fs.statSync(finalPath);
          resolve({
            success: true,
            filePath: finalPath,
            metadata: {
              originalUrl: job.url,
              fileName: fileName,
              fileSize: stats.size,
              contentType: contentType,
              downloadedAt: new Date().toISOString()
            }
          });
        });

        writer.on('error', (error) => {
          // Clean up temp file
          if (fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
          }
          reject(error);
        });

        response.data.on('error', (error) => {
          writer.destroy();
          if (fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
          }
          reject(error);
        });
      });

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Handle successful download
   * @private
   */
  async _handleSuccessfulDownload(job, result) {
    try {
      // Create document record for the downloaded PDF
      const { fileData } = require('../files');
      const data = await fileData(result.filePath);
      
      if (!data) {
        throw new Error('Failed to process downloaded PDF');
      }

      const docId = uuidv4();
      const fileName = path.basename(result.filePath);
      
      // Create document record with enhanced metadata
      const newDoc = {
        docId,
        filename: fileName,
        docpath: result.filePath,
        workspaceId: null, // Will be set when added to workspace
        metadata: JSON.stringify({
          ...data,
          downloadSource: job.url,
          parentDocId: job.parentDocId,
          linkContext: job.sourceContext
        }),
        sourceType: 'pdf_link',
        syncMetadata: JSON.stringify({
          last_sync: new Date().toISOString(),
          sync_status: 'completed',
          sync_url: job.url,
          retry_count: job.retryCount
        }),
        businessContext: JSON.stringify({
          category: 'downloaded_document',
          priority: job.priority,
          confidence: job.confidence
        })
      };

      // Note: Document will be added to workspace during the embedding process
      // For now, we store the document info in the job metadata
      job.documentData = newDoc;

      // Create document link relationship
      if (job.parentDocId) {
        await DocumentLinks.create(
          job.parentDocId,
          null, // Child doc ID will be set when document is created
          job.linkType,
          {
            original_url: job.url,
            extraction_method: 'automatic_download',
            confidence: job.confidence,
            source_context: job.sourceContext,
            download_metadata: result.metadata
          }
        );
      }

    } catch (error) {
      console.error('PDF Downloader - Failed to process successful download:', error.message);
      // Don't fail the whole job, just log the error
      job.metadata.processingError = error.message;
    }
  }

  /**
   * Handle failed download
   * @private
   */
  async _handleFailedDownload(job, error) {
    job.error = error.message;
    job.retryCount++;

    if (job.retryCount <= job.maxRetries) {
      // Re-queue for retry after delay
      console.log(`PDF Downloader - Retrying job ${job.id} (attempt ${job.retryCount}/${job.maxRetries})`);
      
      setTimeout(() => {
        job.status = 'queued';
        job.error = null;
        this.downloadQueue.unshift(job); // Add to front for retry
        this.stats.retried++;
      }, this.options.retryDelay);
    } else {
      // Max retries exceeded
      job.status = 'failed';
      job.completedAt = new Date().toISOString();
      this.stats.failed++;
      
      console.error(`PDF Downloader - Job ${job.id} failed permanently after ${job.retryCount} attempts`);
    }
  }

  /**
   * Generate unique filename for download
   * @private
   */
  _generateFileName(url, jobId) {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const originalName = path.basename(pathname) || 'download.pdf';
      
      // Ensure PDF extension
      let fileName = originalName;
      if (!fileName.toLowerCase().endsWith('.pdf')) {
        fileName += '.pdf';
      }

      // Add job ID prefix to avoid conflicts
      return `${jobId}_${fileName}`;
    } catch (error) {
      return `${jobId}_download.pdf`;
    }
  }

  /**
   * Ensure required directories exist
   * @private
   */
  _ensureDirectories() {
    [this.options.downloadDirectory, this.options.tempDirectory].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`PDF Downloader - Created directory: ${dir}`);
      }
    });
  }

  /**
   * Sleep utility
   * @private
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get queue status
   * @returns {object}
   */
  getStatus() {
    return {
      isProcessing: this.isProcessing,
      queueLength: this.downloadQueue.length,
      activeDownloads: this.activeDownloads.size,
      stats: { ...this.stats }
    };
  }

  /**
   * Get job status
   * @param {string} jobId 
   * @returns {object|null}
   */
  getJobStatus(jobId) {
    const activeJob = this.activeDownloads.get(jobId);
    if (activeJob) return activeJob;

    const queuedJob = this.downloadQueue.find(job => job.id === jobId);
    return queuedJob || null;
  }

  /**
   * Clear completed and failed jobs from memory
   */
  cleanup() {
    const beforeCount = this.activeDownloads.size;
    
    for (const [jobId, job] of this.activeDownloads.entries()) {
      if (['completed', 'failed'].includes(job.status)) {
        this.activeDownloads.delete(jobId);
      }
    }

    const cleanedCount = beforeCount - this.activeDownloads.size;
    if (cleanedCount > 0) {
      console.log(`PDF Downloader - Cleaned up ${cleanedCount} completed/failed jobs`);
    }
  }

  /**
   * Static method to create and process download queue
   * @param {Array} downloadJobs 
   * @param {object} options 
   * @returns {PDFDownloader}
   */
  static async processQueue(downloadJobs, options = {}) {
    const downloader = new PDFDownloader(options);
    
    // Add all jobs to queue
    const jobIds = downloadJobs.map(job => downloader.addToQueue(job));
    
    console.log(`PDF Downloader - Added ${jobIds.length} jobs to queue`);
    
    return downloader;
  }
}

module.exports = { PDFDownloader };