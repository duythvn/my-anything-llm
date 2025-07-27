# /dev-cycle

Orchestrate a complete development cycle using all three specialized agents (planner, coder, tester).

## Usage

```
/dev-cycle [feature description]
```

## What it does

1. **Planning Phase**: Planner agent creates technical specification
2. **Implementation Phase**: Coder agent builds the feature with TDD
3. **Testing Phase**: Tester agent reviews and validates
4. **Iteration**: Cycles back to coder if issues found
5. **Completion**: Updates all documentation and tracking

## Examples

```
/dev-cycle Week 1 career page monitoring system

/dev-cycle LinkedIn integration with duplicate detection

/dev-cycle Company discovery RSS feed monitoring
```

## Process Flow

```
Feature Request
    ↓
Planner Agent → Technical Spec
    ↓
Coder Agent → Implementation + Tests
    ↓
Tester Agent → Review + Validation
    ↓
Pass? → No → Back to Coder
  ↓ Yes
Complete → Update Docs
```

## Benefits

- Ensures thorough planning before coding
- Enforces TDD methodology
- Guarantees code review
- Maintains quality standards
- Provides full traceability

## Output

Each phase provides:

**Planning**:
- Technical specification
- Task breakdown
- Architecture decisions

**Implementation**:
- Working code with tests
- Documentation
- Progress updates

**Testing**:
- Review report
- Quality metrics
- Final validation

## Best Practices

- Use for any feature taking >4 hours
- Review outputs between phases
- Allow iteration between coder/tester
- Update roadmap after completion
- Document lessons learned

This command provides the most comprehensive development approach, ideal for complex features or when quality is critical.