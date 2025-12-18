# Backend Migration: Python/FastAPI → Express.js/Node.js

This document describes the migration from Python/FastAPI to Express.js/Node.js with Supabase.

## What Changed

### Technology Stack

**Before (Python)**:
- FastAPI
- SQLAlchemy ORM
- sentence-transformers (Python)
- Pydantic validation
- psycopg2-binary (PostgreSQL driver)

**After (Node.js)**:
- Express.js
- @supabase/supabase-js (Supabase client)
- @xenova/transformers (JavaScript transformers)
- express-validator
- Native Supabase client (no direct PostgreSQL driver needed)

### Key Differences

1. **Database Access**: 
   - Before: SQLAlchemy ORM with direct PostgreSQL connection
   - After: Supabase client library (REST API based)

2. **Similarity Detection**:
   - Before: `sentence-transformers` (Python library)
   - After: `@xenova/transformers` (JavaScript port, same model)

3. **Validation**:
   - Before: Pydantic models
   - After: express-validator middleware

4. **Error Handling**:
   - Before: FastAPI exception handlers
   - After: Express.js error middleware

## Migration Steps

### 1. Install Node.js Dependencies

```bash
cd backend
npm install
```

### 2. Update Environment Variables

Update your `.env` file to include Supabase credentials:

```env
# Supabase Configuration (REQUIRED)
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here

# Application Configuration
SIMILARITY_THRESHOLD=0.85
DEBUG=true
HOST=0.0.0.0
PORT=8000
```

**Get Supabase credentials**:
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Settings → API
4. Copy `Project URL` → `SUPABASE_URL`
5. Copy `anon public` key → `SUPABASE_ANON_KEY`

### 3. Set Up Database Tables

Run the SQL migration in Supabase:

1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `backend/supabase_migration.sql`
3. Run the migration

Or use the Supabase Dashboard to create tables manually.

### 4. Start the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

## API Compatibility

All API endpoints remain the same:

- `POST /api/questions` - Create question
- `GET /api/questions` - List questions
- `GET /api/questions/:id` - Get question
- `PUT /api/questions/:id` - Update question
- `DELETE /api/questions/:id` - Delete question
- `GET /api/questions/check-similarity` - Check similarity
- `POST /api/questions/usage-by-text` - Record usage
- `POST /api/questions/usage-by-text/search` - Get usage history

The frontend should work without any changes.

## File Structure Changes

### Before (Python)
```
backend/
├── app/
│   ├── main.py              # FastAPI app
│   ├── database.py          # SQLAlchemy setup
│   ├── models.py            # SQLAlchemy models
│   ├── schemas.py           # Pydantic schemas
│   ├── services/
│   │   ├── question_service.py
│   │   └── similarity_service.py
│   └── api/
│       └── routes.py
├── requirements.txt
└── run.py
```

### After (Node.js)
```
backend/
├── app/
│   ├── database.js          # Supabase client
│   ├── api/
│   │   └── routes.js        # Express routes
│   ├── middleware/
│   │   ├── errorHandler.js
│   │   └── validation.js
│   └── services/
│       ├── questionService.js
│       └── similarityService.js
├── api/
│   └── index.js            # Vercel entry point
├── server.js               # Express app
├── package.json
└── supabase_migration.sql
```

## Key Implementation Differences

### Database Queries

**Before (SQLAlchemy)**:
```python
db.query(Question).filter(Question.id == question_id).first()
```

**After (Supabase)**:
```javascript
await supabase.from("questions").select("*").eq("id", question_id).single()
```

### Similarity Detection

**Before (Python)**:
```python
from sentence_transformers import SentenceTransformer
model = SentenceTransformer("all-MiniLM-L6-v2")
embedding = model.encode(question_text)
```

**After (JavaScript)**:
```javascript
import { pipeline } from "@xenova/transformers";
const model = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
const output = await model(question_text, { pooling: "mean", normalize: true });
```

### Validation

**Before (Pydantic)**:
```python
class QuestionCreate(BaseModel):
    question_text: str = Field(..., min_length=10)
```

**After (express-validator)**:
```javascript
body("question_text").trim().isLength({ min: 10 })
```

## Benefits of Migration

1. **Unified Stack**: Both frontend and backend use JavaScript
2. **Simpler Deployment**: Node.js is easier to deploy on many platforms
3. **Better Supabase Integration**: Native Supabase client with built-in features
4. **Smaller Bundle**: No need for Python runtime in production
5. **Faster Cold Starts**: Node.js serverless functions start faster

## Troubleshooting

### Model Loading Issues

The first run downloads the embedding model (~80MB). Ensure:
- Internet connection is available
- Sufficient disk space
- Model is cached after first download

### Database Connection Issues

- Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correct
- Check if Supabase project is paused (restore in dashboard)
- Ensure database tables are created (run migration)

### CORS Issues

- Add frontend URL to `FRONTEND_URL` in `.env`
- Or update `corsOrigins` in `server.js`

## Rollback

If you need to rollback to Python/FastAPI:

1. The old Python code is still in the repository
2. Use `requirements.txt` to install Python dependencies
3. Run `python run.py` to start the Python backend
4. Update frontend API URL if needed

## Next Steps

1. Test all API endpoints
2. Verify similarity detection works correctly
3. Check database operations (CRUD)
4. Update deployment configuration if needed
5. Monitor performance and adjust as needed

