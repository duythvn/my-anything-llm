# FT-003: Navigation & Dashboard

**Estimate**: 6 hours  
**Priority**: P0 Critical - Core Foundation  
**Dependencies**: FT-002  
**Phase**: Core Internal Testing

---

## Overview

Create the main app structure and navigation for the internal testing interface, providing easy access to all testing features through a central dashboard.

## Objectives

- Build main app layout and routing structure
- Create testing dashboard as central hub
- Setup navigation between testing features
- Ensure responsive design for all screen sizes

---

## Detailed Tasks

### Task 3.1: Main App Structure (1.5 hours)

**Subtasks:**
- [ ] Create simplified App.jsx with clean routing (30 min)
- [ ] Remove unnecessary routes from original (20 min)
- [ ] Setup basic route structure for testing features (25 min)
- [ ] Create main layout wrapper component (15 min)

### Task 3.2: Navigation Sidebar (1.5 hours)

**Subtasks:**
- [ ] Create navigation sidebar component (40 min)
- [ ] Add navigation items for core testing features (20 min)
- [ ] Implement active route highlighting (15 min)
- [ ] Add simple icons for navigation items (15 min)

### Task 3.3: Testing Dashboard (2 hours)

**Subtasks:**
- [ ] Create Dashboard page component (30 min)
- [ ] Design feature card component (30 min)
- [ ] Create cards for core testing areas:
  - [ ] Chat Testing card (15 min)
  - [ ] Document Upload card (15 min)
  - [ ] Knowledge Browser card (15 min)
  - [ ] Admin Tools card (15 min)

### Task 3.4: Layout & Responsiveness (1 hour)

**Subtasks:**
- [ ] Implement responsive grid layout (25 min)
- [ ] Add mobile-friendly navigation (20 min)
- [ ] Test layout on different screen sizes (15 min)

---

## Success Criteria

- [ ] Dashboard displays all testing feature cards
- [ ] Navigation between features works smoothly
- [ ] Responsive layout works on mobile and desktop
- [ ] Active route is visually highlighted
- [ ] Clean, professional appearance

---

## Deliverables

1. **Main App Structure**
   - Simplified routing system
   - Layout wrapper component
   - Protected route integration

2. **Navigation System**
   - Sidebar navigation
   - Active route highlighting
   - Mobile-responsive menu

3. **Testing Dashboard**
   - Feature cards for each testing area
   - Click navigation to features
   - Clean, card-based layout

---

## Implementation Details

### Route Structure
```javascript
const routes = [
  { path: '/login', component: Login },
  { path: '/', component: Dashboard, protected: true },
  { path: '/chat/:workspaceSlug?', component: ChatTest, protected: true },
  { path: '/documents', component: DocumentUpload, protected: true },
  { path: '/knowledge', component: KnowledgeBrowser, protected: true },
  { path: '/admin', component: AdminPanel, protected: true }
];
```

### Dashboard Feature Cards
```javascript
const testingFeatures = [
  {
    title: 'Chat Testing',
    description: 'Test chat responses and streaming',
    icon: 'ChatIcon',
    path: '/chat',
    color: 'blue'
  },
  {
    title: 'Document Upload',
    description: 'Upload and manage test documents',
    icon: 'DocumentIcon', 
    path: '/documents',
    color: 'green'
  },
  {
    title: 'Knowledge Browser',
    description: 'Browse and search knowledge base',
    icon: 'SearchIcon',
    path: '/knowledge', 
    color: 'purple'
  },
  {
    title: 'Admin Tools',
    description: 'Test admin APIs and operations',
    icon: 'AdminIcon',
    path: '/admin',
    color: 'orange'
  }
];
```

---

## Key Components Created

### Main Layout
- `/src/components/Layout/MainLayout.jsx` - Overall app structure
- `/src/components/Layout/Sidebar.jsx` - Navigation sidebar
- `/src/components/Layout/Header.jsx` - Top header with user info

### Dashboard
- `/src/pages/Dashboard/Dashboard.jsx` - Main dashboard page
- `/src/components/Dashboard/FeatureCard.jsx` - Reusable feature cards
- `/src/components/Dashboard/TestingGrid.jsx` - Card grid layout

### Navigation
- `/src/components/Navigation/NavItem.jsx` - Individual nav items
- `/src/components/Navigation/MobileMenu.jsx` - Mobile navigation

---

## Styling Approach

### TailwindCSS Classes
- Use existing AnythingLLM color scheme
- Responsive grid: `grid grid-cols-1 md:grid-cols-2 gap-6`
- Card styling: `bg-white rounded-lg shadow-md hover:shadow-lg`
- Navigation: `fixed left-0 top-0 h-full w-64 bg-gray-900`

### Mobile Responsiveness
- Collapsible sidebar on mobile
- Card grid adjusts to single column
- Touch-friendly button sizes

---

## User Experience Flow

1. **Login** → Dashboard automatically loads
2. **Dashboard** → Shows 4 main testing feature cards
3. **Feature Cards** → Click to navigate to specific testing area
4. **Sidebar** → Always accessible for quick navigation
5. **Breadcrumbs** → Show current location in testing flow

---

## Testing Scenarios

### Navigation Tests
- [ ] Click each feature card navigates correctly
- [ ] Sidebar navigation works from any page  
- [ ] Active route is highlighted properly
- [ ] Mobile menu opens/closes correctly

### Layout Tests
- [ ] Responsive on mobile (< 768px)
- [ ] Responsive on tablet (768px - 1024px)
- [ ] Responsive on desktop (> 1024px)
- [ ] No horizontal scrolling
- [ ] All text readable on small screens

---

## Next Steps

After completion of FT-003:
- Ready for FT-004 (Chat Testing Interface)
- Navigation framework supports all future features
- Dashboard provides central access to testing tools

---

## Testing Checklist

- [ ] All navigation links work
- [ ] Dashboard loads and displays cards
- [ ] Active route highlighted in sidebar
- [ ] Responsive on mobile devices
- [ ] Feature cards clickable and navigate
- [ ] User can logout from header
- [ ] Clean visual design matches AnythingLLM style