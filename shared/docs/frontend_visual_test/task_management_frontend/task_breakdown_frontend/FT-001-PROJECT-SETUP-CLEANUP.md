# FT-001: Project Setup & Cleanup

**Estimate**: 4 hours  
**Priority**: P0 Critical - Core Foundation  
**Dependencies**: None  
**Phase**: Core Internal Testing

---

## Overview

Set up the foundation for internal testing by forking the existing AnythingLLM frontend and removing production features we don't need for backend API testing.

## Objectives

- Fork existing AnythingLLM frontend codebase
- Remove unnecessary features for internal testing focus
- Setup clean development environment
- Prepare simplified codebase for testing interface

---

## Detailed Tasks

### Task 1.1: Initial Repository Setup (1 hour)

**Subtasks:**
- [ ] Copy frontend directory to `frontend-testing` (15 min)
- [ ] Initialize separate git tracking if needed (10 min)
- [ ] Review existing codebase structure and dependencies (30 min)
- [ ] Document current component inventory (15 min)

### Task 1.2: Remove Production Features (1.5 hours)

**Subtasks:**
- [ ] Remove agent-related components (`/src/components/AgentBuilder`) (20 min)
- [ ] Remove community hub features (`/src/components/CommunityHub`) (20 min)
- [ ] Remove MCP server components (`/src/components/MCPServers`) (20 min)
- [ ] Remove agent pages (`/src/pages/Admin/Agents`) (15 min)
- [ ] Clean up unused imports and references (35 min)

### Task 1.3: Simplify Dependencies (1 hour)

**Subtasks:**
- [ ] Review package.json dependencies (20 min)
- [ ] Remove agent-related packages (15 min)
- [ ] Remove community hub dependencies (10 min)
- [ ] Remove translation/i18n system (`/src/locales`) (15 min)

### Task 1.4: Development Environment Setup (0.5 hours)

**Subtasks:**
- [ ] Configure Vite for development (15 min)
- [ ] Setup .env file with backend API URL (10 min)
- [ ] Test development server startup (5 min)

---

## Success Criteria

- [ ] Clean codebase without production features
- [ ] Development server running without errors
- [ ] No console errors on startup
- [ ] Reduced package.json dependencies
- [ ] Clear project structure for testing focus

---

## Deliverables

1. **Cleaned Frontend Codebase**
   - Removed: Agents, Community Hub, MCP, Translation
   - Kept: Core chat, document, auth, admin basics

2. **Updated Configuration**
   - Simplified package.json
   - Configured .env for backend API
   - Working Vite development setup

3. **Documentation**
   - List of removed components
   - Updated project structure
   - Environment setup notes

---

## Implementation Notes

### Components to Keep
- Login/Auth components
- Basic chat interface
- Document upload basics
- Admin navigation structure
- Common UI components

### Components to Remove
- AgentBuilder and agent configs
- Community hub and sharing
- MCP server management
- Multi-language support
- Advanced agent features

### Key Files Modified
- `/package.json` - Dependency cleanup
- `/src/App.jsx` - Route simplification
- `/vite.config.js` - Development config
- `/.env` - Backend API configuration

---

## Next Steps

After completion of FT-001:
- Ready for FT-002 (Authentication Flow)
- Clean foundation for building testing interface
- Simplified codebase for faster development

---

## Testing Checklist

- [ ] `npm install` completes without errors
- [ ] `npm run dev` starts development server
- [ ] No console errors in browser
- [ ] Basic routing still functional
- [ ] Login page accessible