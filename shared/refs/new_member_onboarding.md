# New Member Onboarding Guide

## Quick Start (5 Minutes)

### 1. Setup Your Branch
```bash
# Navigate to project root

# Create your development branch
git worktree add worktrees/backend/backend_v0p1_p1_content -b backend_v0p1_p1_content backend_framework_first

# Setup development environment
cd worktrees/backend/backend_v0p1_p1_content
bash /path/to/shared/scripts/install-commands.sh
source venv/bin/activate
```

### 2. Start Developing with Sub-Agents
```bash
# Get context and guidance
/workhere

# NEW: Use specialized sub-agents for development
@planner Create technical spec for [your feature]
@coder Implement [feature] using TDD approach
@tester Review and validate the implementation

# Or use the full development cycle
/dev-cycle [your feature description]
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

## 🤖 NEW: Sub-Agent Development Workflow

### Understanding the Three Agents

1. **Planner Agent** (`@planner`)
   - Creates technical specifications
   - Researches best approaches
   - Breaks down work into tasks
   - Updates project documentation

2. **Coder Agent** (`@coder`)
   - Implements features using TDD
   - Writes clean, modular code
   - Creates comprehensive tests
   - Follows project standards

3. **Tester Agent** (`@tester`)
   - Reviews code quality
   - Runs and writes tests
   - Checks security and performance
   - Validates specifications

### Agent-Driven Development Commands

```bash
# Individual agent invocation
@planner Analyze requirements for career page monitoring
@coder Implement the Company model with tests
@tester Review the scraping service implementation

# Helper commands
/plan [feature]      # Invokes planner for technical spec
/implement [feature] # Invokes coder for implementation
/review [feature]    # Invokes tester for quality check
/dev-cycle [feature] # Runs complete plan→code→test cycle
```

---

## Detailed Setup Guide

### Step 1: Understand the Project Structure
1. **Read the scaffold documentation** - This README and `shared/CLAUDE.md`
2. **Check current status** - See `shared/docs/STAGE_STATUS.md` for cross-branch progress
3. **Understand git worktree setup** - Multiple development branches isolated

### Step 2: Create Your Development Branch

```bash
# From project root
cd /path/to/your/agentic_system

# Create new backend branch (follow v0p1 naming convention)
git worktree add worktrees/backend/backend_v0p1_p1_content -b backend_v0p1_p1_content backend_framework_first

# Or create frontend branch
git worktree add worktrees/frontend/frontend_v0p1_p4_builder -b frontend_v0p1_p4_builder frontend_framework_first

# Examples for different phases:
# git worktree add worktrees/backend/backend_v0p1_p1_podcast -b backend_v0p1_p1_podcast backend_framework_first
# git worktree add worktrees/backend/backend_v0p1_p2_analytics -b backend_v0p1_p2_analytics backend_framework_first
# git worktree add worktrees/backend/backend_v0p1_p3_reddit -b backend_v0p1_p3_reddit backend_framework_first

# Verify the folder was created
ls -la worktrees/backend/backend_v0p1_p1_content
```

### Step 3: Setup Development Infrastructure

```bash


cd worktrees/backend/backend_v0p1_p1_content
# Setup all Claude commands and symlinks for ALL worktrees
bash shared/scripts/install-commands.sh

# This creates symlinks for:
# - ./bin/claude-doc-start (environment setup helper)
# - ./CLAUDE.md -> shared/CLAUDE.md
# - ./docs_shared -> shared/docs
# - ./refs_shared -> shared/refs
# - ./.claude/commands -> .claude/commands (devgo.md, testgo.md, checkpoint.md, etc.)
# - ./venv -> worktrees/backend/venv (backend only)
# - ./test_plans/shared_test_plans -> shared/test_plans

# Verify symlinks are created
ls -la worktrees/backend/backend_v0p1_p1_content/
```

### Step 4: Initialize Your Development Environment

```bash
# Navigate to your new worktree
cd worktrees/backend/backend_v0p1_p1_content

# For Backend: Activate virtual environment
source venv/bin/activate

# Install dependencies (if needed)
pip install -r requirements.txt

# Start the development server
python main.py

# Verify setup
ls -la ./bin/
ls -la ./.claude/commands/  # Should show devgo.md, testgo.md, workhere.md, etc.

