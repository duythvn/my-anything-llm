const { v4: uuidv4 } = require("uuid");
const { WorkspaceChats } = require("../../models/workspaceChats");
const { getVectorDbClass, getLLMProvider } = require("../helpers");
const { Product } = require("../../models/products");
const { writeResponseChunk } = require("../helpers/chat/responses");

/**
 * Enhanced B2B Chat Handler
 * Handles product queries, enhanced source attribution, and B2B-specific features
 */
class B2BChatHandler {
  constructor() {
    this.productQueryKeywords = [
      "product",
      "item",
      "sku",
      "price",
      "cost",
      "buy",
      "purchase",
      "order",
      "availability",
      "in stock",
      "out of stock",
      "specifications",
      "specs",
      "features",
      "details",
      "category",
      "catalog",
      "compare",
      "similar",
    ];
  }

  /**
   * Determine if query is product-related
   */
  isProductQuery(message) {
    const lowerMessage = message.toLowerCase();
    return this.productQueryKeywords.some((keyword) =>
      lowerMessage.includes(keyword)
    );
  }

  /**
   * Enhanced chat handler with B2B features
   */
  async chatSync({
    workspace,
    message,
    mode = "chat",
    user = null,
    thread = null,
    sessionId = null,
    attachments = [],
    reset = false,
  }) {
    const chatId = uuidv4();

    try {
      // Handle reset request
      if (reset) {
        await WorkspaceChats.markHistoryInvalid(workspace.id, user, thread);
        return {
          id: chatId,
          type: "textResponse",
          textResponse: "Chat history has been reset.",
          sources: [],
          close: true,
          error: null,
        };
      }

      // Enhanced B2B processing
      const isProductRelated = this.isProductQuery(message);
      let productContext = [];
      let enhancedSources = [];

      // If product-related, search products first
      if (isProductRelated) {
        productContext = await this.getProductContext(message, workspace.id);
        enhancedSources = productContext.map((product) => ({
          title: `Product: ${product.name}`,
          chunk: `${product.name} (SKU: ${product.sku}) - ${product.description || "No description available"}\nPrice: ${product.price ? "$" + product.price : "Price not available"}\nAvailability: ${product.availability}`,
          source: "product_catalog",
          productId: product.id,
          sku: product.sku,
          confidence: 0.95,
        }));
      }

      // Get vector search results (existing AnythingLLM functionality)
      const VectorDb = getVectorDbClass();
      const hasVectorizedSpace = await VectorDb.hasNamespace(workspace.slug);
      let vectorSources = [];

      if (hasVectorizedSpace) {
        const results = await VectorDb.performSimilaritySearch({
          namespace: workspace.slug,
          input: message,
          LLMConnector: getLLMProvider(),
          similarityThreshold: workspace?.similarityThreshold ?? 0.25,
          topN: workspace?.topN ?? 4,
          rerank: workspace?.vectorSearchMode === "rerank",
        });

        vectorSources = results.sources.map((source) => ({
          ...source,
          source: "knowledge_base",
          confidence: source.score || 0.8,
        }));
      }

      // Combine all sources with B2B enhancements
      const allSources = [...enhancedSources, ...vectorSources];

      // Build enhanced context for LLM
      const enhancedContext = this.buildEnhancedContext(
        message,
        allSources,
        isProductRelated
      );

      // Get LLM response with enhanced prompting (fallback if no LLM configured)
      let response;
      try {
        const llmProvider = getLLMProvider();
        response = await this.generateEnhancedResponse(
          message,
          enhancedContext,
          workspace,
          llmProvider,
          mode,
          isProductRelated
        );
      } catch (error) {
        // Fallback response when LLM is not configured
        console.log("LLM not configured, using fallback response");
        response = {
          textResponse: this.generateFallbackResponse(
            message,
            allSources,
            isProductRelated
          ),
        };
      }

      // Save to chat history with enhanced metadata
      await WorkspaceChats.new({
        workspaceId: workspace.id,
        prompt: message,
        response: response.textResponse,
        user,
        thread,
        sessionId,
        sources: allSources,
        metadata: {
          isProductQuery: isProductRelated,
          sourceTypes: allSources.map((s) => s.source),
          productCount: productContext.length,
          b2bEnhanced: true,
        },
      });

      return {
        id: chatId,
        type: "textResponse",
        textResponse: response.textResponse,
        sources: allSources.slice(0, 10), // Limit sources returned
        close: true,
        error: null,
        metadata: {
          isProductQuery: isProductRelated,
          sourceAttribution: allSources.length > 0,
          confidenceScore: this.calculateOverallConfidence(allSources),
        },
      };
    } catch (error) {
      console.error("B2B Chat Handler Error:", error);
      return {
        id: chatId,
        type: "abort",
        textResponse: null,
        sources: [],
        close: true,
        error: error.message,
      };
    }
  }

  /**
   * Get product context for queries
   */
  async getProductContext(message, workspaceId) {
    try {
      // Extract potential SKUs or product names from message
      const skuMatch = message.match(/\b[A-Z0-9-]{3,20}\b/g);
      let products = [];

      // Try SKU lookup first
      if (skuMatch) {
        for (const sku of skuMatch) {
          const product = await Product.findBySku(sku, workspaceId);
          if (product) {
            products.push(product);
          }
        }
      }

      // If no SKU matches, do general product search
      if (products.length === 0) {
        products = await Product.findByQuery(message, workspaceId, 5);
      }

      return products;
    } catch (error) {
      console.error("Product context error:", error);
      return [];
    }
  }

