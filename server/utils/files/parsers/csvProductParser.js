const csv = require('csv-parser');
const fs = require('fs');
const { Readable } = require('stream');

/**
 * Phase 1.2: CSV Product Parser
 * Parses product catalog CSV files with streaming support for large files
 * Handles flexible column mapping and data validation
 */
class CSVProductParser {
  constructor(options = {}) {
    this.options = {
      // Default column mappings - can be overridden
      columnMappings: {
        sku: ['sku', 'product_id', 'item_id', 'id', 'product_code'],
        name: ['name', 'title', 'product_name', 'item_name', 'product_title'],
        description: ['description', 'desc', 'product_description', 'details', 'summary'],
        price: ['price', 'cost', 'amount', 'retail_price', 'unit_price'],
        category: ['category', 'type', 'product_type', 'section', 'department'],
        brand: ['brand', 'manufacturer', 'make', 'vendor', 'supplier'],
        availability: ['availability', 'stock', 'in_stock', 'available', 'status'],
        images: ['image', 'images', 'photo', 'picture', 'image_url'],
        weight: ['weight', 'mass', 'weight_kg', 'weight_lbs'],
        dimensions: ['dimensions', 'size', 'measurements', 'specs']
      },
      maxRows: 50000, // Prevent memory issues
      skipEmptyRows: true,
      trimWhitespace: true,
      ...options
    };
    
    this.results = {
      products: [],
      errors: [],
      stats: {
        totalRows: 0,
        validProducts: 0,
        skippedRows: 0,
        duplicateSKUs: 0
      }
    };
    
    this.seenSKUs = new Set();
  }

  /**
   * Parse CSV file from file path
   * @param {string} filePath - Path to CSV file
   * @returns {Promise<object>} - Parse results with products and metadata
   */
  async parseFromFile(filePath) {
    return new Promise((resolve, reject) => {
      if (!fs.existsSync(filePath)) {
        return reject(new Error(`CSV file not found: ${filePath}`));
      }

      const stream = fs.createReadStream(filePath);
      this._parseStream(stream, resolve, reject);
    });
  }

  /**
   * Parse CSV from buffer/string data
   * @param {Buffer|string} csvData - CSV data
   * @returns {Promise<object>} - Parse results
   */
  async parseFromData(csvData) {
    return new Promise((resolve, reject) => {
      const stream = Readable.from([csvData]);
      this._parseStream(stream, resolve, reject);
    });
  }

  /**
   * Internal method to parse CSV stream
   * @private
   */
  _parseStream(stream, resolve, reject) {
    let headers = null;
    let columnMap = null;
    let rowCount = 0;

    stream
      .pipe(csv({
        skipEmptyLines: this.options.skipEmptyRows,
        mapHeaders: ({ header }) => {
          return this.options.trimWhitespace ? header.trim().toLowerCase() : header.toLowerCase();
        }
      }))
      .on('headers', (headerList) => {
        headers = headerList;
        columnMap = this._createColumnMap(headerList);
        
        // Log detected columns for debugging
        console.log('CSV Parser - Detected columns:', headerList);
        console.log('CSV Parser - Column mappings:', columnMap);
      })
      .on('data', (row) => {
        rowCount++;
        this.results.stats.totalRows++;

        // Check row limit
        if (rowCount > this.options.maxRows) {
          this.results.errors.push({
            row: rowCount,
            error: `Exceeded maximum row limit of ${this.options.maxRows}`
          });
          return;
        }

        try {
          const product = this._processRow(row, columnMap, rowCount);
          if (product) {
            this.results.products.push(product);
            this.results.stats.validProducts++;
          } else {
            this.results.stats.skippedRows++;
          }
        } catch (error) {
          this.results.errors.push({
            row: rowCount,
            error: error.message,
            data: row
          });
        }
      })
      .on('end', () => {
        console.log(`CSV parsing complete: ${this.results.stats.validProducts} valid products from ${this.results.stats.totalRows} rows`);
        resolve(this._formatResults());
      })
      .on('error', (error) => {
        reject(error);
      });
  }

  /**
   * Create column mapping from CSV headers to standard product fields
   * @private
   */
  _createColumnMap(headers) {
    const columnMap = {};
    
    for (const [standardField, possibleColumns] of Object.entries(this.options.columnMappings)) {
      for (const header of headers) {
        const normalizedHeader = header.toLowerCase().trim();
        if (possibleColumns.includes(normalizedHeader)) {
          columnMap[standardField] = header;
          break;
        }
      }
    }
    
    return columnMap;
  }

