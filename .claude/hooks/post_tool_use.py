#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# ///

import json
import os
import sys
import subprocess
from pathlib import Path

def trigger_tts_notification(message, priority="normal"):
    """Trigger TTS notification using coordination TTS."""
    try:
        tts_script = Path(__file__).parent / "utils" / "tts" / "coordination_tts.py"
        if tts_script.exists():
            subprocess.run([
                str(tts_script), 
                "post_tool_notification", 
                json.dumps({"message": message, "priority": priority})
            ], capture_output=True, timeout=5)
    except Exception:
        pass  # Fail silently if TTS unavailable

def auto_format_code(tool_name, tool_input, tool_response):
    """
    Automatically format code files after editing in the website project.
    """
    if tool_name in ['Write', 'Edit', 'MultiEdit'] and tool_response.get('success'):
        file_path = tool_input.get('file_path', '')
        
        # Only format files in the website directory
        if '/website/' in file_path:
            try:
                # Format TypeScript/JavaScript files
                if file_path.endswith(('.ts', '.tsx', '.js', '.jsx')):
                    # Check if we're in website directory and have prettier
                    website_dir = None
                    current_path = Path(file_path).parent
                    while current_path != current_path.parent:
                        if current_path.name == 'website':
                            website_dir = current_path
                            break
                        current_path = current_path.parent
                    
                    if website_dir and (website_dir / 'package.json').exists():
                        # Run prettier if available
                        result = subprocess.run([
                            'npx', 'prettier', '--write', file_path
                        ], 
                        cwd=website_dir,
                        capture_output=True, 
                        text=True, 
                        timeout=10
                        )
                        
                        if result.returncode == 0:
                            print(f"✅ Auto-formatted: {file_path}")
                            trigger_tts_notification(f"Code formatted: {Path(file_path).name}", "low")
                
                # Format JSON files
                elif file_path.endswith('.json'):
                    try:
                        with open(file_path, 'r') as f:
                            data = json.load(f)
                        
                        with open(file_path, 'w') as f:
                            json.dump(data, f, indent=2, ensure_ascii=False)
                        
                        print(f"✅ Auto-formatted JSON: {file_path}")
                    except (json.JSONDecodeError, OSError):
                        pass  # Skip if JSON is invalid or file access fails
                        
            except (subprocess.TimeoutExpired, subprocess.SubprocessError, OSError):
                pass  # Fail silently if formatting fails

def check_documentation_updates(tool_name, tool_input):
    """
    Check if documentation files should be updated based on code changes.
    """
    if tool_name in ['Write', 'Edit', 'MultiEdit']:
        file_path = tool_input.get('file_path', '')
        
        # Check if CODE_INDEX.md needs updating
        code_extensions = ['.ts', '.tsx', '.js', '.jsx', '.py']
        if any(file_path.endswith(ext) for ext in code_extensions):
            content = tool_input.get('content', '') or tool_input.get('new_string', '')
            
            # Check for new function/class definitions
            function_patterns = [
                r'export\s+function\s+(\w+)',
                r'export\s+const\s+(\w+)\s*=',
                r'class\s+(\w+)',
                r'interface\s+(\w+)',
                r'type\s+(\w+)',
            ]
            
            new_definitions = []
            for pattern in function_patterns:
                import re
                matches = re.findall(pattern, content or '')
                new_definitions.extend(matches)
            
            if new_definitions:
                print(f"📝 Consider updating CODE_INDEX.md with new definitions: {', '.join(new_definitions)}")
        
        # Check if ROADMAP.md needs updating for new features
        if '/components/' in file_path or '/lib/' in file_path or '/app/' in file_path:
            print("📋 Consider updating ROADMAP.md if this represents a new feature or milestone")

def validate_build_safety(tool_name, tool_input, tool_response):
    """
    Validate that build-related changes don't break the project.
    """
    if tool_name in ['Write', 'Edit', 'MultiEdit'] and tool_response.get('success'):
        file_path = tool_input.get('file_path', '')
        
        # Critical files that might affect build
        critical_files = [
            'package.json',
            'next.config.mjs',
            'tailwind.config.ts',
            'tsconfig.json'
        ]
        
        if any(file_path.endswith(critical_file) for critical_file in critical_files):
            print(f"⚠️  Critical file modified: {file_path}")
            print("🔧 Consider running 'npm run build' to verify changes don't break the build")
            trigger_tts_notification(f"Critical file modified: {Path(file_path).name}", "high")

def main():
    try:
        # Read JSON input from stdin
        input_data = json.load(sys.stdin)
        
        tool_name = input_data.get('tool_name', '')
        tool_input = input_data.get('tool_input', {})
        tool_response = input_data.get('tool_response', {})
        
        # Auto-format code files
        auto_format_code(tool_name, tool_input, tool_response)
        
        # Check for documentation updates needed
        check_documentation_updates(tool_name, tool_input)
        
        # Validate build safety
        validate_build_safety(tool_name, tool_input, tool_response)
        
        # Ensure log directory exists
        log_dir = Path.cwd() / 'logs'
        log_dir.mkdir(parents=True, exist_ok=True)
        log_path = log_dir / 'post_tool_use.json'
        
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
        # Handle JSON decode errors gracefully
        sys.exit(0)
    except Exception:
        # Exit cleanly on any other error
        sys.exit(0)

if __name__ == '__main__':
    main()