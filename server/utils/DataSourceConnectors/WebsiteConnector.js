/**
 * WebsiteConnector - Connector for scraping and monitoring websites
 *
 * Extends AnythingLLM's existing website scraping capabilities with real-time
 * monitoring, change detection, and enhanced metadata tracking.
 */

const { BaseConnector } = require("./BaseConnector");
const cheerio = require("cheerio");
const crypto = require("crypto");

class WebsiteConnector extends BaseConnector {
  /**
   * Constructor for WebsiteConnector
   * @param {Object} config - Configuration object
   * @param {string} config.url - Website URL to scrape
   * @param {Object} config.scrapeOptions - Scraping options
   * @param {number} config.timeout - Request timeout in milliseconds
   * @param {Array} config.selectors - CSS selectors for content extraction
   * @param {Array} config.excludeSelectors - CSS selectors to exclude
   * @param {boolean} config.followLinks - Whether to follow internal links
   * @param {number} config.maxDepth - Maximum crawl depth
   * @param {Object} config.headers - Custom HTTP headers
   */
  constructor(config = {}) {
    super({
      ...config,
      type: "website",
      updateFrequency: config.updateFrequency || "daily",
    });

    this.url = config.url;
    if (!this.url) {
      throw new Error("Website URL is required for WebsiteConnector");
    }

    // Scraping configuration
    this.scrapeOptions = {
      timeout: config.timeout || 10000,
      selectors: config.selectors || [
        "p",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "article",
        "main",
      ],
      excludeSelectors: config.excludeSelectors || [
        "nav",
        "header",
        "footer",
        ".advertisement",
        ".sidebar",
      ],
      followLinks: config.followLinks || false,
      maxDepth: config.maxDepth || 1,
      headers: config.headers || {
        "User-Agent": "AnythingLLM-Bot/1.0 (+https://useanything.com/bot)",
      },
      ...config.scrapeOptions,
    };

    // Change detection
    this.lastContentHash = null;
    this.lastModified = null;
    this.lastEtag = null;

    // Update metadata with website-specific info
    this.updateMetadata({
      sourceUrl: this.url,
      description: `Website scraper for ${this.url}`,
      contentType: "website",
      scrapeOptions: this.scrapeOptions,
    });

    this.log(`Website connector initialized for: ${this.url}`);
  }

