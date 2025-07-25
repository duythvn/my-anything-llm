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