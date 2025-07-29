const prisma = require("../utils/prisma");
const { safeJsonParse } = require("../utils/http");

/**
 * Phase 1.2: Document Links Model
 * Manages parent-child relationships between documents (e.g., CSV -> PDF links, FAQ extractions)
 */
const DocumentLinks = {
  /**
   * Create a new document link relationship
   * @param {number} parentDocId - ID of the parent document
   * @param {number} childDocId - ID of the child/linked document
   * @param {string} linkType - Type of relationship (pdf_extraction, faq_child, etc.)
   * @param {object} linkMetadata - Additional metadata about the link
   * @returns {Promise<object|null>}
   */
  create: async function (parentDocId, childDocId, linkType, linkMetadata = {}) {
    try {
      const linkData = {
        parentDocId,
        childDocId,
        linkType,
        linkMetadata: JSON.stringify(linkMetadata)
      };

      const link = await prisma.document_links.create({ data: linkData });
      return link;
    } catch (error) {
      console.error("Failed to create document link:", error.message);
      return null;
    }
  },

  /**
   * Get all child documents for a parent
   * @param {number} parentDocId 
   * @param {string} linkType - Optional filter by link type
   * @returns {Promise<Array>}
   */
  getChildren: async function (parentDocId, linkType = null) {
    try {
      const whereClause = {
        parentDocId,
        ...(linkType ? { linkType } : {})
      };

      const links = await prisma.document_links.findMany({
        where: whereClause,
        include: {
          childDoc: true
        },
        orderBy: { createdAt: 'desc' }
      });

      return links.map(link => ({
        linkId: link.id,
        linkType: link.linkType,
        linkMetadata: safeJsonParse(link.linkMetadata, {}),
        document: link.childDoc,
        createdAt: link.createdAt
      }));
    } catch (error) {
      console.error("Failed to get child documents:", error.message);
      return [];
    }
  },

  /**
   * Get parent documents for a child
   * @param {number} childDocId 
   * @param {string} linkType - Optional filter by link type
   * @returns {Promise<Array>}
   */
  getParents: async function (childDocId, linkType = null) {
    try {
      const whereClause = {
        childDocId,
        ...(linkType ? { linkType } : {})
      };

      const links = await prisma.document_links.findMany({
        where: whereClause,
        include: {
          parentDoc: true
        },
        orderBy: { createdAt: 'desc' }
      });

      return links.map(link => ({
        linkId: link.id,
        linkType: link.linkType,
        linkMetadata: safeJsonParse(link.linkMetadata, {}),
        document: link.parentDoc,
        createdAt: link.createdAt
      }));
    } catch (error) {
      console.error("Failed to get parent documents:", error.message);
      return [];
    }
  },

  /**
   * Get all links for a document (both as parent and child)
   * @param {number} docId 
   * @returns {Promise<object>} - { asParent: [], asChild: [] }
   */
  getAllLinks: async function (docId) {
    try {
      const [asParent, asChild] = await Promise.all([
        this.getChildren(docId),
        this.getParents(docId)
      ]);

      return { asParent, asChild };
    } catch (error) {
      console.error("Failed to get all links for document:", error.message);
      return { asParent: [], asChild: [] };
    }
  },

  /**
   * Delete a specific link
   * @param {number} linkId 
   * @returns {Promise<boolean>}
   */
  deleteLink: async function (linkId) {
    try {
      await prisma.document_links.delete({
        where: { id: linkId }
      });
      return true;
    } catch (error) {
      console.error("Failed to delete document link:", error.message);
      return false;
    }
  },

  /**
   * Delete all links for a document (cleanup when document is deleted)
   * @param {number} docId 
   * @returns {Promise<boolean>}
   */
  deleteAllLinks: async function (docId) {
    try {
      await Promise.all([
        prisma.document_links.deleteMany({
          where: { parentDocId: docId }
        }),
        prisma.document_links.deleteMany({
          where: { childDocId: docId }
        })
      ]);
      return true;
    } catch (error) {
      console.error("Failed to delete all links for document:", error.message);
      return false;
    }
  },

  /**
   * Update link metadata
   * @param {number} linkId 
   * @param {object} newMetadata 
   * @returns {Promise<object|null>}
   */
  updateMetadata: async function (linkId, newMetadata) {
    try {
      const link = await prisma.document_links.update({
        where: { id: linkId },
        data: { 
          linkMetadata: JSON.stringify(newMetadata),
          lastUpdatedAt: new Date()
        }
      });
      return link;
    } catch (error) {
      console.error("Failed to update link metadata:", error.message);
      return null;
    }
  },

  /**
   * Get links by type across all documents in a workspace
   * @param {number} workspaceId 
   * @param {string} linkType 
   * @returns {Promise<Array>}
   */
  getByType: async function (workspaceId, linkType) {
    try {
      const links = await prisma.document_links.findMany({
        where: { 
          linkType,
          parentDoc: { workspaceId },
          childDoc: { workspaceId }
        },
        include: {
          parentDoc: true,
          childDoc: true
        },
        orderBy: { createdAt: 'desc' }
      });

      return links.map(link => ({
        linkId: link.id,
        linkType: link.linkType,
        linkMetadata: safeJsonParse(link.linkMetadata, {}),
        parentDoc: link.parentDoc,
        childDoc: link.childDoc,
        createdAt: link.createdAt
      }));
    } catch (error) {
      console.error("Failed to get links by type:", error.message);
      return [];
    }
  },

  /**
   * Check if a link already exists between two documents
   * @param {number} parentDocId 
   * @param {number} childDocId 
   * @param {string} linkType 
   * @returns {Promise<object|null>}
   */
  findExistingLink: async function (parentDocId, childDocId, linkType) {
    try {
      const link = await prisma.document_links.findFirst({
        where: {
          parentDocId,
          childDocId,
          linkType
        }
      });
      return link;
    } catch (error) {
      console.error("Failed to find existing link:", error.message);
      return null;
    }
  }
};

module.exports = { DocumentLinks };