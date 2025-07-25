---
name: task-update
description: Sync and update task management files automatically
---

# Task Update - Sync Task Management Files

## Purpose
Automatically sync task management files to ensure consistency between ROADMAP.md, TASK_MASTER.md, and breakdown files.

## Usage
```
/task-update [--dry-run] [--force]
```

## What It Does
1. **Analyze Current State**: Read all task management files
2. **Detect Inconsistencies**: Find mismatches between files
3. **Propose Updates**: Show what changes will be made
4. **User Confirmation**: Ask for approval before making changes
5. **Update Files**: Sync completion status across all files
6. **Recalculate Progress**: Update percentages and metrics

## Example Output
```
🔄 Task Update Analysis

📊 Current Status:
- ROADMAP.md: Phase 1 complete (4/4 stages ✅)
- TASK_MASTER.md: Phase 1 shows 28/32 complete ❌
- TASK_BOARD.md: Still showing Phase 1 tasks ❌

🔧 Proposed Updates:

TASK_MASTER.md:
✅ Mark P1-S3-T001 through P1-S3-T004 as DONE
✅ Mark P1-S4-T001 through P1-S4-T005 as DONE  
✅ Update Phase 1 progress: 28/32 → 32/32 (100%)
✅ Update overall progress: 44% → 50%

TASK_BOARD.md:
✅ Move Phase 1 tasks to DONE section
✅ Add Phase 2 tasks to TODO section

Apply these updates? (y/N):
```

## Update Operations
- **TASK_MASTER.md**: Mark stages complete, update progress percentages
- **TASK_BOARD.md**: Archive completed tasks, add next phase tasks  
- **Breakdown Files**: Mark tasks complete, update completion dates

## Options
- `--dry-run`: Show proposed changes without applying them
- `--force`: Skip confirmation prompts (use with caution)

## Safety Features
- Creates .backup files before changes
- User confirmation required
- Rollback support available
- File integrity validation

## Integration Workflow
```bash
/task-status      # Check for inconsistencies
/task-update      # Sync files with confirmation
# OR
/stage-complete   # Mark stage done in ROADMAP.md
/task-update      # Sync other files automatically
```

## Related Commands
- `/task-status` - Analyze current state before updates
- `/stage-complete` - Trigger updates when stages complete