-- AlterTable
ALTER TABLE "workspace_documents" ADD COLUMN "businessContext" TEXT;
ALTER TABLE "workspace_documents" ADD COLUMN "category" TEXT;
ALTER TABLE "workspace_documents" ADD COLUMN "priority" INTEGER DEFAULT 0;
ALTER TABLE "workspace_documents" ADD COLUMN "sourceType" TEXT DEFAULT 'manual_upload';
ALTER TABLE "workspace_documents" ADD COLUMN "syncMetadata" TEXT;

-- CreateTable
CREATE TABLE "document_links" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "parentDocId" INTEGER NOT NULL,
    "childDocId" INTEGER NOT NULL,
    "linkType" TEXT NOT NULL,
    "linkMetadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "document_links_parentDocId_fkey" FOREIGN KEY ("parentDocId") REFERENCES "workspace_documents" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "document_links_childDocId_fkey" FOREIGN KEY ("childDocId") REFERENCES "workspace_documents" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "query_logs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "workspaceId" INTEGER NOT NULL,
    "userId" INTEGER,
    "sessionId" TEXT,
    "query" TEXT NOT NULL,
    "retrievedDocs" TEXT,
    "response" TEXT NOT NULL,
    "llmProvider" TEXT,
    "llmModel" TEXT,
    "responseTime" INTEGER,
    "confidence" REAL,
    "sources" TEXT,
    "metadata" TEXT,
    "feedback" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "document_links_parentDocId_idx" ON "document_links"("parentDocId");

-- CreateIndex
CREATE INDEX "document_links_childDocId_idx" ON "document_links"("childDocId");

-- CreateIndex
CREATE INDEX "document_links_linkType_idx" ON "document_links"("linkType");

-- CreateIndex
CREATE INDEX "query_logs_workspaceId_idx" ON "query_logs"("workspaceId");

-- CreateIndex
CREATE INDEX "query_logs_userId_idx" ON "query_logs"("userId");

-- CreateIndex
CREATE INDEX "query_logs_sessionId_idx" ON "query_logs"("sessionId");

-- CreateIndex
CREATE INDEX "query_logs_createdAt_idx" ON "query_logs"("createdAt");

-- CreateIndex
CREATE INDEX "query_logs_llmProvider_idx" ON "query_logs"("llmProvider");

-- CreateIndex
CREATE INDEX "query_logs_confidence_idx" ON "query_logs"("confidence");
