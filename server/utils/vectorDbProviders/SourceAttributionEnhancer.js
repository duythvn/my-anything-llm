/**
 * Phase 1.2: Source Attribution Enhancer
 * Extends vector metadata with comprehensive source information
 * for all vector database providers
 */

class SourceAttributionEnhancer {
  constructor() {
    this.defaultMetadata = {
      sourceType: 'manual_upload',
      category: null,
      priority: 0,
      confidence: 1.0,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Enhance vector metadata with comprehensive source attribution
   * @param {object} originalMetadata - Original document metadata
   * @param {object} enhancedDocumentData - Enhanced document data from Phase 1.2
   * @param {number} chunkIndex - Index of this chunk within the document
   * @param {string} textChunk - The actual text chunk
   * @returns {object} Enhanced metadata for vector storage
   */
  enhanceMetadata(originalMetadata = {}, enhancedDocumentData = {}, chunkIndex = 0, textChunk = '') {
    const now = new Date().toISOString();
    
    // Extract source information from enhanced document data
    const sourceInfo = this._extractSourceInfo(enhancedDocumentData);
    
    // Create comprehensive metadata
    const enhancedMetadata = {
      // Original metadata (preserved)
      ...originalMetadata,
      
      // Required for vector search (LangChain compatibility)
      text: textChunk,
      
      // Phase 1.2: Source Attribution
      sourceType: enhancedDocumentData.sourceType || sourceInfo.sourceType || this.defaultMetadata.sourceType,
      sourceUrl: enhancedDocumentData.sourceUrl || sourceInfo.sourceUrl || null,
      sourceSystem: sourceInfo.sourceSystem || null,
      sourceId: sourceInfo.sourceId || null,
      
      // Document Information
      docId: enhancedDocumentData.docId || originalMetadata.docId || null,
      filename: enhancedDocumentData.filename || originalMetadata.filename || null,
      docTitle: originalMetadata.title || enhancedDocumentData.title || null,
      docAuthor: originalMetadata.docAuthor || 'Unknown',
      
      // Chunk Information
      chunkIndex: chunkIndex,
      chunkId: `${enhancedDocumentData.docId || 'unknown'}_chunk_${chunkIndex}`,
      chunkLength: textChunk.length,
      chunkSource: originalMetadata.chunkSource || `${enhancedDocumentData.filename || 'document'}_chunk_${chunkIndex}`,
      
      // Categorization and Filtering
      category: enhancedDocumentData.category || this.defaultMetadata.category,
      tags: this._extractTagsFromContent(textChunk, enhancedDocumentData),
      priority: parseInt(enhancedDocumentData.priority) || this.defaultMetadata.priority,
      
      // Temporal Information
      createdAt: now,
      lastUpdatedAt: now,
      documentCreatedAt: originalMetadata.published || enhancedDocumentData.createdAt || now,
      
      // Quality and Confidence
      confidence: this._calculateChunkConfidence(textChunk, enhancedDocumentData),
      wordCount: this._countWords(textChunk),
      
      // Business Context
      businessContext: this._parseBusinessContext(enhancedDocumentData.businessContext),
      
      // Sync Information
      syncInfo: this._parseSyncInfo(enhancedDocumentData.syncMetadata),
      
      // Searchability Enhancements
      searchKeywords: this._extractSearchKeywords(textChunk),
      contentType: this._determineContentType(textChunk, enhancedDocumentData),
      
      // Phase 1.2: Multi-source tracking
      sourceFingerprint: this._generateSourceFingerprint(enhancedDocumentData),
      indexedAt: now,
      version: '1.2'
    };

    return enhancedMetadata;
  }

  /**
   * Extract source information from enhanced document data
   * @private
   */
  _extractSourceInfo(enhancedData) {
    const sourceInfo = {
      sourceType: enhancedData.sourceType || 'manual_upload',
      sourceUrl: enhancedData.sourceUrl || null,
      sourceSystem: null,
      sourceId: null
    };

    // Determine source system based on URL or type
    if (enhancedData.sourceUrl) {
      const url = enhancedData.sourceUrl.toLowerCase();
      if (url.includes('shopify')) {
        sourceInfo.sourceSystem = 'shopify';
      } else if (url.includes('woocommerce')) {
        sourceInfo.sourceSystem = 'woocommerce';
      } else if (url.includes('drive.google.com')) {
        sourceInfo.sourceSystem = 'google_drive';
      } else if (url.includes('docs.google.com')) {
        sourceInfo.sourceSystem = 'google_docs';
      }
    }

    // Extract source ID from metadata if available
    const businessContext = this._parseBusinessContext(enhancedData.businessContext);
    if (businessContext && businessContext.external_id) {
      sourceInfo.sourceId = businessContext.external_id;
    }

    return sourceInfo;
  }

  /**
   * Extract tags from content and document data
   * @private
   */
  _extractTagsFromContent(textChunk, enhancedData) {
    const tags = [];

    // Add category as a tag
    if (enhancedData.category) {
      tags.push(enhancedData.category);
    }

    // Add source type as a tag
    tags.push(enhancedData.sourceType || 'manual_upload');

    // Extract tags from business context
    const businessContext = this._parseBusinessContext(enhancedData.businessContext);
    if (businessContext && businessContext.tags && Array.isArray(businessContext.tags)) {
      tags.push(...businessContext.tags);
    }

    // Auto-detect content tags
    const contentTags = this._detectContentTags(textChunk);
    tags.push(...contentTags);

    return [...new Set(tags)]; // Remove duplicates
  }

  /**
   * Calculate confidence score for the chunk
   * @private
   */
  _calculateChunkConfidence(textChunk, enhancedData) {
    let confidence = 1.0;

    // Reduce confidence for very short chunks
    if (textChunk.length < 50) confidence -= 0.2;
    
    // Reduce confidence for very long chunks (might be poorly chunked)
    if (textChunk.length > 2000) confidence -= 0.1;

    // Boost confidence for structured content
    if (this._isStructuredContent(textChunk)) confidence += 0.1;

    // Apply source-specific confidence adjustments
    switch (enhancedData.sourceType) {
      case 'manual_upload':
        confidence += 0.1;
        break;
      case 'api_sync':
        confidence += 0.05;
        break;
      case 'pdf_link':
        confidence -= 0.05; // Might have extraction issues
        break;
    }

    return Math.max(0.1, Math.min(1.0, confidence));
  }

  /**
   * Count words in text chunk
   * @private
   */
  _countWords(text) {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Parse business context JSON safely
   * @private
   */
  _parseBusinessContext(businessContextJson) {
    if (!businessContextJson) return null;
    
    try {
      if (typeof businessContextJson === 'string') {
        return JSON.parse(businessContextJson);
      }
      return businessContextJson;
    } catch (error) {
      console.warn('SourceAttributionEnhancer - Failed to parse business context:', error.message);
      return null;
    }
  }

  /**
   * Parse sync metadata JSON safely
   * @private
   */
  _parseSyncInfo(syncMetadataJson) {
    if (!syncMetadataJson) return null;
    
    try {
      if (typeof syncMetadataJson === 'string') {
        return JSON.parse(syncMetadataJson);
      }
      return syncMetadataJson;
    } catch (error) {
      console.warn('SourceAttributionEnhancer - Failed to parse sync metadata:', error.message);
      return null;
    }
  }

  /**
   * Extract search keywords from text
   * @private
   */
  _extractSearchKeywords(text) {
    // Simple keyword extraction - extract important terms
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !this._isStopWord(word));

    // Get top 10 most frequent words
    const wordCounts = {};
    words.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });

    return Object.entries(wordCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  /**
   * Determine content type from text and metadata
   * @private
   */
  _determineContentType(textChunk, enhancedData) {
    // Check for FAQ patterns
    if (textChunk.includes('?') && (textChunk.includes('Q:') || textChunk.includes('A:'))) {
      return 'faq';
    }

    // Check for product information
    if (enhancedData.sourceType === 'csv_product' || enhancedData.sourceType === 'json_catalog') {
      return 'product';
    }

    // Check for procedure/instruction content
    if (textChunk.match(/step \d+|first|second|third|then|next|finally/i)) {
      return 'procedure';
    }

    // Check for policy content
    if (textChunk.match(/policy|regulation|rule|requirement|must|shall|prohibited/i)) {
      return 'policy';
    }

    return 'general';
  }

  /**
   * Detect content tags from text analysis
   * @private
   */
  _detectContentTags(text) {
    const tags = [];
    const lowerText = text.toLowerCase();

    // Product-related tags
    if (lowerText.match(/price|cost|\$|product|item|sku/)) tags.push('product');
    if (lowerText.match(/shipping|delivery|order|purchase/)) tags.push('shipping');
    if (lowerText.match(/return|refund|exchange|warranty/)) tags.push('returns');

    // Support-related tags
    if (lowerText.match(/help|support|problem|issue|trouble/)) tags.push('support');
    if (lowerText.match(/how to|tutorial|guide|instruction/)) tags.push('howto');

    // Technical tags
    if (lowerText.match(/technical|spec|specification|feature/)) tags.push('technical');
    if (lowerText.match(/install|setup|configure|setting/)) tags.push('setup');

    return tags;
  }

  /**
   * Check if content is structured (lists, tables, etc.)
   * @private
   */
  _isStructuredContent(text) {
    // Check for common structured patterns
    const structuredPatterns = [
      /^\d+\./m,           // Numbered lists
      /^[-*•]/m,           // Bullet points
      /\|.*\|/,            // Tables
      /:\s*$/m,            // Definition lists
      /^[A-Z][^.!?]*:$/m   // Section headers
    ];

    return structuredPatterns.some(pattern => pattern.test(text));
  }

  /**
   * Check if word is a stop word
   * @private
   */
  _isStopWord(word) {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 
      'with', 'by', 'this', 'that', 'is', 'are', 'was', 'were', 'be', 'been', 
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should'
    ]);
    return stopWords.has(word);
  }

