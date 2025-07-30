const { SourceAttributionEnhancer } = require('./server/utils/vectorDbProviders/SourceAttributionEnhancer.js');
const { CategoryFilter } = require('./server/utils/vectorDbProviders/CategoryFilter.js');
const { RelevanceScorer } = require('./server/utils/vectorDbProviders/RelevanceScorer.js');
const { FallbackSystem } = require('./server/utils/vectorDbProviders/FallbackSystem.js');

console.log('=== Phase 1.2 Comprehensive Component Tests ===\n');

let totalTests = 0;
let passedTests = 0;

function runTest(name, testFn) {
  totalTests++;
  try {
    testFn();
    console.log(`✅ ${name}`);
    passedTests++;
  } catch (e) {
    console.log(`❌ ${name}: ${e.message}`);
  }
}

// Test 1: SourceAttributionEnhancer
console.log('1. SourceAttributionEnhancer Tests:');

runTest('Component instantiation', () => {
  const enhancer = new SourceAttributionEnhancer();
  if (!enhancer) throw new Error('Failed to create instance');
});

runTest('Metadata enhancement with all fields', () => {
  const enhancer = new SourceAttributionEnhancer();
  const testDoc = {
    id: 'test-123',
    filename: 'product-catalog.pdf',
    metadata: JSON.stringify({test: true}),
    sourceType: 'product_catalog',
    category: 'Products/Electronics',
    priority: 1,
    businessContext: JSON.stringify({department: 'sales', region: 'US'})
  };
  
  const enhanced = enhancer.enhanceMetadata({}, testDoc, 0, 'Test content chunk');
  if (!enhanced || typeof enhanced !== 'object') {
    throw new Error('Enhancement failed');
  }
});

runTest('Minimal metadata handling', () => {
  const enhancer = new SourceAttributionEnhancer();
  const enhanced = enhancer.enhanceMetadata({}, {id: 'minimal', filename: 'test.txt'});
  if (!enhanced) throw new Error('Minimal metadata failed');
});

// Test 2: CategoryFilter
console.log('\n2. CategoryFilter Tests:');

runTest('Filter instance availability', () => {
  if (!CategoryFilter || typeof CategoryFilter.applyFilter !== 'function') {
    throw new Error('CategoryFilter not properly exported');
  }
});

runTest('Include strategy filtering', () => {
  const searchParams = { query: 'test query' };
  const filterConfig = {
    strategy: 'include',
    categories: ['Products/Electronics', 'Policies/Returns']
  };
  
  const result = CategoryFilter.applyFilter(searchParams, filterConfig);
  if (!result || typeof result !== 'object') {
    throw new Error('Include filtering failed');
  }
});

runTest('Exclude strategy filtering', () => {
  const searchParams = { query: 'test query' };
  const filterConfig = {
    strategy: 'exclude',
    categories: ['Internal/Confidential']
  };
  
  const result = CategoryFilter.applyFilter(searchParams, filterConfig);
  if (!result) throw new Error('Exclude filtering failed');
});

// Test 3: RelevanceScorer
console.log('\n3. RelevanceScorer Tests:');

runTest('Scorer instantiation', () => {
  const scorer = new RelevanceScorer();
  if (!scorer) throw new Error('Failed to create scorer');
});

runTest('Basic result scoring', () => {
  const scorer = new RelevanceScorer();
  const mockResults = [
    { id: 1, content: 'electronics return policy', metadata: '{"category": "Policies/Returns"}' },
    { id: 2, content: 'laptop specifications', metadata: '{"category": "Products/Electronics"}' }
  ];
  
  const context = {
    query: 'return policy electronics',
    weights: { textMatch: 0.4, categoryMatch: 0.3, freshness: 0.3 }
  };
  
  const scored = scorer.scoreResults(mockResults, context);
  if (!scored || scored.length !== 2) {
    throw new Error('Scoring failed');
  }
});

runTest('Vector similarity scoring', () => {
  const scorer = new RelevanceScorer();
  const mockResults = [
    { 
      id: 1, 
      content: 'test content',
      vector_distance: 0.3,
      metadata: '{"category": "Test"}'
    }
  ];
  
  const scored = scorer.scoreResults(mockResults, { query: 'test', weights: {} });
  if (!scored || !scored[0].score) {
    throw new Error('Vector scoring failed');
  }
});

// Test 4: FallbackSystem
console.log('\n4. FallbackSystem Tests:');

runTest('Fallback instantiation', () => {
  const fallback = new FallbackSystem();
  if (!fallback) throw new Error('Failed to create fallback system');
});

runTest('Low confidence detection', () => {
  const fallback = new FallbackSystem();
  const lowConfidenceResults = {
    results: [],
    confidence: 0.2,
    contextTexts: []
  };
  
  const shouldFallback = fallback.shouldTriggerFallback(lowConfidenceResults, { confidenceThreshold: 0.5 });
  if (shouldFallback !== true) {
    throw new Error('Low confidence not detected');
  }
});

runTest('High confidence passes through', () => {
  const fallback = new FallbackSystem();
  const highConfidenceResults = {
    results: [{ id: 1, content: 'good result' }],
    confidence: 0.8,
    contextTexts: ['relevant context']
  };
  
  const shouldFallback = fallback.shouldTriggerFallback(highConfidenceResults, { confidenceThreshold: 0.5 });
  if (shouldFallback !== false) {
    throw new Error('High confidence incorrectly triggered fallback');
  }
});

// Test 5: Integration test
console.log('\n5. Integration Tests:');

runTest('Enhanced LanceDB method exists', () => {
  const LanceDb = require('./server/utils/vectorDbProviders/lance/index.js');
  if (typeof LanceDb.performEnhancedSimilaritySearch !== 'function') {
    throw new Error('Enhanced similarity search method missing');
  }
});

// Summary
console.log('\n=== Test Summary ===');
console.log(`Total Tests: ${totalTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${totalTests - passedTests}`);
console.log(`Pass Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (passedTests === totalTests) {
  console.log('🎉 ALL TESTS PASSED!');
} else {
  console.log('⚠️  Some tests failed - see details above');
}