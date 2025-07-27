# Week 1 Critical Path - Quick Reference

## Day 1-2: Foundation Sprint 🏃‍♂️

### Morning Day 1
1. **Fork & Clone** (2 hrs)
   ```bash
   cd /home/duyth/projects/anythingllm/worktrees/forked_repo
   docker-compose up -d
   ```
   - Switch to PostgreSQL
   - Setup Redis
   - Configure environment

2. **Basic API** (2 hrs)
   - Create `/api/v1/chat` endpoint
   - Reuse AnythingLLM's chat handler
   - Add knowledge query focus

### Afternoon Day 1
3. **Workspace Simplification** (2 hrs)
   - Modify `server/models/workspace.js`
   - Add e-commerce fields
   - Single-tenant focus

4. **JWT Auth** (2 hrs)
   - Adapt existing auth system
   - Add JWT tokens
   - Create refresh mechanism

### Day 2
5. **API Keys** (2 hrs)
   - Extend for widget access
   - Add domain restrictions
   - Usage tracking

6. **Testing & Docs** (2 hrs)
   - Basic integration tests
   - API documentation
   - Setup guide

## Day 3-4: Knowledge Core 🧠

### Day 3
1. **Document Upload** (3 hrs)
   - Adapt `collector/` system
   - E-commerce document types
   - Bulk upload support

2. **Product Importer** (3 hrs)
   - CSV/JSON parsers
   - Product schema
   - Category mapping

### Day 4
3. **Vector Search** (4 hrs)
   - Configure vector DB
   - Product embeddings
   - Search optimization

4. **RAG Pipeline** (4 hrs)
   - Knowledge retrieval
   - Prompt templates
   - Citation system

## Day 5-6: Widget & UI 🖼️

### Day 5
1. **Widget Core** (4 hrs)
   - Simplify embed code
   - Knowledge chat UI
   - Installation script

2. **Admin Basics** (4 hrs)
   - Document upload UI
   - Product import UI
   - Chat testing

### Day 6
3. **Integration** (4 hrs)
   - Connect all components
   - End-to-end testing
   - Performance tuning

4. **Demo Prep** (4 hrs)
   - Sample data
   - Demo scenarios
   - Internal testing

## Day 7: Demo Day 🎯

### Morning
- Final testing
- Bug fixes
- Performance check

### Afternoon
- Internal demo
- Feedback collection
- Week 2 planning

## Quick Wins Checklist ✅

### By End of Day 1
- [ ] Dev environment running
- [ ] Basic chat API working
- [ ] Can create workspaces

### By End of Day 3
- [ ] Documents uploading
- [ ] Products importing
- [ ] Vector DB connected

### By End of Day 5
- [ ] Knowledge queries working
- [ ] Widget displaying
- [ ] Admin functional

### By End of Day 7
- [ ] Full demo ready
- [ ] All components integrated
- [ ] Performance acceptable

## Key Files to Modify

### Backend
```
server/
├── endpoints/
│   ├── chat.js (modify for knowledge)
│   ├── document.js (add e-commerce types)
│   └── workspace.js (simplify model)
├── models/
│   ├── workspace.js (add fields)
│   └── user.js (add JWT)
└── utils/
    ├── agents/ (future order processing)
    └── vectorDbProviders/ (optimize search)
```

### Frontend
```
frontend/
├── src/
│   ├── pages/Admin/ (simplify for MVP)
│   └── components/ (knowledge focused)
embed/
├── src/ (simplify chat UI)
└── index.html (update styling)
```

## Critical Success Factors
1. **Reuse > Rebuild**: Use AnythingLLM's infrastructure
2. **Knowledge First**: No transactions in Week 1
3. **Simple UI**: Basic but functional
4. **Performance**: <1s response time
5. **Stability**: No crashes in demo

## Emergency Shortcuts 🚨
- Use SQLite if PostgreSQL issues
- Mock vector search if needed
- Hardcode demo data if imports fail
- Use default UI if customization delays
- Skip auth for demo if needed

---
*Focus on working demo by Day 7. Polish comes in Week 2.*