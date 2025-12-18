"""Database connection and session management for Supabase/PostgreSQL."""

from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from typing import Generator
import os
import logging
from dotenv import load_dotenv

# Configure logging
logger = logging.getLogger(__name__)

# Load environment variables from parent directory (project root) first, then current directory
from pathlib import Path
env_path = Path(__file__).parent.parent.parent / ".env"
load_dotenv(env_path)
# Also try loading from current directory for backward compatibility
load_dotenv()

# Get database URL from environment - REQUIRED for Supabase/PostgreSQL
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError(
        "DATABASE_URL environment variable is required. "
        "Please set it in your .env file with your Supabase connection string.\n"
        "Example: DATABASE_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres"
    )

# Validate it's a PostgreSQL connection
if "postgresql" not in DATABASE_URL and "postgres" not in DATABASE_URL:
    raise ValueError(
        f"Invalid DATABASE_URL. Expected PostgreSQL connection string, got: {DATABASE_URL[:50]}...\n"
        "Please provide a valid Supabase/PostgreSQL connection string."
    )

# Check if psycopg2 is installed
try:
    import psycopg2  # noqa: F401
except ImportError:
    raise ImportError(
        "PostgreSQL driver (psycopg2) is required. "
        "Install it with: pip install psycopg2-binary"
    )

# Supabase and most cloud providers require SSL
connect_args = {}

# Check if this is a Supabase or cloud database (requires SSL)
# Note: pooler.supabase.com also requires SSL
if "supabase.co" in DATABASE_URL or "supabase.com" in DATABASE_URL or "neon.tech" in DATABASE_URL or "railway.app" in DATABASE_URL:
    # Enable SSL for cloud databases
    connect_args = {
        "sslmode": "require"
    }

# Create PostgreSQL engine with connection pooling
# Connection test will happen lazily when first used
# Add connect_timeout to prevent hanging on DNS resolution
import psycopg2

# Remove SQLAlchemy-specific prefix if present (postgresql+psycopg2:// -> postgresql://)
# SQLAlchemy will add the driver prefix automatically
if DATABASE_URL.startswith("postgresql+psycopg2://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql+psycopg2://", "postgresql://", 1)
    logger.info("Removed SQLAlchemy driver prefix from DATABASE_URL")

connect_args_with_timeout = connect_args.copy()
connect_args_with_timeout["connect_timeout"] = 5  # 5 second timeout

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args_with_timeout,
    pool_size=10,  # Number of connections to maintain
    max_overflow=20,  # Additional connections beyond pool_size
    pool_pre_ping=True,  # Verify connections before using
    pool_recycle=3600,  # Recycle connections after 1 hour
    echo=False  # Set to True for SQL query logging
)


def test_connection() -> bool:
    """
    Test database connection and provide helpful error messages if it fails.
    Uses a timeout to prevent hanging.
    
    Returns:
        bool: True if connection successful, False otherwise.
    """
    try:
        logger.info("Testing database connection...")
        # Use connect with a timeout to prevent hanging
        with engine.connect() as conn:
            # Set a statement timeout (5 seconds)
            conn.execute(text("SET statement_timeout = '5s'"))
            result = conn.execute(text("SELECT version()"))
            version = result.fetchone()[0]
            logger.info(f"Successfully connected to PostgreSQL database")
            logger.info(f"PostgreSQL version: {version[:60]}...")
            return True
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Failed to connect to database: {error_msg}")
        
        # Provide helpful error messages
        if "could not translate host name" in error_msg.lower() or "getaddrinfo" in error_msg.lower():
            logger.error(
                "DNS Resolution Error: Cannot connect to Supabase.\n"
                "Possible solutions:\n"
                "1. Check if your Supabase project is paused - restore it at https://supabase.com/dashboard\n"
                "2. Verify your DATABASE_URL is correct in .env file\n"
                "3. Try using Connection Pooler (port 6543) instead of direct connection (port 5432)\n"
                "4. Check your network/firewall settings"
            )
        elif "password" in error_msg.lower() or "authentication" in error_msg.lower():
            logger.error(
                "Authentication Error: Cannot authenticate with Supabase.\n"
                "Possible solutions:\n"
                "1. Verify your database password is correct\n"
                "2. Ensure password is URL-encoded if it contains special characters (@, :, /, etc.)\n"
                "3. Check your DATABASE_URL format in .env file"
            )
        else:
            logger.error(
                "Database connection failed.\n"
                "Please check:\n"
                "1. Supabase project is active (not paused)\n"
                "2. DATABASE_URL in .env file is correct\n"
                "3. Network connectivity to Supabase"
            )
        return False

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


def get_db() -> Generator:
    """
    Database session dependency for FastAPI.

    Yields:
        Session: SQLAlchemy database session.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """
    Initialize database by creating all tables.
    This function is safe to call multiple times - it only creates tables that don't exist.
    Connection will be tested when tables are created.
    """
    try:
        # Import models to ensure they're registered with Base.metadata
        from app.models import Question, QuestionUsage  # noqa: F401
        
        # Create all tables (only if they don't exist)
        # This will test the connection implicitly
        Base.metadata.create_all(bind=engine, checkfirst=True)
        logger.info("Database tables initialized successfully")
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Failed to initialize database: {error_msg}")
        
        # Provide helpful error messages
        if "could not translate host name" in error_msg.lower() or "getaddrinfo" in error_msg.lower():
            logger.error(
                "DNS Resolution Error: Cannot connect to Supabase.\n"
                "Possible solutions:\n"
                "1. Check if your Supabase project is paused - restore it at https://supabase.com/dashboard\n"
                "2. Verify your DATABASE_URL is correct in .env file\n"
                "3. Try using Connection Pooler (port 6543) instead of direct connection (port 5432)\n"
                "4. Check your network/firewall settings"
            )
        elif "password" in error_msg.lower() or "authentication" in error_msg.lower():
            logger.error(
                "Authentication Error: Cannot authenticate with Supabase.\n"
                "Possible solutions:\n"
                "1. Verify your database password is correct\n"
                "2. Ensure password is URL-encoded if it contains special characters (@, :, /, etc.)\n"
                "3. Check your DATABASE_URL format in .env file"
            )
        
        raise ConnectionError(
            f"Database initialization failed: {error_msg}\n"
            "See SUPABASE_SETUP.md for detailed setup instructions."
        )
