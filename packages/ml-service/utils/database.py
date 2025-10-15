import os
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
import redis.asyncio as aioredis
from utils.logger import logger

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://nfluser:nflpass123@localhost:5432/nfl_predictor")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

# Convert postgresql:// to postgresql+asyncpg://
ASYNC_DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")

# SQLAlchemy setup
engine = create_async_engine(ASYNC_DATABASE_URL, echo=False)
SessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()

# Redis client
redis_client = None

async def init_db():
    """Initialize database connections"""
    global redis_client

    try:
        # Test PostgreSQL connection
        async with engine.begin() as conn:
            logger.info("✅ PostgreSQL connected successfully")

        # Connect to Redis
        redis_client = await aioredis.from_url(REDIS_URL, decode_responses=True)
        await redis_client.ping()
        logger.info("✅ Redis connected successfully")

    except Exception as e:
        logger.error(f"❌ Database connection error: {e}")
        raise

async def close_db():
    """Close database connections"""
    global redis_client

    if redis_client:
        await redis_client.close()
    await engine.dispose()
    logger.info("Database connections closed")

async def get_db():
    """Dependency for getting DB session"""
    async with SessionLocal() as session:
        yield session

def get_redis():
    """Get Redis client"""
    return redis_client
