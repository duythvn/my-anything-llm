#!/bin/bash

# AnythingLLM Backend Shared node_modules Setup Script
# This script creates a shared node_modules directory and symlinks it to all backend worktrees
# to avoid running npm install in each branch

set -e

BACKEND_DIR="/home/duyth/projects/anythingllm/worktrees/backend"
SHARED_NODE_MODULES="$BACKEND_DIR/shared_node_modules"

echo "🔧 Setting up shared node_modules for AnythingLLM backend worktrees..."

# Create shared node_modules directory if it doesn't exist
if [ ! -d "$SHARED_NODE_MODULES" ]; then
    echo "📁 Creating shared node_modules directory: $SHARED_NODE_MODULES"
    mkdir -p "$SHARED_NODE_MODULES"
fi

# Function to setup symlink for a backend worktree
setup_worktree_symlink() {
    local worktree_path="$1"
    local worktree_name=$(basename "$worktree_path")
    
    echo "🔗 Setting up symlink for $worktree_name..."
    
    cd "$worktree_path"
    
    # Remove existing node_modules if it exists (backup first if it's a real directory)
    if [ -d "node_modules" ] && [ ! -L "node_modules" ]; then
        echo "   📦 Backing up existing node_modules to node_modules.backup"
        mv node_modules node_modules.backup
    elif [ -L "node_modules" ]; then
        echo "   🗑️  Removing existing symlink"
        rm node_modules
    fi
    
    # Create symlink to shared node_modules
    echo "   🔗 Creating symlink: node_modules -> $SHARED_NODE_MODULES"
    ln -sf "$SHARED_NODE_MODULES" node_modules
    
    echo "   ✅ $worktree_name symlink complete"
}

# Find all backend worktree directories
echo "🔍 Finding backend worktree directories..."
for dir in "$BACKEND_DIR"/backend_*; do
    if [ -d "$dir" ] && [ -f "$dir/package.json" ]; then
        setup_worktree_symlink "$dir"
    fi
done

# Also setup for backend_main if it exists
if [ -d "$BACKEND_DIR/backend_main" ] && [ -f "$BACKEND_DIR/backend_main/package.json" ]; then
    setup_worktree_symlink "$BACKEND_DIR/backend_main"
fi

echo ""
# Install dependencies if shared directory is empty
if [ "$(ls -A "$SHARED_NODE_MODULES" 2>/dev/null | wc -l)" -eq 0 ]; then
    echo "🚀 Installing dependencies in shared location..."
    
    # Find a worktree with package.json to use as reference
    REFERENCE_WORKTREE=""
    for dir in "$BACKEND_DIR/backend_main" "$BACKEND_DIR"/backend_*; do
        if [ -d "$dir" ] && [ -f "$dir/package.json" ]; then
            REFERENCE_WORKTREE="$dir"
            break
        fi
    done
    
    if [ -n "$REFERENCE_WORKTREE" ]; then
        echo "📦 Using $(basename $REFERENCE_WORKTREE) as reference for npm install..."
        
        # Temporarily remove symlink and install normally, then move to shared location
        cd "$REFERENCE_WORKTREE"
        if [ -L "node_modules" ]; then
            rm node_modules
        fi
        
        echo "📁 Installing dependencies..."
        npm install
        
        echo "📁 Moving node_modules to shared location..."
        mv node_modules "$SHARED_NODE_MODULES/"
        
        # Recreate the symlink
        ln -sf "$SHARED_NODE_MODULES" node_modules
        
    else
        echo "⚠️  No package.json found in any worktree."
        echo "   After running this script, cd to a worktree and run 'npm install' to populate the shared modules."
    fi
else
    echo "📦 Shared node_modules already populated, skipping installation."
fi

echo ""
echo "✅ Shared node_modules setup complete!"
echo ""
echo "📋 Summary:"
echo "   • Shared node_modules location: $SHARED_NODE_MODULES"
echo "   • All backend worktrees now use the shared node_modules via symlinks"
echo "   • To install new packages: cd to any worktree and run 'npm install package-name'"
echo "   • The package will be installed in the shared location and available to all worktrees"
echo ""
echo "🔄 To setup new worktrees in the future, just run this script again."
echo ""
echo "💡 Usage tips:"
echo "   • All worktrees share the same dependencies"
echo "   • Package-lock.json files in each worktree should be kept in sync"
echo "   • If you need different versions of packages for different branches, use separate node_modules"