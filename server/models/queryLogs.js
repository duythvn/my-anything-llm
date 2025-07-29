/**
 * Phase 1.2: Query Logs Model
 * Comprehensive logging system for chat queries and responses
 * Designed for LLM-as-judge evaluation and performance analysis
 */

const prisma = require("../utils/prisma");
const { safeJsonParse } = require("../utils/http");

const QueryLogs = {
  /**
   * Log a chat query and response for evaluation
   * @param {object} queryData - Complete query/response information
   * @returns {Promise<object|null>}
   */
  logQuery: async function (queryData) {
    try {
      const {
        workspaceId,
        userId = null,
        sessionId = null,
        query,
        retrievedDocs = [],
        response,
        llmProvider = null,
        llmModel = null,
        metadata = {},
        responseTime = null,
        sources = [],
        confidence = null,
        feedback = null
      } = queryData;

      const logEntry = await prisma.query_logs.create({
        data: {
          workspaceId,
          userId,
          sessionId,
          query: query.trim(),
          retrievedDocs: JSON.stringify(retrievedDocs),
          response: response.trim(),
          llmProvider,
          llmModel,
          responseTime,
          confidence,
          sources: JSON.stringify(sources),
          metadata: JSON.stringify({
            timestamp: new Date().toISOString(),
            userAgent: metadata.userAgent || null,
            ipAddress: metadata.ipAddress || null,
            retrievalMethod: metadata.retrievalMethod || 'default',
            vectorProvider: metadata.vectorProvider || null,
            embedding: metadata.embedding || null,
            ...metadata
          }),
          feedback,
          createdAt: new Date()
        }
      });

      return logEntry;
    } catch (error) {
      console.error("QueryLogs - Failed to log query:", error.message);
      return null;
    }
  },

  /**
   * Update query log with user feedback
   * @param {number} logId 
   * @param {object} feedbackData 
   * @returns {Promise<boolean>}
   */
  updateFeedback: async function (logId, feedbackData) {
    try {
      const {
        helpful = null,
        accurate = null,
        relevant = null,
        complete = null,
        rating = null,
        comment = null,
        feedbackType = 'user'
      } = feedbackData;

      const feedback = {
        helpful,
        accurate,
        relevant,
        complete,
        rating,
        comment,
        feedbackType,
        submittedAt: new Date().toISOString()
      };

      await prisma.query_logs.update({
        where: { id: logId },
        data: { 
          feedback: JSON.stringify(feedback),
          updatedAt: new Date()
        }
      });

      return true;
    } catch (error) {
      console.error("QueryLogs - Failed to update feedback:", error.message);
      return false;
    }
  },

  /**
   * Add LLM-as-judge evaluation to query log
   * @param {number} logId 
   * @param {object} evaluationData 
   * @returns {Promise<boolean>}
   */
  addEvaluation: async function (logId, evaluationData) {
    try {
      const {
        evaluatorModel = null,
        scores = {},
        reasoning = null,
        categories = [],
        issues = [],
        suggestions = [],
        overallScore = null
      } = evaluationData;

      const evaluation = {
        evaluatorModel,
        scores, // { relevance: 0.85, accuracy: 0.90, completeness: 0.75, etc. }
        reasoning,
        categories, // ['accurate', 'helpful', 'complete'] or ['inaccurate', 'incomplete']
        issues, // Array of identified issues
        suggestions, // Array of improvement suggestions
        overallScore,
        evaluatedAt: new Date().toISOString()
      };

      // Get existing metadata and add evaluation
      const existingLog = await this.get({ id: logId });
      if (!existingLog) return false;

      const metadata = safeJsonParse(existingLog.metadata, {});
      metadata.llmEvaluation = evaluation;

      await prisma.query_logs.update({
        where: { id: logId },
        data: { 
          metadata: JSON.stringify(metadata),
          updatedAt: new Date()
        }
      });

      return true;
    } catch (error) {
      console.error("QueryLogs - Failed to add evaluation:", error.message);
      return false;
    }
  },

  /**
   * Get query logs with filtering and pagination
   * @param {object} filters 
   * @param {object} options 
   * @returns {Promise<Array>}
   */
  getLogs: async function (filters = {}, options = {}) {
    try {
      const {
        limit = 50,
        offset = 0,
        orderBy = 'createdAt',
        order = 'desc',
        includeFeedback = false,
        includeEvaluations = false
      } = options;

      const whereClause = {};

      if (filters.workspaceId) whereClause.workspaceId = filters.workspaceId;
      if (filters.userId) whereClause.userId = filters.userId;
      if (filters.sessionId) whereClause.sessionId = filters.sessionId;
      if (filters.llmProvider) whereClause.llmProvider = filters.llmProvider;
      if (filters.dateFrom) whereClause.createdAt = { gte: new Date(filters.dateFrom) };
      if (filters.dateTo) {
        if (whereClause.createdAt) {
          whereClause.createdAt.lte = new Date(filters.dateTo);
        } else {
          whereClause.createdAt = { lte: new Date(filters.dateTo) };
        }
      }
      if (filters.hasResponse !== undefined) {
        whereClause.response = filters.hasResponse ? { not: null } : null;
      }
      if (filters.hasFeedback !== undefined) {
        whereClause.feedback = filters.hasFeedback ? { not: null } : null;
      }
      if (filters.minConfidence !== undefined) {
        whereClause.confidence = { gte: filters.minConfidence };
      }

      const logs = await prisma.query_logs.findMany({
        where: whereClause,
        orderBy: { [orderBy]: order },
        take: limit,
        skip: offset
      });

      return logs.map(log => ({
        ...log,
        retrievedDocs: safeJsonParse(log.retrievedDocs, []),
        sources: safeJsonParse(log.sources, []),
        metadata: safeJsonParse(log.metadata, {}),
        feedback: includeFeedback ? safeJsonParse(log.feedback, null) : undefined,
        evaluation: includeEvaluations ? safeJsonParse(log.metadata, {}).llmEvaluation : undefined
      }));

    } catch (error) {
      console.error("QueryLogs - Failed to get logs:", error.message);
      return [];
    }
  },

  /**
   * Get query log by ID
   * @param {object} clause 
   * @returns {Promise<object|null>}
   */
  get: async function (clause = {}) {
    try {
      const log = await prisma.query_logs.findFirst({
        where: clause
      });

      if (!log) return null;

      return {
        ...log,
        retrievedDocs: safeJsonParse(log.retrievedDocs, []),
        sources: safeJsonParse(log.sources, []),
        metadata: safeJsonParse(log.metadata, {}),
        feedback: safeJsonParse(log.feedback, null)
      };
    } catch (error) {
      console.error("QueryLogs - Failed to get log:", error.message);
      return null;
    }
  },

  /**
   * Get analytics and statistics
   * @param {object} filters 
   * @returns {Promise<object>}
   */
  getAnalytics: async function (filters = {}) {
    try {
      const whereClause = {};
      if (filters.workspaceId) whereClause.workspaceId = filters.workspaceId;
      if (filters.dateFrom) whereClause.createdAt = { gte: new Date(filters.dateFrom) };
      if (filters.dateTo) {
        if (whereClause.createdAt) {
          whereClause.createdAt.lte = new Date(filters.dateTo);
        } else {
          whereClause.createdAt = { lte: new Date(filters.dateTo) };
        }
      }

      const [
        totalQueries,
        queriesWithFeedback,
        queriesWithConfidence,
        avgResponseTime,
        topProviders,
        recentQueries
      ] = await Promise.all([
        // Total queries
        prisma.query_logs.count({ where: whereClause }),

        // Queries with feedback
        prisma.query_logs.count({ 
          where: { ...whereClause, feedback: { not: null } }
        }),

        // Queries with confidence scores
        prisma.query_logs.count({ 
          where: { ...whereClause, confidence: { not: null } }
        }),

        // Average response time
        prisma.query_logs.aggregate({
          where: { ...whereClause, responseTime: { not: null } },
          _avg: { responseTime: true }
        }),

        // Top LLM providers
        prisma.query_logs.groupBy({
          by: ['llmProvider'],
          where: { ...whereClause, llmProvider: { not: null } },
          _count: { llmProvider: true },
          orderBy: { _count: { llmProvider: 'desc' } },
          take: 10
        }),

        // Recent query patterns
        prisma.query_logs.findMany({
          where: whereClause,
          select: {
            query: true,
            confidence: true,
            responseTime: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 100
        })
      ]);

      // Calculate confidence statistics
      const confidenceStats = queriesWithConfidence > 0 ? 
        await this._calculateConfidenceStats(whereClause) : null;

      // Calculate feedback statistics
      const feedbackStats = queriesWithFeedback > 0 ? 
        await this._calculateFeedbackStats(whereClause) : null;

      return {
        overview: {
          totalQueries,
          queriesWithFeedback,
          queriesWithConfidence,
          feedbackRate: totalQueries > 0 ? (queriesWithFeedback / totalQueries) * 100 : 0,
          avgResponseTime: avgResponseTime._avg.responseTime || 0
        },
        providers: topProviders.map(p => ({
          provider: p.llmProvider,
          count: p._count.llmProvider
        })),
        confidence: confidenceStats,
        feedback: feedbackStats,
        recentPatterns: this._analyzeQueryPatterns(recentQueries)
      };

    } catch (error) {
      console.error("QueryLogs - Failed to get analytics:", error.message);
      return {
        overview: { totalQueries: 0, queriesWithFeedback: 0, queriesWithConfidence: 0, feedbackRate: 0, avgResponseTime: 0 },
        providers: [],
        confidence: null,
        feedback: null,
        recentPatterns: { common_words: [], avg_length: 0, question_types: {} }
      };
    }
  },

  /**
   * Delete old query logs (for data retention)
   * @param {number} daysToKeep 
   * @returns {Promise<number>}
   */
  cleanup: async function (daysToKeep = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await prisma.query_logs.deleteMany({
        where: {
          createdAt: { lt: cutoffDate }
        }
      });

      console.log(`QueryLogs - Cleaned up ${result.count} old query logs`);
      return result.count;
    } catch (error) {
      console.error("QueryLogs - Failed to cleanup:", error.message);
      return 0;
    }
  },

  /**
   * Calculate confidence score statistics
   * @private
   */
  _calculateConfidenceStats: async function (whereClause) {
    try {
      const confidenceData = await prisma.query_logs.findMany({
        where: { ...whereClause, confidence: { not: null } },
        select: { confidence: true }
      });

      if (confidenceData.length === 0) return null;

      const scores = confidenceData.map(d => d.confidence).sort((a, b) => a - b);
      const sum = scores.reduce((a, b) => a + b, 0);
      const avg = sum / scores.length;
      const median = scores[Math.floor(scores.length / 2)];
      const min = scores[0];
      const max = scores[scores.length - 1];

      return { avg, median, min, max, count: scores.length };
    } catch (error) {
      return null;
    }
  },

  /**
   * Calculate feedback statistics
   * @private
   */
  _calculateFeedbackStats: async function (whereClause) {
    try {
      const feedbackData = await prisma.query_logs.findMany({
        where: { ...whereClause, feedback: { not: null } },
        select: { feedback: true }
      });

      if (feedbackData.length === 0) return null;

      let helpful = 0, accurate = 0, relevant = 0, complete = 0;
      let totalRating = 0, ratingCount = 0;

      feedbackData.forEach(item => {
        const feedback = safeJsonParse(item.feedback, {});
        if (feedback.helpful === true) helpful++;
        if (feedback.accurate === true) accurate++;
        if (feedback.relevant === true) relevant++;
        if (feedback.complete === true) complete++;
        if (feedback.rating && !isNaN(feedback.rating)) {
          totalRating += feedback.rating;
          ratingCount++;
        }
      });

      const total = feedbackData.length;
      return {
        helpful: (helpful / total) * 100,
        accurate: (accurate / total) * 100,
        relevant: (relevant / total) * 100,
        complete: (complete / total) * 100,
        avgRating: ratingCount > 0 ? totalRating / ratingCount : null,
        totalFeedback: total
      };
    } catch (error) {
      return null;
    }
  },

  /**
   * Analyze query patterns
   * @private
   */
  _analyzeQueryPatterns: function (queries) {
    const words = {};
    const questionTypes = { what: 0, how: 0, why: 0, when: 0, where: 0, who: 0, other: 0 };
    let totalLength = 0;

    queries.forEach(q => {
      const query = q.query.toLowerCase();
      totalLength += query.length;

      // Count question types
      if (query.startsWith('what')) questionTypes.what++;
      else if (query.startsWith('how')) questionTypes.how++;
      else if (query.startsWith('why')) questionTypes.why++;
      else if (query.startsWith('when')) questionTypes.when++;
      else if (query.startsWith('where')) questionTypes.where++;
      else if (query.startsWith('who')) questionTypes.who++;
      else questionTypes.other++;

      // Count common words (simple tokenization)
      const tokens = query.split(/\s+/).filter(word => word.length > 3);
      tokens.forEach(token => {
        words[token] = (words[token] || 0) + 1;
      });
    });

    const commonWords = Object.entries(words)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }));

    return {
      common_words: commonWords,
      avg_length: queries.length > 0 ? totalLength / queries.length : 0,
      question_types: questionTypes
    };
  }
};

module.exports = { QueryLogs };