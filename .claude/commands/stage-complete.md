---
allowed-tools: Bash(pwd), Bash(basename *), Bash(grep *), Bash(find *), Bash(git *), Read
description: Mark a stage as complete and update shared roadmap automatically
argument-hint: none
---

# Stage Complete Command

## Context
- Current directory: !`pwd`
- Current directory basename: !`basename "$(pwd)"`
- Local completion evidence: !`find docs -name "STAGE_PROGRESS.md" -o -name "WORKING_JOURNAL.md" | head -3`
- Test reports: !`find test_plans/reports/passed -name "*.md" 2>/dev/null | wc -l`

## Your task
Mark the current stage as complete and update shared documentation:

1. **Auto-detect stage from directory path**:
   - Parse current directory name to identify stage
   - Examples: `backend_v01_s1` → `v0p1.p1.s1`, `backend_v0p1_p1_content` → `v0p1.p1.s2`

2. **Validate completion evidence**:
   - Check `docs/STAGE_PROGRESS.md` for "✅ COMPLETE" status
   - Check `docs/WORKING_JOURNAL.md` for "STAGE COMPLETE" entries
   - Check `test_plans/reports/passed/` for successful test reports
   - Display found evidence to user

3. **Get user confirmation**:
   - Show detected stage and evidence found
   - Prompt user: "Mark this stage as complete? (y/N):"
   - If yes, ask for "Brief completion description:"

4. **Update shared roadmap**:
   - Read `/home/duyth/projects/agentic_system/shared/docs/ROADMAP.md`
   - Mark detected stage as ✅ completed
   - Update with user's completion description

5. **Update task master**:
   - Read `/home/duyth/projects/agentic_system/shared/docs/task_management/TASK_MASTER.md`
   - Mark corresponding tasks as ✅ DONE

6. **Archive test plans**:
   - Copy test plans to `/home/duyth/projects/agentic_system/shared/test_plans/archived/`

7. **Create checkpoint commit**:
   - Commit changes with message including stage completion
   - Include Claude Code signature

Use Bash tool for all operations. Handle missing evidence gracefully with warnings but allow user override.