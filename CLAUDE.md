# AnythingLLM B2B E-commerce Chat Solution - Claude Code Configuration

## 🤖 Sub-Agent Development Workflow

This project uses specialized Claude Code sub-agents and commands for enhanced development:

### **Planning System**
- **`/plan [stage]`** - Creates detailed task breakdown files (P1-S1-BREAKDOWN.md format)
- **`@planner [feature]`** - Creates technical specifications and feature analysis  
- **`/dev-cycle [feature]`** - Complete plan→code→test workflow

### **Specialized Agents**
1. **Planner Agent** (`@planner`) - Technical architecture, research, and specifications
2. **Coder Agent** (`@coder`) - TDD implementation and clean coding
3. **Tester Agent** (`@tester`) - Quality assurance and testing

### **Key Planning Workflow**
```bash
# For roadmap stages - creates task breakdown files
/plan Phase 1.1 Core API Infrastructure

# For feature specifications - creates technical specs  
@planner Multi-source data ingestion system

# For implementation - follows task breakdowns
/implement [specific task from breakdown]
```

## Core Principles
Follow TDD approach. Build and verify results yourself first before asking me to check myself. Try making the code modular so we can reuse if possible.


## Documentation Update Checklist

When completing features or making significant changes, ALWAYS update:
- **CURRENT_STATE.md** - Update ONLY when features are production-ready
- **CODE_INDEX.md** - Add new functions, classes, or modules
- **Architecture docs** - Update for design changes
- **WORKING_JOURNAL.md** - Note development progress (not implementation details)

### Documentation Maintenance Tools
- Run `python scripts/verify_documentation.py` to check consistency
- Git hook installed: `.githooks/pre-commit-docs` (reminds about doc updates)
- CI/CD check: `.github/workflows/doc-consistency-check.yml`

## Project Overview

**AnythingLLM B2B E-commerce Chat Solution** transforms AnythingLLM into a comprehensive B2B LLM chat platform specifically designed for e-commerce businesses. It provides intelligent customer support through multi-source knowledge management, real-time data synchronization, and enterprise-grade monitoring.

### Core Capabilities (Enhanced MVP Focus)
- **Multi-Source Knowledge Management**: Ingest data from websites, documents, APIs, Google Docs with real-time sync
- **E-commerce Integration**: Deep integration with Shopify, WooCommerce, and custom platforms
- **Embeddable Chat Widget**: Customizable widget for client websites with white-label options
- **LLM-as-Judge Evaluation**: Automated quality assessment and continuous improvement
- **Enterprise Monitoring**: Comprehensive analytics, alerts, and performance tracking
- **Multi-Tenant Platform**: Scalable architecture supporting multiple clients with billing

## 🚀 New Team Member Quick Start

### **Step 1: Understand the Project**
1. **Read this file** (`CLAUDE.md`) - Complete project context and guidelines
2. **Check current status** - See `docs/STAGE_STATUS.md` for cross-branch progress overview
3. **Understand structure** - See `docs/folder_and_git_tree_structure.md` for git worktree setup

### **Step 2: Set Up Your Development Environment**
- **Backend developers**: Node.js/Express with AnythingLLM enhancement setup
- **Frontend developers**: React/TypeScript for admin dashboard and widget development

### **Step 3: Create Your First Branch**
```bash
# Create new branch for current week focus
git worktree add worktrees/backend/backend_v0p1_p1_content -b backend_v0p1_p1_content backend_main

# Navigate to your branch
cd worktrees/backend/backend_v0p1_p1_content

# Install dependencies for AnythingLLM
npm install

# Install all commands and setup symlinks
bash /home/duyth/projects/agentic_system/shared/scripts/install-commands.sh

# Start development with context
/workhere
```

### **Step 4: Daily Workflow Commands**
- **Context & Navigation**: `/workhere`, `/branchstatus`, `/resumebranch` for branch-aware guidance
- **Planning**: `/plan [stage]` for creating task breakdowns, `@planner [feature]` for technical specs
- **Implementation**: `/implement [feature]` for TDD development workflow
- **Testing & Validation**: `/devgo` for post-implementation testing, `/testgo` for test execution
- **Progress**: `/checkpoint` for saving progress and updates
- **Completion**: `/stage-complete` for marking stages complete

