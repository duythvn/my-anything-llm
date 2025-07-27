# Phase 1 Stage 1: Core API Infrastructure (Days 1-2)

## Overview
Setting up the foundation for our B2B e-commerce chat solution by forking AnythingLLM and implementing core API infrastructure focused on knowledge management.

## Task Breakdowns

### P1-S1-T001: Fork and Setup Development Environment
**Status**: ⏳ TODO | **Estimate**: 4 hours | **Priority**: P0 | **Owner**: DevOps/Backend

#### Subtasks:
1. **Research and Design** (1 hour)
   - [ ] Review AnythingLLM architecture and dependencies
   - [ ] Plan modifications needed for e-commerce focus
   - [ ] Document development environment requirements
   - [ ] Create branch strategy for our fork

2. **Implementation** (2 hours)
   - [ ] Fork AnythingLLM repository to our organization
   - [ ] Clone forked repo to `/home/duyth/projects/anythingllm/worktrees/forked_repo`
   - [ ] Setup development environment with Docker
   - [ ] Configure PostgreSQL instead of SQLite
   - [ ] Setup Redis for caching
   - [ ] Initialize environment variables

3. **Testing** (30 mins)
   - [ ] Verify all services start correctly
   - [ ] Test basic AnythingLLM functionality
   - [ ] Confirm database connections
   - [ ] Check Redis connectivity

4. **Integration and Documentation** (30 mins)
   - [ ] Document setup process
   - [ ] Create development guidelines
   - [ ] Setup IDE configurations
   - [ ] Create initial README updates

#### Dependencies:
- **Requires**: Access to AnythingLLM repo, Docker, PostgreSQL, Redis
- **Blocks**: All subsequent development tasks

#### Technical Considerations:
- Use PostgreSQL from start for production readiness
- Configure for multi-tenant architecture early
- Setup proper logging and monitoring
- Consider using docker-compose for local development

---

### P1-S1-T002: Implement Basic Chat API Endpoints
**Status**: ⏳ TODO | **Estimate**: 6 hours | **Priority**: P0 | **Owner**: Backend

#### Subtasks:
1. **Research and Design** (1 hour)
   - [ ] Analyze existing AnythingLLM chat endpoints
   - [ ] Design API structure for knowledge-focused queries
   - [ ] Plan request/response schemas
   - [ ] Define error handling patterns

2. **Implementation** (4 hours)
   - [ ] Create `/api/v1/chat` endpoint in `server/endpoints/`
   - [ ] Implement `/api/v1/messages` for chat history
   - [ ] Add `/api/v1/knowledge/query` for direct knowledge queries
   - [ ] Implement streaming response support
   - [ ] Add request validation middleware
   - [ ] Create error response formatting

3. **Testing** (30 mins)
   - [ ] Write unit tests for endpoints
   - [ ] Test request validation
   - [ ] Verify streaming responses
   - [ ] Test error scenarios

4. **Integration and Documentation** (30 mins)
   - [ ] Create API documentation
   - [ ] Add Postman/Insomnia collection
   - [ ] Update OpenAPI spec
   - [ ] Document response formats

#### Dependencies:
- **Requires**: P1-S1-T001 (Dev environment)
- **Blocks**: P1-S1-T003 (Workspace model)

#### Technical Considerations:
- Reuse AnythingLLM's chat infrastructure
- Focus on knowledge query optimization
- Implement proper rate limiting
- Consider caching strategy for responses

---

### P1-S1-T003: Create Simplified Workspace Model
**Status**: ⏳ TODO | **Estimate**: 4 hours | **Priority**: P0 | **Owner**: Backend

#### Subtasks:
1. **Research and Design** (1 hour)
   - [ ] Study AnythingLLM workspace model
   - [ ] Design e-commerce focused workspace schema
   - [ ] Plan single-tenant to multi-tenant migration path
   - [ ] Define workspace settings for e-commerce

2. **Implementation** (2.5 hours)
   - [ ] Modify `server/models/workspace.js` for e-commerce
   - [ ] Add e-commerce specific fields to Prisma schema
   - [ ] Create workspace initialization with defaults
   - [ ] Implement workspace settings for knowledge management
   - [ ] Add product catalog connection fields
   - [ ] Setup workspace-level API keys

