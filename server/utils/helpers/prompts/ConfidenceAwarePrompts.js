/**
 * Confidence-Aware Prompts Engine
 * Phase 1.3: Source Confidence and Attribution Prompts
 * 
 * This module provides sophisticated confidence analysis and prompt framing
 * based on source reliability, attribution quality, and uncertainty assessment.
 * It helps create responses that appropriately communicate confidence levels
 * and handle uncertainty in knowledge retrieval scenarios.
 */

class ConfidenceAwarePrompts {
  constructor(config = {}) {
    this.config = {
      // Confidence thresholds
      highConfidenceThreshold: config.highConfidenceThreshold || 0.85,
      mediumConfidenceThreshold: config.mediumConfidenceThreshold || 0.6,
      lowConfidenceThreshold: config.lowConfidenceThreshold || 0.5,
      
      // Escalation settings
      escalationConfidenceThreshold: config.escalationConfidenceThreshold || 0.5,
      escalationRequired: config.escalationRequired !== false,
      
      // Citation settings
      maxCitations: config.maxCitations || 8,
      includeCitationMetadata: config.includeCitationMetadata !== false,
      includeConfidenceScores: config.includeConfidenceScores !== false,
      
      // Source diversity settings
      diversityThreshold: config.diversityThreshold || 0.6,
      minSourcesForDiversity: config.minSourcesForDiversity || 2,
      
      ...config
    };

    // Confidence thresholds for easy reference
    this.confidenceThresholds = {
      high: this.config.highConfidenceThreshold,
      medium: this.config.mediumConfidenceThreshold,
      low: this.config.lowConfidenceThreshold
    };

    // Uncertainty language templates
    this.uncertaintyLanguage = {
      high: {
        qualifiers: ['based on reliable sources', 'according to authoritative information', 'from verified documentation'],
        confidence_phrases: ['I can confidently say', 'The information clearly indicates', 'Based on high-quality sources'],
        attribution: ['as documented in', 'according to official sources', 'as stated in reliable documentation']
      },
      medium: {
        qualifiers: ['based on available information', 'according to current sources', 'from generally reliable data'],
        confidence_phrases: ['The information suggests', 'It appears that', 'Based on available sources'],
        attribution: ['according to sources', 'as indicated in documentation', 'based on available information']
      },
      low: {
        qualifiers: ['based on limited information', 'from available sources', 'with some uncertainty'],
        confidence_phrases: ['The limited information suggests', 'It may be that', 'Based on uncertain sources'],
        attribution: ['according to limited sources', 'as suggested by available information', 'with some uncertainty']
      }
    };

    // Escalation triggers by scenario type
    this.escalationTriggers = {
      product: ['complex specifications', 'technical compatibility', 'warranty claims', 'custom requirements'],
      support: ['account access', 'billing disputes', 'order modifications', 'urgent issues'],
      general: ['policy exceptions', 'account specific', 'urgent requests', 'complex scenarios']
    };
  }

