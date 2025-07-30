/**
 * E-commerce Prompt Rules Engine
 * Phase 1.3: Business Logic Templates for E-commerce Scenarios
 * 
 * This module provides specialized prompt templates and business rule application
 * for common e-commerce scenarios including product recommendations, order inquiries,
 * returns, pricing questions, and escalation detection.
 */

class EcommercePromptRules {
  constructor(config = {}) {
    this.config = {
      // Business rule thresholds
      escalationThreshold: config.escalationThreshold || 0.8,
      upsellThreshold: config.upsellThreshold || 50, // Minimum price for upsell
      crossSellThreshold: config.crossSellThreshold || 3, // Max complementary items
      
      // Response settings
      maxRecommendations: config.maxRecommendations || 5,
      includeAlternatives: config.includeAlternatives !== false,
      enableUpselling: config.enableUpselling !== false,
      enableCrossSelling: config.enableCrossSelling !== false,
      
      ...config
    };

    // Default business rules - can be overridden per merchant
    this.businessRules = {
      returnPeriod: 30, // days
      freeShippingThreshold: 50, // USD
      warrantyPeriod: 365, // days
      supportHours: '9AM-5PM EST',
      supportEmail: 'support@company.com',
      supportPhone: '1-800-SUPPORT',
      escalationTriggers: [
        'angry', 'frustrated', 'unacceptable', 'manager', 'supervisor',
        'cancel', 'refund immediately', 'terrible', 'awful', 'worst',
        'very angry', 'completely unacceptable', 'speak to a manager',
        'immediate help', 'right now'
      ],
      ...config.businessRules
    };

    // Scenario detection patterns
    this.scenarioDetectors = {
      product_recommendation: {
        keywords: [
          'recommend', 'suggest', 'best', 'good', 'better', 'compare',
          'similar', 'alternative', 'which one', 'what should', 'need',
          'looking for', 'want', 'prefer', 'like', 'suitable'
        ],
        patterns: [
          /\b(recommend|suggest|best|good)\b.*\b(for|to)\b/i,
          /\b(which|what).*\b(should|would|do)\b.*\b(recommend|suggest|buy)\b/i,
          /\b(need|looking for|want)\b.*\b(laptop|phone|product|item)\b/i
        ]
      },
      order_inquiry: {
        keywords: [
          'order', 'shipping', 'delivery', 'track', 'status', 'when',
          'arrive', 'shipped', 'package', 'tracking', 'shipment'
        ],
        patterns: [
          /\b(where|when).*\b(order|package|shipment)\b/i,
          /\b(track|status).*\b(order|shipping|delivery)\b/i,
          /\border\s*#?\s*\d+/i
        ]
      },
      return_refund: {
        keywords: [
          'return', 'refund', 'exchange', 'money back', 'send back',
          'policy', 'defective', 'broken', 'wrong', 'damaged'
        ],
        patterns: [
          /\b(return|refund|exchange)\b/i,
          /\b(money\s+back|send\s+back)\b/i,
          /\b(defective|broken|damaged|wrong)\b/i
        ]
      },
      pricing_availability: {
        keywords: [
          'price', 'cost', 'how much', 'expensive', 'cheap', 'discount',
          'sale', 'available', 'in stock', 'out of stock', 'inventory'
        ],
        patterns: [
          /\b(how\s+much|what.*cost|what.*price)\b/i,
          /\b(in\s+stock|out\s+of\s+stock|available)\b/i,
          /\$\d+/
        ]
      }
    };

    // Response templates for each scenario
    this.responseTemplates = {
      product_recommendation: {
        prefix: 'PRODUCT RECOMMENDATIONS',
        instructions: [
          'Compare key features and specifications',
          'Highlight unique selling points of each product',
          'Consider the customer\'s stated needs and preferences',
          'Include price comparison when relevant',
          'Suggest the best option based on requirements',
          'Mention availability and shipping timeframes'
        ]
      },
      order_inquiry: {
        prefix: 'ORDER STATUS ASSISTANCE',
        instructions: [
          'Provide specific order tracking information if available',
          'Explain shipping timeframes and delivery expectations',
          'Offer alternative tracking methods if needed',
          'Include contact information for shipping issues',
          'Be proactive about potential delays or problems'
        ]
      },
      return_refund: {
        prefix: 'RETURN & REFUND ASSISTANCE',
        instructions: [
          'Clearly explain the return policy and timeframes',
          'Provide step-by-step return instructions',
          'List required documentation or conditions',
          'Offer alternatives like exchange or store credit',
          'Include customer service contact for complex cases'
        ]
      },
      pricing_availability: {
        prefix: 'PRICING & AVAILABILITY',
        instructions: [
          'Provide accurate current pricing information',
          'Mention any active promotions or discounts',
          'Include availability status and restocking timeframes',
          'Compare with similar products if price is a concern',
          'Highlight value propositions and special features'
        ]
      }
    };
  }