  /**
   * Build enhanced context for LLM with B2B information
   */
  buildEnhancedContext(message, sources, isProductRelated) {
    let context = "Context Information:\n\n";

    if (
      isProductRelated &&
      sources.some((s) => s.source === "product_catalog")
    ) {
      context += "PRODUCT INFORMATION:\n";
      sources
        .filter((s) => s.source === "product_catalog")
        .forEach((source, idx) => {
          context += `[Product ${idx + 1}] ${source.chunk}\n\n`;
        });
    }

    if (sources.some((s) => s.source === "knowledge_base")) {
      context += "KNOWLEDGE BASE:\n";
      sources
        .filter((s) => s.source === "knowledge_base")
        .forEach((source, idx) => {
          context += `[Reference ${idx + 1}] ${source.text || source.chunk}\n\n`;
        });
    }

    return context;
  }

  /**
   * Generate enhanced response with B2B prompting
   */
  async generateEnhancedResponse(
    message,
    context,
    workspace,
    llmProvider,
    mode,
    isProductRelated
  ) {
    const systemPrompt = this.buildSystemPrompt(workspace, isProductRelated);

    const enhancedPrompt = `${systemPrompt}

${context}

User Question: ${message}

Instructions:
${
  isProductRelated
    ? `- This appears to be a product-related question. Provide accurate product information if available.
  - Include SKU, pricing, and availability when relevant.
  - If multiple products match, compare key features.
  - Always cite your sources with [Product X] or [Reference X] format.`
    : `- Provide helpful and accurate information based on the knowledge base.
  - Always cite your sources with [Reference X] format.
  - If information is not available, clearly state this.`
}
- Be conversational but professional.
- Focus on being helpful for business/e-commerce context.

Response:`;

    try {
      const response = await llmProvider.getChatCompletion(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: enhancedPrompt },
        ],
        workspace,
        { temperature: 0.7 }
      );

      return {
        textResponse:
          response ||
          "I apologize, but I'm unable to provide a response at this time.",
      };
    } catch (error) {
      console.error("LLM Response Error:", error);
      return {
        textResponse:
          "I apologize, but I encountered an error while processing your request. Please try again.",
      };
    }
  }

  /**
   * Build enhanced system prompt for B2B context
   */
  buildSystemPrompt(workspace, isProductRelated) {
    const basePrompt =
      workspace?.openAiPrompt ||
      "You are a helpful AI assistant for an e-commerce business.";

    const b2bEnhancement = isProductRelated
      ? " You specialize in providing accurate product information, pricing, availability, and helping customers make informed purchasing decisions. Always provide specific product details when available, including SKU numbers, specifications, and features."
      : " You provide helpful information based on the company's knowledge base, including policies, procedures, and general business information.";

    return basePrompt + b2bEnhancement;
  }

  /**
   * Calculate overall confidence score for response
   */
  calculateOverallConfidence(sources) {
    if (sources.length === 0) return 0.5;

    const avgConfidence =
      sources.reduce((sum, source) => sum + (source.confidence || 0.7), 0) /
      sources.length;

    return Math.round(avgConfidence * 100) / 100;
  }

  /**
   * Generate fallback response when LLM is not available
   */
  generateFallbackResponse(message, sources, isProductRelated) {
    if (sources.length === 0) {
      return isProductRelated
        ? "I couldn't find any products matching your query. Please check the product name or SKU and try again."
        : "I don't have information about that topic in my knowledge base. Please rephrase your question or contact support.";
    }

    if (isProductRelated) {
      const productSources = sources.filter(
        (s) => s.source === "product_catalog"
      );
      if (productSources.length > 0) {
        const product = productSources[0];
        let response = `**${product.title.replace("Product: ", "")}**\n\n`;
        response += product.chunk;

        if (productSources.length > 1) {
          response += `\n\nI found ${productSources.length} products matching your query. `;
          response += productSources
            .slice(1)
            .map((p) => p.title.replace("Product: ", ""))
            .join(", ");
        }

        return response;
      }
    }

    // General knowledge base response
    let response = "Based on my knowledge base:\n\n";
    sources.slice(0, 3).forEach((source, idx) => {
      response += `**${idx + 1}.** ${source.text || source.chunk}\n\n`;
    });

    if (sources.length > 3) {
      response += `...and ${sources.length - 3} more results found.`;
    }

    return response;
  }

  /**
   * Stream chat implementation (similar to chatSync but with streaming)
   */
  async streamChat({
    response,
    workspace,
    message,
    mode = "chat",
    user = null,
    thread = null,
    sessionId = null,
    attachments = [],
    reset = false,
  }) {
    const chatId = uuidv4();

    try {
      // Get the same enhanced processing as chatSync
      const result = await this.chatSync({
        workspace,
        message,
        mode,
        user,
        thread,
        sessionId,
        attachments,
        reset,
      });

      // Simulate streaming by sending the response in chunks
      const responseText = result.textResponse;
      const chunkSize = 50; // characters per chunk

      for (let i = 0; i < responseText.length; i += chunkSize) {
        const chunk = responseText.slice(i, i + chunkSize);
        const isLastChunk = i + chunkSize >= responseText.length;

        writeResponseChunk(response, {
          id: chatId,
          type: "textResponseChunk",
          textResponse: chunk,
          sources: isLastChunk ? result.sources : [],
          close: isLastChunk,
          error: null,
          metadata: isLastChunk ? result.metadata : undefined,
        });

        // Small delay to simulate real streaming
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    } catch (error) {
      console.error("B2B Stream Chat Error:", error);
      writeResponseChunk(response, {
        id: chatId,
        type: "abort",
        textResponse: null,
        sources: [],
        close: true,
        error: error.message,
      });
    }
  }
}

module.exports = { B2BChatHandler };
