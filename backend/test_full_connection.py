"""Test full connection from frontend to backend to database."""

import sys
import requests
from app.database import test_connection, engine
from sqlalchemy import text

# Fix encoding for Windows PowerShell
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

print("=" * 70)
print("Full Connection Test")
print("=" * 70)
print()

# Test 1: Database Connection
print("1. Testing Database Connection...")
print("-" * 70)
db_ok = test_connection()
if db_ok:
    print("✅ Database connection: SUCCESS")
else:
    print("❌ Database connection: FAILED")
print()

# Test 2: Database Tables
print("2. Testing Database Tables...")
print("-" * 70)
try:
    with engine.connect() as conn:
        result = conn.execute(text(
            "SELECT table_name FROM information_schema.tables "
            "WHERE table_schema = 'public' ORDER BY table_name"
        ))
        tables = [row[0] for row in result]
    
    required_tables = ['questions', 'question_usage']
    missing = [t for t in required_tables if t not in tables]
    
    if not missing:
        print(f"✅ All required tables exist: {', '.join(tables)}")
        tables_ok = True
    else:
        print(f"❌ Missing tables: {', '.join(missing)}")
        print(f"   Found tables: {', '.join(tables) if tables else 'None'}")
        tables_ok = False
except Exception as e:
    print(f"❌ Error checking tables: {e}")
    tables_ok = False
print()

# Test 3: Backend API
print("3. Testing Backend API...")
print("-" * 70)
try:
    response = requests.get("http://localhost:8000/health", timeout=5)
    if response.status_code == 200:
        print("✅ Backend API: SUCCESS (health check passed)")
        api_ok = True
    else:
        print(f"❌ Backend API: FAILED (status {response.status_code})")
        api_ok = False
except requests.exceptions.ConnectionError:
    print("❌ Backend API: FAILED (cannot connect - is backend running?)")
    api_ok = False
except Exception as e:
    print(f"❌ Backend API: FAILED ({e})")
    api_ok = False
print()

# Test 4: API Endpoint
print("4. Testing API Endpoint...")
print("-" * 70)
try:
    response = requests.get("http://localhost:8000/api/questions?limit=1", timeout=10)
    if response.status_code == 200:
        print("✅ API Endpoint: SUCCESS")
        endpoint_ok = True
    elif response.status_code == 503:
        print("❌ API Endpoint: FAILED (503 - Database connection error)")
        print(f"   Response: {response.json()}")
        endpoint_ok = False
    else:
        print(f"❌ API Endpoint: FAILED (status {response.status_code})")
        endpoint_ok = False
except requests.exceptions.ConnectionError:
    print("❌ API Endpoint: FAILED (cannot connect)")
    endpoint_ok = False
except Exception as e:
    print(f"❌ API Endpoint: FAILED ({e})")
    endpoint_ok = False
print()

# Summary
print("=" * 70)
print("Summary")
print("=" * 70)
print(f"Database Connection: {'✅ PASS' if db_ok else '❌ FAIL'}")
print(f"Database Tables:     {'✅ PASS' if tables_ok else '❌ FAIL'}")
print(f"Backend API:          {'✅ PASS' if api_ok else '❌ FAIL'}")
print(f"API Endpoint:         {'✅ PASS' if endpoint_ok else '❌ FAIL'}")
print()

if all([db_ok, tables_ok, api_ok, endpoint_ok]):
    print("✅ All tests passed! System is ready.")
else:
    print("❌ Some tests failed. Please fix the issues above.")
    if not db_ok:
        print("\nFix: Check DATABASE_URL in .env file")
    if not tables_ok:
        print("\nFix: Run 'python setup_database.py'")
    if not api_ok:
        print("\nFix: Start backend with 'python run.py'")
    if not endpoint_ok and api_ok:
        print("\nFix: Check database connection and backend logs")

print("=" * 70)

