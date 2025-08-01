# FT-007: Admin Testing Panel

**Estimate**: 8 hours  
**Priority**: P0 Critical - Core Testing Feature  
**Dependencies**: FT-006  
**Phase**: Core Internal Testing

---

## Overview

Create a comprehensive admin testing panel for testing backend administrative APIs. This is the final core testing feature that validates bulk operations, system statistics, and administrative functions.

## Objectives

- Test admin API endpoints for bulk operations
- Display knowledge base statistics and system health
- Validate bulk update, delete, and merge operations
- Provide interface for advanced administrative testing

---

## Detailed Tasks

### Task 7.1: Admin Dashboard Layout (2 hours)

**Subtasks:**
- [ ] Create AdminPanel page component (30 min)
- [ ] Design admin navigation tabs/sections (30 min)
- [ ] Create admin stats overview cards (45 min)
- [ ] Setup permission checks for admin access (15 min)

### Task 7.2: Knowledge Base Statistics (2 hours)

**Subtasks:**
- [ ] Fetch and display document count statistics (30 min)
- [ ] Show storage usage and limits (30 min)
- [ ] Add document type distribution (30 min)
- [ ] Implement auto-refresh for live stats (30 min)

### Task 7.3: Bulk Operations Interface (2.5 hours)

**Subtasks:**
- [ ] Create bulk selection component with checkboxes (45 min)
- [ ] Add "Select All" and "Select None" functionality (20 min)
- [ ] Design bulk action toolbar (30 min)
- [ ] Implement bulk delete with confirmation dialog (35 min)
- [ ] Create bulk update form modal (20 min)

### Task 7.4: Advanced Admin Features (1.5 hours)

**Subtasks:**
- [ ] Create document merge interface (30 min)
- [ ] Add duplicate document finder (30 min)
- [ ] Display operation results and progress (20 min)
- [ ] Add system health indicators (10 min)

---

## Success Criteria

- [ ] All admin APIs are testable through the interface
- [ ] Bulk operations work correctly with proper confirmation
- [ ] Statistics display accurately and refresh automatically
- [ ] Document merge and duplicate detection functional
- [ ] Clear feedback for all administrative operations
- [ ] Permission-based access control working

---

## Deliverables

1. **Admin Dashboard**
   - Statistics overview cards
   - System health indicators
   - Navigation to admin features

2. **Bulk Operations Interface**
   - Multi-selection capability
   - Bulk delete with confirmation
   - Bulk update functionality

3. **Advanced Admin Tools**
   - Document merge interface
   - Duplicate detection
   - Operation result tracking

---

## Implementation Details

### Admin API Integration
```javascript
const AdminAPI = {
  getStats: async () => {
    const response = await fetch('/api/v1/admin/knowledge/stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  },

  bulkUpdate: async (documentIds, updates) => {
    const response = await fetch('/api/v1/admin/documents/bulk-update', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ documentIds, updates })
    });
    return response.json();
  },

  bulkDelete: async (documentIds) => {
    const response = await fetch('/api/v1/admin/documents/bulk-delete', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ documentIds })
    });
    return response.json();
  },

  findDuplicates: async () => {
    const response = await fetch('/api/v1/admin/documents/duplicates', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  },

  mergeDocuments: async (sourceIds, targetId) => {
    const response = await fetch('/api/v1/admin/documents/merge', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sourceIds, targetId })
    });
    return response.json();
  }
};
```

### Statistics Data Structure
```javascript
const statsStructure = {
  documents: {
    total: 1250,
    byType: {
      pdf: 800,
      docx: 300,
      txt: 100,
      csv: 50
    },
    processed: 1200,
    processing: 30,
    failed: 20
  },
  storage: {
    used: '2.4 GB',
    limit: '10 GB',
    percentage: 24
  },
  activity: {
    uploadsToday: 15,
    searchesToday: 245,
    chatMessages: 89
  }
};
```

---

## Key Components

### Admin Interface
- `/src/pages/AdminPanel/AdminPanel.jsx` - Main admin page
- `/src/components/Admin/StatsDashboard.jsx` - Statistics overview
- `/src/components/Admin/BulkOperations.jsx` - Bulk action interface
- `/src/components/Admin/SystemHealth.jsx` - Health indicators

