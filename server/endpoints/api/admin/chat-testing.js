const { Workspace } = require("../../../models/workspace");
const { validApiKey } = require("../../../utils/middleware/validApiKey");
const { reqBody } = require("../../../utils/http");
const { Telemetry } = require("../../../models/telemetry");
const { EventLogs } = require("../../../models/eventLogs");
const { streamChatWithWorkspace } = require("../../../utils/chats/stream");
const { DocumentManager } = require("../../../utils/DocumentManager");
const { getLLMProvider } = require("../../../utils/helpers");
const { chatPrompt, recentChatHistory } = require("../../../utils/chats");
const { getVectorDbClass } = require("../../../utils/helpers");
const { v4: uuidv4 } = require("uuid");

/**
 * Chat Testing API Endpoints
 * Provides comprehensive chat testing and validation functionality for administrators
 */
function adminChatTestingEndpoints(app) {
  if (!app) return;

  /**
   * POST /api/v1/admin/chat/test
   * Test chat response generation without affecting production logs
   */
  app.post("/v1/admin/chat/test", [validApiKey], async (request, response) => {
    /*
    #swagger.tags = ['Admin - Chat Testing']
    #swagger.description = 'Test chat response generation with multiple models and analysis'
    #swagger.requestBody = {
      description: 'Chat test configuration',
      required: true,
      content: {
        "application/json": {
          schema: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
                description: 'Test message to send'
              },
              workspaceId: {
                type: 'integer',
                description: 'Workspace ID for context'
              },
              models: {
                type: 'array',
                items: { type: 'string' },
                description: 'Array of model names to test',
                default: ['gpt-3.5-turbo']
              },
              includeDebugInfo: {
                type: 'boolean',
                description: 'Include detailed debug information',
                default: true
              },
              testPromptVariations: {
                type: 'boolean',
                description: 'Test with different prompt variations',
                default: false
              },
              analysisLevel: {
                type: 'string',
                enum: ['basic', 'detailed', 'comprehensive'],
                description: 'Level of response analysis',
                default: 'basic'
              }
            },
            required: ['message', 'workspaceId']
          }
        }
      }
    }
    */
    try {
      const {
        message,
        workspaceId,
        models = ['gpt-3.5-turbo'],
        includeDebugInfo = true,
        testPromptVariations = false,
        analysisLevel = 'basic',
        testSessionId = null
      } = reqBody(request);

      // Validate input
      if (!message || message.trim().length === 0) {
        return response.status(400).json({
          success: false,
          error: "Message is required and cannot be empty"
        });
      }

      if (!workspaceId) {
        return response.status(400).json({
          success: false,
          error: "Workspace ID is required"
        });
      }

      // Get workspace
      const workspace = await Workspace.get({ id: workspaceId });
      if (!workspace) {
        return response.status(404).json({
          success: false,
          error: `Workspace ${workspaceId} not found`
        });
      }

      const testSession = {
        id: testSessionId || uuidv4(),
        startTime: Date.now(),
        message: message.trim(),
        workspace: {
          id: workspace.id,
          name: workspace.name,
          slug: workspace.slug
        },
        models,
        options: {
          includeDebugInfo,
          testPromptVariations,
          analysisLevel
        },
        results: []
      };

      // Test with each specified model
      for (const modelName of models) {
        const modelResult = {
          model: modelName,
          startTime: Date.now(),
          response: null,
          error: null,
          debugInfo: {},
          analysis: {},
          performance: {}
        };

        try {
          // Create test user context (won't be logged)
          const testUser = {
            id: -1, // Special test user ID
            username: 'admin-test',
            testing: true
          };

          // Temporarily override workspace LLM settings if needed
          const originalOpenAiModel = workspace.openAiModel;
          if (modelName !== workspace.openAiModel) {
            workspace.openAiModel = modelName;
          }

          // Execute chat test
          const chatResponse = await chatWithWorkspace(
            workspace,
            message,
            testUser,
            null, // no thread for testing
            {
              testing: true,
              includeDebugInfo,
              skipLogging: true // Don't log test conversations
            }
          );

          modelResult.response = {
            text: chatResponse.textResponse,
            sources: chatResponse.sources || [],
            type: chatResponse.type || 'chat'
          };

          // Restore original model
          workspace.openAiModel = originalOpenAiModel;

          // Collect debug information if requested
          if (includeDebugInfo) {
            modelResult.debugInfo = {
              ragSources: chatResponse.sources?.length || 0,
              contextLength: message.length,
              responseLength: chatResponse.textResponse?.length || 0,
              processingSteps: chatResponse.debugInfo?.steps || [],
              promptUsed: chatResponse.debugInfo?.prompt || null,
              vectorSearchResults: chatResponse.debugInfo?.vectorResults || null
            };
          }

          // Performance metrics
          modelResult.performance = {
            responseTime: Date.now() - modelResult.startTime,
            tokensUsed: chatResponse.debugInfo?.tokensUsed || null,
            vectorSearchTime: chatResponse.debugInfo?.vectorSearchTime || null,
            llmCallTime: chatResponse.debugInfo?.llmCallTime || null
          };

          // Response analysis based on level
          modelResult.analysis = await this._analyzeResponse(
            message,
            modelResult.response,
            analysisLevel,
            workspace
          );

        } catch (error) {
          console.error(`Chat test failed for model ${modelName}:`, error);
          modelResult.error = {
            message: error.message,
            type: error.constructor.name,
            stack: includeDebugInfo ? error.stack : null
          };
          modelResult.performance.responseTime = Date.now() - modelResult.startTime;
        }

        testSession.results.push(modelResult);
      }

      // Test prompt variations if requested
      if (testPromptVariations && testSession.results.length > 0) {
        const variations = await this._generatePromptVariations(message);
        testSession.promptVariations = [];

        for (const variation of variations.slice(0, 3)) { // Limit to 3 variations
          const variationResult = {
            variation: variation.type,
            prompt: variation.prompt,
            results: []
          };

          // Test primary model with variation
          const primaryModel = models[0];
          try {
            const testUser = { id: -1, username: 'admin-test', testing: true };
            const chatResponse = await chatWithWorkspace(
              workspace,
              variation.prompt,
              testUser,
              null,
              { testing: true, skipLogging: true }
            );

            variationResult.results.push({
              model: primaryModel,
              response: chatResponse.textResponse,
              responseTime: chatResponse.responseTime || 0
            });
          } catch (error) {
            variationResult.results.push({
              model: primaryModel,
              error: error.message
            });
          }

          testSession.promptVariations.push(variationResult);
        }
      }

      // Calculate session summary
      testSession.summary = {
        totalModels: models.length,
        successfulResponses: testSession.results.filter(r => !r.error).length,
        failedResponses: testSession.results.filter(r => r.error).length,
        averageResponseTime: testSession.results
          .filter(r => !r.error)
          .reduce((sum, r) => sum + r.performance.responseTime, 0) / 
          Math.max(1, testSession.results.filter(r => !r.error).length),
        totalTestTime: Date.now() - testSession.startTime,
        bestPerformingModel: this._findBestModel(testSession.results),
        qualityScores: testSession.results.map(r => ({
          model: r.model,
          score: r.analysis?.qualityScore || 0
        }))
      };

      // Log test session (but not the actual chat)
      await EventLogs.logEvent("admin_chat_test_executed", {
        testSessionId: testSession.id,
        workspaceId,
        modelsCount: models.length,
        successfulTests: testSession.summary.successfulResponses,
        failedTests: testSession.summary.failedResponses,
        averageResponseTime: testSession.summary.averageResponseTime,
        includeDebugInfo,
        testPromptVariations
      });

      response.status(200).json({
        success: true,
        testSession
      });

    } catch (error) {
      console.error("Chat test error:", error);
      response.status(500).json({
        success: false,
        error: `Chat test failed: ${error.message}`
      });
    }
  });

  /**
   * POST /api/v1/admin/chat/test/batch
   * Execute batch testing with multiple queries
   */
  app.post("/v1/admin/chat/test/batch", [validApiKey], async (request, response) => {
    /*
    #swagger.tags = ['Admin - Chat Testing']
    #swagger.description = 'Execute batch testing with multiple queries and export results'
    */
    try {
      const {
        queries = [],
        workspaceId,
        models = ['gpt-3.5-turbo'],
        parallelLimit = 3,
        includeAnalysis = true,
        exportFormat = 'json'
      } = reqBody(request);

      if (!Array.isArray(queries) || queries.length === 0) {
        return response.status(400).json({
          success: false,
          error: "Queries array is required and cannot be empty"
        });
      }

      if (queries.length > 100) {
        return response.status(400).json({
          success: false,
          error: "Cannot test more than 100 queries at once"
        });
      }

      const workspace = await Workspace.get({ id: workspaceId });
      if (!workspace) {
        return response.status(404).json({
          success: false,
          error: `Workspace ${workspaceId} not found`
        });
      }

      const batchSession = {
        id: uuidv4(),
        startTime: Date.now(),
        workspace: {
          id: workspace.id,
          name: workspace.name,
          slug: workspace.slug
        },
        queries: queries.map(q => typeof q === 'string' ? { text: q } : q),
        models,
        options: { parallelLimit, includeAnalysis, exportFormat },
        results: [],
        summary: {}
      };

      // Process queries in batches to avoid overwhelming the system
      const batches = [];
      for (let i = 0; i < queries.length; i += parallelLimit) {
        batches.push(queries.slice(i, i + parallelLimit));
      }

      let processedCount = 0;

      for (const batch of batches) {
        const batchPromises = batch.map(async (query, index) => {
          const queryText = typeof query === 'string' ? query : query.text;
          const queryId = typeof query === 'object' ? query.id : `query_${processedCount + index + 1}`;

          const queryResult = {
            id: queryId,
            query: queryText,
            models: {},
            startTime: Date.now(),
            endTime: null
          };

          // Test with each model
          for (const model of models) {
            try {
              const testUser = { id: -1, username: 'admin-batch-test', testing: true };
              const originalModel = workspace.openAiModel;
              workspace.openAiModel = model;

              const chatResponse = await chatWithWorkspace(
                workspace,
                queryText,
                testUser,
                null,
                { testing: true, skipLogging: true }
              );

              workspace.openAiModel = originalModel;

              queryResult.models[model] = {
                success: true,
                response: chatResponse.textResponse,
                sources: chatResponse.sources?.length || 0,
                responseTime: chatResponse.responseTime || 0,
                analysis: includeAnalysis ? await this._analyzeResponse(
                  queryText,
                  { text: chatResponse.textResponse, sources: chatResponse.sources },
                  'basic',
                  workspace
                ) : null
              };

            } catch (error) {
              queryResult.models[model] = {
                success: false,
                error: error.message,
                responseTime: 0
              };
            }
          }

          queryResult.endTime = Date.now();
          return queryResult;
        });

        const batchResults = await Promise.all(batchPromises);
        batchSession.results.push(...batchResults);
        
        processedCount += batch.length;
        
        // Brief pause between batches to avoid rate limiting
        if (batches.indexOf(batch) < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Calculate comprehensive summary
      batchSession.summary = {
        totalQueries: queries.length,
        totalModels: models.length,
        totalTests: queries.length * models.length,
        successfulTests: 0,
        failedTests: 0,
        averageResponseTime: 0,
        modelPerformance: {},
        qualityMetrics: {
          averageQualityScore: 0,
          highQualityResponses: 0,
          lowQualityResponses: 0
        },
        totalProcessingTime: Date.now() - batchSession.startTime
      };

      // Aggregate statistics
      let totalResponseTime = 0;
      let totalQualityScore = 0;
      let qualityCount = 0;

      for (const result of batchSession.results) {
        for (const [model, modelResult] of Object.entries(result.models)) {
          if (modelResult.success) {
            batchSession.summary.successfulTests++;
            totalResponseTime += modelResult.responseTime;
            
            if (!batchSession.summary.modelPerformance[model]) {
              batchSession.summary.modelPerformance[model] = {
                successful: 0,
                failed: 0,
                averageResponseTime: 0,
                averageQualityScore: 0
              };
            }
            
            batchSession.summary.modelPerformance[model].successful++;
            
            if (modelResult.analysis?.qualityScore) {
              totalQualityScore += modelResult.analysis.qualityScore;
              qualityCount++;
              
              if (modelResult.analysis.qualityScore >= 0.8) {
                batchSession.summary.qualityMetrics.highQualityResponses++;
              } else if (modelResult.analysis.qualityScore < 0.5) {
                batchSession.summary.qualityMetrics.lowQualityResponses++;
              }
            }
          } else {
            batchSession.summary.failedTests++;
            if (!batchSession.summary.modelPerformance[model]) {
              batchSession.summary.modelPerformance[model] = {
                successful: 0,
                failed: 0,
                averageResponseTime: 0,
                averageQualityScore: 0
              };
            }
            batchSession.summary.modelPerformance[model].failed++;
          }
        }
      }

      batchSession.summary.averageResponseTime = batchSession.summary.successfulTests > 0 ? 
        totalResponseTime / batchSession.summary.successfulTests : 0;
      
      batchSession.summary.qualityMetrics.averageQualityScore = qualityCount > 0 ? 
        totalQualityScore / qualityCount : 0;

      // Calculate model-specific averages
      for (const [model, perf] of Object.entries(batchSession.summary.modelPerformance)) {
        const modelResults = batchSession.results.flatMap(r => 
          r.models[model] && r.models[model].success ? [r.models[model]] : []
        );
        
        if (modelResults.length > 0) {
          perf.averageResponseTime = modelResults.reduce((sum, r) => sum + r.responseTime, 0) / modelResults.length;
          const qualityScores = modelResults.filter(r => r.analysis?.qualityScore).map(r => r.analysis.qualityScore);
          perf.averageQualityScore = qualityScores.length > 0 ? 
            qualityScores.reduce((sum, s) => sum + s, 0) / qualityScores.length : 0;
        }
      }

      // Log batch test session
      await EventLogs.logEvent("admin_chat_batch_tested", {
        batchSessionId: batchSession.id,
        workspaceId,
        totalQueries: queries.length,
        modelsCount: models.length,
        successfulTests: batchSession.summary.successfulTests,
        failedTests: batchSession.summary.failedTests,
        processingTime: batchSession.summary.totalProcessingTime,
        averageQualityScore: batchSession.summary.qualityMetrics.averageQualityScore
      });

      response.status(200).json({
        success: true,
        batchSession
      });

    } catch (error) {
      console.error("Batch chat test error:", error);
      response.status(500).json({
        success: false,
        error: `Batch test failed: ${error.message}`
      });
    }
  });

  /**
   * GET /api/v1/admin/chat/test/history
   * Retrieve chat test session history
   */
  app.get("/v1/admin/chat/test/history", [validApiKey], async (request, response) => {
    /*
    #swagger.tags = ['Admin - Chat Testing']
    #swagger.description = 'Retrieve chat test session history with filtering'
    */
    try {
      const {
        page = 1,
        limit = 20,
        workspaceId = null,
        dateFrom = null,
        dateTo = null,
        sessionType = null // 'single' or 'batch'
      } = request.query;

      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));

      // Build filter conditions for event logs
      const whereClause = {
        eventType: {
          in: ['admin_chat_test_executed', 'admin_chat_batch_tested']
        }
      };

      if (workspaceId) {
        whereClause.metadata = {
          path: ['workspaceId'],
          equals: parseInt(workspaceId)
        };
      }

      if (dateFrom) {
        whereClause.createdAt = {
          ...whereClause.createdAt,
          gte: new Date(dateFrom)
        };
      }

      if (dateTo) {
        whereClause.createdAt = {
          ...whereClause.createdAt,
          lte: new Date(dateTo)
        };
      }

      if (sessionType) {
        const eventType = sessionType === 'batch' ? 'admin_chat_batch_tested' : 'admin_chat_test_executed';
        whereClause.eventType = eventType;
      }

      // Get test history from event logs
      const offset = (pageNum - 1) * limitNum;
      const eventLogs = await EventLogs.where(
        whereClause,
        limitNum,
        { createdAt: 'desc' }
      );

      const totalCount = await EventLogs.count(whereClause);
      const totalPages = Math.ceil(totalCount / limitNum);

      // Transform event logs into test session summaries
      const testSessions = eventLogs.map(log => {
        const metadata = typeof log.metadata === 'string' ? 
          JSON.parse(log.metadata) : log.metadata;

        return {
          sessionId: metadata.testSessionId || metadata.batchSessionId,
          type: log.eventType === 'admin_chat_batch_tested' ? 'batch' : 'single',
          workspaceId: metadata.workspaceId,
          executedAt: log.createdAt,
          summary: {
            modelsCount: metadata.modelsCount,
            successfulTests: metadata.successfulTests,
            failedTests: metadata.failedTests,
            averageResponseTime: metadata.averageResponseTime,
            totalQueries: metadata.totalQueries || 1,
            averageQualityScore: metadata.averageQualityScore || null,
            processingTime: metadata.processingTime
          }
        };
      });

      const result = {
        success: true,
        testSessions,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount,
          totalPages,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        },
        filters: {
          workspaceId,
          dateFrom,
          dateTo,
          sessionType
        }
      };

      response.status(200).json(result);

    } catch (error) {
      console.error("Test history retrieval error:", error);
      response.status(500).json({
        success: false,
        error: `Failed to retrieve test history: ${error.message}`
      });
    }
  });

  /**
   * POST /api/v1/admin/chat/analyze
   * Analyze response quality and accuracy
   */
  app.post("/v1/admin/chat/analyze", [validApiKey], async (request, response) => {
    /*
    #swagger.tags = ['Admin - Chat Testing']
    #swagger.description = 'Analyze chat response quality and accuracy'
    */
    try {
      const {
        query,
        response: chatResponse,
        expectedAnswer = null,
        workspaceId,
        analysisType = 'comprehensive',
        customCriteria = []
      } = reqBody(request);

      if (!query || !chatResponse) {
        return response.status(400).json({
          success: false,
          error: "Query and response are required"
        });
      }

      const workspace = workspaceId ? await Workspace.get({ id: workspaceId }) : null;

      const analysis = await this._analyzeResponse(
        query,
        { text: chatResponse, sources: [] },
        analysisType,
        workspace,
        { expectedAnswer, customCriteria }
      );

      // Log analysis
      await EventLogs.logEvent("admin_response_analyzed", {
        workspaceId,
        analysisType,
        qualityScore: analysis.qualityScore,
        hasExpectedAnswer: !!expectedAnswer,
        customCriteriaCount: customCriteria.length
      });

      response.status(200).json({
        success: true,
        analysis: {
          ...analysis,
          analyzedAt: new Date().toISOString(),
          analysisType
        }
      });

    } catch (error) {
      console.error("Response analysis error:", error);
      response.status(500).json({
        success: false,
        error: `Response analysis failed: ${error.message}`
      });
    }
  });

  /**
   * Helper function to find the best performing model
   */
  this._findBestModel = function(results) {
    if (!results || results.length === 0) return null;

    const validResults = results.filter(r => !r.error && r.response);
    if (validResults.length === 0) return null;

    // Score based on response time and quality
    const scoredResults = validResults.map(result => {
      const responseTime = result.performance?.responseTime || Infinity;
      const qualityScore = result.analysis?.qualityScore || 0;
      const hasSourcesBonus = (result.response?.sources?.length || 0) > 0 ? 0.1 : 0;
      
      // Weighted score: 40% quality, 40% speed, 20% source attribution
      const score = (qualityScore * 0.4) + 
                   ((10000 - Math.min(responseTime, 10000)) / 10000 * 0.4) + 
                   (hasSourcesBonus * 0.2);

      return {
        model: result.model,
        score,
        responseTime,
        qualityScore
      };
    });

    scoredResults.sort((a, b) => b.score - a.score);
    return scoredResults[0];
  };

  /**
   * Helper function to analyze response quality
   */
  this._analyzeResponse = async function(query, response, level = 'basic', workspace = null, options = {}) {
    const analysis = {
      qualityScore: 0,
      criteria: {},
      recommendations: [],
      flags: []
    };

    const responseText = response.text || '';
    const sources = response.sources || [];
    const { expectedAnswer, customCriteria = [] } = options;

    // Basic quality checks
    analysis.criteria.length = {
      score: this._scoreResponseLength(responseText),
      details: `Response length: ${responseText.length} characters`
    };

    analysis.criteria.relevance = {
      score: this._scoreRelevance(query, responseText),
      details: 'Basic keyword matching and topic alignment'
    };

    analysis.criteria.sourceAttribution = {
      score: sources.length > 0 ? 0.8 : 0.2,
      details: `${sources.length} sources cited`
    };

    if (level === 'detailed' || level === 'comprehensive') {
      // Detailed analysis
      analysis.criteria.clarity = {
        score: this._scoreClarity(responseText),
        details: 'Readability and structure assessment'
      };

      analysis.criteria.completeness = {
        score: this._scoreCompleteness(query, responseText),
        details: 'Query fulfillment assessment'
      };

      // Check for common issues
      if (responseText.toLowerCase().includes("i don't know") || 
          responseText.toLowerCase().includes("i cannot")) {
        analysis.flags.push('Uncertainty expressed');
        analysis.criteria.confidence = { score: 0.3, details: 'Low confidence indicators found' };
      } else {
        analysis.criteria.confidence = { score: 0.8, details: 'Confident response tone' };
      }
    }

    if (level === 'comprehensive') {
      // Comprehensive analysis
      if (expectedAnswer) {
        analysis.criteria.accuracy = {
          score: this._scoreAccuracy(responseText, expectedAnswer),
          details: 'Comparison with expected answer'
        };
      }

      // Business rule compliance (placeholder)
      if (workspace) {
        analysis.criteria.businessCompliance = {
          score: 0.7, // Default assumption
          details: 'Basic business rule compliance check'
        };
      }

      // Custom criteria evaluation
      for (const criterion of customCriteria) {
        analysis.criteria[criterion.name] = {
          score: this._evaluateCustomCriterion(responseText, criterion),
          details: criterion.description || 'Custom evaluation'
        };
      }
    }

    // Calculate overall quality score
    const scores = Object.values(analysis.criteria).map(c => c.score);
    analysis.qualityScore = scores.length > 0 ? 
      scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;

    // Generate recommendations
    if (analysis.qualityScore < 0.6) {
      analysis.recommendations.push('Response quality is below acceptable threshold');
    }
    if (sources.length === 0) {
      analysis.recommendations.push('Consider adding source attribution to improve credibility');
    }
    if (responseText.length < 50) {
      analysis.recommendations.push('Response may be too brief for the query complexity');
    }

    return analysis;
  };

  /**
   * Helper scoring functions
   */
  this._scoreResponseLength = function(text) {
    const length = text.length;
    if (length < 20) return 0.2;
    if (length < 50) return 0.4;
    if (length < 200) return 0.8;
    if (length < 1000) return 1.0;
    return 0.9; // Very long responses might be verbose
  };

  this._scoreRelevance = function(query, response) {
    const queryWords = query.toLowerCase().split(/\s+/);
    const responseWords = response.toLowerCase().split(/\s+/);
    
    let matches = 0;
    for (const word of queryWords) {
      if (word.length > 3 && responseWords.includes(word)) {
        matches++;
      }
    }
    
    return Math.min(1.0, matches / Math.max(1, queryWords.length));
  };

  this._scoreClarity = function(text) {
    // Simple readability approximation
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).length;
    const avgWordsPerSentence = words / Math.max(1, sentences.length);
    
    // Optimal: 15-20 words per sentence
    if (avgWordsPerSentence >= 15 && avgWordsPerSentence <= 20) return 1.0;
    if (avgWordsPerSentence >= 10 && avgWordsPerSentence <= 25) return 0.8;
    if (avgWordsPerSentence >= 5 && avgWordsPerSentence <= 30) return 0.6;
    return 0.4;
  };

  this._scoreCompleteness = function(query, response) {
    // Check if response addresses query components
    const queryMarkers = ['what', 'how', 'when', 'where', 'why', 'who'];
    const hasQuestionMarkers = queryMarkers.some(marker => 
      query.toLowerCase().includes(marker)
    );
    
    if (!hasQuestionMarkers) return 0.7; // Default for non-question queries
    
    // Look for answer patterns
    const answerPatterns = ['because', 'due to', 'in order to', 'by', 'through'];
    const hasAnswerPatterns = answerPatterns.some(pattern => 
      response.toLowerCase().includes(pattern)
    );
    
    return hasAnswerPatterns ? 0.8 : 0.5;
  };

  this._scoreAccuracy = function(response, expectedAnswer) {
    // Simple text similarity
    const responseLower = response.toLowerCase();
    const expectedLower = expectedAnswer.toLowerCase();
    
    if (responseLower.includes(expectedLower) || expectedLower.includes(responseLower)) {
      return 1.0;
    }
    
    // Word overlap
    const responseWords = responseLower.split(/\s+/);
    const expectedWords = expectedLower.split(/\s+/);
    
    let overlap = 0;
    for (const word of expectedWords) {
      if (word.length > 3 && responseWords.includes(word)) {
        overlap++;
      }
    }
    
    return Math.min(1.0, overlap / Math.max(1, expectedWords.length));
  };

  this._evaluateCustomCriterion = function(response, criterion) {
    // Basic custom criterion evaluation
    if (criterion.type === 'contains') {
      return response.toLowerCase().includes(criterion.value.toLowerCase()) ? 1.0 : 0.0;
    }
    if (criterion.type === 'not_contains') {
      return !response.toLowerCase().includes(criterion.value.toLowerCase()) ? 1.0 : 0.0;
    }
    if (criterion.type === 'min_length') {
      return response.length >= criterion.value ? 1.0 : 0.5;
    }
    if (criterion.type === 'max_length') {
      return response.length <= criterion.value ? 1.0 : 0.5;
    }
    
    return 0.5; // Default score for unknown criteria
  };

  this._generatePromptVariations = async function(originalPrompt) {
    // Generate simple prompt variations for testing
    return [
      {
        type: 'formal',
        prompt: `Please provide detailed information about: ${originalPrompt}`
      },
      {
        type: 'casual',
        prompt: `Hey, can you tell me about ${originalPrompt}?`
      },
      {
        type: 'specific',
        prompt: `I need specific details regarding ${originalPrompt}. Please include relevant examples.`
      }
    ];
  };
}

