# Claude Code Hooks Setup Guide

This comprehensive guide enables you to implement sophisticated Claude Code hooks for any project, providing security, quality assurance, and multi-session coordination capabilities.

## =� Prerequisites

### Required Software
- **[Claude Code](https://docs.anthropic.com/en/docs/claude-code)** - Anthropic's CLI for Claude AI
- **[Astral UV](https://docs.astral.sh/uv/getting-started/installation/)** - Fast Python package installer and resolver
- **[pyttsx3 and espeak]** - Text to speech
### Optional Integrations
- **[ElevenLabs API](https://elevenlabs.io/)** - Premium text-to-speech
- **[OpenAI API](https://openai.com/)** - Language model + TTS provider
- **[Anthropic API](https://www.anthropic.com/)** - Language model provider

### Installation Commands
```bash
# Install UV (macOS/Linux)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Verify installations
claude --version
uv --version
```

## <� Hook System Architecture

### Hook Lifecycle Events
1. **PreToolUse** - Before tool execution (can block)
2. **PostToolUse** - After successful tool completion
3. **Notification** - When Claude Code sends notifications
4. **Stop** - When main Claude agent finishes responding
5. **SubagentStop** - When subagents (Task tools) finish

### Control Mechanisms
- **Exit Code 0**: Success, stdout shown in transcript mode
- **Exit Code 2**: Blocking error, stderr fed to Claude automatically
- **JSON Output**: Advanced control with decision fields

### UV Single-File Script Benefits
- **Isolation**: Hook logic separate from project dependencies
- **Portability**: Each script declares dependencies inline
- **Fast Execution**: UV handles dependencies automatically
- **Self-Contained**: Each hook can be understood independently

## =� Step-by-Step Implementation

### Step 1: Create Project Structure

```bash
# Navigate to your project root
cd /path/to/your/project

# Create Claude Code directories
mkdir -p .claude/hooks/utils/{tts,llm,coordination}
mkdir -p .claude/coordination/{tasks,test_plans,results}
mkdir -p logs
```

### Step 2: Configure Settings

Create `.claude/settings.json`:

```json
{
  "permissions": {
    "allow": [
      "Bash(mkdir:*)",
      "Bash(uv:*)",
      "Bash(find:*)",
      "Bash(mv:*)",
      "Bash(grep:*)",
      "Bash(npm:*)",
      "Bash(ls:*)",
      "Bash(cp:*)",
      "Write",
      "Edit",
      "MultiEdit",
      "Read",
      "Bash(chmod:*)",
      "Bash(touch:*)"
    ],
    "deny": []
  },
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "uv run .claude/hooks/pre_tool_use.py"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "uv run .claude/hooks/post_tool_use.py"
          }
        ]
      }
    ],
    "Notification": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "uv run .claude/hooks/notification.py"
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "uv run .claude/hooks/stop.py"
          }
        ]
      }
    ],
    "SubagentStop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "uv run .claude/hooks/subagent_stop.py"
          }
        ]
      }
    ]
  }
}
```

### Step 3: Implement Core Security Hook

Create `.claude/hooks/pre_tool_use.py`:

```python
#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# ///

import json
import sys
import re
from pathlib import Path

def is_dangerous_command(tool_name, tool_input):
    """Check for dangerous operations that should be blocked."""
    if tool_name == 'Bash':
        command = tool_input.get('command', '')
        
        # Dangerous patterns
        dangerous_patterns = [
            r'\\brm\\s+.*-[a-z]*r[a-z]*f',  # rm -rf variants
            r'\\bsudo\\s+rm',               # sudo rm commands
            r'\\bchmod\\s+777',             # Dangerous permissions
            r'>\\s*/etc/',                 # Writing to system directories
        ]
        
        for pattern in dangerous_patterns:
            if re.search(pattern, command, re.IGNORECASE):
                return True
    
    # Block .env file access (except .env.sample)
    if tool_name in ['Read', 'Edit', 'MultiEdit', 'Write']:
        file_path = tool_input.get('file_path', '')
        if '.env' in file_path and not file_path.endswith('.env.sample'):
            return True
    
    return False

def main():
    try:
        # Read JSON input
        input_data = json.load(sys.stdin)
        tool_name = input_data.get('tool_name', '')
        tool_input = input_data.get('tool_input', {})
        
        # Security checks
        if is_dangerous_command(tool_name, tool_input):
            print("BLOCKED: Dangerous operation detected", file=sys.stderr)
            sys.exit(2)  # Block execution
        
        # Log to file
        log_dir = Path.cwd() / 'logs'
        log_dir.mkdir(parents=True, exist_ok=True)
        log_path = log_dir / 'pre_tool_use.json'
        
        log_data = []
        if log_path.exists():
            try:
                with open(log_path, 'r') as f:
                    log_data = json.load(f)
            except (json.JSONDecodeError, ValueError):
                log_data = []
        
        log_data.append(input_data)
        
        with open(log_path, 'w') as f:
            json.dump(log_data, f, indent=2)
        
        sys.exit(0)
        
    except Exception:
        sys.exit(0)  # Fail gracefully

if __name__ == '__main__':
    main()
```

### Step 4: Implement Logging Hook

Create `.claude/hooks/post_tool_use.py`:

```python
#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# ///

import json
import sys
from pathlib import Path

def main():
    try:
        input_data = json.load(sys.stdin)
        
        # Log to file
        log_dir = Path.cwd() / 'logs'
        log_dir.mkdir(parents=True, exist_ok=True)
        log_path = log_dir / 'post_tool_use.json'
        
        log_data = []
        if log_path.exists():
            try:
                with open(log_path, 'r') as f:
                    log_data = json.load(f)
            except (json.JSONDecodeError, ValueError):
                log_data = []
        
        log_data.append(input_data)
        
        with open(log_path, 'w') as f:
            json.dump(log_data, f, indent=2)
        
        sys.exit(0)
        
    except Exception:
        sys.exit(0)

if __name__ == '__main__':
    main()
```

### Step 5: Implement Completion Hook

Create `.claude/hooks/stop.py`:

```python
#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# ///

import json
import sys
import os
from pathlib import Path

def check_documentation_compliance():
    """Check if required documentation files are updated."""
    required_docs = [
        'docs/ROADMAP.md',
        'docs/CODE_INDEX.md', 
        'docs/WORKING_JOURNAL.md'
    ]
    
    missing_docs = []
    for doc in required_docs:
        if not Path(doc).exists():
            missing_docs.append(doc)
    
    return missing_docs

def main():
    try:
        input_data = json.load(sys.stdin)
        
        # Check documentation compliance
        missing_docs = check_documentation_compliance()
        if missing_docs:
            output = {
                "decision": "block",
                "reason": f"Please update missing documentation: {', '.join(missing_docs)}"
            }
            print(json.dumps(output))
            sys.exit(0)
        
        # Log completion
        log_dir = Path.cwd() / 'logs'
        log_dir.mkdir(parents=True, exist_ok=True)
        log_path = log_dir / 'stop.json'
        
        log_data = []
        if log_path.exists():
            try:
                with open(log_path, 'r') as f:
                    log_data = json.load(f)
            except (json.JSONDecodeError, ValueError):
                log_data = []
        
        log_data.append(input_data)
        
        with open(log_path, 'w') as f:
            json.dump(log_data, f, indent=2)
        
        sys.exit(0)
        
    except Exception:
        sys.exit(0)

if __name__ == '__main__':
    main()
```

### Step 6: Implement Notification Hook

Create `.claude/hooks/notification.py`:

```python
#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# ///

import json
import sys
from pathlib import Path

def main():
    try:
        input_data = json.load(sys.stdin)
        
        # Log notification
        log_dir = Path.cwd() / 'logs'
        log_dir.mkdir(parents=True, exist_ok=True)
        log_path = log_dir / 'notification.json'
        
        log_data = []
        if log_path.exists():
            try:
                with open(log_path, 'r') as f:
                    log_data = json.load(f)
            except (json.JSONDecodeError, ValueError):
                log_data = []
        
        log_data.append(input_data)
        
        with open(log_path, 'w') as f:
            json.dump(log_data, f, indent=2)
        
        sys.exit(0)
        
    except Exception:
        sys.exit(0)

if __name__ == '__main__':
    main()
```

### Step 7: Implement Subagent Hook

Create `.claude/hooks/subagent_stop.py`:

```python
#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# ///

import json
import sys
from pathlib import Path

def main():
    try:
        input_data = json.load(sys.stdin)
        
        # Log subagent completion
        log_dir = Path.cwd() / 'logs'
        log_dir.mkdir(parents=True, exist_ok=True)
        log_path = log_dir / 'subagent_stop.json'
        
        log_data = []
        if log_path.exists():
            try:
                with open(log_path, 'r') as f:
                    log_data = json.load(f)
            except (json.JSONDecodeError, ValueError):
                log_data = []
        
        log_data.append(input_data)
        
        with open(log_path, 'w') as f:
            json.dump(log_data, f, indent=2)
        
        sys.exit(0)
        
    except Exception:
        sys.exit(0)

if __name__ == '__main__':
    main()
```

## = Multi-Session Coordination

### Coordination Architecture

Create `.claude/hooks/utils/coordination.py`:

```python
#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# dependencies = ["watchdog"]
# ///

import json
import time
from pathlib import Path
from datetime import datetime

class SessionCoordinator:
    def __init__(self, project_root=None):
        self.project_root = Path(project_root or Path.cwd())
        self.coordination_dir = self.project_root / '.claude' / 'coordination'
        self.coordination_dir.mkdir(parents=True, exist_ok=True)
    
    def write_task_queue(self, session_type, task_data):
        """Write task to shared queue."""
        queue_file = self.coordination_dir / 'tasks' / f'{session_type}_queue.json'
        queue_file.parent.mkdir(exist_ok=True)
        
        queue_data = []
        if queue_file.exists():
            try:
                with open(queue_file, 'r') as f:
                    queue_data = json.load(f)
            except (json.JSONDecodeError, ValueError):
                queue_data = []
        
        task_entry = {
            'timestamp': datetime.now().isoformat(),
            'task': task_data
        }
        queue_data.append(task_entry)
        
        with open(queue_file, 'w') as f:
            json.dump(queue_data, f, indent=2)
    
    def read_task_queue(self, session_type):
        """Read tasks from shared queue."""
        queue_file = self.coordination_dir / 'tasks' / f'{session_type}_queue.json'
        
        if not queue_file.exists():
            return []
        
        try:
            with open(queue_file, 'r') as f:
                return json.load(f)
        except (json.JSONDecodeError, ValueError):
            return []
    
    def write_test_plan(self, plan_data):
        """Write test plan for testing session."""
        plan_file = self.coordination_dir / 'test_plans' / f'plan_{int(time.time())}.json'
        plan_file.parent.mkdir(exist_ok=True)
        
        with open(plan_file, 'w') as f:
            json.dump(plan_data, f, indent=2)
    
    def read_test_plans(self):
        """Read pending test plans."""
        plans_dir = self.coordination_dir / 'test_plans'
        if not plans_dir.exists():
            return []
        
        plans = []
        for plan_file in plans_dir.glob('*.json'):
            try:
                with open(plan_file, 'r') as f:
                    plan_data = json.load(f)
                    plan_data['file'] = str(plan_file)
                    plans.append(plan_data)
            except (json.JSONDecodeError, ValueError):
                continue
        
        return plans
    
    def write_test_results(self, results_data):
        """Write test results."""
        results_file = self.coordination_dir / 'results' / f'results_{int(time.time())}.json'
        results_file.parent.mkdir(exist_ok=True)
        
        with open(results_file, 'w') as f:
            json.dump(results_data, f, indent=2)
    
    def check_for_signals(self, signal_type):
        """Check for coordination signals."""
        signal_file = self.coordination_dir / f'{signal_type}_signal.json'
        
        if signal_file.exists():
            try:
                with open(signal_file, 'r') as f:
                    signal_data = json.load(f)
                # Remove signal file after reading
                signal_file.unlink()
                return signal_data
            except (json.JSONDecodeError, ValueError):
                signal_file.unlink()  # Remove corrupted signal
        
        return None
```

## >� Testing Your Hooks

### Basic Testing

1. **Verify Hook Registration**:
   ```bash
   claude /hooks
   ```

2. **Test Security Hooks**:
   ```bash
   # This should be blocked by PreToolUse hook
   echo "rm -rf /" | claude
   ```

3. **Check Logging**:
   ```bash
   ls logs/
   cat logs/pre_tool_use.json
   ```

### Multi-Session Testing

1. **Terminal 1 (Coding Session)**:
   ```bash
   claude --session-name coding
   ```

2. **Terminal 2 (Testing Session)**:
   ```bash
   claude --session-name testing
   ```

3. **Test Coordination**:
   - Complete a task in coding session
   - Check if testing session receives notification

## =� Troubleshooting

### Common Issues

1. **Hooks Not Executing**:
   - Check `.claude/settings.json` syntax
   - Verify UV installation: `uv --version`
   - Check file permissions: `chmod +x .claude/hooks/*.py`

2. **Permission Errors**:
   - Ensure hooks directory is writable
   - Check that `logs/` directory can be created

3. **JSON Decode Errors**:
   - Validate all JSON files with `jq`
   - Check for trailing commas in JSON

### Debug Mode

Run Claude Code with debug flag to see hook execution:

```bash
claude --debug
```

## =� Best Practices

### Security
1. **Validate all inputs** in hooks
2. **Use absolute paths** for scripts
3. **Quote shell variables** properly
4. **Block dangerous patterns** proactively

### Performance
1. **Keep hooks lightweight** (< 5 second execution)
2. **Use efficient JSON processing**
3. **Minimize external dependencies**
4. **Cache expensive operations**

### Reliability
1. **Handle errors gracefully** (always exit 0 for non-blocking)
2. **Log important events** for debugging
3. **Test hooks thoroughly** before production use
4. **Have fallback mechanisms** for critical operations

---

This guide provides a complete foundation for implementing sophisticated Claude Code hooks in any project. Customize the patterns and add project-specific validations as needed.