  /**
   * Generate unique fingerprint for source tracking
   * @private
   */
  _generateSourceFingerprint(enhancedData) {
    const fingerprintData = {
      sourceType: enhancedData.sourceType,
      sourceUrl: enhancedData.sourceUrl,
      filename: enhancedData.filename,
      docId: enhancedData.docId
    };

    // Simple hash of the fingerprint data
    const dataString = JSON.stringify(fingerprintData);
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return `src_${Math.abs(hash).toString(36)}`;
  }

  /**
   * Create filter metadata for category-based filtering
   * @param {object} enhancedMetadata - Enhanced metadata object
   * @returns {object} Filter-ready metadata
   */
  createFilterMetadata(enhancedMetadata) {
    return {
      // Core filters
      sourceType: enhancedMetadata.sourceType,
      category: enhancedMetadata.category,
      priority: enhancedMetadata.priority,
      contentType: enhancedMetadata.contentType,
      
      // Tag filters
      tags: enhancedMetadata.tags || [],
      
      // Quality filters
      confidence: enhancedMetadata.confidence,
      wordCount: enhancedMetadata.wordCount,
      
      // Temporal filters
      createdAt: enhancedMetadata.createdAt,
      documentCreatedAt: enhancedMetadata.documentCreatedAt,
      
      // Source filters
      sourceSystem: enhancedMetadata.sourceSystem,
      sourceFingerprint: enhancedMetadata.sourceFingerprint
    };
  }

