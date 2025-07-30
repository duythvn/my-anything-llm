#!/usr/bin/env node

/**
 * Phase 1.2 RAG Implementation Validation Tests
 * Tests all components to verify they're properly implemented
 */

const fs = require('fs');
const path = require('path');

// Test results collector
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function addTest(name, passed, details = '') {
  testResults.tests.push({ name, passed, details });
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${name}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${name} - ${details}`);
  }
}

console.log('🧪 Phase 1.2 RAG Implementation Validation Tests\n');

// Test 1: Verify SourceAttributionEnhancer
console.log('Testing Day 4: Vector Search Enhancement Components...\n');

try {
  const { SourceAttributionEnhancer } = require('./server/utils/vectorDbProviders/SourceAttributionEnhancer');
  const enhancer = new SourceAttributionEnhancer();
  
  // Test metadata enhancement
  const testMetadata = enhancer.enhanceMetadata(
    { title: 'Test Doc' },
    { 
      docId: 'test123',
      sourceType: 'csv_product',
      filename: 'products.csv',
      category: 'electronics'
    },
    0,
    'This is a test product description with specifications.'
  );
  
  const hasRequiredFields = testMetadata.sourceType && 
                           testMetadata.chunkId && 
                           testMetadata.confidence &&
                           testMetadata.contentType &&
                           testMetadata.searchKeywords;
  
  addTest('4.1: SourceAttributionEnhancer - Metadata Enhancement', hasRequiredFields, 
    hasRequiredFields ? '' : 'Missing required metadata fields');
    
} catch (error) {
  addTest('4.1: SourceAttributionEnhancer - Metadata Enhancement', false, error.message);
}

// Test 2: Verify CategoryFilter
try {
  const { CategoryFilter } = require('./server/utils/vectorDbProviders/CategoryFilter');
  
  // Test include strategy
  const searchParams = { where: {} };
  const filterConfig = {
    strategy: 'include',
    categories: ['electronics', 'accessories']
  };
  
  const filteredParams = CategoryFilter.applyFilter(searchParams, filterConfig);
  const hasFiltering = filteredParams.where && filteredParams.where.category;
  
  addTest('4.2: CategoryFilter - Apply Filtering', hasFiltering,
    hasFiltering ? '' : 'Category filtering not applied correctly');
    
} catch (error) {
  addTest('4.2: CategoryFilter - Apply Filtering', false, error.message);
}

// Test 3: Verify RelevanceScorer
try {
  const { RelevanceScorer } = require('./server/utils/vectorDbProviders/RelevanceScorer');
  const scorer = new RelevanceScorer();
  
  // Test scoring a result
  const mockResult = {
    score: 0.8,
    metadata: {
      text: 'This is about electronics and products',
      sourceType: 'product_catalog',
      category: 'electronics',
      lastModified: new Date().toISOString()
    }
  };
  
  const scoredResult = scorer.scoreResult(mockResult, {
    query: 'electronics products',
    categoryContext: 'electronics'
  });
  
  const hasScoring = scoredResult.relevanceScore !== undefined &&
                    scoredResult.scoreBreakdown !== undefined &&
                    scoredResult.scoreFactors !== undefined;
  
  addTest('4.3: RelevanceScorer - Multi-factor Scoring', hasScoring,
    hasScoring ? '' : 'Relevance scoring not working correctly');
    
} catch (error) {
  addTest('4.3: RelevanceScorer - Multi-factor Scoring', false, error.message);
}

// Test 4: Verify FallbackSystem
try {
  const { FallbackSystem } = require('./server/utils/vectorDbProviders/FallbackSystem');
  const fallback = new FallbackSystem();
  
  // Test low confidence fallback
  const lowConfidenceQuery = {
    query: 'test query',
    results: [],
    confidence: 0.2,
    attemptCount: 1
  };
  
  const fallbackResponse = await fallback.processFallback(lowConfidenceQuery, {});
  const hasFallback = fallbackResponse.fallbackUsed !== undefined &&
                     fallbackResponse.strategy !== undefined;
  
  addTest('4.4: FallbackSystem - Low Confidence Handling', hasFallback,
    hasFallback ? '' : 'Fallback system not working correctly');
    
} catch (error) {
  addTest('4.4: FallbackSystem - Low Confidence Handling', false, error.message);
}

// Test 5: Verify Enhanced LanceDB Integration
try {
  const lanceDbPath = './server/utils/vectorDbProviders/lance/index.js';
  const lanceDbContent = fs.readFileSync(lanceDbPath, 'utf8');
  
  const hasEnhancedMethod = lanceDbContent.includes('performEnhancedSimilaritySearch');
  const hasPhase12Integration = lanceDbContent.includes('SourceAttributionEnhancer') &&
                               lanceDbContent.includes('CategoryFilter') &&
                               lanceDbContent.includes('RelevanceScorer') &&
                               lanceDbContent.includes('FallbackSystem');
  
  addTest('4.5: Enhanced LanceDB Integration', hasEnhancedMethod && hasPhase12Integration,
    !hasEnhancedMethod ? 'Enhanced similarity search method missing' :
    !hasPhase12Integration ? 'Phase 1.2 components not integrated' : '');
    
} catch (error) {
  addTest('4.5: Enhanced LanceDB Integration', false, error.message);
}

console.log('\nTesting Day 3: Document Ingestion Enhancement Components...\n');

// Test 6: Verify PDF Link Extraction
try {
  const { LinkExtractor } = require('./server/utils/files/parsers/linkExtractor');
  
  // Test URL extraction from text
  const testText = 'Download the manual at https://example.com/manual.pdf or the specs at https://example.com/datasheet.pdf';
  const extractor = new LinkExtractor();
  const links = extractor._extractUrlsFromText(testText, 'TestSheet', 'A1', 1, 1);
  
  const hasLinkExtraction = links.length === 2 && 
                           links.every(link => link.linkType === 'pdf');
  
  addTest('3.3: PDF Link Extraction from Spreadsheets', hasLinkExtraction,
    hasLinkExtraction ? '' : `Expected 2 PDF links, got ${links.length}`);
    
} catch (error) {
  addTest('3.3: PDF Link Extraction from Spreadsheets', false, error.message);
}

// Test 7: Verify FAQ Structure Recognition
try {
  const { FAQParser } = require('./server/utils/files/parsers/faqParser');
  
  // Test FAQ parsing
  const faqText = `
    Frequently Asked Questions
    
    Q: What is the return policy?
    A: You can return items within 30 days of purchase.
    
    Q: How do I track my order?
    A: Use the tracking number sent to your email.
  `;
  
  const result = FAQParser.parseText(faqText, { title: 'Test FAQ' });
  const hasFAQParsing = result.success && 
                       result.faqs.length === 2 &&
                       result.faqs[0].question.includes('return policy');
  
  addTest('3.4: FAQ Structure Recognition', hasFAQParsing,
    hasFAQParsing ? '' : `Expected 2 FAQs, got ${result.faqs?.length || 0}`);
    
} catch (error) {
  addTest('3.4: FAQ Structure Recognition', false, error.message);
}

// Test 8: Verify Sync Schedule Configuration
try {
  const { SyncScheduler } = require('./server/utils/BackgroundWorkers/syncScheduler');
  const scheduler = new SyncScheduler();
  
  // Test cron expression parsing
  const dailyCron = scheduler._parseCronExpression('daily');
  const hourlyCron = scheduler._parseCronExpression('hourly');
  const customCron = scheduler._parseCronExpression('0 */6 * * *');
  
  const hasScheduling = dailyCron === '0 9 * * *' &&
                       hourlyCron === '0 * * * *' &&
                       customCron === '0 */6 * * *';
  
  addTest('3.5: Sync Schedule Configuration', hasScheduling,
    hasScheduling ? '' : 'Cron expression parsing not working correctly');
    
} catch (error) {
  addTest('3.5: Sync Schedule Configuration', false, error.message);
}

// Test 9: Verify Query/Response Logging System  
try {
  const { QueryLogs } = require('./server/models/queryLogs');
  
  // Test that the model has required methods
  const hasRequiredMethods = typeof QueryLogs.logQuery === 'function' &&
                            typeof QueryLogs.updateFeedback === 'function' &&
                            typeof QueryLogs.addEvaluation === 'function' &&
                            typeof QueryLogs.getAnalytics === 'function';
  
  addTest('3.6: Query/Response Logging System', hasRequiredMethods,
    hasRequiredMethods ? '' : 'Missing required QueryLogs methods');
    
} catch (error) {
  addTest('3.6: Query/Response Logging System', false, error.message);
}

// Test 10: Verify Database Schema Updates
try {
  const schemaPath = './server/prisma/schema.prisma';
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  
  const hasQueryLogsTable = schemaContent.includes('model query_logs');
  const hasDocumentLinks = schemaContent.includes('model document_links') || 
                          schemaContent.includes('documentLinks');
  const hasEnhancedDocuments = schemaContent.includes('sourceType') && 
                              schemaContent.includes('syncMetadata');
  
  addTest('Database Schema - Phase 1.2 Extensions', 
    hasQueryLogsTable && hasEnhancedDocuments,
    !hasQueryLogsTable ? 'query_logs table missing' :
    !hasEnhancedDocuments ? 'Enhanced document fields missing' : '');
    
} catch (error) {
  addTest('Database Schema - Phase 1.2 Extensions', false, error.message);
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 PHASE 1.2 VALIDATION SUMMARY');
console.log('='.repeat(60));
console.log(`✅ Passed: ${testResults.passed}`);
console.log(`❌ Failed: ${testResults.failed}`);
console.log(`📊 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);

