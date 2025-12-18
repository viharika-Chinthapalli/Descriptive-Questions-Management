"""Tests for API endpoints."""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine, get_db
from app.models import Question
from app.services.similarity_service import generate_hash, generate_embedding
from sqlalchemy.orm import sessionmaker

# Create test database
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture
def db_session():
    """Create a test database session."""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client(db_session):
    """Create a test client with database override."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


def test_create_question(client):
    """Test creating a question via API."""
    question_data = {
        "question_text": "What is Python programming?",
        "subject": "Computer Science",
        "topic": "Programming",
        "difficulty_level": "Easy",
        "marks": 5,
        "exam_type": "Mid",
        "college": "Test College",
    }
    
    response = client.post("/api/questions", json=question_data)
    assert response.status_code == 201
    data = response.json()
    assert data["question_text"] == question_data["question_text"]
    assert data["id"] is not None


def test_create_question_invalid_data(client):
    """Test creating a question with invalid data."""
    invalid_data = {
        "question_text": "Short",  # Too short
        "subject": "CS",
        "difficulty_level": "Invalid",  # Invalid difficulty
        "marks": 5,
        "exam_type": "Mid",
        "college": "Test College",
    }
    
    response = client.post("/api/questions", json=invalid_data)
    assert response.status_code == 422  # Validation error


def test_get_question(client, db_session):
    """Test retrieving a question via API."""
    # Create a question first
    question = Question(
        question_text="Test question",
        question_hash=generate_hash("Test question"),
        subject="CS",
        difficulty_level="Easy",
        marks=5,
        exam_type="Mid",
        college="Test College",
        embedding=generate_embedding("Test question"),
    )
    db_session.add(question)
    db_session.commit()
    
    response = client.get(f"/api/questions/{question.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == question.id
    assert data["question_text"] == "Test question"


def test_get_question_not_found(client):
    """Test retrieving a non-existent question."""
    response = client.get("/api/questions/99999")
    assert response.status_code == 404


def test_get_all_questions(client, db_session):
    """Test retrieving all questions via API."""
    # Create some questions
    for i in range(3):
        question = Question(
            question_text=f"Question {i}",
            question_hash=generate_hash(f"Question {i}"),
            subject="CS",
            difficulty_level="Easy",
            marks=5,
            exam_type="Mid",
            college="Test College",
            embedding=generate_embedding(f"Question {i}"),
        )
        db_session.add(question)
    db_session.commit()
    
    response = client.get("/api/questions")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 3
    assert len(data["questions"]) >= 3


def test_check_similarity(client, db_session):
    """Test similarity checking via API."""
    # Create a question
    question = Question(
        question_text="What is Python programming language?",
        question_hash=generate_hash("What is Python programming language?"),
        subject="CS",
        difficulty_level="Easy",
        marks=5,
        exam_type="Mid",
        college="Test College",
        embedding=generate_embedding("What is Python programming language?"),
        status="Active",
    )
    db_session.add(question)
    db_session.commit()
    
    # Check for similar question
    response = client.get(
        "/api/questions/check-similarity",
        params={"question_text": "What is Python programming language?"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["is_duplicate"] is True
    assert data["exact_match"] is True


def test_health_check(client):
    """Test health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_get_usage_by_question_text(client, db_session):
    """Test getting usage by question text via API."""
    from app.services.similarity_service import generate_hash, generate_embedding
    
    # Create a question
    question = Question(
        question_text="What is Python programming language?",
        question_hash=generate_hash("What is Python programming language?"),
        subject="CS",
        difficulty_level="Easy",
        marks=5,
        exam_type="Mid",
        college="Test College",
        embedding=generate_embedding("What is Python programming language?"),
        status="Active",
        usage_count=1,
    )
    db_session.add(question)
    db_session.commit()
    
    # Get usage by question text
    response = client.get(
        "/api/questions/usage-by-text",
        params={"question_text": "What is Python programming language?"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["usage_count"] == 1
    assert len(data["question_ids"]) == 1
    assert question.id in data["question_ids"]


def test_get_usage_by_question_text_not_found(client):
    """Test getting usage for non-existent question text."""
    response = client.get(
        "/api/questions/usage-by-text",
        params={"question_text": "This question does not exist in the database"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["usage_count"] == 0
    assert len(data["question_ids"]) == 0
    assert len(data["usage_history"]) == 0


def test_get_usage_by_question_text_invalid(client):
    """Test getting usage with invalid question text (too short)."""
    response = client.get(
        "/api/questions/usage-by-text",
        params={"question_text": "Short"}
    )
    assert response.status_code == 422  # Validation error