  /**
   * Extract source attribution for response generation
   * @param {object} retrievedDocument - Document from vector search
   * @returns {object} Source attribution information
   */
  extractSourceAttribution(retrievedDocument) {
    return {
      // Primary source info
      sourceType: retrievedDocument.sourceType || 'unknown',
      sourceUrl: retrievedDocument.sourceUrl,
      filename: retrievedDocument.filename,
      docTitle: retrievedDocument.docTitle,
      
      // Quality indicators
      confidence: retrievedDocument.confidence,
      score: retrievedDocument.score, // From vector search
      
      // Chunk info
      chunkSource: retrievedDocument.chunkSource,
      chunkIndex: retrievedDocument.chunkIndex,
      
      // Temporal info
      lastUpdatedAt: retrievedDocument.lastUpdatedAt,
      documentCreatedAt: retrievedDocument.documentCreatedAt,
      
      // Business context
      category: retrievedDocument.category,
      priority: retrievedDocument.priority,
      
      // For citation
      citationText: this._generateCitation(retrievedDocument)
    };
  }

  /**
   * Generate human-readable citation
   * @private
   */
  _generateCitation(doc) {
    const title = doc.docTitle || doc.filename || 'Unknown Document';
    const source = doc.sourceType === 'manual_upload' ? 'uploaded document' : 
                  doc.sourceType === 'api_sync' ? 'synced content' :
                  doc.sourceType === 'csv_product' ? 'product catalog' :
                  doc.sourceType === 'pdf_link' ? 'linked PDF' :
                  'document';
    
    let citation = `${title} (${source}`;
    
    if (doc.category) {
      citation += `, ${doc.category}`;
    }
    
    if (doc.documentCreatedAt) {
      const date = new Date(doc.documentCreatedAt).toLocaleDateString();
      citation += `, ${date}`;
    }
    
    citation += ')';
    return citation;
  }
}

module.exports = { SourceAttributionEnhancer };