3. **Testing** (30 mins)
   - [ ] Test workspace creation
   - [ ] Verify settings persistence
   - [ ] Test workspace isolation
   - [ ] Validate schema migrations

4. **Integration and Documentation** (30 mins)
   - [ ] Document workspace model changes
   - [ ] Create migration guide
   - [ ] Update model documentation
   - [ ] Add example configurations

#### Dependencies:
- **Requires**: P1-S1-T002 (Basic API)
- **Blocks**: P1-S1-T004 (Authentication)

#### Technical Considerations:
- Keep workspace model extensible for multi-tenant
- Add fields for e-commerce platform connections
- Include knowledge base configuration
- Plan for workspace-level customization

---

### P1-S1-T004: Implement JWT Authentication
**Status**: ⏳ TODO | **Estimate**: 4 hours | **Priority**: P0 | **Owner**: Backend

#### Subtasks:
1. **Research and Design** (1 hour)
   - [ ] Review AnythingLLM's auth system
   - [ ] Design JWT token structure
   - [ ] Plan refresh token strategy
   - [ ] Define role-based permissions

2. **Implementation** (2.5 hours)
   - [ ] Adapt `server/models/user.js` for JWT
   - [ ] Implement JWT generation in `server/utils/`
   - [ ] Create auth middleware
   - [ ] Add refresh token endpoint
   - [ ] Implement role checking middleware
   - [ ] Setup token expiration handling

3. **Testing** (30 mins)
   - [ ] Test login flow
   - [ ] Verify token validation
   - [ ] Test refresh mechanism
   - [ ] Check role-based access

4. **Integration and Documentation** (30 mins)
   - [ ] Document authentication flow
   - [ ] Create auth integration guide
   - [ ] Add example auth requests
   - [ ] Update security documentation

#### Dependencies:
- **Requires**: P1-S1-T003 (Workspace model)
- **Blocks**: P1-S1-T005 (API keys)

#### Technical Considerations:
- Use existing AnythingLLM user model
- Implement secure token storage
- Add rate limiting for auth endpoints
- Plan for SSO integration later

---

### P1-S1-T005: Add API Key Management
**Status**: ⏳ TODO | **Estimate**: 3 hours | **Priority**: P1 | **Owner**: Backend

#### Subtasks:
1. **Research and Design** (30 mins)
   - [ ] Study AnythingLLM API key system
   - [ ] Design API key structure for widgets
   - [ ] Plan key rotation strategy
   - [ ] Define key permissions model

2. **Implementation** (2 hours)
   - [ ] Extend API key model for widget access
   - [ ] Create key generation endpoints
   - [ ] Implement key validation middleware
   - [ ] Add workspace-level API keys
   - [ ] Create key management UI endpoints
   - [ ] Setup key usage tracking

3. **Testing** (30 mins)
   - [ ] Test key generation
   - [ ] Verify key authentication
   - [ ] Test permission checks
   - [ ] Validate key revocation

4. **Integration and Documentation** (30 mins)
   - [ ] Document API key usage
   - [ ] Create widget integration guide
   - [ ] Add security best practices
   - [ ] Update API documentation

#### Dependencies:
- **Requires**: P1-S1-T004 (JWT auth)
- **Blocks**: P1-S3-T001 (Widget core)

#### Technical Considerations:
- Reuse AnythingLLM's API key infrastructure
- Add domain restrictions for widget keys
- Implement usage quotas
- Consider key analytics

## Stage Validation Checklist
- [ ] Development environment fully functional
- [ ] All API endpoints responding correctly
- [ ] Authentication working for users and API keys
- [ ] Workspace model supports e-commerce needs
- [ ] Documentation complete for all components
- [ ] Ready for knowledge management implementation

## Notes
- Focus on reusing AnythingLLM's existing infrastructure
- Keep changes minimal to ease future updates
- Document all modifications from original codebase
- Prepare for easy transition to multi-tenant

## Related Links
- [AnythingLLM Documentation](https://docs.anythingllm.com)
- [Phase 1 Overview](../TASK_MASTER.md#phase-1-mvp---knowledge-management-week-1-2)
- [Next Stage: Knowledge Management](P1-S2-BREAKDOWN.md)