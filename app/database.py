"""Database connection and session management."""

from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from typing import Generator
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get the project root directory (parent of app directory)
PROJECT_ROOT = Path(__file__).parent.parent

# Get database URL from environment or use default
default_db_path = PROJECT_ROOT / "question_bank.db"
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{default_db_path}")

# Create engine with connection pooling for better concurrency
if "sqlite" in DATABASE_URL:
    # SQLite connection args for better multi-user support
    connect_args = {
        "check_same_thread": False,
        "timeout": 20.0,  # Wait up to 20 seconds for database lock
    }
    # Use WAL mode for better concurrency (write-ahead logging)
    engine = create_engine(
        DATABASE_URL,
        connect_args=connect_args,
        pool_pre_ping=True,  # Verify connections before using
        echo=False  # Set to True for SQL query logging
    )
    # Enable WAL mode for SQLite (better for concurrent reads)
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_conn, connection_record):
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()
else:
    # For PostgreSQL or other databases (production)
    # Connection pooling for better performance with multiple users
    engine = create_engine(
        DATABASE_URL,
        pool_size=10,  # Number of connections to maintain
        max_overflow=20,  # Additional connections beyond pool_size
        pool_pre_ping=True,  # Verify connections before using
        pool_recycle=3600,  # Recycle connections after 1 hour
        echo=False  # Set to True for SQL query logging
    )

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
    """
    # Import models to ensure they're registered with Base.metadata
    from app.models import Question, QuestionUsage  # noqa: F401
    
    # Create all tables (only if they don't exist)
    Base.metadata.create_all(bind=engine, checkfirst=True)


