const { Product } = require("../../../models/products");
const { Workspace } = require("../../../models/workspace");
const { validApiKey } = require("../../../utils/middleware/validApiKey");
const { reqBody } = require("../../../utils/http");
const { Telemetry } = require("../../../models/telemetry");
const { EventLogs } = require("../../../models/eventLogs");

function apiProductEndpoints(app) {
  if (!app) return;

  // Create or import products
  app.post("/v1/products", [validApiKey], async (request, response) => {
    /*
    #swagger.tags = ['Products']
    #swagger.description = 'Create a new product or bulk import products'
    #swagger.requestBody = {
      description: 'Product data for creation or array of products for bulk import',
      required: true,
      content: {
        "application/json": {
          examples: {
            "single_product": {
              summary: "Single Product Creation",
              value: {
                sku: "HEADPHONE-001",
                name: "Wireless Bluetooth Headphones",
                description: "High-quality wireless headphones with noise cancellation",
                price: 199.99,
                category: "Electronics",
                specifications: {
                  "battery_life": "30 hours",
                  "connectivity": "Bluetooth 5.0",
                  "weight": "250g"
                },
                features: ["Noise Cancellation", "Quick Charge", "Voice Assistant"],
                availability: "in_stock",
                images: ["https://example.com/headphone1.jpg"],
                workspaceId: 1
              }
            },
            "bulk_import": {
              summary: "Bulk Product Import",
              value: {
                products: [
                  {
                    sku: "LAPTOP-001",
                    name: "Gaming Laptop",
                    price: 1299.99,
                    category: "Computers"
                  },
                  {
                    sku: "MOUSE-001", 
                    name: "Wireless Mouse",
                    price: 49.99,
                    category: "Accessories"
                  }
                ],
                workspaceId: 1
              }
            }
          }
        }
      }
    }
    #swagger.responses[200] = {
      content: {
        "application/json": {
          schema: {
            type: 'object',
            example: {
              success: true,
              product: {
                id: 1,
                sku: "HEADPHONE-001",
                name: "Wireless Bluetooth Headphones",
                price: 199.99
              },
              message: "Product created successfully"
            }
          }
        }
      }
    }
    */
    try {
      const data = reqBody(request);

      // Check if this is bulk import
      if (data.products && Array.isArray(data.products)) {
        const result = await Product.bulkImport(
          data.products,
          data.workspaceId
        );

        await EventLogs.logEvent("api_products_bulk_import", {
          imported: result.imported,
          failed: result.failed,
          workspaceId: data.workspaceId,
        });

        return response.status(200).json(result);
      }

      // Single product creation
      const { product, message } = await Product.create(data);

      if (!product) {
        return response.status(400).json({
          success: false,
          product: null,
          message,
        });
      }

      await EventLogs.logEvent("api_product_created", {
        productId: product.id,
        sku: product.sku,
        workspaceId: product.workspaceId,
      });

      response.status(200).json({
        success: true,
        product,
        message: "Product created successfully",
      });
    } catch (error) {
      console.error("Product creation error:", error);
      response.status(500).json({
        success: false,
        product: null,
        message: error.message,
      });
    }
  });

  // Search products
  app.get("/v1/products/search", [validApiKey], async (request, response) => {
    /*
    #swagger.tags = ['Products']
    #swagger.description = 'Search products by query, category, or workspace'
    #swagger.parameters['q'] = {
      in: 'query',
      description: 'Search query for product name, description, or SKU',
      required: false,
      type: 'string'
    }
    #swagger.parameters['category'] = {
      in: 'query', 
      description: 'Filter by product category',
      required: false,
      type: 'string'
    }
    #swagger.parameters['workspaceId'] = {
      in: 'query',
      description: 'Filter by workspace ID',
      required: false,
      type: 'integer'
    }
    #swagger.parameters['limit'] = {
      in: 'query',
      description: 'Maximum number of results (default: 10)',
      required: false,
      type: 'integer'
    }
    */
    try {
      const { q, category, workspaceId, limit = 10 } = request.query;
      let products = [];

      if (category) {
        products = await Product.findByCategory(
          category,
          workspaceId,
          parseInt(limit)
        );
      } else if (q) {
        products = await Product.findByQuery(q, workspaceId, parseInt(limit));
      } else if (workspaceId) {
        products = await Product.findByWorkspace(
          parseInt(workspaceId),
          parseInt(limit)
        );
      } else {
        return response.status(400).json({
          success: false,
          message:
            "Please provide a search query (q), category, or workspaceId",
        });
      }

      response.status(200).json({
        success: true,
        products,
        count: products.length,
      });
    } catch (error) {
      console.error("Product search error:", error);
      response.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  // Get product by SKU
  app.get("/v1/products/:sku", [validApiKey], async (request, response) => {
    /*
    #swagger.tags = ['Products']
    #swagger.description = 'Get a product by its SKU'
    #swagger.parameters['sku'] = {
      in: 'path',
      description: 'Product SKU',
      required: true,
      type: 'string'
    }
    #swagger.parameters['workspaceId'] = {
      in: 'query',
      description: 'Workspace ID to filter by',
      required: false,
      type: 'integer'
    }
    */
    try {
      const { sku } = request.params;
      const { workspaceId } = request.query;

      const product = await Product.findBySku(
        sku,
        workspaceId ? parseInt(workspaceId) : null
      );

      if (!product) {
        return response.status(404).json({
          success: false,
          product: null,
          message: `Product with SKU ${sku} not found`,
        });
      }

      response.status(200).json({
        success: true,
        product,
      });
    } catch (error) {
      console.error("Product lookup error:", error);
      response.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  // Update product
  app.put("/v1/products/:id", [validApiKey], async (request, response) => {
    /*
    #swagger.tags = ['Products'] 
    #swagger.description = 'Update a product by ID'
    #swagger.parameters['id'] = {
      in: 'path',
      description: 'Product ID',
      required: true,
      type: 'integer'
    }
    */
    try {
      const { id } = request.params;
      const updates = reqBody(request);

      const { product, message } = await Product.update(parseInt(id), updates);

      if (!product) {
        return response.status(400).json({
          success: false,
          product: null,
          message,
        });
      }

      await EventLogs.logEvent("api_product_updated", {
        productId: product.id,
        sku: product.sku,
      });

      response.status(200).json({
        success: true,
        product,
        message: "Product updated successfully",
      });
    } catch (error) {
      console.error("Product update error:", error);
      response.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  // Delete product
  app.delete("/v1/products/:id", [validApiKey], async (request, response) => {
    /*
    #swagger.tags = ['Products']
    #swagger.description = 'Delete a product by ID'
    #swagger.parameters['id'] = {
      in: 'path',
      description: 'Product ID',
      required: true,
      type: 'integer'
    }
    */
    try {
      const { id } = request.params;

      const { success, message } = await Product.delete(parseInt(id));

      if (!success) {
        return response.status(400).json({
          success: false,
          message,
        });
      }

      await EventLogs.logEvent("api_product_deleted", {
        productId: parseInt(id),
      });

      response.status(200).json({
        success: true,
        message: "Product deleted successfully",
      });
    } catch (error) {
      console.error("Product deletion error:", error);
      response.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  // Get workspace products
  app.get(
    "/v1/workspace/:slug/products",
    [validApiKey],
    async (request, response) => {
      /*
    #swagger.tags = ['Products']
    #swagger.description = 'Get all products for a specific workspace'
    #swagger.parameters['slug'] = {
      in: 'path',
      description: 'Workspace slug',
      required: true,
      type: 'string'
    }
    #swagger.parameters['limit'] = {
      in: 'query',
      description: 'Maximum number of results (default: 100)',
      required: false,
      type: 'integer'
    }
    */
      try {
        const { slug } = request.params;
        const { limit = 100 } = request.query;

        const workspace = await Workspace.get({ slug });
        if (!workspace) {
          return response.status(404).json({
            success: false,
            message: `Workspace ${slug} not found`,
          });
        }

        const products = await Product.findByWorkspace(
          workspace.id,
          parseInt(limit)
        );

        response.status(200).json({
          success: true,
          products,
          count: products.length,
          workspaceId: workspace.id,
        });
      } catch (error) {
        console.error("Workspace products error:", error);
        response.status(500).json({
          success: false,
          message: error.message,
        });
      }
    }
  );
}

module.exports = { apiProductEndpoints };
