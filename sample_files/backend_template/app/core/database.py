"""
Database configuration and management for [PROJECT_NAME].

Implements async SQLAlchemy with connection pooling and health checks.
"""

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text, MetaData
import asyncio
from typing import AsyncGenerator
from app.core.config import settings


# Database engine with connection pooling
engine = create_async_engine(
    settings.database_url,
    pool_size=settings.database_pool_size,
    max_overflow=settings.database_max_overflow,
    pool_pre_ping=True,  # Validate connections before use
    echo=settings.debug,  # Log SQL queries in debug mode
)

# Async session factory
AsyncSessionLocal = async_sessionmaker(
    engine, 
    class_=AsyncSession, 
    expire_on_commit=False
)

# Base class for models
Base = declarative_base()

# Metadata for migrations
metadata = MetaData()


async def get_database_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency function to get database session.
    
    Usage in FastAPI endpoints:
        @app.get("/items/")
        async def read_items(db: AsyncSession = Depends(get_database_session)):
            # Use db session here
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_database():
    """Initialize database tables."""
    async with engine.begin() as conn:
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)


async def check_database_health() -> bool:
    """Check database connectivity and health."""
    try:
        async with AsyncSessionLocal() as session:
            result = await session.execute(text("SELECT 1"))
            return result.scalar() == 1
    except Exception as e:
        print(f"Database health check failed: {e}")
        return False


async def close_database_connections():
    """Close all database connections."""
    await engine.dispose()


# Example model (uncomment and modify as needed)
"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean
from datetime import datetime

class ExampleModel(Base):
    __tablename__ = "examples"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
"""