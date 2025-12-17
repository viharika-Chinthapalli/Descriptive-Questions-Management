# Question Bank Management System - POC Planning

## Project Overview
A proof of concept (POC) system for managing descriptive exam questions from multiple colleges and assessment types. The system prevents duplicate question usage through exact matching and semantic similarity detection.

## Architecture

### Tech Stack
- **Backend**: Python 3.9+ with FastAPI
- **Database**: SQLite (for POC, easily upgradeable to PostgreSQL)
- **ORM**: SQLAlchemy
- **Similarity Detection**: Sentence Transformers (sentence embeddings)
- **Validation**: Pydantic
- **Frontend**: Simple HTML/CSS/JavaScript (can be upgraded to React later)
- **Testing**: Pytest

### Project Structure
```
Descriptive POC/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI application entry point
│   ├── database.py             # Database connection and session management
│   ├── models.py               # SQLAlchemy models
│   ├── schemas.py              # Pydantic schemas for validation
│   ├── services/
│   │   ├── __init__.py
│   │   ├── question_service.py # Question CRUD operations
│   │   └── similarity_service.py # Similarity detection logic
│   └── api/
│       ├── __init__.py
│       └── routes.py           # API endpoints
├── tests/
│   ├── __init__.py
│   ├── test_question_service.py
│   ├── test_similarity_service.py
│   └── test_api.py
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── .env.example
├── requirements.txt
├── README.md
├── PLANNING.md
└── TASK.md
```

## Database Schema

### Questions Table
- `id`: Primary key (auto-increment)
- `question_text`: Text content of the question
- `question_hash`: SHA256 hash for exact duplicate detection
- `subject`: Subject/course name
- `topic`: Topic/unit within subject
- `difficulty_level`: Easy/Medium/Hard
- `marks`: Marks allocated
- `exam_type`: Mid/End-Sem/Practical/Internal/External
- `college`: College/university name
- `created_date`: Timestamp when question was added
- `usage_count`: Number of times question has been used
- `last_used_date`: Last time question was used
- `status`: Active/Blocked/Archived
- `embedding`: Vector embedding for similarity search (stored as JSON)

### Question Usage Table
- `id`: Primary key
- `question_id`: Foreign key to Questions
- `exam_name`: Name of the exam
- `exam_type`: Type of exam
- `academic_year`: Academic year
- `college`: College where used
- `date_used`: Timestamp when used

## Core Features

### 1. Question Management
- Add new questions with metadata
- Update question details
- Archive/block questions
- View question history

### 2. Duplicate Detection
- **Exact Match**: Hash-based detection for identical questions
- **Similarity Match**: Embedding-based detection for rephrased questions
- Configurable similarity threshold (default: 0.85)

### 3. Usage Tracking
- Track when and where questions are used
- Prevent accidental reuse based on configurable rules
- Historical audit trail

### 4. Search & Filter
- Search by text, subject, topic, college
- Filter by exam type, difficulty, status
- View usage history

## Similarity Detection Strategy

1. **Exact Match**: Compare SHA256 hash of normalized question text
2. **Semantic Similarity**:
   - Generate embeddings using `sentence-transformers/all-MiniLM-L6-v2`
   - Compute cosine similarity between embeddings
   - Flag questions above threshold (default: 0.85)
3. **Performance**: Cache embeddings in database for faster comparison

## Rules Engine (Future Enhancement)
- Prevent reuse within last N years
- Prevent reuse in same college
- Allow reuse if marks/difficulty differ significantly
- Custom rules per college/exam type

## Code Style & Conventions
- Follow PEP8
- Use type hints for all functions
- Google-style docstrings
- Format with `black`
- Maximum 500 lines per file
- Modular, feature-based organization


