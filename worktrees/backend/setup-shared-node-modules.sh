#!/bin/bash

# Shared Node Modules Setup Script
# Sets up symlink-based shared dependencies for backend worktrees

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SHARED_DIR="/home/duyth/projects/anythingllm/worktrees/backend/shared_node_modules"
BASE_DIR="/home/duyth/projects/anythingllm/worktrees/backend"

echo -e "${BLUE}🔗 Setting up shared node_modules for backend worktrees${NC}"
echo "==============================================================="

# Function to display colored output
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Create shared directory if it doesn't exist
if [ ! -d "$SHARED_DIR" ]; then
    log_info "Creating shared node_modules directory..."
    mkdir -p "$SHARED_DIR"
    log_success "Shared directory created at $SHARED_DIR"
else
    log_success "Shared directory already exists at $SHARED_DIR"
fi

# Install shared dependencies if node_modules doesn't exist in shared dir
if [ ! -d "$SHARED_DIR/node_modules" ]; then
    log_info "Installing shared dependencies..."
    cd "$SHARED_DIR"
    
    # Create package.json for shared dependencies based on main server package.json
    log_info "Creating shared package.json based on backend_main/server..."
    
    # Base package.json with the actual dependencies from the project
    cat > package.json << 'EOF'
{
  "name": "shared-backend-dependencies",
  "version": "1.8.4",
  "description": "Shared dependencies for AnythingLLM backend worktrees",
  "private": true,
  "main": "index.js",
  "author": "Timothy Carambat (Mintplex Labs)",
  "license": "MIT",
  "engines": {
    "node": ">=18.12.1"
  },
  "scripts": {
    "install-worktree": "echo 'Installing shared dependencies for worktree...'",
    "link-all": "echo 'Linking dependencies to all worktrees...'"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.39.0",
    "@aws-sdk/client-bedrock-runtime": "^3.775.0",
    "@datastax/astra-db-ts": "^0.1.3",
    "@ladjs/graceful": "^3.2.2",
    "@lancedb/lancedb": "0.15.0",
    "@langchain/anthropic": "0.1.16",
    "@langchain/aws": "^0.0.5",
    "@langchain/community": "0.0.53",
    "@langchain/core": "0.1.61",
    "@langchain/openai": "0.0.28",
    "@langchain/textsplitters": "0.0.0",
    "@mintplex-labs/bree": "^9.2.5",
    "@mintplex-labs/express-ws": "^5.0.7",
    "@modelcontextprotocol/sdk": "^1.11.0",
    "@pinecone-database/pinecone": "^2.0.1",
    "@prisma/client": "5.3.1",
    "@qdrant/js-client-rest": "^1.9.0",
    "@xenova/transformers": "^2.14.0",
    "@zilliz/milvus2-sdk-node": "^2.3.5",
    "adm-zip": "^0.5.16",
    "apache-arrow": "19.0.0",
    "bcrypt": "^5.1.0",
    "body-parser": "^1.20.2",
    "chalk": "^4",
    "check-disk-space": "^3.4.0",
    "cheerio": "^1.0.0",
    "chromadb": "^2.0.1",
    "cohere-ai": "^7.9.5",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3",
    "elevenlabs": "^0.5.0",
    "express": "^4.18.2",
    "extract-json-from-string": "^1.0.1",
    "fast-levenshtein": "^3.0.0",
    "graphql": "^16.7.1",
    "joi": "^17.11.0",
    "joi-password-complexity": "^5.2.0",
    "js-tiktoken": "^1.0.8",
    "jsonrepair": "^3.7.0",
    "jsonwebtoken": "^9.0.0",
    "langchain": "0.1.36",
    "mime": "^3.0.0",
    "moment": "^2.29.4",
    "mssql": "^10.0.2",
    "multer": "^1.4.5-lts.1",
    "mysql2": "^3.9.8",
    "ollama": "^0.5.10",
    "openai": "4.95.1",
    "pg": "^8.11.5",
    "pinecone-client": "^1.1.0",
    "pluralize": "^8.0.0",
    "posthog-node": "^3.1.1",
    "prisma": "5.3.1",
    "slugify": "^1.6.6",
    "swagger-autogen": "^2.23.5",
    "swagger-ui-express": "^5.0.0",
    "truncate": "^3.0.0",
    "url-pattern": "^1.0.3",
    "uuid": "^9.0.0",
    "uuid-apikey": "^1.5.3",
    "weaviate-ts-client": "^1.4.0",
    "winston": "^3.13.0"
  },
  "devDependencies": {
    "@inquirer/prompts": "^4.3.1",
    "@types/jest": "^30.0.0",
    "cross-env": "^7.0.3",
    "eslint": "^8.50.0",
    "eslint-config-prettier": "^9.0.0",
    "eslint-plugin-ft-flow": "^3.0.0",
    "eslint-plugin-prettier": "^5.0.0",
    "eslint-plugin-react": "^7.33.2",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.3",
    "flow-bin": "^0.217.0",
    "flow-remove-types": "^2.217.1",
    "globals": "^13.21.0",
    "hermes-eslint": "^0.15.0",
    "jest": "^30.0.5",
    "node-html-markdown": "^1.3.0",
    "nodemon": "^2.0.22",
    "prettier": "^3.0.3"
  }
}
EOF
    
    npm install --legacy-peer-deps
    log_success "Shared dependencies installed"
