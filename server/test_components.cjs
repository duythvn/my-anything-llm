#!/usr/bin/env node

/**
 * Phase 1.2 Component Integration Test
 * Test actual component loading and basic functionality
 */

const path = require('path');

console.log('🧪 Testing Phase 1.2 Component Loading and Basic Functionality\n');

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

// Test 1: Component Loading
console.log('📦 Testing Component Loading...\n');

try {
  const { SourceAttributionEnhancer } = require('./utils/vectorDbProviders/SourceAttributionEnhancer');
  const enhancer = new SourceAttributionEnhancer();
  test('SourceAttributionEnhancer Loading', enhancer !== null, 'Failed to instantiate');
} catch (error) {
  test('SourceAttributionEnhancer Loading', false, error.message);
}

try {
  const { CategoryFilter } = require('./utils/vectorDbProviders/CategoryFilter');
  test('CategoryFilter Loading', CategoryFilter !== null, 'Failed to load');
} catch (error) {
  test('CategoryFilter Loading', false, error.message);
}

try {
  const { RelevanceScorer } = require('./utils/vectorDbProviders/RelevanceScorer');
  const scorer = new RelevanceScorer();
  test('RelevanceScorer Loading', scorer !== null, 'Failed to instantiate');
} catch (error) {
  test('RelevanceScorer Loading', false, error.message);
}

try {
  const { FallbackSystem } = require('./utils/vectorDbProviders/FallbackSystem');
  const fallback = new FallbackSystem();
  test('FallbackSystem Loading', fallback !== null, 'Failed to instantiate');
} catch (error) {
  test('FallbackSystem Loading', false, error.message);
}

// Test 2: LanceDB Integration
console.log('\n🔗 Testing LanceDB Integration...\n');

try {
  const { LanceDb } = require('./utils/vectorDbProviders/lance/index.js');
  const hasEnhancedMethod = typeof LanceDb.performEnhancedSimilaritySearch === 'function';
  test('Enhanced Similarity Search Method', hasEnhancedMethod, 'Method not found');
} catch (error) {
  test('Enhanced Similarity Search Method', false, error.message);
}

// Test 3: Model Loading
console.log('\n📄 Testing Model Loading...\n');

try {
  const { QueryLogs } = require('./models/queryLogs');
  const hasLogMethod = typeof QueryLogs.logQuery === 'function';
  test('QueryLogs Model', hasLogMethod, 'logQuery method not found');
} catch (error) {
  test('QueryLogs Model', false, error.message);
}

// Test 4: Parser Loading
console.log('\n🔍 Testing Parser Loading...\n');

try {
  const { LinkExtractor } = require('./utils/files/parsers/linkExtractor');
  const extractor = new LinkExtractor();
  test('LinkExtractor Parser', extractor !== null, 'Failed to instantiate');
} catch (error) {
  test('LinkExtractor Parser', false, error.message);
}

try {
  const { FAQParser } = require('./utils/files/parsers/faqParser');
  test('FAQParser Parser', FAQParser !== null, 'Failed to load');
} catch (error) {
  test('FAQParser Parser', false, error.message);
}

// Test 5: Background Workers
console.log('\n⚙️  Testing Background Workers...\n');

try {
  const { SyncScheduler } = require('./utils/BackgroundWorkers/syncScheduler');
  const scheduler = new SyncScheduler();
  test('SyncScheduler Worker', scheduler !== null, 'Failed to instantiate');
} catch (error) {
  test('SyncScheduler Worker', false, error.message);
}

// Test 6: Database Schema Compatibility
console.log('\n🗄️  Testing Database Schema...\n');

try {
  const fs = require('fs');
  const schemaContent = fs.readFileSync('./prisma/schema.prisma', 'utf8');
  const hasQueryLogs = schemaContent.includes('model query_logs');
  const hasEnhancedFields = schemaContent.includes('sourceType') && schemaContent.includes('syncMetadata');
  test('Database Schema Updates', hasQueryLogs && hasEnhancedFields, 'Missing schema updates');
} catch (error) {
  test('Database Schema Updates', false, error.message);
}

// Test 7: Basic Functionality
console.log('\n🔧 Testing Basic Functionality...\n');

try {
  const { SourceAttributionEnhancer } = require('./utils/vectorDbProviders/SourceAttributionEnhancer');
  const enhancer = new SourceAttributionEnhancer();
  
  const result = enhancer.enhanceMetadata(
    { title: 'Test' },
    { docId: 'test', sourceType: 'manual_upload' },
    0,
    'Test content'
  );
  
  const hasRequiredFields = result.sourceType && result.chunkId && result.confidence;
  test('Metadata Enhancement', hasRequiredFields, 'Missing required metadata fields');
} catch (error) {
  test('Metadata Enhancement', false, error.message);
}

try {
  const { RelevanceScorer } = require('./utils/vectorDbProviders/RelevanceScorer');
  const scorer = new RelevanceScorer();
  
  const mockResult = {
    score: 0.8,
    metadata: { text: 'test content', sourceType: 'test' }
  };
  
  const scored = scorer.scoreResult(mockResult, { query: 'test' });
  const hasScore = scored.relevanceScore !== undefined;
  test('Relevance Scoring', hasScore, 'Scoring failed');
} catch (error) {
  test('Relevance Scoring', false, error.message);
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 COMPONENT TESTING SUMMARY');
console.log('='.repeat(60));
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📊 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

if (failed === 0) {
  console.log('\n🎉 All components loaded and basic functionality verified!');
  console.log('✅ Phase 1.2 components are ready for testing.');
} else {
  console.log('\n⚠️  Some components failed to load or function correctly.');
  console.log('❌ Review errors above before proceeding.');
}

process.exit(failed > 0 ? 1 : 0);