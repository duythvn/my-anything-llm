-- Simple script to add sample test data for Phase 1.4 Admin API testing

-- Insert test workspace (if not exists)
INSERT OR IGNORE INTO workspaces (id, name, slug, openAiTemp, chatMode, createdAt, lastUpdatedAt)
VALUES (999, 'Test Workspace', 'test-workspace-999', 0.7, 'chat', datetime('now'), datetime('now'));

-- Insert sample documents for testing
INSERT OR IGNORE INTO workspace_documents (
    docId, docpath, workspaceId, filename, category, sourceType, 
    metadata, syncMetadata, businessContext, 
    priority, pinned, watched, createdAt, lastUpdatedAt
) VALUES 
(
    'doc-001-getting-started',
    '/sample-docs/getting-started.md',
    999,
    'getting-started.md',
    'documentation',
    'manual_upload',
    '{"title":"Getting Started Guide","description":"A comprehensive guide to getting started with AnythingLLM","wordCount":1500,"token_count_estimate":2000,"chunkCount":12,"docAuthor":"Admin","published":true,"url":"https://docs.anythingllm.com/getting-started"}',
    '{"status":"synced","lastSync":"2025-07-31T10:00:00.000Z","schedule":"daily"}',
    '{"importance":"high","audience":"new-users","topics":["setup","configuration","first-steps"]}',
    10, 1, 1,
    datetime('now', '-1 day'),
    datetime('now', '-1 day')
),
(
    'doc-002-api-reference',
    '/sample-docs/api-reference.md',
    999,
    'api-reference.md',
    'api-docs',
    'api_sync',
    '{"title":"API Reference Documentation","description":"Complete reference for AnythingLLM REST API endpoints","wordCount":3200,"token_count_estimate":4500,"chunkCount":25,"docAuthor":"API Team","published":true,"url":"https://docs.anythingllm.com/api"}',
    '{"status":"synced","lastSync":"2025-07-31T09:00:00.000Z","schedule":"weekly","errorCount":0}',
    '{"importance":"critical","audience":"developers","topics":["api","endpoints","authentication","responses"]}',
    9, 0, 1,
    datetime('now', '-2 days'),
    datetime('now', '-1 hour')
),
(
    'doc-003-troubleshooting',
    '/sample-docs/troubleshooting.md',
    999,
    'troubleshooting.md',
    'support',
    'manual_upload',
    '{"title":"Troubleshooting Common Issues","description":"Solutions to frequently encountered problems and error messages","wordCount":2800,"token_count_estimate":3800,"chunkCount":18,"docAuthor":"Support Team","published":true}',
    '{"status":"synced","lastSync":"2025-07-30T10:00:00.000Z","schedule":"manual"}',
    '{"importance":"high","audience":"all-users","topics":["errors","debugging","solutions","common-issues"]}',
    8, 0, 0,
    datetime('now', '-3 days'),
    datetime('now', '-2 days')
),
(
    'doc-004-changelog',
    '/sample-docs/product-changelog.md',
    999,
    'product-changelog.md',
    'updates',
    'automated_sync',
    '{"title":"Product Changelog","description":"Latest updates, features, and bug fixes in AnythingLLM","wordCount":950,"token_count_estimate":1300,"chunkCount":8,"docAuthor":"Product Team","published":true,"url":"https://docs.anythingllm.com/changelog"}',
    '{"status":"pending","lastSync":"2025-07-24T10:00:00.000Z","schedule":"daily","nextSync":"2025-07-31T12:00:00.000Z","errorCount":2}',
    '{"importance":"medium","audience":"existing-users","topics":["updates","features","releases","bug-fixes"]}',
    5, 0, 1,
    datetime('now', '-7 days'),
    datetime('now', '-1 day')
),
(
    'doc-005-advanced-config',
    '/sample-docs/advanced-configuration.md',
    999,
    'advanced-configuration.md',
    'documentation',
    'manual_upload',
    '{"title":"Advanced Configuration Options","description":"In-depth configuration guide for power users and administrators","wordCount":4200,"token_count_estimate":5800,"chunkCount":32,"docAuthor":"Engineering Team","published":false}',
    '{"status":"error","lastSync":"2025-07-28T10:00:00.000Z","schedule":"weekly","errorCount":5,"lastError":"Connection timeout during sync"}',
    '{"importance":"medium","audience":"advanced-users","topics":["configuration","advanced-features","customization","administration"]}',
    6, 0, 0,
    datetime('now', '-5 days'),
    datetime('now', '-3 days')
);

-- Verify the data was inserted
SELECT 'Sample Data Summary:' as message;
SELECT 
    'Workspace: ' || name || ' (ID: ' || id || ')' as info
FROM workspaces 
WHERE id = 999;

SELECT 
    'Documents: ' || COUNT(*) || ' total' as info
FROM workspace_documents 
WHERE workspaceId = 999;

SELECT 
    '- ' || category || ': ' || COUNT(*) || ' documents' as breakdown
FROM workspace_documents 
WHERE workspaceId = 999
GROUP BY category;

SELECT 'Sample searches to try: "api", "troubleshooting", "getting started", "configuration"' as tip;