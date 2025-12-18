# Multi-User Access Guide

## ✅ Yes, All Users Share the Same Backend Data

When you deploy this application, **all users accessing the frontend will see and interact with the same backend database**. This means:

- ✅ Questions added by one user are visible to all users
- ✅ All users can search the same question bank
- ✅ Usage history is shared across all users
- ✅ Duplicate detection works across all users

## How It Works

### Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  User 1     │     │  User 2     │     │  User 3     │
│  Frontend   │     │  Frontend   │     │  Frontend   │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                    ┌──────▼──────┐
                    │   Backend   │
                    │   Server    │
                    │  (FastAPI)  │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  SQLite DB  │
                    │question_bank│
                    │    .db      │
                    └─────────────┘
```

### Database Location

- **Single Database File**: `question_bank.db` (in project root)
- **All Users Connect**: All frontend users connect to the same backend server
- **Shared Data**: All questions, usage history, and metadata are shared

## Deployment Scenarios

### Scenario 1: Local Network (Same WiFi/LAN)

1. **Backend runs on one PC** (e.g., `192.168.1.100:8000`)
2. **All users access** `http://192.168.1.100:8000` from their browsers
3. **All see the same data** from the single database file

### Scenario 2: Cloud Deployment (Render, Railway, etc.)

1. **Backend runs on cloud server** (e.g., `https://your-app.onrender.com`)
2. **All users access** the same cloud URL
3. **All see the same data** from the cloud database

### Scenario 3: Production with PostgreSQL

1. **Backend connects to shared PostgreSQL database**
2. **All users access** the same backend API
3. **All see the same data** from the shared database

## Important Considerations

### ✅ Current Setup (SQLite)

**Good for:**
- Small teams (1-10 concurrent users)
- Low write frequency
- Development/testing
- Simple deployments

**Limitations:**
- SQLite has limited concurrent write support
- Best for read-heavy workloads
- May experience lock timeouts with many simultaneous writes

**Improvements Made:**
- ✅ WAL mode enabled (better concurrent reads)
- ✅ Connection timeout set (20 seconds)
- ✅ Connection pooling enabled

### 🚀 For Production (Many Users)

**Recommended:**
- **PostgreSQL** for better concurrency
- **Connection pooling** (PgBouncer)
- **Database backups**
- **Load balancing** for high traffic

**To Switch to PostgreSQL:**

1. Update `.env`:
```env
DATABASE_URL=postgresql://user:password@localhost/question_bank
```

2. Install PostgreSQL driver:
```bash
pip install psycopg2-binary
```

3. The code will automatically use PostgreSQL instead of SQLite

## CORS Configuration

The backend is configured to accept requests from any origin:

```python
allow_origins=["*"]  # Allows all frontends to connect
```

**For Production:** Change to specific origins:
```python
allow_origins=["https://your-frontend.com", "https://www.your-frontend.com"]
```

## Testing Multi-User Access

1. **Start the backend:**
   ```bash
   python run.py
   ```

2. **Open multiple browser windows/tabs** or have different users access:
   - `http://localhost:8000` (if same machine)
   - `http://YOUR_IP:8000` (if different machines)

3. **Add a question in one window** → It appears in all windows
4. **Search in another window** → You'll see the question you just added

## Data Persistence

- ✅ **Data persists** across server restarts
- ✅ **Database file** is stored at project root
- ✅ **All users** see the same persistent data
- ✅ **No data loss** when server restarts

## Summary

**Yes, all users share the same backend data!** This is the expected behavior for a centralized question bank system. All users can:
- View all questions
- Add questions (visible to everyone)
- Search the shared database
- See usage history from all users

The system is designed for collaborative question management where all users work with the same shared database.




