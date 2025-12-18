"""Verify if the DATABASE_URL in .env is correct."""

import os
import sys
from dotenv import load_dotenv

# Fix encoding for Windows PowerShell
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

load_dotenv()

url = os.getenv("DATABASE_URL", "")

print("=" * 70)
print("DATABASE_URL Verification")
print("=" * 70)
print()

if not url:
    print("❌ DATABASE_URL not found in .env file")
    sys.exit(1)

# Mask password for display
masked_url = url.split("@")[0].split(":")[0] + ":***@" + "@".join(url.split("@")[1:]) if "@" in url else url[:50] + "..."
print(f"Current URL: {masked_url}")
print()

print("Format Checks:")
print("-" * 70)

# Check format
checks = {
    "Starts with postgresql://": url.startswith("postgresql://"),
    "Uses Connection Pooler": "pooler.supabase.com" in url,
    "Uses correct port (6543)": ":6543" in url,
    "Username format (postgres.xxx)": "postgres." in url.split("@")[0] if "@" in url else False,
    "Password is URL-encoded": "%" in url.split(":")[1].split("@")[0] if ":" in url and "@" in url else False,
    "Has hostname": "supabase" in url,
}

all_format_checks = True
for check_name, result in checks.items():
    status = "✅" if result else "❌"
    print(f"  {status} {check_name}")
    if not result:
        all_format_checks = False

print()
print("=" * 70)

if all_format_checks:
    print("✅ URL FORMAT IS CORRECT")
    print()
    print("However, authentication is failing with 'Tenant or user not found'")
    print("This means:")
    print("  ❌ The password is wrong, OR")
    print("  ❌ The project reference in username is wrong")
    print()
    print("Solution:")
    print("  1. Go to https://supabase.com/dashboard")
    print("  2. Settings → Database → Connection Pooling → Session mode")
    print("  3. Copy the EXACT connection string")
    print("  4. Replace [YOUR-PASSWORD] with your actual password")
    print("  5. Update .env file")
else:
    print("❌ URL FORMAT HAS ISSUES")
    print()
    print("Please fix the format issues above")

print("=" * 70)