  /**
   * Detect the e-commerce scenario from query and context
   * @param {string} query - User query
   * @param {Array} sources - Retrieved sources for additional context
   * @returns {Object} Scenario type and confidence
   */
  detectQueryScenario(query, sources = []) {
    if (!query || typeof query !== 'string') {
      return { type: 'general', confidence: 0.5 };
    }

    const normalizedQuery = query.toLowerCase().trim();
    const scenarioScores = {};

    // Score each scenario type
    Object.entries(this.scenarioDetectors).forEach(([scenarioType, detector]) => {
      let score = 0;

      // Check keyword matches
      detector.keywords.forEach(keyword => {
        if (normalizedQuery.includes(keyword.toLowerCase())) {
          score += 1;
        }
      });

      // Check pattern matches (weighted higher)
      detector.patterns.forEach(pattern => {
        if (pattern.test(normalizedQuery)) {
          score += 2;
        }
      });

      // Boost score based on source context
      sources.forEach(source => {
        if (!source) return; // Handle null sources
        const metadata = source.metadata || {};
        if (scenarioType === 'product_recommendation' && metadata.sourceType === 'product_catalog') {
          score += 1;
        }
        if (scenarioType === 'return_refund' && metadata.sourceType === 'policy_doc') {
          score += 1;
        }
      });

      scenarioScores[scenarioType] = Math.min(score / 3, 1.0);
    });

    // Find the highest scoring scenario
    const bestMatch = Object.entries(scenarioScores).reduce((best, [type, score]) => {
      return score > best.score ? { type, score } : best;
    }, { type: 'general', score: 0 });

    // Apply minimum threshold - if no scenario meets threshold, default to general
    if (bestMatch.score < 0.1) {
      return {
        type: 'general',
        confidence: 0.5,
        alternativeScenarios: scenarioScores
      };
    }

    return {
      type: bestMatch.type,
      confidence: bestMatch.score,
      alternativeScenarios: scenarioScores
    };
  }

