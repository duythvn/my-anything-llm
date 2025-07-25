---
name: sprint-plan
description: Create next sprint plan by analyzing available tasks and team capacity
---

# Sprint Plan - Next Sprint Planning

## Purpose
Analyze available tasks and create next sprint plan with realistic scope.

## Usage
```
/sprint-plan [--duration DAYS] [--capacity HOURS]
```

## What It Does
1. **Analyze Available Tasks**: Read TASK_MASTER.md for next TODO tasks
2. **Check Dependencies**: Ensure prerequisites are complete
3. **Auto-Create Missing Files**: Generate breakdown files (e.g., P2-S1-BREAKDOWN.md) if missing
4. **Estimate Capacity**: Calculate realistic sprint scope (default: 32h effective)
5. **Create Sprint Plan**: Generate new TASK_BOARD.md content
6. **Set Sprint Goals**: Define clear objectives and success criteria

## Default Assumptions
- Sprint Duration: 7 days, Team Capacity: 40h/week, Buffer: 20%, Effective: 32h/week

## Example Output
```
📋 Sprint Planning Analysis

🎯 Next Phase: Phase 2 - Analytics Monitoring
📊 Available Tasks: 4 tasks in P2-S1
🔧 Auto-created: P2-S1-BREAKDOWN.md (missing breakdown file)

⏱️ Recommended Sprint Scope:
┌─────────────────────────────────────────────────────┐
│ P2-S1-T001: Create analytics monitoring graph (6h) │
│ P2-S1-T002: Implement conditional routing (3h)    │  
│ P2-S1-T003: State management for historical (4h)  │
│ P2-S1-T004: Connect to AG UI for monitoring (2h)  │
│ Testing & Documentation: (8h)                      │
│ Buffer: (9h)                                       │
├─────────────────────────────────────────────────────┤
│ Total: 32 hours ✅ Fits in capacity                │
└─────────────────────────────────────────────────────┘

🎯 Sprint Goal: "Complete GA4 integration foundation"

Create this sprint plan? (y/N):
```

## What It Creates
- Updates **TASK_BOARD.md** with new sprint
- **Auto-generates missing breakdown files** (extracts tasks from TASK_MASTER.md)
- Sets sprint goals, timeline, and success criteria

## **CRITICAL**: Auto-Generation Behavior
When missing `P*-S*-BREAKDOWN.md` files detected:
1. Extract tasks from TASK_MASTER.md for target phase/stage
2. Generate breakdown file using template structure with task details
3. Create in `task_breakdown/` directory
4. Report creation in output

## Options
- `--duration DAYS`: Override default 7-day sprint
- `--capacity HOURS`: Override default 40-hour capacity

## Integration Workflow
```bash
/task-status    # Check project health first
/sprint-plan    # Create next sprint (auto-creates missing files)
/task-update    # Sync files after planning
```

## Related Commands
- `/task-status` - Check project health before planning
- `/task-update` - Sync files after sprint creation