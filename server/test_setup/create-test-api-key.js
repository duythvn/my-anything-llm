#!/usr/bin/env node

/**
 * Test API Key Generator
 * Creates an API key for testing Phase 1.2 features
 */

const { ApiKey } = require("../models/apiKeys");

async function createTestApiKey() {
  try {
    console.log("Creating test API key...");
    
    const { apiKey, error } = await ApiKey.create();
    
    if (error) {
      console.error("Failed to create API key:", error);
      process.exit(1);
    }
    
    console.log("✅ Test API key created successfully!");
    console.log("🔑 API Key:", apiKey.secret);
    console.log("\n💡 Usage:");
    console.log(`export API_KEY="${apiKey.secret}"`);
    console.log(`curl -H "Authorization: Bearer ${apiKey.secret}" http://localhost:3001/api/v1/...`);
    
    // Save to .env for convenience (in project root)
    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(__dirname, '../../.env');
    const envContent = `\n# Test API Key for Phase 1.2 Testing\nTEST_API_KEY=${apiKey.secret}\n`;
    fs.appendFileSync(envPath, envContent);
    console.log("\n📄 API key also saved to ../../.env as TEST_API_KEY");
    
  } catch (error) {
    console.error("Error creating test API key:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  createTestApiKey().then(() => process.exit(0));
}

module.exports = { createTestApiKey };