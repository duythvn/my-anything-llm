# New Member Onboarding Guide

## Quick Start (5 Minutes)

### 1. Setup Your Branch
```bash
# Navigate to project root

# Create your development branch
git worktree add worktrees/backend/backend_v0p1_p1_content -b backend_v0p1_p1_content backend_main

# Setup development environment
cd worktrees/backend/backend_v0p1_p1_content
bash /home/duyth/projects/anythingllm/shared/scripts/install-commands.sh
npm install
```

### 2. Start Developing
```bash
# Get context and guidance
/workhere

# Plan and implement features
/plan Phase 1.1 Core API Infrastructure  # Create detailed task breakdown
/implement [specific task]               # Implement from breakdown
/devgo                                   # Validate and create test plan
/testgo                                  # Execute tests
```

### 3. Complete a Stage
```bash
# When stage is complete:
/testgo                           # Verify all tests pass
/stage-complete                   # Mark stage officially complete
/checkpoint "Stage X.Y complete"  # Save final state

# Check overall progress
/branchstatus                     # View cross-branch status
```

---

## Detailed Setup Guide

### Step 1: Understand the Project Structure
1. **Read the project documentation** - This README and `CLAUDE.md`
2. **Check current status** - See `shared/docs/STAGE_STATUS.md` for cross-branch progress
3. **Understand git worktree setup** - Multiple development branches isolated

### Step 2: Create Your Development Branch

```bash
# From project root
cd /home/duyth/projects/anythingllm

# Create new backend branch for AnythingLLM B2B development
git worktree add worktrees/backend/backend_v0p1_p1_content -b backend_v0p1_p1_content backend_main

# Examples for different stages:
# git worktree add worktrees/backend/backend_v0p1_p2_widget -b backend_v0p1_p2_widget backend_main
# git worktree add worktrees/backend/backend_v0p1_p3_ecommerce -b backend_v0p1_p3_ecommerce backend_main

# Verify the folder was created
ls -la worktrees/backend/backend_v0p1_p1_content
```

### Step 3: Setup Development Infrastructure

```bash
cd worktrees/backend/backend_v0p1_p1_content

# Setup all Claude commands and symlinks
bash /home/duyth/projects/anythingllm/shared/scripts/install-commands.sh

# This creates symlinks for:
# - ./CLAUDE.md -> shared/CLAUDE.md
# - ./docs_shared -> shared/docs
# - ./refs_shared -> shared/refs
# - ./.claude/commands -> shared commands (devgo.md, testgo.md, checkpoint.md, etc.)
# - ./.claude/agents -> shared agents (planner.md, coder.md, tester.md)

# Verify symlinks are created
ls -la ./.claude/
```

### Step 4: Initialize AnythingLLM Development Environment

```bash
# Navigate to your new worktree
cd worktrees/backend/backend_v0p1_p1_content

# Install AnythingLLM dependencies
npm install

# Setup environment variables (copy from .env.example)
cp .env.example .env
# Edit .env with your API keys and database settings

# Start AnythingLLM development server
npm run dev

# Verify setup
ls -la ./.claude/commands/  # Should show devgo.md, testgo.md, workhere.md, etc.

# Get branch context and start working
/workhere
```

### Step 5: Development Workflow

Follow this workflow for implementing features:

```bash
# 1. Plan your work
/plan Phase 1.1 Core API Infrastructure  # Create detailed task breakdown

# 2. Implement specific tasks
/implement P1-S1-T002 PostgreSQL Database # Implement from breakdown

# 3. Validate implementation
/devgo                                    # Create test plan and validate

# 4. Execute tests
/testgo                                   # Run tests and generate reports

# 5. Mark stage complete when all tests pass
/stage-complete                           # Official stage completion

# 6. Check overall project progress
/branchstatus                            # View cross-branch status
```

---

## Daily Development Commands

**Essential Commands:**
- `/workhere` - Get current branch context and status
- `/plan [stage]` - Create detailed task breakdowns (P1-S1-BREAKDOWN.md)
- `/implement [task]` - Code implementation following breakdowns
- `/devgo` - Post-implementation validation and test plan creation
- `/testgo` - Execute test plans and generate reports
- `/checkpoint` - Save progress regularly
- `/stage-complete` - Mark stage officially complete

**AnythingLLM Development:**
```bash
# Start development server
npm run dev

# Install dependencies
npm install

# Environment setup
cp .env.example .env
# Edit .env with your API keys
```

**Troubleshooting:**
1. **Commands not found**: Re-run `bash /home/duyth/projects/anythingllm/shared/scripts/install-commands.sh`
2. **Symlinks broken**: Check `.claude/commands/` and `.claude/agents/` directories
3. **Environment issues**: Verify `.env` file has correct API keys and database settings

