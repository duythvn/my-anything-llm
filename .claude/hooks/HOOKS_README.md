# Claude Code Security Hooks

This directory contains security and automation hooks for Claude Code integration.

## Hook Files

### Core Hooks
- **pre_tool_use.py**: Validates operations before execution
- **post_tool_use.py**: Provides automation after tool execution  
- **stop.py**: Validates session completion requirements
- **subagent_stop.py**: Tracks subagent completion
- **notification.py**: Handles general notifications

### TTS System (utils/tts/)
- **coordination_tts.py**: Main TTS coordination system
- **wsl_compatible_tts.py**: WSL-specific TTS with fallbacks
- **pyttsx3_tts.py**: Offline TTS using pyttsx3
- **enhanced_tts.py**: Enhanced TTS with voice selection
- **simple_tts.py**: Basic TTS implementation

## Security Features

### Blocked Operations
- Dangerous file deletions (rm -rf patterns)
- Unauthorized .env file access
- SQL injection attempts
- System file modifications
- Build directory edits

### Protected Files/Directories
- `.env` files (except .env.sample, .env.local)
- System directories (`/etc/`, `/usr/`, `/bin/`)
- Build directories (`node_modules`, `dist`, `build`, `.next`)

## TTS Notifications

### Priority Levels
- **Critical**: Urgent security blocks, failures
- **High**: Important file changes, warnings
- **Normal**: General notifications, completions
- **Low**: Minor updates, formatting

### Fallback Chain
1. Windows TTS via PowerShell (WSL)
2. pyttsx3 with espeak
3. Visual notifications with terminal bell

## Configuration

### Environment Variables
- `SDL_AUDIODRIVER`: Audio driver for pygame (pulse, alsa, dsp)
- `CLAUDE_TTS_DISABLE`: Set to disable TTS notifications

### Customization
Edit individual hook files to modify:
- Security policies
- TTS messages  
- Validation rules
- Automation behaviors

## Testing

```bash
# Test security blocking
echo '{"tool_name": "Bash", "tool_input": {"command": "rm -rf /"}}' | python3 pre_tool_use.py

# Test TTS system
python3 utils/tts/wsl_compatible_tts.py "Test message" normal

# Test completion hooks
echo '{"session_id": "test"}' | python3 stop.py
```

## Logs

Hook execution logs are stored in `logs/`:
- `pre_tool_use.json`: Pre-execution validation logs
- `post_tool_use.json`: Post-execution automation logs  
- `stop.json`: Session completion logs
- `subagent_stop.json`: Subagent completion logs
- `notification.json`: General notification logs

## Troubleshooting

### Common Issues
1. **Permission denied**: Ensure hooks are executable (`chmod +x *.py`)
2. **TTS not working**: Check audio system and dependencies
3. **Import errors**: Install required Python packages
4. **WSL audio issues**: Use Windows TTS fallback

### Debug Mode
Set environment variable for verbose output:
```bash
export CLAUDE_HOOKS_DEBUG=1
```

## Dependencies

### Required
- Python 3.8+
- UV package manager (recommended)

### Optional (for TTS)
- pyttsx3
- espeak
- pygame (for audio playback)
- gTTS (for Google TTS)

Install with:
```bash
uv add pyttsx3 pygame gTTS python-dotenv
```

---

**Security Note**: These hooks provide defensive security measures but should not be considered a complete security solution. Always follow security best practices in your development workflow.