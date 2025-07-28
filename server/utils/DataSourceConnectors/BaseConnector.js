/**
 * BaseConnector - Abstract base class for all data source connectors
 *
 * This class provides a standardized interface for connecting to and retrieving
 * data from various external sources (websites, APIs, documents, etc.)
 *
 * All concrete connectors must extend this class and implement the abstract methods.
 */

const { v4: uuidv4 } = require("uuid");

class BaseConnector {
  /**
   * Constructor for BaseConnector
   * @param {Object} config - Configuration object for the connector
   * @param {string} config.id - Unique identifier for this connector instance
   * @param {string} config.name - Human-readable name for the connector
   * @param {string} config.type - Type of connector (website, document, api, etc.)
   * @param {Object} config.settings - Connector-specific settings
   */
  constructor(config = {}) {
    if (this.constructor === BaseConnector) {
      throw new Error(
        "BaseConnector is abstract and cannot be instantiated directly"
      );
    }

    this.id = config.id || uuidv4();
    this.name = config.name || "Unnamed Connector";
    this.type = config.type || "unknown";
    this.settings = config.settings || {};
    this.isConnected = false;
    this.lastSync = null;
    this.errorCount = 0;
    this.maxRetries = config.maxRetries || 3;

    // Metadata tracking for source attribution
    this.metadata = {
      created: new Date().toISOString(),
      sourceUrl: config.sourceUrl || null,
      description: config.description || "",
      reliability: 1.0, // Score from 0-1 for source reliability
      updateFrequency: config.updateFrequency || "manual", // manual, hourly, daily, weekly
    };

    this.log(`${this.constructor.name} connector initialized: ${this.name}`);
  }

  /**
   * Logging utility for consistent log formatting
   * @param {string} message - Log message
   * @param {...any} args - Additional arguments to log
   */
  log(message, ...args) {
    const timestamp = new Date().toISOString();
    console.log(
      `\x1b[36m[${this.constructor.name}:${this.id.slice(-8)}]\x1b[0m ${message}`,
      ...args
    );
  }

  /**
   * Connect to the data source
   * Must be implemented by concrete connectors
   * @returns {Promise<boolean>} - True if connection successful
   */
  async connect() {
    throw new Error(
      "connect() method must be implemented by concrete connector"
    );
  }

  /**
   * Disconnect from the data source
   * @returns {Promise<void>}
   */
  async disconnect() {
    this.isConnected = false;
    this.log("Disconnected from data source");
  }

  /**
   * Fetch data from the source
   * Must be implemented by concrete connectors
   * @param {Object} options - Fetch options (filters, pagination, etc.)
   * @returns {Promise<Array>} - Array of data items with metadata
   */
  async fetchData(options = {}) {
    throw new Error(
      "fetchData() method must be implemented by concrete connector"
    );
  }

  /**
   * Validate data format and structure
   * Can be overridden by concrete connectors for custom validation
   * @param {any} data - Data to validate
   * @returns {boolean} - True if data is valid
   */
  validateData(data) {
    if (!data) return false;

    // Basic validation - data should be an array or have content
    if (Array.isArray(data)) {
      return data.length > 0;
    }

    if (typeof data === "object") {
      return Object.keys(data).length > 0;
    }

    if (typeof data === "string") {
      return data.trim().length > 0;
    }

    return false;
  }

  /**
   * Check if the data source has been updated since last sync
   * Must be implemented by concrete connectors
   * @returns {Promise<boolean>} - True if source has updates
   */
  async hasUpdates() {
    throw new Error(
      "hasUpdates() method must be implemented by concrete connector"
    );
  }

  /**
   * Get metadata about the data source
   * @returns {Object} - Source metadata
   */
  getMetadata() {
    return {
      ...this.metadata,
      id: this.id,
      name: this.name,
      type: this.type,
      isConnected: this.isConnected,
      lastSync: this.lastSync,
      errorCount: this.errorCount,
      health: this.getHealthStatus(),
    };
  }

