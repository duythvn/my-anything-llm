# New Member Onboarding Guide

## Quick Start (5 Minutes)

### 1. Setup Your Branch
```bash
# Navigate to project root
cd /path/to/your/agentic_system

# Create your development branch
git worktree add worktrees/backend/backend_v0p1_p1_content -b backend_v0p1_p1_content backend_framework_first

# Setup development environment
cd worktrees/backend/backend_v0p1_p1_content
bash /path/to/shared/scripts/install-commands.sh
source venv/bin/activate
```

### 2. Start Developing
```bash
# Get context and guidance
/workhere

# Development workflow
/devgo      # Check development status and get guidance
/testgo     # Execute tests for current stage
/checkpoint # Save progress regularly
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

This enhanced onboarding process ensures new team members can quickly become productive while maintaining proper documentation and progress tracking across all development streams.