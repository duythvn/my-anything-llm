const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Product Model for B2B E-commerce Integration
 * Handles product information, catalog management, and search functionality
 */
const Product = {
  // Create a new product record
  create: async function ({
    sku,
    name,
    description,
    price,
    category,
    specifications = {},
    features = [],
    availability = "in_stock",
    images = [],
    workspaceId = null,
    sourceSystem = null,
    sourceId = null,
    metadata = {},
  }) {
    try {
      const product = await prisma.products.create({
        data: {
          sku: String(sku),
          name: String(name),
          description: description ? String(description) : null,
          price: price ? parseFloat(price) : null,
          category: category ? String(category) : null,
          specifications: JSON.stringify(specifications),
          features: JSON.stringify(features),
          availability: String(availability),
          images: JSON.stringify(images),
          workspaceId: workspaceId ? Number(workspaceId) : null,
          sourceSystem: sourceSystem ? String(sourceSystem) : null,
          sourceId: sourceId ? String(sourceId) : null,
          metadata: JSON.stringify(metadata),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      return { product, message: null };
    } catch (error) {
      console.error("Product creation error:", error);
      return { product: null, message: error.message };
    }
  },

  // Find products by search criteria
  findByQuery: async function (query, workspaceId = null, limit = 10) {
    try {
      const whereClause = {
        OR: [
          { name: { contains: query } },
          { description: { contains: query } },
          { sku: { contains: query } },
          { category: { contains: query } },
        ],
        ...(workspaceId && { workspaceId: Number(workspaceId) }),
      };

      const products = await prisma.products.findMany({
        where: whereClause,
        take: Number(limit),
        orderBy: { updatedAt: "desc" },
      });

      return products.map((product) => ({
        ...product,
        specifications: product.specifications
          ? JSON.parse(product.specifications)
          : {},
        features: product.features ? JSON.parse(product.features) : [],
        images: product.images ? JSON.parse(product.images) : [],
        metadata: product.metadata ? JSON.parse(product.metadata) : {},
      }));
    } catch (error) {
      console.error("Product search error:", error);
      return [];
    }
  },

  // Find product by SKU
  findBySku: async function (sku, workspaceId = null) {
    try {
      const whereClause = {
        sku: String(sku),
        ...(workspaceId && { workspaceId: Number(workspaceId) }),
      };

      const product = await prisma.products.findFirst({
        where: whereClause,
      });

      if (!product) return null;

      return {
        ...product,
        specifications: product.specifications
          ? JSON.parse(product.specifications)
          : {},
        features: product.features ? JSON.parse(product.features) : [],
        images: product.images ? JSON.parse(product.images) : [],
        metadata: product.metadata ? JSON.parse(product.metadata) : {},
      };
    } catch (error) {
      console.error("Product SKU lookup error:", error);
      return null;
    }
  },

  // Get products by category
  findByCategory: async function (category, workspaceId = null, limit = 20) {
    try {
      const whereClause = {
        category: { contains: category },
        ...(workspaceId && { workspaceId: Number(workspaceId) }),
      };

      const products = await prisma.products.findMany({
        where: whereClause,
        take: Number(limit),
        orderBy: { name: "asc" },
      });

      return products.map((product) => ({
        ...product,
        specifications: product.specifications
          ? JSON.parse(product.specifications)
          : {},
        features: product.features ? JSON.parse(product.features) : [],
        images: product.images ? JSON.parse(product.images) : [],
        metadata: product.metadata ? JSON.parse(product.metadata) : {},
      }));
    } catch (error) {
      console.error("Product category search error:", error);
      return [];
    }
  },

  // Update product information
  update: async function (id, updates) {
    try {
      const updateData = { ...updates };

      // Handle JSON fields
      if (updates.specifications) {
        updateData.specifications = JSON.stringify(updates.specifications);
      }
      if (updates.features) {
        updateData.features = JSON.stringify(updates.features);
      }
      if (updates.images) {
        updateData.images = JSON.stringify(updates.images);
      }
      if (updates.metadata) {
        updateData.metadata = JSON.stringify(updates.metadata);
      }

      updateData.updatedAt = new Date();

      const product = await prisma.products.update({
        where: { id: Number(id) },
        data: updateData,
      });

      return { product, message: null };
    } catch (error) {
      console.error("Product update error:", error);
      return { product: null, message: error.message };
    }
  },

  // Delete product
  delete: async function (id) {
    try {
      await prisma.products.delete({
        where: { id: Number(id) },
      });
      return { success: true, message: null };
    } catch (error) {
      console.error("Product deletion error:", error);
      return { success: false, message: error.message };
    }
  },

  // Get all products for a workspace
  findByWorkspace: async function (workspaceId, limit = 100) {
    try {
      const products = await prisma.products.findMany({
        where: { workspaceId: Number(workspaceId) },
        take: Number(limit),
        orderBy: { updatedAt: "desc" },
      });

      return products.map((product) => ({
        ...product,
        specifications: product.specifications
          ? JSON.parse(product.specifications)
          : {},
        features: product.features ? JSON.parse(product.features) : [],
        images: product.images ? JSON.parse(product.images) : [],
        metadata: product.metadata ? JSON.parse(product.metadata) : {},
      }));
    } catch (error) {
      console.error("Workspace products error:", error);
      return [];
    }
  },

  // Bulk import products (for CSV/API imports)
  bulkImport: async function (products, workspaceId = null) {
    try {
      const results = [];
      for (const productData of products) {
        const result = await this.create({
          ...productData,
          workspaceId,
        });
        results.push(result);
      }

      const successful = results.filter((r) => r.product !== null);
      const failed = results.filter((r) => r.product === null);

      return {
        success: true,
        imported: successful.length,
        failed: failed.length,
        errors: failed.map((f) => f.message),
      };
    } catch (error) {
      console.error("Bulk import error:", error);
      return {
        success: false,
        imported: 0,
        failed: products.length,
        errors: [error.message],
      };
    }
  },
};

module.exports = { Product };