### **Step 5: Enhanced Planning & Development Process**
1. **Plan roadmap stages**: `/plan Phase 1.1` → Creates detailed P1-S1-BREAKDOWN.md
2. **Analyze complex features**: `@planner [feature]` → Creates technical specifications
3. **Implement tasks**: `/implement [task]` → TDD development following breakdowns
4. **Validate completion**: `/devgo` → Test and validate implementations

---

## Development Context

### Current Phase: Enhanced Knowledge MVP - Multi-Source RAG

**Status**: ✅ ROADMAP ENHANCED - Comprehensive 14-week development plan ready
**Project Focus**: AnythingLLM B2B E-commerce Chat Solution
**Latest Update**: January 28, 2025 - Enhanced roadmap with multi-source capabilities

**Development Phases (14-Week Plan):**
- 🎯 Week 1-2: Enhanced Knowledge MVP with multi-source data ingestion
- 🎯 Week 3-4: Client-ready platform with white-label customization
- 🎯 Week 5-6: E-commerce integration and transaction features
- 🎯 Week 7-10: Production-ready multi-tenant architecture
- 🎯 Week 11-12: Advanced monitoring and LLM-as-judge evaluation
- 🎯 Week 13-14: Enterprise excellence and platform maturity

## 📊 Documentation Structure & Creation

### **Project-Level Documentation (Shared)**
- **`/shared/docs/WORKING_JOURNAL.md`** - Strategic milestones, major completions, project health
- **`/shared/docs/STAGE_STATUS.md`** - Cross-branch stage completion matrix 
- **`/shared/docs/ROADMAP.md`** - Overall project roadmap with stage status
- **`/shared/docs/task_management/task_breakdown/`** - Detailed task breakdown files

### **Task Breakdown Documentation (Auto-Created)**
- **`P[X]-S[Y]-BREAKDOWN.md`** - Created by `/plan [stage]` commands
- **Format**: Phase 1 Stage 1 → `P1-S1-BREAKDOWN.md`
- **Contents**: Detailed tasks, estimates, dependencies, implementation steps
- **Location**: `/shared/docs/task_management/task_breakdown/`

### **Branch-Specific Documentation**
- **`/worktrees/{stack}/{branch}/docs/STAGE_PROGRESS.md`** - Detailed stage implementation progress
- **`/worktrees/{stack}/{branch}/docs/WORKING_JOURNAL.md`** - Daily development notes
- **`/shared/test_plans/active/{stage}_test_plan.md`** - Stage-specific test plans

### **Document Creation Workflow**
```bash
# Creates P1-S3-BREAKDOWN.md with detailed tasks
/plan Phase 1.3 Widget Development  

# Updates existing breakdown files with technical specs
@planner Embeddable widget customization system

# Updates branch-specific progress tracking
/devgo  # After implementation to track progress
```

## 📋 Command System

### Using Branch Commands
- `/workhere` - Auto-detect current branch and load context (primary command)
- `/resumebranch` - Show all branches to choose which to resume
- `/branchstatus` - View overall project progress
- `/devgo` - Development workflow with branch-specific guidance
- `/testgo` - Test execution with branch-specific test plans
- `/checkpoint` - Context-aware progress saving
- `/stage-complete` - Mark stages complete and update roadmap

### Command Responsibilities
- **`/checkpoint`** → Updates shared project status (from root) or branch progress (from worktree)
- **`/devgo` & `/testgo`** → Update branch-specific STAGE_PROGRESS.md with development details
- **`/stage-complete`** → Mark stages complete and update shared STAGE_STATUS.md
- **`/branchstatus`** → Read-only cross-branch progress overview

