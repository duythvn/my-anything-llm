/**
 * Relevance Scoring Algorithm for Vector Search Results
 * Phase 1.2 - Day 4: Multi-factor scoring with configurable weights
 * 
 * This module provides advanced relevance scoring capabilities for search results
 * by combining multiple factors to produce accurate and contextual rankings.
 */

class RelevanceScorer {
  constructor(config = {}) {
    this.defaultWeights = {
      vectorSimilarity: 0.4,      // Base vector similarity score
      textMatch: 0.2,             // Keyword/phrase matching
      sourceReliability: 0.15,    // Source trust score
      freshness: 0.1,             // Temporal relevance
      categoryMatch: 0.1,         // Category alignment
      userPreference: 0.05        // User-specific preferences
    };
    
    this.weights = { ...this.defaultWeights, ...(config.weights || {}) };
    this.normalizeWeights();
    
    this.config = {
      freshnessDecayDays: config.freshnessDecayDays || 90,
      minScore: config.minScore || 0.1,
      maxScore: config.maxScore || 1.0,
      boostFactors: config.boostFactors || {},
      penaltyFactors: config.penaltyFactors || {}
    };
  }

  /**
   * Score a single search result using multiple factors
   * @param {Object} result - Search result with metadata
   * @param {Object} context - Query context and preferences
   * @returns {Object} Enhanced result with detailed scoring
   */
  scoreResult(result, context = {}) {
    const {
      query = '',
      userPreferences = {},
      categoryContext = null,
      timeContext = new Date()
    } = context;

    // Calculate individual factor scores
    const scores = {
      vectorSimilarity: this.calculateVectorSimilarity(result),
      textMatch: this.calculateTextMatch(result, query),
      sourceReliability: this.calculateSourceReliability(result),
      freshness: this.calculateFreshness(result, timeContext),
      categoryMatch: this.calculateCategoryMatch(result, categoryContext),
      userPreference: this.calculateUserPreference(result, userPreferences)
    };

    // Apply weights to calculate composite score
    let compositeScore = 0;
    Object.entries(scores).forEach(([factor, score]) => {
      compositeScore += score * this.weights[factor];
    });

    // Apply boost and penalty factors
    compositeScore = this.applyModifiers(compositeScore, result, context);

    // Ensure score is within bounds
    compositeScore = Math.max(this.config.minScore, 
                     Math.min(this.config.maxScore, compositeScore));

    return {
      ...result,
      relevanceScore: compositeScore,
      scoreBreakdown: scores,
      scoreFactors: this.getScoreExplanation(scores, compositeScore)
    };
  }

  /**
   * Score multiple results and rank them
   * @param {Array} results - Array of search results
   * @param {Object} context - Query context
   * @returns {Array} Scored and ranked results
   */
  scoreResults(results, context = {}) {
    const scoredResults = results.map(result => 
      this.scoreResult(result, context)
    );

    // Sort by relevance score descending
    scoredResults.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Apply diversity boosting if enabled
    if (context.diversityBoost) {
      return this.applyDiversityBoost(scoredResults);
    }

    return scoredResults;
  }

  /**
   * Calculate vector similarity score (0-1)
   */
  calculateVectorSimilarity(result) {
    // Use existing similarity/distance score if available
    if (result.score !== undefined) {
      return Math.max(0, Math.min(1, result.score));
    }
    if (result.similarity !== undefined) {
      return Math.max(0, Math.min(1, result.similarity));
    }
    // Default to middle score if no vector score available
    return 0.5;
  }

