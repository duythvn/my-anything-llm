# DevGo Command - Fix Tests or Create Test Plans

## Purpose
Fix failed tests or create new test plans based on current stage status.
DO NOT ATTEMPT TO IMPLEMENT NEW CODE CHANGES OR MOVE TO THE NEXT STAGE
## Usage
```
/devgo
```

## What It Does
1. **Check current stage**: Analyze git branch or STAGE_PROGRESS.md to determine current stage
2. **Look for test plan**: Search for `/test_plans/active/{version}_{stage}_external_test_plan.md`
3. **Check test reports**: Look for reports in `/test_plans/reports/passed/` or `/failed/`
4. **Update branch progress**: Update STAGE_PROGRESS.md with current development status

## Decision Logic
- **Report in `/passed/`** → Archive test plan to `/shared_test_plans/archived`, mark stage complete in STAGE_PROGRESS.md
- **Report in `/failed/`** → Analyze failures and provide fix recommendations
- **No plan + no reports** → Create test plan if stage is ready for testing
- **Plan exists, no reports** → Ready for testing with `/testgo`
- **Stage incomplete** → Provide guidance on remaining implementation tasks

## Actions  
- **Updates STAGE_PROGRESS.md** with branch-specific development progress
- **Updates test status** and completion tracking
- **Provides fix recommendations** for failed tests
- **Creates test plans** when stage implementation is complete
- **Commits fixes** if applied automatically

That's it!