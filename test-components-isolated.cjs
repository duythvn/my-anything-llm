// test-components-isolated.js
// Test components without triggering Prisma initialization

// Mock the SystemPromptVariables to avoid Prisma
const mockSystemPromptVariables = {
  expandSystemPromptVariables: async (prompt) => prompt
};

// Override require cache to use mock
require.cache[require.resolve('./server/models/systemPromptVariables')] = {
  exports: { SystemPromptVariables: mockSystemPromptVariables }
};

// Now test the components
const { KnowledgePromptEngineer } = require('./server/utils/helpers/prompts/KnowledgePromptEngineer');
const { EcommercePromptRules } = require('./server/utils/helpers/prompts/EcommercePromptRules');
const { ConfidenceAwarePrompts } = require('./server/utils/helpers/prompts/ConfidenceAwarePrompts');

console.log('Testing components without database...');

// Test malformed data handling
const promptEngineer = new KnowledgePromptEngineer();
const malformedSources = [
  { content: "test" }, // missing metadata
  { metadata: {} }, // missing content
  null, // null source
  { metadata: { confidence: "invalid" } } // invalid confidence
];

async function runIsolatedTests() {
  try {
    const result = await promptEngineer.processQueryForEnhancements("test", malformedSources, {});
    console.log('✅ Malformed data handled without crash');
  } catch (error) {
    console.log('❌ Component error:', error.message);
  }

  // Test empty query handling
  const emptyQueries = ["", "   ", "\n\t", null, undefined];
  emptyQueries.forEach(query => {
    const result = promptEngineer.detectQueryContext(query);
    console.log(`✅ Empty query "${query}" handled: ${result.type === 'general'}`);
  });

  // Test existing prompt system integration
  const { chatPrompt } = require('./server/utils/chats/index.js');
  try {
    const originalPrompt = await chatPrompt(
      { openAiPrompt: "This is a test message." }, // workspace object
      null // user object
    );
    console.log('✅ Original prompt system works:', originalPrompt.includes('test message'));
  } catch (error) {
    console.log('❌ Original prompt system error:', error.message);
  }
}

runIsolatedTests();