if (testResults.failed > 0) {
  console.log('\n🔍 FAILED TESTS:');
  testResults.tests
    .filter(t => !t.passed)
    .forEach(t => console.log(`  • ${t.name}: ${t.details}`));
}

console.log('\n📋 VERIFICATION STATUS:');

// Update todo status based on results
const componentStatus = {
  '3.3': testResults.tests.find(t => t.name.includes('3.3'))?.passed || false,
  '3.4': testResults.tests.find(t => t.name.includes('3.4'))?.passed || false, 
  '3.5': testResults.tests.find(t => t.name.includes('3.5'))?.passed || false,
  '3.6': testResults.tests.find(t => t.name.includes('3.6'))?.passed || false,
  'Day4': testResults.tests.filter(t => t.name.includes('4.')).every(t => t.passed)
};

console.log(`☐ 3.3 PDF Link Extraction: ${componentStatus['3.3'] ? '✅ IMPLEMENTED' : '❌ MISSING'}`);
console.log(`☐ 3.4 FAQ Structure Recognition: ${componentStatus['3.4'] ? '✅ IMPLEMENTED' : '❌ MISSING'}`);
console.log(`☐ 3.5 Sync Schedule Configuration: ${componentStatus['3.5'] ? '✅ IMPLEMENTED' : '❌ MISSING'}`);
console.log(`☐ 3.6 Query/Response Logging: ${componentStatus['3.6'] ? '✅ IMPLEMENTED' : '❌ MISSING'}`);
console.log(`☐ Day 4 Vector Search Enhancement: ${componentStatus['Day4'] ? '✅ IMPLEMENTED' : '❌ MISSING'}`);

const allImplemented = Object.values(componentStatus).every(status => status === true);
console.log(`\n🎯 PHASE 1.2 STATUS: ${allImplemented ? '✅ FULLY IMPLEMENTED' : '⚠️ PARTIALLY IMPLEMENTED'}`);

process.exit(testResults.failed > 0 ? 1 : 0);