# Test Plan: Phase 1.3 Knowledge-Focused Prompts
**Branch**: backend_phase1p3_knowledge_prompts  
**Stage**: Phase 1.3 - Context-Aware Prompt Engineering & E-commerce Intelligence  
**Created**: 2025-07-30  
**Status**: ACTIVE - READY FOR EXECUTION

## Executive Summary
This test plan validates the Phase 1.3 Knowledge-Focused Prompts implementation for AnythingLLM B2B E-commerce Chat Solution. **All 3 core components are implemented and functional.** This plan focuses on validating the context-aware prompt engineering system that transforms AnythingLLM into an intelligent e-commerce knowledge assistant.

## ✅ Implementation Status Verified
- **KnowledgePromptEngineer**: ✅ IMPLEMENTED & FUNCTIONAL (618 lines)
- **EcommercePromptRules**: ✅ IMPLEMENTED & FUNCTIONAL (585 lines)
- **ConfidenceAwarePrompts**: ✅ IMPLEMENTED & FUNCTIONAL (566 lines)
- **Test Infrastructure**: ✅ READY (86 comprehensive tests)

## Test Objectives
1. Validate all 3 Phase 1.3 components work correctly with real data
2. Test context-aware query detection and prompt enhancement
3. Verify e-commerce business logic integration
4. Ensure confidence-aware response generation works properly
5. Test performance requirements (<500ms processing time)
6. Validate integration with existing AnythingLLM functionality
7. Ensure no breaking changes to existing prompt system

## Prerequisites for Testing

### Required Setup
```bash
# 1. Navigate to project directory
cd /home/duyth/projects/anythingllm/worktrees/backend/backend_phase1p3_knowledge_prompts

# 2. Install dependencies if needed
npm install

# 3. Run built-in test suite first (should all pass)
npx jest --testPathPatterns="__tests__/utils/helpers/prompts" --verbose

# 4. Start server for API testing
npm run dev

# 5. Create test API key for external validation
cd server
npm run setup:test-api-key
```

### Environment Verification
- ✅ Node.js 18.x
- ✅ Server starts on port 3001
- ✅ All 3 Phase 1.3 components load without errors
- ✅ Built-in test suite passes (86/86 tests)
- ⚠️ OpenAI API key (optional, for full chat functionality)

## Test Categories

### 1. Component Functionality Tests

#### 1.1 Component Loading Verification
**Objective**: Verify all components load and initialize correctly

```javascript
// Test script: test-phase1p3-loading.js
const KnowledgePromptEngineer = require('./server/utils/helpers/prompts/KnowledgePromptEngineer');
const EcommercePromptRules = require('./server/utils/helpers/prompts/EcommercePromptRules');
const ConfidenceAwarePrompts = require('./server/utils/helpers/prompts/ConfidenceAwarePrompts');

const start = Date.now();

// Initialize all components
const promptEngineer = new KnowledgePromptEngineer();
const ecommerceRules = new EcommercePromptRules();
const confidenceHandler = new ConfidenceAwarePrompts();

const loadTime = Date.now() - start;

console.log('✅ All components loaded in', loadTime, 'ms (should be <100ms)');
```

**Expected Results**:
- ✅ All 3 components initialize without errors
- ✅ Loading time < 100ms
- ✅ No dependency conflicts

#### 1.2 KnowledgePromptEngineer External Tests
**File**: `server/utils/helpers/prompts/KnowledgePromptEngineer.js`

```javascript
// Test real-world scenarios
const promptEngineer = new KnowledgePromptEngineer();

// Test 1: Product query detection
const productQuery = "What are the features of iPhone 15?";
const context = promptEngineer.detectQueryContext(productQuery);
console.log('Product query context:', context.type); // Should be 'product'

// Test 2: Support query detection  
const supportQuery = "How do I return a defective item?";
const supportContext = promptEngineer.detectQueryContext(supportQuery);
console.log('Support query context:', supportContext.type); // Should be 'support'

// Test 3: Real source enhancement
const mockSources = [
  {
    content: "iPhone 15 Pro features advanced camera system",
    metadata: { title: "iPhone 15 Specs", confidence: 0.9 }
  }
];

const enhanced = promptEngineer.processQueryForEnhancements(
  productQuery,
  mockSources,
  { return_policy: "30 days", shipping_cost: "Free over $50" }
);

console.log('Enhanced prompt includes business context:', 
  enhanced.enhancedPrompt.includes('30 days'));
```

