"""Interactive script to fix Supabase connection authentication issues."""

import os
import sys
import re
from urllib.parse import quote_plus, unquote
from dotenv import load_dotenv, set_key

# Fix encoding for Windows PowerShell
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stdin = io.TextIOWrapper(sys.stdin.buffer, encoding='utf-8', errors='replace')

# Load environment variables
load_dotenv()

print("=" * 70)
print("Supabase Connection Fixer")
print("=" * 70)
print()

# Get current DATABASE_URL
current_url = os.getenv("DATABASE_URL", "")
if current_url:
    print("Current DATABASE_URL found in .env")
    # Mask password for display
    masked_url = re.sub(r':([^:@]+)@', r':****@', current_url)
    print(f"  {masked_url[:80]}...")
    print()
else:
    print("No DATABASE_URL found in .env file")
    print()

print("=" * 70)
print("Option 1: Update Connection Pooler URL")
print("=" * 70)
print()
print("If you're using Connection Pooler (port 6543):")
print("1. Go to: https://supabase.com/dashboard")
print("2. Settings → Database → Connection Pooling → Session mode")
print("3. Copy the connection string")
print()

print("=" * 70)
print("Option 2: Switch to Direct Connection")
print("=" * 70)
print()
print("If Connection Pooler keeps failing, try Direct Connection:")
print("1. Go to: https://supabase.com/dashboard")
print("2. Settings → Database → Connection string (NOT Connection Pooling)")
print("3. Copy the connection string (port 5432)")
print()

choice = input("Enter connection string (or press Enter to skip): ").strip()

if not choice:
    print("\nSkipping connection string update.")
    print("\nTo manually update:")
    print("1. Open .env file")
    print("2. Update DATABASE_URL with your connection string")
    print("3. Make sure password is URL-encoded if it has special characters")
    print("4. Use: python encode_password.py YOUR_PASSWORD")
    sys.exit(0)

# Validate connection string format
if not (choice.startswith("postgresql://") or choice.startswith("postgresql+psycopg2://")):
    print("\n❌ Invalid connection string format")
    print("   Must start with: postgresql:// or postgresql+psycopg2://")
    sys.exit(1)

# Check if password needs encoding
if "[YOUR-PASSWORD]" in choice or "[PASSWORD]" in choice:
    print("\n⚠️  Connection string contains password placeholder")
    password = input("Enter your database password: ").strip()
    if not password:
        print("❌ Password required")
        sys.exit(1)
    
    # URL-encode password
    encoded_password = quote_plus(password)
    # Replace placeholder
    choice = choice.replace("[YOUR-PASSWORD]", encoded_password)
    choice = choice.replace("[PASSWORD]", encoded_password)
    print(f"\n✅ Password encoded: {encoded_password}")

# Remove postgresql+psycopg2:// prefix if present (SQLAlchemy adds it automatically)
if choice.startswith("postgresql+psycopg2://"):
    choice = choice.replace("postgresql+psycopg2://", "postgresql://", 1)
    print("✅ Removed SQLAlchemy driver prefix")

# Update .env file
env_path = ".env"
if not os.path.exists(env_path):
    print(f"\n⚠️  .env file not found at {env_path}")
    create = input("Create new .env file? (y/n): ").strip().lower()
    if create != 'y':
        print("Cancelled")
        sys.exit(0)

# Update or set DATABASE_URL
set_key(env_path, "DATABASE_URL", choice)
print(f"\n✅ Updated DATABASE_URL in .env file")

# Test connection
print("\n" + "=" * 70)
print("Testing Connection...")
print("=" * 70)
print()

try:
    import psycopg2
    
    # Test connection
    print("Attempting to connect...")
    conn = psycopg2.connect(choice, connect_timeout=5)
    cursor = conn.cursor()
    cursor.execute("SELECT version();")
    version = cursor.fetchone()[0]
    cursor.close()
    conn.close()
    
    print("✅ Connection successful!")
    print(f"   PostgreSQL version: {version[:60]}...")
    print()
    print("=" * 70)
    print("✅ Your Supabase connection is now working!")
    print("=" * 70)
    print()
    print("Next steps:")
    print("1. Restart your backend: python run.py")
    print("2. Test API endpoints")
    
except ImportError:
    print("❌ psycopg2 not installed")
    print("   Install with: pip install psycopg2-binary")
    sys.exit(1)
    
except psycopg2.OperationalError as e:
    error_msg = str(e)
    print("❌ Connection failed!")
    print()
    
    if "Tenant or user not found" in error_msg:
        print("🔍 Error: Tenant or user not found")
        print()
        print("Possible causes:")
        print("   1. Wrong password")
        print("   2. Wrong project reference in username")
        print("   3. Connection string format issue")
        print()
        print("Solutions:")
        print("   1. Verify password in Supabase dashboard")
        print("   2. Get fresh connection string from Supabase")
        print("   3. Try direct connection instead of pooler")
        print()
        print("The connection string has been saved to .env, but authentication failed.")
        print("Please verify your credentials in Supabase dashboard.")
        
    elif "password authentication failed" in error_msg.lower():
        print("🔍 Error: Password authentication failed")
        print("   The password is incorrect.")
        print("   Verify your database password in Supabase dashboard.")
        
    elif "could not translate host name" in error_msg.lower():
        print("🔍 Error: DNS resolution failed")
        print("   Possible causes:")
        print("   1. Supabase project is paused - restore it in dashboard")
        print("   2. Network connectivity issues")
        print("   3. Wrong hostname in connection string")
    else:
        print(f"🔍 Error: {error_msg}")
    
    print()
    print("The connection string has been saved to .env file.")
    print("Please fix the issue and try again.")
    sys.exit(1)
    
except Exception as e:
    print(f"❌ Unexpected error: {e}")
    print()
    print("The connection string has been saved to .env file.")
    print("Please verify it's correct and try again.")
    sys.exit(1)