# Test database connection (if needed)
python -c "from app.core.database import get_db; print('Database connection OK')"

# Get branch context and start working
/workhere
```

### Step 5: Enhanced Stage Completion Process

When you complete a development stage, follow this enhanced workflow:

```bash
# 1. Verify implementation completion
/devgo                            # Check remaining tasks and get guidance

# 2. Execute comprehensive testing
/testgo                           # Run all tests for current stage

# 3. If tests fail, fix and repeat
/devgo                            # Get fix recommendations
# Fix issues...
/testgo                           # Test again until all pass

# 4. Official stage completion
/stage-complete                   # Mark stage complete in shared roadmap
# Auto-detects stage from current worktree folder path
# Validates completion evidence and updates STAGE_STATUS.md
# Creates final checkpoint with completion message

# 5. Check overall project progress
/branchstatus                     # View cross-branch completion matrix

# 6. Merge to foundation branch (run from project root)
cd /path/to/project/root
cd worktrees/backend/backend_framework_first
git add . && git commit -m "Prepare for merge"  # Clean any uncommitted changes
git merge your_stage_branch       # Merge completed work into foundation

# 7. Create next branch from updated foundation
cd /path/to/project/root
git worktree add worktrees/backend/backend_v0p1_p1_next -b backend_v0p1_p1_next backend_framework_first

# 8. Optional: Clean up completed branch
git branch -D your_completed_branch  # Only after successful merge
```

**Enhanced Process Benefits:**
- ✅ **Official Tracking**: `/stage-complete` updates shared STAGE_STATUS.md
- ✅ **Evidence-Based**: Validates completion before marking done
- ✅ **Cross-Branch Visibility**: All team members see progress via `/branchstatus`
- ✅ **Proper Documentation**: Maintains both branch-specific and project-level progress
- ✅ **Clear History**: Each stage completion is officially tracked

---

## Enhanced Daily Development Workflow

### Start Coding Session

```bash
# Option 1: See available branches and choose
/resumebranch
# (shows all branches with status, pick one)

# Option 2: Go directly to known branch  
cd worktrees/backend/backend_v0p1_p1_content

# For Backend: Always activate virtual environment first
source venv/bin/activate

# Start development server (in one terminal)
python main.py

# Start Claude Code with hooks enabled (in another terminal)
claude

