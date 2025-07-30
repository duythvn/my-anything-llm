/**
 * Knowledge Prompt Engineer
 * Phase 1.3: Context-Aware Prompt System for E-commerce Knowledge Management
 * 
 * This module provides intelligent prompt engineering focused on knowledge extraction,
 * e-commerce context awareness, and adaptive response generation. It transforms raw
 * retrieval results into contextually appropriate prompts for optimal LLM responses.
 */

const { SystemPromptVariables } = require('../../../models/systemPromptVariables');

class KnowledgePromptEngineer {
  constructor(config = {}) {
    this.config = {
      // Performance settings
      maxSourcesPerPrompt: config.maxSourcesPerPrompt || 8,
      maxTokensPerSource: config.maxTokensPerSource || 200,
      
      // Confidence thresholds
      confidenceThreshold: config.confidenceThreshold || 0.7,
      highConfidenceThreshold: config.highConfidenceThreshold || 0.85,
      lowConfidenceThreshold: config.lowConfidenceThreshold || 0.5,
      
      // Context detection settings
      contextDetectionThreshold: config.contextDetectionThreshold || 0.1,
      
      // Business context settings
      enableBusinessContext: config.enableBusinessContext !== false,
      enableSourceAttribution: config.enableSourceAttribution !== false,
      
      ...config
    };

    // Context detection patterns
    this.contextDetectors = {
      product: {
        keywords: [
          'product', 'item', 'sku', 'price', 'cost', 'buy', 'purchase', 
          'order', 'availability', 'in stock', 'out of stock', 'specifications',
          'specs', 'features', 'details', 'category', 'catalog', 'compare',
          'similar', 'brand', 'model', 'variant', 'size', 'color', 'phone', 'phones'
        ],
        patterns: [
          /\b(SKU|sku)\s*:?\s*[A-Z0-9-]+/i,
          /\$\d+(\.\d{2})?/,
          /\b(price|cost|pricing)\b/i,
          /\b(buy|purchase|order)\b/i,
          /\b(in\s+stock|out\s+of\s+stock|availability)\b/i
        ]
      },
      support: {
        keywords: [
          'return', 'refund', 'exchange', 'warranty', 'help', 'support',
          'problem', 'issue', 'trouble', 'policy', 'how to', 'tutorial',
          'guide', 'instruction', 'shipping', 'delivery', 'track', 'order status',
          'cancel', 'modify', 'contact', 'customer service'
        ],
        patterns: [
          /\b(how\s+(do|to))\b/i,
          /\b(return|refund|exchange)\b/i,
          /\b(policy|policies)\b/i,
          /\b(help|support|assistance)\b/i,
          /\b(track|tracking)\b/i
        ]
      },
      general: {
        keywords: [
          'company', 'about', 'history', 'services', 'business', 'hours',
          'location', 'contact', 'team', 'mission', 'vision', 'values'
        ],
        patterns: [
          /\b(about\s+(us|company))\b/i,
          /\b(business\s+hours)\b/i,
          /\b(contact\s+(us|info))\b/i
        ]
      }
    };

    // Prompt templates for different contexts
    this.promptTemplates = {
      product: {
        systemAddition: `You are an e-commerce product specialist. Focus on providing accurate product information including specifications, pricing, availability, and comparisons. Always include SKU numbers when available and cite your sources.`,
        contextSection: 'PRODUCT INFORMATION',
        instructions: [
          'Provide accurate product details including SKU, pricing, and availability',
          'Compare products when multiple items are mentioned',
          'Include specifications and features when relevant',
          'Always cite sources with [Product X] or [Source X] format',
          'If product is out of stock, suggest similar alternatives'
        ]
      },
      support: {
        systemAddition: `You are a customer support specialist. Focus on helping customers with policies, procedures, and problem resolution. Provide clear, actionable guidance and know when to escalate to human support.`,
        contextSection: 'SUPPORT CONTEXT',
        instructions: [
          'Provide clear, step-by-step guidance when appropriate',
          'Reference relevant policies and procedures',
          'Include contact information for escalation when needed',
          'Be empathetic and solution-focused',
          'Always cite sources with [Policy X] or [Guide X] format'
        ]
      },
      general: {
        systemAddition: `You are a knowledgeable company representative. Provide helpful information about the business, services, and policies based on the knowledge base.`,
        contextSection: 'COMPANY INFORMATION',
        instructions: [
          'Provide accurate company and service information',
          'Reference official documentation when available',
          'Be professional and informative',
          'Always cite sources with [Reference X] format'
        ]
      }
    };
  }

