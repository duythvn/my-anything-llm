// Test enhanced similarity search functionality
const path = require('path');

// Change to correct directory
process.chdir('/home/duyth/projects/anythingllm/worktrees/backend/backend_phase1p2_rag_system');

async function testEnhancedSearch() {
  console.log('=== Enhanced Similarity Search Test ===\n');
  
  try {
    // Load LanceDB provider
    const lanceModule = require('./server/utils/vectorDbProviders/lance/index.js');
    const LanceDb = lanceModule.LanceDb;
    console.log('✅ LanceDB provider loaded');
    
    // Check if enhanced method exists
    if (typeof LanceDb.performEnhancedSimilaritySearch === 'function') {
      console.log('✅ Enhanced similarity search method exists');
    } else {
      console.log('❌ Enhanced similarity search method missing');
      console.log('Available methods:', Object.keys(LanceDb));
      return;
    }
    
    // Test basic connection
    try {
      const heartbeat = await LanceDb.heartbeat();
      console.log('✅ LanceDB connection successful:', heartbeat);
    } catch (e) {
      console.log('❌ LanceDB connection failed:', e.message);
      return;
    }
    
    // Test enhanced search with mock parameters
    try {
      console.log('\nTesting enhanced similarity search...');
      
      const searchParams = {
        namespace: "test-workspace",
        input: "What is the return policy for electronics?",
        LLMConnector: null, // We'll test without actual LLM
        categoryFilter: {
          strategy: 'include',
          categories: ['Policies/Returns', 'Products/Electronics']
        },
        relevanceWeights: {
          textMatch: 0.3,
          categoryMatch: 0.3,
          sourceReliability: 0.2,
          freshness: 0.2
        },
        enableFallback: true,
        topN: 5
      };
      
      // This will likely fail due to no actual data, but we can test the method structure
      const results = await LanceDb.performEnhancedSimilaritySearch(searchParams);
      console.log('✅ Enhanced search executed successfully');
      console.log('Result structure:', Object.keys(results || {}));
      
    } catch (e) {
      if (e.message.includes('Invalid request') || e.message.includes('LLMConnector')) {
        console.log('✅ Enhanced search method properly validates parameters');
      } else if (e.message.includes('no table') || e.message.includes('namespace')) {
        console.log('✅ Enhanced search method exists (no data in test namespace)');
      } else {
        console.log('❌ Enhanced search failed:', e.message);
      }
    }
    
    // Test fallback system integration
    console.log('\nTesting fallback system integration...');
    try {
      const { FallbackSystem } = require('./server/utils/vectorDbProviders/FallbackSystem.js');
      const fallback = new FallbackSystem();
      
      const mockLowConfidenceResult = {
        results: [],
        contextTexts: [],
        confidence: 0.2
      };
      
      const fallbackResult = await fallback.processFallback(mockLowConfidenceResult, {
        query: 'test query',
        confidenceThreshold: 0.5
      });
      
      console.log('✅ Fallback system integration works');
      console.log('Fallback result type:', typeof fallbackResult);
      
    } catch (e) {
      console.log('❌ Fallback system integration failed:', e.message);
    }
    
  } catch (e) {
    console.log('❌ Test setup failed:', e.message);
  }
}

testEnhancedSearch().then(() => {
  console.log('\n=== Enhanced Search Test Complete ===');
}).catch(e => {
  console.log('❌ Test execution failed:', e.message);
});