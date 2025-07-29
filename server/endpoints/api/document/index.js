const { Telemetry } = require("../../../models/telemetry");
const { validApiKey } = require("../../../utils/middleware/validApiKey");
const { handleAPIFileUpload } = require("../../../utils/files/multer");
const {
  viewLocalFiles,
  findDocumentInDocuments,
  getDocumentsByFolder,
  normalizePath,
  isWithin,
} = require("../../../utils/files");
const { reqBody } = require("../../../utils/http");
const { EventLogs } = require("../../../models/eventLogs");
const { CollectorApi } = require("../../../utils/collectorApi");
const fs = require("fs");
const path = require("path");
const { Document } = require("../../../models/documents");
const { purgeFolder } = require("../../../utils/files/purgeDocument");
const documentsPath =
  process.env.NODE_ENV === "development"
    ? path.resolve(__dirname, "../../../storage/documents")
    : path.resolve(
        process.env.STORAGE_DIR || path.resolve(__dirname, "../../../storage"),
        `documents`
      );

function apiDocumentEndpoints(app) {
  if (!app) return;

  app.post(
    "/v1/document/upload",
    [validApiKey, handleAPIFileUpload],
    async (request, response) => {
      /*
    #swagger.tags = ['Documents']
    #swagger.description = 'Upload a new file to AnythingLLM to be parsed and prepared for embedding with enhanced multi-source support.'
    #swagger.requestBody = {
      description: 'File to be uploaded with optional source metadata.',
      required: true,
      content: {
        "multipart/form-data": {
          schema: {
            type: 'object',
            required: ['file'],
            properties: {
              file: {
                type: 'string',
                format: 'binary',
                description: 'The file to upload'
              },
              addToWorkspaces: {
                type: 'string',
                description: 'comma-separated text-string of workspace slugs to embed the document into post-upload. eg: workspace1,workspace2',
              },
              sourceType: {
                type: 'string',
                description: 'Type of source: manual_upload, api_sync, google_drive, csv_product, json_catalog, pdf_link, faq_extraction',
                default: 'api_upload'
              },
              sourceUrl: {
                type: 'string',
                description: 'Original URL or location of the document'
              },
              category: {
                type: 'string',
                description: 'Document category for filtering and organization'
              },
              priority: {
                type: 'integer',
                description: 'Priority level: 0=normal, 1=high, 2=critical',
                default: 0
              },
              syncEnabled: {
                type: 'boolean',
                description: 'Enable automatic sync for this document',
                default: false
              },
              syncSchedule: {
                type: 'string',
                description: 'Cron-like schedule for syncing (e.g., "0 9 * * *" for daily at 9am)'
              },
              businessContext: {
                type: 'string',
                description: 'JSON string with business context metadata'
              }
            },
            required: ['file']
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
              error: null,
              documents: [
                {
                  "location": "custom-documents/anythingllm.txt-6e8be64c-c162-4b43-9997-b068c0071e8b.json",
                  "name": "anythingllm.txt-6e8be64c-c162-4b43-9997-b068c0071e8b.json",
                  "url": "file:///Users/tim/Documents/anything-llm/collector/hotdir/anythingllm.txt",
                  "title": "anythingllm.txt",
                  "docAuthor": "Unknown",
                  "description": "Unknown",
                  "docSource": "a text file uploaded by the user.",
                  "chunkSource": "anythingllm.txt",
                  "published": "1/16/2024, 3:07:00 PM",
                  "wordCount": 93,
                  "token_count_estimate": 115,
                }
              ]
            }
          }
        }
      }
    }
    #swagger.responses[403] = {
      schema: {
        "$ref": "#/definitions/InvalidAPIKey"
      }
    }
    */
      try {
        const Collector = new CollectorApi();
        const { originalname } = request.file;
        const { 
          addToWorkspaces = "",
          sourceType = "api_upload",
          sourceUrl = null,
          category = null,
          priority = 0,
          syncEnabled = false,
          syncSchedule = null,
          businessContext = null
        } = reqBody(request);
        
        const processingOnline = await Collector.online();

        if (!processingOnline) {
          response
            .status(500)
            .json({
              success: false,
              error: `Document processing API is not online. Document ${originalname} will not be processed automatically.`,
            })
            .end();
          return;
        }

        // Process document with enhanced metadata
        const { success, reason, documents } =
          await Collector.processDocument(originalname, {
            sourceType,
            sourceUrl,
            category,
            priority: parseInt(priority) || 0,
            businessContext: businessContext ? JSON.parse(businessContext) : null
          });
          
        if (!success) {
          response
            .status(500)
            .json({ success: false, error: reason, documents })
            .end();
          return;
        }

        Collector.log(
          `Document ${originalname} uploaded, processed and successfully embedded with source type: ${sourceType}. It is now available in documents.`
        );
        
        await Telemetry.sendTelemetry("document_uploaded", {
          sourceType,
          category: category || "uncategorized",
          hasBusinessContext: !!businessContext
        });
        
        await EventLogs.logEvent("api_document_uploaded", {
          documentName: originalname,
          sourceType,
          sourceUrl,
          category,
          priority,
          syncEnabled
        });

        // Handle workspace embedding with enhanced metadata
        if (!!addToWorkspaces) {
          const uploadResult = await Document.api.uploadToWorkspace(
            addToWorkspaces,
            documents?.[0].location,
            {
              sourceType,
              sourceUrl,
              category,
              priority,
              syncEnabled,
              syncSchedule,
              businessContext
            }
          );
          
          if (!uploadResult) {
            console.warn(`Failed to embed document ${originalname} into workspaces: ${addToWorkspaces}`);
          }
        }
        
        response.status(200).json({ 
          success: true, 
          error: null, 
          documents: documents.map(doc => ({
            ...doc,
            sourceType,
            category,
            priority
          }))
        });
      } catch (e) {
        console.error("Enhanced document upload error:", e.message, e);
        response.status(500).json({
          success: false,
          error: `Failed to process document: ${e.message}`
        }).end();
      }
    }
  );

  app.post(
    "/v1/document/upload/:folderName",
    [validApiKey, handleAPIFileUpload],
    async (request, response) => {
      /*
      #swagger.tags = ['Documents']
      #swagger.description = 'Upload a new file to a specific folder in AnythingLLM to be parsed and prepared for embedding. If the folder does not exist, it will be created.'
      #swagger.parameters['folderName'] = {
        in: 'path',
        description: 'Target folder path (defaults to \"custom-documents\" if not provided)',
        required: true,
        type: 'string',
        example: 'my-folder'
      }
      #swagger.requestBody = {
        description: 'File to be uploaded.',
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: 'object',
              required: ['file'],
              properties: {
                file: {
                  type: 'string',
                  format: 'binary',
                  description: 'The file to upload'
                },
                addToWorkspaces: {
                  type: 'string',
                  description: 'comma-separated text-string of workspace slugs to embed the document into post-upload. eg: workspace1,workspace2',
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
                error: null,
                documents: [{
                  "location": "custom-documents/anythingllm.txt-6e8be64c-c162-4b43-9997-b068c0071e8b.json",
                  "name": "anythingllm.txt-6e8be64c-c162-4b43-9997-b068c0071e8b.json",
                  "url": "file:///Users/tim/Documents/anything-llm/collector/hotdir/anythingllm.txt",
                  "title": "anythingllm.txt",
                  "docAuthor": "Unknown",
                  "description": "Unknown",
                  "docSource": "a text file uploaded by the user.",
                  "chunkSource": "anythingllm.txt",
                  "published": "1/16/2024, 3:07:00 PM",
                  "wordCount": 93,
                  "token_count_estimate": 115
                }]
              }
            }
          }
        }
      }
      #swagger.responses[403] = {
        schema: {
          "$ref": "#/definitions/InvalidAPIKey"
        }
      }
      #swagger.responses[500] = {
        description: "Internal Server Error",
        content: {
          "application/json": {
            schema: {
              type: 'object',
              example: {
                success: false,
                error: "Document processing API is not online. Document will not be processed automatically."
              }
            }
          }
        }
      }
      */
      try {
        const { originalname } = request.file;
        const { addToWorkspaces = "" } = reqBody(request);
        let folder = request.params?.folderName || "custom-documents";
        folder = normalizePath(folder);
        const targetFolderPath = path.join(documentsPath, folder);

        if (
          !isWithin(path.resolve(documentsPath), path.resolve(targetFolderPath))
        )
          throw new Error("Invalid folder name");
        if (!fs.existsSync(targetFolderPath))
          fs.mkdirSync(targetFolderPath, { recursive: true });

        const Collector = new CollectorApi();
        const processingOnline = await Collector.online();
        if (!processingOnline) {
          response
            .status(500)
            .json({
              success: false,
              error: `Document processing API is not online. Document ${originalname} will not be processed automatically.`,
            })
            .end();
          return;
        }

        // Process the uploaded document
        const { success, reason, documents } =
          await Collector.processDocument(originalname);
        if (!success) {
          response
            .status(500)
            .json({ success: false, error: reason, documents })
            .end();
          return;
        }

        // For each processed document, check if it is already in the desired folder.
        // If not, move it using similar logic as in the move-files endpoint.
        for (const doc of documents) {
          const currentFolder = path.dirname(doc.location);
          if (currentFolder !== folder) {
            const sourcePath = path.join(
              documentsPath,
              normalizePath(doc.location)
            );
            const destinationPath = path.join(
              targetFolderPath,
              path.basename(doc.location)
            );

            if (
              !isWithin(documentsPath, sourcePath) ||
              !isWithin(documentsPath, destinationPath)
            )
              throw new Error("Invalid file location");

            fs.renameSync(sourcePath, destinationPath);
            doc.location = path.join(folder, path.basename(doc.location));
            doc.name = path.basename(doc.location);
          }
        }

        Collector.log(
          `Document ${originalname} uploaded, processed, and moved to folder ${folder} successfully.`
        );

        await Telemetry.sendTelemetry("document_uploaded");
        await EventLogs.logEvent("api_document_uploaded", {
          documentName: originalname,
          folder,
        });

        if (!!addToWorkspaces)
          await Document.api.uploadToWorkspace(
            addToWorkspaces,
            documents?.[0].location
          );
        response.status(200).json({ success: true, error: null, documents });
      } catch (e) {
        console.error(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );

  app.post(
    "/v1/document/upload-link",
    [validApiKey],
    async (request, response) => {
      /*
    #swagger.tags = ['Documents']
    #swagger.description = 'Upload a valid URL for AnythingLLM to scrape and prepare for embedding. Optionally, specify a comma-separated list of workspace slugs to embed the document into post-upload.'
    #swagger.requestBody = {
      description: 'Link of web address to be scraped and optionally a comma-separated list of workspace slugs to embed the document into post-upload.',
      required: true,
      content: {
          "application/json": {
            schema: {
              type: 'object',
              example: {
                "link": "https://anythingllm.com",
                "addToWorkspaces": "workspace1,workspace2",
                "scraperHeaders": {
                  "Authorization": "Bearer token123",
                  "My-Custom-Header": "value"
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
              error: null,
              documents: [
                {
                  "id": "c530dbe6-bff1-4b9e-b87f-710d539d20bc",
                  "url": "file://useanything_com.html",
                  "title": "useanything_com.html",
                  "docAuthor": "no author found",
                  "description": "No description found.",
                  "docSource": "URL link uploaded by the user.",
                  "chunkSource": "https:anythingllm.com.html",
                  "published": "1/16/2024, 3:46:33 PM",
                  "wordCount": 252,
                  "pageContent": "AnythingLLM is the best....",
                  "token_count_estimate": 447,
                  "location": "custom-documents/url-useanything_com-c530dbe6-bff1-4b9e-b87f-710d539d20bc.json"
                }
              ]
            }
          }
        }
      }
    }
    #swagger.responses[403] = {
      schema: {
        "$ref": "#/definitions/InvalidAPIKey"
      }
    }
    */
      try {
        const Collector = new CollectorApi();
        const {
          link,
          addToWorkspaces = "",
          scraperHeaders = {},
        } = reqBody(request);
        const processingOnline = await Collector.online();

        if (!processingOnline) {
          response
            .status(500)
            .json({
              success: false,
              error: `Document processing API is not online. Link ${link} will not be processed automatically.`,
            })
            .end();
          return;
        }

        const { success, reason, documents } = await Collector.processLink(
          link,
          scraperHeaders
        );
        if (!success) {
          response
            .status(500)
            .json({ success: false, error: reason, documents })
            .end();
          return;
        }

        Collector.log(
          `Link ${link} uploaded processed and successfully. It is now available in documents.`
        );
        await Telemetry.sendTelemetry("link_uploaded");
        await EventLogs.logEvent("api_link_uploaded", {
          link,
        });

        if (!!addToWorkspaces)
          await Document.api.uploadToWorkspace(
            addToWorkspaces,
            documents?.[0].location
          );
        response.status(200).json({ success: true, error: null, documents });
      } catch (e) {
        console.error(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );

  app.post(
    "/v1/document/raw-text",
    [validApiKey],
    async (request, response) => {
      /*
     #swagger.tags = ['Documents']
     #swagger.description = 'Upload a file by specifying its raw text content and metadata values without having to upload a file.'
     #swagger.requestBody = {
      description: 'Text content and metadata of the file to be saved to the system. Use metadata-schema endpoint to get the possible metadata keys',
      required: true,
      content: {
        "application/json": {
          schema: {
            type: 'object',
            example: {
              "textContent": "This is the raw text that will be saved as a document in AnythingLLM.",
              "addToWorkspaces": "workspace1,workspace2",
              "metadata": {
                "title": "This key is required. See in /server/endpoints/api/document/index.js:287",
                "keyOne": "valueOne",
                "keyTwo": "valueTwo",
                "etc": "etc"
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
              error: null,
              documents: [
                {
                  "id": "c530dbe6-bff1-4b9e-b87f-710d539d20bc",
                  "url": "file://my-document.txt",
                  "title": "hello-world.txt",
                  "docAuthor": "no author found",
                  "description": "No description found.",
                  "docSource": "My custom description set during upload",
                  "chunkSource": "no chunk source specified",
                  "published": "1/16/2024, 3:46:33 PM",
                  "wordCount": 252,
                  "pageContent": "AnythingLLM is the best....",
                  "token_count_estimate": 447,
                  "location": "custom-documents/raw-my-doc-text-c530dbe6-bff1-4b9e-b87f-710d539d20bc.json"
                }
              ]
            }
          }
        }
      }
     }
     #swagger.responses[403] = {
       schema: {
         "$ref": "#/definitions/InvalidAPIKey"
       }
     }
     */
      try {
        const Collector = new CollectorApi();
        const requiredMetadata = ["title"];
        const {
          textContent,
          metadata = {},
          addToWorkspaces = "",
        } = reqBody(request);
        const processingOnline = await Collector.online();

        if (!processingOnline) {
          response
            .status(500)
            .json({
              success: false,
              error: `Document processing API is not online. Request will not be processed.`,
            })
            .end();
          return;
        }

        if (
          !requiredMetadata.every(
            (reqKey) =>
              Object.keys(metadata).includes(reqKey) && !!metadata[reqKey]
          )
        ) {
          response
            .status(422)
            .json({
              success: false,
              error: `You are missing required metadata key:value pairs in your request. Required metadata key:values are ${requiredMetadata
                .map((v) => `'${v}'`)
                .join(", ")}`,
            })
            .end();
          return;
        }

        if (!textContent || textContent?.length === 0) {
          response
            .status(422)
            .json({
              success: false,
              error: `The 'textContent' key cannot have an empty value.`,
            })
            .end();
          return;
        }

        const { success, reason, documents } = await Collector.processRawText(
          textContent,
          metadata
        );
        if (!success) {
          response
            .status(500)
            .json({ success: false, error: reason, documents })
            .end();
          return;
        }

        Collector.log(
          `Document created successfully. It is now available in documents.`
        );
        await Telemetry.sendTelemetry("raw_document_uploaded");
        await EventLogs.logEvent("api_raw_document_uploaded");

        if (!!addToWorkspaces)
          await Document.api.uploadToWorkspace(
            addToWorkspaces,
            documents?.[0].location
          );
        response.status(200).json({ success: true, error: null, documents });
      } catch (e) {
        console.error(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );

  app.get("/v1/documents", [validApiKey], async (_, response) => {
    /*
    #swagger.tags = ['Documents']
    #swagger.description = 'List of all locally-stored documents in instance'
    #swagger.responses[200] = {
      content: {
        "application/json": {
          schema: {
            type: 'object',
            example: {
             "localFiles": {
              "name": "documents",
              "type": "folder",
              items: [
                {
                  "name": "my-stored-document.json",
                  "type": "file",
                  "id": "bb07c334-4dab-4419-9462-9d00065a49a1",
                  "url": "file://my-stored-document.txt",
                  "title": "my-stored-document.txt",
                  "cached": false
                },
              ]
             }
            }
          }
        }
      }
    }
    #swagger.responses[403] = {
      schema: {
        "$ref": "#/definitions/InvalidAPIKey"
      }
    }
    */
    try {
      const localFiles = await viewLocalFiles();
      response.status(200).json({ localFiles });
    } catch (e) {
      console.error(e.message, e);
      response.sendStatus(500).end();
    }
  });

  app.get(
    "/v1/documents/folder/:folderName",
    [validApiKey],
    async (request, response) => {
      /*
    #swagger.tags = ['Documents']
    #swagger.description = 'Get all documents stored in a specific folder.'
    #swagger.parameters['folderName'] = {
      in: 'path',
      description: 'Name of the folder to retrieve documents from',
      required: true,
      type: 'string'
    }
    #swagger.responses[200] = {
      content: {
        "application/json": {
          schema: {
            type: 'object',
            example: {
              folder: "custom-documents",
              documents: [
                {
                  name: "document1.json",
                  type: "file",
                  cached: false,
                  pinnedWorkspaces: [],
                  watched: false,
                  more: "data",
                },
                {
                  name: "document2.json",
                  type: "file",
                  cached: false,
                  pinnedWorkspaces: [],
                  watched: false,
                  more: "data",
                },
              ]
            }
          }
        }
      }
    }
    #swagger.responses[403] = {
      schema: {
        "$ref": "#/definitions/InvalidAPIKey"
      }
    }
    */
      try {
        const { folderName } = request.params;
        const result = await getDocumentsByFolder(folderName);
        response.status(200).json(result);
      } catch (e) {
        console.error(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );

  app.get(
    "/v1/document/accepted-file-types",
    [validApiKey],
    async (_, response) => {
      /*
    #swagger.tags = ['Documents']
    #swagger.description = 'Check available filetypes and MIMEs that can be uploaded.'
    #swagger.responses[200] = {
      content: {
        "application/json": {
          schema: {
            type: 'object',
            example: {
              "types": {
                "application/mbox": [
                  ".mbox"
                ],
                "application/pdf": [
                  ".pdf"
                ],
                "application/vnd.oasis.opendocument.text": [
                  ".odt"
                ],
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
                  ".docx"
                ],
                "text/plain": [
                  ".txt",
                  ".md"
                ]
              }
            }
          }
        }
      }
    }
    #swagger.responses[403] = {
      schema: {
        "$ref": "#/definitions/InvalidAPIKey"
      }
    }
    */
      try {
        const types = await new CollectorApi().acceptedFileTypes();
        if (!types) {
          response.sendStatus(404).end();
          return;
        }

        response.status(200).json({ types });
      } catch (e) {
        console.error(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );

  app.get(
    "/v1/document/metadata-schema",
    [validApiKey],
    async (_, response) => {
      /*
    #swagger.tags = ['Documents']
    #swagger.description = 'Get the known available metadata schema for when doing a raw-text upload and the acceptable type of value for each key.'
    #swagger.responses[200] = {
      content: {
        "application/json": {
          schema: {
            type: 'object',
            example: {
             "schema": {
                "keyOne": "string | number | nullable",
                "keyTwo": "string | number | nullable",
                "specialKey": "number",
                "title": "string",
              }
            }
          }
        }
      }
    }
    #swagger.responses[403] = {
      schema: {
        "$ref": "#/definitions/InvalidAPIKey"
      }
    }
    */
      try {
        response.status(200).json({
          schema: {
            // If you are updating this be sure to update the collector METADATA_KEYS constant in /processRawText.
            url: "string | nullable",
            title: "string",
            docAuthor: "string | nullable",
            description: "string | nullable",
            docSource: "string | nullable",
            chunkSource: "string | nullable",
            published: "epoch timestamp in ms | nullable",
          },
        });
      } catch (e) {
        console.error(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );

  // Be careful and place as last route to prevent override of the other /document/ GET
  // endpoints!
  app.get("/v1/document/:docName", [validApiKey], async (request, response) => {
    /*
    #swagger.tags = ['Documents']
    #swagger.description = 'Get a single document by its unique AnythingLLM document name'
    #swagger.parameters['docName'] = {
        in: 'path',
        description: 'Unique document name to find (name in /documents)',
        required: true,
        type: 'string'
    }
    #swagger.responses[200] = {
      content: {
        "application/json": {
          schema: {
            type: 'object',
            example: {
             "localFiles": {
              "name": "documents",
              "type": "folder",
              items: [
                {
                  "name": "my-stored-document.txt-uuid1234.json",
                  "type": "file",
                  "id": "bb07c334-4dab-4419-9462-9d00065a49a1",
                  "url": "file://my-stored-document.txt",
                  "title": "my-stored-document.txt",
                  "cached": false
                },
              ]
             }
            }
          }
        }
      }
    }
    #swagger.responses[403] = {
      schema: {
        "$ref": "#/definitions/InvalidAPIKey"
      }
    }
    */
    try {
      const { docName } = request.params;
      const document = await findDocumentInDocuments(docName);
      if (!document) {
        response.sendStatus(404).end();
        return;
      }
      response.status(200).json({ document });
    } catch (e) {
      console.error(e.message, e);
      response.sendStatus(500).end();
    }
  });

  app.post(
    "/v1/document/create-folder",
    [validApiKey],
    async (request, response) => {
      /*
      #swagger.tags = ['Documents']
      #swagger.description = 'Create a new folder inside the documents storage directory.'
      #swagger.requestBody = {
        description: 'Name of the folder to create.',
        required: true,
        content: {
          "application/json": {
            schema: {
              type: 'string',
              example: {
                "name": "new-folder"
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
                message: null
              }
            }
          }
        }
      }
      #swagger.responses[403] = {
        schema: {
          "$ref": "#/definitions/InvalidAPIKey"
        }
      }
      */
      try {
        const { name } = reqBody(request);
        const storagePath = path.join(documentsPath, normalizePath(name));
        if (!isWithin(path.resolve(documentsPath), path.resolve(storagePath)))
          throw new Error("Invalid path name");

        if (fs.existsSync(storagePath)) {
          response.status(500).json({
            success: false,
            message: "Folder by that name already exists",
          });
          return;
        }

        fs.mkdirSync(storagePath, { recursive: true });
        response.status(200).json({ success: true, message: null });
      } catch (e) {
        console.error(e);
        response.status(500).json({
          success: false,
          message: `Failed to create folder: ${e.message}`,
        });
      }
    }
  );

  app.delete(
    "/v1/document/remove-folder",
    [validApiKey],
    async (request, response) => {
      /*
      #swagger.tags = ['Documents']
      #swagger.description = 'Remove a folder and all its contents from the documents storage directory.'
      #swagger.requestBody = {
        description: 'Name of the folder to remove.',
        required: true,
        content: {
          "application/json": {
            schema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  example: "my-folder"
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
                message: "Folder removed successfully"
              }
            }
          }
        }
      }
      #swagger.responses[403] = {
        schema: {
          "$ref": "#/definitions/InvalidAPIKey"
        }
      }
      */
      try {
        const { name } = reqBody(request);
        await purgeFolder(name);
        response
          .status(200)
          .json({ success: true, message: "Folder removed successfully" });
      } catch (e) {
        console.error(e);
        response.status(500).json({
          success: false,
          message: `Failed to remove folder: ${e.message}`,
        });
      }
    }
  );

  app.post(
    "/v1/document/move-files",
    [validApiKey],
    async (request, response) => {
      /*
      #swagger.tags = ['Documents']
      #swagger.description = 'Move files within the documents storage directory.'
      #swagger.requestBody = {
        description: 'Array of objects containing source and destination paths of files to move.',
        required: true,
        content: {
          "application/json": {
            schema: {
              type: 'object',
              example: {
                "files": [
                  {
                    "from": "custom-documents/file.txt-fc4beeeb-e436-454d-8bb4-e5b8979cb48f.json",
                    "to": "folder/file.txt-fc4beeeb-e436-454d-8bb4-e5b8979cb48f.json"
                  }
                ]
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
                message: null
              }
            }
          }
        }
      }
      #swagger.responses[403] = {
        schema: {
          "$ref": "#/definitions/InvalidAPIKey"
        }
      }
      */
      try {
        const { files } = reqBody(request);
        const docpaths = files.map(({ from }) => from);
        const documents = await Document.where({ docpath: { in: docpaths } });
        const embeddedFiles = documents.map((doc) => doc.docpath);
        const moveableFiles = files.filter(
          ({ from }) => !embeddedFiles.includes(from)
        );
        const movePromises = moveableFiles.map(({ from, to }) => {
          const sourcePath = path.join(documentsPath, normalizePath(from));
          const destinationPath = path.join(documentsPath, normalizePath(to));
          return new Promise((resolve, reject) => {
            if (
              !isWithin(documentsPath, sourcePath) ||
              !isWithin(documentsPath, destinationPath)
            )
              return reject("Invalid file location");

            fs.rename(sourcePath, destinationPath, (err) => {
              if (err) {
                console.error(`Error moving file ${from} to ${to}:`, err);
                reject(err);
              } else {
                resolve();
              }
            });
          });
        });
        Promise.all(movePromises)
          .then(() => {
            const unmovableCount = files.length - moveableFiles.length;
            if (unmovableCount > 0) {
              response.status(200).json({
                success: true,
                message: `${unmovableCount}/${files.length} files not moved. Unembed them from all workspaces.`,
              });
            } else {
              response.status(200).json({
                success: true,
                message: null,
              });
            }
          })
          .catch((err) => {
            console.error("Error moving files:", err);
            response
              .status(500)
              .json({ success: false, message: "Failed to move some files." });
          });
      } catch (e) {
        console.error(e);
        response
          .status(500)
          .json({ success: false, message: "Failed to move files." });
      }
    }
  );

  // Phase 1.2: Product Catalog Upload Endpoint
  app.post(
    "/v1/document/upload-catalog",
    [validApiKey, handleAPIFileUpload],
    async (request, response) => {
      /*
      #swagger.tags = ['Documents - Phase 1.2']
      #swagger.description = 'Upload and process product catalog CSV or JSON files with structured data extraction'
      #swagger.requestBody = {
        description: 'Product catalog file (CSV or JSON) with optional configuration',
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: 'object',
              required: ['file'],
              properties: {
                file: {
                  type: 'string',
                  format: 'binary',
                  description: 'CSV or JSON catalog file'
                },
                addToWorkspaces: {
                  type: 'string',
                  description: 'Comma-separated workspace slugs'
                },
                catalogType: {
                  type: 'string',
                  enum: ['csv', 'json'],
                  description: 'Type of catalog file'
                },
                category: {
                  type: 'string',
                  description: 'Product category',
                  default: 'product_catalog'
                },
                fieldMappings: {
                  type: 'string',
                  description: 'JSON string with custom field mappings'
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
                productsProcessed: 150,
                documentsCreated: 5,
                errors: []
              }
            }
          }
        }
      }
      */
      try {
        const { originalname, buffer } = request.file;
        const { 
          addToWorkspaces = "",
          catalogType = null,
          category = "product_catalog",
          fieldMappings = null
        } = reqBody(request);

        // Determine file type
        const fileType = catalogType || (originalname.endsWith('.csv') ? 'csv' : 'json');
        
        if (!['csv', 'json'].includes(fileType)) {
          return response.status(400).json({
            success: false,
            error: 'Only CSV and JSON catalog files are supported'
          });
        }

        // Parse custom field mappings if provided
        let parsedFieldMappings = {};
        if (fieldMappings) {
          try {
            parsedFieldMappings = JSON.parse(fieldMappings);
          } catch (error) {
            return response.status(400).json({
              success: false,
              error: 'Invalid field mappings JSON format'
            });
          }
        }

        // Process catalog file
        let parseResult;
        if (fileType === 'csv') {
          const { CSVProductParser } = require('../../../utils/files/parsers/csvProductParser');
          const parser = new CSVProductParser({ 
            columnMappings: parsedFieldMappings,
            maxRows: 10000
          });
          parseResult = await parser.parseFromData(buffer);
        } else {
          const { JSONProductParser } = require('../../../utils/files/parsers/jsonProductParser');
          const parser = new JSONProductParser({
            fieldMappings: parsedFieldMappings,
            maxProducts: 10000
          });
          parseResult = await parser.parseFromString(buffer.toString());
        }

        if (!parseResult.success) {
          return response.status(500).json({
            success: false,
            error: 'Failed to parse catalog file',
            details: parseResult.error,
            parseErrors: parseResult.errors || []
          });
        }

        const { products } = parseResult;
        
        if (products.length === 0) {
          return response.status(400).json({
            success: false,
            error: 'No valid products found in catalog file'
          });
        }

        // Convert products to document chunks for embedding
        const documents = [];
        products.forEach((product, index) => {
          let content = `Product: ${product.name}`;
          if (product.sku) content += ` (SKU: ${product.sku})`;
          if (product.category) content += `\nCategory: ${product.category}`;
          if (product.description) content += `\nDescription: ${product.description}`;
          if (product.price) content += `\nPrice: $${product.price}`;
          content += `\nAvailability: ${product.availability}`;

          if (product.specifications) {
            content += '\nSpecifications:\n';
            if (typeof product.specifications === 'object') {
              for (const [key, value] of Object.entries(product.specifications)) {
                content += `- ${key}: ${value}\n`;
              }
            }
          }

          documents.push({
            title: product.name,
            pageContent: content,
            docSource: `Product catalog: ${originalname}`,
            chunkSource: `product_${product.sku || index}`,
            metadata: {
              sku: product.sku,
              category: product.category,
              price: product.price,
              availability: product.availability,
              sourceType: 'product_catalog',
              catalogFile: originalname
            }
          });
        });

        // Save and embed documents if workspaces specified
        const results = {
          success: true,
          productsProcessed: products.length,
          documentsCreated: documents.length,
          errors: parseResult.errors || [],
          workspaceResults: {}
        };

        if (addToWorkspaces) {
          const { Workspace } = require('../../../models/workspace');
          const slugs = addToWorkspaces.split(',').map(s => s.trim().toLowerCase());
          const workspaces = await Workspace.where({ slug: { in: slugs } });

          for (const workspace of workspaces) {
            try {
              // Create temporary files for each document chunk and embed them
              const fs = require('fs');
              const path = require('path');
              const tempDir = path.join(documentsPath, 'temp_catalogs');
              
              if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
              }

              const catalogFiles = [];
              for (let i = 0; i < documents.length; i++) {
                const doc = documents[i];
                const tempFile = path.join(tempDir, `${originalname}_product_${i}.json`);
                
                fs.writeFileSync(tempFile, JSON.stringify(doc, null, 2));
                catalogFiles.push(tempFile.replace(documentsPath + '/', ''));
              }

              const embedResult = await Document.addDocuments(
                workspace,
                catalogFiles,
                null,
                {
                  sourceType: 'product_catalog',
                  category,
                  priority: 1,
                  businessContext: {
                    catalog_file: originalname,
                    total_products: products.length
                  }
                }
              );

              results.workspaceResults[workspace.slug] = {
                embedded: embedResult.embedded.length,
                failed: embedResult.failedToEmbed.length,
                errors: embedResult.errors
              };

              // Clean up temp files
              catalogFiles.forEach(file => {
                try {
                  fs.unlinkSync(path.join(documentsPath, file));
                } catch (e) {
                  console.warn(`Failed to cleanup temp file: ${file}`);
                }
              });

            } catch (error) {
              console.error(`Failed to process catalog for workspace ${workspace.slug}:`, error);
              results.workspaceResults[workspace.slug] = {
                embedded: 0,
                failed: documents.length,
                errors: [error.message]
              };
            }
          }
        }

        await EventLogs.logEvent("product_catalog_uploaded", {
          catalogFile: originalname,
          catalogType: fileType,
          productsProcessed: products.length,
          workspaces: addToWorkspaces || 'none'
        });

        response.status(200).json(results);

      } catch (error) {
        console.error("Product catalog upload error:", error);
        response.status(500).json({
          success: false,
          error: `Failed to process product catalog: ${error.message}`
        });
      }
    }
  );

  // Phase 1.2: PDF Link Extraction and Download Endpoint
  app.post(
    "/v1/document/extract-links",
    [validApiKey, handleAPIFileUpload],
    async (request, response) => {
      /*
      #swagger.tags = ['Documents - Phase 1.2']
      #swagger.description = 'Extract PDF links from Excel/CSV files and queue them for automatic download'
      #swagger.requestBody = {
        description: 'Excel or CSV file containing PDF links',
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: 'object',
              required: ['file'],
              properties: {
                file: {
                  type: 'string',
                  format: 'binary',
                  description: 'Excel (.xlsx, .xls) or CSV file'
                },
                addToWorkspaces: {
                  type: 'string',
                  description: 'Comma-separated workspace slugs for extracted PDFs'
                },
                parentDocId: {
                  type: 'integer',
                  description: 'ID of parent document to link extracted PDFs'
                },
                autoDownload: {
                  type: 'boolean',
                  description: 'Automatically download and process found PDFs',
                  default: true
                },
                confidenceThreshold: {
                  type: 'number',
                  description: 'Minimum confidence score for link extraction (0.0-1.0)',
                  default: 0.5
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
                linksExtracted: 25,
                linksQueued: 20,
                downloadJobs: ["job123", "job456"],
                lowConfidenceLinks: 5
              }
            }
          }
        }
      }
      */
      try {
        const { originalname, buffer } = request.file;
        const { 
          addToWorkspaces = "",
          parentDocId = null,
          autoDownload = true,
          confidenceThreshold = 0.5
        } = reqBody(request);

        // Determine file type
        const fileExtension = path.extname(originalname).toLowerCase();
        let fileType;
        
        if (['.xlsx', '.xls'].includes(fileExtension)) {
          fileType = 'excel';
        } else if (fileExtension === '.csv') {
          fileType = 'csv';
        } else {
          return response.status(400).json({
            success: false,
            error: 'Only Excel (.xlsx, .xls) and CSV files are supported'
          });
        }

        // Extract links from the file
        const { LinkExtractor } = require('../../../utils/files/parsers/linkExtractor');
        const extractor = new LinkExtractor({
          maxUrls: 1000,
          // Focus on PDF links for Phase 1.2
          urlPatterns: [/https?:\/\/[^\s]+\.pdf(\?[^\s]*)?/gi]
        });

        let extractionResult;
        if (fileType === 'csv') {
          extractionResult = await extractor._extractFromCSVData(buffer);
        } else {
          extractionResult = await extractor._extractFromExcelData(buffer);
        }

        if (!extractionResult.success) {
          return response.status(500).json({
            success: false,
            error: 'Failed to extract links from file',
            details: extractionResult.error
          });
        }

        const { links } = extractionResult;
        
        if (links.length === 0) {
          return response.status(200).json({
            success: true,
            message: 'No PDF links found in the file',
            linksExtracted: 0,
            linksQueued: 0,
            extractionMetadata: extractionResult.metadata
          });
        }

        // Filter by confidence threshold
        const highConfidenceLinks = links.filter(link => 
          link.confidence >= parseFloat(confidenceThreshold)
        );
        const lowConfidenceLinks = links.filter(link => 
          link.confidence < parseFloat(confidenceThreshold)
        );

        console.log(`Link Extraction - Found ${links.length} total links, ${highConfidenceLinks.length} above confidence threshold`);

        const results = {
          success: true,
          linksExtracted: links.length,
          linksQueued: 0,
          downloadJobs: [],
          lowConfidenceLinks: lowConfidenceLinks.length,
          extractionMetadata: extractionResult.metadata,
          links: links.map(link => ({
            url: link.url,
            confidence: link.confidence,
            linkType: link.linkType,
            sourceLocation: `${link.sourceSheet} - ${link.cellAddress}`,
            willDownload: link.confidence >= parseFloat(confidenceThreshold) && autoDownload
          }))
        };

        // Queue high-confidence links for download if autoDownload is enabled
        if (autoDownload && highConfidenceLinks.length > 0) {
          const { PDFDownloader } = require('../../../utils/BackgroundWorkers/pdfDownloader');
          
          // Create download jobs
          const downloadJobs = highConfidenceLinks.map(link => ({
            url: link.url,
            parentDocId: parentDocId ? parseInt(parentDocId) : null,
            linkType: 'pdf_extraction',
            confidence: link.confidence,
            sourceContext: {
              originalFile: originalname,
              sheet: link.sourceSheet,
              cell: link.cellAddress,
              row: link.row,
              column: link.column,
              originalText: link.cellContent
            },
            priority: link.confidence > 0.8 ? 'high' : (link.confidence > 0.6 ? 'medium' : 'low'),
            maxRetries: 3
          }));

          // Start download processing
          const downloader = await PDFDownloader.processQueue(downloadJobs);
          
          results.linksQueued = downloadJobs.length;
          results.downloadJobs = downloadJobs.map(job => job.id || 'generated');
          results.downloadStatus = downloader.getStatus();

          console.log(`PDF Downloader - Queued ${downloadJobs.length} PDF downloads`);
        }

        // Log the extraction event
        await EventLogs.logEvent("pdf_links_extracted", {
          sourceFile: originalname,
          fileType: fileType,
          totalLinks: links.length,
          highConfidenceLinks: highConfidenceLinks.length,
          autoDownload: autoDownload,
          parentDocId: parentDocId,
          workspaces: addToWorkspaces || 'none'
        });

        // If workspace is specified, we'll need to track the downloads
        // and add the PDFs to workspaces once they're downloaded
        if (addToWorkspaces && autoDownload) {
          results.note = `Downloads queued. PDFs will be automatically added to workspaces: ${addToWorkspaces} once downloaded.`;
        }

        response.status(200).json(results);

      } catch (error) {
        console.error("PDF link extraction error:", error);
        response.status(500).json({
          success: false,
          error: `Failed to extract PDF links: ${error.message}`
        });
      }
    }
  );
}

module.exports = { apiDocumentEndpoints };
