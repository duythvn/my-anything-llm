"""
Configuration management for [PROJECT_NAME].

Implements secure environment variable loading and multi-environment support
following the latest architectural patterns.
"""

import os
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseSettings, Field, validator
from pydantic_settings import BaseSettings as PydanticSettings
from dotenv import load_dotenv


class Settings(PydanticSettings):
    """Application settings with environment variable support."""
    
    # Basic Configuration
    app_name: str = Field(default="[PROJECT_NAME]", env="APP_NAME")
    environment: str = Field(default="development", env="ENVIRONMENT")
    debug: bool = Field(default=True, env="DEBUG")
    
    # Server Configuration
    host: str = Field(default="0.0.0.0", env="HOST")
    port: int = Field(default=8000, env="PORT")
    
    # Database Configuration
    database_url: str = Field(default="postgresql://user:password@localhost:5432/dbname", env="DATABASE_URL")
    database_pool_size: int = Field(default=10, env="DATABASE_POOL_SIZE")
    database_max_overflow: int = Field(default=20, env="DATABASE_MAX_OVERFLOW")
    
    # Redis Configuration
    redis_url: str = Field(default="redis://localhost:6379/0", env="REDIS_URL")
    redis_max_connections: int = Field(default=20, env="REDIS_MAX_CONNECTIONS")
    
    # LLM Configuration
    openai_api_key: Optional[str] = Field(default=None, env="OPENAI_API_KEY")
    anthropic_api_key: Optional[str] = Field(default=None, env="ANTHROPIC_API_KEY")
    default_llm_provider: str = Field(default="openai", env="DEFAULT_LLM_PROVIDER")
    max_tokens: int = Field(default=4000, env="MAX_TOKENS")
    temperature: float = Field(default=0.7, env="TEMPERATURE")
    
    # Agent Configuration
    max_concurrent_agents: int = Field(default=5, env="MAX_CONCURRENT_AGENTS")
    agent_timeout: int = Field(default=300, env="AGENT_TIMEOUT")  # seconds
    
    # Workflow Configuration
    workflow_checkpoint_dir: str = Field(default="./checkpoints", env="WORKFLOW_CHECKPOINT_DIR")
    max_workflow_duration: int = Field(default=3600, env="MAX_WORKFLOW_DURATION")  # seconds
    
    # Observability
    otel_endpoint: str = Field(default="http://localhost:4317", env="OTEL_EXPORTER_OTLP_ENDPOINT")
    otel_service_name: str = Field(default="[PROJECT_NAME]-backend", env="OTEL_SERVICE_NAME")
    log_level: str = Field(default="INFO", env="LOG_LEVEL")
    
    # Security
    secret_key: str = Field(default="your-secret-key-change-me", env="SECRET_KEY")
    access_token_expire_minutes: int = Field(default=30, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    cors_origins: List[str] = Field(default=["*"], env="CORS_ORIGINS")
    
    @validator("cors_origins", pre=True)
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        """Parse CORS origins from environment variable."""
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)
    
    @validator("environment")
    def validate_environment(cls, v: str) -> str:
        """Validate environment setting."""
        allowed_envs = ["development", "staging", "production"]
        if v not in allowed_envs:
            raise ValueError(f"Environment must be one of: {allowed_envs}")
        return v
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


def load_settings() -> Settings:
    """Load application settings with explicit .env file loading."""
    # Explicitly load .env file
    load_dotenv()
    
    # Create settings instance
    settings = Settings()
    
    # Validate critical settings in production
    if settings.environment == "production":
        if settings.secret_key == "your-secret-key-change-me":
            raise ValueError("SECRET_KEY must be set in production")
        if not settings.openai_api_key and not settings.anthropic_api_key:
            raise ValueError("At least one LLM API key must be set in production")
    
    return settings


# Global settings instance
settings = load_settings()


# Development helper to print configuration
def print_config():
    """Print current configuration (excluding secrets)."""
    safe_config = {}
    for key, value in settings.dict().items():
        if "key" in key.lower() or "secret" in key.lower() or "password" in key.lower():
            safe_config[key] = "***HIDDEN***"
        else:
            safe_config[key] = value
    
    print("Current Configuration:")
    for key, value in safe_config.items():
        print(f"  {key}: {value}")