  /**
   * Process a single CSV row into a product object
   * @private
   */
  _processRow(row, columnMap, rowNumber) {
    // Extract SKU first - it's required
    const sku = this._extractField(row, columnMap, 'sku');
    if (!sku) {
      this.results.errors.push({
        row: rowNumber,
        error: 'Missing required SKU field',
        data: row
      });
      return null;
    }

    // Check for duplicate SKUs
    if (this.seenSKUs.has(sku)) {
      this.results.stats.duplicateSKUs++;
      this.results.errors.push({
        row: rowNumber,
        error: `Duplicate SKU found: ${sku}`,
        data: row
      });
      return null;
    }
    this.seenSKUs.add(sku);

    // Extract name - also required
    const name = this._extractField(row, columnMap, 'name');
    if (!name) {
      this.results.errors.push({
        row: rowNumber,
        error: 'Missing required name field',
        data: row
      });
      return null;
    }

    // Build product object with all available fields
    const product = {
      sku: sku,
      name: name,
      description: this._extractField(row, columnMap, 'description') || '',
      price: this._parsePrice(this._extractField(row, columnMap, 'price')),
      category: this._extractField(row, columnMap, 'category') || 'uncategorized',
      brand: this._extractField(row, columnMap, 'brand') || null,
      availability: this._normalizeAvailability(this._extractField(row, columnMap, 'availability')),
      images: this._parseImages(this._extractField(row, columnMap, 'images')),
      specifications: this._extractSpecifications(row, columnMap),
      metadata: {
        source: 'csv_import',
        row_number: rowNumber,
        import_timestamp: new Date().toISOString(),
        original_data: row // Keep original for debugging
      }
    };

    return product;
  }

  /**
   * Extract field value using column mapping
   * @private
   */
  _extractField(row, columnMap, fieldName) {
    const columnName = columnMap[fieldName];
    if (!columnName || !row[columnName]) return null;
    
    const value = row[columnName];
    return this.options.trimWhitespace ? value.trim() : value;
  }

  /**
   * Parse price field with various formats
   * @private
   */
  _parsePrice(priceStr) {
    if (!priceStr) return null;
    
    // Remove currency symbols and parse
    const cleanPrice = priceStr.toString().replace(/[$€£¥,\s]/g, '');
    const price = parseFloat(cleanPrice);
    
    return isNaN(price) ? null : price;
  }

  /**
   * Normalize availability status
   * @private
   */
  _normalizeAvailability(availabilityStr) {
    if (!availabilityStr) return 'unknown';
    
    const status = availabilityStr.toLowerCase().trim();
    const inStockKeywords = ['in stock', 'available', 'yes', 'true', '1', 'in-stock'];
    const outOfStockKeywords = ['out of stock', 'unavailable', 'no', 'false', '0', 'out-of-stock'];
    
    if (inStockKeywords.some(keyword => status.includes(keyword))) {
      return 'in_stock';
    } else if (outOfStockKeywords.some(keyword => status.includes(keyword))) {
      return 'out_of_stock';
    }
    
    return status; // Return as-is if no clear mapping
  }

  /**
   * Parse images field (could be comma-separated URLs)
   * @private
   */
  _parseImages(imagesStr) {
    if (!imagesStr) return [];
    
    // Split by comma and clean up URLs
    const imageUrls = imagesStr.split(',')
      .map(url => url.trim())
      .filter(url => url.length > 0);
      
    return imageUrls;
  }

  /**
   * Extract additional specifications from unmapped columns
   * @private
   */
  _extractSpecifications(row, columnMap) {
    const specs = {};
    const mappedColumns = Object.values(columnMap);
    
    // Find columns that weren't mapped to standard fields
    for (const [header, value] of Object.entries(row)) {
      if (!mappedColumns.includes(header) && value && value.trim()) {
        specs[header] = value.trim();
      }
    }
    
    return Object.keys(specs).length > 0 ? specs : null;
  }

  /**
   * Format final results with summary information
   * @private
   */
  _formatResults() {
    return {
      success: true,
      products: this.results.products,
      metadata: {
        totalRows: this.results.stats.totalRows,
        validProducts: this.results.stats.validProducts,
        skippedRows: this.results.stats.skippedRows,
        duplicateSKUs: this.results.stats.duplicateSKUs,
        errorCount: this.results.errors.length,
        processingDate: new Date().toISOString()
      },
      errors: this.results.errors,
      // Summary for logging
      summary: `Processed ${this.results.stats.totalRows} rows, extracted ${this.results.stats.validProducts} valid products with ${this.results.errors.length} errors`
    };
  }

  /**
   * Static method to quickly parse a CSV file
   * @param {string} filePath - Path to CSV file
   * @param {object} options - Parser options
   * @returns {Promise<object>}
   */
  static async parseFile(filePath, options = {}) {
    const parser = new CSVProductParser(options);
    return await parser.parseFromFile(filePath);
  }

  /**
   * Static method to parse CSV data
   * @param {Buffer|string} csvData - CSV data
   * @param {object} options - Parser options
   * @returns {Promise<object>}
   */
  static async parseData(csvData, options = {}) {
    const parser = new CSVProductParser(options);
    return await parser.parseFromData(csvData);
  }
}

module.exports = { CSVProductParser };