#!/usr/bin/env node

/**
 * Direct SQL approach to add sample test data
 */

const prisma = require("../server/utils/prisma");

async function addSampleDataDirect() {
  try {
    console.log("🔄 Adding sample test data directly...");

    // Create workspace
    await prisma.$executeRaw`
      INSERT OR IGNORE INTO workspaces (id, name, slug, openAiTemp, chatMode, createdAt, lastUpdatedAt)
      VALUES (999, 'Test Workspace', 'test-workspace-999', 0.7, 'chat', datetime('now'), datetime('now'))
    `;

    // Add sample documents
    await prisma.$executeRaw`
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
      )
    `;

    await prisma.$executeRaw`
      INSERT OR IGNORE INTO workspace_documents (
        docId, docpath, workspaceId, filename, category, sourceType, 
        metadata, syncMetadata, businessContext, 
        priority, pinned, watched, createdAt, lastUpdatedAt
      ) VALUES 
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
      )
    `;

    await prisma.$executeRaw`
      INSERT OR IGNORE INTO workspace_documents (
        docId, docpath, workspaceId, filename, category, sourceType, 
        metadata, syncMetadata, businessContext, 
        priority, pinned, watched, createdAt, lastUpdatedAt
      ) VALUES 
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
      )
    `;

    await prisma.$executeRaw`
      INSERT OR IGNORE INTO workspace_documents (
        docId, docpath, workspaceId, filename, category, sourceType, 
        metadata, syncMetadata, businessContext, 
        priority, pinned, watched, createdAt, lastUpdatedAt
      ) VALUES 
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
      )
    `;

    await prisma.$executeRaw`
      INSERT OR IGNORE INTO workspace_documents (
        docId, docpath, workspaceId, filename, category, sourceType, 
        metadata, syncMetadata, businessContext, 
        priority, pinned, watched, createdAt, lastUpdatedAt
      ) VALUES 
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
      )
    `;

    // Verify the data
    const workspace = await prisma.workspaces.findFirst({ where: { id: 999 } });
    const documents = await prisma.workspace_documents.findMany({ where: { workspaceId: 999 } });

    console.log("\n🎉 Sample data setup complete!");
    console.log(`   - Workspace: ${workspace?.name} (ID: ${workspace?.id})`);
    console.log(`   - Documents added: ${documents.length} total`);
    
    // Group by category
    const byCategory = documents.reduce((acc, doc) => {
      acc[doc.category] = (acc[doc.category] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(byCategory).forEach(([category, count]) => {
      console.log(`     - ${category}: ${count} documents`);
    });
    
    console.log("\n🧪 You can now test the Admin API endpoints with real data!");
    console.log("   Example searches: 'api', 'troubleshooting', 'getting started', 'configuration'");

  } catch (error) {
    console.error("❌ Failed to add sample data:", error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  addSampleDataDirect()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Script failed:", error);
      process.exit(1);
    });
}

module.exports = { addSampleDataDirect };