### Bulk Operations
- `/src/components/Admin/DocumentSelector.jsx` - Multi-select interface
- `/src/components/Admin/BulkActionBar.jsx` - Action buttons
- `/src/components/Admin/ConfirmDialog.jsx` - Confirmation modals
- `/src/components/Admin/OperationResult.jsx` - Result display

### Advanced Features
- `/src/components/Admin/DuplicateFinder.jsx` - Duplicate detection
- `/src/components/Admin/DocumentMerger.jsx` - Merge interface
- `/src/components/Admin/BulkUpdateForm.jsx` - Update form modal

---

## Admin Features

### Statistics Display
- Total document count
- Documents by type (pie chart)
- Storage usage (progress bar)
- Processing status breakdown
- Recent activity metrics
- System health indicators

### Bulk Operations
- Multi-select documents
- Select all/none functionality
- Bulk delete with confirmation
- Bulk metadata updates
- Progress tracking for operations
- Operation result summary

### Advanced Tools
- Find duplicate documents
- Merge similar documents
- Batch reprocessing
- System maintenance operations

---

## User Interface Design

### Admin Dashboard Layout
```
┌─────────────────────────────────────────┐
│ Knowledge Base Statistics               │
├─────────────┬─────────────┬─────────────┤
│ Total Docs  │ Storage     │ Activity    │
│    1,250    │  2.4/10GB  │   89 today  │
└─────────────┴─────────────┴─────────────┘

┌─────────────────────────────────────────┐
│ Bulk Operations                         │
│ □ Select All  [Delete] [Update] [Merge] │
├─────────────────────────────────────────┤
│ □ document1.pdf                         │
│ □ document2.docx                        │
│ □ document3.txt                         │
└─────────────────────────────────────────┘
```

### Confirmation Dialogs
- Clear warning messages
- Item count display
- Reversibility information
- Confirm/Cancel buttons

---

## Testing Scenarios

### Statistics Testing
1. **Stats Display**
   - Load admin panel
   - Verify all statistics display
   - Test auto-refresh functionality

2. **Real-time Updates**
   - Upload document in another tab
   - Verify stats update automatically

### Bulk Operations Testing
1. **Selection**
   - Select individual documents
   - Test select all/none
   - Verify selection state

2. **Bulk Delete**
   - Select multiple documents
   - Trigger bulk delete
   - Confirm deletion dialog
   - Verify documents deleted

3. **Bulk Update**
   - Select documents
   - Open bulk update form
   - Update metadata
   - Verify changes applied

### Advanced Features
- [ ] Find duplicate documents
- [ ] Merge document interface
- [ ] Operation progress tracking
- [ ] Error handling for failed operations

---

## Error Handling

### Operation Failures
- Network connection issues
- Permission denied errors
- Partial operation failures
- Invalid operation parameters

### User Feedback
- Clear error messages
- Operation progress indicators
- Success confirmation
- Detailed result summaries

---

## Required Backend APIs

```
GET /api/v1/admin/knowledge/stats - Knowledge base statistics
POST /api/v1/admin/documents/bulk-update - Bulk update documents
DELETE /api/v1/admin/documents/bulk-delete - Bulk delete documents
GET /api/v1/admin/documents/duplicates - Find duplicates
POST /api/v1/admin/documents/merge - Merge documents
GET /api/v1/admin/system/health - System health status
```

---

## Testing Checklist

- [ ] Admin panel loads with proper permissions
- [ ] Statistics display correctly
- [ ] Can select multiple documents
- [ ] Bulk delete works with confirmation
- [ ] Bulk update applies changes
- [ ] Duplicate finder identifies duplicates
- [ ] Document merge functionality works
- [ ] Operation results display clearly
- [ ] Error handling works for all operations

---

## Next Steps

After completion of FT-007:
- **Core internal testing interface COMPLETE**
- All Phase 1 backend APIs testable
- Ready for production features (FT-008 to FT-012) when needed
- Functional testing platform for development team

---

## Notes

- This completes the core testing functionality
- Focus on reliability and comprehensive API testing
- Ensure all administrative operations are safely testable
- Provide clear feedback for all bulk operations
- This is the last P0 Critical task for internal testing