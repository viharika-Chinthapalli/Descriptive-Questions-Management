# Quick Fix: "Tenant or user not found" Error

## The Problem
Your connection string format is correct, but Supabase cannot authenticate you. This means either:
- ❌ The password is wrong
- ❌ The project reference in username is wrong  
- ❌ The connection string is outdated

## Fastest Solution

### Step 1: Get Fresh Connection String (2 minutes)

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**
3. **Settings** → **Database**
4. **Copy the connection string** from one of these:

   **Option A: Direct Connection (Recommended if pooler fails)**
   - Find **"Connection string"** section (NOT Connection Pooling)
   - Copy the string (port 5432)
   - Format: `postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres`

   **Option B: Connection Pooler**
   - Scroll to **"Connection Pooling"** section
   - Find **"Session mode"** (port 6543)
   - Copy the connection string

### Step 2: Update .env File

1. Open `.env` file in your project
2. Find `DATABASE_URL=`
3. Replace with the connection string from Step 1
4. **Important**: If the connection string has `[YOUR-PASSWORD]` placeholder:
   - Replace it with your actual password
   - If password has special characters, URL-encode them:
     ```bash
     python encode_password.py "YOUR_PASSWORD"
     ```

### Step 3: Test Connection

```bash
python fix_supabase_connection.py
```

This script will:
- Help you update the connection string
- Test the connection automatically
- Show you exactly what's wrong if it fails

### Step 4: Restart Backend

```bash
python run.py
```

## Alternative: Use Interactive Fixer

Run this command and follow the prompts:

```bash
python fix_supabase_connection.py
```

It will:
- Show your current connection string (password masked)
- Let you paste a new connection string
- Automatically encode your password if needed
- Test the connection
- Update .env file automatically

## Common Mistakes

1. **Using wrong password**: Make sure you're using the database password, not your Supabase account password
2. **Not encoding special characters**: If password has `@`, `:`, `/`, etc., they must be URL-encoded
3. **Using old connection string**: Get a fresh one from Supabase dashboard
4. **Wrong username format**: 
   - Pooler: `postgres.[PROJECT-REF]`
   - Direct: `postgres`

## Still Not Working?

1. **Reset database password** in Supabase Dashboard → Settings → Database
2. **Try direct connection** instead of pooler (or vice versa)
3. **Check if project is paused** - restore it in dashboard
4. **Verify project reference** matches your actual Supabase project

## Helper Scripts

- `python fix_supabase_connection.py` - Interactive fixer
- `python test_supabase_auth.py` - Diagnose connection issues
- `python encode_password.py "PASSWORD"` - Encode password for URL