# In Claude session, get context and guidance:
/workhere    # Auto-detects branch and provides context
```

### 🆕 Agent-Driven Development Flow

```bash
# Step 1: Planning Phase (Morning)
@planner Analyze the requirements for [today's feature].
Create a technical specification with implementation approach.

# Step 2: Implementation Phase (Midday)
@coder Implement [feature] following the technical spec.
Use TDD approach and create comprehensive tests.

# Step 3: Review Phase (Afternoon)
@tester Review the implementation of [feature].
Check code quality, test coverage, and security.

# Alternative: Use the automated cycle
/dev-cycle [feature description]
# This runs all three agents in sequence automatically
```

### Traditional Command Flow (Still Available)

```bash
/devgo       # Check development status and get guided workflow
/testgo      # Execute tests specific to current stage
/checkpoint  # Create development checkpoint regularly
```

#### Enhanced Claude Commands

**Navigation & Context Commands:**
- `/workhere` - Auto-detect current branch and provide development context
- `/resumebranch` - Show all available branches with status to choose from
- `/branchstatus` - View cross-branch progress matrix and overall project health

**Development & Testing Commands:**
- `/devgo` - Branch-specific development workflow with implementation guidance
- `/testgo` - Execute test plans specific to current stage
- `/checkpoint` - Context-aware progress saving (project vs branch level)
- `/stage-complete` - Official stage completion with roadmap updates

**When to Use Each Command:**
- **Start coding session**: `/resumebranch` → choose branch → `/workhere`
- **During development**: `/devgo` for guided development workflow and task management
- **Before major commits**: `/testgo` to run comprehensive stage-specific tests
- **Regular saves**: `/checkpoint` to save progress with context-aware updates
- **Stage completion**: `/stage-complete` for official completion tracking
- **Check progress**: `/branchstatus` to see overall project and cross-branch status

#### Backend Development Commands

```bash
# Backend Development
source venv/bin/activate           # Always activate venv first
python main.py                     # Start FastAPI server
pytest tests/ -v                   # Run tests
python -m uvicorn main:app --reload # Alternative server start

# Database Operations
alembic upgrade head               # Apply database migrations
alembic revision --autogenerate -m "description"  # Create new migration

# Code Quality
python -m black app/               # Format code
python -m flake8 app/              # Check code style
python -m mypy app/                # Type checking

# Git Operations
git status                         # Check git status
git add .                          # Stage changes
git commit -m "description"        # Commit changes
git push origin branch_name        # Push to remote
```

### Enhanced Troubleshooting

**Common Issues:**

1. **"Module not found" errors**: Make sure you activated the virtual environment:
   ```bash
   source venv/bin/activate
   ```

2. **Database connection errors**: Check if PostgreSQL is running and connection string is correct

3. **Port already in use**: FastAPI server (port 8000) might already be running:
   ```bash
   ps aux | grep python  # Find running processes
   kill -9 <process_id>   # Kill if needed
   ```

4. **Claude commands not found**: Re-run the install script:
   ```bash
   bash shared/scripts/install-commands.sh
   ```

5. **Documentation out of sync**: Use enhanced command system:
   ```bash
   /devgo       # Updates branch-specific documentation
   /checkpoint  # Updates project-level or branch-specific based on location
   ```

### Enhanced File Structure After Setup

```
worktrees/backend/backend_v0p1_p1_content/
├── app/                    # Main application code
├── tests/                  # Test files
├── docs/                   # Branch-specific documentation
│   ├── STAGE_PROGRESS.md   # Detailed stage implementation progress
│   └── WORKING_JOURNAL.md  # Daily development notes
├── main.py                 # FastAPI entry point
├── requirements.txt        # Python dependencies
├── bin/                    # Symlinked command scripts
│   └── claude-doc-start    # Environment setup helper
├── .claude/                # Claude configuration
│   └── commands/           # Symlinked to shared commands
│       ├── devgo.md        # Development workflow command
│       ├── testgo.md       # Test execution command
│       ├── workhere.md     # Context-aware guidance
│       ├── resumebranch.md # Branch selection
│       ├── branchstatus.md # Cross-branch progress
│       ├── checkpoint.md   # Progress saving
│       └── stage-complete.md # Stage completion
├── CLAUDE.md               # Symlinked to shared/CLAUDE.md
├── docs_shared/            # Symlinked to shared/docs
│   ├── STAGE_STATUS.md     # Cross-branch completion matrix
│   ├── WORKING_JOURNAL.md  # Project-level progress
│   └── COMMAND_RESPONSIBILITIES.md # Command documentation
├── refs_shared/            # Symlinked to shared/refs
├── test_plans/
│   └── shared_test_plans/  # Symlinked to shared/test_plans
└── venv/                   # Symlinked to shared virtual environment
```

## Documentation Structure Benefits

### **Project-Level Visibility**
- **STAGE_STATUS.md**: See progress across all branches and stages
- **WORKING_JOURNAL.md**: Strategic milestones and project health
- **COMMAND_RESPONSIBILITIES.md**: Clear command documentation

### **Branch-Specific Detail**
- **STAGE_PROGRESS.md**: Task-by-task completion tracking
- **WORKING_JOURNAL.md**: Daily development notes and decisions
- **Test Plans**: Stage-specific validation and testing

### **Command Integration**
- **Context-Aware**: Commands adapt to current location (root vs branch)
- **Automatic Updates**: Documentation stays current with development
- **Official Completions**: `/stage-complete` provides formal stage tracking

## 🎯 Sub-Agent Best Practices

### When to Use Each Agent

**Use Planner Agent When:**
- Starting a new feature or module
- Facing complex architectural decisions
- Need to research multiple approaches
- Breaking down large tasks
- Creating API specifications

**Use Coder Agent When:**
- Have a clear technical specification
- Implementing new features
- Writing tests (TDD approach)
- Refactoring existing code
- Creating reusable components

**Use Tester Agent When:**
- Code is ready for review
- Need comprehensive test coverage
- Checking security vulnerabilities
- Validating performance
- Before merging to main branch

### Effective Agent Prompts

**Good Planner Prompts:**
```bash
@planner Research and design a web scraping service that handles:
- Multiple career page formats
- Rate limiting and retries
- Australia/Remote keyword detection
Compare BeautifulSoup vs Playwright approaches.
```

**Good Coder Prompts:**
```bash
@coder Implement the Company model with:
- SQLAlchemy ORM mapping
- Pydantic schema for validation
- Full CRUD operations
- Comprehensive pytest tests
Follow the technical spec from planner.
```

**Good Tester Prompts:**
```bash
@tester Review the web scraping implementation:
- Check error handling for network failures
- Validate rate limiting effectiveness
- Test with 5 different career page formats
- Verify security against malicious HTML
```

### Common Workflows

**Feature Development:**
```bash
# Day 1: Planning
@planner Design the job duplicate detection system

# Day 2: Implementation
@coder Implement duplicate detection using the spec

# Day 3: Testing & Refinement
@tester Review duplicate detection implementation
@coder Fix issues found in review
@tester Validate fixes
```

**Bug Fixing:**
```bash
# Quick fix flow
@tester Analyze bug report #123 and identify root cause
@coder Fix the identified issue with tests
@tester Verify the fix resolves the issue
```

**Refactoring:**
```bash
@planner Analyze current scraping code and design refactoring plan
@coder Refactor scraping service following the plan
@tester Ensure refactoring maintains functionality
```

## 📈 Measuring Success with Sub-Agents

### Key Metrics to Track

1. **Planning Quality**
   - Spec completeness (% of features covered)
   - Implementation accuracy (spec vs actual)
   - Rework rate due to planning gaps

2. **Development Velocity**
   - Features completed per week
   - Time from spec to implementation
   - Test coverage achieved

3. **Code Quality**
   - Review pass rate (first time)
   - Bugs found post-review
   - Security issues identified

### Weekly Retrospective Format

```markdown
## Week X Retrospective

### Agent Performance
- **Planner**: [Specs created, quality rating]
- **Coder**: [Features implemented, test coverage]
- **Tester**: [Issues found, reviews completed]

### Improvements
- [What worked well]
- [What needs adjustment]
- [Agent prompt refinements]

### Next Week Focus
- [Priority features]
- [Agent utilization plan]
```

This enhanced onboarding process with sub-agents ensures new team members can quickly become productive while maintaining high code quality through specialized AI assistance at each development phase.

---

## 🤔 FAQ: Commands vs Sub-Agents

### Q: When should I use `/devgo` vs `/plan` command?

**Use `/devgo` when:**
- You've implemented a feature and want to check if tests pass/fail
- You need to create test plans for completed implementation
- You want to fix failed tests or get fix recommendations
- You're in the post-implementation testing phase

**Use `/plan` (or `@planner`) when:**
- You're starting a new feature and need architectural design
- You need technical specifications created
- Multiple implementation approaches exist and need evaluation
- You're at the beginning of the development cycle

**Example Flow:**
```bash
# 1. Start new feature - plan first
/plan Multi-source data ingestion for AnythingLLM

# 2. Implement the planned feature
/implement Data connectors following the technical spec

# 3. Test completed implementation
/devgo    # Creates test plan or fixes failed tests
```

### Q: When should I use `/testgo` vs `@tester` agent?

**Use `/testgo` when:**
- You want to run predefined test workflows for your current stage
- You need test results automatically documented
- You're following established testing processes
- You want branch-specific test execution

**Use `@tester` when:**
- You need code review and quality assessment
- You want custom test scenarios created
- You need security and performance analysis
- You want independent evaluation of implementations

### Q: Do sub-agents share context? How do I isolate them?

**Shared Context (Same Claude Session):**
```bash
# All agents share conversation history
@planner Create spec for data ingestion
@coder Implement the spec from planner     # Knows about planner's work
@tester Review the implementation          # Knows about both previous agents
```

**Isolated Context (Separate Sessions):**
```bash
# Session 1: Planning only
claude
@planner Create detailed technical specification

# Session 2: Independent coding (fresh context)
claude  
@coder Implement data ingestion following this spec: [paste spec]

# Session 3: Independent review (fresh context)
claude
@tester Review this code without knowing implementation approach: [paste code]
```

**When to isolate:** Use separate sessions for unbiased code review, fresh perspectives, or simulating real team handoffs.

### Q: What's the difference between commands and sub-agents?

| Aspect | Commands (`/devgo`, `/testgo`) | Sub-Agents (`@planner`, `@coder`, `@tester`) |
|--------|-------------------------------|---------------------------------------------|
| **Purpose** | Workflow orchestration | Specialized expertise |
| **Structure** | Predefined processes | Flexible conversation |
| **Documentation** | Auto-updates project docs | Manual documentation |
| **Context** | Branch/stage aware | Session-based memory |
| **Use Case** | Process management | Creative problem solving |

### Q: I'm at 0% complete on Day 1. What should I run first?

**Recommended sequence from `/home/duyth/projects/anythingllm/worktrees/backend/backend_v0p1_p1_content`:**

```bash
# 1. Get context and current status
/workhere

# 2. Plan your first feature (Phase 1.1 Core API Infrastructure)
/plan Core API infrastructure with multi-source data connectors

# 3. Implement the planned feature
/implement Core API following the technical specification

# 4. Test your implementation
/devgo    # Create test plan and run tests for completed work
```

### Q: How do I know which approach to use for my current task?

**Decision Framework:**

1. **Start with `/workhere`** - Always get context first
2. **Use `/plan`** - If you're starting a new feature and need architectural design
3. **Use `/implement`** - If you have clear specs and need implementation  
4. **Use `/devgo`** - After implementation to create test plans or fix failed tests
5. **Use `/testgo`** - To execute existing test plans and generate reports

**Example for Phase 1.1:**
- Roadmap says: "Create simplified client/workspace model"
- **Step 1**: `/plan simplified client/workspace model for AnythingLLM B2B`
- **Step 2**: `/implement client model following the technical specification`
- **Step 3**: `/devgo` to create test plan for completed model
- **Step 4**: `/testgo` to execute tests and verify implementation

### Q: What if I need independent review without bias?

**Use separate Claude sessions:**

```bash
# Session 1: Development work
@coder Implement feature X

# Session 2: Independent review (don't mention Session 1)
claude
@tester Review this implementation for security and performance: [paste code]
```

This gives you unbiased review since the tester agent doesn't know how the code was developed.

### Q: Can I combine approaches?

**Yes! Recommended hybrid workflow:**

```bash
# Daily workflow
/workhere                    # Get context
/plan [new feature]          # Design architecture  
/implement [spec]            # Build features
/devgo                       # Create test plans post-implementation
/testgo                      # Execute test plans
@tester [custom review]      # Additional quality checks (if needed)
/checkpoint                  # Save progress
```

### Q: What if commands aren't working?

**Troubleshooting:**

1. **Check location**: Commands are path-aware, make sure you're in the right worktree
2. **Reinstall commands**: `bash /home/duyth/projects/agentic_system/shared/scripts/install-commands.sh`
3. **Check symlinks**: `ls -la .claude/commands/` should show command files
4. **Verify setup**: `/workhere` should auto-detect your branch

### Q: How do I track progress across the project?

**Multi-level tracking:**

- **Branch level**: `/devgo` updates your specific STAGE_PROGRESS.md
- **Project level**: `/checkpoint` from project root updates shared docs
- **Cross-branch**: `/branchstatus` shows overall progress matrix
- **Stage completion**: `/stage-complete` marks official milestones

**Example:**
```bash
# From your worktree
/devgo                      # Update branch progress
cd /path/to/project/root    
/branchstatus              # See overall project status
```

### Q: What's the correct development sequence?

**The Real Command Flow:**

```bash
# 🎯 CORRECT SEQUENCE
/workhere          # 1. Get context
/plan [feature]    # 2. Plan architecture (start of cycle)
/implement [spec]  # 3. Build the feature  
/devgo            # 4. Test/validate completed work (end of cycle)
/testgo           # 5. Execute test plans
/checkpoint       # 6. Save progress

# 🚫 INCORRECT - Don't use /devgo to start development!
# /devgo is for POST-implementation testing, not starting work
```

**Key Commands Clarified:**

| Command | When to Use | Purpose |
|---------|-------------|---------|
| `/workhere` | First step always | Get branch context and status |
| `/plan` | Start of feature | Architectural design via @planner |
| `/implement` | After planning | Code implementation via @coder |
| `/devgo` | After implementation | Create test plans, fix failed tests |
| `/testgo` | When test plan exists | Execute tests, generate reports |
| `/dev-cycle` | Complex features | Full plan→implement→test cycle |

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