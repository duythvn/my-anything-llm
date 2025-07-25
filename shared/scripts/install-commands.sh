#!/bin/bash
# Install Claude Documentation Commands in all worktrees
# Creates symlinks to make commands available from any worktree directory

PROJECT_ROOT="/home/duyth/projects/agentic_system"
SHARED_SCRIPTS="$PROJECT_ROOT/shared/scripts"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "${BLUE}📋 Installing Claude Documentation Commands${NC}"
    echo "=========================================="
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

print_header

# List of commands to install
commands=(
    "claude-doc-start"
)

# Find all worktree directories (excluding test_plans subdirectories)
worktree_dirs=$(find "$PROJECT_ROOT/worktrees" -maxdepth 2 -type d \( -name "backend_*" -o -name "frontend_*" \) ! -path "*/test_plans/*")

installed_count=0
total_dirs=0

for worktree_dir in $worktree_dirs; do
    if [ -d "$worktree_dir" ]; then
        total_dirs=$((total_dirs + 1))
        branch_name=$(basename "$worktree_dir")
        
        echo ""
        print_info "Installing commands in: $branch_name"
        
        # Create bin directory in worktree
        bin_dir="$worktree_dir/bin"
        mkdir -p "$bin_dir"
        
        # Create test_plans directory and its shared_test_plans symlink
        test_plans_dir="$worktree_dir/test_plans"
        mkdir -p "$test_plans_dir"
        
        test_plans_link="$test_plans_dir/shared_test_plans"
        test_plans_target="$PROJECT_ROOT/shared/test_plans"
        relative_test_plans_path=$(realpath --relative-to="$test_plans_dir" "$test_plans_target")
        
        # Remove existing symlink and create new one
        [ -L "$test_plans_link" ] && rm "$test_plans_link"
        ln -s "$relative_test_plans_path" "$test_plans_link"
        
        # Create additional necessary symlinks
        # CLAUDE.md symlink
        claude_link="$worktree_dir/CLAUDE.md"
        claude_target="$PROJECT_ROOT/shared/CLAUDE.md"
        relative_claude_path=$(realpath --relative-to="$worktree_dir" "$claude_target")
        [ -L "$claude_link" ] && rm "$claude_link"
        ln -s "$relative_claude_path" "$claude_link"
        
        # Create venv symlink for backend branches
        if [[ $branch_name == backend_* ]]; then
            venv_link="$worktree_dir/venv"
            venv_target="$PROJECT_ROOT/worktrees/backend/venv"
            if [ -d "$venv_target" ]; then
                relative_venv_path=$(realpath --relative-to="$worktree_dir" "$venv_target")
                [ -L "$venv_link" ] && rm "$venv_link"
                ln -s "$relative_venv_path" "$venv_link"
            fi
        fi
        
        # docs_shared symlink
        docs_shared_link="$worktree_dir/docs_shared"
        docs_shared_target="$PROJECT_ROOT/shared/docs"
        relative_docs_shared_path=$(realpath --relative-to="$worktree_dir" "$docs_shared_target")
        [ -L "$docs_shared_link" ] && rm "$docs_shared_link"
        ln -s "$relative_docs_shared_path" "$docs_shared_link"
        
        # refs_shared symlink
        refs_shared_link="$worktree_dir/refs_shared"
        refs_shared_target="$PROJECT_ROOT/shared/refs"
        relative_refs_shared_path=$(realpath --relative-to="$worktree_dir" "$refs_shared_target")
        [ -L "$refs_shared_link" ] && rm "$refs_shared_link"
        ln -s "$relative_refs_shared_path" "$refs_shared_link"
        
        # Create .claude/commands symlink
        claude_dir="$worktree_dir/.claude"
        mkdir -p "$claude_dir"
        claude_commands_link="$claude_dir/commands"
        claude_commands_target="$PROJECT_ROOT/.claude/commands"
        relative_claude_commands_path=$(realpath --relative-to="$claude_dir" "$claude_commands_target")
        [ -L "$claude_commands_link" ] && rm "$claude_commands_link"
        ln -s "$relative_claude_commands_path" "$claude_commands_link"
        
        relative_path=$(realpath --relative-to="$bin_dir" "$SHARED_SCRIPTS")
        
        commands_installed=0
        
        for cmd in "${commands[@]}"; do
            source_cmd="$SHARED_SCRIPTS/$cmd"
            target_cmd="$bin_dir/$cmd"
            
            if [ -f "$source_cmd" ]; then
                # Remove existing symlink or file
                [ -L "$target_cmd" ] && rm "$target_cmd"
                [ -f "$target_cmd" ] && rm "$target_cmd"
                
                # Create relative symlink
                ln -s "$relative_path/$cmd" "$target_cmd"
                commands_installed=$((commands_installed + 1))
            fi
        done
        
        if [ $commands_installed -eq ${#commands[@]} ]; then
            if [[ $branch_name == backend_* ]]; then
                print_success "Installed $commands_installed commands + 6 symlinks (test_plans/shared_test_plans, CLAUDE.md, docs_shared, refs_shared, venv, .claude/commands) in $branch_name"
            else
                print_success "Installed $commands_installed commands + 5 symlinks (test_plans/shared_test_plans, CLAUDE.md, docs_shared, refs_shared, .claude/commands) in $branch_name"
            fi
            installed_count=$((installed_count + 1))
        else
            print_warning "Only installed $commands_installed/${#commands[@]} commands in $branch_name"
        fi
    fi
done

echo ""
echo "=============================================="
print_success "Installation Summary"
echo "• Worktree directories processed: $total_dirs"
echo "• Successfully installed in: $installed_count directories"
echo "• Commands per directory: ${#commands[@]}"

echo ""
print_info "Usage Instructions:"
echo "1. From any worktree directory, run: ./bin/claude-doc-[command]"
echo "2. For devgo/testgo/checkpoint: Run 'claude' then use /devgo, /testgo, or /checkpoint commands"
echo "3. Or add ./bin to your PATH for direct access to documentation commands"
echo "4. Access shared test plans via: ./test_plans/shared_test_plans/"
echo "5. Access shared documentation via: ./docs_shared/ and ./refs_shared/"
echo "6. Project instructions available at: ./CLAUDE.md"
echo "7. Claude commands available at: ./.claude/commands/ (devgo.md, testgo.md, checkpoint.md)"
echo ""
print_info "Backend Development Setup:"
echo "• Virtual environment available at: ./venv/ (symlinked to shared venv)"
echo "• ALWAYS activate before Python operations: source venv/bin/activate"
echo "• Then run: python main.py, pytest tests/, pip install, etc."
echo ""
echo "Quick setup for PATH (run from worktree directory):"
echo "   export PATH=\"\$(pwd)/bin:\$PATH\""
echo ""

print_info "Available commands:"
for cmd in "${commands[@]}"; do
    echo "   $cmd"
done

echo ""
print_success "Installation complete!"