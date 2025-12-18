"""Helper to URL-encode Supabase database password."""

import sys
from urllib.parse import quote_plus

# Fix encoding for Windows PowerShell
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

print("=" * 70)
print("Supabase Password Encoder")
print("=" * 70)
print()

if len(sys.argv) > 1:
    password = sys.argv[1]
else:
    print("Usage: python encode_password.py YOUR_PASSWORD")
    print()
    print("Example:")
    print("  python encode_password.py Viharika@123")
    print()
    print("This will output the URL-encoded version to use in DATABASE_URL")
    sys.exit(0)

encoded = quote_plus(password)
print(f"Original password: {password}")
print(f"URL-encoded:       {encoded}")
print()
print("Use this in your .env file:")
print(f"  DATABASE_URL=postgresql://postgres.[PROJECT-REF]:{encoded}@aws-0-[REGION].pooler.supabase.com:6543/postgres")
print()