  /**
   * Apply business rules based on scenario and context
   * @param {Object} scenario - Detected scenario
   * @param {Array} sources - Source documents
   * @returns {string} Business rules text
   */
  applyBusinessRules(scenario, sources = []) {
    let rules = '';

    switch (scenario.type) {
      case 'return_refund':
        rules += `RETURN POLICY:\n`;
        rules += `- Return Period: ${this.businessRules.returnPeriod} days from purchase\n`;
        rules += `- Return Conditions: Items must be unused and in original packaging\n`;
        rules += `- Refund Processing: 5-7 business days after return received\n`;
        rules += `- Return Shipping: Customer responsible unless item is defective\n`;
        
        // Check if escalation is needed for complex returns
        if (scenario.confidence > 0.8 || this.hasComplexReturnScenario(sources)) {
          rules += `- For complex returns, escalation to customer service may be required\n`;
        }
        break;

      case 'order_inquiry':
        rules += `SHIPPING INFORMATION:\n`;
        rules += `- Free shipping on orders over $${this.businessRules.freeShippingThreshold}\n`;
        rules += `- Standard shipping: 3-5 business days\n`;
        rules += `- Express shipping: 1-2 business days (additional cost)\n`;
        rules += `- Order processing: 1-2 business days before shipping\n`;
        rules += `- Tracking information available once shipped\n`;
        rules += `- Always reference shipping timeframes and tracking options\n`;
        break;

      case 'pricing_availability':
        rules += `PRICING GUIDELINES:\n`;
        rules += `- Always provide current pricing information\n`;
        rules += `- Mention current promotions and discounts if available\n`;
        rules += `- Include availability status (in stock/out of stock/backordered)\n`;
        rules += `- For out of stock items, provide restock estimates if available\n`;
        rules += `- Compare with similar products if customer is price-sensitive\n`;
        break;

      case 'product_recommendation':
        rules += `RECOMMENDATION GUIDELINES:\n`;
        rules += `- Focus on customer's specific needs and preferences\n`;
        rules += `- Compare key features and benefits of recommended products\n`;
        rules += `- Include price ranges and value propositions\n`;
        rules += `- Mention availability and shipping timeframes\n`;
        rules += `- Suggest complementary products when appropriate\n`;
        break;

      default:
        rules += `GENERAL GUIDELINES:\n`;
        rules += `- Provide helpful and accurate information\n`;
        rules += `- Reference company policies when relevant\n`;
        rules += `- Offer to escalate to human support if needed\n`;
    }

    // Add contact information
    rules += `\nCUSTOMER SUPPORT:\n`;
    rules += `- Hours: ${this.businessRules.supportHours}\n`;
    rules += `- Email: ${this.businessRules.supportEmail}\n`;
    rules += `- Phone: ${this.businessRules.supportPhone}\n`;

    return rules;
  }

  /**
   * Generate product recommendation prompts
   * @param {Array} sources - Product sources
   * @param {string} recommendationType - Type of recommendation (standard, upsell, cross_sell)
   * @returns {string} Recommendation prompt text
   */
  generateRecommendationPrompts(sources, recommendationType = 'standard') {
    if (!sources || sources.length === 0) {
      return '';
    }

    const productSources = sources.filter(s => 
      s.metadata?.sourceType === 'product_catalog'
    ).slice(0, this.config.maxRecommendations);

    if (productSources.length === 0) {
      return '';
    }

    let prompt = '';

    switch (recommendationType) {
      case 'cross_sell':
        prompt += 'COMPLEMENTARY PRODUCTS:\n';
        prompt += 'Suggest products that work well together or enhance the main product:\n';
        break;
      case 'upsell':
        prompt += 'PREMIUM OPTIONS:\n';
        prompt += 'Highlight higher-tier products with additional features and benefits:\n';
        break;
      default:
        prompt += 'PRODUCT RECOMMENDATIONS:\n';
        prompt += 'Based on the available products, here are the best options:\n';
    }

    productSources.forEach((source, index) => {
      const metadata = source.metadata || {};
      const num = index + 1;
      
      prompt += `\n[Product ${num}] ${source.text}\n`;
      
      if (metadata.sku) {
        prompt += `SKU: ${metadata.sku}\n`;
      }
      
      if (metadata.price) {
        prompt += `Price: $${metadata.price}\n`;
      }
      
      if (metadata.category) {
        prompt += `Category: ${metadata.category}\n`;
      }
      
      if (metadata.availability) {
        prompt += `Availability: ${metadata.availability}\n`;
      }
    });

    // Add recommendation instructions
    prompt += '\nRECOMMENDATION INSTRUCTIONS:\n';
    prompt += '- Compare features and benefits of each product\n';
    prompt += '- Highlight what makes each product unique\n';
    prompt += '- Consider price-to-value ratio\n';
    
    if (recommendationType === 'cross_sell') {
      prompt += '- Explain how accessories or bundles enhance the main product\n';
      prompt += '- Suggest complete solutions rather than individual items\n';
    } else if (recommendationType === 'upsell') {
      prompt += '- Clearly explain additional features in premium options\n';
      prompt += '- Justify the price difference with concrete benefits\n';
    } else {
      prompt += '- Provide a clear recommendation based on customer needs\n';
      prompt += '- Include price comparison and availability information\n';
    }

    return prompt;
  }

