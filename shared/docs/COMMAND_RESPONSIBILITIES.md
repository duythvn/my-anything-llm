# Command Responsibilities

**Created**: July 11, 2025  
**Purpose**: Clarify what each command does and which documentation it updates

---

## 📊 Documentation Structure Overview

### **Project-Level Documentation (Shared)**
- **`/shared/docs/WORKING_JOURNAL.md`** - Strategic milestones, major completions, project health
- **`/shared/docs/STAGE_STATUS.md`** - Cross-branch stage completion matrix 
- **`/shared/docs/ROADMAP.md`** - Overall project roadmap with stage status

### **Branch-Specific Documentation**
- **`/worktrees/{stack}/{branch}/docs/STAGE_PROGRESS.md`** - Detailed stage implementation progress
- **`/worktrees/{stack}/{branch}/docs/WORKING_JOURNAL.md`** - Daily development notes
- **`/shared/test_plans/active/{stage}_test_plan.md`** - Stage-specific test plans

---

## 🎯 Command Responsibilities

### **`/checkpoint` - Project-Level Status Updates**

**Purpose**: Smart WIP commit with context-aware documentation updates

**Documentation Updates**:
- **From project root**: Updates `/shared/docs/WORKING_JOURNAL.md` with project-level progress
- **From worktree folder**: Updates branch-specific `/docs/STAGE_PROGRESS.md` with development details
- **Git actions**: Commits and pushes changes with descriptive commit messages

**When to use**: 
- After completing major milestones
- When making significant project-level changes
- For regular development checkpoints

---

### **`/devgo` - Branch-Specific Development Status**

**Purpose**: Development workflow analysis and branch progress management  

**Documentation Updates**:
- **Always updates**: Branch-specific `/docs/STAGE_PROGRESS.md`
- **Test status tracking**: Updates test plan status and next steps
- **Implementation guidance**: Provides specific next tasks for current stage

**Decision Logic**:
- **Tests passed** → Mark stage complete, archive test plan
- **Tests failed** → Analyze failures, provide fix recommendations  
- **No test plan** → Create test plan if stage ready for testing
- **Stage incomplete** → Guide through remaining implementation tasks

**When to use**:
- Daily development status checks
- When unsure what to work on next
- After implementing new features
- When tests fail and need analysis

---

### **`/testgo` - Test Execution & Results**

**Purpose**: Execute test plans and update test status

**Documentation Updates**:
- **Always updates**: Branch-specific `/docs/STAGE_PROGRESS.md` with test results
- **Test reports**: Creates reports in `/test_plans/reports/passed/` or `/failed/`
- **Status tracking**: Updates test completion status and next steps

**Actions**:
- Executes active test plan step by step
- Documents detailed pass/fail results with evidence
- Provides next steps based on results (fixes or stage completion)

**When to use**:
- After completing stage implementation 
- When `/devgo` indicates tests are ready
- For validating fixes after test failures

---

### **`/stage-complete` - Stage Completion & Roadmap Updates**

**Purpose**: Mark stages complete and update shared roadmap

**Documentation Updates**:
- **Updates**: `/shared/docs/STAGE_STATUS.md` with completion status
- **Updates**: `/shared/docs/ROADMAP.md` with ✅ completion markers
- **Creates**: Final checkpoint with completion message

**Validation**:
- Checks local completion evidence (STAGE_PROGRESS.md, test reports)
- Requires user confirmation before updating shared roadmap
- Auto-detects stage from current directory path

**When to use**:
- After all stage tasks are complete and tests pass
- When ready to move to next stage
- For official stage completion tracking

---

### **`/branchstatus` - Cross-Branch Overview**

**Purpose**: Show overall project progress across all branches

**Shows**:
- `/shared/docs/STAGE_STATUS.md` - Cross-branch completion matrix
- Overall project health and next priorities
- Current active development streams

**When to use**:
- Planning which branch to work on
- Getting overall project status
- Understanding dependencies between stages

---

### **`/workhere` - Context-Aware Guidance**

**Purpose**: Auto-detect current branch and provide specific guidance

**Shows**:
- Current branch context and stage status
- Specific next tasks for current location
- Relevant documentation and test plans

**When to use**:
- Starting work in any branch
- Getting oriented after switching branches
- Daily workflow guidance

---

### **`/resumebranch` - Branch Selection**

**Purpose**: Show available branches and help choose which to work on

**Shows**:
- All available branches in current stack
- Branch status and progress
- Quick navigation to selected branch

**When to use**:
- Starting a development session
- Switching between branches
- Finding available work

---

## 🔄 Typical Workflow

### **Daily Development Cycle**
```bash
# 1. Choose or check current branch
/resumebranch  # or /workhere if already in a branch

# 2. Check what needs to be done
/devgo

# 3. Implement features...

# 4. Checkpoint progress regularly
/checkpoint "Implemented LangGraph state management"

# 5. Test when stage is complete
/testgo

# 6. Complete stage when all tests pass
/stage-complete

# 7. Check overall project status
/branchstatus
```

### **Stage Completion Cycle**
```bash
# 1. Complete implementation tasks
/devgo  # Shows remaining tasks

# 2. When all tasks done, create/run test plan
/devgo  # Creates test plan if ready
/testgo # Execute tests

# 3. If tests fail, fix and repeat
/devgo  # Analyze failures
# Fix issues...
/testgo # Test again

# 4. When tests pass, mark stage complete
/stage-complete  # Official completion
/checkpoint "Completed v0p1.p1.s1 Framework Setup"
```

---

## 📋 Documentation Update Matrix

| Command | Shared WORKING_JOURNAL | STAGE_STATUS | Branch STAGE_PROGRESS | Test Plans | Git Actions |
|---------|----------------------|--------------|---------------------|------------|-------------|
| `/checkpoint` | ✅ (from root) | Manual | ✅ (from branch) | ❌ | ✅ Commit & Push |
| `/devgo` | ❌ | Manual | ✅ Always | ✅ Create/Archive | ✅ If fixes applied |
| `/testgo` | ❌ | Manual | ✅ Test results | ✅ Reports | ❌ |
| `/stage-complete` | ❌ | ✅ Updates | ❌ Read only | ❌ Read only | ✅ Checkpoint |
| `/branchstatus` | ❌ Read only | ✅ Read only | ❌ Read only | ❌ Read only | ❌ |
| `/workhere` | ❌ Read only | ❌ Read only | ❌ Read only | ❌ Read only | ❌ |
| `/resumebranch` | ❌ Read only | ❌ Read only | ❌ Read only | ❌ Read only | ❌ |

---

## 🎯 Key Principles

### **Separation of Concerns**
- **Project-level progress** → `/checkpoint` (from root) and `/stage-complete` update shared documentation
- **Implementation details** → `/devgo` and `/testgo` update branch-specific docs
- **Cross-branch visibility** → `/branchstatus` for overall project health

### **Command Specialization**  
- **`/checkpoint`** → Git operations + context-aware progress saving
- **`/devgo`** → Development workflow + implementation guidance
- **`/testgo`** → Test execution + validation results
- **`/stage-complete`** → Official stage completion + roadmap updates
- **`/branchstatus`** → Read-only project overview
- **`/workhere`** → Context-aware guidance
- **`/resumebranch`** → Branch selection and navigation

### **Automatic vs Manual Updates**
- **Automatic**: Branch-specific progress, test results, implementation status
- **Official Completions**: Stage completion via `/stage-complete`
- **Git-triggered**: Commit messages, checkpoint documentation

---

*This structure ensures clear responsibility separation while maintaining comprehensive tracking across all development streams.*