# Supabase Setup Guide

## Required Configuration

This application **requires** Supabase/PostgreSQL. SQLite is not supported.

## Quick Setup

### Step 1: Get Your Supabase Connection String

1. Go to **https://supabase.com/dashboard**
2. Select your project
3. Click **Settings** (gear icon) → **Database**
4. Copy your connection string

**Option A: Direct Connection (port 5432)**

```
postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres
```

**Option B: Connection Pooler (port 6543) - Recommended if direct connection fails**

```
postgresql://postgres.xxxxx:password@aws-0-region.pooler.supabase.com:6543/postgres
```

### Step 2: Update .env File

Open `.env` and set your `DATABASE_URL`:

```env
DATABASE_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres
```

**Important**:

- Replace `password` with your actual database password
- If password contains special characters, URL-encode them:
  - `@` → `%40`
  - `:` → `%3A`
  - `/` → `%2F`
  - `#` → `%23`

### Step 3: Test Connection

```bash
python setup_database.py
```

This will:

- Test your database connection
- Initialize database tables
- Verify everything is working

### Step 4: Start Backend

```bash
python run.py
```

## Troubleshooting

### Connection Fails with DNS Error

**Most Common Cause**: Supabase project is paused

1. Go to https://supabase.com/dashboard
2. Find your project
3. If it shows "Paused", click "Restore"
4. Wait 1-2 minutes
5. Try again

**Alternative**: Use Connection Pooler (port 6543) instead of direct connection

### Connection Fails with Authentication Error

1. Verify your password is correct
2. Check if password needs URL-encoding
3. Ensure `DATABASE_URL` format is correct

### Application Won't Start

The application **requires** a valid Supabase connection. It will not start without it.

Make sure:

- ✅ `DATABASE_URL` is set in `.env` file
- ✅ Supabase project is active (not paused)
- ✅ Connection string is correct
- ✅ Password is properly encoded

## Connection Pooler vs Direct Connection

**Direct Connection (port 5432)**:

- Faster for single connections
- May have DNS issues (IPv6-only)

**Connection Pooler (port 6543)**:

- Better for multiple connections
- More reliable DNS resolution
- Recommended if direct connection fails

Get pooler URL from: Supabase Dashboard → Settings → Database → Connection Pooling → Session mode