  /**
   * Calculate text matching score using keyword analysis
   */
  calculateTextMatch(result, query) {
    if (!query || !result.metadata?.text) return 0;

    const text = result.metadata.text.toLowerCase();
    const queryTerms = query.toLowerCase().split(/\s+/);
    
    let matchScore = 0;
    let exactMatches = 0;
    let partialMatches = 0;

    queryTerms.forEach(term => {
      if (text.includes(term)) {
        // Exact word match
        const wordRegex = new RegExp(`\\b${term}\\b`, 'g');
        const exactCount = (text.match(wordRegex) || []).length;
        if (exactCount > 0) {
          exactMatches += exactCount;
        } else {
          // Partial match
          partialMatches++;
        }
      }
    });

    // Calculate normalized score
    const totalTerms = queryTerms.length;
    if (totalTerms === 0) return 0;

    // Exact matches are worth more than partial matches
    matchScore = (exactMatches + (partialMatches * 0.5)) / (totalTerms * 2);
    
    // Boost for query phrases found intact
    if (text.includes(query.toLowerCase())) {
      matchScore = Math.min(1, matchScore * 1.5);
    }

    return Math.min(1, matchScore);
  }

  /**
   * Calculate source reliability score
   */
  calculateSourceReliability(result) {
    const metadata = result.metadata || {};
    
    // Base reliability on source type
    const sourceTypeScores = {
      'official_docs': 1.0,
      'product_catalog': 0.9,
      'faq': 0.8,
      'user_upload': 0.7,
      'web_scrape': 0.6,
      'unknown': 0.5
    };

    const sourceType = metadata.sourceType || 'unknown';
    let score = sourceTypeScores[sourceType] || 0.5;

    // Adjust based on source metadata
    if (metadata.isVerified) score *= 1.1;
    if (metadata.priority === 'high') score *= 1.1;
    if (metadata.syncEnabled) score *= 1.05;

    return Math.min(1, score);
  }

  /**
   * Calculate freshness score based on document age
   */
  calculateFreshness(result, currentTime) {
    const metadata = result.metadata || {};
    const lastUpdated = metadata.lastModified || metadata.createdAt;
    
    if (!lastUpdated) return 0.5; // Default for unknown age

    const docDate = new Date(lastUpdated);
    const ageInDays = (currentTime - docDate) / (1000 * 60 * 60 * 24);
    
    // Exponential decay function
    const decayRate = 1 / this.config.freshnessDecayDays;
    const freshnessScore = Math.exp(-decayRate * ageInDays);
    
    return Math.max(0, Math.min(1, freshnessScore));
  }

  /**
   * Calculate category match score
   */
  calculateCategoryMatch(result, categoryContext) {
    if (!categoryContext || !result.metadata?.category) return 0.5;

    const docCategory = result.metadata.category;
    
    // Exact match
    if (docCategory === categoryContext) return 1.0;
    
    // Check hierarchical match
    if (typeof docCategory === 'string' && typeof categoryContext === 'string') {
      // Parent category match
      if (docCategory.startsWith(categoryContext + '/') || 
          categoryContext.startsWith(docCategory + '/')) {
        return 0.8;
      }
      
      // Sibling category (same parent)
      const docParts = docCategory.split('/');
      const contextParts = categoryContext.split('/');
      if (docParts[0] === contextParts[0] && docParts.length > 1 && contextParts.length > 1) {
        return 0.6;
      }
    }
    
    return 0.3; // Different category
  }

  /**
   * Calculate user preference score
   */
  calculateUserPreference(result, preferences) {
    if (!preferences || Object.keys(preferences).length === 0) return 0.5;

    let score = 0.5; // Neutral starting point
    const metadata = result.metadata || {};

    // Check source preferences
    if (preferences.preferredSources?.includes(metadata.sourceType)) {
      score += 0.2;
    }
    
    // Check category preferences
    if (preferences.preferredCategories?.includes(metadata.category)) {
      score += 0.2;
    }
    
    // Check language preferences
    if (preferences.language && metadata.language === preferences.language) {
      score += 0.1;
    }

    return Math.min(1, score);
  }