---

## 🤔 FAQ

### Q: What's the correct development sequence?

**The Real Command Flow:**

```bash
# 🎯 CORRECT SEQUENCE WITH TASK BREAKDOWNS
/workhere              # 1. Get context
/plan Phase 1.1        # 2. Create P1-S1-BREAKDOWN.md with detailed tasks
/implement [task]      # 3. Implement specific task from breakdown  
/devgo                 # 4. POST-implementation: create test plan & validate
/testgo                # 5. Execute test plan generated by /devgo
/checkpoint            # 6. Save progress
/stage-complete        # 7. Mark stage complete when all tests pass

# ✅ EXAMPLE WORKFLOW:
/plan Phase 1.1 Core API Infrastructure     # Creates P1-S1-BREAKDOWN.md
/implement P1-S1-T002 PostgreSQL Database   # Implements specific task
/devgo                                       # Validates completion, creates test plan
/testgo                                      # Executes test plan, generates report
```

**Key Commands Clarified:**

| Command | When to Use | Purpose | Creates/Updates |
|---------|-------------|---------|-----------------|
| `/workhere` | First step always | Get branch context and status | - |
| `/plan [stage]` | Start of stage | Create detailed task breakdowns | P1-S1-BREAKDOWN.md |
| `/implement [task]` | After planning | Code implementation from breakdown | Code changes |
| `/devgo` | After implementation | POST-implementation validation & test creation | Test plan, STAGE_PROGRESS.md |
| `/testgo` | When test plan exists | Execute tests, generate reports | Test reports |
| `/dev-cycle` | Complex features | Full plan→implement→devgo→testgo cycle | Full workflow |

### Q: After /implement, what's next - /devgo or /testgo?

**✅ ALWAYS use `/devgo` first, then `/testgo`**

```bash
/implement P1-S1-T002 PostgreSQL Database  # Implement task
/devgo                                      # NEXT: Validate & create test plan
/testgo                                     # THEN: Execute the test plan
```

**Why this order?**

1. **`/devgo` validates completion**:
   - Checks if implementation is actually complete
   - Updates STAGE_PROGRESS.md with current status
   - Creates test plan if implementation is ready
   - Provides guidance if more work is needed

2. **`/testgo` executes testing**:
   - Runs the test plan created by `/devgo`
   - Generates detailed pass/fail reports
   - Only works if test plan exists

**❌ Don't skip `/devgo`** - `/testgo` needs a test plan to work!

### Q: When do I use /plan vs existing task breakdowns?

**We have multiple levels of planning:**

| Level | Purpose | Location | Example | When Created |
|-------|---------|----------|---------|--------------|
| **Roadmap** | High-level features | `/shared/docs/ROADMAP.md` | "Phase 1.1: Core API Infrastructure" | Manual planning |
| **Task Breakdown** | Specific 2-4 hour tasks | `/shared/docs/task_management/task_breakdown/` | P1-S1-BREAKDOWN.md with detailed tasks | Via `/plan [stage]` |
| **Feature Specs** | Technical architecture | Various locations | Technical implementation details | Via `@planner [feature]` |

**Document Creation by Command:**

**`/plan [stage]` → Creates P[X]-S[Y]-BREAKDOWN.md files:**
```bash
/plan Phase 1.1 Core API Infrastructure
# Creates: /shared/docs/task_management/task_breakdown/P1-S1-BREAKDOWN.md
# Contains: Detailed tasks, estimates, dependencies, subtasks
```

**`@planner [feature]` → Creates feature specifications:**
```bash
@planner Multi-source data ingestion system  
# Creates: Technical specification document
# Updates: Existing breakdown files with implementation details
```

**Use `/plan` when:**
- ✅ **Planning roadmap stages** - Need detailed task breakdown files
- ✅ **No breakdown exists** - Transform roadmap items into actionable tasks
- ✅ **Stage planning** - Break down Phase 1.3, 1.4, 2.1, etc.

**Use `@planner` when:**
- ✅ **Feature analysis** - Need technical specifications for complex features
- ✅ **Architecture decisions** - Research multiple implementation approaches
- ✅ **Quick planning** - Custom planning needs without full documentation workflow

**Example Workflow:**
```bash
# 1. Start with roadmap stage
/plan Phase 1.3 Widget Development
# → Creates P1-S3-BREAKDOWN.md with detailed tasks

# 2. For complex features within that stage
@planner Embeddable JavaScript widget with customization
# → Creates technical specification for implementation

# 3. Implement specific tasks
/implement Widget core JavaScript SDK
```

This FAQ should help you navigate the development workflow efficiently while maintaining code quality and proper documentation.