  /**
   * Detect the context type of a user query
   * @param {string} query - User query to analyze
   * @returns {Object} Context type and confidence score
   */
  detectQueryContext(query) {
    if (!query || typeof query !== 'string' || !query.trim()) {
      return { type: 'general', confidence: 0.5, keywords: [] };
    }

    const normalizedQuery = query.toLowerCase().trim();
    const contextScores = {};
    const matchedKeywords = {};

    // Score each context type
    Object.entries(this.contextDetectors).forEach(([contextType, detector]) => {
      let score = 0;
      const keywords = [];

      // Check keyword matches
      detector.keywords.forEach(keyword => {
        if (normalizedQuery.includes(keyword.toLowerCase())) {
          score += 1;
          keywords.push(keyword);
        }
      });

      // Check pattern matches (weighted higher)
      detector.patterns.forEach(pattern => {
        if (pattern.test(normalizedQuery)) {
          score += 3;
        }
      });

      // Calculate a more reasonable score (not normalized to max possible, but actual matches)
      contextScores[contextType] = Math.min(score / 5, 1.0); // Normalize to reasonable scale
      matchedKeywords[contextType] = keywords;
    });

    // Find the highest scoring context
    const bestMatch = Object.entries(contextScores).reduce((best, [type, score]) => {
      return score > best.score ? { type, score } : best;
    }, { type: 'general', score: 0 });

    // Apply minimum threshold
    if (bestMatch.score < this.config.contextDetectionThreshold) {
      return { 
        type: 'general', 
        confidence: 0.5, 
        keywords: [],
        scores: contextScores 
      };
    }

    return {
      type: bestMatch.type,
      confidence: Math.min(bestMatch.score, 1.0),
      keywords: matchedKeywords[bestMatch.type] || [],
      scores: contextScores
    };
  }

  /**
   * Enhance a base prompt with context-aware information
   * @param {string} basePrompt - Original system prompt 
   * @param {string} query - User query
   * @param {Array} sources - Retrieved sources with metadata
   * @param {Object} contextData - Context detection results
   * @param {Object} businessContext - Business rules and context
   * @param {Object} userContext - User-specific context
   * @returns {Promise<string>} Enhanced prompt
   */
  async enhancePromptWithContext(
    basePrompt, 
    query, 
    sources = [], 
    contextData = {}, 
    businessContext = {},
    userContext = {}
  ) {
    const contextType = contextData.type || 'general';
    const template = this.promptTemplates[contextType];
    
    let enhancedPrompt = basePrompt;

    // Add context-specific system enhancements
    if (template && template.systemAddition) {
      enhancedPrompt += '\n\n' + template.systemAddition;
    }

    // Add business context if available
    if (this.config.enableBusinessContext && businessContext && Object.keys(businessContext).length > 0) {
      enhancedPrompt += '\n\n' + this.injectBusinessContext('', businessContext);
    }

    // Add source information with context-specific formatting
    if (sources && sources.length > 0) {
      const contextSection = template ? template.contextSection : 'CONTEXT INFORMATION';
      enhancedPrompt += `\n\n${contextSection}:\n`;
      enhancedPrompt += this.formatSourcesForContext(sources, contextType);
    } else {
      enhancedPrompt += '\n\nNo specific sources available for this query.';
    }

    // Add source attribution guidance
    if (this.config.enableSourceAttribution && sources && sources.length > 0) {
      const attribution = this.buildSourceAttribution(sources);
      if (attribution) {
        enhancedPrompt += '\n\n' + attribution;
      }
    }

    // Add confidence-based guidance
    const confidenceGuidance = this.formatConfidenceGuidance(sources);
    if (confidenceGuidance) {
      enhancedPrompt += '\n\n' + confidenceGuidance;
    }

    // Add context-specific instructions
    if (template && template.instructions) {
      enhancedPrompt += '\n\nINSTRUCTIONS:\n';
      template.instructions.forEach((instruction, index) => {
        enhancedPrompt += `${index + 1}. ${instruction}\n`;
      });
    }

    // Add user context if available
    if (userContext && userContext.userId) {
      // Expand any user-specific variables
      enhancedPrompt = await SystemPromptVariables.expandSystemPromptVariables(
        enhancedPrompt, 
        userContext.userId
      );
    }

    return enhancedPrompt.trim();
  }

