const { CSVProductParser } = require('./csvProductParser');
const xlsx = require('xlsx');
const csv = require('csv-parser');
const fs = require('fs');
const { Readable } = require('stream');

/**
 * Phase 1.2: Link Extractor
 * Extracts PDF URLs and other document links from Excel/CSV files
 * Queues discovered links for background download and processing
 */
class LinkExtractor {
  constructor(options = {}) {
    this.options = {
      // URL patterns to match
      urlPatterns: [
        /https?:\/\/[^\s]+\.pdf(\?[^\s]*)?/gi,  // PDF URLs
        /https?:\/\/[^\s]+\.doc(x)?(\?[^\s]*)?/gi,  // Word docs
        /https?:\/\/[^\s]+\.ppt(x)?(\?[^\s]*)?/gi,  // PowerPoint
        /https?:\/\/[^\s]+\.xls(x)?(\?[^\s]*)?/gi,  // Excel files
        /https?:\/\/[^\s]+\.(zip|rar|7z)(\?[^\s]*)?/gi  // Archives
      ],
      
      // Cell patterns that likely contain document links
      linkIndicators: [
        'pdf', 'document', 'file', 'download', 'attachment', 'manual', 
        'spec', 'datasheet', 'brochure', 'catalog', 'guide', 'instructions'
      ],
      
      // Maximum URLs to extract per file
      maxUrls: 1000,
      
      // Skip common false positives
      excludePatterns: [
        /https?:\/\/[^\s]*\.(jpg|jpeg|png|gif|svg|ico)(\?[^\s]*)?/gi,  // Images
        /https?:\/\/[^\s]*\.(css|js|woff|ttf)(\?[^\s]*)?/gi,  // Web assets
      ],
      
      ...options
    };

    this.results = {
      links: [],
      errors: [],
      stats: {
        totalCells: 0,
        linksFound: 0,
        invalidUrls: 0,
        duplicateUrls: 0
      }
    };

    this.seenUrls = new Set();
  }

