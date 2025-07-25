#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# dependencies = ["pyttsx3"]
# ///

import sys
import os

def main():
    """Simple text-to-speech using pyttsx3 (fallback TTS)."""
    if len(sys.argv) < 2:
        sys.exit(1)
    
    message = ' '.join(sys.argv[1:])
    
    try:
        import pyttsx3
        
        engine = pyttsx3.init()
        engine.setProperty('rate', 150)  # Speech rate
        engine.setProperty('volume', 0.8)  # Volume level (0.0 to 1.0)
        
        # Try to set a more pleasant voice
        voices = engine.getProperty('voices')
        if voices:
            # Prefer female voices if available
            for voice in voices:
                if 'female' in voice.name.lower() or 'woman' in voice.name.lower():
                    engine.setProperty('voice', voice.id)
                    break
        
        engine.say(message)
        engine.runAndWait()
        
    except Exception:
        # Fail silently if TTS is not available
        pass

if __name__ == '__main__':
    main()