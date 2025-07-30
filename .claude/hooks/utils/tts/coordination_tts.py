#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# dependencies = ["pyttsx3"]
# ///

import sys
import json
import os
import subprocess
from pathlib import Path

def speak_message(message, priority="normal"):
    """Speak a message using WSL-compatible TTS with fallbacks."""
    try:
        # Use WSL-compatible TTS script
        wsl_tts_script = Path(__file__).parent / "wsl_compatible_tts.py"
        if wsl_tts_script.exists():
            subprocess.run([
                "python3",
                str(wsl_tts_script), 
                message, 
                priority
            ], timeout=10)
        else:
            # Fallback to pyttsx3
            import pyttsx3
            engine = pyttsx3.init()
            
            # Configure based on priority
            if priority == "critical":
                engine.setProperty('rate', 180)
                engine.setProperty('volume', 1.0)
            elif priority == "high":
                engine.setProperty('rate', 160)
                engine.setProperty('volume', 0.9)
            else:
                engine.setProperty('rate', 150)
                engine.setProperty('volume', 0.8)
            
            engine.say(message)
            engine.runAndWait()
        
    except Exception:
        # Final fallback: visual notification
        print(f"\n🔊 TTS: {message} (Priority: {priority})\n")
        print('\a', end='', flush=True)  # Terminal bell

def coordination_notification(notification_type, data):
    """Generate appropriate TTS notification for coordination events."""
    
    messages = {
        "test_plan_ready": f"Test plan ready for execution. Priority: {data.get('priority', 'normal')}",
        "test_results_available": f"Test results available. {data.get('summary', 'Check coordination status.')}",
        "critical_failure": data.get('message', "Critical failure detected. Immediate attention required."),
        "tests_passed": data.get('message', "All tests passed. Ready for next development task."),
        "coordination_error": f"Coordination system error. Check system status.",
        "post_tool_notification": data.get('message', "Tool operation completed.")
    }
    
    message = messages.get(notification_type, f"Coordination update: {notification_type}")
    priority = data.get('priority', 'normal')
    
    # Add context if blocking
    if data.get('blocking', False):
        message += " This is blocking further development."
        priority = "critical"
    
    speak_message(message, priority)

def main():
    """Main entry point for coordination TTS notifications."""
    if len(sys.argv) < 2:
        print("Usage: coordination_tts.py <notification_type> [json_data]")
        sys.exit(1)
    
    notification_type = sys.argv[1]
    
    # Parse optional JSON data
    data = {}
    if len(sys.argv) > 2:
        try:
            data = json.loads(sys.argv[2])
        except json.JSONDecodeError:
            data = {"message": ' '.join(sys.argv[2:])}
    
    coordination_notification(notification_type, data)

if __name__ == '__main__':
    main()