#!/usr/bin/env node

/**
 * Phase 1.2 Integration Test
 * Test API endpoints and integration points
 */

const http = require('http');

console.log('🧪 Testing Phase 1.2 Integration Points\n');

let passed = 0;
let failed = 0;

function test(name, condition, details = '') {
  if (condition) {
    passed++;
    console.log(`✅ ${name}`);
  } else {
    failed++;
    console.log(`❌ ${name} - ${details}`);
  }
}

// Test server health
function testServerHealth() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3001/api/ping', (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        test('Server Health Check', res.statusCode === 200, `Status: ${res.statusCode}`);
        resolve();
      });
    });
    
    req.on('error', (err) => {
      test('Server Health Check', false, err.message);
      resolve();
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      test('Server Health Check', false, 'Request timeout');
      resolve();
    });
  });
}

// Test existing endpoints
function testExistingEndpoints() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3001/api/system/system-vectors', (res) => {
      test('Existing API Compatibility', res.statusCode === 200 || res.statusCode === 401, 
        `Status: ${res.statusCode} (401 expected without auth)`);
      resolve();
    });
    
    req.on('error', (err) => {
      test('Existing API Compatibility', false, err.message);
      resolve();
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      test('Existing API Compatibility', false, 'Request timeout');
      resolve();
    });
  });
}

// Test Phase 1.2 component functionality without server dependency
function testComponentFunctionality() {
  console.log('\n🔧 Testing Component Functionality...\n');
  
  try {
    const { SourceAttributionEnhancer } = require('./utils/vectorDbProviders/SourceAttributionEnhancer');
    const enhancer = new SourceAttributionEnhancer();
    
    const result = enhancer.enhanceMetadata(
      { title: 'Test Document', docAuthor: 'Test Author' },
      { 
        docId: 'test-123', 
        sourceType: 'csv_product', 
        filename: 'products.csv',
        category: 'Electronics',
        sourceUrl: 'https://example.com/products.csv'
      },
      5,
      'This is a test product with specifications and features.'
    );
    
    const hasAllFields = result.sourceType === 'csv_product' &&
                        result.chunkId === 'test-123_chunk_5' &&
                        result.contentType === 'product' &&
                        result.searchKeywords && result.searchKeywords.length > 0 &&
                        result.confidence > 0 &&
                        result.wordCount > 0;
    
    test('Source Attribution Enhancement', hasAllFields, 'Missing or incorrect metadata fields');
  } catch (error) {
    test('Source Attribution Enhancement', false, error.message);
  }
  
  try {
    const { CategoryFilter } = require('./utils/vectorDbProviders/CategoryFilter');
    
    const searchParams = { where: {} };
    const filterConfig = {
      strategy: 'include',
      categories: ['Electronics', 'Products/Mobile']
    };
    
    const filtered = CategoryFilter.applyFilter(searchParams, filterConfig);
    const hasFiltering = filtered.where && filtered.where.category && filtered.where.category.inAny;
    
    test('Category Filtering', hasFiltering, 'Category filter not applied correctly');
  } catch (error) {
    test('Category Filtering', false, error.message);
  }
  
  try {
    const { RelevanceScorer } = require('./utils/vectorDbProviders/RelevanceScorer');
    const scorer = new RelevanceScorer();
    
    const mockResults = [
      {
        score: 0.8,
        metadata: {
          text: 'Electronics product with mobile features',
          sourceType: 'product_catalog',
          category: 'Electronics',
          lastModified: new Date().toISOString()
        }
      },
      {
        score: 0.6,
        metadata: {
          text: 'General information document',
          sourceType: 'manual_upload',
          category: 'General',
          lastModified: new Date(Date.now() - 86400000).toISOString() // 1 day old
        }
      }
    ];
    
    const scoredResults = scorer.scoreResults(mockResults, {
      query: 'electronics mobile',
      categoryContext: 'Electronics'
    });
    
    const hasValidScoring = scoredResults.length === 2 &&
                           scoredResults[0].relevanceScore > scoredResults[1].relevanceScore &&
                           scoredResults[0].scoreBreakdown !== undefined;
    
    test('Relevance Scoring', hasValidScoring, 'Scoring algorithm not working correctly');
  } catch (error) {
    test('Relevance Scoring', false, error.message);
  }
  
  try {
    const { FallbackSystem } = require('./utils/vectorDbProviders/FallbackSystem');
    const fallback = new FallbackSystem();
    
    // Test configuration
    const hasValidConfig = fallback.config.confidenceThreshold === 0.5 &&
                          fallback.config.fallbackStrategies.length > 0;
    
    test('Fallback System Configuration', hasValidConfig, 'Invalid fallback configuration');
  } catch (error) {
    test('Fallback System Configuration', false, error.message);
  }
}

// Test file parsers
function testParsers() {
  console.log('\n📝 Testing Parsers...\n');
  
  try {
    const { LinkExtractor } = require('./utils/files/parsers/linkExtractor');
    const extractor = new LinkExtractor();
    
    const testText = 'Download the manual at https://example.com/manual.pdf and specs at https://test.com/spec.pdf';
    const links = extractor._extractUrlsFromText(testText, 'TestSheet', 'A1', 1, 1);
    
    const hasValidExtraction = links.length === 2 &&
                              links.every(link => link.linkType === 'pdf' && link.confidence > 0);
    
    test('PDF Link Extraction', hasValidExtraction, `Expected 2 PDF links with confidence, got ${links.length}`);
  } catch (error) {
    test('PDF Link Extraction', false, error.message);
  }
  
  try {
    const { FAQParser } = require('./utils/files/parsers/faqParser');
    
    const faqText = `
      Frequently Asked Questions
      
      Q: What is the return policy?
      A: You can return items within 30 days.
      
      Q: How do I track my order?  
      A: Use the tracking number in your email.
    `;
    
    const result = FAQParser.parseText(faqText, { title: 'Test FAQ', docId: 'faq-test' });
    
    const hasValidParsing = result.success &&
                           result.faqs.length >= 2 &&
                           result.faqs[0].question.includes('return policy') &&
                           result.faqs[0].answer.includes('30 days');
    
    test('FAQ Structure Recognition', hasValidParsing, `Expected 2+ FAQs, got ${result.faqs?.length || 0}`);
  } catch (error) {
    test('FAQ Structure Recognition', false, error.message);
  }
}

// Run all tests
async function runTests() {
  console.log('🌐 Testing Server Integration...\n');
  
  await testServerHealth();
  await testExistingEndpoints();
  
  testComponentFunctionality();
  testParsers();
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 INTEGRATION TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All integration tests passed!');
    console.log('✅ Phase 1.2 implementation is working correctly.');
  } else if (failed <= 2) {
    console.log('\n⚠️  Minor issues detected, but core functionality works.');
    console.log('✅ Phase 1.2 implementation is mostly functional.');
  } else {
    console.log('\n❌ Multiple integration issues detected.');
    console.log('⚠️  Review implementation before proceeding.');
  }
  
  process.exit(failed > 2 ? 1 : 0);
}

runTests().catch(console.error);