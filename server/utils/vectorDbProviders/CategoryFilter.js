/**
 * Category-Based Filtering for Vector Search
 * Phase 1.2 - Day 4: Pre-filtering by categories with include/exclude logic
 * 
 * This module provides category-based filtering capabilities for vector searches
 * to ensure only relevant documents are considered during retrieval.
 */

class CategoryFilter {
  constructor() {
    this.filterStrategies = {
      include: this.includeStrategy.bind(this),
      exclude: this.excludeStrategy.bind(this),
      hierarchical: this.hierarchicalStrategy.bind(this),
      weighted: this.weightedStrategy.bind(this)
    };
  }

  /**
   * Apply category-based filtering to search parameters
   * @param {Object} searchParams - Original search parameters
   * @param {Object} filterConfig - Category filtering configuration
   * @returns {Object} Enhanced search parameters with category filters
   */
  applyFilter(searchParams = {}, filterConfig = {}) {
    const {
      strategy = 'include',
      categories = [],
      hierarchyDelimiter = '/',
      weights = {},
      strictMode = false
    } = filterConfig;

    if (!categories || categories.length === 0) {
      return searchParams;
    }

    const strategyHandler = this.filterStrategies[strategy];
    if (!strategyHandler) {
      console.warn(`Unknown filter strategy: ${strategy}, defaulting to 'include'`);
      return this.includeStrategy(searchParams, categories, { strictMode });
    }

    return strategyHandler(searchParams, categories, {
      hierarchyDelimiter,
      weights,
      strictMode
    });
  }

  /**
   * Include strategy - only return documents in specified categories
   */
  includeStrategy(searchParams, categories, options = {}) {
    const { strictMode = false } = options;
    
    return {
      ...searchParams,
      where: {
        ...(searchParams.where || {}),
        category: {
          [strictMode ? 'in' : 'inAny']: categories
        }
      }
    };
  }

  /**
   * Exclude strategy - return all documents except those in specified categories
   */
  excludeStrategy(searchParams, categories, options = {}) {
    return {
      ...searchParams,
      where: {
        ...(searchParams.where || {}),
        category: {
          notIn: categories
        }
      }
    };
  }

  /**
   * Hierarchical strategy - support category hierarchies like "Products/Electronics/Phones"
   */
  hierarchicalStrategy(searchParams, categories, options = {}) {
    const { hierarchyDelimiter = '/' } = options;
    const expandedCategories = this.expandHierarchicalCategories(categories, hierarchyDelimiter);
    
    return {
      ...searchParams,
      where: {
        ...(searchParams.where || {}),
        category: {
          inAny: expandedCategories
        }
      }
    };
  }

  /**
   * Weighted strategy - apply different weights to different categories
   */
  weightedStrategy(searchParams, categories, options = {}) {
    const { weights = {} } = options;
    
    // Create weighted category conditions
    const weightedConditions = categories.map(category => ({
      category,
      weight: weights[category] || 1.0
    }));

    return {
      ...searchParams,
      where: {
        ...(searchParams.where || {}),
        category: {
          in: categories
        }
      },
      // Add weight information for post-processing
      categoryWeights: weightedConditions
    };
  }

  /**
   * Expand hierarchical categories to include parent categories
   * @param {string[]} categories - List of categories
   * @param {string} delimiter - Hierarchy delimiter
   * @returns {string[]} Expanded category list
   */
  expandHierarchicalCategories(categories, delimiter = '/') {
    const expanded = new Set();
    
    categories.forEach(category => {
      expanded.add(category);
      
      // Add all parent categories
      const parts = category.split(delimiter);
      for (let i = 1; i < parts.length; i++) {
        const parent = parts.slice(0, i).join(delimiter);
        expanded.add(parent);
      }
    });
    
    return Array.from(expanded);
  }

  /**
   * Build dynamic category filter based on user query
   * @param {string} query - User query
   * @param {Object} categoryMapping - Query pattern to category mapping
   * @returns {Object} Dynamic filter configuration
   */
  buildDynamicFilter(query, categoryMapping = {}) {
    const lowerQuery = query.toLowerCase();
    const detectedCategories = [];
    
    // Check for category indicators in query
    Object.entries(categoryMapping).forEach(([pattern, category]) => {
      if (lowerQuery.includes(pattern.toLowerCase())) {
        detectedCategories.push(category);
      }
    });

    // If no categories detected, return null to indicate no filtering
    if (detectedCategories.length === 0) {
      return null;
    }

    return {
      strategy: 'include',
      categories: detectedCategories,
      strictMode: false
    };
  }

  /**
   * Apply category boost to search results based on category relevance
   * @param {Array} results - Search results
   * @param {Object} boostConfig - Category boost configuration
   * @returns {Array} Results with adjusted scores
   */
  applyCategoryBoost(results, boostConfig = {}) {
    const {
      categoryBoosts = {},
      defaultBoost = 1.0,
      maxBoost = 2.0
    } = boostConfig;

    return results.map(result => {
      const category = result.metadata?.category;
      if (!category) return result;

      const boost = Math.min(
        categoryBoosts[category] || defaultBoost,
        maxBoost
      );

      return {
        ...result,
        originalScore: result.score || 0,
        score: (result.score || 0) * boost,
        categoryBoost: boost
      };
    });
  }

  /**
   * Get category statistics from search results
   * @param {Array} results - Search results
   * @returns {Object} Category distribution statistics
   */
  getCategoryStats(results) {
    const stats = {
      total: results.length,
      byCategory: {},
      distribution: []
    };

    results.forEach(result => {
      const category = result.metadata?.category || 'uncategorized';
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
    });

    // Calculate distribution percentages
    Object.entries(stats.byCategory).forEach(([category, count]) => {
      stats.distribution.push({
        category,
        count,
        percentage: (count / stats.total) * 100
      });
    });

    // Sort by count descending
    stats.distribution.sort((a, b) => b.count - a.count);

    return stats;
  }

  /**
   * Validate category configuration
   * @param {Object} config - Category configuration
   * @returns {Object} Validation result
   */
  validateConfig(config) {
    const errors = [];
    const warnings = [];

    if (config.strategy && !this.filterStrategies[config.strategy]) {
      errors.push(`Invalid strategy: ${config.strategy}`);
    }

    if (config.categories && !Array.isArray(config.categories)) {
      errors.push('Categories must be an array');
    }

    if (config.weights && typeof config.weights !== 'object') {
      errors.push('Weights must be an object');
    }

    if (config.categories && config.categories.length > 100) {
      warnings.push('Large number of categories may impact performance');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Merge multiple filter configurations
   * @param {Array} configs - Array of filter configurations
   * @returns {Object} Merged configuration
   */
  mergeConfigs(...configs) {
    const merged = {
      strategy: 'include',
      categories: [],
      weights: {},
      strictMode: false
    };

    configs.forEach(config => {
      if (!config) return;

      if (config.strategy) merged.strategy = config.strategy;
      if (config.strictMode !== undefined) merged.strictMode = config.strictMode;
      
      if (config.categories) {
        merged.categories = [...new Set([...merged.categories, ...config.categories])];
      }
      
      if (config.weights) {
        merged.weights = { ...merged.weights, ...config.weights };
      }
    });

    return merged;
  }
}

// Export singleton instance
module.exports = { CategoryFilter: new CategoryFilter() };