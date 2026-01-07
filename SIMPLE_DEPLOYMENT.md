# Simple Deployment Guide - Express.js + JSON Storage

This guide shows how to deploy the Question Bank system with the simplified Express.js backend using JSON file storage.

## Architecture

- **Frontend**: React app (deploy to Vercel)
- **Backend**: Express.js with JSON file storage (deploy to Vercel or any Node.js host)

## Why This Approach Works

✅ **No Database Required** - Data stored in JSON file  
✅ **Simple Deployment** - Just Node.js, no database setup  
✅ **Easy to Deploy** - Works on any Node.js hosting platform  
✅ **Same API** - Frontend doesn't need changes  

## Limitations

⚠️ **JSON File Storage**:
- Data is stored in a single JSON file
- Not suitable for high-traffic production (but fine for POC)
- File-based storage means concurrent writes could be an issue (mitigated by async file operations)
- For production scale, consider migrating to a database later

⚠️ **Similarity Detection**:
- Uses `string-similarity` library instead of ML embeddings
- Less accurate than sentence-transformers but much simpler
- Good enough for POC purposes

## Deployment Steps

### Option 1: Deploy Both to Vercel (Recommended)

#### Backend Deployment

1. **Navigate to backend-express folder**:
```bash
cd backend-express
```

2. **Install dependencies**:
```bash
npm install
```

3. **Deploy to Vercel**:
```bash
# Install Vercel CLI if needed
npm i -g vercel

# Deploy
vercel
```

4. **Note your backend URL** (e.g., `https://your-backend.vercel.app`)

#### Frontend Deployment

1. **Navigate to frontend-react folder**:
```bash
cd frontend-react
```

2. **Set environment variable**:
   - In Vercel dashboard, go to your frontend project settings
   - Add environment variable: `VITE_API_BASE_URL=https://your-backend.vercel.app`

3. **Deploy**:
```bash
vercel
```

### Option 2: Deploy Backend to Railway/Render

1. **Create account** on Railway or Render

2. **Create new Node.js service**

3. **Connect your repository** and set:
   - **Root Directory**: `backend-express`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

4. **Set environment variables**:
   - `PORT` (usually auto-set by platform)
   - `SIMILARITY_THRESHOLD=0.85` (optional)

5. **Deploy and note the URL**

6. **Update frontend** with the backend URL

### Option 3: Deploy Backend Locally (Development)

1. **Start backend**:
```bash
cd backend-express
npm install
npm start
```

2. **Update frontend config** to point to `http://localhost:8000`

## Data Persistence

⚠️ **Important**: JSON file storage means:
- On serverless platforms (Vercel), data is **ephemeral** - it resets on each deployment
- For persistent storage, consider:
  - Using a file storage service (AWS S3, Google Cloud Storage)
  - Using a database (MongoDB Atlas free tier, Supabase)
  - Using a key-value store (Upstash Redis free tier)

For a POC, ephemeral storage is fine for testing.

## Testing the Deployment

1. **Check backend health**:
```bash
curl https://your-backend.vercel.app/health
```

2. **Test API**:
```bash
curl https://your-backend.vercel.app/api/questions
```

3. **Access frontend** and test all features

## Migration Path (If Needed Later)

If you need persistent storage later:

1. **Keep the same API structure**
2. **Replace `storage.js`** with database calls
3. **No frontend changes needed**

## Troubleshooting

### Backend not responding
- Check if `PORT` environment variable is set correctly
- Verify the server starts locally first

### CORS errors
- Backend includes CORS middleware, should work out of the box
- If issues persist, check frontend API base URL

### Data not persisting (Vercel)
- This is expected with serverless functions
- Consider using external storage for production

## Next Steps

1. Deploy backend to Vercel
2. Deploy frontend to Vercel with backend URL
3. Test all features
4. If you need persistent storage, migrate to a database


