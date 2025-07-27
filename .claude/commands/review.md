# /review

Invoke the tester agent to review code quality and ensure comprehensive testing.

## Usage

```
/review [feature or files to review]
```

## What it does

1. Reviews implemented code for quality and standards
2. Runs existing test suites and analyzes coverage
3. Writes additional tests for edge cases
4. Checks for security vulnerabilities
5. Validates against original specifications

## Examples

```
/review backend scraping service implementation

/review api/companies.py and models/company.py

/review Week 1 implementation before merge
```

## Process

The tester agent will:
1. Analyze code structure and quality
2. Run all existing tests
3. Check test coverage metrics
4. Identify missing test cases
5. Review security considerations
6. Verify documentation completeness

## Review Criteria

- Code follows project conventions
- Proper error handling
- No security vulnerabilities
- Adequate test coverage (80%+)
- Performance considerations
- Documentation quality

## Output

The agent provides:
- Detailed code review report
- Test coverage analysis
- Security assessment
- Additional test recommendations
- Quality metrics summary
- Specific improvement suggestions

Use this command after implementation to ensure code quality before merging or deployment.