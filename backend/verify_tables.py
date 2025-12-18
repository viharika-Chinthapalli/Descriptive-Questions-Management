"""Verify database tables exist."""

import sys
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

from app.database import engine
from sqlalchemy import text

print("Verifying database tables...")
print("=" * 60)

with engine.connect() as conn:
    result = conn.execute(text(
        "SELECT table_name FROM information_schema.tables "
        "WHERE table_schema = 'public' ORDER BY table_name"
    ))
    tables = [row[0] for row in result]

if tables:
    print(f"✅ Found {len(tables)} table(s):")
    for table in tables:
        print(f"   - {table}")
else:
    print("❌ No tables found")

print("=" * 60)

if 'questions' in tables and 'question_usage' in tables:
    print("✅ All required tables exist!")
    print("✅ Database is ready to use!")
else:
    print("❌ Missing required tables. Run: python setup_database.py")

