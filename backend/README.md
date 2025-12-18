# Question Bank Backend - Express.js

Express.js backend for the Question Bank Management System using Supabase.

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **Similarity Detection**: @xenova/transformers (all-MiniLM-L6-v2)
- **Validation**: express-validator

## Setup

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Supabase account and project

### Installation

1. **Install dependencies**:

```bash
npm install
```

2. **Set up environment variables**:

Create a `.env` file in the project root (not in backend folder):

```env
# Supabase Configuration (REQUIRED)
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here

# Application Configuration
SIMILARITY_THRESHOLD=0.85
DEBUG=true
HOST=0.0.0.0
PORT=8000

# Frontend URL (for CORS in production)
FRONTEND_URL=https://your-frontend.vercel.app
```

**Get your Supabase credentials**:
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Settings → API
4. Copy `Project URL` → `SUPABASE_URL`
5. Copy `anon public` key → `SUPABASE_ANON_KEY`

3. **Set up database tables**:

Run the SQL migration in Supabase SQL Editor:
- Go to Supabase Dashboard → SQL Editor
- Copy contents of `supabase_migration.sql`
- Run the migration

Or use the Supabase Dashboard to create tables manually based on the schema.

### Running the Server

**Development mode** (with auto-reload):

```bash
npm run dev
```

**Production mode**:

```bash
npm start
```

The server will start on `http://localhost:8000` (or the port specified in `.env`).

## API Endpoints

All endpoints are prefixed with `/api`:

- `POST /api/questions` - Create a new question
- `GET /api/questions` - Get all questions (with filters)
- `GET /api/questions/:id` - Get a question by ID
- `PUT /api/questions/:id` - Update a question
- `DELETE /api/questions/:id` - Delete a question
- `GET /api/questions/check-similarity` - Check for duplicate/similar questions
- `POST /api/questions/usage-by-text` - Record question usage by text
- `POST /api/questions/usage-by-text/search` - Get usage history by text
- `GET /api/questions/usage-by-text` - Get usage history by text (GET method)

## Project Structure

```
backend/
├── app/
│   ├── api/
│   │   └── routes.js          # API route handlers
│   ├── database.js             # Supabase client setup
│   ├── middleware/
│   │   ├── errorHandler.js    # Error handling middleware
│   │   └── validation.js      # Request validation
│   └── services/
│       ├── questionService.js  # Question CRUD operations
│       └── similarityService.js # Similarity detection
├── api/
│   └── index.js               # Vercel serverless entry point
├── server.js                   # Express app entry point
├── package.json
├── vercel.json                 # Vercel deployment config
└── supabase_migration.sql     # Database schema migration
```

## Similarity Detection

The system uses `@xenova/transformers` with the `all-MiniLM-L6-v2` model for semantic similarity detection. This is equivalent to the Python `sentence-transformers` library.

- **Model**: all-MiniLM-L6-v2 (lightweight, fast)
- **Threshold**: 0.85 (configurable via `SIMILARITY_THRESHOLD`)
- **Method**: Cosine similarity on sentence embeddings

## Deployment

### Vercel

The backend is configured for Vercel serverless deployment:

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the backend directory
3. Set environment variables in Vercel dashboard

The `vercel.json` file is already configured for Node.js deployment.

## Testing

Run tests (when implemented):

```bash
npm test
```

## Troubleshooting

### Database Connection Issues

- Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correct
- Check if your Supabase project is paused (restore it in dashboard)
- Ensure database tables are created (run migration)

### Model Loading Issues

- First run downloads the model (~80MB)
- Ensure you have internet connection for first run
- Model is cached locally after first download

### CORS Issues

- Add your frontend URL to `FRONTEND_URL` in `.env`
- Or add it manually to `corsOrigins` in `server.js`

