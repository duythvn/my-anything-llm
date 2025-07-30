/**
 * Test Suite for KnowledgePromptEngineer
 * Phase 1.3: Knowledge-Focused Prompts
 */

// Mock SystemPromptVariables dependency
jest.mock('../../../../models/systemPromptVariables', () => ({
  SystemPromptVariables: {
    expandSystemPromptVariables: jest.fn(async (prompt, userId) => {
      // Simple mock that just returns the prompt with user ID injected
      if (userId) {
        return prompt.replace('{user.name}', 'Test User');
      }
      return prompt;
    })
  }
}));

const { KnowledgePromptEngineer } = require('../../../../utils/helpers/prompts/KnowledgePromptEngineer');

describe('KnowledgePromptEngineer', () => {
  let promptEngineer;

  beforeEach(() => {
    promptEngineer = new KnowledgePromptEngineer();
  });

  describe('constructor', () => {
    it('should initialize with default configuration', () => {
      expect(promptEngineer).toBeInstanceOf(KnowledgePromptEngineer);
      expect(promptEngineer.config).toBeDefined();
      expect(promptEngineer.contextDetectors).toBeDefined();
      expect(promptEngineer.promptTemplates).toBeDefined();
    });

    it('should accept custom configuration', () => {
      const customConfig = {
        confidenceThreshold: 0.8,
        maxSourcesPerPrompt: 10
      };
      const customEngineer = new KnowledgePromptEngineer(customConfig);
      expect(customEngineer.config.confidenceThreshold).toBe(0.8);
      expect(customEngineer.config.maxSourcesPerPrompt).toBe(10);
    });
  });

  describe('detectQueryContext', () => {
    it('should detect product queries correctly', () => {
      const queries = [
        'What is the price of SKU ABC123?',
        'Tell me about iPhone 15 features',
        'Do you have this product in stock?',
        'Compare these two items'
      ];

      queries.forEach(query => {
        const context = promptEngineer.detectQueryContext(query);
        expect(context.type).toBe('product');
        expect(context.confidence).toBeGreaterThan(0.1);
      });
    });

    it('should detect support queries correctly', () => {
      const queries = [
        'How do I return an item?',
        'What is your refund policy?',
        'How to track my order?',
        'Contact customer service'
      ];

      queries.forEach(query => {
        const context = promptEngineer.detectQueryContext(query);
        expect(context.type).toBe('support');
        expect(context.confidence).toBeGreaterThan(0.1);
      });
    });

    it('should detect general queries correctly', () => {
      const queries = [
        'Tell me about your company',
        'What services do you offer?',
        'Company history information',
        'Business hours and locations'
      ];

      queries.forEach(query => {
        const context = promptEngineer.detectQueryContext(query);
        expect(context.type).toBe('general');
        expect(context.confidence).toBeGreaterThanOrEqual(0.1);
      });
    });

    it('should handle empty or invalid queries', () => {
      const invalidQueries = ['', null, undefined, '   '];

      invalidQueries.forEach(query => {
        const context = promptEngineer.detectQueryContext(query);
        expect(context.type).toBe('general');
        expect(context.confidence).toBe(0.5);
      });
    });
  });

  describe('enhancePromptWithContext', () => {
    it('should enhance prompt with product context', async () => {
      const basePrompt = 'You are a helpful assistant.';
      const query = 'Tell me about iPhone 15';
      const sources = [
        {
          text: 'iPhone 15 features advanced camera',
          metadata: {
            sourceType: 'product_catalog',
            category: 'electronics',
            confidence: 0.9,
            sku: 'IP15-001'
          }
        }
      ];
      const contextData = { type: 'product', confidence: 0.9 };
      const businessContext = { returnPolicy: '30 days', warranty: '2 years' };

      const enhancedPrompt = await promptEngineer.enhancePromptWithContext(
        basePrompt,
        query,
        sources,
        contextData,
        businessContext
      );

      expect(enhancedPrompt).toContain('PRODUCT INFORMATION');
      expect(enhancedPrompt).toContain('iPhone 15');
      expect(enhancedPrompt).toContain('IP15-001');
      expect(enhancedPrompt).toContain('30 days');
      expect(enhancedPrompt.length).toBeGreaterThan(basePrompt.length);
    });

    it('should enhance prompt with support context', async () => {
      const basePrompt = 'You are a helpful assistant.';
      const query = 'How do I return an item?';
      const sources = [
        {
          text: 'Return policy allows 30 days for returns',
          metadata: {
            sourceType: 'policy_doc',
            category: 'returns',
            confidence: 0.95
          }
        }
      ];
      const contextData = { type: 'support', confidence: 0.9 };
      const businessContext = { supportHours: '9AM-5PM', escalationEnabled: true };

      const enhancedPrompt = await promptEngineer.enhancePromptWithContext(
        basePrompt,
        query,
        sources,
        contextData,
        businessContext
      );

      expect(enhancedPrompt).toContain('SUPPORT CONTEXT');
      expect(enhancedPrompt).toContain('Return policy');
      expect(enhancedPrompt).toContain('9AM-5PM');
      expect(enhancedPrompt).toContain('escalation');
    });

    it('should handle empty sources gracefully', async () => {
      const basePrompt = 'You are a helpful assistant.';
      const query = 'General question';
      const sources = [];
      const contextData = { type: 'general', confidence: 0.5 };

      const enhancedPrompt = await promptEngineer.enhancePromptWithContext(
        basePrompt,
        query,
        sources,
        contextData
      );

      expect(enhancedPrompt).toContain(basePrompt);
      expect(enhancedPrompt).toContain('No specific sources available');
    });
  });

  describe('buildSourceAttribution', () => {
    it('should build proper source attribution for multiple sources', () => {
      const sources = [
        {
          text: 'Product information',
          metadata: {
            sourceType: 'product_catalog',
            filename: 'products.csv',
            confidence: 0.9,
            docTitle: 'Product Catalog'
          }
        },
        {
          text: 'Policy information',
          metadata: {
            sourceType: 'policy_doc',
            filename: 'returns.pdf',
            confidence: 0.85,
            docTitle: 'Return Policy'
          }
        }
      ];

      const attribution = promptEngineer.buildSourceAttribution(sources);

      expect(attribution).toContain('SOURCES:');
      expect(attribution).toContain('[1] Product Catalog');
      expect(attribution).toContain('[2] Return Policy');
      expect(attribution).toContain('product_catalog');
      expect(attribution).toContain('policy_doc');
    });

    it('should handle sources with missing metadata', () => {
      const sources = [
        {
          text: 'Some content',
          metadata: {
            sourceType: 'unknown'
          }
        }
      ];

      const attribution = promptEngineer.buildSourceAttribution(sources);

      expect(attribution).toContain('SOURCES:');
      expect(attribution).toContain('[1] Unknown Document');
    });

    it('should return empty string for no sources', () => {
      const attribution = promptEngineer.buildSourceAttribution([]);
      expect(attribution).toBe('');
    });
  });

  describe('injectBusinessContext', () => {
    it('should inject business rules into prompts', () => {
      const basePrompt = 'Answer the question.';
      const businessContext = {
        returnPolicy: '30 days',
        freeShipping: 'over $50',
        supportHours: '9AM-5PM EST',
        companyName: 'Test Company'
      };

      const enhancedPrompt = promptEngineer.injectBusinessContext(basePrompt, businessContext);

      expect(enhancedPrompt).toContain('BUSINESS CONTEXT:');
      expect(enhancedPrompt).toContain('30 days');
      expect(enhancedPrompt).toContain('over $50');
      expect(enhancedPrompt).toContain('9AM-5PM EST');
      expect(enhancedPrompt).toContain('Test Company');
    });

    it('should handle empty business context', () => {
      const basePrompt = 'Answer the question.';
      const enhancedPrompt = promptEngineer.injectBusinessContext(basePrompt, {});

      expect(enhancedPrompt).toBe(basePrompt);
    });

    it('should handle null business context', () => {
      const basePrompt = 'Answer the question.';
      const enhancedPrompt = promptEngineer.injectBusinessContext(basePrompt, null);

      expect(enhancedPrompt).toBe(basePrompt);
    });
  });

  describe('formatConfidenceGuidance', () => {
    it('should format high confidence guidance', () => {
      const sources = [
        { metadata: { confidence: 0.95 } },
        { metadata: { confidence: 0.90 } }
      ];

      const guidance = promptEngineer.formatConfidenceGuidance(sources);

      expect(guidance).toContain('HIGH CONFIDENCE');
      expect(guidance).toContain('authorative');
      expect(guidance).toContain('cite sources');
    });

    it('should format medium confidence guidance', () => {
      const sources = [
        { metadata: { confidence: 0.75 } },
        { metadata: { confidence: 0.65 } }
      ];

      const guidance = promptEngineer.formatConfidenceGuidance(sources);

      expect(guidance).toContain('MODERATE CONFIDENCE');
      expect(guidance).toContain('likely accurate');
      expect(guidance).toContain('indicate uncertainty');
    });

    it('should format low confidence guidance', () => {
      const sources = [
        { metadata: { confidence: 0.45 } },
        { metadata: { confidence: 0.35 } }
      ];

      const guidance = promptEngineer.formatConfidenceGuidance(sources);

      expect(guidance).toContain('LOW CONFIDENCE');
      expect(guidance).toContain('Limited or uncertain');
      expect(guidance).toContain('suggest escalation');
    });

    it('should handle sources without confidence scores', () => {
      const sources = [
        { metadata: {} },
        { metadata: { confidence: undefined } }
      ];

      const guidance = promptEngineer.formatConfidenceGuidance(sources);

      expect(guidance).toContain('MODERATE CONFIDENCE');
    });
  });

  describe('processQueryForEnhancements', () => {
    it('should process complete query enhancement flow', async () => {
      const query = 'What is the return policy for iPhone 15?';
      const sources = [
        {
          text: 'iPhone 15 can be returned within 30 days',
          metadata: {
            sourceType: 'policy_doc',
            confidence: 0.9,
            docTitle: 'Return Policy'
          }
        }
      ];
      const businessContext = {
        returnPolicy: '30 days',
        supportEmail: 'support@test.com'
      };
      const userContext = { userId: 123 };

      const result = await promptEngineer.processQueryForEnhancements(
        query,
        sources,
        businessContext,
        userContext
      );

      expect(result).toHaveProperty('contextType');
      expect(result).toHaveProperty('enhancedPrompt');
      expect(result).toHaveProperty('sourceAttribution');
      expect(result).toHaveProperty('confidenceLevel');
      expect(result).toHaveProperty('businessRules');

      expect(result.contextType).toBe('support');
      expect(result.enhancedPrompt).toContain('SUPPORT CONTEXT');
      expect(result.confidenceLevel).toBe('high');
    });

    it('should handle processing with minimal input', async () => {
      const query = 'Hello';
      const sources = [];

      const result = await promptEngineer.processQueryForEnhancements(query, sources);

      expect(result.contextType).toBe('general');
      expect(result.confidenceLevel).toBe('medium');
      expect(result.sourceAttribution).toBe('');
    });
  });

  describe('performance requirements', () => {
    it('should process queries within 500ms', async () => {
      const query = 'Complex product query with multiple terms and requirements';
      const sources = Array(20).fill(null).map((_, i) => ({
        text: `Source content ${i}`,
        metadata: {
          sourceType: 'product_catalog',
          confidence: 0.8,
          docTitle: `Document ${i}`
        }
      }));

      const startTime = Date.now();
      await promptEngineer.processQueryForEnhancements(query, sources);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(500);
    });
  });
});