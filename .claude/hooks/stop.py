#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "python-dotenv",
# ]
# ///

import argparse
import json
import os
import sys
import random
import subprocess
from pathlib import Path
from datetime import datetime

def trigger_tts_notification(notification_type, data):
    """Trigger TTS notification using coordination TTS."""
    try:
        tts_script = Path(__file__).parent / "utils" / "tts" / "coordination_tts.py"
        if tts_script.exists():
            subprocess.run([
                str(tts_script), 
                notification_type, 
                json.dumps(data)
            ], capture_output=True, timeout=5)
    except Exception:
        pass  # Fail silently if TTS unavailable

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # dotenv is optional

def check_documentation_compliance():
    """Check if required documentation files are updated."""
    required_docs = [
        'website/docs/ROADMAP.md',
        'website/docs/CODE_INDEX.md', 
        'website/docs/WORKING_JOURNAL.md',
        'website/docs/DOCUMENT_INDEX.md'
    ]
    
    missing_docs = []
    outdated_docs = []
    
    for doc in required_docs:
        doc_path = Path(doc)
        if not doc_path.exists():
            missing_docs.append(doc)
        else:
            # Check if document was modified recently (within last 7 days)
            # This is a simple heuristic - in practice you might want more sophisticated checks
            try:
                mtime = doc_path.stat().st_mtime
                now = datetime.now().timestamp()
                if (now - mtime) > (7 * 24 * 3600):  # 7 days
                    # Only flag as outdated if there have been recent code changes
                    website_dir = Path('website')
                    if website_dir.exists():
                        # Check for recent changes in code files
                        code_files = list(website_dir.rglob('*.ts')) + list(website_dir.rglob('*.tsx')) + list(website_dir.rglob('*.js')) + list(website_dir.rglob('*.jsx'))
                        recent_code_changes = any(
                            (now - f.stat().st_mtime) < (24 * 3600)  # 1 day
                            for f in code_files if f.exists()
                        )
                        if recent_code_changes:
                            outdated_docs.append(doc)
            except OSError:
                pass  # Skip if we can't check file stats
    
    return missing_docs, outdated_docs

def check_feature_development_compliance():
    """
    Check if the 7-step feature development process was followed.
    This is a simplified check - in practice you'd want more sophisticated validation.
    """
    issues = []
    
    # Check if ROADMAP.md has been updated for new features
    roadmap_path = Path('website/docs/ROADMAP.md')
    if roadmap_path.exists():
        try:
            with open(roadmap_path, 'r') as f:
                content = f.read()
            
            # Simple check for recent stage updates
            if 'in_progress' not in content.lower() and 'completed' not in content.lower():
                issues.append("ROADMAP.md may need stage status updates")
        except OSError:
            pass
    
    # Check if CODE_INDEX.md reflects recent code changes
    code_index_path = Path('website/docs/CODE_INDEX.md')
    if code_index_path.exists():
        try:
            mtime = code_index_path.stat().st_mtime
            now = datetime.now().timestamp()
            
            # If CODE_INDEX.md hasn't been updated in 3 days, suggest review
            if (now - mtime) > (3 * 24 * 3600):
                issues.append("Consider reviewing CODE_INDEX.md for recent code changes")
        except OSError:
            pass
    
    return issues

def extract_test_plan_from_transcript(transcript_path):
    """Extract test plan from conversation transcript for multi-session coordination."""
    if not Path(transcript_path).exists():
        return None
    
    try:
        with open(transcript_path, 'r') as f:
            lines = f.readlines()
        
        # Look for test plan in recent messages
        test_plan_keywords = ['test plan', 'testing', 'test cases', 'validation', 'verify', 'check']
        recent_content = ''.join(lines[-10:]).lower()  # Last 10 lines
        
        if any(keyword in recent_content for keyword in test_plan_keywords):
            # Try to extract JSON from the last line if possible
            last_line_data = None
            if lines:
                try:
                    last_line_data = json.loads(lines[-1])
                except json.JSONDecodeError:
                    pass
            
            return {
                'source': 'conversation_transcript',
                'content': recent_content,
                'extracted_at': last_line_data.get('timestamp') if last_line_data else datetime.now().isoformat(),
                'session_id': last_line_data.get('session_id') if last_line_data else None
            }
    except Exception:
        pass
    
    return None

