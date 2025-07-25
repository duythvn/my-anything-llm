---
allowed-tools: Bash(pwd), Bash(grep *), Bash(find *), Bash(ls *), Read
description: Auto-detect current branch context and provide development guidance
argument-hint: none
---

# Work Here Command

## Context
- Current directory: !`pwd`
- Current directory relative to project: !`pwd | sed 's|/home/duyth/projects/agentic_system/||'`
- Available backend branches: !`ls -1 worktrees/backend/ 2>/dev/null | grep backend_ | head -5`

## Your task
Auto-detect the current branch context and provide development guidance:

1. **Detect branch context from current path**:
   - If in `backend_framework_first`: Show source of truth status
   - If in `backend_v0p1_p*_*`: Show phase-specific development context  
   - If in `worktrees/backend/`: Show overview of all branches
   - If in project root: Show available stacks and documentation

2. **For Framework First branch**:
   - Read `docs_shared/OVERALL_STATUS.md` for project status
   - Read `docs_shared/CUMULATIVE_PROGRESS.md` for available capabilities
   - Warn if docs_shared/ missing, suggest `/merge-to-framework`

3. **For specific phase branches** (e.g., `backend_v0p1_p2_analytics`):
   - Extract phase and feature from directory name
   - Read `docs/{branch_name}/STAGE_PROGRESS.md` for current status
   - Read `docs/{branch_name}/WORKING_JOURNAL.md` for recent activity
   - Check roadmap completion status in `/home/duyth/projects/agentic_system/shared/docs/ROADMAP.md`

4. **For backend worktrees overview**:
   - List all `backend_v0p1_p*` directories with completion status
   - Check each against roadmap for ✅ completion markers

5. **For project root**:
   - Show available stacks (backend, frontend)
   - Point to shared documentation

6. **Display relevant commands**: Always end with suggesting relevant commands like `/branchstatus`, `/resumebranch`, `/stage-complete`

Use the Read tool to examine documentation files and Bash tool for directory operations.