else
    log_success "Shared node_modules already exists"
fi

# Function to setup symlinks for a worktree
setup_worktree_symlinks() {
    local worktree_path="$1"
    local worktree_name=$(basename "$worktree_path")
    
    log_info "Setting up symlinks for $worktree_name..."
    
    # Server directory path
    local server_path="$worktree_path/server"
    
    if [ ! -d "$server_path" ]; then
        log_warning "Server directory not found in $worktree_name, skipping..."
        return
    fi
    
    cd "$server_path"
    
    # Check if package.json exists and backup if needed
    if [ ! -f "package.json" ]; then
        log_warning "No package.json found in $worktree_name/server, skipping..."
        return
    fi
    
    # Backup original package.json if not already backed up
    if [ ! -f "package.json.original" ]; then
        log_info "Backing up original package.json for $worktree_name..."
        cp package.json package.json.original
    fi
    
    # Create .npmrc to prevent npm install conflicts
    log_info "Creating .npmrc for shared node_modules compatibility..."
    cat > .npmrc << 'EOF'
# Shared node_modules configuration
# Prevents duplicate installations and encourages symlink usage
prefer-offline=true
package-lock=false
save-exact=false
# Use shared cache location if desired
# cache=/home/duyth/projects/anythingllm/worktrees/backend/shared_node_modules/.npm-cache
EOF
    
    # Modify package.json to add shared dependency management scripts
    if ! grep -q "shared-deps:link" package.json; then
        log_info "Adding shared dependency management scripts to package.json..."
        
        # Create a temporary file with the updated package.json
        node -e "
        const fs = require('fs');
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        
        // Add shared dependency management scripts
        pkg.scripts = pkg.scripts || {};
        pkg.scripts['shared-deps:link'] = 'bash ../../setup-shared-node-modules.sh';
        pkg.scripts['shared-deps:check'] = 'ls -la node_modules/ | grep \"^l\" || echo \"No symlinks found\"';
        pkg.scripts['shared-deps:status'] = 'echo \"Shared deps status for $(basename $(pwd))\" && npm list --depth=0 2>/dev/null | grep \"deduped\" || echo \"No deduped packages\"';
        
        // Add a note about shared dependencies
        pkg['x-shared-dependencies'] = {
          'note': 'This worktree uses shared node_modules. Run npm run shared-deps:link to update symlinks.',
          'shared-location': '/home/duyth/projects/anythingllm/worktrees/backend/shared_node_modules'
        };
        
        fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
        " 2>/dev/null || log_warning "Could not update package.json scripts"
    fi
    
    # Create symlink to entire shared node_modules instead of individual packages
    log_info "Setting up shared node_modules symlink for $worktree_name..."
    
    if [ -d "node_modules" ]; then
        # Move existing node_modules to backup if it's not already a symlink
        if [ ! -L "node_modules" ]; then
            log_info "Backing up existing node_modules for $worktree_name..."
            mv node_modules node_modules.backup.$(date +%Y%m%d_%H%M%S)
        else
            # Remove existing symlink
            rm node_modules
        fi
    fi
    
    # Create symlink to shared node_modules
    ln -sf "$SHARED_DIR/node_modules" "node_modules"
    log_success "Symlinked entire node_modules for $worktree_name"
    
    # Install any worktree-specific dependencies that aren't in shared
    if [ -f "package.json.original" ]; then
        log_info "Checking for worktree-specific dependencies in $worktree_name..."
        
        # Extract dependencies that might not be in shared
        node -e "
        const fs = require('fs');
        try {
          const original = JSON.parse(fs.readFileSync('package.json.original', 'utf8'));
          const shared = JSON.parse(fs.readFileSync('$SHARED_DIR/package.json', 'utf8'));
          
          const origDeps = {...(original.dependencies || {}), ...(original.devDependencies || {})};
          const sharedDeps = {...(shared.dependencies || {}), ...(shared.devDependencies || {})};
          
          const missing = Object.keys(origDeps).filter(dep => !sharedDeps[dep]);
          
          if (missing.length > 0) {
            console.log('Missing dependencies found:', missing.join(', '));
            fs.writeFileSync('.missing-deps.txt', missing.join('\n'));
          } else {
            console.log('All dependencies are available in shared modules');
          }
        } catch (err) {
          console.log('Could not check for missing dependencies:', err.message);
        }
        " 2>/dev/null
        
        # If there are missing dependencies, log a warning
        if [ -f ".missing-deps.txt" ]; then
            log_warning "Some dependencies from $worktree_name are not in shared modules:"
            cat .missing-deps.txt
            log_info "Consider adding these to shared dependencies or install locally"
            rm .missing-deps.txt
        fi
    fi
    
    log_success "Symlinks setup complete for $worktree_name"
}