  /**
   * Calculate overall confidence from multiple sources
   * @param {Array} sources - Array of source documents with confidence scores
   * @returns {number} Overall confidence score (0-1)
   */
  calculateOverallConfidence(sources) {
    if (!sources || sources.length === 0) {
      return 0.5; // Default neutral confidence
    }

    // Extract confidence scores, defaulting to reasonable baseline
    const confidenceScores = sources
      .filter(source => source != null) // Filter out null/undefined sources
      .map(source => {
        const confidence = source.metadata?.confidence;
        return typeof confidence === 'number' ? confidence : 0.7; // Default confidence
      })
      .filter(score => score > 0);

    if (confidenceScores.length === 0) {
      return 0.5;
    }

    // Calculate weighted average with source quality consideration
    let totalWeight = 0;
    let weightedSum = 0;

    const validSources = sources.filter(source => source != null);
    confidenceScores.forEach((confidence, index) => {
      const source = validSources[index];
      if (!source) return;
      const metadata = source.metadata || {};
      
      // Weight based on source type reliability
      let weight = 1.0;
      switch (metadata.sourceType) {
        case 'official_docs':
        case 'product_catalog':
          weight = 1.2;
          break;
        case 'policy_doc':
        case 'faq':
          weight = 1.1;
          break;
        case 'user_manual':
          weight = 1.0;
          break;
        case 'user_upload':
        case 'web_scrape':
          weight = 0.9;
          break;
        default:
          weight = 0.8;
      }

      // Adjust weight based on freshness
      if (metadata.lastUpdatedAt) {
        const ageInDays = (new Date() - new Date(metadata.lastUpdatedAt)) / (1000 * 60 * 60 * 24);
        if (ageInDays > 365) weight *= 0.9; // Old content slightly less reliable
        if (ageInDays < 30) weight *= 1.1;  // Recent content slightly more reliable
      }

      totalWeight += weight;
      weightedSum += confidence * weight;
    });

    const overallConfidence = weightedSum / totalWeight;
    
    // Apply diversity bonus
    const diversity = this.assessSourceDiversity(sources);
    let diversityBonus = 0;
    if (diversity.level === 'high') diversityBonus = 0.05;
    if (diversity.level === 'medium') diversityBonus = 0.02;

    return Math.min(1.0, Math.max(0.1, overallConfidence + diversityBonus));
  }

  /**
   * Categorize confidence level into high/medium/low
   * @param {number} confidence - Confidence score (0-1)
   * @returns {string} Confidence level category
   */
  categorizeConfidenceLevel(confidence) {
    if (confidence >= this.confidenceThresholds.high) return 'high';
    if (confidence >= this.confidenceThresholds.medium) return 'medium';
    return 'low';
  }

  /**
   * Generate source citations with confidence indicators
   * @param {Array} sources - Source documents
   * @returns {string} Formatted citations
   */
  generateSourceCitations(sources) {
    if (!sources || sources.length === 0) {
      return '';
    }

    const limitedSources = sources.slice(0, this.config.maxCitations);
    let citations = 'SOURCES:\n';

    limitedSources.forEach((source, index) => {
      if (!source) return; // Handle null sources
      const metadata = source.metadata || {};
      const sourceNum = index + 1;
      
      let sourceName = metadata.docTitle || metadata.filename || 'Unknown Document';
      let sourceType = metadata.sourceType || 'document';
      
      citations += `[${sourceNum}] ${sourceName}`;
      
      // Add source type
      citations += ` (${sourceType}`;
      
      // Add confidence score if available and enabled
      if (this.config.includeConfidenceScores && typeof metadata.confidence === 'number') {
        citations += `, confidence: ${Math.round(metadata.confidence * 100)}%`;
      }
      
      // Add freshness indicator
      if (metadata.lastUpdatedAt) {
        const date = new Date(metadata.lastUpdatedAt);
        const now = new Date();
        const ageInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
        
        if (ageInDays === 0) {
          citations += ', updated today';
        } else if (ageInDays < 7) {
          citations += `, updated ${ageInDays} days ago`;
        } else if (ageInDays < 30) {
          citations += ', updated recently';
        } else if (ageInDays > 365) {
          citations += ', older content';
        }
      }
      
      citations += ')\n';
    });

    return citations;
  }

