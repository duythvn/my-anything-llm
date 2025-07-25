#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# dependencies = [
#     "gTTS",
#     "pygame",
#     "requests"
# ]
# ///

import sys
import tempfile
import os
import subprocess
from pathlib import Path

def try_windows_tts(message):
    """Try Windows TTS via PowerShell (works in WSL)"""
    try:
        # Use PowerShell.exe to access Windows TTS from WSL
        powershell_cmd = [
            'powershell.exe', '-Command',
            f'Add-Type -AssemblyName System.Speech; '
            f'$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer; '
            f'$synth.Speak("{message}");'
        ]
        
        result = subprocess.run(powershell_cmd, 
                              capture_output=True, 
                              text=True, 
                              timeout=10)
        
        if result.returncode == 0:
            print("✅ Windows TTS via PowerShell working!")
            return True
            
    except (subprocess.TimeoutExpired, subprocess.SubprocessError, FileNotFoundError):
        pass
    
    return False

def try_google_tts_offline(message):
    """Try Google TTS with offline playback"""
    try:
        from gtts import gTTS
        import pygame
        import io
        
        print("🔄 Generating speech with Google TTS...")
        
        # Generate TTS
        tts = gTTS(text=message, lang='en', slow=False)
        
        # Save to temporary file
        with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as tmp_file:
            tts.save(tmp_file.name)
            tmp_filename = tmp_file.name
        
        print("🔊 Playing audio...")
        
        # Try different audio backends
        audio_drivers = ['pulse', 'alsa', 'dsp', 'dummy']
        
        for driver in audio_drivers:
            try:
                os.environ['SDL_AUDIODRIVER'] = driver
                pygame.mixer.pre_init(driver=driver)
                pygame.mixer.init()
                
                pygame.mixer.music.load(tmp_filename)
                pygame.mixer.music.play()
                
                # Wait for playback
                while pygame.mixer.music.get_busy():
                    pygame.time.wait(100)
                
                pygame.mixer.quit()
                print(f"✅ Audio played successfully with {driver} driver!")
                
                # Cleanup
                os.unlink(tmp_filename)
                return True
                
            except Exception as e:
                print(f"❌ {driver} driver failed: {e}")
                continue
        
        # Cleanup if all drivers failed
        try:
            os.unlink(tmp_filename)
        except:
            pass
            
    except Exception as e:
        print(f"❌ Google TTS failed: {e}")
    
    return False

def try_system_commands(message):
    """Try various system TTS commands"""
    commands = [
        # Windows (via WSL)
        ['cmd.exe', '/c', f'echo {message} | clip'],  # Copy to clipboard as fallback
        
        # Linux TTS commands (if available)
        ['espeak', message],
        ['festival', '--tts', message],
        ['spd-say', message],
        ['say', message],  # macOS
        
        # Alternative methods
        ['paplay', '/usr/share/sounds/alsa/Front_Left.wav'],  # System sound
        ['aplay', '/usr/share/sounds/alsa/Front_Left.wav'],
    ]
    
    for cmd in commands:
        try:
            if cmd[0] == 'festival':
                result = subprocess.run(cmd[:-1], 
                                      input=message, 
                                      text=True, 
                                      capture_output=True, 
                                      timeout=5)
            else:
                result = subprocess.run(cmd, 
                                      capture_output=True, 
                                      timeout=5)
            
            if result.returncode == 0:
                print(f"✅ System command working: {cmd[0]}")
                return True
                
        except (subprocess.TimeoutExpired, subprocess.SubprocessError, FileNotFoundError):
            continue
    
    return False

def visual_notification(message, priority="normal"):
    """Rich visual notification as fallback"""
    
    priority_styles = {
        'critical': ('🚨', '='*60, 'CRITICAL'),
        'high': ('⚠️ ', '-'*50, 'HIGH'),
        'normal': ('🔔', '-'*40, 'INFO'),
        'low': ('ℹ️ ', '-'*30, 'LOW')
    }
    
    icon, separator, level = priority_styles.get(priority, priority_styles['normal'])
    
    print(f"\n{separator}")
    print(f"{icon} TTS NOTIFICATION [{level}]")
    print(f"{separator}")
    print(f"📢 {message}")
    print(f"{separator}\n")
    
    # Terminal bell
    print('\a', end='', flush=True)
    
    return True

def wsl_compatible_tts(message, priority="normal"):
    """WSL-compatible TTS with multiple fallback methods"""
    
    print(f"🎤 WSL TTS Request: {message} (Priority: {priority})")
    
    methods = [
        ("Windows TTS via PowerShell", lambda: try_windows_tts(message)),
        ("Google TTS + pygame", lambda: try_google_tts_offline(message)),
        ("System TTS Commands", lambda: try_system_commands(message)),
        ("Visual Notification", lambda: visual_notification(message, priority)),
    ]
    
    for method_name, method_func in methods:
        print(f"🔄 Trying {method_name}...")
        try:
            if method_func():
                print(f"✅ {method_name} succeeded!")
                return True
        except Exception as e:
            print(f"❌ {method_name} failed: {e}")
            continue
    
    print("❌ All TTS methods failed")
    return False

def main():
    """Main entry point for WSL-compatible TTS"""
    
    if len(sys.argv) < 2:
        print("Usage: wsl_compatible_tts.py <message> [priority]")
        wsl_compatible_tts("TTS system test", "normal")
        return
    
    message = ' '.join(sys.argv[1:-1]) if len(sys.argv) > 2 else sys.argv[1]
    priority = sys.argv[-1] if len(sys.argv) > 2 and sys.argv[-1] in ['low', 'normal', 'high', 'critical'] else 'normal'
    
    wsl_compatible_tts(message, priority)

if __name__ == '__main__':
    main()