# Backend Development Guide

## Quick Reference

For project-wide context and guidelines, see `/shared/CLAUDE.md`

## Backend-Specific Setup

### Prerequisites
- Python 3.12+
- PostgreSQL (or SQLite for development)
- Redis (for caching and message queues)
- LLM API Keys (OpenAI/Anthropic for AI features)

### Backend Setup
```bash
cd worktrees/backend/backend_framework_first

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env  # Add your API keys

# Run database migrations
alembic upgrade head

# Install LangGraph and framework dependencies
pip install langgraph langchain langsmith

# Start development server
python main.py
```

### Project Structure

```
backend_main/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application
│   ├── models/              # Database models
│   ├── api/                 # API endpoints
│   ├── services/            # Business logic
│   ├── core/                # Core functionality
│   └── utils/               # Utilities
├── tests/                   # Test files
├── requirements.txt         # Python dependencies
├── .env.example            # Environment variables template
└── README.md               # Backend-specific documentation
```

## Development Workflow

### 1. Feature Development
```bash
# Create feature branch
git worktree add worktrees/backend/backend_feature -b backend_feature

# Navigate to branch
cd worktrees/backend/backend_feature

# Install dependencies (uses shared venv)
source venv/bin/activate

# Start development
python main.py

# Test your changes
claude  # Then use /testgo command
```

### 2. Testing
```bash
# Run tests with Claude Commands
claude
/testgo

# Manual testing
pytest tests/
python -m pytest tests/specific_test.py
```

### 3. Database Operations
```bash
# Create migration
[MIGRATION_CREATE_COMMAND]

# Apply migrations
[MIGRATION_APPLY_COMMAND]

# Rollback migration
[MIGRATION_ROLLBACK_COMMAND]
```

## Key Technologies

### [FRAMEWORK] (e.g., FastAPI, Django)
- **Purpose**: Web framework
- **Docs**: [FRAMEWORK_DOCS_URL]
- **Key Files**: `app/main.py`, `app/api/`

### [DATABASE] (e.g., PostgreSQL, MySQL)
- **Purpose**: Primary database
- **Connection**: Via `DATABASE_URL` environment variable
- **Models**: `app/models/`

### [ORM] (e.g., SQLAlchemy, Django ORM)
- **Purpose**: Database ORM
- **Migration Tool**: [MIGRATION_TOOL]
- **Config**: `app/core/database.py`

## Common Commands

### Development
```bash
# Start development server
python main.py

# Run with auto-reload
[DEV_COMMAND]  # e.g., uvicorn main:app --reload

# Check code quality
[LINT_COMMAND]  # e.g., flake8, black

# Format code
[FORMAT_COMMAND]  # e.g., black .
```

### Testing
```bash
# Run all tests
pytest

# Run specific test file
pytest tests/test_specific.py

# Run with coverage
pytest --cov=app tests/
```

### Database
```bash
# Create database
[CREATE_DB_COMMAND]

# Seed database
python scripts/seed_data.py

# Backup database
[BACKUP_COMMAND]
```

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost/dbname

# Cache
REDIS_URL=redis://localhost:6379

# API Keys
API_KEY_1=your_api_key_here
API_KEY_2=your_api_key_here

# Development
DEBUG=True
ENVIRONMENT=development
```

## Troubleshooting

### Common Issues

1. **Import Errors**
   - Ensure virtual environment is activated
   - Check if dependencies are installed: `pip install -r requirements.txt`

2. **Database Connection Issues**
   - Verify `DATABASE_URL` in `.env`
   - Ensure database server is running
   - Check database credentials

3. **Migration Issues**
   - Check migration files for conflicts
   - Verify database schema matches models
   - Try rolling back and reapplying migrations

### Debug Mode
```bash
# Enable debug logging
export DEBUG=True

# Run with verbose output
python main.py --debug
```

## Best Practices

1. **Code Organization**
   - Keep business logic in `services/`
   - Use models for data structure
   - Separate API logic from business logic

2. **Testing**
   - Write tests for all new features
   - Use fixtures for test data
   - Test both success and error cases

3. **Documentation**
   - Update API documentation
   - Document complex business logic
   - Keep README updated

4. **Security**
   - Never commit API keys
   - Use environment variables for secrets
   - Validate all inputs
   - Use proper authentication

## Resources

- **Framework Documentation**: [FRAMEWORK_DOCS]
- **Database Documentation**: [DB_DOCS]
- **API Documentation**: [API_DOCS_URL]
- **Project Documentation**: `../docs/`