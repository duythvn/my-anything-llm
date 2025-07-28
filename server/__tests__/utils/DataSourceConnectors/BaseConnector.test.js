/**
 * Tests for BaseConnector class
 * 
 * These tests validate the abstract base class functionality
 * and ensure proper interface compliance for concrete implementations.
 */

const { BaseConnector } = require("../../../utils/DataSourceConnectors/BaseConnector");

// Mock concrete connector for testing
class MockConnector extends BaseConnector {
  constructor(config = {}) {
    super(config);
    this.mockData = config.hasOwnProperty('mockData') ? config.mockData : ["test data"];
    this.shouldFail = config.shouldFail || false;
    this.hasUpdatesValue = config.hasUpdates !== undefined ? config.hasUpdates : true;
  }

  async connect() {
    if (this.shouldFail) {
      throw new Error("Mock connection failure");
    }
    this.isConnected = true;
    return true;
  }

  async fetchData(options = {}) {
    if (this.shouldFail) {
      throw new Error("Mock fetch failure");
    }
    return this.mockData;
  }

  async hasUpdates() {
    return this.hasUpdatesValue;
  }
}

describe("BaseConnector", () => {
  describe("Constructor", () => {
    test("should throw error when instantiated directly", () => {
      expect(() => new BaseConnector()).toThrow("BaseConnector is abstract and cannot be instantiated directly");
    });

    test("should create instance with default values", () => {
      const connector = new MockConnector();
      expect(connector.id).toBeDefined();
      expect(connector.name).toBe("Unnamed Connector");
      expect(connector.type).toBe("unknown");
      expect(connector.settings).toEqual({});
      expect(connector.isConnected).toBe(false);
      expect(connector.lastSync).toBeNull();
      expect(connector.errorCount).toBe(0);
      expect(connector.maxRetries).toBe(3);
    });

    test("should create instance with custom configuration", () => {
      const config = {
        id: "test-id",
        name: "Test Connector",
        type: "test",
        settings: { apiKey: "test-key" },
        maxRetries: 5,
        sourceUrl: "https://example.com",
        description: "Test connector for unit tests"
      };

      const connector = new MockConnector(config);
      expect(connector.id).toBe("test-id");
      expect(connector.name).toBe("Test Connector");
      expect(connector.type).toBe("test");
      expect(connector.settings).toEqual({ apiKey: "test-key" });
      expect(connector.maxRetries).toBe(5);
      expect(connector.metadata.sourceUrl).toBe("https://example.com");
      expect(connector.metadata.description).toBe("Test connector for unit tests");
    });
  });

  describe("Abstract Methods", () => {
    test("should throw error for unimplemented connect method", async () => {
      class IncompleteConnector extends BaseConnector {}
      const connector = new IncompleteConnector();
      await expect(connector.connect()).rejects.toThrow("connect() method must be implemented by concrete connector");
    });

    test("should throw error for unimplemented fetchData method", async () => {
      class IncompleteConnector extends BaseConnector {}
      const connector = new IncompleteConnector();
      await expect(connector.fetchData()).rejects.toThrow("fetchData() method must be implemented by concrete connector");
    });

    test("should throw error for unimplemented hasUpdates method", async () => {
      class IncompleteConnector extends BaseConnector {}
      const connector = new IncompleteConnector();
      await expect(connector.hasUpdates()).rejects.toThrow("hasUpdates() method must be implemented by concrete connector");
    });
  });

  describe("Data Validation", () => {
    let connector;

    beforeEach(() => {
      connector = new MockConnector();
    });

    test("should validate array data", () => {
      expect(connector.validateData(["item1", "item2"])).toBe(true);
      expect(connector.validateData([])).toBe(false);
    });

    test("should validate object data", () => {
      expect(connector.validateData({ key: "value" })).toBe(true);
      expect(connector.validateData({})).toBe(false);
    });

    test("should validate string data", () => {
      expect(connector.validateData("test content")).toBe(true);
      expect(connector.validateData("   ")).toBe(false);
      expect(connector.validateData("")).toBe(false);
    });

    test("should reject null or undefined data", () => {
      expect(connector.validateData(null)).toBe(false);
      expect(connector.validateData(undefined)).toBe(false);
    });
  });

  describe("Connection Management", () => {
    test("should connect successfully", async () => {
      const connector = new MockConnector();
      const result = await connector.connect();
      expect(result).toBe(true);
      expect(connector.isConnected).toBe(true);
    });

    test("should handle connection failure", async () => {
      const connector = new MockConnector({ shouldFail: true });
      await expect(connector.connect()).rejects.toThrow("Mock connection failure");
      expect(connector.isConnected).toBe(false);
    });

    test("should disconnect properly", async () => {
      const connector = new MockConnector();
      await connector.connect();
      expect(connector.isConnected).toBe(true);
      
      await connector.disconnect();
      expect(connector.isConnected).toBe(false);
    });
  });

  describe("Error Handling", () => {
    let connector;

    beforeEach(() => {
      connector = new MockConnector();
    });

    test("should record errors and update reliability", () => {
      const initialReliability = connector.metadata.reliability;
      const error = new Error("Test error");
      
      connector.recordError(error);
      expect(connector.errorCount).toBe(1);
      expect(connector.metadata.reliability).toBeLessThan(initialReliability);
    });

    test("should reset errors", () => {
      connector.recordError(new Error("Test error"));
      expect(connector.errorCount).toBe(1);
      
      connector.resetErrors();
      expect(connector.errorCount).toBe(0);
    });

    test("should get correct health status", () => {
      expect(connector.getHealthStatus()).toBe("warning"); // Not connected initially
      
      connector.isConnected = true;
      expect(connector.getHealthStatus()).toBe("healthy");
      
      connector.recordError(new Error("Test error"));
      expect(connector.getHealthStatus()).toBe("warning");
      
      // Max out errors
      connector.errorCount = connector.maxRetries;
      expect(connector.getHealthStatus()).toBe("error");
    });
  });

  describe("Metadata Management", () => {
    let connector;

    beforeEach(() => {
      connector = new MockConnector({ name: "Test Connector" });
    });

    test("should get complete metadata", () => {
      const metadata = connector.getMetadata();
      expect(metadata.id).toBe(connector.id);
      expect(metadata.name).toBe("Test Connector");
      expect(metadata.type).toBe("unknown");
      expect(metadata.isConnected).toBe(false);
      expect(metadata.health).toBeDefined();
    });

    test("should update metadata", () => {
      const updates = { description: "Updated description", reliability: 0.9 };
      connector.updateMetadata(updates);
      
      expect(connector.metadata.description).toBe("Updated description");
      expect(connector.metadata.reliability).toBe(0.9);
    });
  });

  describe("Sync Operation", () => {
    test("should perform successful sync", async () => {
      const connector = new MockConnector({ 
        mockData: ["test1", "test2"],
        hasUpdates: true 
      });
      
      const result = await connector.sync();
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(["test1", "test2"]);
      expect(result.itemCount).toBe(2);
      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(connector.lastSync).toBeDefined();
      expect(connector.errorCount).toBe(0);
    });

    test("should skip sync when no updates available", async () => {
      const connector = new MockConnector({ hasUpdates: false });
      
      const result = await connector.sync();
      
      expect(result.success).toBe(true);
      expect(result.skipped).toBe(true);
      expect(result.message).toBe("No updates available");
    });

    test("should force sync even when no updates", async () => {
      const connector = new MockConnector({ 
        hasUpdates: false,
        mockData: ["forced data"]
      });
      
      const result = await connector.sync({ force: true });
      
      expect(result.success).toBe(true);
      expect(result.skipped).toBeUndefined();
      expect(result.data).toEqual(["forced data"]);
    });

    test("should handle sync failure", async () => {
      const connector = new MockConnector({ shouldFail: true });
      
      const result = await connector.sync();
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.retryCount).toBe(1);
      expect(connector.errorCount).toBe(1);
    });

    test("should handle invalid data during sync", async () => {
      const connector = new MockConnector({ mockData: null });
      
      const result = await connector.sync();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid data received from source");
    });
  });

  describe("Connection Testing", () => {
    test("should test connection successfully", async () => {
      const connector = new MockConnector();
      
      const result = await connector.testConnection();
      
      expect(result.success).toBe(true);
      expect(result.message).toBe("Connection test successful");
      expect(connector.isConnected).toBe(false); // Should disconnect after test
    });

    test("should handle connection test failure", async () => {
      const connector = new MockConnector({ shouldFail: true });
      
      const result = await connector.testConnection();
      
      expect(result.success).toBe(false);
      expect(result.message).toContain("Connection test failed");
      expect(result.error).toBeDefined();
    });
  });

  describe("Serialization", () => {
    test("should serialize to JSON", () => {
      const connector = new MockConnector({ 
        name: "Test Connector",
        type: "test"
      });
      connector.lastSync = "2023-07-28T10:00:00.000Z";
      connector.errorCount = 2;
      
      const json = connector.toJSON();
      
      expect(json.id).toBe(connector.id);
      expect(json.name).toBe("Test Connector");
      expect(json.type).toBe("test");
      expect(json.lastSync).toBe("2023-07-28T10:00:00.000Z");
      expect(json.errorCount).toBe(2);
    });

    test("should create instance from JSON", () => {
      const config = {
        id: "test-id",
        name: "Test Connector",
        type: "test",
        settings: { key: "value" },
        isConnected: true,
        lastSync: "2023-07-28T10:00:00.000Z",
        errorCount: 1
      };
      
      const connector = MockConnector.fromJSON(config);
      
      expect(connector.id).toBe("test-id");
      expect(connector.name).toBe("Test Connector");
      expect(connector.type).toBe("test");
      expect(connector.isConnected).toBe(true);
      expect(connector.lastSync).toBe("2023-07-28T10:00:00.000Z");
      expect(connector.errorCount).toBe(1);
    });
  });
});