# Question Bank Management System - POC

A proof of concept (POC) system for managing descriptive exam questions from multiple colleges and assessment types. The system prevents duplicate question usage through exact matching and semantic similarity detection using sentence embeddings.

## Features

- **Question Management**: Add, update, search, and archive questions with comprehensive metadata
- **Duplicate Detection**: 
  - Exact match detection using SHA256 hashing
  - Semantic similarity detection using sentence embeddings (catches rephrased questions)
- **Usage Tracking**: Track when and where questions are used in exams
- **Search & Filter**: Search questions by text, subject, topic, college, exam type, and more
- **Web Interface**: Simple, modern HTML/CSS/JavaScript frontend
- **RESTful API**: Complete FastAPI backend with OpenAPI documentation

## Tech Stack

- **Backend**: Python 3.9+ with FastAPI
- **Database**: SQLite (easily upgradeable to PostgreSQL)
- **ORM**: SQLAlchemy
- **Similarity Detection**: Sentence Transformers (all-MiniLM-L6-v2)
- **Validation**: Pydantic
- **Testing**: Pytest

## Project Structure

```
Descriptive POC/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI application
│   ├── database.py             # Database connection
│   ├── models.py               # SQLAlchemy models
│   ├── schemas.py              # Pydantic schemas
│   ├── services/
│   │   ├── question_service.py # Question CRUD operations
│   │   └── similarity_service.py # Similarity detection
│   └── api/
│       └── routes.py           # API endpoints
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── tests/
│   ├── test_question_service.py
│   ├── test_similarity_service.py
│   └── test_api.py
├── requirements.txt
├── PLANNING.md
├── TASK.md
└── README.md
```

## Installation

### Prerequisites

- Python 3.9 or higher
- pip (Python package manager)

### Setup Steps

1. **Clone or navigate to the project directory**

```bash
cd "Descriptive POC"
```

2. **Create a virtual environment (recommended)**

```bash
python -m venv venv

# On Windows
venv\Scripts\activate

# On Linux/Mac
source venv/bin/activate
```

3. **Install dependencies**

```bash
pip install -r requirements.txt
```

4. **Set up environment variables (optional)**

Create a `.env` file in the project root (or use defaults):

```env
DATABASE_URL=sqlite:///./question_bank.db
SIMILARITY_THRESHOLD=0.85
DEBUG=True
HOST=0.0.0.0
PORT=8000
```

5. **Initialize the database**

The database will be automatically created when you first run the application.

## Running the Application

### Backend Server

Start the FastAPI backend:

```bash
python run.py
```

Or using uvicorn directly:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend API will be available at:
- **API Base URL**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Alternative API Docs**: http://localhost:8000/redoc

### Frontend Options

#### Option 1: React + Vite Frontend (Recommended)

1. Navigate to the React frontend directory:
```bash
cd frontend-react
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The React frontend will be available at http://localhost:3000

#### Option 2: HTML/JavaScript Frontend

The simple HTML frontend is served directly by the FastAPI backend at:
- **Web Interface**: http://localhost:8000

## Usage

### Web Interface

1. **Add Question**: Navigate to the "Add Question" tab and fill in the form
2. **Check Similarity**: Use the "Check Similarity" tab to verify if a question already exists
3. **Search Questions**: Use the "Search Questions" tab to find questions with filters
4. **Usage History**: View when and where questions have been used

### API Endpoints

#### Create Question
```bash
POST /api/questions
Content-Type: application/json

{
  "question_text": "What is Python?",
  "subject": "Computer Science",
  "topic": "Programming",
  "difficulty_level": "Easy",
  "marks": 5,
  "exam_type": "Mid",
  "college": "Test College"
}
```

#### Check Similarity
```bash
POST /api/questions/check-similarity?question_text=What is Python?
```

#### Get Questions
```bash
GET /api/questions?subject=CS&exam_type=Mid&limit=10
```

#### Record Usage
```bash
POST /api/questions/{question_id}/usage
Content-Type: application/json