/**
 * Non-streaming chat function for testing purposes
 * Simulates chat functionality without streaming responses
 */
async function chatWithWorkspace(workspace, message, chatMode = "chat", user = null, thread = null) {
  try {
    const { chatHistory } = await recentChatHistory(
      user,
      workspace,
      thread,
      10
    );
    
    const prompt = await chatPrompt(workspace, user);
    const LLMConnector = getLLMProvider({
      provider: workspace?.chatProvider || "openai",
      model: workspace?.chatModel || "gpt-3.5-turbo",
    });
    
    if (!LLMConnector) {
      throw new Error("No LLM provider configured");
    }

    // Get context documents (simplified version)
    const contextTexts = [];
    const sources = [];

    if (chatMode === "chat") {
      try {
        const VectorDb = getVectorDbClass();
        if (VectorDb) {
          const docs = await DocumentManager.targetedRetrieve(
            workspace,
            message,
            workspace?.similarityThreshold || 0.25,
            workspace?.topN || 4
          );
          
          for (const doc of docs) {
            contextTexts.push(doc.pageContent);
            sources.push({
              title: doc.title || doc.id,
              chunk: doc.pageContent.slice(0, 100) + "...",
              id: doc.id
            });
          }
        }
      } catch (error) {
        console.warn("Context retrieval failed:", error.message);
      }
    }

    // Build the full context
    const contextString = contextTexts.length > 0 
      ? `Context information:\n${contextTexts.join("\n\n")}\n\n` 
      : "";
    
    const fullPrompt = `${prompt}\n\n${contextString}Human: ${message}\n\nAssistant:`;

    // Get response from LLM
    const result = await LLMConnector.getChatCompletion(
      [{ role: "user", content: fullPrompt }],
      {
        temperature: workspace?.openAiTemp || 0.7,
        max_tokens: 1000
      }
    );

    if (!result || !result.content) {
      throw new Error("No response from LLM provider");
    }

    return {
      success: true,
      textResponse: result.content,
      sources: sources,
      chatId: uuidv4(),
      responseTime: Date.now(),
      model: workspace?.chatModel || "gpt-3.5-turbo"
    };

  } catch (error) {
    console.error("Chat error:", error);
    return {
      success: false,
      error: error.message,
      textResponse: null,
      sources: [],
      chatId: uuidv4(),
      responseTime: Date.now()
    };
  }
}

module.exports = { adminChatTestingEndpoints };