#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# ///

import json
import sys
import re
import subprocess
from pathlib import Path

def trigger_tts_notification(notification_type, data):
    """Trigger TTS notification using coordination TTS."""
    try:
        tts_script = Path(__file__).parent / "utils" / "tts" / "coordination_tts.py"
        if tts_script.exists():
            subprocess.run([
                "python3",
                str(tts_script), 
                notification_type, 
                json.dumps(data)
            ], timeout=5)
    except Exception:
        pass  # Fail silently if TTS unavailable

def is_dangerous_rm_command(command):
    """
    Comprehensive detection of dangerous rm commands.
    Matches various forms of rm -rf and similar destructive patterns.
    """
    # Normalize command by removing extra spaces and converting to lowercase
    normalized = ' '.join(command.lower().split())
    
    # Pattern 1: Standard rm -rf variations
    patterns = [
        r'\brm\s+.*-[a-z]*r[a-z]*f',  # rm -rf, rm -fr, rm -Rf, etc.
        r'\brm\s+.*-[a-z]*f[a-z]*r',  # rm -fr variations
        r'\brm\s+--recursive\s+--force',  # rm --recursive --force
        r'\brm\s+--force\s+--recursive',  # rm --force --recursive
        r'\brm\s+-r\s+.*-f',  # rm -r ... -f
        r'\brm\s+-f\s+.*-r',  # rm -f ... -r
    ]
    
    # Check for dangerous patterns
    for pattern in patterns:
        if re.search(pattern, normalized):
            return True
    
    # Pattern 2: Check for rm with recursive flag targeting dangerous paths
    dangerous_paths = [
        r'/',           # Root directory
        r'/\*',         # Root with wildcard
        r'~',           # Home directory
        r'~/',          # Home directory path
        r'\$HOME',      # Home environment variable
        r'\.\.',        # Parent directory references
        r'\*',          # Wildcards in general rm -rf context
        r'\.',          # Current directory
        r'\.\s*$',      # Current directory at end of command
    ]
    
    if re.search(r'\brm\s+.*-[a-z]*r', normalized):  # If rm has recursive flag
        for path in dangerous_paths:
            if re.search(path, normalized):
                return True
    
    return False

def is_env_file_access(tool_name, tool_input):
    """
    Check if any tool is trying to access .env files containing sensitive data.
    """
    if tool_name in ['Read', 'Edit', 'MultiEdit', 'Write', 'Bash']:
        # Check file paths for file-based tools
        if tool_name in ['Read', 'Edit', 'MultiEdit', 'Write']:
            file_path = tool_input.get('file_path', '')
            if '.env' in file_path and not file_path.endswith('.env.sample') and not file_path.endswith('.env.local'):
                return True
        
        # Check bash commands for .env file access
        elif tool_name == 'Bash':
            command = tool_input.get('command', '')
            # Pattern to detect .env file access (but allow .env.sample and .env.local)
            env_patterns = [
                r'\b\.env\b(?!\.sample|\.local)',  # .env but not .env.sample or .env.local
                r'cat\s+.*\.env\b(?!\.sample|\.local)',  # cat .env
                r'echo\s+.*>\s*\.env\b(?!\.sample|\.local)',  # echo > .env
                r'touch\s+.*\.env\b(?!\.sample|\.local)',  # touch .env
                r'cp\s+.*\.env\b(?!\.sample|\.local)',  # cp .env
                r'mv\s+.*\.env\b(?!\.sample|\.local)',  # mv .env
            ]
            
            for pattern in env_patterns:
                if re.search(pattern, command):
                    return True
    
    return False

def validate_web_development_operations(tool_name, tool_input):
    """
    Validate web development specific operations for Next.js project.
    """
    if tool_name == 'Bash':
        command = tool_input.get('command', '')
        
        # Block dangerous npm/pnpm operations
        dangerous_npm_patterns = [
            r'npm\s+uninstall\s+.*react',  # Don't uninstall core dependencies
            r'npm\s+uninstall\s+.*next',
            r'pnpm\s+remove\s+.*react',
            r'pnpm\s+remove\s+.*next',
            r'npm\s+install\s+.*\s+--save\s+.*malicious',  # Prevent malicious packages
        ]
        
        for pattern in dangerous_npm_patterns:
            if re.search(pattern, command, re.IGNORECASE):
                return False, f"Blocked potentially dangerous package operation"
    
    # Protect critical files
    if tool_name in ['Edit', 'Write', 'MultiEdit']:
        file_path = tool_input.get('file_path', '')
        
        # Protect package.json from direct editing without review
        if file_path.endswith('package.json'):
            # Allow but warn about package.json modifications
            pass
        
        # Protect build directories
        protected_dirs = ['node_modules', 'dist', 'build', '.next', '.vercel']
        if any(dir_name in file_path for dir_name in protected_dirs):
            return False, f"Direct modification of {file_path} not allowed - build directories are auto-generated"
        
        # Protect system files
        if file_path.startswith('/etc/') or file_path.startswith('/usr/') or file_path.startswith('/bin/'):
            return False, f"System file modification blocked: {file_path}"
    
    return True, ""

