#!/usr/bin/env node

/**
 * Add Sample Test Data for Phase 1.4 Admin API Testing
 * 
 * This script adds sample documents to the database to enable comprehensive
 * testing of the Admin API endpoints.
 */

const prisma = require("../server/utils/prisma");
const { v4: uuidv4 } = require("uuid");

async function addSampleData() {
  try {
    console.log("🔄 Adding sample test data...");

    // Create a test workspace if none exists
    let workspace = await prisma.workspaces.findFirst({
      where: { slug: "test-workspace" }
    });
    
    if (!workspace) {
      workspace = await prisma.workspaces.create({
        data: {
          name: "Test Workspace",
          slug: "test-workspace",
          openAiTemp: 0.7,
          chatMode: "chat"
        }
      });
      console.log("✅ Created test workspace:", workspace.name);
    }

    // Sample documents to add
    const sampleDocuments = [
      {
        docId: uuidv4(),
        docpath: "/sample-docs/getting-started.md",
        workspaceId: workspace.id,
        category: "documentation",
        sourceType: "manual_upload",
        metadata: JSON.stringify({
          title: "Getting Started Guide",
          description: "A comprehensive guide to getting started with AnythingLLM",
          wordCount: 1500,
          token_count_estimate: 2000,
          chunkCount: 12,
          docAuthor: "Admin",
          published: true,
          url: "https://docs.anythingllm.com/getting-started"
        }),
        syncMetadata: JSON.stringify({
          status: "synced",
          lastSync: new Date().toISOString(),
          schedule: "daily"
        }),
        businessContext: JSON.stringify({
          importance: "high",
          audience: "new-users",
          topics: ["setup", "configuration", "first-steps"]
        }),
        priority: 10,
        pinned: true,
        watched: true
      },
      {
        docId: uuidv4(),
        docpath: "/sample-docs/api-reference.md",
        workspaceId: workspace.id,
        category: "api-docs",
        sourceType: "api_sync",
        metadata: JSON.stringify({
          title: "API Reference Documentation",
          description: "Complete reference for AnythingLLM REST API endpoints",
          wordCount: 3200,
          token_count_estimate: 4500,
          chunkCount: 25,
          docAuthor: "API Team",
          published: true,
          url: "https://docs.anythingllm.com/api"
        }),
        syncMetadata: JSON.stringify({
          status: "synced",
          lastSync: new Date().toISOString(),
          schedule: "weekly",
          errorCount: 0
        }),
        businessContext: JSON.stringify({
          importance: "critical",
          audience: "developers",
          topics: ["api", "endpoints", "authentication", "responses"]
        }),
        priority: 9,
        pinned: false,
        watched: true
      },
      {
        docId: uuidv4(),
        docpath: "/sample-docs/troubleshooting.md",
        workspaceId: workspace.id,
        category: "support",
        sourceType: "manual_upload",
        metadata: JSON.stringify({
          title: "Troubleshooting Common Issues",
          description: "Solutions to frequently encountered problems and error messages",
          wordCount: 2800,
          token_count_estimate: 3800,
          chunkCount: 18,
          docAuthor: "Support Team",
          published: true
        }),
        syncMetadata: JSON.stringify({
          status: "synced",
          lastSync: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          schedule: "manual"
        }),
        businessContext: JSON.stringify({
          importance: "high",
          audience: "all-users",
          topics: ["errors", "debugging", "solutions", "common-issues"]
        }),
        priority: 8,
        pinned: false,
        watched: false
      },
      {
        docId: uuidv4(),
        docpath: "/sample-docs/product-changelog.md",
        workspaceId: workspace.id,
        category: "updates",
        sourceType: "automated_sync",
        metadata: JSON.stringify({
          title: "Product Changelog",
          description: "Latest updates, features, and bug fixes in AnythingLLM",
          wordCount: 950,
          token_count_estimate: 1300,
          chunkCount: 8,
          docAuthor: "Product Team",
          published: true,
          url: "https://docs.anythingllm.com/changelog"
        }),
        syncMetadata: JSON.stringify({
          status: "pending",
          lastSync: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
          schedule: "daily",
          nextSync: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
          errorCount: 2
        }),
        businessContext: JSON.stringify({
          importance: "medium",
          audience: "existing-users",
          topics: ["updates", "features", "releases", "bug-fixes"]
        }),
        priority: 5,
        pinned: false,
        watched: true
      },
      {
        docId: uuidv4(),
        docpath: "/sample-docs/advanced-configuration.md",
        workspaceId: workspace.id,
        category: "documentation",
        sourceType: "manual_upload",
        metadata: JSON.stringify({
          title: "Advanced Configuration Options",
          description: "In-depth configuration guide for power users and administrators",
          wordCount: 4200,
          token_count_estimate: 5800,
          chunkCount: 32,
          docAuthor: "Engineering Team",
          published: false // Draft document
        }),
        syncMetadata: JSON.stringify({
          status: "error",
          lastSync: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
          schedule: "weekly",
          errorCount: 5,
          lastError: "Connection timeout during sync"
        }),
        businessContext: JSON.stringify({
          importance: "medium",
          audience: "advanced-users",
          topics: ["configuration", "advanced-features", "customization", "administration"]
        }),
        priority: 6,
        pinned: false,
        watched: false
      }
    ];

    // Add documents to database
    const addedDocuments = [];
    for (const docData of sampleDocuments) {
      try {
        const existingDoc = await prisma.workspace_documents.findFirst({
          where: { docpath: docData.docpath }
        });
        
        if (!existingDoc) {
          const document = await prisma.workspace_documents.create({
            data: docData
          });
          addedDocuments.push(document);
          console.log("✅ Added document:", docData.metadata ? JSON.parse(docData.metadata).title : docData.docpath);
        } else {
          console.log("⏭️  Document already exists:", docData.docpath);
        }
      } catch (error) {
        console.error("❌ Error adding document:", docData.docpath, error.message);
      }
    }

    console.log(`\n🎉 Sample data setup complete!`);
    console.log(`   - Workspace: ${workspace.name} (ID: ${workspace.id})`);
    console.log(`   - Documents added: ${addedDocuments.length}`);
    console.log(`   - Total sample documents: ${sampleDocuments.length}`);
    
    console.log("\n📋 Test Data Summary:");
    console.log("   - Categories: documentation, api-docs, support, updates");
    console.log("   - Source types: manual_upload, api_sync, automated_sync");
    console.log("   - Sync statuses: synced, pending, error");
    console.log("   - Various priorities, word counts, and metadata");
    
    console.log("\n🧪 You can now test the Admin API endpoints with real data!");
    console.log("   Example searches: 'api', 'troubleshooting', 'getting started', 'configuration'");

  } catch (error) {
    console.error("❌ Failed to add sample data:", error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  addSampleData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Script failed:", error);
      process.exit(1);
    });
}

module.exports = { addSampleData };