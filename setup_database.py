"""
Database setup and migration script.

This script helps you:
1. Test database connection
2. Initialize database tables
3. Migrate from SQLite to PostgreSQL (if needed)
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from app.database import init_db, DATABASE_URL, engine

# Load environment variables
load_dotenv()


def test_connection():
    """Test database connection."""
    print(f"Testing connection to: {DATABASE_URL}")
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            result.fetchone()
        print("✅ Database connection successful!")
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False


def initialize_database():
    """Initialize database tables."""
    print("\nInitializing database tables...")
    try:
        init_db()
        print("✅ Database tables created successfully!")
        return True
    except Exception as e:
        print(f"❌ Failed to create tables: {e}")
        return False


def check_tables():
    """Check if tables exist."""
    print("\nChecking existing tables...")
    try:
        if "sqlite" in DATABASE_URL:
            with engine.connect() as conn:
                result = conn.execute(text(
                    "SELECT name FROM sqlite_master WHERE type='table'"
                ))
                tables = [row[0] for row in result]
        else:
            # PostgreSQL
            with engine.connect() as conn:
                result = conn.execute(text(
                    "SELECT table_name FROM information_schema.tables "
                    "WHERE table_schema = 'public'"
                ))
                tables = [row[0] for row in result]
        
        if tables:
            print(f"✅ Found {len(tables)} table(s): {', '.join(tables)}")
        else:
            print("⚠️  No tables found. Run initialization.")
        return tables
    except Exception as e:
        print(f"❌ Error checking tables: {e}")
        return []


def main():
    """Main setup function."""
    print("=" * 60)
    print("Database Setup Script")
    print("=" * 60)
    
    # Check if .env file exists
    env_file = Path(".env")
    if not env_file.exists():
        print("\n⚠️  Warning: .env file not found!")
        print("Please create a .env file with your DATABASE_URL")
        print("See .env.example for reference")
        response = input("\nContinue anyway? (y/n): ")
        if response.lower() != 'y':
            sys.exit(1)
    
    # Test connection
    if not test_connection():
        print("\n❌ Cannot proceed without database connection.")
        print("\nPlease check:")
        print("1. Database server is running")
        print("2. DATABASE_URL in .env is correct")
        print("3. Database credentials are correct")
        sys.exit(1)
    
    # Check existing tables
    tables = check_tables()
    
    # Initialize if needed
    if 'questions' not in tables or 'question_usage' not in tables:
        print("\n⚠️  Required tables not found. Initializing...")
        if not initialize_database():
            sys.exit(1)
    else:
        print("\n✅ All required tables exist!")
        response = input("Re-initialize tables? This will NOT delete data (y/n): ")
        if response.lower() == 'y':
            initialize_database()
    
    # Final check
    print("\n" + "=" * 60)
    print("Setup Complete!")
    print("=" * 60)
    check_tables()
    print("\n✅ Database is ready to use!")


if __name__ == "__main__":
    main()

