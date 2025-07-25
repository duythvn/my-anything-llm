#!/bin/bash
# Verify Worktree Structure - Check if worktree was created correctly
# Usage: ./verify-worktree-structure.sh

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Verifying Worktree Structure"
echo "================================"

# Get current directory name to determine branch type
CURRENT_DIR=$(basename "$(pwd)")
echo "Current directory: $CURRENT_DIR"

# Determine if this is backend or frontend
if [[ $CURRENT_DIR == backend_* ]]; then
    BRANCH_TYPE="backend"
elif [[ $CURRENT_DIR == frontend_* ]]; then
    BRANCH_TYPE="frontend"
else
    echo -e "${YELLOW}⚠️  Warning: Cannot determine branch type from directory name${NC}"
    echo "Expected format: backend_v04_s3 or frontend_v04_s3"
    exit 1
fi

echo "Detected branch type: $BRANCH_TYPE"
echo ""

# Check backend structure
if [ "$BRANCH_TYPE" = "backend" ]; then
    echo "🔍 Checking Backend Structure"
    echo "-----------------------------"
    
    # Check for required directories/files
    REQUIRED_ITEMS=("app" "main.py" "requirements.txt" "tests")
    FORBIDDEN_ITEMS=("shared" "worktrees")
    
    ALL_CORRECT=true
    
    echo "✅ Required items:"
    for item in "${REQUIRED_ITEMS[@]}"; do
        if [ -e "$item" ]; then
            echo "  ✅ $item - Found"
        else
            echo -e "  ${RED}❌ $item - Missing${NC}"
            ALL_CORRECT=false
        fi
    done
    
    echo ""
    echo "❌ Forbidden items (should NOT exist as real directories):"
    for item in "${FORBIDDEN_ITEMS[@]}"; do
        if [ -d "$item" ] && [ ! -L "$item" ]; then
            # Real directory found - this is wrong
            echo -e "  ${RED}❌ $item - Found as real directory (WRONG!)${NC}"
            ALL_CORRECT=false
        elif [ -L "$item" ]; then
            # Symlink found - this is correct
            echo "  ✅ $item - Found as symlink (correct)"
        else
            # Not found at all - also correct
            echo "  ✅ $item - Not found (correct)"
        fi
    done
    
# Check frontend structure  
elif [ "$BRANCH_TYPE" = "frontend" ]; then
    echo "🔍 Checking Frontend Structure"
    echo "------------------------------"
    
    # Check for required directories/files
    REQUIRED_ITEMS=("src" "package.json" "index.html")
    FORBIDDEN_ITEMS=("shared" "worktrees")
    
    ALL_CORRECT=true
    
    echo "✅ Required items:"
    for item in "${REQUIRED_ITEMS[@]}"; do
        if [ -e "$item" ]; then
            echo "  ✅ $item - Found"
        else
            echo -e "  ${RED}❌ $item - Missing${NC}"
            ALL_CORRECT=false
        fi
    done
    
    echo ""
    echo "❌ Forbidden items (should NOT exist as real directories):"
    for item in "${FORBIDDEN_ITEMS[@]}"; do
        if [ -d "$item" ] && [ ! -L "$item" ]; then
            # Real directory found - this is wrong
            echo -e "  ${RED}❌ $item - Found as real directory (WRONG!)${NC}"
            ALL_CORRECT=false
        elif [ -L "$item" ]; then
            # Symlink found - this is correct
            echo "  ✅ $item - Found as symlink (correct)"
        else
            # Not found at all - also correct
            echo "  ✅ $item - Not found (correct)"
        fi
    done
fi

echo ""
echo "🎯 Final Result"
echo "==============="

if [ "$ALL_CORRECT" = true ]; then
    echo -e "${GREEN}✅ SUCCESS: Worktree structure is CORRECT!${NC}"
    echo "You can proceed with development."
else
    echo -e "${RED}❌ FAILURE: Worktree structure is INCORRECT!${NC}"
    echo ""
    echo "🔧 How to fix:"
    echo "1. Remove this worktree:"
    echo "   cd /home/duyth/projects/agentic_system"
    echo "   git worktree remove worktrees/$BRANCH_TYPE/$CURRENT_DIR"
    echo "   git branch -D $CURRENT_DIR"
    echo ""
    echo "2. Create correctly from the right source branch:"
    if [ "$BRANCH_TYPE" = "backend" ]; then
        echo "   git worktree add worktrees/backend/$CURRENT_DIR -b $CURRENT_DIR backend_framework_first"
    else
        echo "   git worktree add worktrees/frontend/$CURRENT_DIR -b $CURRENT_DIR frontend_framework_first"
    fi
    echo ""
    echo "3. Run this script again to verify"
fi