def write_coordination_signal(signal_type, data):
    """Write coordination signal for multi-session communication."""
    try:
        coordination_dir = Path('.claude/coordination')
        coordination_dir.mkdir(parents=True, exist_ok=True)
        
        signal_file = coordination_dir / f'{signal_type}_signal.json'
        
        signal_data = {
            'timestamp': datetime.now().isoformat(),
            'data': data
        }
        
        with open(signal_file, 'w') as f:
            json.dump(signal_data, f, indent=2)
        
        print(f"📡 Coordination signal sent: {signal_type}")
        
    except Exception:
        pass  # Fail silently

def main():
    try:
        # Parse command line arguments
        parser = argparse.ArgumentParser()
        parser.add_argument('--chat', action='store_true', help='Copy transcript to chat.json')
        parser.add_argument('--session-type', default='coding', help='Session type: coding or testing')
        args = parser.parse_args()
        
        # Read JSON input from stdin
        input_data = json.load(sys.stdin)

        # Extract required fields
        session_id = input_data.get("session_id", "")
        stop_hook_active = input_data.get("stop_hook_active", False)
        transcript_path = input_data.get("transcript_path", "")

        # Check documentation compliance
        missing_docs, outdated_docs = check_documentation_compliance()
        compliance_issues = check_feature_development_compliance()
        
        # Combine all issues
        all_issues = []
        if missing_docs:
            all_issues.append(f"Missing documentation: {', '.join(missing_docs)}")
        if outdated_docs:
            all_issues.append(f"Outdated documentation (consider updating): {', '.join(outdated_docs)}")
        all_issues.extend(compliance_issues)
        
        # Block completion if there are critical issues
        if missing_docs:  # Only block for missing docs, not outdated ones
            trigger_tts_notification("critical_failure", {
                "message": "Documentation compliance failure. Task blocked.",
                "priority": "critical",
                "blocking": True
            })
            output = {
                "decision": "block",
                "reason": f"Please update missing documentation before completing: {', '.join(missing_docs)}"
            }
            print(json.dumps(output))
            sys.exit(0)
        
        # Show warnings for non-blocking issues
        if outdated_docs or compliance_issues:
            for issue in all_issues:
                print(f"⚠️  {issue}")

        # Multi-session coordination
        if args.session_type == 'coding' and transcript_path:
            test_plan = extract_test_plan_from_transcript(transcript_path)
            if test_plan:
                # Write test plan to coordination directory
                coordination_dir = Path('.claude/coordination/test_plans')
                coordination_dir.mkdir(parents=True, exist_ok=True)
                
                plan_file = coordination_dir / f'plan_{int(datetime.now().timestamp())}.json'
                with open(plan_file, 'w') as f:
                    json.dump(test_plan, f, indent=2)
                
                # Signal testing session
                write_coordination_signal('testing', {
                    'type': 'new_test_plan',
                    'priority': 'high',
                    'plan_file': str(plan_file)
                })

        # Ensure log directory exists
        log_dir = os.path.join(os.getcwd(), "logs")
        os.makedirs(log_dir, exist_ok=True)
        log_path = os.path.join(log_dir, "stop.json")

        # Read existing log data or initialize empty list
        if os.path.exists(log_path):
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
        
        # Handle --chat switch for transcript extraction
        if args.chat and transcript_path:
            if os.path.exists(transcript_path):
                # Read .jsonl file and convert to JSON array
                chat_data = []
                try:
                    with open(transcript_path, 'r') as f:
                        for line in f:
                            line = line.strip()
                            if line:
                                try:
                                    chat_data.append(json.loads(line))
                                except json.JSONDecodeError:
                                    pass  # Skip invalid lines
                    
                    # Write to logs/chat.json
                    chat_file = os.path.join(log_dir, 'chat.json')
                    with open(chat_file, 'w') as f:
                        json.dump(chat_data, f, indent=2)
                    
                    print(f"📄 Transcript copied to {chat_file}")
                except Exception:
                    pass  # Fail silently

        # Success message
        completion_messages = [
            "Task completed! 🎉",
            "All done! ✅", 
            "Work finished! 🚀",
            "Ready for next task! 💪",
            "Job complete! 🎯"
        ]
        success_message = random.choice(completion_messages)
        print(success_message)
        
        # Trigger success TTS notification
        trigger_tts_notification("tests_passed", {
            "message": success_message,
            "priority": "normal"
        })

        sys.exit(0)

    except json.JSONDecodeError:
        # Handle JSON decode errors gracefully
        sys.exit(0)
    except Exception:
        # Handle any other errors gracefully
        sys.exit(0)

if __name__ == "__main__":
    main()