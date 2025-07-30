# /plan

Invoke the planner agent to create technical specifications and task breakdowns.

## Usage

```
/plan [feature or stage description]
```

## What it does

1. Analyzes features or roadmap stages from the project roadmap
2. Creates detailed task breakdowns (P1-S2-BREAKDOWN.md format) in SINGLE shared location
3. Updates project documentation consistently:
   - Updates `TASK_OVERVIEW.md` when new phases or major features are planned
   - Adds new phases to phase breakdown summary
   - Updates focus areas and critical path items
4. Provides technical specifications with implementation steps

## File Management

**BREAKDOWN FILES LOCATION**: Always creates files in:
- `shared/docs/task_management/task_breakdown/P[X]-S[Y]-BREAKDOWN.md`
- Never creates duplicate files in branch-local directories
- Uses shared location that all commands can reference

## Examples

```
/plan Phase 1.2 RAG Implementation
/plan Multi-source data ingestion system  
/plan Document upload with validation
```

## Coordination with other commands

- `/workhere` → Detects current context and guides to use `/plan`
- `/plan` → Creates breakdown files in shared location
- `/implement` → Reads from the same shared breakdown files
- `/stage-complete` → References shared files for completion validation

## Documentation Updates

When creating new phases or major features, also update:
- **`shared/docs/task_management/TASK_OVERVIEW.md`**:
  - Add new phase to "Phase Breakdown Summary"
  - Update "Key Focus Areas" with new priorities
  - Update critical path if planning affects timeline
- **Only update for major planning** (new phases, significant scope changes)
- **Minor task breakdowns** do not require TASK_OVERVIEW.md updates

## When to use

- **Planning roadmap stages** - Break down high-level features into tasks
- **Before implementation** - Get technical specs before coding
- **Complex features** - Need research and architecture decisions

Use `/plan` for structured planning that updates documentation. Use `@planner` directly for quick analysis or custom planning needs.