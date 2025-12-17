"""Tests for similarity service."""

import pytest
from app.services.similarity_service import (
    normalize_text,
    generate_hash,
    generate_embedding,
    cosine_similarity,
    check_exact_duplicate,
    find_similar_questions,
    check_similarity,
)
from app.models import Question
from app.database import SessionLocal, Base, engine
from sqlalchemy.orm import Session


@pytest.fixture
def db_session():
    """Create a test database session."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


def test_normalize_text():
    """Test text normalization."""
    assert normalize_text("  Hello World  ") == "hello world"
    assert normalize_text("HELLO") == "hello"
    assert normalize_text("Test\nQuestion") == "test\nquestion"


def test_generate_hash():
    """Test hash generation for exact duplicate detection."""
    hash1 = generate_hash("What is Python?")
    hash2 = generate_hash("What is Python?")
    hash3 = generate_hash("What is Java?")
    
    assert hash1 == hash2  # Same text should produce same hash
    assert hash1 != hash3  # Different text should produce different hash
    assert len(hash1) == 64  # SHA256 produces 64 character hex string


def test_generate_embedding():
    """Test embedding generation."""
    embedding = generate_embedding("What is Python?")
    
    assert isinstance(embedding, list)
    assert len(embedding) > 0
    assert all(isinstance(x, float) for x in embedding)


def test_cosine_similarity():
    """Test cosine similarity calculation."""
    vec1 = [1.0, 0.0, 0.0]
    vec2 = [1.0, 0.0, 0.0]
    vec3 = [0.0, 1.0, 0.0]
    
    # Identical vectors should have similarity of 1.0
    assert abs(cosine_similarity(vec1, vec2) - 1.0) < 0.001
    
    # Orthogonal vectors should have similarity of 0.0
    assert abs(cosine_similarity(vec1, vec3) - 0.0) < 0.001


def test_check_exact_duplicate(db_session: Session):
    """Test exact duplicate detection."""
    question_text = "What is the capital of France?"
    question_hash = generate_hash(question_text)
    
    # Create a question
    question = Question(
        question_text=question_text,
        question_hash=question_hash,
        subject="Geography",
        difficulty_level="Easy",
        marks=5,
        exam_type="Mid",
        college="Test College",
    )
    db_session.add(question)
    db_session.commit()
    
    # Check for duplicate
    duplicate = check_exact_duplicate(db_session, question_hash)
    assert duplicate is not None
    assert duplicate.question_text == question_text
    
    # Check for non-duplicate
    non_duplicate_hash = generate_hash("What is the capital of Germany?")
    non_duplicate = check_exact_duplicate(db_session, non_duplicate_hash)
    assert non_duplicate is None


def test_find_similar_questions(db_session: Session):
    """Test finding similar questions."""
    # Create questions with embeddings
    question1_text = "What is Python programming language?"
    question2_text = "Explain Python programming language."
    question3_text = "What is the weather today?"
    
    embedding1 = generate_embedding(question1_text)
    embedding2 = generate_embedding(question2_text)
    embedding3 = generate_embedding(question3_text)
    
    question1 = Question(
        question_text=question1_text,
        question_hash=generate_hash(question1_text),
        subject="CS",
        difficulty_level="Medium",
        marks=10,
        exam_type="Mid",
        college="Test College",
        embedding=embedding1,
        status="Active",
    )
    
    question2 = Question(
        question_text=question2_text,
        question_hash=generate_hash(question2_text),
        subject="CS",
        difficulty_level="Medium",
        marks=10,
        exam_type="Mid",
        college="Test College",
        embedding=embedding2,
        status="Active",
    )
    
    question3 = Question(
        question_text=question3_text,
        question_hash=generate_hash(question3_text),
        subject="Geography",
        difficulty_level="Easy",
        marks=5,
        exam_type="Mid",
        college="Test College",
        embedding=embedding3,
        status="Active",
    )
    
    db_session.add_all([question1, question2, question3])
    db_session.commit()
    
    # Find similar questions to question1
    similar = find_similar_questions(db_session, embedding1, threshold=0.5)
    
    # Should find question2 as similar (both about Python)
    assert len(similar) >= 1
    similar_ids = [q.id for q, _ in similar]
    assert question2.id in similar_ids


def test_check_similarity(db_session: Session):
    """Test complete similarity check."""
    # Create a question
    question_text = "What is machine learning?"
    embedding = generate_embedding(question_text)
    
    question = Question(
        question_text=question_text,
        question_hash=generate_hash(question_text),
        subject="CS",
        difficulty_level="Hard",
        marks=15,
        exam_type="End-Sem",
        college="Test College",
        embedding=embedding,
        status="Active",
    )
    db_session.add(question)
    db_session.commit()
    
    # Check exact duplicate
    is_dup, exact, similar = check_similarity(db_session, question_text)
    assert is_dup is True
    assert exact is True
    assert len(similar) > 0
    
    # Check completely different question
    is_dup2, exact2, similar2 = check_similarity(db_session, "What is the weather today?")
    assert exact2 is False
    # May or may not be similar depending on threshold


