# TestGo Command - Execute Test Plans
DO NOT ATTEMPT TO IMPLEMENT NEW CODE CHANGES OR MOVE TO THE NEXT STAGE
## Purpose
Execute test plans and generate pass/fail reports.
## DO NOT FIX ERRORS

## Usage
```
/testgo
```

## What It Does
1. **Find test plan**: Look for active test plan in `/test_plans/active/`
2. **Execute tests**: Run test plan step by step with validation
3. **Document results**: Generate detailed pass/fail report with evidence
4. **Save report**: Store report in `/test_plans/reports/passed/` or `/failed/`
5. **Update status**: Update STAGE_PROGRESS.md with test results and next steps

## Test Environment
- Activate Python venv: `source backend/venv/bin/activate`
- Ensure services running (PostgreSQL, Redis, backend, frontend)

## Pass/Fail Criteria
**FAILED**: App crashes, core broken, 500 errors, critical security issues
**PASSED**: Core functionality works, minor bugs acceptable

## Report Format
```markdown
# Test Report: {Version}_{Stage}
**Overall Result**: [PASSED/FAILED]
**Tests Executed/Passed/Failed**: {counts}

## Test Results
{Each test with status, expected, actual, notes}

## Issues Found
{Critical and minor issues}

## Recommendations
{Next steps if failed}
```

## Actions
- **Updates STAGE_PROGRESS.md** with test results and completion status
- **Creates detailed test report** with pass/fail evidence
- **Updates test status** in branch-specific documentation  
- **Provides next steps** based on test results (fixes needed or stage completion)

That's it!