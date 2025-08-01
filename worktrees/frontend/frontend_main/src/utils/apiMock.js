// Mock API layer for testing interface when backend is not available
import { API_BASE } from "./constants";

// Check if we're in development mode and backend is not available
let backendAvailable = null;

export async function checkBackendAvailability() {
  if (backendAvailable !== null) return backendAvailable;
  
  try {
    const response = await fetch(`${API_BASE}/ping`, { 
      method: 'GET',
      timeout: 2000 
    });
    backendAvailable = response.ok;
  } catch (error) {
    backendAvailable = false;
  }
  
  return backendAvailable;
}

// Mock data for testing
export const mockData = {
  systemKeys: {
    MultiUserMode: false,
    RequiresAuth: false,
    LLMProvider: "openai",
    VectorDB: "lancedb",
    DisableViewChatHistory: false
  },
  user: {
    id: "test-user-1",
    username: "testuser",
    role: "admin"
  },
  supportEmail: "",
  customAppName: "AnythingLLM Testing Interface",
  footerData: [],
  pfpUrl: null,
  logoData: { isCustomLogo: false, logoURL: null }
};

// Enhanced fetch wrapper that provides mocks when backend unavailable
export async function mockFetch(url, options = {}) {
  const isApiCall = url.includes(API_BASE);
  const isExternalCDN = url.includes('cdn.anythingllm.com');
  
  if (!isApiCall || isExternalCDN) {
    // Not our API call or external CDN, use regular fetch
    return window.originalFetch ? window.originalFetch(url, options) : fetch(url, options);
  }
  
  // For testing interface, skip backend check and go straight to mocks
  console.warn(`Using mock data for testing interface: ${url}`);
  backendAvailable = false;
  
  // Return mock responses based on endpoint
  return createMockResponse(url, options);
}

function createMockResponse(url, options) {
  const endpoint = url.replace(API_BASE, '');
  
  let mockResponseData = {};
  let status = 200;
  
  // Define mock responses for different endpoints
  if (endpoint.includes('/setup-complete')) {
    mockResponseData = { results: mockData.systemKeys };
  } else if (endpoint.includes('/system/check-token')) {
    status = 200; // Always valid for testing
    mockResponseData = { valid: true };
  } else if (endpoint.includes('/system/pfp/')) {
    status = 204; // No profile picture
  } else if (endpoint.includes('/system/logo')) {
    status = 204; // No custom logo
  } else if (endpoint.includes('/system/support-email')) {
    mockResponseData = { supportEmail: mockData.supportEmail };
  } else if (endpoint.includes('/system/custom-app-name')) {
    mockResponseData = { customAppName: mockData.customAppName };
  } else if (endpoint.includes('/system/footer-data')) {
    mockResponseData = { footerData: mockData.footerData };
  } else if (endpoint.includes('/workspaces')) {
    // Mock workspaces data
    mockResponseData = { 
      workspaces: [
        {
          id: 1,
          name: "Test Workspace",
          slug: "test-workspace",
          createdAt: new Date().toISOString(),
          openAiTemp: null,
          chatModel: null,
          threads: []
        }
      ]
    };
  } else if (endpoint.includes('/ping')) {
    mockResponseData = { online: true };
  } else {
    // Default mock response
    mockResponseData = { success: true, message: "Mock response" };
  }
  
  return Promise.resolve(new Response(
    JSON.stringify(mockResponseData),
    {
      status: status,
      statusText: status === 200 ? 'OK' : 'No Content',
      headers: { 'Content-Type': 'application/json' }
    }
  ));
}

// Replace global fetch with our mock version in development
if (import.meta.env.DEV) {
  window.originalFetch = window.fetch;
  window.fetch = mockFetch;
}