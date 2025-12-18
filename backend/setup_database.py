"""
Database setup script for Supabase/PostgreSQL.

This script helps you:
1. Test database connection
2. Initialize database tables
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
        print("[SUCCESS] Database connection successful!")
        return True
    except Exception as e:
        error_msg = str(e)
        print(f"[FAILED] Database connection failed: {e}")
        
        # Check for common password encoding issues
        if "could not translate host name" in error_msg and "@" in DATABASE_URL:
            # Check if password might contain special characters
            from urllib.parse import urlparse
            try:
                parsed = urlparse(DATABASE_URL)
                if "@" in parsed.netloc.split("@")[0] and "postgresql" in DATABASE_URL:
                    print("\n[WARNING] POSSIBLE ISSUE: Password contains special characters!")
                    print("   Special characters in passwords must be URL-encoded.")
                    print("   Common encodings:")
                    print("   - @ becomes %40")
                    print("   - : becomes %3A")
                    print("   - / becomes %2F")
                    print("   - # becomes %23")
                    print("\n   Example: If password is 'pass@word', use 'pass%40word'")
                    print("   You can use Python to encode:")
                    print("   python -c \"from urllib.parse import quote_plus; print(quote_plus('your-password'))\"")
            except:
                pass
        
        return False


def initialize_database():
    """Initialize database tables."""
    print("\nInitializing database tables...")
    try:
        init_db()
        print("[SUCCESS] Database tables created successfully!")
        return True
    except Exception as e:
        print(f"[FAILED] Failed to create tables: {e}")
        return False


def check_tables():
    """Check if tables exist."""
    print("\nChecking existing tables...")
    try:
        # PostgreSQL
        with engine.connect() as conn:
            result = conn.execute(text(
                "SELECT table_name FROM information_schema.tables "
                "WHERE table_schema = 'public'"
            ))
            tables = [row[0] for row in result]
        
        if tables:
            print(f"[SUCCESS] Found {len(tables)} table(s): {', '.join(tables)}")
        else:
            print("[WARNING] No tables found. Run initialization.")
        return tables
    except Exception as e:
        print(f"[FAILED] Error checking tables: {e}")
        return []


def main():
    """Main setup function."""
    print("=" * 60)
    print("Database Setup Script")
    print("=" * 60)
    
    # Check if .env file exists (look in parent directory first, then current)
    env_file = Path(__file__).parent.parent / ".env"
    if not env_file.exists():
        env_file = Path(".env")
    if not env_file.exists():
        print("\n[ERROR] .env file not found!")
        print("Please create a .env file with your DATABASE_URL")
        print("Get your Supabase connection string from: Supabase Dashboard -> Settings -> Database")
        sys.exit(1)
    
    # Test connection
    if not test_connection():
        print("\n[FAILED] Cannot proceed without database connection.")
        print("\nPlease check:")
        print("1. Supabase project is active (not paused) - restore at https://supabase.com/dashboard")
        print("2. DATABASE_URL in .env is correct")
        print("3. Database credentials are correct")
        print("4. Network connectivity to Supabase")
        print("\nFor help, see: RESOLVE_SUPABASE_ISSUE.md")
        sys.exit(1)
    
    # Check existing tables
    tables = check_tables()
    
    # Initialize if needed
    if 'questions' not in tables or 'question_usage' not in tables:
        print("\n[WARNING] Required tables not found. Initializing...")
        if not initialize_database():
            sys.exit(1)
    else:
        print("\n[SUCCESS] All required tables exist!")
        response = input("Re-initialize tables? This will NOT delete data (y/n): ")
        if response.lower() == 'y':
            initialize_database()
    
    # Final check
    print("\n" + "=" * 60)
    print("Setup Complete!")
    print("=" * 60)
    check_tables()
    print("\n[SUCCESS] Database is ready to use!")


if __name__ == "__main__":
    main()

