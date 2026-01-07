# Fix "Tenant or user not found" Authentication Error

## Current Error
```
FATAL: Tenant or user not found
```

This error means Supabase cannot authenticate your connection. The connection string format looks correct, but authentication is failing.

## Quick Fix Steps

### Step 1: Get Fresh Connection String from Supabase

1. Go to **https://supabase.com/dashboard**
2. Select your project
3. Click **Settings** (gear icon) → **Database**
4. Scroll to **"Connection Pooling"** section
5. Find **"Session mode"** (port 6543)
6. Click **"Copy"** to copy the connection string

**IMPORTANT**: Copy the EXACT string from Supabase - do not modify it manually.

### Step 2: Verify Your Password

The connection string from Supabase will have `[YOUR-PASSWORD]` placeholder. You need to:

1. Get your actual database password (from Supabase Settings → Database)
2. If password has special characters, URL-encode them:
   - `@` → `%40`
   - `:` → `%3A`
   - `/` → `%2F`
   - `#` → `%23`

**To encode your password:**
```bash
python encode_password.py "Viharika@123"
```

This will output the encoded version to use in your connection string.

### Step 3: Update .env File

Replace the `DATABASE_URL` in `.env` with the connection string from Step 1, replacing `[YOUR-PASSWORD]` with your URL-encoded password.

**Example:**
```env
DATABASE_URL=postgresql://postgres.rqbuvffgmmsgffksswyz:Viharika%40123@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
```

### Step 4: Test Connection

```bash
python test_supabase_auth.py
```

This will diagnose any remaining issues.

### Step 5: Restart Backend

```bash
python run.py
```

## Alternative: Try Direct Connection

If connection pooler keeps failing, try the direct connection:

1. Go to Supabase Dashboard → Settings → Database
2. Find **"Connection string"** (NOT Connection Pooling)
3. Copy the connection string (port 5432)
4. Format: `postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres`
5. Update `DATABASE_URL` in `.env`

## Common Issues

### Issue 1: Wrong Password
- Verify password in Supabase dashboard
- Make sure special characters are URL-encoded
- Use `python encode_password.py` to encode your password

### Issue 2: Wrong Project Reference
- The project reference in username must match your Supabase project
- Get it from Supabase dashboard → Settings → Database → Connection Pooling
- Format: `postgres.[PROJECT-REF]` (not just `postgres`)

### Issue 3: Project Paused
- Check if your Supabase project is paused
- Go to dashboard and restore it if needed

### Issue 4: Connection String Format
- Must use exact format from Supabase dashboard
- For pooler: `postgresql://postgres.[PROJECT-REF]:password@aws-0-[REGION].pooler.supabase.com:6543/postgres`
- For direct: `postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres`

## Diagnostic Tools

- **`python test_supabase_auth.py`** - Diagnose connection issues
- **`python encode_password.py YOUR_PASSWORD`** - Encode password for URL
- **`python verify_supabase_connection.py`** - Step-by-step guide

## Still Not Working?

1. Verify Supabase project is active (not paused)
2. Check if you can access Supabase dashboard
3. Try resetting database password in Supabase dashboard
4. Try direct connection instead of pooler
5. Check network/firewall settings







