# FT-004: Chat Testing Interface

**Estimate**: 8 hours  
**Priority**: P0 Critical - Core Testing Feature  
**Dependencies**: FT-003  
**Phase**: Core Internal Testing

---

## Overview

Build the primary chat testing interface by adapting existing chat components. This is the most important testing feature for validating backend chat APIs, streaming responses, and source attributions.

## Objectives

- Adapt existing WorkspaceChat for testing purposes
- Support multiple workspaces for testing different scenarios
- Display response metadata and source attributions
- Enable streaming responses with real-time display

---

## Detailed Tasks

### Task 4.1: Basic Chat Interface Setup (2 hours)

**Subtasks:**
- [ ] Locate and review existing WorkspaceChat component (30 min)
- [ ] Create ChatTest page component (30 min)
- [ ] Remove production chat features (agents, tools, etc.) (30 min)
- [ ] Setup basic chat state management (30 min)

### Task 4.2: Workspace Integration (1.5 hours)

**Subtasks:**
- [ ] Create workspace selector dropdown (30 min)
- [ ] Fetch workspace list from backend API (20 min)
- [ ] Implement workspace switching logic (25 min)
- [ ] Store selected workspace in component state (15 min)

### Task 4.3: Message Display & UI (2 hours)

**Subtasks:**
- [ ] Adapt existing message display components (40 min)
- [ ] Create clean message list with proper styling (30 min)
- [ ] Add message input field with send functionality (30 min)
- [ ] Implement clear chat functionality (20 min)

### Task 4.4: Streaming Response Support (1.5 hours)

**Subtasks:**
- [ ] Integrate @microsoft/fetch-event-source for streaming (30 min)
- [ ] Implement streaming message updates (30 min)
- [ ] Add typing indicators during streaming (15 min)
- [ ] Handle streaming errors and connection issues (15 min)

### Task 4.5: Enhanced Features (1 hour)

**Subtasks:**
- [ ] Display source attributions from responses (25 min)
- [ ] Add basic response time metrics (20 min)
- [ ] Show model information if available (15 min)

---

## Success Criteria

- [ ] Can send chat messages to selected workspace
- [ ] Streaming responses display in real-time
- [ ] Source citations are visible and clickable
- [ ] Can switch between different workspaces
- [ ] Response times are displayed
- [ ] Clear chat functionality works

---

## Deliverables

1. **Chat Interface Component**
   - Clean message display
   - Input field with send button
   - Workspace selector

2. **Streaming Integration**
   - Real-time response updates
   - Typing indicators
   - Connection error handling

3. **Testing Features**
   - Source attribution display
   - Response metadata
   - Clear chat functionality

---

## Implementation Details

### API Integration
```javascript
// Chat API calls
const ChatAPI = {
  sendMessage: async (workspaceSlug, message) => {
    const response = await fetch(`/api/v1/workspace/${workspaceSlug}/chat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message })
    });
    return response.json();
  },

  streamChat: async (workspaceSlug, message, onUpdate) => {
    await fetchEventSource(`/api/v1/workspace/${workspaceSlug}/stream-chat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message }),
      onmessage(event) {
        const data = JSON.parse(event.data);
        onUpdate(data);
      }
    });
  }
};
```

### Message State Structure
```javascript
const messageStructure = {
  id: 'unique-id',
  role: 'user' | 'assistant',
  content: 'message text',
  timestamp: Date.now(),
  sources: [], // For assistant messages
  metadata: {
    responseTime: 1250, // ms
    model: 'gpt-3.5-turbo',
    streaming: false
  }
};
```

---

## Key Components

### Chat Interface
- `/src/pages/ChatTest/ChatTest.jsx` - Main chat testing page
- `/src/components/Chat/MessageList.jsx` - Message display component
- `/src/components/Chat/MessageInput.jsx` - Input field and send button
- `/src/components/Chat/WorkspaceSelector.jsx` - Workspace dropdown

### Message Components
- `/src/components/Chat/UserMessage.jsx` - User message display
- `/src/components/Chat/AssistantMessage.jsx` - AI response with sources
- `/src/components/Chat/SourceAttribution.jsx` - Citation display
- `/src/components/Chat/TypingIndicator.jsx` - Streaming indicator

---

## Testing Scenarios

### Basic Chat Flow
1. **Send Message**
   - Type message in input
   - Click send button
   - Message appears in chat

2. **Receive Response**
   - Streaming response appears
   - Sources displayed if available
   - Response time shown

3. **Workspace Switching**
   - Select different workspace
   - Chat history clears/switches
   - New messages go to selected workspace

### Error Handling
- [ ] Network connection failures
- [ ] Invalid workspace selection
- [ ] Streaming interruption
- [ ] Empty message handling
- [ ] Rate limiting responses

---

## Performance Considerations

### Optimization Features
- Message list virtualization for long chats
- Debounced typing indicators
- Optimistic UI updates
- Automatic scroll to bottom

### Resource Management
- Clear old messages after certain limit
- Abort streaming on component unmount
- Memory cleanup for event sources

---

## Testing API Endpoints

### Required Backend APIs
```
GET /api/v1/workspaces - List available workspaces
POST /api/v1/workspace/{slug}/chat - Send chat message
POST /api/v1/workspace/{slug}/stream-chat - Streaming chat
GET /api/v1/workspace/{slug}/chats - Chat history (optional)
```

### Testing Checklist
- [ ] Can list workspaces
- [ ] Can send basic chat messages
- [ ] Streaming responses work
- [ ] Source attributions display
- [ ] Error responses handled
- [ ] Multiple workspaces supported

---

## Next Steps

After completion of FT-004:
- Ready for FT-005 (Document Upload Interface)
- Core chat testing functionality complete
- Backend chat APIs fully testable

---

## Notes

- This is the most critical testing feature
- Focus on reliability over advanced features
- Ensure all chat-related backend APIs are testable
- Keep UI simple and focused on testing needs