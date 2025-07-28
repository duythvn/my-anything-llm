# /plan

Invoke the planner agent to create technical specifications and task breakdowns.

## Usage

```
/plan [feature or stage description]
```

## What it does

1. Analyzes features or roadmap stages
2. Creates detailed task breakdowns (P1-S1-BREAKDOWN.md format)
3. Updates project documentation
4. Provides technical specifications with implementation steps

## Examples

```
/plan Phase 1.1 Core API Infrastructure
/plan Multi-source data ingestion system
/plan Document upload with validation
```

## When to use

- **Planning roadmap stages** - Break down high-level features into tasks
- **Before implementation** - Get technical specs before coding
- **Complex features** - Need research and architecture decisions

Use `/plan` for structured planning that updates documentation. Use `@planner` directly for quick analysis or custom planning needs.