---
allowed-tools: Bash(pwd), Bash(find *), Bash(grep *), Bash(mkdir *), Bash(cp *), Bash(git *), Read
description: Copy completed phase docs to framework first and consolidate shared documentation
argument-hint: none
---

# Merge to Framework Command

## Context
- Current directory: !`pwd`
- Available phase directories: !`find worktrees/backend -name "backend_v0p1_p*" -type d`
- Project root status: !`test "$(pwd)" = "/home/duyth/projects/agentic_system" && echo "✅ In project root" || echo "❌ Not in project root"`

## Your task
Copy completed phase documentation to Framework First and consolidate shared documentation:

1. **Validate location**: Must be run from project root `/home/duyth/projects/agentic_system`

2. **Find latest completed phase**:
   - Search `worktrees/backend/backend_v0p1_p*` directories
   - Check each for `docs/*/STAGE_PROGRESS.md` containing "✅.*COMPLETE"
   - Use the latest completed phase found

3. **Copy phase documentation**:
   - Source: `worktrees/backend/{phase}/docs/{phase}/`
   - Target: `worktrees/backend/backend_framework_first/docs/{phase}/`
   - Create target directories as needed

4. **Consolidate documentation**:
   - Create `worktrees/backend/backend_framework_first/docs_shared/CUMULATIVE_PROGRESS.md`
   - Include all phase progress from framework docs
   - Create `worktrees/backend/backend_framework_first/docs_shared/OVERALL_STATUS.md`
   - List completed phases with status indicators

5. **Commit changes**:
   - Change to framework directory
   - Stage docs/ and docs_shared/ changes
   - Commit with message: "Merge documentation: {phase_name}"
   - Include Claude Code signature

Use Bash tool to execute each step, handling errors gracefully. Show progress and confirm completion.