def validate_database_operations(tool_name, tool_input):
    """
    Validate database operations for safety with Supabase.
    """
    if tool_name == 'Bash':
        command = tool_input.get('command', '')
        
        # Block dangerous database operations
        dangerous_db_patterns = [
            r'DROP\s+TABLE',
            r'DELETE\s+FROM.*WHERE.*1\s*=\s*1',  # Delete all rows
            r'TRUNCATE\s+TABLE',
            r'DROP\s+DATABASE',
            r'ALTER\s+TABLE.*DROP\s+COLUMN',
            r'DROP\s+SCHEMA',
        ]
        
        for pattern in dangerous_db_patterns:
            if re.search(pattern, command, re.IGNORECASE):
                return False, f"Dangerous database operation blocked: {pattern}"
    
    # Check SQL files for dangerous operations
    if tool_name in ['Write', 'Edit', 'MultiEdit']:
        file_path = tool_input.get('file_path', '')
        content = tool_input.get('content', '') or tool_input.get('new_string', '')
        
        if file_path.endswith('.sql') and content:
            dangerous_sql_patterns = [
                r'DROP\s+TABLE',
                r'DELETE\s+FROM.*WHERE.*1\s*=\s*1',
                r'TRUNCATE\s+TABLE',
                r'DROP\s+DATABASE',
            ]
            
            for pattern in dangerous_sql_patterns:
                if re.search(pattern, content, re.IGNORECASE):
                    return False, f"Dangerous SQL operation in file: {pattern}"
    
    return True, ""

def main():
    try:
        # Read JSON input from stdin
        input_data = json.load(sys.stdin)
        
        tool_name = input_data.get('tool_name', '')
        tool_input = input_data.get('tool_input', {})
        
        # Check for .env file access (blocks access to sensitive environment files)
        if is_env_file_access(tool_name, tool_input):
            trigger_tts_notification("critical_failure", {
                "message": "Blocked unauthorized access to environment files",
                "priority": "critical"
            })
            print("BLOCKED: Access to .env files containing sensitive data is prohibited", file=sys.stderr)
            print("Use .env.sample for template files or .env.local for local development", file=sys.stderr)
            sys.exit(2)  # Exit code 2 blocks tool call and shows error to Claude
        
        # Check for dangerous rm -rf commands
        if tool_name == 'Bash':
            command = tool_input.get('command', '')
            
            # Block rm -rf commands with comprehensive pattern matching
            if is_dangerous_rm_command(command):
                trigger_tts_notification("critical_failure", {
                    "message": "Blocked dangerous deletion command",
                    "priority": "critical"
                })
                print("BLOCKED: Dangerous rm command detected and prevented", file=sys.stderr)
                sys.exit(2)  # Exit code 2 blocks tool call and shows error to Claude
        
        # Validate web development operations
        valid, message = validate_web_development_operations(tool_name, tool_input)
        if not valid:
            print(f"BLOCKED: {message}", file=sys.stderr)
            sys.exit(2)
        
        # Validate database operations
        valid, message = validate_database_operations(tool_name, tool_input)
        if not valid:
            print(f"BLOCKED: {message}", file=sys.stderr)
            sys.exit(2)
        
        # Ensure log directory exists
        log_dir = Path.cwd() / 'logs'
        log_dir.mkdir(parents=True, exist_ok=True)
        log_path = log_dir / 'pre_tool_use.json'
        
        # Read existing log data or initialize empty list
        if log_path.exists():
            with open(log_path, 'r') as f:
                try:
                    log_data = json.load(f)
                except (json.JSONDecodeError, ValueError):
                    log_data = []
        else:
            log_data = []
        
        # Append new data
        log_data.append(input_data)
        
        # Write back to file with formatting
        with open(log_path, 'w') as f:
            json.dump(log_data, f, indent=2)
        
        sys.exit(0)
        
    except json.JSONDecodeError:
        # Gracefully handle JSON decode errors
        sys.exit(0)
    except Exception:
        # Handle any other errors gracefully
        sys.exit(0)

if __name__ == '__main__':
    main()