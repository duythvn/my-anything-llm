/**
 * Mock LLM Provider for Testing
 * Bypasses OpenAI requirement for basic API testing
 */

class MockLLMProvider {
  constructor() {
    this.name = "mock-test-provider";
  }

  async getChatCompletion(messages, options = {}) {
    return {
      textResponse: "This is a mock response for testing purposes.",
      sources: [],
      type: "chat",
      close: true,
      error: null
    };
  }

  async streamGetChatCompletion(messages, options = {}) {
    return {
      textResponse: "This is a mock streaming response for testing.",
      sources: [],
      type: "chat", 
      close: true,
      error: null
    };
  }
}

module.exports = { MockLLMProvider };