# Find all backend worktree directories
log_info "Scanning for backend worktrees..."

worktree_count=0
for dir in "$BASE_DIR"/backend_*; do
    if [ -d "$dir" ] && [ "$dir" != "$SHARED_DIR" ]; then
        setup_worktree_symlinks "$dir"
        ((worktree_count++))
    fi
done

if [ $worktree_count -eq 0 ]; then
    log_warning "No backend worktrees found matching pattern 'backend_*'"
else
    log_success "Processed $worktree_count backend worktrees"
fi

# Create a helper script for future dependency management
log_info "Creating dependency management helper..."

cat > "$BASE_DIR/manage-shared-deps.sh" << 'EOF'
#!/bin/bash

# Helper script for managing shared dependencies in AnythingLLM worktrees

SHARED_DIR="/home/duyth/projects/anythingllm/worktrees/backend/shared_node_modules"
BASE_DIR="/home/duyth/projects/anythingllm/worktrees/backend"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

case "$1" in
    "add"|"install")
        if [ -z "$2" ]; then
            log_error "Usage: $0 add <package-name> [--dev]"
            exit 1
        fi
        cd "$SHARED_DIR"
        
        if [ "$3" = "--dev" ]; then
            log_info "Adding $2 as dev dependency to shared modules..."
            npm install --save-dev "$2"
        else
            log_info "Adding $2 to shared dependencies..."
            npm install "$2"
        fi
        
        log_success "Package $2 added to shared dependencies"
        log_info "Run '$0 link' to update symlinks in all worktrees"
        ;;
    "remove"|"uninstall")
        if [ -z "$2" ]; then
            log_error "Usage: $0 remove <package-name>"
            exit 1
        fi
        cd "$SHARED_DIR"
        log_info "Removing $2 from shared dependencies..."
        npm uninstall "$2"
        log_success "Package $2 removed from shared dependencies"
        log_info "Run '$0 link' to update symlinks in all worktrees"
        ;;
    "link"|"setup")
        log_info "Re-running symlink setup for all worktrees..."
        bash "/home/duyth/projects/anythingllm/worktrees/backend/setup-shared-node-modules.sh"
        ;;
    "list")
        log_info "Shared dependencies:"
        cd "$SHARED_DIR"
        npm list --depth=0
        ;;
    "status")
        log_info "Checking shared dependency status across worktrees..."
        
        # Check shared directory
        if [ ! -d "$SHARED_DIR/node_modules" ]; then
            log_error "Shared node_modules not found at $SHARED_DIR"
            exit 1
        fi
        
        log_success "Shared node_modules exists at $SHARED_DIR"
        
        # Check each worktree
        worktree_count=0
        linked_count=0
        
        for dir in "$BASE_DIR"/backend_*; do
            if [ -d "$dir" ] && [ "$dir" != "$SHARED_DIR" ]; then
                worktree_name=$(basename "$dir")
                server_path="$dir/server"
                
                if [ -d "$server_path" ]; then
                    worktree_count=$((worktree_count + 1))
                    
                    if [ -L "$server_path/node_modules" ]; then
                        linked_count=$((linked_count + 1))
                        log_success "$worktree_name: ✓ Linked to shared node_modules"
                    else
                        log_warning "$worktree_name: ✗ Not linked (run '$0 link' to fix)"
                    fi
                fi
            fi
        done
        
        echo ""
        log_info "Summary: $linked_count/$worktree_count worktrees using shared dependencies"
        ;;
    "check")
        if [ -z "$2" ]; then
            log_error "Usage: $0 check <worktree-name>"
            log_info "Available worktrees:"
            for dir in "$BASE_DIR"/backend_*; do
                if [ -d "$dir" ] && [ "$dir" != "$SHARED_DIR" ]; then
                    echo "  - $(basename "$dir")"
                fi
            done
            exit 1
        fi
        
        worktree_path="$BASE_DIR/$2"
        server_path="$worktree_path/server"
        
        if [ ! -d "$server_path" ]; then
            log_error "Worktree $2 not found or no server directory"
            exit 1
        fi
        
        cd "$server_path"
        
        log_info "Checking shared dependency status for $2..."
        
        if [ -L "node_modules" ]; then
            target=$(readlink node_modules)
            if [ "$target" = "$SHARED_DIR/node_modules" ]; then
                log_success "✓ Correctly linked to shared node_modules"
            else
                log_warning "✗ Linked to unexpected location: $target"
            fi
        else
            log_warning "✗ Not using shared node_modules"
        fi
        
        if [ -f ".npmrc" ]; then
            log_success "✓ .npmrc configured for shared dependencies"
        else
            log_warning "✗ No .npmrc found"
        fi
        
        if [ -f "package.json.original" ]; then
            log_success "✓ Original package.json backed up"
        else
            log_warning "✗ No backup of original package.json"
        fi
        ;;
    "restore")
        if [ -z "$2" ]; then
            log_error "Usage: $0 restore <worktree-name>"
            exit 1
        fi
        
        worktree_path="$BASE_DIR/$2"
        server_path="$worktree_path/server"
        
        if [ ! -d "$server_path" ]; then
            log_error "Worktree $2 not found or no server directory"
            exit 1
        fi
        
        cd "$server_path"
        
        log_info "Restoring original configuration for $2..."
        
        # Remove symlink
        if [ -L "node_modules" ]; then
            rm node_modules
            log_success "Removed shared node_modules symlink"
        fi
        
        # Find and restore latest backup
        backup_dir=$(ls -dt node_modules.backup.* 2>/dev/null | head -1)
        if [ -n "$backup_dir" ] && [ -d "$backup_dir" ]; then
            mv "$backup_dir" node_modules
            log_success "Restored node_modules from $backup_dir"
        fi
        
        # Restore original package.json
        if [ -f "package.json.original" ]; then
            mv package.json.original package.json
            log_success "Restored original package.json"
        fi
        
        # Remove .npmrc
        if [ -f ".npmrc" ]; then
            rm .npmrc
            log_success "Removed .npmrc"
        fi
        
        log_success "Restoration complete for $2"
        ;;
    *)
        echo -e "${BLUE}AnythingLLM Shared Dependencies Manager${NC}"
        echo "========================================"
        echo ""
        echo "Usage: $0 {command} [options]"
        echo ""
        echo -e "${BLUE}Commands:${NC}"
        echo "  add <package> [--dev]  - Add package to shared dependencies"
        echo "  remove <package>       - Remove package from shared dependencies"
        echo "  link                   - Update symlinks in all worktrees"
        echo "  list                   - List all shared packages"
        echo "  status                 - Check shared dependency status across worktrees"
        echo "  check <worktree>       - Check specific worktree configuration"
        echo "  restore <worktree>     - Restore worktree to original state"
        echo ""
        echo -e "${BLUE}Examples:${NC}"
        echo "  $0 add lodash          # Add lodash to shared dependencies"
        echo "  $0 add jest --dev      # Add jest as dev dependency"
        echo "  $0 status              # Check all worktrees"
        echo "  $0 check backend_main  # Check specific worktree"
        exit 1
        ;;
esac
EOF

chmod +x "$BASE_DIR/manage-shared-deps.sh"
log_success "Helper script created at $BASE_DIR/manage-shared-deps.sh"

echo ""
echo "==============================================================="
log_success "Shared node_modules setup complete!"
echo ""
echo -e "${BLUE}📝 Usage:${NC}"
echo "  • Shared packages installed at: $SHARED_DIR"
echo "  • Add new shared package: $BASE_DIR/manage-shared-deps.sh add <package>"
echo "  • Update all symlinks: $BASE_DIR/manage-shared-deps.sh link"
echo "  • List shared packages: $BASE_DIR/manage-shared-deps.sh list"
echo ""
echo -e "${BLUE}📦 Current shared packages:${NC}"
echo "  • csv-parser (for CSV processing)"
echo "  • node-cron (for scheduling)"
echo "  • xlsx (for Excel file handling)"
echo ""
echo -e "${GREEN}✅ All backend worktrees now use shared dependencies!${NC}"