  /**
   * Format sources for specific context type
   * @param {Array} sources - Source documents
   * @param {string} contextType - Context type (product, support, general)
   * @returns {string} Formatted source information
   */
  formatSourcesForContext(sources, contextType) {
    const limitedSources = sources.slice(0, this.config.maxSourcesPerPrompt);
    let formatted = '';

    limitedSources.forEach((source, index) => {
      if (!source) return; // Skip null sources
      const sourceNum = index + 1;
      const metadata = source.metadata || {};
      const text = this.truncateText(source.text || source.chunk || '', this.config.maxTokensPerSource);

      switch (contextType) {
        case 'product':
          formatted += this.formatProductSource(sourceNum, source, text, metadata);
          break;
        case 'support':
          formatted += this.formatSupportSource(sourceNum, source, text, metadata);
          break;
        default:
          formatted += this.formatGeneralSource(sourceNum, source, text, metadata);
      }

      formatted += '\n\n';
    });

    return formatted;
  }

  /**
   * Format product-specific source information
   * @private
   */
  formatProductSource(sourceNum, source, text, metadata) {
    let formatted = `[Product ${sourceNum}]`;
    
    if (metadata.sku) {
      formatted += ` SKU: ${metadata.sku}`;
    }
    
    if (metadata.docTitle) {
      formatted += ` ${metadata.docTitle}`;
    }
    
    if (metadata.category) {
      formatted += ` (Category: ${metadata.category})`;
    }

    formatted += `\n${text}`;

    if (metadata.price) {
      formatted += `\nPrice: $${metadata.price}`;
    }

    if (metadata.availability) {
      formatted += `\nAvailability: ${metadata.availability}`;
    }

    return formatted;
  }

  /**
   * Format support-specific source information
   * @private
   */
  formatSupportSource(sourceNum, source, text, metadata) {
    let formatted = `[Support ${sourceNum}]`;
    
    if (metadata.docTitle || metadata.filename) {
      formatted += ` ${metadata.docTitle || metadata.filename}`;
    }
    
    if (metadata.category) {
      formatted += ` (Topic: ${metadata.category})`;
    }

    formatted += `\n${text}`;

    if (metadata.lastUpdatedAt) {
      const date = new Date(metadata.lastUpdatedAt).toLocaleDateString();
      formatted += `\nLast Updated: ${date}`;
    }

    return formatted;
  }

  /**
   * Format general source information
   * @private
   */
  formatGeneralSource(sourceNum, source, text, metadata) {
    let formatted = `[Reference ${sourceNum}]`;
    
    if (metadata.docTitle || metadata.filename) {
      formatted += ` ${metadata.docTitle || metadata.filename}`;
    }
    
    if (metadata.sourceType) {
      formatted += ` (${metadata.sourceType})`;
    }

    formatted += `\n${text}`;

    return formatted;
  }

