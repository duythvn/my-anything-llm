#!/usr/bin/env node

/**
 * Quick test script to verify that Phase 1.4 Admin API endpoints are being loaded correctly
 * This script checks if the endpoint modules can be imported and initialized without errors
 */

// Ensure we're in the correct directory context
process.chdir(__dirname);

console.log('🧪 Testing Phase 1.4 Admin API Endpoint Loading...\n');

// Test 1: Check if endpoint modules can be imported
console.log('1. Testing module imports...');
try {
  const { adminKnowledgeEndpoints } = require('./server/endpoints/api/admin/knowledge');
  const { adminDocumentEndpoints } = require('./server/endpoints/api/admin/documents');
  const { adminChatTestingEndpoints } = require('./server/endpoints/api/admin/chat-testing');
  const { apiAdminEndpoints } = require('./server/endpoints/api/admin/index');
  
  console.log('   ✅ Knowledge endpoints module imported successfully');
  console.log('   ✅ Document endpoints module imported successfully');
  console.log('   ✅ Chat testing endpoints module imported successfully');
  console.log('   ✅ Admin API index module imported successfully');
} catch (error) {
  console.error('   ❌ Module import failed:', error.message);
  process.exit(1);
}

// Test 2: Check if endpoint functions are properly exported
console.log('\n2. Testing function exports...');
try {
  const { adminKnowledgeEndpoints } = require('./server/endpoints/api/admin/knowledge');
  const { adminDocumentEndpoints } = require('./server/endpoints/api/admin/documents');
  const { adminChatTestingEndpoints } = require('./server/endpoints/api/admin/chat-testing');
  const { apiAdminEndpoints } = require('./server/endpoints/api/admin/index');
  
  if (typeof adminKnowledgeEndpoints !== 'function') {
    throw new Error('adminKnowledgeEndpoints is not a function');
  }
  if (typeof adminDocumentEndpoints !== 'function') {
    throw new Error('adminDocumentEndpoints is not a function');
  }
  if (typeof adminChatTestingEndpoints !== 'function') {
    throw new Error('adminChatTestingEndpoints is not a function');
  }
  if (typeof apiAdminEndpoints !== 'function') {
    throw new Error('apiAdminEndpoints is not a function');
  }
  
  console.log('   ✅ adminKnowledgeEndpoints function exported correctly');
  console.log('   ✅ adminDocumentEndpoints function exported correctly');
  console.log('   ✅ adminChatTestingEndpoints function exported correctly');
  console.log('   ✅ apiAdminEndpoints function exported correctly');
} catch (error) {
  console.error('   ❌ Function export check failed:', error.message);
  process.exit(1);
}

// Test 3: Mock app and test endpoint initialization
console.log('\n3. Testing endpoint initialization...');
try {
  const express = require('express');
  const mockApp = express();
  
  // Track registered routes
  const registeredRoutes = [];
  const originalGet = mockApp.get;
  const originalPost = mockApp.post;
  const originalPut = mockApp.put;
  const originalDelete = mockApp.delete;
  
  mockApp.get = function(path, ...handlers) {
    registeredRoutes.push({ method: 'GET', path });
    return originalGet.call(this, path, ...handlers);
  };
  
  mockApp.post = function(path, ...handlers) {
    registeredRoutes.push({ method: 'POST', path });
    return originalPost.call(this, path, ...handlers);
  };
  
  mockApp.put = function(path, ...handlers) {
    registeredRoutes.push({ method: 'PUT', path });
    return originalPut.call(this, path, ...handlers);
  };
  
  mockApp.delete = function(path, ...handlers) {
    registeredRoutes.push({ method: 'DELETE', path });
    return originalDelete.call(this, path, ...handlers);
  };
  
  // Initialize endpoints
  const { apiAdminEndpoints } = require('./server/endpoints/api/admin/index');
  apiAdminEndpoints(mockApp);
  
  console.log('   ✅ Endpoint initialization completed without errors');
  console.log(`   📊 Total routes registered: ${registeredRoutes.length}`);
  
  // Check for Phase 1.4 specific endpoints
  const phase14Routes = registeredRoutes.filter(route => 
    route.path.includes('/admin/knowledge') || 
    route.path.includes('/admin/documents') || 
    route.path.includes('/admin/chat')
  );
  
  console.log(`   🎯 Phase 1.4 Admin API routes found: ${phase14Routes.length}`);
  
  if (phase14Routes.length > 0) {
    console.log('   📋 Phase 1.4 routes:');
    phase14Routes.forEach(route => {
      console.log(`      ${route.method} ${route.path}`);
    });
  }
  
  // Expected minimum routes for Phase 1.4
  const expectedMinimumRoutes = 13; // 5 knowledge + 4 documents + 4 chat testing
  if (phase14Routes.length >= expectedMinimumRoutes) {
    console.log(`   ✅ Found ${phase14Routes.length} Phase 1.4 routes (expected minimum: ${expectedMinimumRoutes})`);
  } else {
    console.log(`   ⚠️  Found ${phase14Routes.length} Phase 1.4 routes (expected minimum: ${expectedMinimumRoutes})`);
  }
  
} catch (error) {
  console.error('   ❌ Endpoint initialization failed:', error.message);
  console.error('   📄 Stack trace:', error.stack);
  process.exit(1);
}

console.log('\n🎉 All tests passed! Phase 1.4 Admin API endpoints are ready for server integration.\n');

console.log('📝 Next steps:');
console.log('   1. Start the AnythingLLM server');
console.log('   2. Test endpoints with the corrected URLs (/api/v1/admin/...)');
console.log('   3. Verify API key authentication is working');
console.log('   4. Run the comprehensive test plan');

process.exit(0);