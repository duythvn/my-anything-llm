# Frontend Development Guide

## Quick Reference

For project-wide context and guidelines, see `/shared/CLAUDE.md`

## Frontend-Specific Setup

### Prerequisites
- Node.js 18+
- npm (latest version recommended)
- Modern browser for development

### Frontend Setup
```bash
cd worktrees/frontend/frontend_framework_first

# Install dependencies
npm install  # or yarn install

# Set up environment variables
cp .env.example .env  # Add your API keys

# Start development server
npm run dev  # or yarn dev
```

### Project Structure

```
frontend_main/
├── src/
│   ├── components/          # Reusable UI components
│   ├── pages/              # Page components
│   ├── services/           # API services
│   ├── utils/              # Utility functions
│   ├── styles/             # CSS/styling files
│   ├── types/              # TypeScript type definitions
│   └── App.tsx             # Main application component
├── public/                 # Static assets
├── tests/                  # Test files
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
└── README.md               # Frontend-specific documentation
```

## Development Workflow

### 1. Feature Development
```bash
# Create feature branch
git worktree add worktrees/frontend/frontend_feature -b frontend_feature

# Navigate to branch
cd worktrees/frontend/frontend_feature

# Install dependencies
npm install

# Start development
npm run dev

# Test your changes
claude  # Then use /testgo command
```

### 2. Testing
```bash
# Run tests with Claude Commands
claude
/testgo

# Manual testing
npm test
npm run test:watch
npm run test:coverage
```

### 3. Building
```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Key Technologies

### [FRAMEWORK] (e.g., React, Vue, Angular)
- **Purpose**: Frontend framework
- **Docs**: [FRAMEWORK_DOCS_URL]
- **Key Files**: `src/App.tsx`, `src/components/`

### [BUILD_TOOL] (e.g., Vite, Webpack)
- **Purpose**: Build tool and dev server
- **Config**: `vite.config.ts` or `webpack.config.js`
- **Commands**: `npm run dev`, `npm run build`

### [STYLING] (e.g., Tailwind CSS, Styled Components)
- **Purpose**: Styling solution
- **Config**: `tailwind.config.js` or similar
- **Files**: `src/styles/`

### [STATE_MANAGEMENT] (e.g., Redux, Zustand, Context)
- **Purpose**: State management
- **Files**: `src/store/` or `src/context/`

## Common Commands

### Development
```bash
# Start development server
npm run dev

# Start with specific port
npm run dev -- --port 3001

# Build for production
npm run build

# Preview production build
npm run preview
```

### Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test
npm test -- ComponentName
```

### Code Quality
```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Type check
npm run type-check
```

## Environment Variables

```bash
# API Configuration
VITE_API_URL=http://localhost:8000
VITE_API_KEY=your_api_key_here

# External Services
VITE_SERVICE_1_URL=https://service1.example.com
VITE_SERVICE_2_KEY=your_service_key

# Development
VITE_DEBUG=true
VITE_ENVIRONMENT=development
```

## Component Development

### Component Structure
```typescript
// src/components/ExampleComponent.tsx
import React from 'react';
import './ExampleComponent.css';

interface ExampleComponentProps {
  title: string;
  onAction: () => void;
}

export const ExampleComponent: React.FC<ExampleComponentProps> = ({
  title,
  onAction
}) => {
  return (
    <div className="example-component">
      <h2>{title}</h2>
      <button onClick={onAction}>
        Action
      </button>
    </div>
  );
};

export default ExampleComponent;
```

### Best Practices

1. **Component Design**
   - Keep components small and focused
   - Use TypeScript for type safety
   - Follow naming conventions
   - Write reusable components

2. **State Management**
   - Use local state for component-specific data
   - Use global state for shared data
   - Minimize state complexity

3. **Performance**
   - Use React.memo for expensive components
   - Implement proper key props in lists
   - Optimize re-renders
   - Use code splitting for large apps

## API Integration

### Service Layer
```typescript
// src/services/api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL;

export class ApiService {
  static async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    return response.json();
  }

  static async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return response.json();
  }
}
```

## Troubleshooting

### Common Issues

1. **Build Errors**
   - Check TypeScript errors: `npm run type-check`
   - Verify all imports are correct
   - Ensure all dependencies are installed

2. **Runtime Errors**
   - Check browser console for errors
   - Verify API endpoints are correct
   - Check environment variables

3. **Styling Issues**
   - Verify CSS imports
   - Check for conflicting styles
   - Ensure styling framework is properly configured

### Debug Mode
```bash
# Enable debug mode
export VITE_DEBUG=true

# Run with verbose output
npm run dev -- --debug
```

## Testing Strategy

### Unit Tests
```typescript
// src/components/__tests__/ExampleComponent.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import ExampleComponent from '../ExampleComponent';

describe('ExampleComponent', () => {
  test('renders title correctly', () => {
    render(<ExampleComponent title="Test" onAction={() => {}} />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  test('calls onAction when button is clicked', () => {
    const mockAction = jest.fn();
    render(<ExampleComponent title="Test" onAction={mockAction} />);
    
    fireEvent.click(screen.getByText('Action'));
    expect(mockAction).toHaveBeenCalled();
  });
});
```

### Integration Tests
- Test component interactions
- Test API integration
- Test user workflows

## Resources

- **Framework Documentation**: [FRAMEWORK_DOCS]
- **Build Tool Documentation**: [BUILD_TOOL_DOCS]
- **Styling Documentation**: [STYLING_DOCS]
- **Testing Documentation**: [TESTING_DOCS]
- **Project Documentation**: `../docs/`