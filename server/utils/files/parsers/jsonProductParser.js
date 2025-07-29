/**
 * Phase 1.2: JSON Product Catalog Parser
 * Handles various JSON catalog formats including nested structures and custom field mappings
 * Supports multiple catalog formats from different e-commerce platforms
 */
class JSONProductParser {
  constructor(options = {}) {
    this.options = {
      // Field mapping configurations for different JSON structures
      fieldMappings: {
        // Standard e-commerce fields
        sku: ['sku', 'id', 'product_id', 'productId', 'item_id', 'itemId', 'identifier', 'code'],
        name: ['name', 'title', 'product_name', 'productName', 'item_name', 'itemName', 'display_name'],
        description: ['description', 'desc', 'product_description', 'summary', 'details', 'content'],
        price: ['price', 'cost', 'amount', 'retail_price', 'unit_price', 'base_price'],
        salePrice: ['sale_price', 'salePrice', 'discounted_price', 'special_price'],
        category: ['category', 'type', 'product_type', 'section', 'department', 'collection'],
        brand: ['brand', 'manufacturer', 'make', 'vendor', 'supplier', 'company'],
        availability: ['availability', 'stock', 'in_stock', 'available', 'status', 'inventory_status'],
        images: ['images', 'image', 'photos', 'pictures', 'media', 'gallery'],
        tags: ['tags', 'keywords', 'labels', 'categories'],
        weight: ['weight', 'mass', 'shipping_weight'],
        dimensions: ['dimensions', 'size', 'measurements', 'specs']
      },
      
      // Support for nested object paths (e.g., "product.details.name")
      allowNestedFields: true,
      
      // Maximum products to process
      maxProducts: 50000,
      
      // Skip products with missing required fields
      requireSKU: true,
      requireName: true,
      
      // Custom field extraction rules
      customExtractors: {},
      
      ...options
    };

    this.results = {
      products: [],
      errors: [],
      stats: {
        totalItems: 0,
        validProducts: 0,
        skippedItems: 0,
        duplicateSKUs: 0
      }
    };

    this.seenSKUs = new Set();
  }

