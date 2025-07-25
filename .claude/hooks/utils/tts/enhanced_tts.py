#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# dependencies = ["pyttsx3", "gTTS", "pygame"]
# ///

import sys
import os
import subprocess
import tempfile
from pathlib import Path

def try_system_tts(message):
    """Try system TTS commands (espeak, say, etc.)"""
    tts_commands = [
        ['espeak', message],
        ['say', message],  # macOS
        ['festival', '--tts'],  # Linux
        ['flite', '-t', message],  # Festival Lite
        ['spd-say', message],  # Speech Dispatcher
    ]
    
    for cmd in tts_commands:
        try:
            result = subprocess.run(cmd, input=message if cmd[1] == '--tts' else None, 
                                  text=True, capture_output=True, timeout=10)
            if result.returncode == 0:
                print(f"✅ TTS working with: {cmd[0]}")
                return True
        except (subprocess.TimeoutExpired, subprocess.SubprocessError, FileNotFoundError):
            continue
    
    return False

def try_pyttsx3_tts(message):
    """Try pyttsx3 TTS engine"""
    try:
        import pyttsx3
        
        engine = pyttsx3.init()
        
        # Set properties
        engine.setProperty('rate', 150)
        engine.setProperty('volume', 0.9)
        
        # Try to get voices
        voices = engine.getProperty('voices')
        if voices:
            print(f"📢 Found {len(voices)} TTS voices")
            # Use first available voice
            engine.setProperty('voice', voices[0].id)
        
        print("🔊 Playing TTS with pyttsx3...")
        engine.say(message)
        engine.runAndWait()
        print("✅ pyttsx3 TTS completed")
        return True
        
    except Exception as e:
        print(f"❌ pyttsx3 failed: {e}")
        return False

def try_gtts_pygame(message):
    """Try Google TTS with pygame playback"""
    try:
        from gtts import gTTS
        import pygame
        import io
        
        # Generate TTS
        tts = gTTS(text=message, lang='en', slow=False)
        
        # Save to memory buffer
        audio_buffer = io.BytesIO()
        tts.write_to_fp(audio_buffer)
        audio_buffer.seek(0)
        
        # Save to temp file for pygame
        with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as tmp_file:
            tmp_file.write(audio_buffer.read())
            tmp_filename = tmp_file.name
        
        # Play with pygame
        pygame.mixer.init()
        pygame.mixer.music.load(tmp_filename)
        pygame.mixer.music.play()
        
        # Wait for playback to finish
        while pygame.mixer.music.get_busy():
            pygame.time.wait(100)
        
        # Cleanup
        os.unlink(tmp_filename)
        print("✅ Google TTS + pygame completed")
        return True
        
    except Exception as e:
        print(f"❌ Google TTS failed: {e}")
        return False

def try_simple_beep(message):
    """Fallback: system beep with visual output"""
    try:
        # Visual output
        print(f"🔔 TTS: {message}")
        
        # Try system beep
        try:
            subprocess.run(['paplay', '/usr/share/sounds/alsa/Front_Left.wav'], 
                         capture_output=True, timeout=2)
            return True
        except:
            pass
            
        try:
            subprocess.run(['aplay', '/usr/share/sounds/alsa/Front_Left.wav'], 
                         capture_output=True, timeout=2)
            return True
        except:
            pass
            
        # Terminal bell
        print('\a')  # ASCII bell character
        return True
        
    except Exception as e:
        print(f"❌ Beep failed: {e}")
        return False

def enhanced_tts(message, priority="normal"):
    """Enhanced TTS with multiple fallback options"""
    print(f"🎤 TTS Request: {message} (Priority: {priority})")
    
    # Try different TTS methods in order of preference
    methods = [
        ("System TTS", try_system_tts),
        ("pyttsx3", try_pyttsx3_tts),
        ("Google TTS", try_gtts_pygame),
        ("System Beep", try_simple_beep),
    ]
    
    for method_name, method_func in methods:
        print(f"🔄 Trying {method_name}...")
        try:
            if method_func(message):
                print(f"✅ {method_name} succeeded!")
                return True
        except Exception as e:
            print(f"❌ {method_name} failed: {e}")
            continue
    
    print("❌ All TTS methods failed")
    return False

def main():
    """Main entry point"""
    if len(sys.argv) < 2:
        print("Usage: enhanced_tts.py <message> [priority]")
        print("Testing TTS system...")
        enhanced_tts("TTS system test", "normal")
        sys.exit(1)
    
    message = ' '.join(sys.argv[1:-1]) if len(sys.argv) > 2 else sys.argv[1]
    priority = sys.argv[-1] if len(sys.argv) > 2 and sys.argv[-1] in ['low', 'normal', 'high', 'critical'] else 'normal'
    
    enhanced_tts(message, priority)

if __name__ == '__main__':
    main()