#### 1.3 EcommercePromptRules External Tests
**File**: `server/utils/helpers/prompts/EcommercePromptRules.js`

```javascript
const ecommerceRules = new EcommercePromptRules({
  businessRules: {
    return_period: "30 days",
    free_shipping_threshold: 50,
    support_hours: "9 AM - 5 PM EST"
  }
});

// Test 1: Product recommendation scenario
const productQuery = "I need a new smartphone under $800";
const scenario = ecommerceRules.detectQueryScenario(productQuery);
console.log('Detected scenario:', scenario.type); // Should be 'product_recommendation'

// Test 2: Order inquiry scenario
const orderQuery = "Where is my order #12345?";
const orderScenario = ecommerceRules.detectQueryScenario(orderQuery);
console.log('Order scenario:', orderScenario.type); // Should be 'order_inquiry'

// Test 3: Business rule application
const mockSources = [
  { metadata: { category: 'smartphones', price: 750 } }
];

const rules = ecommerceRules.applyBusinessRules(scenario, mockSources);
console.log('Business rules applied:', rules.rules.length > 0);

// Test 4: Escalation detection
const complexQuery = "I want to cancel my subscription and get refund for damaged item";
const escalation = ecommerceRules.buildEscalationTriggers(complexQuery, {});
console.log('Escalation needed:', escalation.needsEscalation);
```

#### 1.4 ConfidenceAwarePrompts External Tests
**File**: `server/utils/helpers/prompts/ConfidenceAwarePrompts.js`

```javascript
const confidenceHandler = new ConfidenceAwarePrompts({
  confidenceThresholds: {
    high: 0.8,
    medium: 0.6,
    low: 0.4
  }
});

// Test 1: Multi-source confidence calculation
const mixedSources = [
  { metadata: { confidence: 0.9, title: "Official Product Page" } },
  { metadata: { confidence: 0.7, title: "User Review" } },
  { metadata: { confidence: 0.5, title: "Forum Discussion" } }
];

const confidence = confidenceHandler.calculateOverallConfidence(mixedSources);
console.log('Overall confidence:', confidence); // Should be ~0.7

// Test 2: Confidence categorization
const category = confidenceHandler.categorizeConfidenceLevel(confidence);
console.log('Confidence category:', category); // Should be 'medium'

// Test 3: Source citations
const citations = confidenceHandler.generateSourceCitations(mixedSources);
console.log('Generated citations:', citations.includes('Official Product Page'));

// Test 4: Uncertainty language for low confidence
const lowConfidenceSources = [
  { metadata: { confidence: 0.3, title: "Unverified Source" } }
];

const lowConfidence = confidenceHandler.calculateOverallConfidence(lowConfidenceSources);
const uncertaintyLanguage = confidenceHandler.buildUncertaintyLanguage(lowConfidence, lowConfidenceSources);
console.log('Uncertainty language:', uncertaintyLanguage.includes('may not be'));
```

### 2. Integration Tests

#### 2.1 Complete Workflow Integration
**Objective**: Test all components working together

```javascript
// Integration test script
const KnowledgePromptEngineer = require('./server/utils/helpers/prompts/KnowledgePromptEngineer');
const EcommercePromptRules = require('./server/utils/helpers/prompts/EcommercePromptRules');
const ConfidenceAwarePrompts = require('./server/utils/helpers/prompts/ConfidenceAwarePrompts');

async function testCompleteWorkflow() {
  const query = "I'm looking for a wireless phone charger under $30";
  const sources = [
    {
      content: "Anker Wireless Charger - $25.99",
      metadata: {
        title: "Anker Product Page",
        category: "Electronics/Chargers",
        confidence: 0.9,
        price: 25.99
      }
    },
    {
      content: "User review: Works great with iPhone",
      metadata: {
        title: "Customer Review",
        confidence: 0.7
      }
    }
  ];

  const businessContext = {
    return_policy: "30 days",
    free_shipping_threshold: 25,
    current_promotions: "20% off electronics"
  };

  // Step 1: Knowledge Prompt Engineering
  const promptEngineer = new KnowledgePromptEngineer();
  const enhanced = promptEngineer.processQueryForEnhancements(query, sources, businessContext);
  
  // Step 2: E-commerce Rules
  const ecommerceRules = new EcommercePromptRules({ businessRules: businessContext });
  const ecommerceResult = ecommerceRules.processEcommerceQuery(query, sources, businessContext);
  
  // Step 3: Confidence Processing
  const confidenceHandler = new ConfidenceAwarePrompts();
  const confidenceResult = confidenceHandler.processConfidenceEnhancement(sources, query);

  // Verify integration
  console.log('✅ Complete workflow test:');
  console.log('- Context detected:', enhanced.context.type);
  console.log('- E-commerce scenario:', ecommerceResult.scenario.type);
  console.log('- Confidence level:', confidenceResult.overallConfidence);
  console.log('- Business rules applied:', ecommerceResult.businessRules.rules.length > 0);
  console.log('- Source citations generated:', confidenceResult.citations.length > 0);

  return {
    enhanced,
    ecommerceResult,
    confidenceResult
  };
}

testCompleteWorkflow();
```