  /**
   * Parse JSON catalog from file path
   * @param {string} filePath - Path to JSON file
   * @returns {Promise<object>}
   */
  async parseFromFile(filePath) {
    const fs = require('fs');
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`JSON file not found: ${filePath}`);
    }

    const jsonData = fs.readFileSync(filePath, 'utf8');
    return await this.parseFromString(jsonData);
  }

  /**
   * Parse JSON catalog from string data
   * @param {string} jsonString - JSON string data
   * @returns {Promise<object>}
   */
  async parseFromString(jsonString) {
    try {
      const jsonData = JSON.parse(jsonString);
      return await this.parseFromObject(jsonData);
    } catch (error) {
      throw new Error(`Invalid JSON format: ${error.message}`);
    }
  }

  /**
   * Parse JSON catalog from object
   * @param {object|array} jsonData - JSON object or array
   * @returns {Promise<object>}
   */
  async parseFromObject(jsonData) {
    console.log('JSON Parser - Starting catalog processing...');
    
    // Detect and extract products array from various JSON structures
    const products = this._extractProductsArray(jsonData);
    
    if (!Array.isArray(products)) {
      throw new Error('Could not find products array in JSON data');
    }

    console.log(`JSON Parser - Found ${products.length} potential products`);
    
    // Process each product
    for (let i = 0; i < products.length && i < this.options.maxProducts; i++) {
      this.results.stats.totalItems++;
      
      try {
        const product = this._processProduct(products[i], i);
        if (product) {
          this.results.products.push(product);
          this.results.stats.validProducts++;
        } else {
          this.results.stats.skippedItems++;
        }
      } catch (error) {
        this.results.errors.push({
          index: i,
          error: error.message,
          data: products[i]
        });
      }
    }

    return this._formatResults();
  }

  /**
   * Extract products array from various JSON structures
   * @private
   */
  _extractProductsArray(jsonData) {
    // If it's already an array, assume it's products
    if (Array.isArray(jsonData)) {
      return jsonData;
    }

    // Common product array field names
    const productKeys = [
      'products', 'items', 'data', 'catalog', 'inventory', 
      'product_list', 'productList', 'results', 'entries'
    ];

    // Look for products in root level
    for (const key of productKeys) {
      if (jsonData[key] && Array.isArray(jsonData[key])) {
        console.log(`JSON Parser - Found products in "${key}" field`);
        return jsonData[key];
      }
    }

    // Look for nested product arrays
    for (const [key, value] of Object.entries(jsonData)) {
      if (typeof value === 'object' && value !== null) {
        for (const productKey of productKeys) {
          if (value[productKey] && Array.isArray(value[productKey])) {
            console.log(`JSON Parser - Found products in "${key}.${productKey}" field`);
            return value[productKey];
          }
        }
      }
    }

    // If no clear products array found, return the object as single item
    if (typeof jsonData === 'object' && jsonData !== null) {
      console.log('JSON Parser - Treating root object as single product');
      return [jsonData];
    }

    return null;
  }

  /**
   * Process a single product object
   * @private
   */
  _processProduct(productData, index) {
    if (!productData || typeof productData !== 'object') {
      this.results.errors.push({
        index,
        error: 'Invalid product data - not an object',
        data: productData
      });
      return null;
    }

    // Extract required fields
    const sku = this._extractField(productData, 'sku');
    const name = this._extractField(productData, 'name');

    // Validate required fields
    if (this.options.requireSKU && !sku) {
      this.results.errors.push({
        index,
        error: 'Missing required SKU field',
        data: productData
      });
      return null;
    }

    if (this.options.requireName && !name) {
      this.results.errors.push({
        index,
        error: 'Missing required name field',
        data: productData
      });
      return null;
    }

    // Check for duplicate SKUs
    if (sku && this.seenSKUs.has(sku)) {
      this.results.stats.duplicateSKUs++;
      this.results.errors.push({
        index,
        error: `Duplicate SKU found: ${sku}`,
        data: productData
      });
      return null;
    }
    
    if (sku) this.seenSKUs.add(sku);

    // Build product object
    const product = {
      sku: sku || `generated_${index}`,
      name: name || 'Unnamed Product',
      description: this._extractField(productData, 'description') || '',
      price: this._extractPrice(productData),
      salePrice: this._extractPrice(productData, 'salePrice'),
      category: this._extractField(productData, 'category') || 'uncategorized',
      brand: this._extractField(productData, 'brand'),
      availability: this._normalizeAvailability(this._extractField(productData, 'availability')),
      images: this._extractImages(productData),
      tags: this._extractTags(productData),
      specifications: this._extractSpecifications(productData),
      metadata: {
        source: 'json_import',
        index: index,
        import_timestamp: new Date().toISOString(),
        original_data: productData
      }
    };

    return product;
  }

  /**
   * Extract field value using field mappings and nested path support
   * @private
   */
  _extractField(productData, fieldType) {
    const possibleFields = this.options.fieldMappings[fieldType] || [fieldType];

    for (const field of possibleFields) {
      const value = this._getNestedValue(productData, field);
      if (value !== null && value !== undefined && value !== '') {
        return typeof value === 'string' ? value.trim() : value;
      }
    }

    // Try custom extractors if available
    if (this.options.customExtractors[fieldType]) {
      try {
        return this.options.customExtractors[fieldType](productData);
      } catch (error) {
        console.warn(`Custom extractor failed for ${fieldType}:`, error.message);
      }
    }

    return null;
  }

  /**
   * Get nested value from object using dot notation
   * @private
   */
  _getNestedValue(obj, path) {
    if (!this.options.allowNestedFields || !path.includes('.')) {
      return obj[path];
    }

    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null;
    }, obj);
  }

  /**
   * Extract and normalize price
   * @private
   */
  _extractPrice(productData, priceType = 'price') {
    const priceValue = this._extractField(productData, priceType);
    
    if (!priceValue) return null;

    // Handle different price formats
    if (typeof priceValue === 'number') {
      return priceValue;
    }

    if (typeof priceValue === 'string') {
      // Remove currency symbols and parse
      const cleanPrice = priceValue.replace(/[$€£¥,\s]/g, '');
      const parsed = parseFloat(cleanPrice);
      return isNaN(parsed) ? null : parsed;
    }

    // Handle price objects (e.g., { amount: 29.99, currency: 'USD' })
    if (typeof priceValue === 'object') {
      const amount = priceValue.amount || priceValue.value || priceValue.price;
      return amount ? parseFloat(amount) : null;
    }

    return null;
  }

  /**
   * Extract and normalize images array
   * @private
   */
  _extractImages(productData) {
    const imagesValue = this._extractField(productData, 'images');
    
    if (!imagesValue) return [];

    // Handle array of images
    if (Array.isArray(imagesValue)) {
      return imagesValue
        .map(img => typeof img === 'string' ? img : (img.url || img.src || img.href))
        .filter(Boolean);
    }

    // Handle single image string
    if (typeof imagesValue === 'string') {
      return [imagesValue];
    }

    // Handle image object
    if (typeof imagesValue === 'object') {
      const urls = [];
      if (imagesValue.url) urls.push(imagesValue.url);
      if (imagesValue.src) urls.push(imagesValue.src);
      if (imagesValue.href) urls.push(imagesValue.href);
      return urls;
    }

    return [];
  }

  /**
   * Extract tags array
   * @private
   */
  _extractTags(productData) {
    const tagsValue = this._extractField(productData, 'tags');
    
    if (!tagsValue) return [];

    if (Array.isArray(tagsValue)) {
      return tagsValue.map(tag => typeof tag === 'string' ? tag : String(tag)).filter(Boolean);
    }

    if (typeof tagsValue === 'string') {
      // Split comma-separated tags
      return tagsValue.split(',').map(tag => tag.trim()).filter(Boolean);
    }

    return [];
  }

  /**
   * Normalize availability status
   * @private
   */
  _normalizeAvailability(availabilityValue) {
    if (!availabilityValue) return 'unknown';

    const status = String(availabilityValue).toLowerCase();
    
    if (['in stock', 'available', 'true', '1', 'yes', 'instock'].includes(status)) {
      return 'in_stock';
    }
    
    if (['out of stock', 'unavailable', 'false', '0', 'no', 'outofstock'].includes(status)) {
      return 'out_of_stock';
    }

    return status;
  }

  /**
   * Extract additional specifications from unmapped fields
   * @private
   */
  _extractSpecifications(productData) {
    const specs = {};
    const mappedFields = new Set();

    // Collect all mapped field names
    Object.values(this.options.fieldMappings).forEach(fields => {
      fields.forEach(field => mappedFields.add(field));
    });

    // Extract unmapped fields as specifications
    for (const [key, value] of Object.entries(productData)) {
      if (!mappedFields.has(key) && 
          value !== null && 
          value !== undefined && 
          value !== '' &&
          typeof value !== 'object') {
        specs[key] = value;
      }
    }

    return Object.keys(specs).length > 0 ? specs : null;
  }

  /**
   * Format final results
   * @private
   */
  _formatResults() {
    return {
      success: true,
      products: this.results.products,
      metadata: {
        totalItems: this.results.stats.totalItems,
        validProducts: this.results.stats.validProducts,
        skippedItems: this.results.stats.skippedItems,
        duplicateSKUs: this.results.stats.duplicateSKUs,
        errorCount: this.results.errors.length,
        processingDate: new Date().toISOString()
      },
      errors: this.results.errors,
      summary: `Processed ${this.results.stats.totalItems} items, extracted ${this.results.stats.validProducts} valid products with ${this.results.errors.length} errors`
    };
  }

  /**
   * Static method to quickly parse a JSON file
   * @param {string} filePath 
   * @param {object} options 
   * @returns {Promise<object>}
   */
  static async parseFile(filePath, options = {}) {
    const parser = new JSONProductParser(options);
    return await parser.parseFromFile(filePath);
  }

  /**
   * Static method to parse JSON string
   * @param {string} jsonString 
   * @param {object} options 
   * @returns {Promise<object>}
   */
  static async parseString(jsonString, options = {}) {
    const parser = new JSONProductParser(options);
    return await parser.parseFromString(jsonString);
  }

  /**
   * Static method to parse JSON object
   * @param {object} jsonData 
   * @param {object} options 
   * @returns {Promise<object>}
   */
  static async parseObject(jsonData, options = {}) {
    const parser = new JSONProductParser(options);
    return await parser.parseFromObject(jsonData);
  }
}

module.exports = { JSONProductParser };