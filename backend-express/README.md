# Question Bank Backend - Express.js

Simple Express.js backend with JSON file storage for the Question Bank Management System.

## Features

- ✅ No database required - uses JSON file storage
- ✅ All CRUD operations for questions
- ✅ Duplicate detection (exact hash matching + string similarity)
- ✅ Usage tracking
- ✅ Easy deployment

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

The server will run on `http://localhost:8000` by default.

## API Endpoints

All endpoints are prefixed with `/api`:

- `POST /api/questions` - Create a new question
- `GET /api/questions` - Get all questions (with filters)
- `GET /api/questions/:id` - Get question by ID
- `PUT /api/questions/:id` - Update a question
- `DELETE /api/questions/:id` - Delete a question
- `GET /api/questions/check-similarity` - Check for duplicates/similar questions
- `POST /api/questions/usage-by-text` - Record question usage
- `POST /api/questions/usage-by-text/search` - Get usage history by question text

## Data Storage

Data is stored in `data/data.json`. The file structure is:

```json
{
  "questions": [],
  "usageHistory": [],
  "nextQuestionId": 1,
  "nextUsageId": 1
}
```

The file is automatically created on first run.

## Environment Variables

- `PORT` - Server port (default: 8000)
- `SIMILARITY_THRESHOLD` - Similarity threshold for duplicate detection (default: 0.85)

## Deployment

This backend can be easily deployed to:
- Vercel (serverless functions)
- Railway
- Render
- Any Node.js hosting platform

For Vercel, create a `vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "server.js"
    }
  ]
}
```