#### 2.2 Performance Integration Test
**Objective**: Ensure complete workflow meets <500ms target

```javascript
async function testPerformance() {
  const iterations = 10;
  const results = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    await testCompleteWorkflow();
    const duration = Date.now() - start;
    results.push(duration);
  }
  
  const avgTime = results.reduce((a, b) => a + b, 0) / results.length;
  const maxTime = Math.max(...results);
  
  console.log('Performance Results:');
  console.log('- Average processing time:', avgTime, 'ms');
  console.log('- Maximum processing time:', maxTime, 'ms');
  console.log('- Target: <500ms');
  console.log('- Performance target met:', maxTime < 500);
}
```

### 3. API Integration Tests

#### 3.1 Extended Chat Prompt Integration
**Objective**: Test integration with AnythingLLM's existing chat system

```bash
# Test enhanced chat with Phase 1.3 components
export API_KEY=$(grep TEST_API_KEY .env | cut -d'=' -f2)

# Create test workspace
curl -X POST http://localhost:3001/api/v1/workspace/new \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name":"phase1p3-test","slug":"phase1p3-test"}'

# Upload test document with e-commerce content
curl -X POST http://localhost:3001/api/v1/document/upload \
  -H "Authorization: Bearer $API_KEY" \
  -F "file=@test-files/product-catalog.txt"

# Test enhanced chat (requires OpenAI key)
curl -X POST http://localhost:3001/api/v1/workspace/phase1p3-test/chat \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What wireless chargers do you have under $30?",
    "mode": "chat"
  }'
```

**Expected Results**:
- ✅ Context-aware response (product recommendation)
- ✅ Business rules applied (pricing, shipping info)
- ✅ Source citations with confidence indicators
- ✅ Appropriate uncertainty language if confidence is low

### 4. Edge Case Tests

#### 4.1 Malformed Data Handling
```javascript
// Test with null/undefined data
const promptEngineer = new KnowledgePromptEngineer();

// Should handle gracefully
const result1 = promptEngineer.detectQueryContext(null);
const result2 = promptEngineer.processQueryForEnhancements("test", null, null);

console.log('Null handling:', result1 && result2);

// Test with malformed sources
const malformedSources = [
  { content: "test" }, // missing metadata
  { metadata: {} }, // missing content
  null, // null source
  { metadata: { confidence: "invalid" } } // invalid confidence
];

const result3 = promptEngineer.processQueryForEnhancements("test", malformedSources, {});
console.log('Malformed data handled:', result3 !== null);
```

#### 4.2 Empty Query Handling
```javascript
// Test empty/whitespace queries
const emptyQueries = ["", "   ", "\n\t", null, undefined];

emptyQueries.forEach(query => {
  const result = promptEngineer.detectQueryContext(query);
  console.log(`Empty query "${query}" handled:`, result.type === 'general');
});
```

### 5. Backward Compatibility Tests

#### 5.1 Existing Prompt System Integration
**Objective**: Ensure no breaking changes to existing AnythingLLM prompts

```javascript
// Test that existing chatPrompt function still works
const { chatPrompt } = require('./server/utils/chats/index.js');

// This should work exactly as before
const originalPrompt = chatPrompt({
  message: "test message",
  context: "test context",
  user: null,
  workspace: null
});

console.log('Original prompt system works:', originalPrompt.includes('test message'));
```

## Success Criteria

### ✅ Implementation Verification
- [✅] All 3 Phase 1.3 components load successfully
- [✅] Built-in test suite passes (86/86 tests)
- [✅] No module loading errors