  /**
   * Build appropriate uncertainty language based on confidence level
   * @param {string} confidenceLevel - high/medium/low
   * @param {Array} sources - Source documents for context
   * @returns {string} Uncertainty language guidance
   */
  buildUncertaintyLanguage(confidenceLevel, sources = []) {
    const templates = this.uncertaintyLanguage[confidenceLevel] || this.uncertaintyLanguage.medium;
    const diversity = this.assessSourceDiversity(sources);
    
    let language = '';

    switch (confidenceLevel) {
      case 'high':
        language = `CONFIDENCE GUIDANCE: High confidence response
- Use authoritative language: "${templates.confidence_phrases[0]}", "${templates.confidence_phrases[1]}"
- Cite sources clearly: "${templates.attribution[0]}", "${templates.attribution[1]}"
- Present information confidently while maintaining accuracy
- Acknowledge the reliable sources that support your response`;
        break;

      case 'medium':
        language = `CONFIDENCE GUIDANCE: Moderate confidence response
- Use qualified language: "${templates.confidence_phrases[0]}", "${templates.confidence_phrases[1]}"
- Indicate reasonable certainty: "${templates.qualifiers[0]}", "${templates.qualifiers[1]}"
- The information should be accurate but acknowledge some uncertainty where appropriate
- Balance confidence with appropriate caution`;
        break;

      case 'low':
        language = `CONFIDENCE GUIDANCE: Low confidence response
- Acknowledge uncertainty clearly: "${templates.confidence_phrases[0]}", "${templates.confidence_phrases[1]}"
- Use careful qualifiers: "${templates.qualifiers[0]}", "${templates.qualifiers[1]}"
- Indicate that information may not be complete or fully reliable
- Suggest verification or escalation when appropriate`;
        break;
    }

    // Add source diversity context
    if (sources.length > 0) {
      if (diversity.level === 'high') {
        language += `\n- Multiple sources (${diversity.uniqueTypes} different types) support this information`;
      } else if (diversity.level === 'medium') {
        language += `\n- Information comes from ${diversity.uniqueTypes} different source types`;
      } else {
        language += `\n- Information primarily from ${diversity.uniqueTypes} source type(s) - consider this limitation`;
      }
    }

    return language;
  }

  /**
   * Generate escalation prompts based on confidence and context
   * @param {Array} sources - Source documents
   * @param {string} scenarioType - Type of query scenario
   * @returns {Object} Escalation guidance
   */
  generateEscalationPrompts(sources, scenarioType) {
    const overallConfidence = this.calculateOverallConfidence(sources);
    const confidenceLevel = this.categorizeConfidenceLevel(overallConfidence);
    
    const escalation = {
      recommended: false,
      required: false,
      reason: '',
      urgency: 'low',
      prompt: ''
    };

    // Check confidence-based escalation
    if (overallConfidence <= this.config.escalationConfidenceThreshold) {
      escalation.recommended = true;
      escalation.reason = 'low confidence in available information';
      escalation.urgency = 'medium';
    }

    // Check for explicit escalation markers in sources
    const hasEscalationMarker = sources.some(source => 
      source.metadata?.escalationRequired || 
      source.metadata?.requiresHumanReview
    );

    if (hasEscalationMarker) {
      escalation.recommended = true;
      escalation.reason = 'complex issue requiring specialist knowledge';
      escalation.urgency = 'medium';
    }

    // Check scenario-specific triggers
    const triggerWords = this.escalationTriggers[scenarioType] || this.escalationTriggers.general;
    const hasScenarioTrigger = sources.some(source => {
      const text = (source.text || '').toLowerCase();
      return triggerWords.some(trigger => text.includes(trigger.toLowerCase()));
    });

    if (hasScenarioTrigger) {
      escalation.recommended = true;
      escalation.reason = `${scenarioType} scenario may require specialized assistance`;
      escalation.urgency = 'medium';
    }

    // Generate escalation prompt
    if (escalation.recommended) {
      escalation.prompt = `ESCALATION GUIDANCE:
- This query may benefit from human support due to: ${escalation.reason}
- Suggest contacting customer service for specialized assistance
- Provide available information while acknowledging limitations
- Include contact information: support email, phone, or chat options
- Set appropriate expectations for response time and resolution`;
    } else {
      escalation.reason = confidenceLevel === 'high' ? 'high confidence in available information' : 'adequate information available';
      escalation.prompt = 'ESCALATION GUIDANCE: Standard response - no escalation needed at this time';
    }

    return escalation;
  }

