"""Test Supabase authentication and connection string format."""

import os
import sys
from urllib.parse import quote_plus, unquote
from dotenv import load_dotenv

# Fix encoding for Windows PowerShell
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("❌ ERROR: DATABASE_URL not found in .env file")
    sys.exit(1)

print("=" * 70)
print("Supabase Connection String Diagnostic")
print("=" * 70)
print()

# Parse connection string
print("📋 Current Connection String:")
print(f"   {DATABASE_URL[:60]}...")
print()

# Extract components
try:
    if DATABASE_URL.startswith("postgresql://"):
        url_part = DATABASE_URL.replace("postgresql://", "")
    elif DATABASE_URL.startswith("postgresql+psycopg2://"):
        url_part = DATABASE_URL.replace("postgresql+psycopg2://", "")
    else:
        print("❌ Invalid connection string format")
        sys.exit(1)
    
    # Split into auth and host parts
    if "@" in url_part:
        auth_part, host_part = url_part.split("@", 1)
        
        # Extract username and password
        if ":" in auth_part:
            username, password_encoded = auth_part.split(":", 1)
            password_decoded = unquote(password_encoded)
        else:
            username = auth_part
            password_decoded = None
        
        print("👤 Username:")
        print(f"   {username}")
        print()
        
        print("🔑 Password (decoded):")
        if password_decoded:
            print(f"   {password_decoded}")
        else:
            print("   (no password found)")
        print()
        
        print("🌐 Host:")
        print(f"   {host_part}")
        print()
        
        # Check username format
        print("✅ Username Format Check:")
        if username.startswith("postgres."):
            project_ref = username.replace("postgres.", "")
            print(f"   ✓ Connection Pooler format detected")
            print(f"   ✓ Project reference: {project_ref}")
        elif username == "postgres":
            print(f"   ⚠ Direct connection format (not pooler)")
            print(f"   ⚠ For pooler, should be: postgres.{project_ref}")
        else:
            print(f"   ❌ Unexpected username format: {username}")
        print()
        
        # Check if it's pooler
        if "pooler.supabase.com" in host_part:
            print("✅ Connection Pooler Detected:")
            print("   ✓ Using pooler (port 6543)")
            if not username.startswith("postgres."):
                print("   ❌ ERROR: Username should be 'postgres.[PROJECT-REF]' for pooler")
                print(f"   Current: {username}")
                print(f"   Expected: postgres.[PROJECT-REF]")
        elif "supabase.co" in host_part:
            print("✅ Direct Connection Detected:")
            print("   ✓ Using direct connection (port 5432)")
            if username != "postgres":
                print("   ⚠ For direct connection, username should be 'postgres'")
        print()
        
except Exception as e:
    print(f"❌ Error parsing connection string: {e}")
    sys.exit(1)

# Test connection
print("=" * 70)
print("Testing Connection...")
print("=" * 70)
print()

try:
    import psycopg2
    
    # Parse connection string - psycopg2 accepts postgresql:// URLs directly
    dsn = DATABASE_URL
    if dsn.startswith("postgresql+psycopg2://"):
        dsn = dsn.replace("postgresql+psycopg2://", "postgresql://")
    
    print("Attempting connection...")
    conn = psycopg2.connect(
        dsn,
        connect_timeout=5
    )
    
    cursor = conn.cursor()
    cursor.execute("SELECT version();")
    version = cursor.fetchone()[0]
    
    print("✅ Connection successful!")
    print(f"   PostgreSQL version: {version[:60]}...")
    
    cursor.close()
    conn.close()
    
except psycopg2.OperationalError as e:
    error_msg = str(e)
    print("❌ Connection failed!")
    print()
    
    if "Tenant or user not found" in error_msg or "tenant or user not found" in error_msg:
        print("🔍 Error: Tenant or user not found")
        print()
        print("This usually means:")
        print("   1. ❌ Wrong username format")
        print("   2. ❌ Wrong password")
        print("   3. ❌ Wrong project reference")
        print()
        print("📝 Solution:")
        print("   1. Go to https://supabase.com/dashboard")
        print("   2. Select your project")
        print("   3. Settings → Database → Connection Pooling")
        print("   4. Copy the EXACT 'Session mode' connection string")
        print("   5. Replace [YOUR-PASSWORD] with your actual password")
        print("   6. If password has special characters, URL-encode them:")
        print("      - @ → %40")
        print("      - : → %3A")
        print("      - / → %2F")
        print()
        print("   Example:")
        print("   postgresql://postgres.rqbuvffgmmsgffksswyz:YOUR_PASSWORD@aws-0-ap-south-1.pooler.supabase.com:6543/postgres")
        print()
        print("   To URL-encode your password, run:")
        print("   python -c \"from urllib.parse import quote_plus; print(quote_plus('YOUR_PASSWORD'))\"")
        
    elif "password authentication failed" in error_msg.lower():
        print("🔍 Error: Password authentication failed")
        print()
        print("The password is incorrect.")
        print("   - Verify your database password in Supabase dashboard")
        print("   - Make sure special characters are URL-encoded")
        
    elif "could not translate host name" in error_msg.lower() or "getaddrinfo" in error_msg.lower():
        print("🔍 Error: DNS resolution failed")
        print()
        print("Cannot resolve hostname. Possible causes:")
        print("   1. Supabase project is paused - restore it in dashboard")
        print("   2. Network connectivity issues")
        print("   3. Wrong hostname in connection string")
        
    else:
        print(f"🔍 Error: {error_msg}")
    
    sys.exit(1)
    
except ImportError:
    print("❌ psycopg2 not installed")
    print("   Install with: pip install psycopg2-binary")
    sys.exit(1)
    
except Exception as e:
    print(f"❌ Unexpected error: {e}")
    sys.exit(1)

print()
print("=" * 70)
print("✅ All checks passed! Your connection string is correct.")
print("=" * 70)