### Development Workflow
1. **See Available Work**: From worktrees folder, run `/resumebranch`
2. **Navigate to Branch**: `cd backend_v0p1_p1_content` 
3. **Start Working**: `/workhere` (auto-detects context from current path)
4. **Use Sub-Agents**: `@planner`, `@coder`, `@tester` or `/dev-cycle [feature]`
5. **Daily Development**: `/devgo` for guidance, `/testgo` for validation
6. **Save Progress**: `/checkpoint` for regular saves
7. **Complete Stage**: `/stage-complete` when all tasks done

### Directory-Aware Commands
All commands work based on your current directory:
- **In branch folder**: Commands focus on that specific branch
- **In worktrees/**: Commands show all branches in that stack  
- **In project root**: Commands show overall project status
- **In shared/**: Commands focus on documentation and roadmap

## 📊 Version and Phase Structure

### Week 1-2: Enhanced Knowledge MVP
- **Multi-Source Data Ingestion**: Support websites, documents, APIs, Google Docs with real-time sync
- **E-commerce Integration**: Product catalogs, order management, customer support context
- **Embeddable Widget**: Client-deployable chat interface with customization
- **Real-time RAG**: Enhanced search with source attribution and confidence scoring

### Week 3-4: Client-Ready Platform
- **White-label Customization**: Theme, branding, domain configuration
- **Client Data Management**: Manual updates, automated sync schedules
- **Performance Optimization**: Fast response times, efficient embedding updates
- **Basic Analytics**: Usage tracking, conversation insights

### Week 5-6: E-commerce Transaction Features
- **Order Management**: Query orders, track shipments, handle returns
- **Product Recommendations**: AI-driven product suggestions
- **Customer Context**: Purchase history, preferences, support tickets
- **Transaction Support**: Payment inquiries, billing questions

### Branch Naming Convention
Format: `{stack}_week{W}_{feature}` or `{stack}_v{major}p{minor}_{feature}`
- ✅ `backend_week1_multi_source`
- ✅ `backend_week2_widget_embed`
- ✅ `frontend_week3_client_portal`
- ✅ `backend_v1p0_production`
- ❌ `backend_complicated_feature_name` (keep it short)
- ❌ `backend_temp_testing` (use descriptive names)

### Feature Name Mapping
- `multi_source` → Multi-source data ingestion (websites, docs, APIs)
- `widget_embed` → Embeddable chat widget and customization
- `client_portal` → Client management and white-label configuration
- `ecommerce_integration` → Shopify, WooCommerce, product data sync
- `evaluation_system` → LLM-as-judge and quality monitoring
- `production_ready` → Multi-tenant, billing, enterprise features

### Manual Branch Creation
```bash
# From project root, create new worktree
git worktree add worktrees/backend/backend_v0p1_p1_content -b backend_v0p1_p1_content backend_main

# Navigate and setup
cd worktrees/backend/backend_v0p1_p1_content
bash /home/duyth/projects/agentic_system/shared/scripts/install-commands.sh

# Initialize and start development
# Node.js setup for AnythingLLM
npm install
# Get context (auto-detects from path)
/workhere
```

### Version Evolution Path
- **v0.1-v0.9**: MVP iterations and feature development
- **v1.0**: First production release (post-MVP validation)
- **v1.1-v1.9**: Production enhancements and optimization  
- **v2.0**: Major feature expansions and enterprise features

**What We've Accomplished:**
- ✅ Created clean development worktree structure
- ✅ Updated project documentation to AnythingLLM B2B focus
- ✅ Enhanced sub-agents with e-commerce context
- ✅ Context-aware command system with branch-specific guidance
- ✅ Comprehensive 14-week development roadmap

**What We're Building On:**
- ✅ AnythingLLM open-source foundation with multi-source RAG
- ✅ Node.js/Express backend with enhanced API endpoints
- ✅ React frontend with admin dashboard and embeddable widget
- ✅ PostgreSQL + PGVector for advanced vector search
- ✅ Real-time data sync and webhook infrastructure

### Tech Stack Overview

#### Foundation Platform
- **AnythingLLM**: Enhanced open-source LLM platform with multi-source RAG capabilities
- **Node.js/Express**: Backend API with enhanced endpoints for multi-source integration
- **React**: Admin dashboard and embeddable widget interface
- **PostgreSQL + PGVector**: Database with vector embeddings for enhanced search

#### Core Infrastructure
- **Redis**: Caching, session management, and real-time sync queues
- **Webhooks**: Real-time data synchronization and push updates
- **Docker**: Containerized deployment for scalability
- **CDN**: Fast widget delivery and static asset optimization

#### AI & Intelligence
- **OpenAI/Anthropic**: Primary LLM providers for chat and evaluation
- **Embedding Models**: Advanced semantic search and source attribution
- **LLM-as-Judge**: Automated quality evaluation and response scoring
- **Confidence Scoring**: Response quality assessment and fallback handling

#### E-commerce Integrations
- **Shopify**: REST Admin API + Storefront API for complete integration
- **WooCommerce**: REST API v3 for product and order management
- **Custom APIs**: Generic connector framework for any e-commerce platform
- **Google Docs**: OAuth2 + Drive API for document synchronization

### Architecture Principles

#### Task Resolution Priority
1. **SOP Matching** - Check enabled tenant SOPs first
2. **Explicit Instructions** - Follow user-provided steps
3. **Capability Matching** - Match to available tools/agents/workflows
4. **LLM Reasoning** - AI-driven approach for novel tasks

#### Multi-Tenant SOP Management
- **Default SOPs**: Platform-provided baseline procedures
- **Tenant Overrides**: Custom modifications per organization
- **SOP Hierarchy**: User-defined SOPs override defaults
- **Enable/Disable**: Tenants can disable specific SOPs

## Development Guidelines

### 🛑 IMPORTANT: Stage Gate Process
**STOP AND WAIT FOR APPROVAL AFTER EACH STAGE**

When completing any stage (e.g., v0.1_s1.1, v0.1_s1.2, etc.):
1. Run `/testgo` to validate all tests for that stage
2. Update STAGE_PROGRESS.md with completion status using `/devgo`
3. Run `/stage-complete` to mark stage done and update shared roadmap
4. **STOP and inform the user that the stage is complete**
5. **WAIT for explicit approval before proceeding to the next stage**

Example completion workflow:
```bash
/testgo                              # Validate all tests pass
/devgo                               # Update branch progress
/stage-complete                      # Mark stage complete
# ✅ Stage v0p1.p1.s1 Complete! Awaiting approval to proceed to s2
```

### 🎯 Feature Development Process
**MANDATORY PROCESS FOR ALL NEW FEATURES**

**Context is King** - Always understand the full context before starting.

#### 1. Research Phase
- **Multiple Solutions**: Research at least 2-3 potential approaches
- **Resource Utilization**: Use knowledge base, internet resources, MCPs, existing codebase
- **Document Options**: Create brief comparison of approaches

#### 2. Analysis & Architecture Consultation
- **Architecture Alignment**: Consult current & planned architecture documents
- **Best Fit Analysis**: Choose solution that best fits system design
- **Technical Debt**: Consider long-term maintainability and scalability

#### 3. Test-Drive Implementation
- **Skeleton Code**: Build basic structure first to validate approach
- **Early Validation**: Ensure core concepts work before full implementation
- **Rapid Iteration**: Fail fast if approach doesn't work

#### 4. Full Implementation
- **Descriptive comments**: add descriptive comment blocks to main /key functions.
- **Modular Design**: Keep files under 1500 lines.
- **No Duplication**: Check for existing similar files/functions before creating new ones
- **Clean Architecture**: Split large files into smaller, focused modules

#### 5. Testing & Documentation
- **Branch Testing**: Use `/testgo` for branch-specific test validation
- **Progress Tracking**: Use `/devgo` to update STAGE_PROGRESS.md
- **Regular Checkpoints**: Use `/checkpoint` for progress saves
- **Stage Completion**: Use `/stage-complete` when stage is done

#### 6. Test Plan Execution
```bash
# Development workflow with new command system
/workhere                    # Get current context and guidance
/devgo                       # Check development status, create test plans
/testgo                      # Execute tests and update branch progress
/checkpoint "Feature X done" # Save progress with descriptive message
/stage-complete              # Mark stage complete when ready
```

#### Code Quality Rules
- **No Duplication**: Never create duplicate files, functions, or similar content
- **File Size Limits**: Keep files under 1000-1500 lines
- **Modular Design**: Split large files into focused, reusable modules
- **Existing Code First**: Always check if functionality already exists before building new

### Code Organization
```
agentic-system/
├── shared/
│   ├── docs/               # Project documentation
│   │   ├── STAGE_STATUS.md       # Cross-branch completion matrix
│   │   ├── WORKING_JOURNAL.md    # Project-level progress
│   │   └── COMMAND_RESPONSIBILITIES.md # Command documentation
│   ├── infrastructure/     # Docker, monitoring configs
│   └── backend/           # Backend shared resources
├── worktrees/
│   ├── backend/
│   │   ├── backend_main/  # Main backend branch
│   │   └── backend_v*/    # Feature branches
│   │       └── docs/
│   │           ├── STAGE_PROGRESS.md    # Branch-specific progress
│   │           └── WORKING_JOURNAL.md   # Daily development notes
│   └── frontend/
│       ├── frontend_main/ # Main frontend branch
│       └── frontend_v*/   # Feature branches
└── archived/              # Historical reference
```

### Key Files to Understand

#### Development
- **ROADMAP.md**: **PRIMARY DEVELOPMENT GUIDE** - Specific tasks, features, and implementation details
- **STAGE_STATUS.md**: Cross-branch completion matrix and overall progress
- **CLAUDE.md**: This file - development context and guidelines

#### Documentation
- **README.md**: Complete project overview and getting started
- **docs/DOCUMENT_INDEX.md**: Main documentation navigation hub
- **docs/COMMAND_RESPONSIBILITIES.md**: Command system documentation
- **docs/WORKING_JOURNAL.md**: Project-level progress tracking
- **docs/architecture/**: Technical architecture documentation folder

## System Status & Architecture

### ✅ Production Ready Features
- **Three-Tier Instruction System**: Backend/System/User priority hierarchy operational
- **Capability Management**: Two-tier system (System + Custom) with metadata support
- **Agent Orchestration**: 4 core business agents with real-time coordination
- **Tool Ecosystem**: 8 core tools with intelligent capability matching
- **Admin UI**: Complete management interface for instructions and capabilities
- **LLM Integration**: Real LLM calls with instruction-guided prompts
- **Enhanced Documentation**: Cross-branch tracking and context-aware commands
- **Performance**: 100% routing success, 87.5% LLM integration success

### 🎯 Current Development

#### Week 1-2: Enhanced Knowledge MVP
**Goal**: Multi-source data ingestion with real-time RAG capabilities
**Status**: Multi-source ingestion (Day 1-4), Widget development (Day 5-10), Testing & polish (Day 11-14)

**Key Features**:
- Multi-source data connectors (websites, documents, APIs, Google Docs)
- Enhanced RAG with source attribution and confidence scoring
- Embeddable JavaScript widget for client websites
- Real-time data synchronization and update notifications

### 🎯 Future Phases

#### Week 3-4: Client-Ready Platform
- **White-label Customization**: Theme, branding, domain configuration for clients
- **Client Data Management**: Manual updates, automated sync schedules
- **Performance Optimization**: Sub-2-second response times, efficient updates
- **Basic Analytics**: Usage tracking, conversation insights, client dashboards

#### Week 5-6: E-commerce Transaction Features
- **Order Management**: Query orders, track shipments, handle returns
- **Product Recommendations**: AI-driven product suggestions based on context
- **Customer Context**: Purchase history, preferences, support ticket integration
- **Transaction Support**: Payment inquiries, billing questions, refund processing

#### Week 7-14: Production & Enterprise Features
- **Multi-Tenant**: User accounts, workspace isolation, billing integration
- **Advanced Monitoring**: LLM-as-judge evaluation, quality scoring
- **Enterprise Features**: SSO, advanced security, compliance reporting
- **Platform Maturity**: Auto-scaling, advanced integrations, marketplace

## Environment Variables

```bash
# AnythingLLM Core
SERVER_PORT=3001
FRONTEND_PORT=3000
JWT_SECRET=your-secret-here
PASSWORD_SECRET=your-password-secret

