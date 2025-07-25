"""
Main application entry point for [PROJECT_NAME] backend.

This file sets up the FastAPI application with modern agentic system architecture
including LangGraph workflows, OpenTelemetry observability, and agent coordination.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
import os
from dotenv import load_dotenv

# OpenTelemetry imports
from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.sdk.resources import Resource

# Import your modules here (uncomment as needed)
# from app.core.config import settings
# from app.core.database import engine, Base
# from app.api.routes import api_router
# from app.agents.coordinator import AgentCoordinator
# from app.workflows.manager import WorkflowManager
# from app.llm.orchestrator import LLMOrchestrator

# Load environment variables
load_dotenv()

# Initialize OpenTelemetry
def setup_telemetry():
    """Setup OpenTelemetry tracing."""
    resource = Resource.create({
        "service.name": os.getenv("SERVICE_NAME", "[PROJECT_NAME]-backend"),
        "service.version": "1.0.0",
    })
    
    provider = TracerProvider(resource=resource)
    
    # Configure OTLP exporter
    otlp_exporter = OTLPSpanExporter(
        endpoint=os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://localhost:4317"),
        insecure=True
    )
    
    provider.add_span_processor(BatchSpanProcessor(otlp_exporter))
    trace.set_tracer_provider(provider)

# Application lifecycle
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle application startup and shutdown events."""
    # Startup
    print("🚀 Starting [PROJECT_NAME] backend...")
    
    # Setup observability
    setup_telemetry()
    
    # Initialize core components
    # await initialize_database()
    # await setup_agent_coordinator()
    # await initialize_workflow_manager()
    # await setup_llm_orchestrator()
    
    print("✅ [PROJECT_NAME] backend initialized successfully")
    
    yield
    
    # Shutdown
    print("🔄 Shutting down [PROJECT_NAME] backend...")
    # Clean up connections, agents, workflows, etc.
    print("✅ [PROJECT_NAME] backend shutdown complete")

# Create FastAPI application
app = FastAPI(
    title="[PROJECT_NAME] Agentic System API",
    description="[PROJECT_DESCRIPTION] - Multi-agent system with LangGraph workflows and intelligent automation",
    version="1.0.0",
    lifespan=lifespan,
    openapi_tags=[
        {"name": "health", "description": "Health check endpoints"},
        {"name": "agents", "description": "Agent management and coordination"},
        {"name": "workflows", "description": "LangGraph workflow execution"},
        {"name": "tools", "description": "Tool registry and execution"},
        {"name": "llm", "description": "LLM orchestration and task management"},
    ]
)

# Instrument FastAPI with OpenTelemetry
FastAPIInstrumentor.instrument_app(app)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for your environment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoints
@app.get("/health", tags=["health"])
async def health_check():
    """Basic health check endpoint."""
    return {
        "status": "healthy", 
        "service": "[PROJECT_NAME]",
        "version": "1.0.0",
        "timestamp": "2024-01-01T00:00:00Z"  # Replace with actual timestamp
    }

@app.get("/health/detailed", tags=["health"])
async def detailed_health_check():
    """Detailed health check with component status."""
    # Add actual health checks for your components
    health_status = {
        "status": "healthy",
        "service": "[PROJECT_NAME]",
        "version": "1.0.0",
        "components": {
            "database": "healthy",  # Replace with actual check
            "redis": "healthy",     # Replace with actual check
            "agents": "healthy",    # Replace with actual check
            "workflows": "healthy", # Replace with actual check
        }
    }
    return health_status

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with basic information."""
    return {
        "message": "Welcome to [PROJECT_NAME] API",
        "version": "1.0.0",
        "docs": "/docs"
    }

# Include API routes (uncomment as needed)
# app.include_router(api_router, prefix="/api/v1")
# app.include_router(agent_router, prefix="/api/v1/agents", tags=["agents"])
# app.include_router(workflow_router, prefix="/api/v1/workflows", tags=["workflows"])
# app.include_router(tool_router, prefix="/api/v1/tools", tags=["tools"])
# app.include_router(llm_router, prefix="/api/v1/llm", tags=["llm"])

if __name__ == "__main__":
    # Development server configuration
    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("ENVIRONMENT", "development") == "development",
        log_level=os.getenv("LOG_LEVEL", "info").lower()
    )