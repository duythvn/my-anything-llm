# FT-005: Document Upload Interface

**Estimate**: 6 hours  
**Priority**: P0 Critical - Core Testing Feature  
**Dependencies**: FT-003  
**Phase**: Core Internal Testing

---

## Overview

Create a document upload interface for testing backend document processing APIs. This feature is essential for testing document ingestion, processing, and knowledge base management.

## Objectives

- Build drag-and-drop file upload interface
- Support multiple file types (PDF, CSV, DOCX, TXT)
- Track upload progress for individual files
- Manage uploaded documents with basic operations

---

## Detailed Tasks

### Task 5.1: Dropzone Setup (1.5 hours)

**Subtasks:**
- [ ] Install and configure react-dropzone (15 min)
- [ ] Create DocumentUpload page component (30 min)
- [ ] Design drag-and-drop UI with visual feedback (30 min)
- [ ] Add file type validation and restrictions (15 min)

### Task 5.2: Multi-File Upload Support (1.5 hours)

**Subtasks:**
- [ ] Enable multiple file selection (20 min)
- [ ] Create file preview list component (40 min)
- [ ] Add file removal before upload (15 min)
- [ ] Implement file queue management (15 min)

### Task 5.3: Upload Progress Tracking (2 hours)

**Subtasks:**
- [ ] Create progress bar component (30 min)
- [ ] Implement XMLHttpRequest for progress tracking (45 min)
- [ ] Add per-file upload status indicators (30 min)
- [ ] Handle upload errors and retries (15 min)

### Task 5.4: Document Management (1 hour)

**Subtasks:**
- [ ] Create uploaded documents list (30 min)
- [ ] Add refresh functionality for document list (15 min)
- [ ] Implement basic delete document feature (15 min)

---

## Success Criteria

- [ ] Can drag and drop files onto upload area
- [ ] Multiple files can be selected and queued
- [ ] Upload progress is visible for each file
- [ ] Uploaded documents appear in list
- [ ] File type validation works correctly
- [ ] Can delete uploaded documents

---

## Deliverables

1. **Upload Interface**
   - Drag-and-drop zone
   - File type validation
   - Visual upload feedback

2. **Progress Tracking**
   - Individual file progress bars
   - Upload status indicators
   - Error handling and display

3. **Document Management**
   - List of uploaded documents
   - Basic delete functionality
   - Document metadata display

---

## Implementation Details

### Supported File Types
```javascript
const acceptedFileTypes = {
  'application/pdf': ['.pdf'],
  'text/csv': ['.csv'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/plain': ['.txt'],
  'application/msword': ['.doc']
};

const maxFileSize = 10 * 1024 * 1024; // 10MB
```

### Upload API Integration
```javascript
const DocumentAPI = {
  uploadFile: async (workspaceSlug, file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          onProgress(progress);
        }
      });
      
      xhr.onload = () => {
        if (xhr.status === 200) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(new Error(`Upload failed: ${xhr.statusText}`));
        }
      };
      
      xhr.open('POST', `/api/v1/workspace/${workspaceSlug}/upload`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(formData);
    });
  },

  listDocuments: async (workspaceSlug) => {
    const response = await fetch(`/api/v1/workspace/${workspaceSlug}/documents`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  },

  deleteDocument: async (documentId) => {
    const response = await fetch(`/api/v1/document/${documentId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  }
};
```

---

## Key Components

### Upload Interface
- `/src/pages/DocumentUpload/DocumentUpload.jsx` - Main upload page
- `/src/components/Upload/Dropzone.jsx` - Drag-and-drop component
- `/src/components/Upload/FilePreview.jsx` - File preview list
- `/src/components/Upload/ProgressBar.jsx` - Upload progress indicator

### Document Management
- `/src/components/Documents/DocumentList.jsx` - List of documents
- `/src/components/Documents/DocumentCard.jsx` - Individual document display
- `/src/components/Documents/DeleteConfirm.jsx` - Delete confirmation modal

---

## File Upload States

### Upload States
```javascript
const uploadStates = {
  QUEUED: 'queued',
  UPLOADING: 'uploading', 
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};
```

### File Object Structure
```javascript
const fileObject = {
  id: 'unique-id',
  file: File, // Original file object
  name: 'document.pdf',
  size: 1024000,
  type: 'application/pdf',
  status: 'uploading',
  progress: 45,
  error: null,
  uploadedId: null // Backend document ID after upload
};
```

---

## UI/UX Features

### Drag-and-Drop Experience
- Visual feedback on drag over
- Clear drop zone boundaries
- File type icons and validation messages
- Immediate file preview after selection

### Progress Indication
- Individual progress bars per file
- Overall upload progress
- Success/error states with icons
- Estimated time remaining

### Error Handling
- File size validation
- File type restrictions
- Upload failure recovery
- Clear error messages

---

## Testing Scenarios

### Upload Tests
1. **Single File Upload**
   - Drag single PDF file
   - Verify progress tracking
   - Confirm successful upload

2. **Multiple File Upload**
   - Select multiple files
   - Track individual progress
   - Handle mixed success/failure

3. **File Validation**
   - Try unsupported file type
   - Try oversized file
   - Verify error messages

### Document Management
- [ ] View uploaded documents list
- [ ] Delete document with confirmation
- [ ] Refresh document list
- [ ] Handle empty document list

---

## Performance Considerations

### Optimization Features
- Chunked upload for large files
- Concurrent upload limits
- Upload queue management
- Memory cleanup after uploads

### Resource Management
- File object URL cleanup
- Progress tracking cleanup
- Component unmount handling

---

## Required Backend APIs

```
POST /api/v1/workspace/{slug}/upload - Upload document
GET /api/v1/workspace/{slug}/documents - List documents
DELETE /api/v1/document/{id} - Delete document
GET /api/v1/document/{id}/status - Upload status (optional)
```

---

## Testing Checklist

- [ ] Drag and drop files works
- [ ] Multiple file selection works
- [ ] File type validation prevents invalid files
- [ ] Upload progress displays correctly
- [ ] Successful uploads appear in document list
- [ ] Failed uploads show error messages
- [ ] Can delete uploaded documents
- [ ] File size limits enforced

---

## Next Steps

After completion of FT-005:
- Ready for FT-006 (Knowledge Browser)
- Document upload APIs fully testable
- Foundation for knowledge base testing

---

## Notes

- Focus on reliable upload with progress tracking
- Keep document management simple for testing
- Ensure all file processing APIs are testable
- Handle edge cases (large files, network issues)