# Database (AnythingLLM uses SQLite by default)
STORAGE_DIR=/app/server/storage
DATABASE_PATH=/app/server/storage/anythingllm.db

# AI Services
OPENAI_API_KEY=your-key-here
ANTHROPIC_API_KEY=your-key-here
DEFAULT_MODEL=gpt-3.5-turbo

# E-commerce Integrations
SHOPIFY_API_KEY=your-shopify-key
WOOCOMMERCE_API_KEY=your-woocommerce-key
GOOGLE_DOCS_API_KEY=your-google-api-key

# Monitoring & Analytics
LLM_EVALUATION_ENABLED=true
REAL_TIME_SYNC_ENABLED=true
```

## Testing Strategy

### Enhanced Test Plan System
- **Branch-Specific Testing**: `/testgo` executes tests relevant to current branch
- **Development Workflow**: `/devgo` provides guided development with test creation
- **Progress Tracking**: Test results automatically update STAGE_PROGRESS.md
- **Stage Completion**: `/stage-complete` validates completion before marking done
- **Cross-Branch Visibility**: STAGE_STATUS.md shows test status across all branches

### Test Plan Workflow
```bash
# New enhanced workflow
/workhere                    # Get current context
/devgo                       # Check development status, create test plans if needed
/testgo                      # Execute tests specific to current branch/stage
/checkpoint "Tests passing"  # Save progress with test results
/stage-complete              # Mark stage complete when all tests pass
```

### Prototype Validation
- **Multi-Source Data Ingestion**: Test website scraping, document parsing, API connections
- **Real-time RAG**: Validate search accuracy, source attribution, confidence scoring
- **E-commerce Integration**: Test product sync, order queries, customer context
- **Performance**: <2 seconds for chat responses, real-time data sync

### Example Test Scenarios
```yaml
# Multi-Source Data
- Website content scraping and chunking
- PDF/Word document processing
- Shopify product catalog sync
- Google Docs real-time updates

