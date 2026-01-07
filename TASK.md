# Task List

## 2024-12-19

### Deployment Guidelines
- [x] Create comprehensive deployment guidelines for both frontend and backend
  - Created `DEPLOYMENT_GUIDELINES.md` with complete deployment instructions
  - Covers multiple deployment options (Vercel, Railway, Render, VPS, Docker)
  - Includes environment setup, security considerations, troubleshooting
  - Added deployment checklists for pre, during, and post-deployment
- [x] Simplify deployment guidelines to single free option
  - Updated `DEPLOYMENT_GUIDELINES.md` to focus on Railway (backend) + Vercel (frontend)
  - Simplified to step-by-step guide for quick POC deployment
  - Removed multiple options, kept only the recommended free tier combination
- [x] Update deployment to use Render instead of Railway
  - Changed backend deployment from Railway to Render (free tier available)
  - Added Supabase database setup (free tier PostgreSQL)
  - Updated all steps, troubleshooting, and references to use Render + Supabase
- [x] Update deployment to use Fly.io instead of Render
  - Changed backend deployment from Render to Fly.io (faster deployments)
  - Updated all steps to use Fly.io CLI commands
  - Added fly.toml.example configuration file
  - Updated troubleshooting and commands reference

## 2024-12-20

### Simplified Backend - Express.js with JSON Storage
- [x] Convert backend from Python FastAPI to Express.js
  - Created new `backend-express` folder with Express.js backend
  - Replaced PostgreSQL database with JSON file storage
  - Implemented all CRUD operations using JSON file
  - Replaced sentence-transformers with string-similarity library for duplicate detection
  - Maintained same API endpoints for frontend compatibility
  - Added deployment configuration (vercel.json)
  - Created SIMPLE_DEPLOYMENT.md guide
  - Benefits: No database setup required, easier deployment, same API structure