  /**
   * Build escalation triggers and detection
   * @param {string} query - User query
   * @param {Array} sources - Context sources
   * @returns {Object} Escalation assessment
   */
  buildEscalationTriggers(query, sources = []) {
    const escalation = {
      required: false,
      suggested: false,
      reason: null,
      urgency: 'low'
    };

    if (!query) {
      return escalation;
    }

    const normalizedQuery = query.toLowerCase();

    // Check for explicit escalation triggers
    const hasEscalationTrigger = this.businessRules.escalationTriggers.some(trigger => 
      normalizedQuery.includes(trigger.toLowerCase())
    );

    if (hasEscalationTrigger) {
      escalation.required = true;
      escalation.reason = 'Customer expressed frustration or urgency';
      escalation.urgency = 'high';
      return escalation;
    }

    // Check for complex scenarios that might need human intervention
    if (normalizedQuery.includes('cancel') && normalizedQuery.includes('order')) {
      escalation.suggested = true;
      escalation.reason = 'Order cancellation may require human assistance';
      escalation.urgency = 'medium';
    }

    // Check for refund requests without clear product information
    if (normalizedQuery.includes('refund') && !sources.some(s => s.metadata?.sourceType === 'product_catalog')) {
      escalation.suggested = true;
      escalation.reason = 'Refund request may need order verification';
      escalation.urgency = 'medium';
    }

    // Check source metadata for escalation flags
    sources.forEach(source => {
      if (!source) return; // Handle null sources
      if (source.metadata?.escalationRequired) {
        escalation.suggested = true;
        escalation.reason = 'Source indicates complex issue requiring specialist';
        escalation.urgency = 'medium';
      }
    });

    // Check for order status queries without order information
    if ((normalizedQuery.includes('order') || normalizedQuery.includes('track')) && 
        !sources.some(s => s && s.metadata?.sourceType === 'order_data')) {
      escalation.suggested = true;
      escalation.reason = 'Order inquiry requires access to order management system';
      escalation.urgency = 'low';
    }

    return escalation;
  }

  /**
   * Format policy information for responses
   * @param {Array} sources - Policy sources
   * @param {string} scenarioType - Query scenario
   * @returns {string} Formatted policy information
   */
  formatPolicyInformation(sources, scenarioType) {
    const policySources = sources.filter(s => 
      s && s.metadata?.sourceType === 'policy_doc'
    );

    if (policySources.length === 0) {
      return `POLICY INFORMATION:\nFor specific policy questions, please contact customer service at ${this.businessRules.supportEmail} or ${this.businessRules.supportPhone}.`;
    }

    let formatted = '';

    switch (scenarioType) {
      case 'return_refund':
        formatted += 'RETURN POLICY:\n';
        break;
      case 'order_inquiry':
        formatted += 'SHIPPING INFORMATION:\n';
        break;
      case 'pricing_availability':
        formatted += 'PRICING POLICY:\n';
        break;
      default:
        formatted += 'POLICY INFORMATION:\n';
    }

    policySources.forEach((source, index) => {
      formatted += `\n[Policy ${index + 1}] ${source.text}\n`;
      
      const metadata = source.metadata || {};
      if (metadata.lastUpdatedAt) {
        const date = new Date(metadata.lastUpdatedAt).toLocaleDateString();
        formatted += `Last Updated: ${date}\n`;
      }
    });

    // Add policy application instructions
    formatted += '\nPOLICY INSTRUCTIONS:\n';
    formatted += '- Apply policy conditions accurately and completely\n';
    formatted += '- Explain any exceptions or special circumstances\n';
    formatted += '- Provide clear next steps for the customer\n';
    formatted += '- Offer escalation for complex policy questions\n';

    return formatted;
  }