  /**
   * Update metadata for the connector
   * @param {Object} updates - Metadata updates
   */
  updateMetadata(updates) {
    this.metadata = { ...this.metadata, ...updates };
    this.log("Metadata updated", updates);
  }

  /**
   * Get health status of the connector
   * @returns {string} - Health status: healthy, warning, error
   */
  getHealthStatus() {
    if (this.errorCount === 0 && this.isConnected) {
      return "healthy";
    } else if (this.errorCount < this.maxRetries) {
      return "warning";
    } else {
      return "error";
    }
  }

  /**
   * Reset error count (used after successful operations)
   */
  resetErrors() {
    this.errorCount = 0;
  }

  /**
   * Record an error and increment error count
   * @param {Error} error - Error that occurred
   */
  recordError(error) {
    this.errorCount++;
    this.log(
      `Error recorded (${this.errorCount}/${this.maxRetries}):`,
      error.message
    );

    // Update reliability score based on error rate
    if (this.errorCount > 0) {
      this.metadata.reliability = Math.max(
        0,
        1 - this.errorCount / this.maxRetries
      );
    }
  }

  /**
   * Perform a full sync operation with error handling and retry logic
   * @param {Object} options - Sync options
   * @returns {Promise<Object>} - Sync result with data and metadata
   */
  async sync(options = {}) {
    const startTime = Date.now();
    this.log("Starting sync operation");

    try {
      // Connect if not already connected
      if (!this.isConnected) {
        await this.connect();
      }

      // Check if updates are available
      const hasUpdates = await this.hasUpdates();
      if (!hasUpdates && !options.force) {
        this.log("No updates available, skipping sync");
        return {
          success: true,
          skipped: true,
          message: "No updates available",
          metadata: this.getMetadata(),
        };
      }

      // Fetch data
      const data = await this.fetchData(options);

      // Validate data
      if (!this.validateData(data)) {
        throw new Error("Invalid data received from source");
      }

      // Update sync timestamp
      this.lastSync = new Date().toISOString();
      this.resetErrors();

      const duration = Date.now() - startTime;
      this.log(`Sync completed successfully in ${duration}ms`);

      return {
        success: true,
        data: data,
        itemCount: Array.isArray(data) ? data.length : 1,
        duration: duration,
        metadata: this.getMetadata(),
      };
    } catch (error) {
      this.recordError(error);
      const duration = Date.now() - startTime;

      this.log(`Sync failed after ${duration}ms:`, error.message);

      return {
        success: false,
        error: error.message,
        duration: duration,
        retryCount: this.errorCount,
        metadata: this.getMetadata(),
      };
    }
  }

  /**
   * Test the connection to the data source
   * @returns {Promise<Object>} - Test result
   */
  async testConnection() {
    try {
      const connected = await this.connect();
      if (connected) {
        await this.disconnect();
        return {
          success: true,
          message: "Connection test successful",
          metadata: this.getMetadata(),
        };
      } else {
        return {
          success: false,
          message: "Connection test failed",
          metadata: this.getMetadata(),
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Connection test failed: ${error.message}`,
        error: error.message,
        metadata: this.getMetadata(),
      };
    }
  }

  /**
   * Serialize connector configuration for storage
   * @returns {Object} - Serializable configuration
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      settings: this.settings,
      metadata: this.metadata,
      isConnected: this.isConnected,
      lastSync: this.lastSync,
      errorCount: this.errorCount,
    };
  }

  /**
   * Create a connector instance from stored configuration
   * @param {Object} config - Stored configuration
   * @returns {BaseConnector} - Connector instance
   */
  static fromJSON(config) {
    const connector = new this(config);
    connector.isConnected = config.isConnected || false;
    connector.lastSync = config.lastSync || null;
    connector.errorCount = config.errorCount || 0;
    return connector;
  }
}

module.exports = { BaseConnector };
