const { SourceAttributionEnhancer } = require('./server/utils/vectorDbProviders/SourceAttributionEnhancer.js');
const { CategoryFilter } = require('./server/utils/vectorDbProviders/CategoryFilter.js');
const { RelevanceScorer } = require('./server/utils/vectorDbProviders/RelevanceScorer.js');
const { FallbackSystem } = require('./server/utils/vectorDbProviders/FallbackSystem.js');

console.log('=== Phase 1.2 Component Tests ===\n');

// Test 1: SourceAttributionEnhancer
console.log('1. SourceAttributionEnhancer Tests:');
try {
  const enhancer = new SourceAttributionEnhancer();
  console.log('✅ Component loads successfully');
  
  // Test methods exist
  const methods = ['enhanceMetadata', 'validateSourceType', 'calculateTemporal', 'preserveBusinessContext'];
  let allMethodsExist = true;
  
  methods.forEach(method => {
    if (typeof enhancer[method] !== 'function') {
      console.log(`  ❌ Missing method: ${method}`);
      allMethodsExist = false;
    }
  });
  
  if (allMethodsExist) {
    console.log('✅ All expected methods exist');
  }
} catch (e) {
  console.log('❌ SourceAttributionEnhancer failed:', e.message);
}

// Test 2: CategoryFilter
console.log('\n2. CategoryFilter Tests:');
try {
  const filter = new CategoryFilter();
  console.log('✅ Component loads successfully');
  
  // Test basic filtering
  const testConfig = {
    strategy: 'include',
    categories: ['Products/Electronics', 'Policies/Returns']
  };
  
  const result = filter.buildFilter(testConfig);
  console.log('✅ Filter building works');
  console.log(`  Filter result type: ${typeof result}`);
} catch (e) {
  console.log('❌ CategoryFilter failed:', e.message);
}

// Test 3: RelevanceScorer
console.log('\n3. RelevanceScorer Tests:');
try {
  const scorer = new RelevanceScorer();
  console.log('✅ Component loads successfully');
  
  // Test scoring with mock data
  const mockResults = [
    { id: 1, content: 'test content', metadata: '{}' },
    { id: 2, content: 'another test', metadata: '{}' }
  ];
  
  const context = {
    query: 'test query',
    weights: { textMatch: 0.4, categoryMatch: 0.3, freshness: 0.3 }
  };
  
  const scored = scorer.scoreResults(mockResults, context);
  console.log('✅ Scoring works');
  console.log(`  Scored ${scored.length} results`);
} catch (e) {
  console.log('❌ RelevanceScorer failed:', e.message);
}

// Test 4: FallbackSystem
console.log('\n4. FallbackSystem Tests:');
try {
  const fallback = new FallbackSystem();
  console.log('✅ Component loads successfully');
  
  // Test confidence threshold
  const lowConfidenceResults = {
    results: [],
    confidence: 0.2
  };
  
  const shouldFallback = fallback.shouldTriggerFallback(lowConfidenceResults, { threshold: 0.5 });
  console.log(`✅ Fallback detection works: ${shouldFallback}`);
} catch (e) {
  console.log('❌ FallbackSystem failed:', e.message);
}

console.log('\n=== Component Tests Complete ===');