  /**
   * Generate upsell prompts based on products
   * @param {Array} sources - Product sources
   * @returns {string} Upsell prompt text
   */
  generateUpsellPrompts(sources) {
    if (!this.config.enableUpselling || !sources || sources.length === 0) {
      return '';
    }

    const productSources = sources.filter(s => 
      s.metadata?.sourceType === 'product_catalog'
    );

    if (productSources.length === 0) {
      return '';
    }

    // Look for upsell opportunities
    const hasUpsellOpportunity = productSources.some(source => {
      const metadata = source.metadata || {};
      const price = parseFloat(metadata.price || '0');
      return price >= this.config.upsellThreshold;
    });

    if (!hasUpsellOpportunity) {
      return '';
    }

    let upsellPrompt = 'PREMIUM OPTIONS:\n';
    upsellPrompt += 'When appropriate, consider upgrading suggestions:\n\n';

    // Check for common upsell scenarios
    const hasElectronics = productSources.some(s => 
      s.metadata?.category?.toLowerCase().includes('electronics')
    );

    if (hasElectronics) {
      upsellPrompt += '- Extended warranty or protection plans\n';
      upsellPrompt += '- Premium accessories or cases\n';
      upsellPrompt += '- Higher storage or memory options\n';
    }

    upsellPrompt += '- Professional installation or setup services\n';
    upsellPrompt += '- Bundle deals with complementary products\n';
    upsellPrompt += '- Express shipping for faster delivery\n';

    upsellPrompt += '\nUPSELL GUIDELINES:\n';
    upsellPrompt += '- Only suggest upgrades that add genuine value\n';
    upsellPrompt += '- Explain the additional features or benefits clearly\n';
    upsellPrompt += '- Respect the customer\'s budget constraints\n';
    upsellPrompt += '- Present options without being pushy\n';

    return upsellPrompt;
  }

  /**
   * Process complete e-commerce query workflow
   * @param {string} query - User query
   * @param {Array} sources - Retrieved sources
   * @returns {Object} Complete e-commerce processing results
   */
  processEcommerceQuery(query, sources = []) {
    const startTime = Date.now();

    try {
      // Detect scenario
      const scenario = this.detectQueryScenario(query, sources);

      // Apply business rules
      const businessRules = this.applyBusinessRules(scenario, sources);

      // Generate recommendations if applicable
      const recommendations = scenario.type === 'product_recommendation' 
        ? this.generateRecommendationPrompts(sources)
        : '';

      // Check escalation needs
      const escalation = this.buildEscalationTriggers(query, sources);

      // Format policy information
      const policyInfo = this.formatPolicyInformation(sources, scenario.type);

      // Generate upsell opportunities
      const upsellOpportunities = this.generateUpsellPrompts(sources);

      const processingTime = Date.now() - startTime;

      return {
        scenario,
        businessRules,
        recommendations,
        escalation,
        policyInfo,
        upsellOpportunities,
        processingTime,
        metadata: {
          sourceCount: sources.length,
          productCount: sources.filter(s => s.metadata?.sourceType === 'product_catalog').length,
          policyCount: sources.filter(s => s.metadata?.sourceType === 'policy_doc').length
        }
      };
    } catch (error) {
      console.error('EcommercePromptRules - Processing error:', error);
      
      return {
        scenario: { type: 'general', confidence: 0.5 },
        businessRules: this.applyBusinessRules({ type: 'general' }, []),
        recommendations: '',
        escalation: { required: false, suggested: true, reason: 'Processing error occurred' },
        policyInfo: '',
        upsellOpportunities: '',
        processingTime: Date.now() - startTime,
        error: error.message
      };
    }
  }

  /**
   * Check if return scenario is complex and needs escalation
   * @private
   */
  hasComplexReturnScenario(sources) {
    return sources.some(source => {
      const text = (source.text || '').toLowerCase();
      return text.includes('defective') || 
             text.includes('damaged') || 
             text.includes('warranty') ||
             source.metadata?.escalationRequired;
    });
  }

  /**
   * Update business rules configuration
   * @param {Object} newRules - Updated business rules
   */
  updateBusinessRules(newRules) {
    this.businessRules = { ...this.businessRules, ...newRules };
  }

  /**
   * Get current configuration
   * @returns {Object} Current configuration
   */
  getConfig() {
    return {
      config: { ...this.config },
      businessRules: { ...this.businessRules }
    };
  }
}

module.exports = { EcommercePromptRules };