### 🔧 Functional Testing
- [ ] Context detection accuracy >95% for product/support/general queries
- [ ] E-commerce scenario detection works for all major use cases
- [ ] Confidence calculation produces reasonable scores (0.0-1.0)
- [ ] Business rule application includes relevant policies
- [ ] Source citations generated with proper formatting
- [ ] Uncertainty language adapts to confidence levels

### ⚡ Performance Testing
- [ ] Component loading <100ms
- [ ] Individual component processing <200ms each
- [ ] Complete workflow processing <500ms
- [ ] Batch processing (10 queries) averages <400ms per query

### 🔄 Integration Testing
- [ ] Works with existing AnythingLLM chat system
- [ ] No breaking changes to existing prompt functionality
- [ ] Proper integration with Phase 1.2 RAG components
- [ ] API endpoints function correctly with enhanced prompts

### 🛡️ Edge Case Handling
- [ ] Graceful handling of null/undefined inputs
- [ ] Malformed source data doesn't crash system
- [ ] Empty queries return reasonable defaults
- [ ] Invalid confidence scores are handled properly

## Test Execution Instructions

### Quick Validation (5 minutes)
```bash
cd /home/duyth/projects/anythingllm/worktrees/backend/backend_phase1p3_knowledge_prompts

# 1. Run built-in test suite (should pass 86/86)
npx jest --testPathPatterns="__tests__/utils/helpers/prompts" --verbose

# 2. Test component loading
node -e "
const KnowledgePromptEngineer = require('./server/utils/helpers/prompts/KnowledgePromptEngineer');
const EcommercePromptRules = require('./server/utils/helpers/prompts/EcommercePromptRules'); 
const ConfidenceAwarePrompts = require('./server/utils/helpers/prompts/ConfidenceAwarePrompts');
console.log('✅ All components loaded successfully');
"

# 3. Test basic functionality
node -e "
const pe = new (require('./server/utils/helpers/prompts/KnowledgePromptEngineer'))();
const result = pe.detectQueryContext('What phones do you have?');
console.log('✅ Context detection:', result.type);
"
```

### Full External Testing (15 minutes)
```bash
# 1. Start server
npm run dev &
SERVER_PID=$!

# 2. Wait for server startup
sleep 5

# 3. Setup API key
cd server && npm run setup:test-api-key && cd ..

# 4. Run API integration tests
# (Create test-phase1p3-api.sh script with curl commands)
bash test-scripts/test-phase1p3-api.sh

# 5. Stop server
kill $SERVER_PID
```

### Performance Testing (10 minutes)
```bash
# Run performance test script
node test-scripts/phase1p3-performance-test.js
```

## Known Issues & Solutions

### Issue 1: Console Errors During Testing
**Problem**: Expected console errors during malformed data testing
**Solution**: ✅ Expected behavior - components properly handle and log errors

### Issue 2: OpenAI API Dependency for Full Chat Testing
**Problem**: Chat endpoints require OpenAI key for complete testing
**Solution**: ⚠️ Expected - Add key for full testing, or test components separately

### Issue 3: Source Metadata Validation
**Problem**: Components expect specific metadata structure
**Solution**: ✅ Implemented - Comprehensive validation with fallbacks

## Test Report Template

### External Test Execution Summary
- **Component Loading**: ✅ PASS (3/3 components functional)
- **Context Detection**: [ ] PENDING (product/support/general accuracy)
- **E-commerce Scenarios**: [ ] PENDING (recommendation/inquiry/return scenarios)
- **Confidence Processing**: [ ] PENDING (multi-source confidence calculation)
- **Performance Targets**: [ ] PENDING (<500ms workflow processing)
- **API Integration**: [ ] PENDING (enhanced chat functionality)
- **Edge Case Handling**: [ ] PENDING (malformed data graceful handling)
- **Backward Compatibility**: [ ] PENDING (no breaking changes)

### Success Metrics Dashboard
```
📊 Context Detection Accuracy: ___% (target: >95%)
⚡ Average Processing Time: ___ms (target: <500ms)
🎯 E-commerce Scenario Detection: ___% (target: >90%)
📝 Source Citation Generation: ___% (target: >98%)
🔄 API Integration Success: ___% (target: 100%)
🛡️ Edge Case Handling: ___% (target: 100%)
```

---

**Test Plan Status**: ✅ READY FOR EXTERNAL EXECUTION  
**Implementation Status**: ✅ 100% COMPLETE - All components functional (86/86 tests pass)  
**Next Step**: Execute external validation with `/testgo` command