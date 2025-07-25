# Scaffold Setup Validation

Use this checklist to verify your enhanced scaffold setup with cross-branch documentation tracking is working correctly.

## ✅ Setup Validation Checklist

### 1. Basic Structure
```bash
# Verify directory structure exists
ls -la .claude/hooks/
ls -la shared/docs/
ls -la worktrees/
ls -la sample_files/
```

Expected output:
- `.claude/hooks/` with executable Python files
- `shared/docs/` with enhanced documentation files (STAGE_STATUS.md, COMMAND_RESPONSIBILITIES.md)
- `worktrees/` directories for backend/frontend
- `sample_files/` with template files
- `.claude/commands/` with enhanced command set (stage-complete.md, workhere.md, etc.)

### 2. Hook System
```bash
# Test hook permissions
ls -la .claude/hooks/*.py
# All should be executable (+x)

# Test pre-tool-use security
echo '{"tool_name": "Bash", "tool_input": {"command": "echo test"}}' | python3 .claude/hooks/pre_tool_use.py
# Should complete without errors

# Test dangerous command blocking
echo '{"tool_name": "Bash", "tool_input": {"command": "rm -rf /"}}' | python3 .claude/hooks/pre_tool_use.py
# Should show "BLOCKED: Dangerous rm command detected"
```

### 3. TTS System
```bash
# Test WSL-compatible TTS
python3 .claude/hooks/utils/tts/wsl_compatible_tts.py "Testing TTS system" normal
# Should speak the message

# Test coordination TTS
python3 .claude/hooks/utils/tts/coordination_tts.py "tests_passed" '{"message": "Setup validation complete", "priority": "normal"}'
# Should speak the message

# Test pyttsx3 fallback
python3 .claude/hooks/utils/tts/pyttsx3_tts.py "Testing fallback TTS"
# Should speak the message
```

### 4. Git Worktree Setup
```bash
# Initialize git if not done
git init
git add .
git commit -m "Initial scaffold setup"

# Test worktree creation
git worktree add worktrees/backend/backend_test -b backend_test backend_main
# Should create new directory

# Verify worktree
ls -la worktrees/backend/backend_test
# Should contain project files

# Cleanup test worktree
git worktree remove worktrees/backend/backend_test
git branch -D backend_test
```

### 5. Scripts and Commands
```bash
# Test setup scripts exist
ls -la shared/scripts/
# Should show install-commands.sh, claude-doc-start, sync_documentation.py, verify-worktree-structure.sh

# Test setup script (if you want to run it)
# bash shared/scripts/install-commands.sh

# Test environment setup helper
# ./bin/claude-doc-start
```

### 6. Enhanced Documentation System
```bash
# Verify enhanced documentation files exist
ls -la shared/docs/STAGE_STATUS.md
ls -la shared/docs/COMMAND_RESPONSIBILITIES.md
ls -la shared/docs/ROADMAP.md
ls -la shared/CLAUDE.md
ls -la README.md
ls -la .claude/hooks/HOOKS_README.md

# Verify enhanced command files exist
ls -la .claude/commands/stage-complete.md
ls -la .claude/commands/workhere.md
ls -la .claude/commands/branchstatus.md
ls -la .claude/commands/resumebranch.md
```

### 7. Environment Protection
```bash
# Test .env protection
echo '{"tool_name": "Read", "tool_input": {"file_path": "/tmp/.env"}}' | python3 .claude/hooks/pre_tool_use.py
# Should show "BLOCKED: Access to .env files containing sensitive data is prohibited"
```

### 8. Log Directory Creation
```bash
# Test that hooks create log directory
echo '{"tool_name": "Bash", "tool_input": {"command": "echo test"}}' | python3 .claude/hooks/pre_tool_use.py
ls -la logs/
# Should show pre_tool_use.json
```

### 8. Enhanced Command System Test
```bash
# Test new command system (requires Claude Code session)
# In a Claude Code session, run:
# /workhere    # Should auto-detect context
# /branchstatus # Should show cross-branch matrix
# /resumebranch # Should show available branches
```

## 🐛 Common Issues and Solutions

### Hook Permission Issues
```bash
# Fix permissions if hooks aren't executable
chmod +x .claude/hooks/*.py
chmod +x .claude/hooks/utils/tts/*.py
```

### Python Dependencies Missing
```bash
# Install required packages
pip3 install pyttsx3 python-dotenv --break-system-packages
# Or use virtual environment

# For UV users
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### TTS Not Working
```bash
# Check espeak installation
which espeak
# If missing: sudo apt install espeak

# Test PowerShell access (WSL)
powershell.exe -Command "echo 'PowerShell accessible'"
# Should return "PowerShell accessible"
```

### Git Worktree Issues
```bash
# Ensure you're in a git repository
git status
# If not: git init

# Check git worktree list
git worktree list
# Should show main worktree
```

## 🎯 Success Criteria

✅ All hooks are executable and functional  
✅ TTS system works with audio output  
✅ Security blocks dangerous commands  
✅ Git worktrees can be created successfully  
✅ Documentation is comprehensive and accessible  
✅ Log directory is created automatically  
✅ Environment files are protected  
✅ Enhanced documentation structure with cross-branch tracking
✅ Context-aware command system operational

## 🚀 Enhanced System Benefits

This scaffold now includes:
- **Cross-Branch Visibility**: STAGE_STATUS.md provides project-wide progress overview
- **Branch-Specific Tracking**: Each branch maintains detailed STAGE_PROGRESS.md
- **Context-Aware Commands**: Commands adapt to current location (root vs branch)
- **Official Stage Completion**: `/stage-complete` provides formal completion tracking
- **Command Documentation**: Clear responsibilities in COMMAND_RESPONSIBILITIES.md

## 📝 Next Steps After Validation

1. **Customize for your project**:
   - Update `shared/CLAUDE.md` with project context
   - Modify `shared/docs/ROADMAP.md` with your features
   - Update domain-specific configs in `shared/backend/` and `shared/frontend/`

2. **Create your first development branch**:
   ```bash
   git worktree add worktrees/backend/backend_your_feature_name -b backend_your_feature_name backend_framework_first
   cd worktrees/backend/backend_your_feature_name
   ```

3. **Start developing with enhanced workflow**:
   ```bash
   # Activate virtual environment (backend)
   source venv/bin/activate
   
   # Check environment setup
   ./bin/claude-doc-start
   
   # Start development server
   python main.py
   
   # Start Claude Code with enhanced commands
   claude
   
   # In Claude session, use enhanced commands:
   /workhere      # Auto-detect context and get guidance
   /devgo         # Check development status and manage tests
   /testgo        # Execute tests and update progress
   /checkpoint    # Save progress with context awareness
   /stage-complete # Mark stages officially complete
   /branchstatus  # View cross-branch progress
   ```

---

🚀 **Scaffold setup complete!** You now have a fully functional development environment with security hooks, TTS notifications, and structured workflow support.