  /**
   * Build source attribution information for citation
   * @param {Array} sources - Source documents
   * @returns {string} Source attribution text
   */
  buildSourceAttribution(sources) {
    if (!sources || sources.length === 0) {
      return '';
    }

    let attribution = 'SOURCES:\n';

    sources.slice(0, this.config.maxSourcesPerPrompt).forEach((source, index) => {
      if (!source) return; // Skip null sources
      const metadata = source.metadata || {};
      const sourceNum = index + 1;
      
      let sourceName = metadata.docTitle || metadata.filename || 'Unknown Document';
      let sourceType = metadata.sourceType || 'document';
      
      attribution += `[${sourceNum}] ${sourceName} (${sourceType}`;
      
      if (metadata.confidence) {
        attribution += `, confidence: ${Math.round(metadata.confidence * 100)}%`;
      }
      
      if (metadata.category) {
        attribution += `, category: ${metadata.category}`;
      }
      
      attribution += ')\n';
    });

    return attribution;
  }

  /**
   * Inject business context into prompts
   * @param {string} basePrompt - Base prompt text
   * @param {Object} businessContext - Business rules and context
   * @returns {string} Enhanced prompt with business context
   */
  injectBusinessContext(basePrompt, businessContext) {
    if (!businessContext || Object.keys(businessContext).length === 0) {
      return basePrompt;
    }

    let contextSection = 'BUSINESS CONTEXT:\n';

    // Add common business context items
    if (businessContext.companyName) {
      contextSection += `Company: ${businessContext.companyName}\n`;
    }

    if (businessContext.returnPolicy) {
      contextSection += `Return Policy: ${businessContext.returnPolicy}\n`;
    }

    if (businessContext.freeShipping) {
      contextSection += `Free Shipping: ${businessContext.freeShipping}\n`;
    }

    if (businessContext.supportHours) {
      contextSection += `Support Hours: ${businessContext.supportHours}\n`;
    }

    if (businessContext.supportEmail) {
      contextSection += `Support Email: ${businessContext.supportEmail}\n`;
    }

    if (businessContext.supportPhone) {
      contextSection += `Support Phone: ${businessContext.supportPhone}\n`;
    }

    if (businessContext.escalationEnabled) {
      contextSection += `Escalation Available: Human support available when needed\n`;
    }

    // Add any custom business rules
    Object.entries(businessContext).forEach(([key, value]) => {
      if (!['companyName', 'returnPolicy', 'freeShipping', 'supportHours', 'supportEmail', 'supportPhone', 'escalationEnabled'].includes(key)) {
        contextSection += `${key}: ${value}\n`;
      }
    });

    return basePrompt + (basePrompt ? '\n\n' : '') + contextSection;
  }

  /**
   * Format confidence-based guidance for responses
   * @param {Array} sources - Source documents with confidence scores
   * @returns {string} Confidence guidance text
   */
  formatConfidenceGuidance(sources) {
    if (!sources || sources.length === 0) {
      return 'MODERATE CONFIDENCE: Limited information available. Acknowledge uncertainty and suggest contacting support if needed.';
    }

    // Calculate average confidence
    const confidenceScores = sources
      .map(s => (s && s.metadata?.confidence) || 0.7)
      .filter(score => score > 0);

    if (confidenceScores.length === 0) {
      return 'MODERATE CONFIDENCE: Source confidence unknown. Provide available information and indicate uncertainty where appropriate.';
    }

    const avgConfidence = confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length;

    if (avgConfidence >= this.config.highConfidenceThreshold) {
      return 'HIGH CONFIDENCE: Sources are highly reliable. Provide authorative information and cite sources clearly.';
    } else if (avgConfidence >= this.config.confidenceThreshold) {
      return 'MODERATE CONFIDENCE: Information is likely accurate. Provide available information and indicate uncertainty where appropriate.';
    } else {
      return 'LOW CONFIDENCE: Limited or uncertain information. Acknowledge limitations, provide what information is available, and suggest escalation to human support.';
    }
  }