  /**
   * Build confidence-based response framing
   * @param {Array} sources - Source documents
   * @param {string} contextType - Context type (product, support, general)
   * @returns {string} Response framing guidance
   */
  buildConfidenceFraming(sources, contextType) {
    const overallConfidence = this.calculateOverallConfidence(sources);
    const confidenceLevel = this.categorizeConfidenceLevel(overallConfidence);
    const diversity = this.assessSourceDiversity(sources);

    let framing = `RESPONSE CONFIDENCE: ${confidenceLevel.charAt(0).toUpperCase() + confidenceLevel.slice(1)}\n`;
    framing += `Overall Score: ${Math.round(overallConfidence * 100)}%\n`;
    framing += `Source Diversity: ${diversity.level} (${diversity.uniqueTypes} types)\n\n`;

    switch (confidenceLevel) {
      case 'high':
        framing += `RESPONSE APPROACH:
- Provide authoritative and definitive answers
- Use confident language and clear statements
- Cite sources clearly to support credibility
- Present information as reliable and well-documented
- Include specific details and examples when available`;
        break;

      case 'medium':
        framing += `RESPONSE APPROACH:
- Provide information as likely accurate with appropriate qualifiers
- Use moderate confidence language ("appears to", "generally", "likely")
- Indicate uncertainty where appropriate
- Cite sources while acknowledging some limitations
- Offer to help find additional information if needed`;
        break;

      case 'low':
        framing += `RESPONSE APPROACH:
- Acknowledge limitations in available information clearly
- Use cautious language ("may be", "limited information suggests", "appears that")
- Provide what information is available while noting uncertainty
- Suggest escalation to human support for definitive answers
- Offer alternative ways to find more complete information`;
        break;
    }

    // Add context-specific guidance
    switch (contextType) {
      case 'product':
        framing += `\n- Focus on factual product information and specifications
- Include availability, pricing, and key features when confident
- Suggest product comparisons for better decision-making`;
        break;
      case 'support':
        framing += `\n- Prioritize helpful problem-solving approaches
- Provide step-by-step guidance when confidence is high
- Offer escalation options for complex issues`;
        break;
      case 'general':
        framing += `\n- Provide balanced and informative responses
- Include context and background when helpful
- Suggest relevant resources for additional information`;
        break;
    }

    return framing;
  }

  /**
   * Assess source diversity for confidence calculation
   * @param {Array} sources - Source documents
   * @returns {Object} Diversity assessment
   */
  assessSourceDiversity(sources) {
    if (!sources || sources.length === 0) {
      return { level: 'none', uniqueTypes: 0, totalSources: 0 };
    }

    const sourceTypes = new Set();
    sources.forEach(source => {
      if (!source) return; // Handle null sources
      const sourceType = source.metadata?.sourceType || 'unknown';
      sourceTypes.add(sourceType);
    });

    const uniqueTypes = sourceTypes.size;
    const totalSources = sources.length;
    const diversityRatio = uniqueTypes / totalSources;

    let level;
    if (diversityRatio >= 0.75 && uniqueTypes >= 3) {
      level = 'high';
    } else if (diversityRatio >= 0.5 && uniqueTypes >= 2) {
      level = 'medium';
    } else {
      level = 'low';
    }

    return {
      level,
      uniqueTypes,
      totalSources,
      diversityRatio: Math.round(diversityRatio * 100) / 100,
      sourceTypes: Array.from(sourceTypes)
    };
  }

