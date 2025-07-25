---
name: resumebranch
description: Show status of worktree branches in current directory scope
---

# Resume Work - Local Branch Status

This command shows status of worktree branches within the current directory scope (works from project root or worktrees folder).

## Usage

From project root or worktrees directory:
```
/resumebranch
```

## What This Command Shows

Based on current location:
- **From project root**: Shows all worktree branches 
- **From worktrees/**: Shows all branches in current stack
- **From specific branch**: Shows current branch status + siblings

## Expected Output

From `/worktrees/backend/`:
```
🚧 Backend Branches Status

Current Stack: Backend Development
├── 🚧 backend_v01_s1 (v0p1.p1.s1 - Interface Standardization Phase)
├── 📅 backend_v0p1_p1_content (waiting for s1 completion)
├── 📅 backend_v0p1_p1_podcast (waiting for content workflow)
├── 📅 backend_v0p1_p2_analytics (waiting for Phase 1)
└── 📅 backend_v0p1_p3_reddit (waiting for Phase 2)

💡 To work on any branch:
cd backend_v01_s1
/workhere
```

From specific branch folder:
```
📍 Current: backend_v01_s1
🎯 Stage: Framework Setup & Architecture (Continuing)
📊 Status: Interface Standardization Phase (9/19 tasks complete)

Use /workhere for full context and next steps
```