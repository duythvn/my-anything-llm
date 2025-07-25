# Agentic System - Claude Code Configuration

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

**Agentic System** is an intelligent automation platform that helps businesses automate their marketing, content creation, and analytics workflows - starting with real, immediate value.

### Core Capabilities (Lean MVP Focus)
- **Reddit Marketing Automation**: Monitor, post, and engage on Reddit automatically
- **Content Creation Pipeline**: Generate blog posts and podcasts from keywords
- **Analytics Monitoring**: Track GA4 metrics with anomaly detection
- **Workflow Automation**: Visual workflow execution and monitoring
- **Future**: E-commerce integrations, multi-tenant support, advanced AI orchestration

## 🚀 New Team Member Quick Start

### **Step 1: Understand the Project**
1. **Read this file** (`CLAUDE.md`) - Complete project context and guidelines
2. **Check current status** - See `docs/STAGE_STATUS.md` for cross-branch progress overview
3. **Understand structure** - See `docs/folder_and_git_tree_structure.md` for git worktree setup

### **Step 2: Set Up Your Development Environment**
- **Backend developers**: Follow `backend/BACKEND_SPECIFIC.md` for Python/FastAPI setup
- **Frontend developers**: Follow `frontend/FRONTEND_SPECIFIC.md` for React/TypeScript setup

### **Step 3: Create Your First Branch**
```bash
# Create new branch (follow naming in folder_and_git_tree_structure.md)
git worktree add worktrees/backend/backend_v04_s2 -b backend_v04_s2

# Navigate to your branch
cd worktrees/backend/backend_v04_s2

# Install all commands and setup symlinks
bash /home/duyth/projects/agentic_system/shared/scripts/install-commands.sh

# Initialize documentation and create test plan automatically
./bin/claude-doc-start
```

### **Step 4: Daily Workflow Commands**
- **Context & Navigation**: `/workhere`, `/branchstatus`, `/resumebranch` for branch-aware guidance
- **Development**: `/devgo` for development workflow and test plan creation
- **Testing**: `/testgo` for test execution and validation
- **Progress**: `/checkpoint` for saving progress and updates
- **Completion**: `/stage-complete` for marking stages complete

### **Step 5: Complete Feature Development Process**
Follow the **🎯 Feature Development Process** below for your first feature.

---

## Development Context

### Current Phase: Framework-First MVP - Content Creation Pipeline

**Status**: ✅ FOUNDATION READY - Clean codebase prepared for LangGraph implementation
**Pivot Date**: July 10, 2025
**Latest Update**: July 11, 2025 - Enhanced documentation structure complete

**New Focus (Framework-First):**
- 🎯 Phase 1 (v0p1.p1): LangGraph foundation & content workflows
- 🎯 Phase 2 (v0p1.p2): Analytics monitoring (GA4 integration)
- 🎯 Phase 3 (v0p1.p3): Reddit automation & external integrations
- 🎯 Phase 4 (v0p1.p4): Platform productization

## 📊 Documentation Structure

### **Project-Level Documentation (Shared)**
- **`/shared/docs/WORKING_JOURNAL.md`** - Strategic milestones, major completions, project health
- **`/shared/docs/STAGE_STATUS.md`** - Cross-branch stage completion matrix 
- **`/shared/docs/ROADMAP.md`** - Overall project roadmap with stage status
- **`/shared/docs/COMMAND_RESPONSIBILITIES.md`** - Command roles and responsibilities

### **Branch-Specific Documentation**
- **`/worktrees/{stack}/{branch}/docs/STAGE_PROGRESS.md`** - Detailed stage implementation progress
- **`/worktrees/{stack}/{branch}/docs/WORKING_JOURNAL.md`** - Daily development notes
- **`/shared/test_plans/active/{stage}_test_plan.md`** - Stage-specific test plans

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
4. **Daily Development**: `/devgo` for guidance, `/testgo` for validation
5. **Save Progress**: `/checkpoint` for regular saves
6. **Complete Stage**: `/stage-complete` when all tasks done

