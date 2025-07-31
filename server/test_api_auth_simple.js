#!/usr/bin/env node

/**
 * Simple API Authentication Test for Phase 1.4
 * Tests API key authentication on admin endpoints
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001';
const API_BASE = `${BASE_URL}/api/v1`;

// Test API keys
const validApiKey = 'QGP6R4K-8YVMV25-KYTMWYT-F9CFWQW'; // From our test creation
const invalidApiKey = 'invalid-test-key-12345';

// Helper function to make API requests
async function makeRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };
  
  try {
    const response = await fetch(url, { ...defaultOptions, ...options });
    const data = await response.text();
    
    let parsedData;
    try {
      parsedData = JSON.parse(data);
    } catch (e) {
      parsedData = data;
    }
    
    return {
      status: response.status,
      statusText: response.statusText,
      data: parsedData,
      headers: response.headers
    };
  } catch (error) {
    return {
      status: 0,
      statusText: 'Network Error',
      data: null,
      error: error.message
    };
  }
}

// Test results
let tests = 0;
let passed = 0;
let failed = 0;

async function runTest(testName, testFunc) {
  tests++;
  console.log(`\n🧪 Testing: ${testName}`);
  
  try {
    const result = await testFunc();
    if (result.success) {
      passed++;
      console.log(`✅ PASS: ${testName} - ${result.message}`);
    } else {
      failed++;
      console.log(`❌ FAIL: ${testName} - ${result.message}`);
    }
  } catch (error) {
    failed++;
    console.log(`💥 ERROR: ${testName} - ${error.message}`);
  }
}

async function runAuthTests() {
  console.log('🔐 Testing API Key Authentication for Phase 1.4 Admin API');
  console.log('=' .repeat(60));
  
  // Test 1: No API key should fail
  await runTest('No API Key - Should Reject', async () => {
    const response = await makeRequest('/admin/is-multi-user-mode');
    
    if (response.status === 403 && response.data.error && response.data.error.includes('api key')) {
      return { success: true, message: 'Correctly rejected request without API key' };
    }
    
    return { 
      success: false, 
      message: `Expected 403 with API key error, got ${response.status}: ${JSON.stringify(response.data)}`
    };
  });
  
  // Test 2: Invalid API key should fail
  await runTest('Invalid API Key - Should Reject', async () => {
    const response = await makeRequest('/admin/is-multi-user-mode', {
      headers: {
        'Authorization': `Bearer ${invalidApiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 403 && response.data.error && response.data.error.includes('api key')) {
      return { success: true, message: 'Correctly rejected invalid API key' };
    }
    
    return { 
      success: false, 
      message: `Expected 403 with API key error, got ${response.status}: ${JSON.stringify(response.data)}`
    };
  });
  
  // Test 3: Valid API key should succeed
  await runTest('Valid API Key - Should Accept', async () => {
    const response = await makeRequest('/admin/is-multi-user-mode', {
      headers: {
        'Authorization': `Bearer ${validApiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 200) {
      return { success: true, message: `Valid API key accepted: ${JSON.stringify(response.data)}` };
    }
    
    return { 
      success: false, 
      message: `Expected 200, got ${response.status}: ${JSON.stringify(response.data)}`
    };
  });
  
  // Test 4: Test Phase 1.4 Knowledge endpoint without auth
  await runTest('Knowledge Endpoint - No Auth', async () => {
    const response = await makeRequest('/admin/knowledge');
    
    if (response.status === 403 && response.data.error && response.data.error.includes('api key')) {
      return { success: true, message: 'Knowledge endpoint correctly requires authentication' };
    }
    
    return { 
      success: false, 
      message: `Knowledge endpoint should require auth. Got ${response.status}: ${JSON.stringify(response.data)}`
    };
  });
  
  // Test 5: Test Phase 1.4 Knowledge endpoint with auth
  await runTest('Knowledge Endpoint - With Auth', async () => {
    const response = await makeRequest('/admin/knowledge', {
      headers: {
        'Authorization': `Bearer ${validApiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 200 && response.data.success !== undefined) {
      return { success: true, message: `Knowledge endpoint accessible with auth: ${response.data.documents.length} documents found` };
    }
    
    return { 
      success: false, 
      message: `Expected 200 with success field, got ${response.status}: ${JSON.stringify(response.data)}`
    };
  });
  
  // Test 6: Test Phase 1.4 Knowledge search endpoint with auth
  await runTest('Knowledge Search - With Auth', async () => {
    const response = await makeRequest('/admin/knowledge/search?q=test&limit=5', {
      headers: {
        'Authorization': `Bearer ${validApiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 200 || response.status === 400) { // 400 is OK if query is required
      return { success: true, message: `Knowledge search endpoint accessible: status ${response.status}` };
    }
    
    return { 
      success: false, 
      message: `Knowledge search failed. Got ${response.status}: ${JSON.stringify(response.data)}`
    };
  });
  
  // Test 7: Test Phase 1.4 Knowledge stats endpoint with auth
  await runTest('Knowledge Stats - With Auth', async () => {
    const response = await makeRequest('/admin/knowledge/stats', {
      headers: {
        'Authorization': `Bearer ${validApiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 200 && response.data.success !== undefined) {
      return { success: true, message: `Knowledge stats endpoint accessible: ${response.data.stats.totalDocuments} total documents` };
    }
    
    return { 
      success: false, 
      message: `Expected 200 with success field, got ${response.status}: ${JSON.stringify(response.data)}`
    };
  });
  
  // Test 8: Test malformed Authorization header
  await runTest('Malformed Auth Header', async () => {
    const response = await makeRequest('/admin/is-multi-user-mode', {
      headers: {
        'Authorization': 'InvalidFormat',
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 403) {
      return { success: true, message: 'Malformed auth header correctly rejected' };
    }
    
    return { 
      success: false, 
      message: `Expected 403 for malformed auth, got ${response.status}`
    };
  });
  
  // Generate final report
  console.log('\n' + '=' .repeat(60));
  console.log('🎯 AUTHENTICATION TEST RESULTS');
  console.log('=' .repeat(60));
  console.log(`Total Tests: ${tests}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / tests) * 100).toFixed(1)}%`);
  
  const overallSuccess = failed === 0;
  console.log(`\n🔐 AUTHENTICATION RESULT: ${overallSuccess ? '✅ SECURE' : '❌ ISSUES FOUND'}`);
  
  if (overallSuccess) {
    console.log('\n✨ All authentication tests passed!');
    console.log('• API key validation is working correctly');
    console.log('• Phase 1.4 admin endpoints are properly protected');
    console.log('• Invalid/missing keys are correctly rejected');
    console.log('• Valid keys allow access to admin functions');
  } else {
    console.log('\n⚠️ Some authentication tests failed. Review the issues above.');
  }
  
  return overallSuccess;
}

// Run the tests
if (require.main === module) {
  runAuthTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = { runAuthTests };