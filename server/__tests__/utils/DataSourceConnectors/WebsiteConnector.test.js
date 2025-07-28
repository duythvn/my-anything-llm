/**
 * Tests for WebsiteConnector class
 * 
 * Tests website scraping functionality, change detection,
 * and integration with the BaseConnector interface.
 */

const { WebsiteConnector } = require("../../../utils/DataSourceConnectors/WebsiteConnector");

// Mock global fetch
global.fetch = jest.fn();

describe("WebsiteConnector", () => {
  let mockFetch;
  
  beforeEach(() => {
    mockFetch = global.fetch;
    jest.clearAllMocks();
  });

  describe("Constructor", () => {
    test("should create instance with valid URL", () => {
      const connector = new WebsiteConnector({
        url: "https://example.com"
      });
      
      expect(connector.url).toBe("https://example.com");
      expect(connector.type).toBe("website");
      expect(connector.scrapeOptions.timeout).toBe(10000);
      expect(connector.scrapeOptions.selectors).toContain("p");
      expect(connector.scrapeOptions.excludeSelectors).toContain("nav");
    });

    test("should throw error when URL is missing", () => {
      expect(() => new WebsiteConnector({})).toThrow("Website URL is required for WebsiteConnector");
    });

    test("should accept custom scraping options", () => {
      const connector = new WebsiteConnector({
        url: "https://example.com",
        timeout: 5000,
        selectors: ["article"],
        excludeSelectors: [".ads"],
        followLinks: true,
        maxDepth: 3
      });
      
      expect(connector.scrapeOptions.timeout).toBe(5000);
      expect(connector.scrapeOptions.selectors).toEqual(["article"]);
      expect(connector.scrapeOptions.excludeSelectors).toEqual([".ads"]);
      expect(connector.scrapeOptions.followLinks).toBe(true);
      expect(connector.scrapeOptions.maxDepth).toBe(3);
    });
  });

  describe("Connection Management", () => {
    test("should connect successfully with valid response", async () => {
      const connector = new WebsiteConnector({
        url: "https://example.com"
      });

      // Mock successful HEAD request
      mockFetch.mockResolvedValueOnce({
        status: 200,
        statusText: "OK",
        headers: new Map([
          ["last-modified", "Wed, 21 Oct 2023 07:28:00 GMT"],
          ["etag", "\"12345\""]
        ])
      });

      const result = await connector.connect();
      
      expect(result).toBe(true);
      expect(connector.isConnected).toBe(true);
      expect(connector.lastModified).toBe("Wed, 21 Oct 2023 07:28:00 GMT");
      expect(connector.lastEtag).toBe("\"12345\"");
    });

    test("should handle connection failure", async () => {
      const connector = new WebsiteConnector({
        url: "https://example.com"
      });

      // Mock failed request
      mockFetch.mockResolvedValueOnce({
        status: 404,
        statusText: "Not Found",
        headers: new Map()
      });

      await expect(connector.connect()).rejects.toThrow("HTTP 404: Not Found");
      expect(connector.isConnected).toBe(false);
    });

    test("should handle network errors", async () => {
      const connector = new WebsiteConnector({
        url: "https://example.com"
      });

      // Mock network error
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      await expect(connector.connect()).rejects.toThrow("Network error");
      expect(connector.isConnected).toBe(false);
    });
  });

  describe("Update Detection", () => {
    let connector;

    beforeEach(() => {
      connector = new WebsiteConnector({
        url: "https://example.com"
      });
    });

    test("should detect updates via Last-Modified header", async () => {
      // Set initial state
      connector.lastModified = "Wed, 21 Oct 2023 07:28:00 GMT";

      // Mock response with newer Last-Modified
      mockFetch.mockResolvedValueOnce({
        status: 200,
        headers: new Map([
          ["last-modified", "Thu, 22 Oct 2023 08:30:00 GMT"]
        ])
      });

      const hasUpdates = await connector.hasUpdates();
      expect(hasUpdates).toBe(true);
    });

    test("should detect updates via ETag header", async () => {
      // Set initial state
      connector.lastEtag = "\"12345\"";

      // Mock response with different ETag
      mockFetch.mockResolvedValueOnce({
        status: 200,
        headers: new Map([
          ["etag", "\"67890\""]
        ])
      });

      const hasUpdates = await connector.hasUpdates();
      expect(hasUpdates).toBe(true);
    });

    test("should return false when no updates detected", async () => {
      // Set initial state
      connector.lastModified = "Wed, 21 Oct 2023 07:28:00 GMT";
      connector.lastEtag = "\"12345\"";

      // Mock response with same headers
      mockFetch.mockResolvedValueOnce({
        status: 200,
        headers: new Map([
          ["last-modified", "Wed, 21 Oct 2023 07:28:00 GMT"],
          ["etag", "\"12345\""]
        ])
      });

      const hasUpdates = await connector.hasUpdates();
      expect(hasUpdates).toBe(false);
    });

    test("should return true when no cache headers available", async () => {
      // Mock response without cache headers
      mockFetch.mockResolvedValueOnce({
        status: 200,
        headers: new Map()
      });

      const hasUpdates = await connector.hasUpdates();
      expect(hasUpdates).toBe(true);
    });
  });

  describe("Content Extraction", () => {
    let connector;

    beforeEach(() => {
      connector = new WebsiteConnector({
        url: "https://example.com"
      });
    });

    test("should extract content from HTML", () => {
      const html = `
        <html>
          <head>
            <title>Test Page</title>
            <meta name="description" content="This is a test page">
          </head>
          <body>
            <nav>Navigation - should be excluded</nav>
            <h1>Main Title</h1>
            <p>This is the first paragraph with substantial content.</p>
            <h2>Section Title</h2>
            <p>This is another paragraph with more content for testing.</p>
            <footer>Footer - should be excluded</footer>
          </body>
        </html>
      `;

      const result = connector.extractContent(html, "https://example.com");

      expect(result.title).toBe("Test Page");
      expect(result.description).toBe("This is a test page");
      expect(result.content).toContain("Main Title");
      expect(result.content).toContain("first paragraph with substantial content");
      expect(result.content).not.toContain("Navigation");
      expect(result.content).not.toContain("Footer");
      expect(result.url).toBe("https://example.com");
      expect(result.contentHash).toBeDefined();
      expect(result.wordCount).toBeGreaterThan(0);
    });

    test("should handle HTML without title or meta description", () => {
      const html = `
        <html>
          <body>
            <h1>Untitled Page</h1>
            <p>Some content without metadata.</p>
          </body>
        </html>
      `;

      const result = connector.extractContent(html, "https://example.com");

      expect(result.title).toBe("Untitled Page");
      expect(result.description).toContain("Some content without metadata");
    });

    test("should filter out short content", () => {
      const html = `
        <html>
          <body>
            <p>Hi</p>
            <p>This is a longer paragraph that should be included in the extraction process.</p>
            <p>Bye</p>
          </body>
        </html>
      `;

      const result = connector.extractContent(html, "https://example.com");

      expect(result.content).toContain("longer paragraph");
      expect(result.content).not.toContain("Hi");
      expect(result.content).not.toContain("Bye");
    });
  });

  describe("Data Fetching", () => {
    let connector;

    beforeEach(() => {
      connector = new WebsiteConnector({
        url: "https://example.com"
      });
    });

    test("should fetch and process website data", async () => {
      const html = `
        <html>
          <head><title>Test Page</title></head>
          <body>
            <h1>Main Title</h1>
            <p>This is substantial content that should be extracted properly.</p>
          </body>
        </html>
      `;

      // Mock successful response
      mockFetch.mockResolvedValueOnce({
        status: 200,
        headers: new Map([["last-modified", "Wed, 21 Oct 2023 07:28:00 GMT"]]),
        text: async () => html
      });

      const result = await connector.fetchData();

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("Test Page");
      expect(result[0].content).toContain("Main Title");
      expect(result[0].url).toBe("https://example.com");
      expect(connector.lastModified).toBe("Wed, 21 Oct 2023 07:28:00 GMT");
    });

    test("should detect content changes via hash", async () => {
      const html1 = `<html><body><p>Original content that is long enough to be included.</p></body></html>`;
      const html2 = `<html><body><p>Updated content that is different and long enough.</p></body></html>`;

      // First fetch
      mockFetch.mockResolvedValueOnce({
        status: 200,
        headers: new Map(),
        text: async () => html1
      });

      const result1 = await connector.fetchData();
      expect(result1).toHaveLength(1);

      // Second fetch with different content
      mockFetch.mockResolvedValueOnce({
        status: 200,
        headers: new Map(),
        text: async () => html2
      });

      const result2 = await connector.fetchData();
      expect(result2).toHaveLength(1);
      expect(result2[0].content).toContain("Updated content");
    });

    test("should return empty array when content unchanged", async () => {
      const html = `<html><body><p>Same content that is long enough to be included.</p></body></html>`;

      // First fetch
      mockFetch.mockResolvedValueOnce({
        status: 200,
        headers: new Map(),
        text: async () => html
      });

      const result1 = await connector.fetchData();
      expect(result1).toHaveLength(1);

      // Second fetch with same content
      mockFetch.mockResolvedValueOnce({
        status: 200,
        headers: new Map(),
        text: async () => html
      });

      const result2 = await connector.fetchData();
      expect(result2).toHaveLength(0); // No changes detected
    });

    test("should force fetch when option provided", async () => {
      const html = `<html><body><p>Same content that is long enough to be included.</p></body></html>`;

      // First fetch
      mockFetch.mockResolvedValueOnce({
        status: 200,
        headers: new Map(),
        text: async () => html
      });

      await connector.fetchData();

      // Second fetch with force option
      mockFetch.mockResolvedValueOnce({
        status: 200,
        headers: new Map(),
        text: async () => html
      });

      const result = await connector.fetchData({ force: true });
      expect(result).toHaveLength(1); // Forced despite no changes
    });
  });

  describe("Data Validation", () => {
    let connector;

    beforeEach(() => {
      connector = new WebsiteConnector({
        url: "https://example.com"
      });
    });

    test("should validate proper website data", () => {
      const validData = [{
        content: "This is substantial content that meets the minimum length requirement for validation.",
        url: "https://example.com",
        title: "Test Page"
      }];

      expect(connector.validateData(validData)).toBe(true);
    });

    test("should reject data with short content", () => {
      const invalidData = [{
        content: "Short", // Less than 10 characters
        url: "https://example.com", 
        title: "Test Page"
      }];

      expect(connector.validateData(invalidData)).toBe(false);
    });

    test("should reject data missing required fields", () => {
      const invalidData = [{
        content: "This is substantial content that meets the minimum length requirement."
        // Missing url and title
      }];

      expect(connector.validateData(invalidData)).toBe(false);
    });
  });

  describe("Configuration Management", () => {
    test("should update scrape options", () => {
      const connector = new WebsiteConnector({
        url: "https://example.com"
      });

      const newOptions = {
        timeout: 15000,
        selectors: ["main", "article"]
      };

      connector.updateScrapeOptions(newOptions);

      expect(connector.scrapeOptions.timeout).toBe(15000);
      expect(connector.scrapeOptions.selectors).toEqual(["main", "article"]);
    });

    test("should get enhanced metadata", () => {
      const connector = new WebsiteConnector({
        url: "https://example.com"
      });

      const metadata = connector.getMetadata();

      expect(metadata.url).toBe("https://example.com");
      expect(metadata.scrapeOptions).toBeDefined();
      expect(metadata.contentStatistics).toBeDefined();
    });

    test("should get changes summary", () => {
      const connector = new WebsiteConnector({
        url: "https://example.com"
      });

      connector.lastEtag = "\"12345\"";
      
      const summary = connector.getChangesSummary();

      expect(summary.hasEtag).toBe(true);
      expect(summary.changeDetectionMethod).toBe("etag");
    });
  });

  describe("Link Following", () => {
    test("should extract internal links", async () => {
      const connector = new WebsiteConnector({
        url: "https://example.com",
        followLinks: true,
        maxDepth: 2
      });

      const html = `
        <html>
          <body>
            <a href="/page1">Internal Link 1</a>
            <a href="https://example.com/page2">Internal Link 2</a>
            <a href="https://external.com/page">External Link</a>
            <p>This is the main content that should be extracted.</p>
          </body>
        </html>
      `;

      const pageHtml = `
        <html>
          <body>
            <p>This is content from a linked page that should also be extracted.</p>
          </body>
        </html>
      `;

      // Mock main page request
      mockFetch.mockResolvedValueOnce({
        status: 200,
        headers: new Map(),
        text: async () => html
      });

      // Mock linked page requests
      mockFetch.mockResolvedValue({
        status: 200,
        headers: new Map(),
        text: async () => pageHtml
      });

      const results = await connector.fetchData();

      // Should include main page plus followed links
      expect(results.length).toBeGreaterThan(1);
      expect(results[0].content).toContain("main content");
    });
  });
});