  /**
   * Generate fallback prompts for insufficient information
   * @param {Array} sources - Source documents
   * @param {string} contextType - Context type
   * @returns {string} Fallback prompt guidance
   */
  generateFallbackPrompts(sources, contextType) {
    if (!sources || sources.length === 0) {
      return `INSUFFICIENT INFORMATION:
- No relevant sources found for this query
- Acknowledge that specific information is not available
- Suggest alternative approaches or resources
- Provide general guidance if applicable to ${contextType} context
- Offer to escalate to human support for detailed assistance
- Include contact information for further help`;
    }

    const overallConfidence = this.calculateOverallConfidence(sources);
    
    if (overallConfidence < this.config.lowConfidenceThreshold) {
      return `LIMITED CONFIDENCE:
- Available sources have low confidence scores
- Acknowledge uncertainty in the available information
- Provide what information is available with appropriate disclaimers
- Suggest verification through official channels
- Offer escalation to human support for authoritative answers
- Include alternative resources or contacts`;
    }

    return `STANDARD FALLBACK:
- Provide available information with appropriate confidence framing
- Use uncertainty language appropriate to confidence level
- Cite sources clearly with confidence indicators
- Offer additional assistance or escalation if needed`;
  }

  /**
   * Process complete confidence enhancement workflow
   * @param {Array} sources - Source documents
   * @param {string} contextType - Context type (product, support, general)
   * @param {string} query - Original user query
   * @returns {Object} Complete confidence analysis results
   */
  processConfidenceEnhancement(sources, contextType, query) {
    const startTime = Date.now();

    try {
      // Calculate overall confidence
      const overallConfidence = this.calculateOverallConfidence(sources);
      const confidenceLevel = this.categorizeConfidenceLevel(overallConfidence);

      // Generate components
      const citations = this.generateSourceCitations(sources);
      const uncertaintyLanguage = this.buildUncertaintyLanguage(confidenceLevel, sources);
      const escalationGuidance = this.generateEscalationPrompts(sources, contextType);
      const responseFraming = this.buildConfidenceFraming(sources, contextType);
      const fallbackPrompts = this.generateFallbackPrompts(sources, contextType);
      const sourceDiversity = this.assessSourceDiversity(sources);

      const processingTime = Date.now() - startTime;

      return {
        // Core confidence metrics
        overallConfidence: Math.round(overallConfidence * 1000) / 1000,
        confidenceLevel,
        
        // Generated content
        citations,
        uncertaintyLanguage,
        escalationGuidance,
        responseFraming,
        fallbackPrompts,
        
        // Analysis metadata
        sourceDiversity,
        processingTime,
        
        // Summary
        summary: {
          sourceCount: sources.length,
          averageConfidence: overallConfidence,
          recommendsEscalation: escalationGuidance.recommended,
          diversityLevel: sourceDiversity.level,
          confidenceCategory: confidenceLevel
        }
      };
    } catch (error) {
      console.error('ConfidenceAwarePrompts - Processing error:', error);
      
      return {
        overallConfidence: 0.5,
        confidenceLevel: 'low',
        citations: '',
        uncertaintyLanguage: 'PROCESSING ERROR: Unable to assess confidence properly',
        escalationGuidance: {
          recommended: true,
          reason: 'processing error occurred',
          urgency: 'medium',
          prompt: 'Due to a processing error, please escalate to human support'
        },
        responseFraming: 'ERROR: Use cautious language due to processing error',
        fallbackPrompts: 'ERROR FALLBACK: Escalate to human support due to processing error',
        sourceDiversity: { level: 'unknown', uniqueTypes: 0, totalSources: 0 },
        processingTime: Date.now() - startTime,
        error: error.message
      };
    }
  }

  /**
   * Update confidence thresholds
   * @param {Object} newThresholds - New threshold values
   */
  updateThresholds(newThresholds) {
    this.config = { ...this.config, ...newThresholds };
    this.confidenceThresholds = {
      high: this.config.highConfidenceThreshold,
      medium: this.config.mediumConfidenceThreshold,
      low: this.config.lowConfidenceThreshold
    };
  }

  /**
   * Get current configuration
   * @returns {Object} Current configuration
   */
  getConfig() {
    return {
      config: { ...this.config },
      thresholds: { ...this.confidenceThresholds }
    };
  }
}

module.exports = { ConfidenceAwarePrompts };