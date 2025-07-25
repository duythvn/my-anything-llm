## FYI: Agentic System Project Scaffold 

This scaffold provides a complete project structure template for building modern agentic systems with  multi-agent coordination, and comprehensive observability. Features git worktree-based development, Claude Code integration, defensive security hooks, and automated TTS notifications.


## About this project:
A prompt manager that allows users to create & manage  prompt templates.
It gives some useful features such as available as a chrome ext, on the go (phone app or PWA) and allow users to plug in LLM API to use LLM to optimise their prompt further or to execute the prompt for them.
We may also build up additional features to target niche markets (users who need a "movie script builder" companion or users who want to build up prompt workflow pipeline)


## Note:
The current frontend branch was built with React Native and Expo framework, although we don't necessary need to stick with that
PWA can be consider as an option (as it's easier to implement and maintain), 
Some ref projects under / demo_projects that we can use to build our app if we decide to go with Web / PWA route
- next_js: good one, it's a full scale web app
- vite_demo: good one,  it's a full scale web app with some demonstration of the chrome ext
- vite_demo_with_demo_components: this is a light weight web app (fewer features) but it has  "demo" page with all the style/components with 4 different schemes
If we decide to build up the web app with the PWA route, it's strongly recommend to follow the style guideline here, and build up the layout similar to next_js or vite_demo or something else


## 🚀 QUICK ONBOARDING

### Vibe coding with the project
Ask Claude Code to analyse the feature to be build
Ask Claude Code to review the ROADMAP  shared/docs/ROADMAP.md
Ask Claude code to update the ROADMAP, TASKS, and Task Break Down in shared/docs/task_management accordingly
Follow Roadmap to create new worktree from the current main branch (e.g: frontend_main) to work on the new stage/feature 
Then commit git to that branch 
Then come back to the main worktree (e.g: frontend_main) and merge to that tree
Also ensure to ask Claude to update ROADMAP and TASK list to ensure they are up-to-date
Rinse and repeate


### Git Worktree Structure & Development Process

This project uses **git worktrees** for parallel feature development. Each worktree is an isolated working directory that allows multiple branches to be worked on simultaneously.

#### 📂 Folder Structure
```
project_root/
├── .git/                    # Main git repository
├── shared/                  # Shared resources across all branches
│   ├── docs/               # Project documentation
│   ├── scripts/            # Setup and utility scripts
│   └── CLAUDE.md           # Main development guidelines
├── worktrees/              # Isolated development environments
│   ├── backend/            # Backend feature branches
│   │   ├── backend_main/   # Main backend branch
│   │   ├── backend_v0p1_p1_content/    # Content generation feature
│   │   ├── backend_v0p1_p2_analytics/  # Analytics feature
│   │   └── backend_v0p1_p3_reddit/     # Reddit automation feature
│   └── frontend/           # Frontend feature branches
│       ├── frontend_main/  # Main frontend branch
│       ├── frontend_v0p1_p4_builder/   # Visual builder feature
│       └── frontend_v0p1_p4_platform/  # Platform features
└── sample_files/           # Template files for new branches
```

#### 🔄 Step-by-Step Development Process

**1. Initialize Git Repository (First Time Only)**
```bash
# Start in your project directory
cd /path/to/your/project

# Initialize git if not already done
git init
git add .
git commit -m "Initial scaffold setup with modern agentic system architecture"

# Create main branches (foundation for worktrees)
git branch backend_main
git branch frontend_main
```

**2. Create Git Worktree for New Feature**
```bash
# From project root - create backend feature branch
git worktree add worktrees/backend/backend_v0p1_p1_content -b backend_v0p1_p1_content backend_main

# Or create frontend feature branch  
git worktree add worktrees/frontend/frontend_v0p1_p4_builder -b frontend_v0p1_p4_builder frontend_main

# Verify worktree was created
git worktree list
ls -la worktrees/backend/backend_v0p1_p1_content/
```

**3. Set Up New Frontend Worktree**
```bash
# Create symlinks to shared resources
bash ../../../shared/scripts/install-commands.sh

# Verify setup
ls -la ./  # Should see package.json, src/, etc.
ls -la ./docs_shared  # Should link to shared/docs
```

**4. Work on Feature in Worktree**
```bash
# Start development server
npm start
# App runs on http://localhost:8081

# Make your changes to the feature
# Edit files in src/, app/, components/, etc.

# Test your changes
npm test

# Check git status (only shows files in this worktree)
git status
```

**5. Commit Your Work**
```bash


# Commit with descriptive message
git commit -m "Implement visual workflow builder

- Added drag-and-drop interface
- Created component library
- Added responsive design
- Tests passing (15/15)

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push your branch
git push -u origin frontend_v0p1_p4_builder
```








=================================

#### 🎯 Branch Naming Convention
Follow this pattern: `{stack}_{version}_{phase}_{feature}`

**Examples:**
- ✅ `backend_v0p1_p1_content` (Backend, Version 0.1, Phase 1, Content feature)
- ✅ `frontend_v0p1_p4_builder` (Frontend, Version 0.1, Phase 4, Builder feature)
- ✅ `backend_v0p1_p2_analytics` (Backend, Version 0.1, Phase 2, Analytics feature)
- ❌ `feature-new-ui` (doesn't follow convention)
- ❌ `backend_week2_content` (avoid week numbers)

#### 🔧 Worktree Management Commands
```bash
# List all worktrees
git worktree list

# Remove completed worktree (after merging)
git worktree remove worktrees/backend/backend_v0p1_p1_content
git branch -d backend_v0p1_p1_content  # Delete the branch

# Move worktree to different location
git worktree move worktrees/backend/old_name worktrees/backend/new_name

# Repair worktree links (if paths change)
git worktree repair
```

#### 🚦 Safe Development Practices

**✅ DO:**
- Work in worktrees for all feature development
- Commit only files related to your feature
- Use descriptive branch names following the convention
- Test thoroughly before committing
- Update documentation as you develop

**❌ DON'T:**
- Use `git add .` (add files selectively)
- Work directly in project root for features
- Mix multiple features in one branch
- Commit without testing
- Hardcode project names (use environment variables)

#### 🎯 Next Steps After Setup
1. **Navigate to your worktree**: `cd worktrees/frontend/your_branch_name`
2. **Start development**: `npm start` or `python main.py`
3. **Use Claude commands**: `/workhere`, `/devgo`, `/testgo`
4. **Follow TDD approach**: Write tests first, then implement
5. **Commit regularly**: Small, focused commits with good messages

## 🆕 What's New in v2.0

- **LangGraph Integration**: Complete workflow orchestration framework
- **Multi-Agent Coordination**: Interface-driven agent management system
- **Modern Architecture**: Updated FastAPI backend with async SQLAlchemy, Redis, Neo4j
- **OpenTelemetry Observability**: Distributed tracing with Jaeger integration
- **Enhanced Frontend**: React 18 with TanStack Query, Zustand, Tailwind CSS
- **Docker Compose Stack**: PostgreSQL, Redis, Neo4j, Jaeger out-of-the-box
- **Tool Ecosystem**: Categorized tool framework for extensible functionality
- **Configuration Management**: Secure environment variable handling with validation

## ⚡ Quick Start

1. **Copy this scaffold** to your new project directory
2. **Install prerequisites** (see Installation section below)
3. **Initialize git repository** in the new directory
4. **Run setup script** to configure worktrees and symlinks
5. **Start developing** with enhanced documentation structure and context-aware commands







========================== can be skipped if you are new to claude code and python ============================
## 📋 Prerequisites & Installation

### Required Software

```bash
# Core dependencies
sudo apt update
sudo apt install -y git python3 python3-pip espeak curl

# Docker (for modern infrastructure stack)
sudo apt install -y docker.io docker-compose-plugin
sudo usermod -aG docker $USER

# Node.js (for frontend development)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# For WSL users (Windows TTS support)
# Ensure PowerShell.exe is accessible from WSL

# For audio output (optional)
sudo apt install -y alsa-utils pulseaudio
```

### Python Dependencies

The hooks use UV for dependency management, but you can also install manually:

```bash
# Option 1: Install UV (recommended)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Option 2: Manual pip installation
pip3 install pyttsx3 python-dotenv gtts pygame

# For backend development (modern stack)
pip3 install fastapi uvicorn sqlalchemy asyncpg redis neo4j langgraph langchain opentelemetry-api
```

## 🚀 Setup Process

```bash
# 1. Copy scaffold to new project
cp -r /path/to/sample_scaffold /path/to/new_project
cd /path/to/new_project

# 2. Initialize git repository
git init
git add .
git commit -m "Initial scaffold setup with modern agentic system architecture"

# 3. Configure environment
cp sample_files/backend_template/.env.example .env
cp sample_files/frontend_template/.env.example frontend.env
# Edit .env files with your configuration

# 4. Test hooks before setup
python3 .claude/hooks/utils/tts/wsl_compatible_tts.py "Testing TTS system" normal

# 5. Run setup script (creates worktrees and symlinks)
./setup_project.sh

# 6. Start development infrastructure
cd sample_files/backend_template
docker-compose up -d

# 7. Test hook integration
echo '{"tool_name": "Bash", "tool_input": {"command": "echo test"}}' | python3 .claude/hooks/pre_tool_use.py
```

## 🔒 Security Features

### Automated Security Hooks

The scaffold includes comprehensive security hooks that:

- **🛡️ Block dangerous commands** (rm -rf, SQL injection, etc.)
- **🔐 Protect sensitive files** (.env, system files, build directories)
- **📢 Provide TTS notifications** for security events
- **📝 Log all tool usage** for audit trails
- **✅ Validate documentation compliance**

### Hook Types

1. **pre_tool_use.py**: Validates and blocks dangerous operations
2. **post_tool_use.py**: Auto-formats code and provides notifications
3. **stop.py**: Ensures documentation compliance before completion
4. **subagent_stop.py**: Tracks subagent completion
5. **notification.py**: Handles general notifications

### TTS Notifications

- **Critical alerts**: Dangerous command blocks, security violations
- **Info notifications**: Code formatting, file modifications
- **Success messages**: Task completion, tests passed
- **Multiple fallbacks**: Windows TTS (WSL) → pyttsx3 → visual notifications

## 📁 Structure Overview

```
project_root/
├── .claude/
│   ├── hooks/                    # Security and automation hooks
│   │   ├── pre_tool_use.py      # Pre-execution validation
│   │   ├── post_tool_use.py     # Post-execution automation
│   │   ├── stop.py              # Session completion checks
│   │   └── utils/tts/           # Text-to-speech utilities
│   └── commands/                # Enhanced Claude commands
│       ├── sprint-plan.md       # Sprint planning with auto-generation
│       ├── task-status.md       # Project health monitoring
│       └── workhere.md          # Smart branch context detection
├── shared/                      # Shared resources
│   ├── docs/                   # Project documentation
│   │   └── task_management/    # Task tracking system
│   │       ├── TASK_MASTER.md  # Central task registry
│   │       ├── TASK_BOARD.md   # Active sprint board
│   │       └── task_breakdown/ # Detailed task breakdowns
│   ├── scripts/                # Shared automation scripts
│   └── backend/frontend/       # Domain-specific configs
├── worktrees/                  # Git worktree branches
│   ├── backend/               # Backend development
│   └── frontend/              # Frontend development
└── sample_files/              # Template files with modern architecture
    ├── backend_template/      # FastAPI + LangGraph + OpenTelemetry
    │   ├── app/               # Modern application structure
    │   │   ├── agents/        # Multi-agent coordination
    │   │   ├── workflows/     # LangGraph workflow definitions
    │   │   ├── tools/         # Categorized tool ecosystem
    │   │   ├── interfaces/    # Standard interfaces (IAgent, ITool, IWorkflow)
    │   │   ├── core/          # Database, config, and core services
    │   │   └── observability/ # OpenTelemetry tracing setup
    │   ├── docker-compose.yml # PostgreSQL, Redis, Neo4j, Jaeger
    │   ├── Dockerfile         # Production-ready container
    │   └── requirements.txt   # Modern Python dependencies
    └── frontend_template/     # React 18 + TanStack Query + Tailwind
        ├── src/
        │   ├── components/    # Reusable UI components
        │   ├── pages/         # Application pages
        │   ├── store/         # Zustand state management
        │   ├── services/      # API integration layer
        │   └── hooks/         # Custom React hooks
        └── package.json       # Modern React dependencies
```

## 🛠️ Configuration

### Customizing Hooks

Edit hook files in `.claude/hooks/` to customize:

- Security policies in `pre_tool_use.py`
- Auto-formatting rules in `post_tool_use.py`
- Documentation requirements in `stop.py`
- TTS notification messages in `utils/tts/coordination_tts.py`

### TTS Configuration

Test and configure TTS:

```bash
# Test Windows TTS (WSL)
.claude/hooks/utils/tts/wsl_compatible_tts.py "Hello World" normal

# Test pyttsx3
.claude/hooks/utils/tts/pyttsx3_tts.py "Testing pyttsx3"

# Test coordination TTS
.claude/hooks/utils/tts/coordination_tts.py "tests_passed" '{"message": "All tests passed!", "priority": "normal"}'
```

### Environment Setup

1. **Update shared/CLAUDE.md** with your project details
2. **Configure domain-specific files**:
   - `shared/backend/BACKEND_SPECIFIC.md`
   - `shared/frontend/FRONTEND_SPECIFIC.md`
3. **Add infrastructure configs** in `shared/infrastructure/config/`

## 🚦 Complete Development Workflow

### New Team Member Onboarding

Follow this exact sequence for your first setup:

#### Step 1: Understand the Project Structure
1. **Read the scaffold documentation** - This README and `shared/CLAUDE.md`
2. **Check current status** - See `shared/docs/ROADMAP.md` for what's built
3. **Understand git worktree setup** - Multiple development branches isolated

#### Step 2: Create Your Development Branch

```bash
# From project root (/path/to/your_project)
cd /path/to/your_project

# Create foundation branch first (if not exists)
git worktree add worktrees/backend/backend_framework_first -b backend_framework_first

# Create new backend branch (follow v0p1 naming convention)
git worktree add worktrees/backend/backend_v0p1_p1_content -b backend_v0p1_p1_content backend_framework_first

# Copy modern template to your worktree
cp -r sample_files/backend_template/* worktrees/backend/backend_v0p1_p1_content/
cp sample_files/backend_template/.env.example worktrees/backend/backend_v0p1_p1_content/.env

# Or create frontend branch
git worktree add worktrees/frontend/frontend_v0p1_p4_builder -b frontend_v0p1_p4_builder frontend_framework_first

# Examples for different phases:
# git worktree add worktrees/backend/backend_v0p1_p1_podcast -b backend_v0p1_p1_podcast backend_framework_first
# git worktree add worktrees/backend/backend_v0p1_p2_analytics -b backend_v0p1_p2_analytics backend_framework_first
# git worktree add worktrees/backend/backend_v0p1_p3_reddit -b backend_v0p1_p3_reddit backend_framework_first

# Verify the folder was created
ls -la worktrees/backend/backend_v0p1_p1_content
```

#### Step 3: Setup Development Infrastructure

```bash
# Setup all Claude commands and symlinks for ALL worktrees
bash shared/scripts/install-commands.sh

# This creates symlinks for:
# - ./bin/claude-doc-start (environment setup helper)
# - ./CLAUDE.md -> shared/CLAUDE.md
# - ./docs_shared -> shared/docs
# - ./refs_shared -> shared/refs
# - ./.claude/commands -> .claude/commands (workhere.md, resumebranch.md, branchstatus.md, devgo.md, testgo.md)
# - ./venv -> worktrees/backend/venv (backend only)
# - ./test_plans/shared_test_plans -> shared/test_plans

# Verify symlinks are created
ls -la worktrees/backend/backend_v0p1_p1_content/
```

#### Step 4: Initialize Your Development Environment

```bash
# Navigate to your new worktree
cd worktrees/backend/backend_v0p1_p1_content

# For Backend: Setup modern development environment
cd worktrees/backend/backend_v0p1_p1_content

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate

# Install modern dependencies
pip install -r requirements.txt

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration (API keys, database URLs, etc.)

# Start infrastructure (PostgreSQL, Redis, Neo4j, Jaeger)
docker-compose up -d

# Wait for services to be ready
docker-compose logs -f

# Start the development server
python main.py

# Verify setup
ls -la ./bin/
ls -la ./.claude/commands/  # Should show workhere.md, resumebranch.md, branchstatus.md, devgo.md, testgo.md

# Get branch context and start working
/workhere

# Test database connection (if needed)
python -c "from app.core.database import get_db; print('Database connection OK')"

# Optional: Run environment setup helper to check everything
./bin/claude-doc-start
```

### Daily Development Workflow

#### Start Coding Session

```bash
# Navigate to your worktree
cd worktrees/backend/backend_your_feature_name

# For Backend: Always activate virtual environment first
source venv/bin/activate

# Start infrastructure if not running
docker-compose up -d

# Start development server (in one terminal)
python main.py

# In another terminal, monitor infrastructure
docker-compose logs -f

# View Jaeger tracing UI
open http://localhost:16686

# Start Claude Code with hooks enabled (in another terminal)
claude

# In Claude session, use enhanced command system:
/workhere      # Auto-detect branch context and get guidance
/devgo         # Branch-specific development workflow and test management
/testgo        # Execute tests and update branch progress
/checkpoint    # Context-aware progress saving (project vs branch level)
/stage-complete # Mark stages officially complete and update roadmap
/branchstatus  # View cross-branch progress matrix
/resumebranch  # Switch between available branches
```

#### Feature Development Process

**🛑 MANDATORY: Follow the 7-Step Process**

1. **Research Phase**
   - Research 2-3 potential approaches
   - Use existing codebase, documentation, and external resources
   - Document options and trade-offs

2. **Architecture Consultation**
   - Check current architecture docs in `shared/docs/architecture/`
   - Ensure alignment with project patterns
   - Consider long-term maintainability

3. **Test-Drive Implementation**
   - Build skeleton/proof-of-concept first
   - Validate core concepts work
   - Fail fast if approach doesn't work

4. **Full Implementation**
   - Add descriptive comments to key functions
   - Keep files under 1500 lines (split if needed)
   - Check for existing similar functionality first
   - Use clean, modular architecture

5. **Testing**
   ```bash
   # Check development status and run tests
   /devgo    # Updates branch progress and creates test plans
   /testgo   # Execute tests and update results
   
   # If tests fail, analyze and get fixes
   /devgo    # Provides fix recommendations
   
   # Repeat until tests pass
   /testgo
   ```

6. **Documentation Updates**
   ```bash
   # Update documentation
   ./bin/claude-doc-quick-push "Added feature X with Y capability"
   
   # Update daily journal
   ./bin/claude-doc-daily
   ```

7. **Commit Process**
   ```bash
   # Check git status first - verify only your changes
   git status
   
   # Add files selectively (never git add .)
   git add specific/files/only.py
   
   # Check what will be committed
   git diff --cached
   
   # Commit with descriptive message
   git commit -m "Implement feature X
   
   - Added Y capability
   - Tests passing (8/8)
   - Documentation updated
   
   🤖 Generated with [Claude Code](https://claude.ai/code)
   
   Co-Authored-By: Claude <noreply@anthropic.com>"
   
   # Push to your branch
   git push -u origin backend_your_feature_name
   ```

### Safe Git Practices

#### 🔍 Best Practices for Root Commits

**⚠️ CRITICAL: When working in project root for shared changes**

```bash
# Always check status first
git status

# Only add shared changes (never git add .)
git add shared/docs/specific_file.md
git add shared/scripts/updated_script.sh

# Check what will be committed
git diff --cached

# Use descriptive commit messages
git commit -m "Update shared documentation

- Enhanced onboarding guide
- Fixed script permissions

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

#### Stage Gate Process

**🛑 STOP AND WAIT FOR APPROVAL AFTER EACH STAGE**

When completing development stages:

1. Run all tests for that stage
2. Update `shared/docs/WORKING_JOURNAL.md` with completion status
3. Create/update stage-specific test plan in `shared/test_plans/`
4. **STOP and inform team that stage is complete**
5. **WAIT for explicit approval before proceeding**

Example completion message:
```
✅ Stage 1.1 (Feature X) Complete!
- All tests passing (12/12)
- Documentation updated
- Test plan executed: shared/test_plans/v01_s1_test_plan.md
🛑 Awaiting approval to proceed to Stage 1.2
```

### Understanding the Claude Commands

#### Core Development Commands
- **`./bin/claude-doc-start`**: Environment setup helper and validation
- **`./bin/claude-doc-quick-push "message"`**: Quick documentation updates
- **`./bin/claude-doc-daily`**: Update working journal with daily progress
- **`/devgo`** (in Claude): Branch-specific development workflow and test plan management
- **`/testgo`** (in Claude): Execute test plans and update branch progress
- **`/stage-complete`** (in Claude): Mark stages officially complete and update roadmap
- **`/workhere`** (in Claude): Auto-detect branch context and get guidance
- **`/branchstatus`** (in Claude): View cross-branch progress matrix

#### Enhanced Task Management Workflow
```bash
# 1. Check project health and task status
/task-status # Shows overall progress, identifies issues, missing files

# 2. Plan next sprint (auto-creates missing breakdown files)
/sprint-plan # Analyzes TODO tasks, estimates capacity, creates sprint

# 3. Get branch-specific context and guidance
/workhere    # Auto-detects current branch and provides context

# 4. Execute development and testing
/devgo       # Creates test plans if needed, shows remaining tasks
/testgo      # Runs tests specific to current stage and updates progress

# 5. Complete stage when all tests pass
/stage-complete  # Mark stage officially complete and update shared roadmap
```

#### Task Management System
The scaffold includes a comprehensive task management system:

- **TASK_MASTER.md**: Central registry with all tasks organized by phases
- **TASK_BOARD.md**: Active sprint board with current tasks and progress
- **Task Breakdowns**: Detailed task files with subtasks and technical notes
- **Auto-Generation**: `/sprint-plan` automatically creates missing breakdown files
- **Progress Tracking**: Real-time project health monitoring with `/task-status`

### Project-Specific Customization

#### Update Project Context
1. **Customize `shared/CLAUDE.md`** with your project details
2. **Update domain-specific configs**:
   - `shared/backend/BACKEND_SPECIFIC.md` - Backend setup and guidelines
   - `shared/frontend/FRONTEND_SPECIFIC.md` - Frontend setup and guidelines
3. **Add infrastructure configs** in `shared/infrastructure/config/`
4. **Update sample files** in `sample_files/` with your project templates

#### Environment Configuration
```bash
# Backend configuration
cp sample_files/backend_template/.env.example .env
vim .env  # Configure:
# - DATABASE_URL (PostgreSQL)
# - REDIS_URL 
# - NEO4J credentials
# - OPENAI_API_KEY / ANTHROPIC_API_KEY
# - OTEL_EXPORTER_OTLP_ENDPOINT (Jaeger)
# - SECRET_KEY (change default!)

# Frontend configuration
cp sample_files/frontend_template/.env.example frontend.env
vim frontend.env  # Configure:
# - VITE_API_BASE_URL
# - VITE_APP_NAME

# Note: .env files are protected by security hooks
```

### Verifying Setup

Test the complete system:

```bash
# 1. Test hook security
echo '{"tool_name": "Bash", "tool_input": {"command": "rm -rf /"}}' | python3 .claude/hooks/pre_tool_use.py
# Should block and announce via TTS

# 2. Test documentation compliance
echo '{"session_id": "test", "stop_hook_active": true}' | python3 .claude/hooks/stop.py
# Should check for required documentation

# 3. Test TTS system
.claude/hooks/utils/tts/wsl_compatible_tts.py "Setup complete!" normal
# Should speak the message
```

## 🐛 Troubleshooting

### TTS Issues

```bash
# WSL: Ensure PowerShell.exe is accessible
powershell.exe -Command "echo 'PowerShell accessible'"

# Linux: Install espeak
sudo apt install espeak
espeak "Test message"

# Check audio system
aplay /usr/share/sounds/alsa/Front_Left.wav  # May not work in WSL
```

### Hook Issues

```bash
# Check hook permissions
ls -la .claude/hooks/*.py
# Should be executable (+x)

# Test individual hooks
python3 .claude/hooks/pre_tool_use.py --help
python3 .claude/hooks/post_tool_use.py --help
```

### Log Files

Check logs for debugging:

```bash
# Hook execution logs
ls -la logs/
cat logs/pre_tool_use.json
cat logs/post_tool_use.json
cat logs/stop.json
```

## 📚 Documentation

- **ROADMAP.md**: Project roadmap and feature tracking
- **WORKING_JOURNAL.md**: Development notes and decisions
- **CLAUDE.md**: Claude-specific project context
- **Hook documentation**: See `.claude/hooks/hook_setup.md`

## 🔄 Updates

To update the scaffold with new features:

```bash
# Pull latest hooks from main project
cp -r /path/to/main_project/.claude/hooks/* .claude/hooks/

# Test updated hooks
python3 .claude/hooks/utils/tts/wsl_compatible_tts.py "Hooks updated" normal
```

---

## ⚠️ Important Notes

- **Security**: The hooks provide defensive security but are not a substitute for proper security practices
- **TTS Privacy**: Audio notifications contain project information - use appropriate volume in shared spaces
- **WSL Compatibility**: Designed specifically for WSL environments with Windows TTS fallback
- **Documentation**: Keep required documentation updated to avoid completion blocks

Start coding with confidence! 🚀