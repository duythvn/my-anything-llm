---
name: branchstatus
description: Show development progress from current directory context
---

# Branch Status Overview

Shows development progress and branch status based on your current directory context.

## Usage

From anywhere in the project:
```
/branchstatus
```

## What This Command Shows

Based on current directory context:
- **From project root**: Full project overview across all phases
- **From worktrees/**: Focus on branch development status
- **From specific branch**: Current branch + related branches
- **From shared/**: Documentation and roadmap status

## Output Examples

From project root or shared/:
```
🚀 Agentic System - Project Overview

📊 Version 0.1 MVP Progress: 25% Complete

Phase 1: LangGraph Foundation & Content (50% complete)
├── ✅ backend_framework_first (foundation complete)
├── 🚧 backend_v01_s1 (v0p1.p1.s1 - Interface Standardization)
├── 📅 backend_v0p1_p1_content (pending s1 completion)
└── 📅 backend_v0p1_p1_podcast (pending content workflow)

Phase 2-4: (waiting for Phase 1 completion)

💡 Active Work: backend_v01_s1 - Interface Standardization
🎯 Next Steps: Complete interface standards & workflow adapter
```

From worktrees/backend/:
```
🔧 Backend Development Status

Current Stack: Backend Worktrees
├── 🚧 backend_v01_s1 (active - Interface Standardization)
├── 📅 backend_v0p1_p1_content (blocked by s1)
├── 📅 backend_v0p1_p1_podcast (blocked by content)
├── 📅 backend_v0p1_p2_analytics (blocked by p1)
└── 📅 backend_v0p1_p3_reddit (blocked by p2)

🎯 Recommended: Continue work in backend_v01_s1
```

From specific branch:
```
📍 Current Branch: backend_v01_s1
🎯 Stage: Framework Setup & Architecture (v0p1.p1.s1)
📊 Status: Interface Standardization Phase

🔗 Related Branches:
- ✅ Foundation: Framework setup completed
- ➡️ Enables: backend_v0p1_p1_content 📅
- ➡️ Enables: All future workflows via interfaces

Use /workhere for detailed context and next steps
```