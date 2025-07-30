/**
 * Test Suite for ConfidenceAwarePrompts
 * Phase 1.3: Source Confidence and Attribution Prompts
 */

const { ConfidenceAwarePrompts } = require('../../../../utils/helpers/prompts/ConfidenceAwarePrompts');

describe('ConfidenceAwarePrompts', () => {
  let confidencePrompts;

  beforeEach(() => {
    confidencePrompts = new ConfidenceAwarePrompts();
  });

  describe('constructor', () => {
    it('should initialize with default configuration', () => {
      expect(confidencePrompts).toBeInstanceOf(ConfidenceAwarePrompts);
      expect(confidencePrompts.config).toBeDefined();
      expect(confidencePrompts.confidenceThresholds).toBeDefined();
    });

    it('should accept custom thresholds', () => {
      const customConfig = {
        highConfidenceThreshold: 0.9,
        lowConfidenceThreshold: 0.4
      };
      const customPrompts = new ConfidenceAwarePrompts(customConfig);
      expect(customPrompts.config.highConfidenceThreshold).toBe(0.9);
      expect(customPrompts.config.lowConfidenceThreshold).toBe(0.4);
    });
  });

  describe('calculateOverallConfidence', () => {
    it('should calculate confidence from multiple sources', () => {
      const sources = [
        { metadata: { confidence: 0.9 } },
        { metadata: { confidence: 0.8 } },
        { metadata: { confidence: 0.7 } }
      ];

      const confidence = confidencePrompts.calculateOverallConfidence(sources);
      expect(confidence).toBeCloseTo(0.8, 2);
    });

    it('should handle sources without confidence scores', () => {
      const sources = [
        { metadata: {} },
        { metadata: { confidence: 0.8 } },
        { metadata: { confidence: undefined } }
      ];

      const confidence = confidencePrompts.calculateOverallConfidence(sources);
      expect(confidence).toBeGreaterThan(0.5);
    });

    it('should return default confidence for empty sources', () => {
      const confidence = confidencePrompts.calculateOverallConfidence([]);
      expect(confidence).toBe(0.5);
    });
  });

  describe('categorizeConfidenceLevel', () => {
    it('should categorize high confidence correctly', () => {
      const level = confidencePrompts.categorizeConfidenceLevel(0.9);
      expect(level).toBe('high');
    });

    it('should categorize medium confidence correctly', () => {
      const level = confidencePrompts.categorizeConfidenceLevel(0.7);
      expect(level).toBe('medium');
    });

    it('should categorize low confidence correctly', () => {
      const level = confidencePrompts.categorizeConfidenceLevel(0.4);
      expect(level).toBe('low');
    });

    it('should handle edge cases', () => {
      expect(confidencePrompts.categorizeConfidenceLevel(0.85)).toBe('high');
      expect(confidencePrompts.categorizeConfidenceLevel(0.6)).toBe('medium');
    });
  });

  describe('generateSourceCitations', () => {
    it('should generate proper citations for multiple sources', () => {
      const sources = [
        {
          text: 'Product information',
          metadata: {
            docTitle: 'Product Catalog',
            sourceType: 'product_catalog',
            confidence: 0.9,
            filename: 'products.csv'
          }
        },
        {
          text: 'Policy information',
          metadata: {
            docTitle: 'Return Policy',
            sourceType: 'policy_doc',
            confidence: 0.85,
            lastUpdatedAt: '2024-01-15'
          }
        }
      ];

      const citations = confidencePrompts.generateSourceCitations(sources);

      expect(citations).toContain('SOURCES:');
      expect(citations).toContain('[1] Product Catalog');
      expect(citations).toContain('[2] Return Policy');
      expect(citations).toContain('confidence: 90%');
      expect(citations).toContain('confidence: 85%');
      expect(citations).toContain('product_catalog');
      expect(citations).toContain('policy_doc');
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

      const citations = confidencePrompts.generateSourceCitations(sources);

      expect(citations).toContain('SOURCES:');
      expect(citations).toContain('[1] Unknown Document');
      expect(citations).toContain('unknown');
    });

    it('should return empty string for no sources', () => {
      const citations = confidencePrompts.generateSourceCitations([]);
      expect(citations).toBe('');
    });
  });

  describe('buildUncertaintyLanguage', () => {
    it('should build appropriate uncertainty language for low confidence', () => {
      const language = confidencePrompts.buildUncertaintyLanguage('low', []);

      expect(language).toContain('uncertainty');
      expect(language).toContain('limited information');
      expect(language).toContain('may not be complete');
      expect(language).toMatch(/\b(might|may|could|possibly)\b/i);
    });

    it('should build appropriate uncertainty language for medium confidence', () => {
      const language = confidencePrompts.buildUncertaintyLanguage('medium', []);

      expect(language).toContain('Moderate confidence');
      expect(language).toContain('should be accurate');
      expect(language).toMatch(/\b(appears)\b/i);
    });

    it('should provide confident language for high confidence', () => {
      const language = confidencePrompts.buildUncertaintyLanguage('high', []);

      expect(language).toContain('High confidence');
      expect(language).toContain('reliable sources');
      expect(language).toContain('authoritative');
    });

    it('should include source diversity information', () => {
      const sources = [
        { metadata: { sourceType: 'product_catalog' } },
        { metadata: { sourceType: 'policy_doc' } },
        { metadata: { sourceType: 'faq' } }
      ];

      const language = confidencePrompts.buildUncertaintyLanguage('medium', sources);

      expect(language).toContain('Multiple sources');
      expect(language).toContain('3 different');
    });
  });

  describe('generateEscalationPrompts', () => {
    it('should generate escalation prompts for low confidence scenarios', () => {
      const sources = [
        { metadata: { confidence: 0.3 } },
        { metadata: { confidence: 0.4 } }
      ];

      const escalation = confidencePrompts.generateEscalationPrompts(sources, 'general');

      expect(escalation.recommended).toBe(true);
      expect(escalation.reason).toContain('low confidence');
      expect(escalation.prompt).toContain('human support');
      expect(escalation.urgency).toBe('medium');
    });

    it('should recommend escalation for complex scenarios', () => {
      const sources = [
        {
          text: 'Complex technical issue',
          metadata: {
            confidence: 0.7,
            escalationRequired: true,
            sourceType: 'technical_doc'
          }
        }
      ];

      const escalation = confidencePrompts.generateEscalationPrompts(sources, 'support');

      expect(escalation.recommended).toBe(true);
      expect(escalation.reason).toContain('complex');
    });

    it('should not recommend escalation for high confidence scenarios', () => {
      const sources = [
        { metadata: { confidence: 0.9 } },
        { metadata: { confidence: 0.95 } }
      ];

      const escalation = confidencePrompts.generateEscalationPrompts(sources, 'general');

      expect(escalation.recommended).toBe(false);
      expect(escalation.reason).toContain('high confidence');
    });
  });

  describe('buildConfidenceFraming', () => {
    it('should frame high confidence responses properly', () => {
      const sources = [
        { metadata: { confidence: 0.9 } },
        { metadata: { confidence: 0.85 } }
      ];

      const framing = confidencePrompts.buildConfidenceFraming(sources, 'product');

      expect(framing).toContain('RESPONSE CONFIDENCE: High');
      expect(framing).toContain('authoritative');
      expect(framing).toContain('Cite sources clearly');
      expect(framing).toContain('confident');
    });

    it('should frame medium confidence responses properly', () => {
      const sources = [
        { metadata: { confidence: 0.7 } },
        { metadata: { confidence: 0.65 } }
      ];

      const framing = confidencePrompts.buildConfidenceFraming(sources, 'support');

      expect(framing).toContain('RESPONSE CONFIDENCE: Medium');
      expect(framing).toContain('likely accurate');
      expect(framing).toContain('Indicate uncertainty');
    });

    it('should frame low confidence responses properly', () => {
      const sources = [
        { metadata: { confidence: 0.4 } },
        { metadata: { confidence: 0.3 } }
      ];

      const framing = confidencePrompts.buildConfidenceFraming(sources, 'general');

      expect(framing).toContain('RESPONSE CONFIDENCE: Low');
      expect(framing).toContain('limited information');
      expect(framing).toContain('Acknowledge limitations');
      expect(framing).toContain('escalation');
    });
  });

  describe('assessSourceDiversity', () => {
    it('should assess high source diversity', () => {
      const sources = [
        { metadata: { sourceType: 'product_catalog' } },
        { metadata: { sourceType: 'policy_doc' } },
        { metadata: { sourceType: 'faq' } },
        { metadata: { sourceType: 'user_manual' } }
      ];

      const diversity = confidencePrompts.assessSourceDiversity(sources);

      expect(diversity.level).toBe('high');
      expect(diversity.uniqueTypes).toBe(4);
      expect(diversity.totalSources).toBe(4);
    });

    it('should assess medium source diversity', () => {
      const sources = [
        { metadata: { sourceType: 'product_catalog' } },
        { metadata: { sourceType: 'product_catalog' } },
        { metadata: { sourceType: 'policy_doc' } }
      ];

      const diversity = confidencePrompts.assessSourceDiversity(sources);

      expect(diversity.level).toBe('medium');
      expect(diversity.uniqueTypes).toBe(2);
      expect(diversity.totalSources).toBe(3);
    });

    it('should assess low source diversity', () => {
      const sources = [
        { metadata: { sourceType: 'product_catalog' } },
        { metadata: { sourceType: 'product_catalog' } },
        { metadata: { sourceType: 'product_catalog' } }
      ];

      const diversity = confidencePrompts.assessSourceDiversity(sources);

      expect(diversity.level).toBe('low');
      expect(diversity.uniqueTypes).toBe(1);
      expect(diversity.totalSources).toBe(3);
    });
  });

  describe('generateFallbackPrompts', () => {
    it('should generate fallback prompts for insufficient information', () => {
      const fallback = confidencePrompts.generateFallbackPrompts([], 'product');

      expect(fallback).toContain('INSUFFICIENT INFORMATION');
      expect(fallback).toContain('No relevant sources');
      expect(fallback).toContain('Suggest alternative');
      expect(fallback).toContain('Include contact information');
    });

    it('should generate fallback prompts for low confidence', () => {
      const sources = [{ metadata: { confidence: 0.2 } }];
      const fallback = confidencePrompts.generateFallbackPrompts(sources, 'support');

      expect(fallback).toContain('LIMITED CONFIDENCE');
      expect(fallback).toContain('Acknowledge uncertainty');
      expect(fallback).toContain('available information');
    });

    it('should include context-specific fallback guidance', () => {
      const fallback = confidencePrompts.generateFallbackPrompts([], 'product');

      expect(fallback).toContain('product context');
    });
  });

  describe('processConfidenceEnhancement', () => {
    it('should process complete confidence enhancement workflow', () => {
      const sources = [
        {
          text: 'High quality content',
          metadata: {
            confidence: 0.9,
            docTitle: 'Official Documentation',
            sourceType: 'official_docs'
          }
        },
        {
          text: 'Supporting information',
          metadata: {
            confidence: 0.8,
            docTitle: 'FAQ',
            sourceType: 'faq'
          }
        }
      ];

      const result = confidencePrompts.processConfidenceEnhancement(
        sources,
        'product',
        'What are the specifications?'
      );

      expect(result).toHaveProperty('overallConfidence');
      expect(result).toHaveProperty('confidenceLevel');
      expect(result).toHaveProperty('citations');
      expect(result).toHaveProperty('uncertaintyLanguage');
      expect(result).toHaveProperty('escalationGuidance');
      expect(result).toHaveProperty('responseFraming');
      expect(result).toHaveProperty('fallbackPrompts');
      expect(result).toHaveProperty('sourceDiversity');

      expect(result.confidenceLevel).toBe('high');
      expect(result.overallConfidence).toBeGreaterThan(0.8);
      expect(result.citations).toContain('Official Documentation');
    });

    it('should handle empty sources gracefully', () => {
      const result = confidencePrompts.processConfidenceEnhancement([], 'general', 'Test query');

      expect(result.confidenceLevel).toBe('low');
      expect(result.overallConfidence).toBe(0.5);
      expect(result.escalationGuidance.recommended).toBe(true);
      expect(result.fallbackPrompts).toContain('INSUFFICIENT INFORMATION');
    });
  });

  describe('performance requirements', () => {
    it('should process confidence analysis within reasonable time', () => {
      const sources = Array(20).fill(null).map((_, i) => ({
        text: `Source content ${i}`,
        metadata: {
          confidence: 0.7 + (i % 3) * 0.1,
          docTitle: `Document ${i}`,
          sourceType: `type_${i % 4}`
        }
      }));

      const startTime = Date.now();
      confidencePrompts.processConfidenceEnhancement(sources, 'product', 'Complex query');
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100);
    });
  });
});