{
  "exam_name": "Final Exam 2024",
  "exam_type": "End-Sem",
  "academic_year": "2023-24",
  "college": "Test College"
}
```

See the interactive API documentation at `/docs` for complete endpoint details.

## Testing

Run the test suite:

```bash
pytest
```

Run with coverage:

```bash
pytest --cov=app --cov-report=html
```

## Database Schema

### Questions Table
- `id`: Primary key
- `question_text`: Question content
- `question_hash`: SHA256 hash for exact duplicate detection
- `subject`: Subject/course name
- `topic`: Topic/unit
- `difficulty_level`: Easy/Medium/Hard
- `marks`: Marks allocated
- `exam_type`: Mid/End-Sem/Practical/Internal/External
- `college`: College/university name
- `created_date`: Creation timestamp
- `usage_count`: Number of times used
- `last_used_date`: Last usage timestamp
- `status`: Active/Blocked/Archived
- `embedding`: Vector embedding for similarity search

### Question Usage Table
- `id`: Primary key
- `question_id`: Foreign key to Questions
- `exam_name`: Name of exam
- `exam_type`: Type of exam
- `academic_year`: Academic year
- `college`: College where used
- `date_used`: Usage timestamp

## Similarity Detection

The system uses a two-tier approach:

1. **Exact Match**: SHA256 hash comparison for identical questions
2. **Semantic Similarity**: Sentence embeddings with cosine similarity
   - Model: `all-MiniLM-L6-v2` (lightweight, fast)
   - Threshold: 0.85 (configurable via `SIMILARITY_THRESHOLD`)
   - Catches rephrased questions with the same meaning

## Configuration

### Environment Variables

- `DATABASE_URL`: Database connection string (default: `sqlite:///./question_bank.db`)
- `SIMILARITY_THRESHOLD`: Similarity threshold 0.0-1.0 (default: `0.85`)
- `DEBUG`: Enable debug mode (default: `True`)
- `HOST`: Server host (default: `0.0.0.0`)
- `PORT`: Server port (default: `8000`)

## Future Enhancements

- Rules engine for preventing reuse based on custom rules
- Batch import of questions from CSV/Excel
- Export questions to various formats
- Advanced analytics and reporting
- User authentication and authorization
- Multi-language support
- Upgrade to PostgreSQL for production use

## Development

### Code Style

- Follow PEP8
- Use type hints
- Google-style docstrings
- Format with `black`
- Maximum 500 lines per file

### Adding New Features

1. Update `PLANNING.md` with architecture changes
2. Add task to `TASK.md`
3. Write tests for new functionality
4. Update `README.md` if needed
5. Mark task as complete in `TASK.md`

## Multi-User Access

To make the application accessible to multiple users on different laptops, see [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

**Quick Setup (Local Network)**:
1. Find your PC's IP address (run `get-ip-address.bat` on Windows or `get-ip-address.sh` on Linux/Mac)
2. Start the backend with `start-backend-network.bat` (or `.sh`)
3. Each user runs `setup-user.bat` (or `.sh`) and enters your IP address
4. Users then run `npm install` and `npm run dev` in the `frontend-react` folder

## Troubleshooting

### Database Issues
- Delete `question_bank.db` to reset the database
- Check database file permissions

### Similarity Detection Slow
- First run downloads the model (~80MB)
- Subsequent runs use cached model
- Consider using GPU for faster embeddings

### Frontend Not Loading
- Ensure static files are in `frontend/` directory
- Check browser console for errors
- Verify CORS settings if accessing from different origin

### Dependency Import Errors
If you encounter `ImportError: cannot import name 'cached_download' from 'huggingface_hub'`:
```bash
python -m pip install --upgrade sentence-transformers==2.7.0 "huggingface-hub>=0.20.0"
```
This error occurs when `sentence-transformers` version is incompatible with `huggingface-hub`. The fix is to upgrade to compatible versions.

## License

This is a proof of concept project for educational/demonstration purposes.

## Support

For issues or questions, please refer to the project documentation or create an issue in the repository.


