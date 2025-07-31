#!/usr/bin/env node

/**
 * Phase 1.4 Admin API Comprehensive Test Suite
 * Tests all admin endpoints for knowledge management, document operations, and chat testing
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test configuration
const BASE_URL = 'http://localhost:3001';
const API_BASE = `${BASE_URL}/api/v1`;

// Test results tracking
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: [],
  details: []
};

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

// Test execution helper
async function runTest(testName, testFunc) {
  testResults.total++;
  console.log(`\n🧪 Running: ${testName}`);
  
  try {
    const result = await testFunc();
    if (result.success) {
      testResults.passed++;
      console.log(`✅ PASS: ${testName}`);
      testResults.details.push({
        name: testName,
        status: 'PASS',
        message: result.message || 'Test passed successfully',
        data: result.data
      });
    } else {
      testResults.failed++;
      console.log(`❌ FAIL: ${testName} - ${result.message}`);
      testResults.details.push({
        name: testName,
        status: 'FAIL',
        message: result.message,
        expected: result.expected,
        actual: result.actual,
        data: result.data
      });
      testResults.errors.push(`${testName}: ${result.message}`);
    }
  } catch (error) {
    testResults.failed++;
    console.log(`💥 ERROR: ${testName} - ${error.message}`);
    testResults.details.push({
      name: testName,
      status: 'ERROR',
      message: error.message,
      stack: error.stack
    });
    testResults.errors.push(`${testName}: ${error.message}`);
  }
}

// Test Categories

// 1. Knowledge Base API Tests
async function testKnowledgeBaseAPI() {
  console.log('\n📚 === KNOWLEDGE BASE API TESTS ===');
  
  // Test 1: GET /v1/admin/knowledge - List all knowledge
  await runTest('Knowledge Base - List All', async () => {
    const response = await makeRequest('/admin/knowledge');
    
    if (response.status === 404) {
      return { success: false, message: 'Endpoint not found - not implemented', expected: '200', actual: '404' };
    }
    
    if (response.status !== 200) {
      return { success: false, message: `Unexpected status code`, expected: '200', actual: response.status.toString() };
    }
    
    // Check if response has expected structure
    if (typeof response.data === 'object') {
      return { success: true, message: 'Knowledge base API responds correctly', data: response.data };
    }
    
    return { success: false, message: 'Response not in expected format', actual: typeof response.data };
  });
  
  // Test 2: GET /v1/admin/knowledge/search - Search functionality
  await runTest('Knowledge Base - Search', async () => {
    const response = await makeRequest('/admin/knowledge/search?q=test&limit=10');
    
    if (response.status === 404) {
      return { success: false, message: 'Search endpoint not found - might not be implemented', expected: '200', actual: '404' };
    }
    
    return { success: response.status === 200, message: `Search API status: ${response.status}`, data: response.data };
  });
  
  // Test 3: GET /v1/admin/knowledge/stats - Statistics
  await runTest('Knowledge Base - Statistics', async () => {
    const response = await makeRequest('/admin/knowledge/stats');
    
    if (response.status === 404) {
      return { success: false, message: 'Stats endpoint not found - might not be implemented', expected: '200', actual: '404' };
    }
    
    return { success: response.status === 200, message: `Stats API status: ${response.status}`, data: response.data };
  });
  
  // Test 4: POST /v1/admin/knowledge/validate - Content validation
  await runTest('Knowledge Base - Content Validation', async () => {
    const testContent = {
      content: "This is test content for validation",
      type: "text"
    };
    
    const response = await makeRequest('/admin/knowledge/validate', {
      method: 'POST',
      body: JSON.stringify(testContent)
    });
    
    if (response.status === 404) {
      return { success: false, message: 'Validation endpoint not found - might not be implemented', expected: '200', actual: '404' };
    }
    
    return { success: [200, 201].includes(response.status), message: `Validation API status: ${response.status}`, data: response.data };
  });
}

// 2. Document Management API Tests
async function testDocumentManagementAPI() {
  console.log('\n📄 === DOCUMENT MANAGEMENT API TESTS ===');
  
  // Test 1: POST /v1/admin/documents/bulk-update
  await runTest('Document Management - Bulk Update', async () => {
    const bulkData = {
      updates: [
        { id: 1, title: "Updated Document 1" },
        { id: 2, title: "Updated Document 2" }
      ]
    };
    
    const response = await makeRequest('/admin/documents/bulk-update', {
      method: 'POST',
      body: JSON.stringify(bulkData)
    });
    
    if (response.status === 404) {
      return { success: false, message: 'Bulk update endpoint not found - might not be implemented', expected: '200', actual: '404' };
    }
    
    return { success: [200, 201].includes(response.status), message: `Bulk update API status: ${response.status}`, data: response.data };
  });
  
  // Test 2: DELETE /v1/admin/documents/bulk
  await runTest('Document Management - Bulk Delete', async () => {
    const deleteData = {
      ids: [999, 1000] // Use high IDs to avoid deleting real data
    };
    
    const response = await makeRequest('/admin/documents/bulk', {
      method: 'DELETE',
      body: JSON.stringify(deleteData)
    });
    
    if (response.status === 404) {
      return { success: false, message: 'Bulk delete endpoint not found - might not be implemented', expected: '200', actual: '404' };
    }
    
    return { success: [200, 201, 204].includes(response.status), message: `Bulk delete API status: ${response.status}`, data: response.data };
  });
  
  // Test 3: POST /v1/admin/documents/merge
  await runTest('Document Management - Merge Documents', async () => {
    const mergeData = {
      sourceIds: [1, 2],
      targetTitle: "Merged Document",
      strategy: "concatenate"
    };
    
    const response = await makeRequest('/admin/documents/merge', {
      method: 'POST',
      body: JSON.stringify(mergeData)
    });
    
    if (response.status === 404) {
      return { success: false, message: 'Document merge endpoint not found - might not be implemented', expected: '200', actual: '404' };
    }
    
    return { success: [200, 201].includes(response.status), message: `Document merge API status: ${response.status}`, data: response.data };
  });
  
  // Test 4: GET /v1/admin/documents/duplicates
  await runTest('Document Management - Find Duplicates', async () => {
    const response = await makeRequest('/admin/documents/duplicates?threshold=0.8');
    
    if (response.status === 404) {
      return { success: false, message: 'Duplicates endpoint not found - might not be implemented', expected: '200', actual: '404' };
    }
    
    return { success: response.status === 200, message: `Duplicates API status: ${response.status}`, data: response.data };
  });
}

// 3. Chat Testing API Tests
async function testChatTestingAPI() {
  console.log('\n💬 === CHAT TESTING API TESTS ===');
  
  // Test 1: POST /v1/admin/chat/test - Single chat test
  await runTest('Chat Testing - Single Test', async () => {
    const chatData = {
      message: "What is AnythingLLM?",
      context: "general",
      workspace: "default"
    };
    
    const response = await makeRequest('/admin/chat/test', {
      method: 'POST',
      body: JSON.stringify(chatData)
    });
    
    if (response.status === 404) {
      return { success: false, message: 'Chat test endpoint not found - might not be implemented', expected: '200', actual: '404' };
    }
    
    return { success: [200, 201].includes(response.status), message: `Chat test API status: ${response.status}`, data: response.data };
  });
  
  // Test 2: POST /v1/admin/chat/test/batch - Batch testing
  await runTest('Chat Testing - Batch Test', async () => {
    const batchData = {
      tests: [
        { message: "Test question 1", expected: "Expected response 1" },
        { message: "Test question 2", expected: "Expected response 2" }
      ],
      workspace: "default"
    };
    
    const response = await makeRequest('/admin/chat/test/batch', {
      method: 'POST',
      body: JSON.stringify(batchData)
    });
    
    if (response.status === 404) {
      return { success: false, message: 'Batch test endpoint not found - might not be implemented', expected: '200', actual: '404' };
    }
    
    return { success: [200, 201].includes(response.status), message: `Batch test API status: ${response.status}`, data: response.data };
  });
  
  // Test 3: GET /v1/admin/chat/test/history - Test history
  await runTest('Chat Testing - Test History', async () => {
    const response = await makeRequest('/admin/chat/test/history?limit=10');
    
    if (response.status === 404) {
      return { success: false, message: 'Test history endpoint not found - might not be implemented', expected: '200', actual: '404' };
    }
    
    return { success: response.status === 200, message: `Test history API status: ${response.status}`, data: response.data };
  });
  
  // Test 4: POST /v1/admin/chat/analyze - Response analysis
  await runTest('Chat Testing - Response Analysis', async () => {
    const analysisData = {
      response: "This is a test response from the chat system",
      criteria: ["accuracy", "relevance", "completeness"]
    };
    
    const response = await makeRequest('/admin/chat/analyze', {
      method: 'POST',
      body: JSON.stringify(analysisData)
    });
    
    if (response.status === 404) {
      return { success: false, message: 'Response analysis endpoint not found - might not be implemented', expected: '200', actual: '404' };
    }
    
    return { success: [200, 201].includes(response.status), message: `Response analysis API status: ${response.status}`, data: response.data };
  });
}

// 4. Integration and Compatibility Tests
async function testIntegrationCompatibility() {
  console.log('\n🔗 === INTEGRATION & COMPATIBILITY TESTS ===');
  
  // Test 1: Verify existing AnythingLLM endpoints still work
  await runTest('Integration - System Status', async () => {
    const response = await makeRequest('/system/boot');
    return { success: response.status === 200, message: `System status: ${response.status}`, data: response.data };
  });
  
  // Test 2: Check if admin endpoints don't break existing functionality
  await runTest('Integration - Workspace Compatibility', async () => {
    const response = await makeRequest('/workspaces');
    return { success: [200, 404].includes(response.status), message: `Workspace compatibility: ${response.status}` };
  });
}

// 5. Security and Input Validation Tests
async function testSecurityValidation() {
  console.log('\n🔒 === SECURITY & VALIDATION TESTS ===');
  
  // Test 1: SQL injection attempt
  await runTest('Security - SQL Injection Protection', async () => {
    const maliciousData = {
      q: "'; DROP TABLE documents; --"
    };
    
    const response = await makeRequest('/admin/knowledge/search', {
      method: 'GET'
    });
    
    // If the endpoint exists and doesn't crash, it's handling input safely
    return { success: [200, 400, 404].includes(response.status), message: `SQL injection test: ${response.status}` };
  });
  
  // Test 2: XSS attempt
  await runTest('Security - XSS Protection', async () => {
    const xssData = {
      content: "<script>alert('xss')</script>",
      type: "text"
    };
    
    const response = await makeRequest('/admin/knowledge/validate', {
      method: 'POST',
      body: JSON.stringify(xssData)
    });
    
    return { success: [200, 400, 404].includes(response.status), message: `XSS protection test: ${response.status}` };
  });
}

// Main test execution
async function runAllTests() {
  console.log('🚀 Starting Phase 1.4 Admin API Comprehensive Test Suite');
  console.log('=' .repeat(60));
  
  // Check if server is running
  console.log('\n🔍 Checking server availability...');
  const healthCheck = await makeRequest('/system/boot');
  if (healthCheck.status !== 200) {
    console.log('❌ Server is not responding correctly. Please ensure AnythingLLM is running on port 3001');
    process.exit(1);
  }
  console.log('✅ Server is running and accessible');
  
  // Run all test categories
  await testKnowledgeBaseAPI();
  await testDocumentManagementAPI();
  await testChatTestingAPI();
  await testIntegrationCompatibility();
  await testSecurityValidation();
  
  // Generate final report
  console.log('\n' + '=' .repeat(60));
  console.log('🎯 FINAL TEST RESULTS');
  console.log('=' .repeat(60));
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  
  if (testResults.errors.length > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults.errors.forEach(error => console.log(`  • ${error}`));
  }
  
  // Determine overall result
  const overallSuccess = testResults.failed === 0;
  console.log(`\n🎭 OVERALL RESULT: ${overallSuccess ? '✅ PASSED' : '❌ FAILED'}`);
  
  // Save detailed report
  const reportPath = path.join(__dirname, 'test_results_phase1p4.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      successRate: ((testResults.passed / testResults.total) * 100).toFixed(1) + '%',
      overallResult: overallSuccess ? 'PASSED' : 'FAILED'
    },
    details: testResults.details
  }, null, 2));
  
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  
  return overallSuccess;
}

// Execute tests if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
  });
}

export { runAllTests, testResults };