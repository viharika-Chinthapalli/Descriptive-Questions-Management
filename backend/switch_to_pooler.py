"""Switch back to Connection Pooler and test connection."""

import os
import sys
from urllib.parse import quote_plus
from dotenv import load_dotenv, set_key

# Fix encoding for Windows PowerShell
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# Load environment variables
load_dotenv()

print("=" * 70)
print("Switch to Connection Pooler")
print("=" * 70)
print()

print("DNS test shows:")
print("  ❌ Direct connection hostname does NOT resolve")
print("  ✅ Connection Pooler hostname DOES resolve")
print()
print("Switching back to Connection Pooler...")
print()

# Connection Pooler URL format
pooler_url = "postgresql://postgres.rqbuvffgmmsgffksswyz:Viharika%40123@aws-0-ap-south-1.pooler.supabase.com:6543/postgres"

print("Using Connection Pooler URL:")
print(f"  {pooler_url[:60]}...")
print()

# Update .env
set_key(".env", "DATABASE_URL", pooler_url)
print("✅ Updated DATABASE_URL in .env file")
print()

# Test connection
print("=" * 70)
print("Testing Connection...")
print("=" * 70)
print()

try:
    import psycopg2
    
    print("Attempting to connect...")
    conn = psycopg2.connect(pooler_url, connect_timeout=5)
    cursor = conn.cursor()
    cursor.execute("SELECT version();")
    version = cursor.fetchone()[0]
    cursor.close()
    conn.close()
    
    print("✅ Connection successful!")
    print(f"   PostgreSQL version: {version[:60]}...")
    print()
    print("=" * 70)
    print("✅ Your Supabase connection is working!")
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
        print("The Connection Pooler hostname resolves, but authentication fails.")
        print("This means:")
        print("   1. ❌ Wrong password")
        print("   2. ❌ Wrong project reference in username")
        print("   3. ❌ Connection string format issue")
        print()
        print("📝 Solution:")
        print("   1. Go to: https://supabase.com/dashboard")
        print("   2. Settings → Database → Connection Pooling → Session mode")
        print("   3. Copy the EXACT connection string")
        print("   4. Replace [YOUR-PASSWORD] with your actual password")
        print("   5. If password has special characters, URL-encode them:")
        print("      python encode_password.py \"YOUR_PASSWORD\"")
        print()
        print("The connection string has been set to use pooler.")
        print("Please get a fresh connection string from Supabase and update .env")
        
    elif "password authentication failed" in error_msg.lower():
        print("🔍 Error: Password authentication failed")
        print("   The password is incorrect.")
        print("   Verify your database password in Supabase dashboard.")
        
    else:
        print(f"🔍 Error: {error_msg}")
    
    print()
    print("The Connection Pooler URL has been saved to .env file.")
    print("Please verify your credentials in Supabase dashboard.")
    sys.exit(1)
    
except Exception as e:
    print(f"❌ Unexpected error: {e}")
    sys.exit(1)