# Chat Widget
- Embeddable widget functionality
- White-label customization
- Mobile responsiveness
- Cross-domain deployment

# E-commerce Features
- Product search and recommendations
- Order status queries
- Customer support context
- Purchase history integration
```

## Important Notes

- **AnythingLLM Foundation**: Built on proven open-source LLM platform
- **Multi-Source Focus**: Priority on diverse data ingestion capabilities
- **Context-Aware Commands**: All commands adapt to current branch/location
- **Sub-Agent Development**: Specialized agents for planning, coding, and testing
- **Stage Gate Process**: Mandatory approval between stages with `/stage-complete`
- **Branch-Specific Progress**: Detailed tracking in STAGE_PROGRESS.md files
- **Project-Level Visibility**: STAGE_STATUS.md provides cross-branch overview
- **Production Ready Foundation**: Built for real client deployments
- **E-commerce First**: Focus on immediate business value for e-commerce clients
- **Real Value Delivery**: Client-ready features within 2 weeks

This project aims to transform AnythingLLM into a comprehensive B2B e-commerce chat solution that delivers immediate value while maintaining scalability for enterprise growth.

---

## Stack-Specific Instructions

For technology-specific setup, development commands, and implementation details:

- **Backend (Node.js/Express)**: AnythingLLM server enhancement with multi-source connectors
- **Frontend (React/TypeScript)**: Admin dashboard and embeddable widget development
- **Database**: PostgreSQL + PGVector for enhanced vector search capabilities
- **Infrastructure**: Docker containerization for scalable client deployments

## Quick Reference

- **Project Documentation**: `/shared/docs/ROADMAP.md` - Primary development guide
- **Sub-Agents**: Use `@planner`, `@coder`, `@tester` for specialized development
- **Onboarding**: See `/shared/refs/new_member_onboarding.md` for complete setup
- **Current Focus**: Week 1-2 Multi-source data ingestion and embeddable widget