  /**
   * Process a complete query enhancement workflow
   * @param {string} query - User query
   * @param {Array} sources - Retrieved sources
   * @param {Object} businessContext - Business context
   * @param {Object} userContext - User context
   * @returns {Promise<Object>} Complete enhancement results
   */
  async processQueryForEnhancements(query, sources, businessContext = {}, userContext = {}) {
    sources = sources || [];
    const startTime = Date.now();

    try {
      // Detect query context
      const contextData = this.detectQueryContext(query);

      // Get base prompt (would typically come from workspace settings)
      const basePrompt = 'You are a helpful AI assistant for an e-commerce business.';

      // Enhance prompt with context
      const enhancedPrompt = await this.enhancePromptWithContext(
        basePrompt,
        query,
        sources,
        contextData,
        businessContext,
        userContext
      );

      // Build source attribution
      const sourceAttribution = this.buildSourceAttribution(sources);

      // Determine confidence level
      const confidenceLevel = this.getConfidenceLevel(sources);

      // Extract business rules applied
      const businessRules = this.extractAppliedBusinessRules(businessContext, contextData.type);

      const processingTime = Date.now() - startTime;

      return {
        contextType: contextData.type,
        contextConfidence: contextData.confidence,
        contextKeywords: contextData.keywords,
        enhancedPrompt,
        sourceAttribution,
        confidenceLevel,
        businessRules,
        processingTime,
        metadata: {
          sourceCount: sources.length,
          contextScores: contextData.scores,
          avgSourceConfidence: this.calculateAverageConfidence(sources)
        }
      };
    } catch (error) {
      console.error('KnowledgePromptEngineer - Processing error:', error);
      
      return {
        contextType: 'general',
        contextConfidence: 0.5,
        contextKeywords: [],
        enhancedPrompt: 'You are a helpful AI assistant. Please provide the best answer you can based on available information.',
        sourceAttribution: '',
        confidenceLevel: 'medium',
        businessRules: [],
        processingTime: Date.now() - startTime,
        error: error.message
      };
    }
  }

  /**
   * Get confidence level category from sources
   * @private
   */
  getConfidenceLevel(sources) {
    if (!sources || sources.length === 0) return 'medium';

    const avgConfidence = this.calculateAverageConfidence(sources);
    
    if (avgConfidence >= this.config.highConfidenceThreshold) return 'high';
    if (avgConfidence >= this.config.confidenceThreshold) return 'medium';
    return 'low';
  }

  /**
   * Calculate average confidence score from sources
   * @private
   */
  calculateAverageConfidence(sources) {
    if (!sources || sources.length === 0) return 0.5;

    const confidenceScores = sources
      .map(s => (s && s.metadata?.confidence) || 0.7)
      .filter(score => score > 0);

    if (confidenceScores.length === 0) return 0.5;

    return confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length;
  }

  /**
   * Extract business rules that were applied
   * @private
   */
  extractAppliedBusinessRules(businessContext, contextType) {
    const rules = [];

    if (!businessContext) return rules;

    if (businessContext.returnPolicy) {
      rules.push({ type: 'return_policy', value: businessContext.returnPolicy });
    }

    if (businessContext.freeShipping) {
      rules.push({ type: 'shipping_policy', value: businessContext.freeShipping });
    }

    if (businessContext.escalationEnabled && contextType === 'support') {
      rules.push({ type: 'escalation', value: 'human_support_available' });
    }

    return rules;
  }

  /**
   * Truncate text to specified length while preserving word boundaries
   * @private
   */
  truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text;

    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    
    return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
  }

  /**
   * Get current configuration
   * @returns {Object} Current configuration
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Update configuration
   * @param {Object} newConfig - Updated configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }
}

module.exports = { KnowledgePromptEngineer };