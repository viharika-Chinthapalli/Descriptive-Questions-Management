"""Helper script to verify and fix Supabase connection string."""

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

print("=" * 70)
print("Supabase Connection String Helper")
print("=" * 70)
print()

print("The 'Tenant or user not found' error means authentication failed.")
print("This is usually because:")
print("  1. Wrong password")
print("  2. Wrong project reference in username")
print("  3. Connection string format issue")
print()

print("=" * 70)
print("STEP 1: Get Fresh Connection String from Supabase")
print("=" * 70)
print()
print("1. Go to: https://supabase.com/dashboard")
print("2. Select your project")
print("3. Click 'Settings' (gear icon) → 'Database'")
print("4. Scroll to 'Connection Pooling' section")
print("5. Find 'Session mode' (port 6543)")
print("6. Click 'Copy' to copy the connection string")
print()
print("The connection string should look like:")
print("   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres")
print()

print("=" * 70)
print("STEP 2: Verify Your Password")
print("=" * 70)
print()

# Get current password from .env
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL:
    try:
        if "@" in DATABASE_URL:
            auth_part = DATABASE_URL.split("@")[0].replace("postgresql://", "").replace("postgresql+psycopg2://", "")
            if ":" in auth_part:
                _, password_encoded = auth_part.split(":", 1)
                current_password = unquote(password_encoded)
                print(f"Current password in .env: {current_password}")
                print()
                print("Is this the correct password?")
                print("If not, you need to update it in Supabase dashboard:")
                print("  1. Go to Settings → Database")
                print("  2. Click 'Reset database password' if needed")
                print()
    except:
        pass

print("=" * 70)
print("STEP 3: URL-Encode Your Password")
print("=" * 70)
print()

print("If your password contains special characters, they must be URL-encoded:")
print("  @ → %40")
print("  : → %3A")
print("  / → %2F")
print("  # → %23")
print("  % → %25")
print()

test_password = input("Enter your Supabase database password to encode (or press Enter to skip): ").strip()
if test_password:
    encoded = quote_plus(test_password)
    print(f"\nEncoded password: {encoded}")
    print()
    print("Use this in your connection string:")
    print(f"   postgresql://postgres.[PROJECT-REF]:{encoded}@aws-0-[REGION].pooler.supabase.com:6543/postgres")
    print()

print("=" * 70)
print("STEP 4: Update .env File")
print("=" * 70)
print()

print("After getting the connection string from Supabase:")
print("1. Open .env file")
print("2. Update DATABASE_URL with the EXACT string from Supabase")
print("3. Replace [YOUR-PASSWORD] with your URL-encoded password")
print("4. Save the file")
print()

print("=" * 70)
print("STEP 5: Test Connection")
print("=" * 70)
print()

print("After updating .env, run:")
print("   python test_supabase_auth.py")
print()
print("Or test with:")
print("   python setup_database.py")
print()

print("=" * 70)
print("Common Issues & Solutions")
print("=" * 70)
print()

print("Issue 1: Wrong Username Format")
print("  ❌ Wrong: postgres:password@...")
print("  ✅ Correct: postgres.rqbuvffgmmsgffksswyz:password@...")
print("  → For connection pooler, username MUST be 'postgres.[PROJECT-REF]'")
print()

print("Issue 2: Password Not Encoded")
print("  ❌ Wrong: Viharika@123")
print("  ✅ Correct: Viharika%40123")
print("  → Special characters must be URL-encoded")
print()

print("Issue 3: Wrong Project Reference")
print("  → The project reference in username must match your Supabase project")
print("  → Get it from Supabase dashboard → Settings → Database → Connection Pooling")
print()

print("Issue 4: Project Paused")
print("  → Check if your Supabase project is paused")
print("  → Go to dashboard and restore it if needed")
print()

print("=" * 70)
print("Quick Test: Try Direct Connection Instead")
print("=" * 70)
print()

print("If connection pooler keeps failing, try direct connection:")
print("1. Go to Supabase Dashboard → Settings → Database")
print("2. Find 'Connection string' (not Connection Pooling)")
print("3. Copy the connection string (port 5432)")
print("4. Format: postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres")
print("5. Update DATABASE_URL in .env")
print()

