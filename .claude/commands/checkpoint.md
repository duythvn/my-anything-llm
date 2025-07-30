---
allowed-tools: Bash(git *:*), Read
description: Auto-detect context and create checkpoint commit for current worktree/directory
argument-hint: [optional custom message]
---

# Checkpoint Command

## Context
- Current directory: !`pwd`
- Git status: !`git status --short`
- Current branch: !`git branch --show-current`

## Your task
You need to create a checkpoint commit based on the current context:

1. **Detect the git repository location**:
   - If current directory has `.git` folder or file (worktree), use current directory
   - Otherwise, navigate up to find the git repository
   - Fall back to `/home/duyth/projects/agentic_system` if needed

2. **Generate context-aware commit message**:
   - If custom message provided as argument: "WIP: {custom_message} - checkpoint"
   - For root directory: "WIP: Root system updates - checkpoint"
   - For versioned directories (backend_v*p*_p*_*): Extract version/phase info
   - Default: "WIP: {directory_name} development - checkpoint"

3. **Stage and commit changes**:
   - Stage modified and new files, excluding:
     - Files with extensions: `.env`, `.key`, `.pem`
     - Paths containing: `secret`, `node_modules/`, `__pycache__/`
     - Files ending: `.pyc`, `.DS_Store`, `.log`
   - Handle gitignored files gracefully (skip with message)
   - Create commit with generated message
   - Push to origin/{current_branch}

4. **Update documentation for major changes**:
   - If custom message contains keywords like "milestone", "major", "complete", "release", "phase":
     - Update `/shared/docs/task_management/UPDATE_SUMMARY.md` with change entry
     - Add date, change description, and files affected
     - Use this format:
       ```
       ### [Date] - [Custom Message Title]
       **Type**: Major Milestone  
       **Trigger**: Checkpoint with major completion
       **Changes Made**: [Generated from git status]
       **Files Updated**: [List of modified files]
       ```

5. **Provide feedback**:
   - Show working directory used
   - Show commit message created
   - If UPDATE_SUMMARY.md was updated, mention it
   - Confirm completion

Use the Bash tool to execute the necessary git commands step by step.