### Directory-Aware Commands
All commands work based on your current directory:
- **In branch folder**: Commands focus on that specific branch
- **In worktrees/**: Commands show all branches in that stack  
- **In project root**: Commands show overall project status
- **In shared/**: Commands focus on documentation and roadmap

## 📊 Version and Phase Structure

### Version 0.1: Framework-First MVP
- **Phase 1 (v0p1.p1)**: LangGraph Foundation & Content
  - content: Article generation workflows with LangGraph
  - podcast: Blog-to-podcast conversion automation
- **Phase 2 (v0p1.p2)**: Analytics Monitoring  
  - analytics: GA4 integration and anomaly detection
- **Phase 3 (v0p1.p3)**: Reddit & External Integrations
  - reddit: Reddit marketing automation workflows
  - external: n8n, Shopify, and API orchestration
- **Phase 4 (v0p1.p4)**: Platform Features
  - builder: Visual workflow designer (frontend)
  - platform: Multi-tenant and billing (backend)

### Branch Naming Convention
Format: `{stack}_{version}_{phase}_{feature}`
- ✅ `backend_v0p1_p1_content`
- ✅ `backend_v0p1_p1_podcast`
- ✅ `backend_v0p1_p2_analytics`
- ✅ `backend_v0p1_p3_reddit`
- ✅ `frontend_v0p1_p4_builder`
- ❌ `backend_week2_content` (don't use week numbers)
- ❌ `backend_v0p1_p1_content_pipeline` (too long)

### Feature Name Mapping
- `content` → Content Generation Pipeline (articles, SEO, publishing)
- `podcast` → Podcast Automation (TTS, audio processing, distribution)
- `analytics` → GA4 Analytics Monitoring (anomaly detection, reporting)
- `reddit` → Reddit Marketing Automation (monitoring, posting, engagement)
- `external` → External Integrations (n8n, Shopify, API orchestration)
- `builder` → Visual Workflow Builder UI (drag-and-drop designer)
- `platform` → Platform Features (multi-tenant, billing, marketplace)

### Manual Branch Creation
```bash
# From project root, create new worktree
git worktree add worktrees/backend/backend_v0p1_p1_content -b backend_v0p1_p1_content backend_framework_first

# Navigate and setup
cd worktrees/backend/backend_v0p1_p1_content
bash /home/duyth/projects/agentic_system/shared/scripts/install-commands.sh

# Get context (auto-detects from path)
/workhere
```

### Version Evolution Path
- **v0.1-v0.9**: MVP iterations and feature development
- **v1.0**: First production release (post-MVP validation)
- **v1.1-v1.9**: Production enhancements and optimization  
- **v2.0**: Major feature expansions and enterprise features

**What We've Accomplished:**
- ✅ Fixed SQLAlchemy metadata reserved keyword errors
- ✅ Removed 70% of over-engineered complexity (170+ → 111 files)
- ✅ Clean framework-first worktree branches created
- ✅ Enhanced documentation structure with cross-branch tracking
- ✅ Context-aware command system with branch-specific guidance

**What We're Building On:**
- ✅ LangGraph for workflow orchestration
- ✅ Open Agent Platform (OAP) for tool management
- ✅ AG UI for real-time workflow visualization
- ✅ FastAPI backend structure (cleaned)
- ✅ React admin UI foundation
- ✅ PostgreSQL database with corrected models

### Tech Stack Overview

#### Foundation Platform
- **Open Agent Platform (OAP)**: LangChain's open-source agentic framework for multi-agent orchestration
- **LangGraph**: Agent workflow orchestration and state management (core to OAP)
- **LangChain**: LLM integration and tool connectivity
- **LangSmith**: AI monitoring, debugging, and observability

#### Core Infrastructure
- **PostgreSQL**: Tenant data, SOPs, task tracking (via OAP configuration)
- **Redis**: Caching, task queues, session management
- **FastAPI**: Custom API extensions and business logic layer on top of OAP
- **React**: Web dashboard and testing interface

#### AI & Intelligence
- **Neo4j + Graphiti**: Knowledge graph and relationship learning (planned for future)
- **OpenAI/Anthropic**: LLM providers for reasoning and analysis
- **Embedding Models**: For semantic matching and SOP similarity

#### Integrations
- **MCP SDK**: Standardized tool connections following OAP patterns (planned)
- **n8n**: Visual workflow automation (planned integration)
- **Direct APIs**: Platform integrations (Shopify, GA4, etc.) - coming in v0.3

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

#### v0p1.p1: LangGraph Foundation & Content
**Goal**: Build framework-first foundation with real content generation workflows
**Status**: Framework Setup (s1) in progress, Content Generation (s2) pending

**Key Features**:
- LangGraph integration with state management and checkpointing
- Content generation pipeline with topic research, article generation, SEO optimization
- Podcast automation with TTS and audio processing
- Real-time workflow monitoring with AG UI

### 🎯 Future Phases

#### v0p1.p2: Analytics Monitoring (4-6 weeks)
- **GA4 Integration**: Real-time analytics monitoring with anomaly detection
- **Performance Tracking**: Content performance metrics and reporting
- **Advanced Analytics**: Predictive analytics and custom alert routing

#### v0p1.p3: Reddit & External Integrations (4-6 weeks)
- **Reddit Automation**: Marketing workflow with monitoring and engagement
- **External APIs**: n8n, Shopify, and multi-step API orchestration
- **Advanced Orchestration**: Workflow composition and human-in-the-loop

#### v0p1.p4: Platform Productization (6-8 weeks)
- **Visual Builder**: Drag-and-drop workflow designer
- **Multi-Tenant**: User accounts, workspace isolation, billing
- **Platform Features**: Workflow marketplace, API access, white-label options

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost/agentic
REDIS_URL=redis://localhost:6379
NEO4J_URL=bolt://localhost:7687

# AI Services
OPENAI_API_KEY=your-key-here
DEFAULT_MODEL=gpt-3.5-turbo
REASONING_MODEL=gpt-4

# External Services (for future integration)
SHOPIFY_API_KEY=your-key
N8N_API_URL=http://localhost:5678
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
- **SOP Matching Tests**: Verify correct SOP identification for various tasks
- **LangGraph Workflows**: Test state management and node execution
- **Content Generation**: Validate real content creation pipelines
- **Performance**: <2 seconds for workflow orchestration

### Example Test Scenarios
```yaml
# Framework Foundation
- LangGraph state management and checkpointing
- OAP tool registry and agent coordination
- AG UI real-time workflow monitoring

# Content Generation
- Topic research → content generation → SEO → publishing pipeline
- Content quality validation and approval gates
- Multi-platform publishing workflows
```

## Important Notes

- **Framework-First Approach**: Built on LangGraph + OAP + AG UI from day one
- **Documentation-Driven**: Enhanced structure with cross-branch tracking
- **Context-Aware Commands**: All commands adapt to current branch/location
- **Stage Gate Process**: Mandatory approval between stages with `/stage-complete`
- **Branch-Specific Progress**: Detailed tracking in STAGE_PROGRESS.md files
- **Project-Level Visibility**: STAGE_STATUS.md provides cross-branch overview
- **Production Ready Foundation**: Clean codebase prepared for real implementations
- **LangGraph Workflows**: Use LangGraph for all workflow orchestration
- **Real Value First**: Focus on immediate business value before complex features

This project aims to create an intelligent automation platform that delivers real value quickly while maintaining a solid technical foundation for future growth.

---

## Stack-Specific Instructions

For technology-specific setup, development commands, and implementation details:

- **Backend (Python/FastAPI)**: See `backend/BACKEND_SPECIFIC.md`
- **Frontend (React/TypeScript)**: See `frontend/FRONTEND_SPECIFIC.md`
- **Infrastructure**: See `infrastructure/` directory for Docker and monitoring configs