  /**
   * Apply boost and penalty modifiers
   */
  applyModifiers(baseScore, result, context) {
    let modifiedScore = baseScore;
    const metadata = result.metadata || {};

    // Apply boosts
    Object.entries(this.config.boostFactors).forEach(([factor, boost]) => {
      if (this.checkBoostCondition(factor, metadata, context)) {
        modifiedScore *= (1 + boost);
      }
    });

    // Apply penalties
    Object.entries(this.config.penaltyFactors).forEach(([factor, penalty]) => {
      if (this.checkPenaltyCondition(factor, metadata, context)) {
        modifiedScore *= (1 - penalty);
      }
    });

    return modifiedScore;
  }

  /**
   * Check if boost condition is met
   */
  checkBoostCondition(factor, metadata, context) {
    switch (factor) {
      case 'exactMatch':
        return context.query && 
               metadata.text?.toLowerCase().includes(context.query.toLowerCase());
      case 'recentlyUpdated':
        const updateDate = new Date(metadata.lastModified || metadata.createdAt);
        const daysSinceUpdate = (new Date() - updateDate) / (1000 * 60 * 60 * 24);
        return daysSinceUpdate < 7;
      case 'highPriority':
        return metadata.priority === 'high';
      default:
        return false;
    }
  }

  /**
   * Check if penalty condition is met
   */
  checkPenaltyCondition(factor, metadata, context) {
    switch (factor) {
      case 'stale':
        const docDate = new Date(metadata.lastModified || metadata.createdAt);
        const daysSinceUpdate = (new Date() - docDate) / (1000 * 60 * 60 * 24);
        return daysSinceUpdate > 365; // Over a year old
      case 'lowConfidence':
        return metadata.confidence && metadata.confidence < 0.5;
      case 'deprecated':
        return metadata.status === 'deprecated';
      default:
        return false;
    }
  }

  /**
   * Apply diversity boosting to prevent similar results clustering
   */
  applyDiversityBoost(results) {
    const boostedResults = [...results];
    const seenCategories = new Set();
    const seenSources = new Set();

    boostedResults.forEach((result, index) => {
      const category = result.metadata?.category;
      const source = result.metadata?.sourceType;
      
      // Penalize repeated categories/sources
      let diversityPenalty = 0;
      
      if (category && seenCategories.has(category)) {
        diversityPenalty += 0.1;
      }
      if (source && seenSources.has(source)) {
        diversityPenalty += 0.05;
      }
      
      // Apply penalty
      result.relevanceScore *= (1 - diversityPenalty);
      
      // Track seen items
      if (category) seenCategories.add(category);
      if (source) seenSources.add(source);
    });

    // Re-sort after diversity adjustment
    boostedResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    return boostedResults;
  }

  /**
   * Get human-readable explanation of score factors
   */
  getScoreExplanation(scores, finalScore) {
    const explanation = [];
    const sortedFactors = Object.entries(scores)
      .sort((a, b) => (b[1] * this.weights[b[0]]) - (a[1] * this.weights[a[0]]));

    sortedFactors.forEach(([factor, score]) => {
      const contribution = score * this.weights[factor];
      const percentage = (contribution / finalScore) * 100;
      
      explanation.push({
        factor,
        score: score.toFixed(3),
        weight: this.weights[factor],
        contribution: contribution.toFixed(3),
        percentage: percentage.toFixed(1) + '%'
      });
    });

    return explanation;
  }

  /**
   * Normalize weights to sum to 1
   */
  normalizeWeights() {
    const sum = Object.values(this.weights).reduce((acc, val) => acc + val, 0);
    if (sum > 0) {
      Object.keys(this.weights).forEach(key => {
        this.weights[key] = this.weights[key] / sum;
      });
    }
  }

  /**
   * Update scoring weights
   */
  updateWeights(newWeights) {
    this.weights = { ...this.weights, ...newWeights };
    this.normalizeWeights();
  }

  /**
   * Get current configuration
   */
  getConfig() {
    return {
      weights: { ...this.weights },
      config: { ...this.config }
    };
  }
}

module.exports = { RelevanceScorer };