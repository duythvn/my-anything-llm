#!/usr/bin/env python3
"""
Documentation Sync Workflow Script
==================================

This script helps manage the three-tier documentation system:
1. Shared Documentation (/shared/docs/)
2. Stack-Specific Instructions (/shared/{backend,frontend}/)
3. Branch-Specific Documentation (/worktrees/.../docs/)

Usage:
    python sync_documentation.py --check          # Check for items ready for consolidation
    python sync_documentation.py --consolidate    # Interactive consolidation process
    python sync_documentation.py --validate       # Validate documentation consistency
"""

import os
import sys
import glob
import argparse
from pathlib import Path
from typing import List, Dict, Any
import json
import re

class DocumentationSyncer:
    def __init__(self, project_root: str = "/home/duyth/projects/agentic_system"):
        self.project_root = Path(project_root)
        self.shared_docs = self.project_root / "shared" / "docs"
        self.worktrees = self.project_root / "worktrees"
        
    def find_ready_for_consolidation(self) -> List[Dict[str, Any]]:
        """Find all READY_FOR_CONSOLIDATION.md files in worktrees"""
        ready_files = []
        
        for worktree_path in self.worktrees.rglob("**/docs/READY_FOR_CONSOLIDATION.md"):
            if worktree_path.exists() and worktree_path.stat().st_size > 0:
                # Extract branch info from path
                parts = worktree_path.parts
                branch_type = parts[-4]  # backend or frontend
                branch_name = parts[-3]  # backend_main, backend_v03-s1.1, etc.
                
                ready_files.append({
                    "path": worktree_path,
                    "branch_type": branch_type,
                    "branch_name": branch_name,
                    "relative_path": str(worktree_path.relative_to(self.project_root))
                })
        
        return ready_files
    
    def check_consolidation_status(self) -> None:
        """Check what's ready for consolidation"""
        ready_files = self.find_ready_for_consolidation()
        
        if not ready_files:
            print("✅ No items ready for consolidation")
            return
        
        print(f"📋 Found {len(ready_files)} branches with items ready for consolidation:")
        print()
        
        for item in ready_files:
            print(f"🔍 {item['branch_type']}/{item['branch_name']}")
            print(f"   File: {item['relative_path']}")
            
            # Read first few lines to show preview
            try:
                with open(item['path'], 'r') as f:
                    content = f.read()
                    lines = content.split('\\n')[:5]
                    preview = '\\n'.join(lines)
                    if len(lines) == 5:
                        preview += "\\n..."
                    print(f"   Preview: {preview[:100]}...")
            except Exception as e:
                print(f"   Error reading file: {e}")
            print()
    
    def consolidate_documentation(self) -> None:
        """Interactive consolidation process"""
        ready_files = self.find_ready_for_consolidation()
        
        if not ready_files:
            print("✅ No items ready for consolidation")
            return
        
        print(f"📋 Found {len(ready_files)} branches with items ready for consolidation")
        print()
        
        for item in ready_files:
            print(f"🔍 Processing {item['branch_type']}/{item['branch_name']}")
            print(f"   File: {item['relative_path']}")
            
            try:
                with open(item['path'], 'r') as f:
                    content = f.read()
                
                print(f"   Content ({len(content)} chars):")
                print("   " + "="*50)
                print("   " + content.replace('\\n', '\\n   ')[:500])
                if len(content) > 500:
                    print("   ...")
                print("   " + "="*50)
                
                # Interactive consolidation
                while True:
                    action = input("   Action: [c]onsolidate, [s]kip, [v]iew full, [q]uit: ").lower()
                    
                    if action == 'c':
                        self._consolidate_item(item, content)
                        break
                    elif action == 's':
                        print("   Skipped")
                        break
                    elif action == 'v':
                        print("   Full content:")
                        print("   " + "="*50)
                        print("   " + content.replace('\\n', '\\n   '))
                        print("   " + "="*50)
                    elif action == 'q':
                        return
                    else:
                        print("   Invalid action. Use c, s, v, or q")
                
                print()
            
            except Exception as e:
                print(f"   Error reading file: {e}")
                print()
    
    def _consolidate_item(self, item: Dict[str, Any], content: str) -> None:
        """Consolidate a single item"""
        print("   Consolidation options:")
        print("   1. Add to shared docs (ROADMAP.md, CURRENT_STATE.md, etc.)")
        print("   2. Add to architecture docs")
        print("   3. Add to stack-specific instructions")
        print("   4. Create new document")
        print("   5. Cancel")
        
        choice = input("   Choose destination (1-5): ")
        
        if choice == '1':
            self._add_to_shared_docs(item, content)
        elif choice == '2':
            self._add_to_architecture_docs(item, content)
        elif choice == '3':
            self._add_to_stack_specific(item, content)
        elif choice == '4':
            self._create_new_document(item, content)
        elif choice == '5':
            print("   Cancelled")
            return
        else:
            print("   Invalid choice")
            return
        
        # Clear the READY_FOR_CONSOLIDATION.md file
        try:
            with open(item['path'], 'w') as f:
                f.write("# Ready for Consolidation\\n\\n*Items have been consolidated into shared documentation*\\n")
            print(f"   ✅ Cleared {item['path']}")
        except Exception as e:
            print(f"   ❌ Error clearing file: {e}")
    
    def _add_to_shared_docs(self, item: Dict[str, Any], content: str) -> None:
        """Add content to shared documentation files"""
        shared_files = list(self.shared_docs.glob("*.md"))
        
        print("   Available shared docs:")
        for i, file_path in enumerate(shared_files):
            print(f"   {i+1}. {file_path.name}")
        
        try:
            choice = int(input("   Choose file (number): ")) - 1
            if 0 <= choice < len(shared_files):
                target_file = shared_files[choice]
                
                # Append content with proper formatting
                with open(target_file, 'a') as f:
                    f.write(f"\\n\\n## Update from {item['branch_name']} ({item['branch_type']})\\n\\n")
                    f.write(content)
                
                print(f"   ✅ Added to {target_file.name}")
            else:
                print("   Invalid choice")
        except ValueError:
            print("   Invalid input")
    
    def _add_to_architecture_docs(self, item: Dict[str, Any], content: str) -> None:
        """Add content to architecture documentation"""
        arch_dir = self.shared_docs / "architecture"
        arch_files = list(arch_dir.glob("*.md"))
        
        print("   Available architecture docs:")
        for i, file_path in enumerate(arch_files):
            print(f"   {i+1}. {file_path.name}")
        
        try:
            choice = int(input("   Choose file (number): ")) - 1
            if 0 <= choice < len(arch_files):
                target_file = arch_files[choice]
                
                # Append content with proper formatting
                with open(target_file, 'a') as f:
                    f.write(f"\\n\\n## Update from {item['branch_name']} ({item['branch_type']})\\n\\n")
                    f.write(content)
                
                print(f"   ✅ Added to {target_file.name}")
            else:
                print("   Invalid choice")
        except ValueError:
            print("   Invalid input")
    
    def _add_to_stack_specific(self, item: Dict[str, Any], content: str) -> None:
        """Add content to stack-specific instructions"""
        if item['branch_type'] == 'backend':
            target_file = self.project_root / "shared" / "backend" / "BACKEND_SPECIFIC.md"
        elif item['branch_type'] == 'frontend':
            target_file = self.project_root / "shared" / "frontend" / "FRONTEND_SPECIFIC.md"
        else:
            print(f"   Unknown branch type: {item['branch_type']}")
            return
        
        # Append content with proper formatting
        with open(target_file, 'a') as f:
            f.write(f"\\n\\n## Update from {item['branch_name']}\\n\\n")
            f.write(content)
        
        print(f"   ✅ Added to {target_file.name}")
    
    def _create_new_document(self, item: Dict[str, Any], content: str) -> None:
        """Create a new document in shared docs"""
        filename = input("   Enter filename (without .md extension): ")
        if not filename:
            print("   Cancelled")
            return
        
        target_file = self.shared_docs / f"{filename}.md"
        
        # Create new document
        with open(target_file, 'w') as f:
            f.write(f"# {filename.replace('_', ' ').title()}\\n\\n")
            f.write(f"*Created from {item['branch_name']} ({item['branch_type']})*\\n\\n")
            f.write(content)
        
        print(f"   ✅ Created {target_file.name}")
    
    def validate_documentation(self) -> None:
        """Validate documentation consistency"""
        print("🔍 Validating documentation consistency...")
        
        issues = []
        
        # Check for broken symlinks
        broken_symlinks = []
        for worktree_path in self.worktrees.rglob("*"):
            if worktree_path.is_symlink() and not worktree_path.exists():
                broken_symlinks.append(worktree_path)
        
        if broken_symlinks:
            issues.append(f"❌ Found {len(broken_symlinks)} broken symlinks")
            for link in broken_symlinks:
                issues.append(f"   {link}")
        
        # Check for required files
        required_files = [
            "shared/CLAUDE.md",
            "shared/docs/ROADMAP.md",
            "shared/docs/CURRENT_STATE.md",
            "shared/docs/folder_and_git_tree_structure.md"
        ]
        
        for req_file in required_files:
            file_path = self.project_root / req_file
            if not file_path.exists():
                issues.append(f"❌ Missing required file: {req_file}")
        
        # Check for duplicate CLAUDE.md files
        claude_files = list(self.project_root.rglob("CLAUDE.md"))
        if len(claude_files) > 1:
            non_symlink_claude = [f for f in claude_files if not f.is_symlink()]
            if len(non_symlink_claude) > 1:
                issues.append(f"❌ Found {len(non_symlink_claude)} non-symlink CLAUDE.md files")
                for file in non_symlink_claude:
                    issues.append(f"   {file}")
        
        if issues:
            print(f"\\n❌ Found {len(issues)} issues:")
            for issue in issues:
                print(issue)
        else:
            print("✅ Documentation structure is valid")
    
    def show_structure(self) -> None:
        """Show current shared documentation structure"""
        print("📁 Current shared documentation structure:")
        print()
        
        def print_tree(path: Path, prefix: str = "", max_depth: int = 3, current_depth: int = 0):
            if current_depth >= max_depth:
                return
                
            items = sorted(path.iterdir(), key=lambda x: (x.is_file(), x.name))
            for i, item in enumerate(items):
                is_last = i == len(items) - 1
                current_prefix = "└── " if is_last else "├── "
                print(f"{prefix}{current_prefix}{item.name}")
                
                if item.is_dir() and not item.is_symlink():
                    next_prefix = prefix + ("    " if is_last else "│   ")
                    print_tree(item, next_prefix, max_depth, current_depth + 1)
        
        print_tree(self.project_root / "shared")

def main():
    parser = argparse.ArgumentParser(description="Documentation Sync Workflow")
    parser.add_argument("--check", action="store_true", help="Check for items ready for consolidation")
    parser.add_argument("--consolidate", action="store_true", help="Interactive consolidation process")
    parser.add_argument("--validate", action="store_true", help="Validate documentation consistency")
    parser.add_argument("--structure", action="store_true", help="Show current structure")
    
    args = parser.parse_args()
    
    if not any(vars(args).values()):
        parser.print_help()
        return
    
    syncer = DocumentationSyncer()
    
    if args.check:
        syncer.check_consolidation_status()
    
    if args.consolidate:
        syncer.consolidate_documentation()
    
    if args.validate:
        syncer.validate_documentation()
    
    if args.structure:
        syncer.show_structure()

if __name__ == "__main__":
    main()