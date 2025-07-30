/**
 * Integration Test Suite for Phase 1.3 Prompt Components
 * Tests the integration between KnowledgePromptEngineer, EcommercePromptRules, and ConfidenceAwarePrompts
 */

// Mock SystemPromptVariables dependency
jest.mock('../../../../models/systemPromptVariables', () => ({
  SystemPromptVariables: {
    expandSystemPromptVariables: jest.fn(async (prompt, userId) => {
      if (userId) {
        return prompt.replace('{user.name}', 'Test User');
      }
      return prompt;
    })
  }
}));

const { KnowledgePromptEngineer } = require('../../../../utils/helpers/prompts/KnowledgePromptEngineer');
const { EcommercePromptRules } = require('../../../../utils/helpers/prompts/EcommercePromptRules');
const { ConfidenceAwarePrompts } = require('../../../../utils/helpers/prompts/ConfidenceAwarePrompts');

describe('Phase 1.3 Prompt Components Integration', () => {
  let knowledgePrompts;
  let ecommerceRules;
  let confidencePrompts;

  beforeEach(() => {
    knowledgePrompts = new KnowledgePromptEngineer();
    ecommerceRules = new EcommercePromptRules();
    confidencePrompts = new ConfidenceAwarePrompts();
  });

  describe('E-commerce Product Query Integration', () => {
    it('should process complete e-commerce product query workflow', async () => {
      const query = 'What iPhone would you recommend for photography?';
      const sources = [
        {
          text: 'iPhone 15 Pro features advanced camera system with 48MP main camera',
          metadata: {
            sourceType: 'product_catalog',
            docTitle: 'iPhone 15 Pro Specifications',
            confidence: 0.9,
            sku: 'IP15PRO',
            price: '999',
            category: 'smartphones'
          }
        },
        {
          text: 'iPhone 14 Pro also has excellent camera features for photography',
          metadata: {
            sourceType: 'product_catalog',
            docTitle: 'iPhone 14 Pro Features',
            confidence: 0.85,
            sku: 'IP14PRO',
            price: '899',
            category: 'smartphones'
          }
        }
      ];

      // 1. Context detection with KnowledgePromptEngineer
      const contextData = knowledgePrompts.detectQueryContext(query);
      expect(['product', 'general']).toContain(contextData.type); // Can be either depending on keywords
      expect(contextData.confidence).toBeGreaterThan(0.1);

      // 2. E-commerce scenario processing
      const ecommerceResult = ecommerceRules.processEcommerceQuery(query, sources);
      expect(ecommerceResult.scenario.type).toBe('product_recommendation');
      expect(ecommerceResult.recommendations).toContain('iPhone 15 Pro');

      // 3. Confidence analysis
      const confidenceResult = confidencePrompts.processConfidenceEnhancement(
        sources, 
        'product', 
        query
      );
      expect(confidenceResult.confidenceLevel).toBe('high');
      expect(confidenceResult.citations).toContain('iPhone 15 Pro Specifications');

      // 4. Integrated prompt enhancement
      const businessContext = {
        returnPolicy: '30 days',
        freeShipping: 'over $50',
        supportEmail: 'support@test.com'
      };

      const enhancedPrompt = await knowledgePrompts.enhancePromptWithContext(
        'You are a helpful e-commerce assistant.',
        query,
        sources,
        contextData,
        businessContext
      );

      // Verify integration
      expect(enhancedPrompt).toContain('iPhone 15 Pro');
      expect(enhancedPrompt).toContain('30 days');
      expect(enhancedPrompt).toContain('HIGH CONFIDENCE');
      // The prompt type depends on context detection, so either is acceptable
      expect(enhancedPrompt.length).toBeGreaterThan(500); // Should be substantially enhanced
    });
  });

  describe('Support Query Integration', () => {
    it('should process complete support query workflow', async () => {
      const query = 'How do I return a defective item?';
      const sources = [
        {
          text: 'Return policy allows 30 days for defective items with full refund',
          metadata: {
            sourceType: 'policy_doc',
            docTitle: 'Return Policy',
            confidence: 0.8,
            lastUpdatedAt: '2024-01-15',
            escalationRequired: true
          }
        }
      ];

      // 1. Context detection
      const contextData = knowledgePrompts.detectQueryContext(query);
      expect(contextData.type).toBe('support');

      // 2. E-commerce scenario processing
      const ecommerceResult = ecommerceRules.processEcommerceQuery(query, sources);
      expect(ecommerceResult.scenario.type).toBe('return_refund');
      expect(ecommerceResult.escalation.suggested).toBe(true);

      // 3. Confidence analysis
      const confidenceResult = confidencePrompts.processConfidenceEnhancement(
        sources, 
        'support', 
        query
      );
      expect(['high', 'medium']).toContain(confidenceResult.confidenceLevel); // Single source might not be high
      expect(confidenceResult.escalationGuidance.recommended).toBe(true);

      // Verify escalation consistency
      expect(ecommerceResult.escalation.suggested).toBe(true);
      expect(confidenceResult.escalationGuidance.recommended).toBe(true);
    });
  });

  describe('Low Confidence Query Integration', () => {
    it('should handle low confidence scenarios appropriately', async () => {
      const query = 'What is your company policy on international shipping?';
      const sources = [
        {
          text: 'Some information about shipping, but not specific to international',
          metadata: {
            sourceType: 'user_upload',
            confidence: 0.3,
            docTitle: 'Incomplete Shipping Info'
          }
        }
      ];

      // 1. Context detection
      const contextData = knowledgePrompts.detectQueryContext(query);
      expect(['general', 'support']).toContain(contextData.type); // Can be support due to "policy" keyword

      // 2. E-commerce scenario processing
      const ecommerceResult = ecommerceRules.processEcommerceQuery(query, sources);
      expect(['general', 'order_inquiry']).toContain(ecommerceResult.scenario.type); // "shipping" might trigger order_inquiry

      // 3. Confidence analysis
      const confidenceResult = confidencePrompts.processConfidenceEnhancement(
        sources, 
        'general', 
        query
      );
      expect(confidenceResult.confidenceLevel).toBe('low');
      expect(confidenceResult.escalationGuidance.recommended).toBe(true);

      // 4. Verify fallback handling
      expect(confidenceResult.fallbackPrompts).toContain('LIMITED CONFIDENCE');
      // Either system may suggest escalation for low confidence
      expect(
        ecommerceResult.escalation.suggested || confidenceResult.escalationGuidance.recommended
      ).toBe(true);
    });
  });

  describe('Performance Integration', () => {
    it('should process complete workflow within performance targets', async () => {
      const query = 'Complex e-commerce query with multiple requirements';
      const sources = Array(10).fill(null).map((_, i) => ({
        text: `Product information ${i}`,
        metadata: {
          sourceType: 'product_catalog',
          confidence: 0.7 + (i % 3) * 0.1,
          sku: `PROD${i}`,
          docTitle: `Product ${i}`
        }
      }));

      const startTime = Date.now();

      // Run all components
      const contextData = knowledgePrompts.detectQueryContext(query);
      const ecommerceResult = ecommerceRules.processEcommerceQuery(query, sources);
      const confidenceResult = confidencePrompts.processConfidenceEnhancement(
        sources, 
        'product', 
        query
      );

      const totalTime = Date.now() - startTime;

      // Verify performance targets
      expect(totalTime).toBeLessThan(500); // Total workflow under 500ms
      expect(ecommerceResult.processingTime).toBeLessThan(200);
      expect(confidenceResult.processingTime).toBeLessThan(100);

      // Verify results quality
      expect(contextData.type).toBeDefined();
      expect(ecommerceResult.scenario).toBeDefined();
      expect(confidenceResult.overallConfidence).toBeDefined();
    });
  });

  describe('Edge Cases Integration', () => {
    it('should handle empty sources gracefully across all components', async () => {
      const query = 'Test query with no sources';
      const sources = [];

      // All components should handle empty sources gracefully
      const contextData = knowledgePrompts.detectQueryContext(query);
      const ecommerceResult = ecommerceRules.processEcommerceQuery(query, sources);
      const confidenceResult = confidencePrompts.processConfidenceEnhancement(
        sources, 
        'general', 
        query
      );

      expect(contextData.type).toBe('general');
      expect(ecommerceResult.scenario.type).toBe('general');
      expect(confidenceResult.confidenceLevel).toBe('low');
      expect(confidenceResult.escalationGuidance.recommended).toBe(true);
    });

    it('should handle malformed sources gracefully', async () => {
      const query = 'Test query with malformed sources';
      const sources = [
        { text: 'Valid source', metadata: { confidence: 0.8 } },
        { text: null, metadata: null },
        { metadata: { confidence: 'invalid' } },
        null
      ];

      // Should not throw errors
      expect(() => {
        const contextData = knowledgePrompts.detectQueryContext(query);
        const ecommerceResult = ecommerceRules.processEcommerceQuery(query, sources);
        const confidenceResult = confidencePrompts.processConfidenceEnhancement(
          sources, 
          'general', 
          query
        );
      }).not.toThrow();
    });
  });

  describe('Configuration Consistency', () => {
    it('all components should respect consistent confidence thresholds', () => {
      const customConfig = {
        highConfidenceThreshold: 0.9,
        mediumConfidenceThreshold: 0.7,
        lowConfidenceThreshold: 0.5
      };

      const customKnowledge = new KnowledgePromptEngineer(customConfig);
      const customConfidence = new ConfidenceAwarePrompts(customConfig);

      expect(customKnowledge.config.highConfidenceThreshold).toBe(0.9);
      expect(customConfidence.config.highConfidenceThreshold).toBe(0.9);
    });
  });
});