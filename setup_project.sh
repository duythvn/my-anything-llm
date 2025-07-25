#!/bin/bash
# Project Setup Script for Git Worktree Structure

PROJECT_ROOT="$(pwd)"
SHARED_SCRIPTS="$PROJECT_ROOT/shared/scripts"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

print_header() {
    echo -e "${BLUE}🚀 Setting Up Git Worktree Project Structure${NC}"
    echo "================================================"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    print_error "Not a git repository. Please run 'git init' first."
    exit 1
fi

print_info "Project root: $PROJECT_ROOT"

# Create worktree directories if they don't exist
print_info "Setting up worktree structure..."

# Backend worktree setup
if [ ! -d "worktrees/backend" ]; then
    mkdir -p worktrees/backend
    print_success "Created worktrees/backend directory"
fi

# Frontend worktree setup
if [ ! -d "worktrees/frontend" ]; then
    mkdir -p worktrees/frontend
    print_success "Created worktrees/frontend directory"
fi

# Function to create worktree branch
create_worktree() {
    local branch_path=$1
    local branch_name=$2
    local base_branch=${3:-main}
    
    if [ ! -d "$branch_path" ]; then
        print_info "Creating worktree: $branch_name"
        git worktree add "$branch_path" -b "$branch_name" "$base_branch" 2>/dev/null || {
            # If branch already exists, just add the worktree
            git worktree add "$branch_path" "$branch_name" 2>/dev/null || {
                print_warning "Could not create worktree for $branch_name (branch may already exist)"
                return 1
            }
        }
        print_success "Created worktree: $branch_path"
        return 0
    else
        print_warning "Worktree already exists: $branch_path"
        return 1
    fi
}

# Create main backend and frontend branches
create_worktree "worktrees/backend/backend_main" "backend_main"
create_worktree "worktrees/frontend/frontend_main" "frontend_main"

# Function to setup symlinks for a worktree
setup_worktree_symlinks() {
    local worktree_dir=$1
    local stack_type=$2  # 'backend' or 'frontend'
    
    if [ ! -d "$worktree_dir" ]; then
        print_warning "Worktree directory doesn't exist: $worktree_dir"
        return 1
    fi
    
    cd "$worktree_dir"
    
    print_info "Setting up symlinks for: $(basename $worktree_dir)"
    
    # Create bin directory
    mkdir -p bin
    
    # Create symlinks for documentation scripts
    commands=(
        "claude-doc-start"
    )
    
    # Calculate relative path to shared scripts
    relative_path=$(realpath --relative-to="$worktree_dir/bin" "$SHARED_SCRIPTS")
    
    for cmd in "${commands[@]}"; do
        if [ -f "$SHARED_SCRIPTS/$cmd" ]; then
            ln -sf "$relative_path/$cmd" "bin/$cmd"
        fi
    done
    
    # Create shared resource symlinks
    ln -sf "$(realpath --relative-to="$worktree_dir" "$PROJECT_ROOT/shared/CLAUDE.md")" CLAUDE.md
    ln -sf "$(realpath --relative-to="$worktree_dir" "$PROJECT_ROOT/shared/docs")" docs_shared
    ln -sf "$(realpath --relative-to="$worktree_dir" "$PROJECT_ROOT/shared/refs")" refs_shared
    
    # Stack-specific symlinks
    if [ "$stack_type" = "backend" ]; then
        ln -sf "$(realpath --relative-to="$worktree_dir" "$PROJECT_ROOT/shared/backend/BACKEND_SPECIFIC.md")" BACKEND_SPECIFIC.md
        
        # Create shared venv symlink if shared venv exists
        if [ -d "../venv" ]; then
            ln -sf "../venv" venv
        fi
    elif [ "$stack_type" = "frontend" ]; then
        ln -sf "$(realpath --relative-to="$worktree_dir" "$PROJECT_ROOT/shared/frontend/FRONTEND_SPECIFIC.md")" FRONTEND_SPECIFIC.md
    fi
    
    # Claude commands setup
    mkdir -p .claude/commands
    
    # Copy Claude command files
    claude_commands=(
        "devgo.md"
        "testgo.md" 
        "checkpoint.md"
    )
    
    for cmd_file in "${claude_commands[@]}"; do
        if [ -f "$PROJECT_ROOT/.claude/commands/$cmd_file" ]; then
            cp "$PROJECT_ROOT/.claude/commands/$cmd_file" ".claude/commands/"
        fi
    done
    
    # Test plans symlink
    mkdir -p test_plans
    ln -sf "$(realpath --relative-to="$worktree_dir/test_plans" "$PROJECT_ROOT/shared/test_plans")" test_plans/shared_test_plans
    
    print_success "Symlinks created for: $(basename $worktree_dir)"
    cd "$PROJECT_ROOT"
}

# Setup symlinks for existing worktrees
for backend_dir in worktrees/backend/*/; do
    if [ -d "$backend_dir" ]; then
        setup_worktree_symlinks "$backend_dir" "backend"
    fi
done

for frontend_dir in worktrees/frontend/*/; do
    if [ -d "$frontend_dir" ]; then
        setup_worktree_symlinks "$frontend_dir" "frontend"
    fi
done

# Copy sample files if worktrees were just created
if [ -d "sample_files/backend_template" ] && [ -d "worktrees/backend/backend_main" ]; then
    if [ ! -f "worktrees/backend/backend_main/main.py" ]; then
        print_info "Copying backend template files..."
        cp -r sample_files/backend_template/* worktrees/backend/backend_main/
        print_success "Backend template files copied"
    fi
fi

if [ -d "sample_files/frontend_template" ] && [ -d "worktrees/frontend/frontend_main" ]; then
    if [ ! -f "worktrees/frontend/frontend_main/package.json" ]; then
        print_info "Copying frontend template files..."
        cp -r sample_files/frontend_template/* worktrees/frontend/frontend_main/
        print_success "Frontend template files copied"
    fi
fi

print_success "Project setup complete!"
echo ""
print_info "Next steps:"
echo "1. Customize shared/CLAUDE.md with your project details"
echo "2. Update shared/backend/BACKEND_SPECIFIC.md and shared/frontend/FRONTEND_SPECIFIC.md"
echo "3. Navigate to a worktree directory and start developing:"
echo "   cd worktrees/backend/backend_main"
echo "   ./bin/claude-doc-start"
echo "4. Use Claude commands for testing: claude -> /devgo or /testgo"
echo ""
print_info "Available worktrees:"
git worktree list 2>/dev/null || echo "Run 'git worktree list' to see all worktrees"