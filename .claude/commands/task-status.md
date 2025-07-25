---
name: task-status
description: Show current task status and project health across all management files
---

# Task Status - Project Health Check

## Purpose
Provide comprehensive view of project status by analyzing all task management files and identifying inconsistencies.

## Usage
```
/task-status
```

## What It Does
1. **Parse All Task Files**: Read TASK_MASTER.md, TASK_BOARD.md, and all breakdown files
2. **Calculate Progress**: Compute actual completion percentages
3. **Check Consistency**: Identify mismatches between files
4. **Show Project Health**: Overall status, velocity, and blockers
5. **Highlight Issues**: Missing files, outdated progress, inconsistencies

## Output Format
```
🚀 Agentic System - Project Health Report
📊 Overall Progress: 32/64 tasks (50% complete)

📋 By Phase:
Phase 1: ✅ 32/32 (100%) - LangGraph Foundation & Content  
Phase 2: ⏳ 0/8 (0%) - Analytics Monitoring
Phase 3: ⏳ 0/12 (0%) - Reddit & External Integrations  
Phase 4: ⏳ 0/12 (0%) - Platform Productization

🎯 Current Focus: Phase 2 Sprint Planning
Active Tasks: 4 in TASK_BOARD.md

⚠️ Issues Found:
- TASK_MASTER.md shows P1-S3 as TODO but ROADMAP.md shows complete
- TASK_BOARD.md needs update for Phase 2 tasks
- Missing breakdown file: P2-S1-BREAKDOWN.md

💡 Recommendations:
1. Update TASK_MASTER.md to reflect completed Phase 1
2. Create P2-S1-BREAKDOWN.md for current sprint
3. Archive completed Phase 1 tasks from TASK_BOARD.md
```

## Analysis Features
- **Progress Validation**: Compare ROADMAP.md vs TASK_MASTER.md vs breakdown files
- **File Consistency**: Check links between files work correctly
- **Sprint Health**: Analyze TASK_BOARD.md for realistic sprint scope
- **Blocking Issues**: Identify dependencies preventing progress

## Integration
- **Before Sprint Planning**: Check health before planning next sprint
- **Weekly Reviews**: Regular project status assessment
- **Onboarding**: Help new team members understand current state
- **Debugging**: When task status seems inconsistent

## Related Commands
- `/task-update` - Fix identified inconsistencies
- `/sprint-plan` - Plan next sprint based on current status
- `/stage-complete` - Mark stages complete when ready