  /**
   * Connect to the website (test accessibility)
   * @returns {Promise<boolean>} - True if website is accessible
   */
  async connect() {
    try {
      this.log(`Testing connection to ${this.url}`);

      const response = await this.makeRequest(this.url, "HEAD");

      if (response.status >= 200 && response.status < 300) {
        this.isConnected = true;
        this.lastModified = response.headers["last-modified"];
        this.lastEtag = response.headers["etag"];

        this.log(
          `Successfully connected to ${this.url} (Status: ${response.status})`
        );
        return true;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      this.log(`Connection failed: ${error.message}`);
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Make HTTP request with proper error handling
   * @param {string} url - URL to request
   * @param {string} method - HTTP method
   * @returns {Promise<Object>} - Response object
   */
  async makeRequest(url, method = "GET") {
    // Use Node.js built-in fetch (available in Node 18+)
    // Note: fetch is global in Node 18+, no import needed

    const requestOptions = {
      method: method,
      headers: this.scrapeOptions.headers,
      timeout: this.scrapeOptions.timeout,
      redirect: "follow",
      // Handle SSL issues in development
      agent:
        process.env.NODE_ENV === "development"
          ? undefined // Let node-fetch handle it in production
          : undefined,
    };

    const response = await fetch(url, requestOptions);

    return {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      text: async () => await response.text(),
      url: response.url,
    };
  }

  /**
   * Check if website has been updated since last sync
   * @returns {Promise<boolean>} - True if updates are available
   */
  async hasUpdates() {
    try {
      const response = await this.makeRequest(this.url, "HEAD");

      // Check Last-Modified header
      const currentLastModified = response.headers["last-modified"];
      if (currentLastModified && this.lastModified) {
        const hasNewModifiedDate =
          new Date(currentLastModified) > new Date(this.lastModified);
        if (hasNewModifiedDate) {
          this.log("Content updated based on Last-Modified header");
          return true;
        }
      }

      // Check ETag header
      const currentEtag = response.headers["etag"];
      if (currentEtag && this.lastEtag && currentEtag !== this.lastEtag) {
        this.log("Content updated based on ETag header");
        return true;
      }

      // If no cache headers available, we need to fetch content to check
      if (!currentLastModified && !currentEtag) {
        this.log("No cache headers available, will check content hash");
        return true; // Force content check
      }

      this.log("No updates detected via headers");
      return false;
    } catch (error) {
      this.log(`Error checking for updates: ${error.message}`);
      // If we can't check, assume there might be updates
      return true;
    }
  }

  /**
   * Extract and structure content from HTML
   * @param {string} html - HTML content
   * @param {string} url - Source URL
   * @returns {Object} - Structured content object
   */
  extractContent(html, url) {
    const $ = cheerio.load(html);

    // Remove excluded elements
    this.scrapeOptions.excludeSelectors.forEach((selector) => {
      $(selector).remove();
    });

    // Extract content from specified selectors
    const contentParts = [];
    this.scrapeOptions.selectors.forEach((selector) => {
      $(selector).each((i, element) => {
        const text = $(element).text().trim();
        if (text && text.length > 5) {
          // Filter out very short content
          contentParts.push(text);
        }
      });
    });

    const content = contentParts.join("\n\n");

    // Extract metadata
    const title =
      $("title").text().trim() || $("h1").first().text().trim() || "Untitled";
    const description =
      $('meta[name="description"]').attr("content") ||
      $('meta[property="og:description"]').attr("content") ||
      content.substring(0, 200) + "...";

    // Calculate content hash for change detection
    const contentHash = crypto.createHash("md5").update(content).digest("hex");

    return {
      url: url,
      title: title,
      description: description,
      content: content,
      contentHash: contentHash,
      wordCount: content.split(/\s+/).length,
      extractedAt: new Date().toISOString(),
      metadata: {
        url: url,
        title: title,
        description: description,
        contentType: "website",
        sourceType: "website_scraper",
        wordCount: content.split(/\s+/).length,
        lastModified: this.lastModified,
        etag: this.lastEtag,
      },
    };
  }

  /**
   * Fetch and process website data
   * @param {Object} options - Fetch options
   * @returns {Promise<Array>} - Array of processed content objects
   */
  async fetchData(options = {}) {
    try {
      this.log(`Fetching data from ${this.url}`);

      // Get main page content
      const response = await this.makeRequest(this.url);
      const html = await response.text();

      // Update cache headers
      this.lastModified = response.headers["last-modified"];
      this.lastEtag = response.headers["etag"];

      // Extract and structure content
      const contentData = this.extractContent(html, this.url);

      // Check if content has actually changed
      if (
        this.lastContentHash &&
        contentData.contentHash === this.lastContentHash
      ) {
        this.log("Content hash unchanged, no updates detected");
        if (!options.force) {
          return [];
        }
      }

      this.lastContentHash = contentData.contentHash;

      const results = [contentData];

      // Follow internal links if configured
      if (this.scrapeOptions.followLinks && this.scrapeOptions.maxDepth > 1) {
        const additionalPages = await this.followInternalLinks(
          html,
          this.url,
          1
        );
        results.push(...additionalPages);
      }

      this.log(
        `Successfully extracted ${results.length} pages with ${results.reduce((total, page) => total + page.wordCount, 0)} total words`
      );

      return results;
    } catch (error) {
      this.log(`Error fetching data: ${error.message}`);
      throw error;
    }
  }

  /**
   * Follow internal links for deeper crawling
   * @param {string} html - HTML content to parse for links
   * @param {string} baseUrl - Base URL for resolving relative links
   * @param {number} currentDepth - Current crawl depth
   * @returns {Promise<Array>} - Array of additional content objects
   */
  async followInternalLinks(html, baseUrl, currentDepth) {
    if (currentDepth >= this.scrapeOptions.maxDepth) {
      return [];
    }

    const $ = cheerio.load(html);
    const links = [];
    const baseUrlObj = new URL(baseUrl);

    // Extract internal links
    $("a[href]").each((i, element) => {
      const href = $(element).attr("href");
      if (href) {
        try {
          const linkUrl = new URL(href, baseUrl);
          // Only follow links on the same domain
          if (
            linkUrl.hostname === baseUrlObj.hostname &&
            linkUrl.pathname !== baseUrlObj.pathname
          ) {
            links.push(linkUrl.toString());
          }
        } catch (error) {
          // Skip invalid URLs
        }
      }
    });

    // Limit number of links to follow
    const maxLinks = 10;
    const linksToFollow = [...new Set(links)].slice(0, maxLinks);

    const results = [];

    for (const link of linksToFollow) {
      try {
        this.log(`Following link: ${link} (depth: ${currentDepth + 1})`);
        const response = await this.makeRequest(link);
        const linkHtml = await response.text();
        const linkContent = this.extractContent(linkHtml, link);

        results.push(linkContent);

        // Recursively follow links from this page
        if (currentDepth + 1 < this.scrapeOptions.maxDepth) {
          const nestedResults = await this.followInternalLinks(
            linkHtml,
            link,
            currentDepth + 1
          );
          results.push(...nestedResults);
        }

        // Add delay to be respectful to the server
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        this.log(`Error following link ${link}: ${error.message}`);
        // Continue with other links
      }
    }

    return results;
  }

  /**
   * Validate website data
   * @param {Array} data - Data to validate
   * @returns {boolean} - True if data is valid
   */
  validateData(data) {
    if (!super.validateData(data)) {
      return false;
    }

    // Additional validation for website data
    if (Array.isArray(data)) {
      return data.every((item) => {
        return (
          item.content && item.url && item.title && item.content.length > 10
        ); // Minimum content length
      });
    }

    return false;
  }

  /**
   * Get website-specific metadata
   * @returns {Object} - Enhanced metadata
   */
  getMetadata() {
    const baseMetadata = super.getMetadata();

    return {
      ...baseMetadata,
      url: this.url,
      scrapeOptions: this.scrapeOptions,
      lastContentHash: this.lastContentHash,
      lastModified: this.lastModified,
      lastEtag: this.lastEtag,
      contentStatistics: {
        hasContentHash: !!this.lastContentHash,
        hasLastModified: !!this.lastModified,
        hasEtag: !!this.lastEtag,
      },
    };
  }

  /**
   * Update scraping configuration
   * @param {Object} newOptions - New scraping options
   */
  updateScrapeOptions(newOptions) {
    this.scrapeOptions = { ...this.scrapeOptions, ...newOptions };
    this.updateMetadata({ scrapeOptions: this.scrapeOptions });
    this.log("Scrape options updated", newOptions);
  }

  /**
   * Get content change summary
   * @returns {Object} - Summary of content changes
   */
  getChangesSummary() {
    return {
      hasContentHash: !!this.lastContentHash,
      hasLastModified: !!this.lastModified,
      hasEtag: !!this.lastEtag,
      lastSync: this.lastSync,
      changeDetectionMethod: this.lastEtag
        ? "etag"
        : this.lastModified
          ? "last-modified"
          : "content-hash",
    };
  }
}

module.exports = { WebsiteConnector };
