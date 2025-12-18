# Fix Database Connection Error: "Tenant or user not found"

## Current Error
```
FATAL: Tenant or user not found
```

This error means the connection pooler cannot authenticate you. This is usually due to:
1. **Wrong username format** for connection pooler
2. **Wrong password**
3. **Project is paused or deleted**

## Solution

### Step 1: Get Correct Connection Pooler URL

1. Go to **https://supabase.com/dashboard**
2. Select your project
3. Click **Settings** → **Database**
4. Scroll to **"Connection Pooling"** section
5. Find **"Session mode"** (port 6543)
6. **Copy the EXACT connection string** - do NOT modify it

The format should be:
```
postgresql://postgres.rqbuvffgmmsgffksswyz:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
```

### Step 2: Update .env File

**IMPORTANT**: 
- Use the EXACT connection string from Supabase dashboard
- Replace `[YOUR-PASSWORD]` with your actual password
- If password has special characters, URL-encode them:
  - `@` → `%40`
  - `:` → `%3A`
  - `/` → `%2F`

**Your current .env has:**
```
DATABASE_URL=postgresql://postgres.rqbuvffgmmsgffksswyz:Viharika%40123@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
```

**Check:**
1. Is the password `Viharika@123` or `Viharika@321`?
2. Make sure you're using the correct password
3. Verify the connection string matches exactly what Supabase shows

### Step 3: Verify Password Encoding

If your password is `Viharika@123`:
- Encoded: `Viharika%40123` ✅ (correct)

If your password is `Viharika@321`:
- Encoded: `Viharika%40321` ✅ (correct)

**To encode your password:**
```python
from urllib.parse import quote_plus
password = "Viharika@123"  # Your actual password
encoded = quote_plus(password)
print(f"Encoded: {encoded}")
```

### Step 4: Test Connection

After updating .env:
```bash
python setup_database.py
```

### Step 5: Restart Backend

```bash
python run.py
```

## Common Issues

### Issue 1: Wrong Username Format
- ❌ Wrong: `postgres:password@...`
- ✅ Correct: `postgres.rqbuvffgmmsgffksswyz:password@...`

### Issue 2: Password Not Encoded
- ❌ Wrong: `Viharika@123`
- ✅ Correct: `Viharika%40123`

### Issue 3: Wrong Connection String
- Make sure you're using **Connection Pooler** (port 6543), not direct connection (port 5432)
- Username must be `postgres.[PROJECT-REF]` format

## Quick Fix

1. Go to Supabase Dashboard → Settings → Database → Connection Pooling
2. Copy the **Session mode** connection string
3. Replace `[YOUR-PASSWORD]` with your actual password (URL-encoded)
4. Update `.env` file
5. Restart backend



