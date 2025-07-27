# /implement

Invoke the coder agent to implement features using test-driven development.

## Usage

```
/implement [feature or specification]
```

## What it does

1. Reads the technical specification (from planner or provided)
2. Implements features using TDD approach
3. Creates clean, modular code following project standards
4. Ensures comprehensive test coverage
5. Updates progress tracking

## Examples

```
/implement Company and Job models from technical spec

/implement Web scraping service for career pages

/implement REST API endpoints for company management
```

## Process

The coder agent will:
1. Review the technical specification thoroughly
2. Write tests first (TDD approach)
3. Implement minimal code to pass tests
4. Refactor for quality and maintainability
5. Add documentation and comments
6. Ensure all tests pass

## Code Standards

- Files under 1500 lines
- 80%+ test coverage
- Descriptive function comments
- Proper error handling
- Type hints (Python) or TypeScript
- Follow existing patterns

## Output

The agent provides:
- Production-ready implementation
- Comprehensive test suite
- Updated progress in todo list
- Documentation updates
- Git-ready code changes

Use this command when you have a specification ready and need to implement the actual code.