#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# dependencies = ["watchdog"]
# ///

import json
import time
import os
from pathlib import Path
from datetime import datetime

class SessionCoordinator:
    """
    Manages coordination between multiple Claude Code sessions.
    Enables coding and testing sessions to communicate and hand off work.
    """
    
    def __init__(self, project_root=None):
        self.project_root = Path(project_root or Path.cwd())
        self.coordination_dir = self.project_root / '.claude' / 'coordination'
        self.coordination_dir.mkdir(parents=True, exist_ok=True)
    
    def write_task_queue(self, session_type, task_data):
        """
        Write task to shared queue for specific session type.
        
        Args:
            session_type: 'coding', 'testing', 'build', etc.
            task_data: Dictionary containing task information
        """
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
            'id': f"{session_type}_{int(time.time())}",
            'timestamp': datetime.now().isoformat(),
            'task': task_data,
            'status': 'pending'
        }
        queue_data.append(task_entry)
        
        with open(queue_file, 'w') as f:
            json.dump(queue_data, f, indent=2)
        
        return task_entry['id']
    
    def read_task_queue(self, session_type):
        """
        Read tasks from shared queue for specific session type.
        
        Args:
            session_type: 'coding', 'testing', 'build', etc.
            
        Returns:
            List of pending tasks
        """
        queue_file = self.coordination_dir / 'tasks' / f'{session_type}_queue.json'
        
        if not queue_file.exists():
            return []
        
        try:
            with open(queue_file, 'r') as f:
                all_tasks = json.load(f)
            
            # Return only pending tasks
            return [task for task in all_tasks if task.get('status') == 'pending']
            
        except (json.JSONDecodeError, ValueError):
            return []
    
    def mark_task_completed(self, session_type, task_id):
        """Mark a specific task as completed."""
        queue_file = self.coordination_dir / 'tasks' / f'{session_type}_queue.json'
        
        if not queue_file.exists():
            return False
        
        try:
            with open(queue_file, 'r') as f:
                all_tasks = json.load(f)
            
            # Find and update the task
            for task in all_tasks:
                if task.get('id') == task_id:
                    task['status'] = 'completed'
                    task['completed_at'] = datetime.now().isoformat()
                    break
            
            with open(queue_file, 'w') as f:
                json.dump(all_tasks, f, indent=2)
            
            return True
            
        except (json.JSONDecodeError, ValueError):
            return False
    
    def write_test_plan(self, plan_data):
        """
        Write test plan for testing session to pick up.
        
        Args:
            plan_data: Dictionary containing test plan information
        """
        plan_file = self.coordination_dir / 'test_plans' / f'plan_{int(time.time())}.json'
        plan_file.parent.mkdir(exist_ok=True)
        
        # Enhance plan data with metadata
        enhanced_plan = {
            'id': f"plan_{int(time.time())}",
            'created_at': datetime.now().isoformat(),
            'status': 'pending',
            **plan_data
        }
        
        with open(plan_file, 'w') as f:
            json.dump(enhanced_plan, f, indent=2)
        
        return str(plan_file)
    
    def read_test_plans(self, status='pending'):
        """
        Read test plans with specified status.
        
        Args:
            status: 'pending', 'in_progress', 'completed'
            
        Returns:
            List of test plans matching the status
        """
        plans_dir = self.coordination_dir / 'test_plans'
        if not plans_dir.exists():
            return []
        
        plans = []
        for plan_file in plans_dir.glob('*.json'):
            try:
                with open(plan_file, 'r') as f:
                    plan_data = json.load(f)
                
                if plan_data.get('status') == status:
                    plan_data['file'] = str(plan_file)
                    plans.append(plan_data)
                    
            except (json.JSONDecodeError, ValueError):
                continue
        
        # Sort by creation time
        plans.sort(key=lambda x: x.get('created_at', ''))
        return plans
    
    def mark_test_plan_status(self, plan_file, status):
        """Update test plan status."""
        try:
            with open(plan_file, 'r') as f:
                plan_data = json.load(f)
            
            plan_data['status'] = status
            if status == 'completed':
                plan_data['completed_at'] = datetime.now().isoformat()
            elif status == 'in_progress':
                plan_data['started_at'] = datetime.now().isoformat()
            
            with open(plan_file, 'w') as f:
                json.dump(plan_data, f, indent=2)
                
            return True
            
        except (json.JSONDecodeError, ValueError, OSError):
            return False
    
    def write_test_results(self, results_data, plan_id=None):
        """
        Write test results back to coordination system.
        
        Args:
            results_data: Dictionary containing test results
            plan_id: Optional plan ID this relates to
        """
        results_file = self.coordination_dir / 'results' / f'results_{int(time.time())}.json'
        results_file.parent.mkdir(exist_ok=True)
        
        enhanced_results = {
            'id': f"results_{int(time.time())}",
            'created_at': datetime.now().isoformat(),
            'plan_id': plan_id,
            **results_data
        }
        
        with open(results_file, 'w') as f:
            json.dump(enhanced_results, f, indent=2)
        
        return str(results_file)
    
    def read_test_results(self, plan_id=None):
        """Read test results, optionally filtered by plan ID."""
        results_dir = self.coordination_dir / 'results'
        if not results_dir.exists():
            return []
        
        results = []
        for results_file in results_dir.glob('*.json'):
            try:
                with open(results_file, 'r') as f:
                    result_data = json.load(f)
                
                if plan_id is None or result_data.get('plan_id') == plan_id:
                    result_data['file'] = str(results_file)
                    results.append(result_data)
                    
            except (json.JSONDecodeError, ValueError):
                continue
        
        # Sort by creation time
        results.sort(key=lambda x: x.get('created_at', ''))
        return results
    
    def send_signal(self, signal_type, data):
        """
        Send coordination signal to other sessions.
        
        Args:
            signal_type: 'testing', 'coding', 'build', 'deploy', etc.
            data: Signal payload
        """
        signal_file = self.coordination_dir / f'{signal_type}_signal.json'
        
        signal_data = {
            'timestamp': datetime.now().isoformat(),
            'sender': os.getenv('USER', 'unknown'),
            'data': data
        }
        
        with open(signal_file, 'w') as f:
            json.dump(signal_data, f, indent=2)
    
    def check_for_signals(self, signal_type):
        """
        Check for coordination signals and consume them.
        
        Args:
            signal_type: Type of signal to check for
            
        Returns:
            Signal data if found, None otherwise
        """
        signal_file = self.coordination_dir / f'{signal_type}_signal.json'
        
        if signal_file.exists():
            try:
                with open(signal_file, 'r') as f:
                    signal_data = json.load(f)
                
                # Remove signal file after reading (consume it)
                signal_file.unlink()
                return signal_data
                
            except (json.JSONDecodeError, ValueError):
                # Remove corrupted signal
                try:
                    signal_file.unlink()
                except OSError:
                    pass
        
        return None
    
    def get_session_status(self):
        """Get overall coordination system status."""
        status = {
            'pending_tasks': {},
            'pending_test_plans': len(self.read_test_plans('pending')),
            'in_progress_test_plans': len(self.read_test_plans('in_progress')),
            'recent_results': len(self.read_test_results()),
            'coordination_dir': str(self.coordination_dir)
        }
        
        # Count pending tasks by type
        tasks_dir = self.coordination_dir / 'tasks'
        if tasks_dir.exists():
            for queue_file in tasks_dir.glob('*_queue.json'):
                session_type = queue_file.name.replace('_queue.json', '')
                pending_tasks = self.read_task_queue(session_type)
                status['pending_tasks'][session_type] = len(pending_tasks)
        
        return status
    
    def cleanup_old_data(self, days_old=7):
        """Clean up coordination data older than specified days."""
        cutoff_time = time.time() - (days_old * 24 * 3600)
        cleaned_count = 0
        
        # Clean old test plans
        plans_dir = self.coordination_dir / 'test_plans'
        if plans_dir.exists():
            for plan_file in plans_dir.glob('*.json'):
                try:
                    if plan_file.stat().st_mtime < cutoff_time:
                        plan_file.unlink()
                        cleaned_count += 1
                except OSError:
                    pass
        
        # Clean old results
        results_dir = self.coordination_dir / 'results'
        if results_dir.exists():
            for results_file in results_dir.glob('*.json'):
                try:
                    if results_file.stat().st_mtime < cutoff_time:
                        results_file.unlink()
                        cleaned_count += 1
                except OSError:
                    pass
        
        return cleaned_count

def main():
    """Example usage and testing."""
    coordinator = SessionCoordinator()
    
    # Example: Write a test plan
    test_plan = {
        'feature': 'AI Chat System',
        'description': 'Test the vector search and response generation',
        'tests': [
            'Test vector search functionality with sample queries',
            'Test rate limiting with multiple requests',
            'Test error handling for malformed queries',
            'Test AI response generation quality'
        ],
        'priority': 'high',
        'estimated_time': '30 minutes'
    }
    
    plan_file = coordinator.write_test_plan(test_plan)
    print(f"✅ Test plan written: {plan_file}")
    
    # Example: Send signal to testing session
    coordinator.send_signal('testing', {
        'type': 'new_test_plan',
        'priority': 'high',
        'plan_file': plan_file
    })
    print("📡 Signal sent to testing session")
    
    # Example: Check status
    status = coordinator.get_session_status()
    print(f"📊 Coordination status: {json.dumps(status, indent=2)}")

if __name__ == '__main__':
    main()