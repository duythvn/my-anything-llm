#!/usr/bin/env node

/**
 * Phase 1.2 Component Testing
 * Tests individual components without LLM dependencies
 */

const path = require('path');
const fs = require('fs');

// Add server directory to require path
const serverPath = path.join(__dirname, '..', 'server');
process.chdir(serverPath);

// Check if Phase 1.2 components exist before testing

async function testPhase1p2Components() {
  console.log("🧪 Phase 1.2 Component Tests");
  console.log("============================");
  
  let passedTests = 0;
  let totalTests = 0;
  
  // Test 1: Source Attribution Enhancer
  try {
    totalTests++;
    console.log("\n1. Testing SourceAttributionEnhancer...");
    
    const componentPath = './utils/vectorDbProviders/SourceAttributionEnhancer.js';
    if (!fs.existsSync(componentPath)) {
      console.log("   ❌ SourceAttributionEnhancer.js not found - component not implemented");
      continue;
    }
    
    const { SourceAttributionEnhancer } = require('./utils/vectorDbProviders/SourceAttributionEnhancer');
    const enhancer = new SourceAttributionEnhancer();
    
    const mockResults = [
      {
        content: 'Test content from document',
        metadata: { source: 'test.pdf', page: 1 },
        score: 0.85
      }
    ];
    
    const enhanced = await enhancer.enhance(mockResults, 'test query');
    
    if (enhanced && enhanced.length > 0 && enhanced[0].sourceAttribution) {
      console.log("   ✅ SourceAttributionEnhancer working");
      passedTests++;
    } else {
      console.log("   ❌ SourceAttributionEnhancer failed");
    }
  } catch (error) {
    console.log(`   ❌ SourceAttributionEnhancer error: ${error.message}`);
  }
  
  // Test 2: Category Filter
  try {
    totalTests++;
    console.log("\n2. Testing CategoryFilter...");
    
    const { CategoryFilter } = require('./utils/vectorDbProviders/CategoryFilter');
    const filter = new CategoryFilter();
    
    const mockResults = [
      { content: 'PDF content', metadata: { source: 'doc.pdf' }, score: 0.9 },
      { content: 'Text content', metadata: { source: 'doc.txt' }, score: 0.8 }
    ];
    
    const filtered = await filter.filter(mockResults, ['pdf']);
    
    if (filtered && filtered.length === 1) {
      console.log("   ✅ CategoryFilter working");
      passedTests++;
    } else {
      console.log("   ❌ CategoryFilter failed");
    }
  } catch (error) {
    console.log(`   ❌ CategoryFilter error: ${error.message}`);
  }
  
  // Test 3: Relevance Scorer
  try {
    totalTests++;
    console.log("\n3. Testing RelevanceScorer...");
    
    const { RelevanceScorer } = require('./utils/vectorDbProviders/RelevanceScorer');
    const scorer = new RelevanceScorer();
    
    const mockResults = [
      { content: 'Highly relevant content', score: 0.9 },
      { content: 'Less relevant content', score: 0.6 }
    ];
    
    const scored = await scorer.score(mockResults, 'test query');
    
    if (scored && scored.length > 0 && scored[0].relevanceScore !== undefined) {
      console.log("   ✅ RelevanceScorer working");
      passedTests++;
    } else {
      console.log("   ❌ RelevanceScorer failed");
    }
  } catch (error) {
    console.log(`   ❌ RelevanceScorer error: ${error.message}`);
  }
  
  // Test 4: Fallback System
  try {
    totalTests++;
    console.log("\n4. Testing FallbackSystem...");
    
    const { FallbackSystem } = require('./utils/vectorDbProviders/FallbackSystem');
    const fallback = new FallbackSystem();
    
    const response = await fallback.handleLowConfidence('test query', []);
    
    if (response && response.fallbackResponse) {
      console.log("   ✅ FallbackSystem working");
      passedTests++;
    } else {
      console.log("   ❌ FallbackSystem failed");
    }
  } catch (error) {
    console.log(`   ❌ FallbackSystem error: ${error.message}`);
  }
  
  // Test Summary
  console.log("\n🎯 Test Summary");
  console.log("===============");
  console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
  
  if (passedTests === totalTests) {
    console.log("🎉 All Phase 1.2 components are working!");
    process.exit(0);
  } else {
    console.log("⚠️  Some components need implementation or fixes");
    process.exit(1);
  }
}

// Run tests
testPhase1p2Components().catch(error => {
  console.error("❌ Test runner error:", error);
  process.exit(1);
});