  /**
   * Extract links from Excel file
   * @param {string} filePath - Path to Excel file
   * @returns {Promise<object>}
   */
  async extractFromExcel(filePath) {
    try {
      const workbook = xlsx.readFile(filePath);
      const allLinks = [];

      // Process each worksheet
      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const sheetLinks = this._extractFromWorksheet(worksheet, sheetName);
        allLinks.push(...sheetLinks);
      }

      this.results.links = allLinks;
      return this._formatResults();
    } catch (error) {
      throw new Error(`Failed to extract links from Excel: ${error.message}`);
    }
  }

  /**
   * Extract links from CSV file
   * @param {string} filePath - Path to CSV file
   * @returns {Promise<object>}
   */
  async extractFromCSV(filePath) {
    return new Promise((resolve, reject) => {
      const links = [];
      let rowIndex = 0;

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          rowIndex++;
          const rowLinks = this._extractFromRow(row, rowIndex, 'CSV');
          links.push(...rowLinks);
        })
        .on('end', () => {
          this.results.links = links;
          resolve(this._formatResults());
        })
        .on('error', (error) => {
          reject(new Error(`Failed to extract links from CSV: ${error.message}`));
        });
    });
  }

  /**
   * Extract links from data buffer/string
   * @param {Buffer|string} data - File data
   * @param {string} fileType - 'csv' or 'excel'
   * @returns {Promise<object>}
   */
  async extractFromData(data, fileType) {
    if (fileType.toLowerCase() === 'csv') {
      return this._extractFromCSVData(data);
    } else if (['xlsx', 'xls', 'excel'].includes(fileType.toLowerCase())) {
      return this._extractFromExcelData(data);
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }
  }

  /**
   * Extract from Excel worksheet
   * @private
   */
  _extractFromWorksheet(worksheet, sheetName) {
    const links = [];
    const range = xlsx.utils.decode_range(worksheet['!ref'] || 'A1:Z100');

    for (let row = range.s.r; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = xlsx.utils.encode_cell({ r: row, c: col });
        const cell = worksheet[cellAddress];

        if (cell && cell.v) {
          this.results.stats.totalCells++;
          const cellLinks = this._extractUrlsFromText(
            String(cell.v), 
            sheetName, 
            cellAddress, 
            row + 1, 
            col + 1
          );
          links.push(...cellLinks);
        }
      }
    }

    return links;
  }

  /**
   * Extract from CSV row
   * @private
   */
  _extractFromRow(row, rowIndex, sheetName) {
    const links = [];

    for (const [columnName, cellValue] of Object.entries(row)) {
      if (cellValue) {
        this.results.stats.totalCells++;
        const cellLinks = this._extractUrlsFromText(
          String(cellValue), 
          sheetName, 
          columnName, 
          rowIndex, 
          columnName
        );
        links.push(...cellLinks);
      }
    }

    return links;
  }

  /**
   * Extract URLs from text content
   * @private
   */
  _extractUrlsFromText(text, sheetName, cellAddress, row, column) {
    const links = [];
    const normalizedText = text.toLowerCase();

    // Check if cell likely contains document links
    const hasLinkIndicator = this.options.linkIndicators.some(indicator => 
      normalizedText.includes(indicator)
    );

    // Extract all URLs using patterns
    for (const pattern of this.options.urlPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        for (const url of matches) {
          // Skip if URL matches exclude patterns
          const isExcluded = this.options.excludePatterns.some(excludePattern => 
            excludePattern.test(url)
          );
          
          if (isExcluded) continue;

          // Validate URL
          if (!this._isValidUrl(url)) {
            this.results.stats.invalidUrls++;
            continue;
          }

          // Check for duplicates
          if (this.seenUrls.has(url)) {
            this.results.stats.duplicateUrls++;
            continue;
          }

          this.seenUrls.add(url);
          this.results.stats.linksFound++;

          const linkInfo = {
            url: url.trim(),
            sourceSheet: sheetName,
            cellAddress: cellAddress,
            row: row,
            column: column,
            cellContent: text,
            hasLinkIndicator: hasLinkIndicator,
            extractedAt: new Date().toISOString(),
            linkType: this._determineLinkType(url),
            confidence: this._calculateConfidence(url, text, hasLinkIndicator)
          };

          links.push(linkInfo);

          // Check max URLs limit
          if (this.results.stats.linksFound >= this.options.maxUrls) {
            console.warn(`Reached maximum URL limit of ${this.options.maxUrls}`);
            return links;
          }
        }
      }
    }

    return links;
  }

  /**
   * Validate URL format
   * @private
   */
  _isValidUrl(urlString) {
    try {
      const url = new URL(urlString);
      return ['http:', 'https:'].includes(url.protocol);
    } catch {
      return false;
    }
  }

  /**
   * Determine link type based on URL
   * @private
   */
  _determineLinkType(url) {
    const urlLower = url.toLowerCase();
    
    if (urlLower.includes('.pdf')) return 'pdf';
    if (urlLower.includes('.doc')) return 'word';
    if (urlLower.includes('.ppt')) return 'powerpoint';
    if (urlLower.includes('.xls')) return 'excel';
    if (urlLower.includes('.zip') || urlLower.includes('.rar') || urlLower.includes('.7z')) return 'archive';
    
    return 'unknown';
  }

  /**
   * Calculate confidence score for link extraction
   * @private
   */
  _calculateConfidence(url, cellText, hasLinkIndicator) {
    let confidence = 0.5; // Base confidence

    // Boost for clear link indicators
    if (hasLinkIndicator) confidence += 0.3;

    // Boost for common document patterns
    if (/manual|guide|spec|datasheet|brochure/i.test(cellText)) confidence += 0.2;

    // Boost for PDF files (most likely to be documents)
    if (url.toLowerCase().includes('.pdf')) confidence += 0.2;

    // Reduce for very generic cell content
    if (cellText.length < 10) confidence -= 0.1;

    // Ensure confidence is between 0 and 1
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Extract from CSV data
   * @private
   */
  async _extractFromCSVData(csvData) {
    return new Promise((resolve, reject) => {
      const links = [];
      let rowIndex = 0;
      const stream = Readable.from([csvData]);

      stream
        .pipe(csv())
        .on('data', (row) => {
          rowIndex++;
          const rowLinks = this._extractFromRow(row, rowIndex, 'CSV');
          links.push(...rowLinks);
        })
        .on('end', () => {
          this.results.links = links;
          resolve(this._formatResults());
        })
        .on('error', reject);
    });
  }

  /**
   * Extract from Excel data
   * @private
   */
  _extractFromExcelData(excelData) {
    try {
      const workbook = xlsx.read(excelData, { type: 'buffer' });
      const allLinks = [];

      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const sheetLinks = this._extractFromWorksheet(worksheet, sheetName);
        allLinks.push(...sheetLinks);
      }

      this.results.links = allLinks;
      return this._formatResults();
    } catch (error) {
      throw new Error(`Failed to extract links from Excel data: ${error.message}`);
    }
  }

  /**
   * Format final results
   * @private
   */
  _formatResults() {
    // Sort links by confidence score (highest first)
    const sortedLinks = this.results.links.sort((a, b) => b.confidence - a.confidence);

    return {
      success: true,
      links: sortedLinks,
      metadata: {
        totalCells: this.results.stats.totalCells,
        linksFound: this.results.stats.linksFound,
        invalidUrls: this.results.stats.invalidUrls,
        duplicateUrls: this.results.stats.duplicateUrls,
        extractionDate: new Date().toISOString()
      },
      errors: this.results.errors,
      summary: `Extracted ${this.results.stats.linksFound} valid links from ${this.results.stats.totalCells} cells`
    };
  }

  /**
   * Static method to extract links from file
   * @param {string} filePath 
   * @param {string} fileType 
   * @param {object} options 
   */
  static async extractFromFile(filePath, fileType, options = {}) {
    const extractor = new LinkExtractor(options);
    
    if (fileType.toLowerCase() === 'csv') {
      return await extractor.extractFromCSV(filePath);
    } else if (['xlsx', 'xls', 'excel'].includes(fileType.toLowerCase())) {
      return await extractor.extractFromExcel(filePath);
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }
  }

  /**
   * Get download queue items for background processing
   * @param {Array} links - Links extracted from file
   * @param {number} parentDocId - ID of parent document
   * @returns {Array} - Queue items ready for processing
   */
  static createDownloadQueue(links, parentDocId) {
    return links.map((link, index) => ({
      id: `${parentDocId}_${index}`,
      parentDocId: parentDocId,
      url: link.url,
      linkType: link.linkType,
      confidence: link.confidence,
      sourceContext: {
        sheet: link.sourceSheet,
        cell: link.cellAddress,
        row: link.row,
        column: link.column,
        originalText: link.cellContent
      },
      status: 'pending',
      priority: link.confidence > 0.8 ? 'high' : (link.confidence > 0.6 ? 'medium' : 'low'),
      createdAt: new Date().toISOString(),
      retryCount: 0,
      maxRetries: 3
    }));
  }
}

module.exports = { LinkExtractor };