/**
 * Test Suite for EcommercePromptRules
 * Phase 1.3: E-commerce Business Logic Prompts
 */

const { EcommercePromptRules } = require('../../../../utils/helpers/prompts/EcommercePromptRules');

describe('EcommercePromptRules', () => {
  let ecommerceRules;

  beforeEach(() => {
    ecommerceRules = new EcommercePromptRules();
  });

  describe('constructor', () => {
    it('should initialize with default configuration', () => {
      expect(ecommerceRules).toBeInstanceOf(EcommercePromptRules);
      expect(ecommerceRules.businessRules).toBeDefined();
      expect(ecommerceRules.responseTemplates).toBeDefined();
      expect(ecommerceRules.config).toBeDefined();
    });

    it('should accept custom business rules', () => {
      const customRules = {
        returnPeriod: 60,
        freeShippingThreshold: 100,
        escalationTriggers: ['refund', 'complaint']
      };
      const customRulesEngine = new EcommercePromptRules({ businessRules: customRules });
      expect(customRulesEngine.businessRules.returnPeriod).toBe(60);
      expect(customRulesEngine.businessRules.freeShippingThreshold).toBe(100);
    });
  });

  describe('detectQueryScenario', () => {
    it('should detect product recommendation scenarios', () => {
      const queries = [
        'What phone would you recommend?',
        'I need a laptop for gaming',
        'Can you suggest similar products?',
        'Which laptop is best for me?'
      ];

      queries.forEach(query => {
        const scenario = ecommerceRules.detectQueryScenario(query, []);
        expect(scenario.type).toBe('product_recommendation');
        expect(scenario.confidence).toBeGreaterThanOrEqual(0.33);
      });
    });

    it('should detect order inquiry scenarios', () => {
      const queries = [
        'Where is my order?',
        'What is the status of order #12345?',
        'When will my package arrive?',
        'Track my shipment'
      ];

      queries.forEach(query => {
        const scenario = ecommerceRules.detectQueryScenario(query, []);
        expect(scenario.type).toBe('order_inquiry');
        expect(scenario.confidence).toBeGreaterThanOrEqual(0.33);
      });
    });

    it('should detect return/refund scenarios', () => {
      const queries = [
        'How do I return this item?',
        'I want a refund',
        'Return policy information',
        'Exchange this product'
      ];

      queries.forEach(query => {
        const scenario = ecommerceRules.detectQueryScenario(query, []);
        expect(scenario.type).toBe('return_refund');
        expect(scenario.confidence).toBeGreaterThan(0.5);
      });
    });

    it('should detect pricing scenarios', () => {
      const queries = [
        'How much does this cost?',
        'What is the price?',
        'Is there a discount available?',
        'Check if this item is available'
      ];

      queries.forEach(query => {
        const scenario = ecommerceRules.detectQueryScenario(query, []);
        expect(scenario.type).toBe('pricing_availability');
        expect(scenario.confidence).toBeGreaterThanOrEqual(0.33);
      });
    });

    it('should handle general queries', () => {
      const queries = [
        'Tell me about your company',
        'What are your business hours?',
        'Contact information'
      ];

      queries.forEach(query => {
        const scenario = ecommerceRules.detectQueryScenario(query, []);
        expect(scenario.type).toBe('general');
      });
    });
  });

  describe('applyBusinessRules', () => {
    it('should apply return period rules', () => {
      const scenario = { type: 'return_refund', confidence: 0.8 };
      const sources = [{
        text: 'Return policy allows returns',
        metadata: { sourceType: 'policy_doc' }
      }];

      const rules = ecommerceRules.applyBusinessRules(scenario, sources);

      expect(rules).toContain('Return Period: 30 days');
      expect(rules).toContain('Return Conditions');
    });

    it('should apply shipping rules', () => {
      const scenario = { type: 'order_inquiry', confidence: 0.8 };
      const sources = [];

      const rules = ecommerceRules.applyBusinessRules(scenario, sources);

      expect(rules).toContain('Free shipping on orders over $50');
      expect(rules).toContain('shipping timeframes');
    });

    it('should apply pricing rules', () => {
      const scenario = { type: 'pricing_availability', confidence: 0.8 };
      const sources = [{
        text: 'Product pricing information',
        metadata: { sourceType: 'product_catalog', price: '99.99' }
      }];

      const rules = ecommerceRules.applyBusinessRules(scenario, sources);

      expect(rules).toContain('pricing information');
      expect(rules).toContain('current promotions');
    });

    it('should handle scenarios requiring escalation', () => {
      const scenario = { type: 'return_refund', confidence: 0.9 };
      const sources = [];

      const rules = ecommerceRules.applyBusinessRules(scenario, sources);

      expect(rules).toContain('escalation');
    });
  });

  describe('generateRecommendationPrompts', () => {
    it('should generate product recommendation prompts', () => {
      const sources = [
        {
          text: 'iPhone 15 Pro - Latest flagship',
          metadata: { 
            sourceType: 'product_catalog',
            category: 'smartphones',
            price: '999',
            sku: 'IP15PRO'
          }
        },
        {
          text: 'Samsung Galaxy S24 - Android alternative',
          metadata: { 
            sourceType: 'product_catalog',
            category: 'smartphones',
            price: '899',
            sku: 'SGS24'
          }
        }
      ];

      const prompt = ecommerceRules.generateRecommendationPrompts(sources);

      expect(prompt).toContain('PRODUCT RECOMMENDATIONS');
      expect(prompt).toContain('iPhone 15 Pro');
      expect(prompt).toContain('Samsung Galaxy S24');
      expect(prompt).toContain('Compare features');
      expect(prompt).toContain('price comparison');
    });

    it('should handle cross-selling scenarios', () => {
      const sources = [
        {
          text: 'MacBook Pro laptop',
          metadata: { 
            sourceType: 'product_catalog',
            category: 'laptops',
            sku: 'MBP16'
          }
        }
      ];

      const prompt = ecommerceRules.generateRecommendationPrompts(sources, 'cross_sell');

      expect(prompt).toContain('COMPLEMENTARY PRODUCTS');
      expect(prompt).toContain('accessories');
      expect(prompt).toContain('bundle');
    });

    it('should return empty string for no sources', () => {
      const prompt = ecommerceRules.generateRecommendationPrompts([]);
      expect(prompt).toBe('');
    });
  });

  describe('buildEscalationTriggers', () => {
    it('should detect escalation needs in queries', () => {
      const escalationQueries = [
        'I am very angry about this',
        'This is completely unacceptable',
        'I want to speak to a manager',
        'I need immediate help',
        'Cancel my order right now'
      ];

      escalationQueries.forEach(query => {
        const needsEscalation = ecommerceRules.buildEscalationTriggers(query, []);
        expect(needsEscalation.required).toBe(true);
        expect(needsEscalation.reason).toBeDefined();
      });
    });

    it('should detect escalation from context', () => {
      const sources = [{
        text: 'Complex technical issue requiring specialist',
        metadata: { 
          sourceType: 'support_doc',
          escalationRequired: true
        }
      }];

      const escalation = ecommerceRules.buildEscalationTriggers('Technical question', sources);
      expect(escalation.suggested).toBe(true);
    });

    it('should not trigger escalation for normal queries', () => {
      const normalQuery = 'What is the price of this product?';
      const escalation = ecommerceRules.buildEscalationTriggers(normalQuery, []);
      
      expect(escalation.required).toBe(false);
      expect(escalation.suggested).toBe(false);
    });
  });

  describe('formatPolicyInformation', () => {
    it('should format return policy information', () => {
      const sources = [{
        text: 'Items can be returned within 30 days of purchase',
        metadata: { 
          sourceType: 'policy_doc',
          policyType: 'returns'
        }
      }];

      const formatted = ecommerceRules.formatPolicyInformation(sources, 'return_refund');

      expect(formatted).toContain('RETURN POLICY');
      expect(formatted).toContain('30 days');
      expect(formatted).toContain('conditions');
    });

    it('should format shipping policy information', () => {
      const sources = [{
        text: 'Free shipping on orders over $50, standard delivery 3-5 days',
        metadata: { 
          sourceType: 'policy_doc',
          policyType: 'shipping'
        }
      }];

      const formatted = ecommerceRules.formatPolicyInformation(sources, 'order_inquiry');

      expect(formatted).toContain('SHIPPING INFORMATION');
      expect(formatted).toContain('Free shipping');
      expect(formatted).toContain('3-5 days');
    });

    it('should handle missing policy information', () => {
      const formatted = ecommerceRules.formatPolicyInformation([], 'return_refund');
      expect(formatted).toContain('contact customer service');
    });
  });

  describe('generateUpsellPrompts', () => {
    it('should generate upsell prompts for product queries', () => {
      const sources = [{
        text: 'Basic model iPhone 14',
        metadata: { 
          sourceType: 'product_catalog',
          category: 'smartphones',
          tier: 'basic',
          sku: 'IP14',
          price: '799'
        }
      }];

      const upsellPrompt = ecommerceRules.generateUpsellPrompts(sources);

      expect(upsellPrompt).toContain('PREMIUM OPTIONS');
      expect(upsellPrompt).toContain('consider upgrading');
      expect(upsellPrompt).toContain('additional features');
    });

    it('should suggest warranty and protection plans', () => {
      const sources = [{
        text: 'Expensive electronic device',
        metadata: { 
          sourceType: 'product_catalog',
          category: 'electronics',
          price: '999',
          warrantyAvailable: true
        }
      }];

      const upsellPrompt = ecommerceRules.generateUpsellPrompts(sources);

      expect(upsellPrompt).toContain('warranty');
      expect(upsellPrompt).toContain('protection');
    });

    it('should return empty string when no upsell opportunities', () => {
      const sources = [{
        text: 'Simple accessory',
        metadata: { 
          sourceType: 'product_catalog',
          category: 'accessories',
          price: '5'
        }
      }];

      const upsellPrompt = ecommerceRules.generateUpsellPrompts(sources);
      expect(upsellPrompt).toBe('');
    });
  });

  describe('processEcommerceQuery', () => {
    it('should process complete e-commerce query workflow', () => {
      const query = 'I need a good laptop for programming';
      const sources = [{
        text: 'MacBook Pro with powerful processor',
        metadata: { 
          sourceType: 'product_catalog',
          category: 'laptops',
          price: '1999',
          sku: 'MBP16PRO'
        }
      }];

      const result = ecommerceRules.processEcommerceQuery(query, sources);

      expect(result).toHaveProperty('scenario');
      expect(result).toHaveProperty('businessRules');
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('escalation');
      expect(result).toHaveProperty('policyInfo');
      expect(result).toHaveProperty('upsellOpportunities');

      expect(result.scenario.type).toBe('product_recommendation');
      expect(result.recommendations).toContain('MacBook Pro');
    });

    it('should handle order status queries', () => {
      const query = 'Where is my order #12345?';
      const sources = [];

      const result = ecommerceRules.processEcommerceQuery(query, sources);

      expect(result.scenario.type).toBe('order_inquiry');
      expect(result.businessRules).toContain('shipping');
      expect(result.escalation.suggested).toBe(true); // No order info available
    });
  });

  describe('performance requirements', () => {
    it('should process e-commerce rules within reasonable time', () => {
      const query = 'Complex product inquiry with multiple requirements and constraints';
      const sources = Array(15).fill(null).map((_, i) => ({
        text: `Product ${i} information with detailed specifications`,
        metadata: {
          sourceType: 'product_catalog',
          category: 'electronics',
          price: (100 + i * 50).toString(),
          sku: `PROD${i}`
        }
      }));

      const startTime = Date.now();
      ecommerceRules.processEcommerceQuery(query, sources);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(200); // Should be fast
    });
  });
});