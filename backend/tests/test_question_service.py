"""Tests for question service."""

import pytest
from datetime import datetime
from app.services import question_service
from app.schemas import QuestionCreate, QuestionUpdate, QuestionUsageCreate
from app.models import Question, QuestionUsage
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


def test_create_question(db_session: Session):
    """Test creating a new question."""
    question_data = QuestionCreate(
        question_text="What is Python?",
        subject="Computer Science",
        topic="Programming",
        difficulty_level="Easy",
        marks=5,
        exam_type="Mid",
        college="Test College",
    )
    
    question = question_service.create_question(db_session, question_data)
    
    assert question.id is not None
    assert question.question_text == "What is Python?"
    assert question.subject == "Computer Science"
    assert question.question_hash is not None
    assert question.embedding is not None
    assert question.status == "Active"
    assert question.usage_count == 1  # Initial usage count is 1


def test_get_question(db_session: Session):
    """Test retrieving a question by ID."""
    # Create a question first
    question_data = QuestionCreate(
        question_text="What is Java?",
        subject="CS",
        difficulty_level="Medium",
        marks=10,
        exam_type="End-Sem",
        college="Test College",
    )
    created = question_service.create_question(db_session, question_data)
    
    # Retrieve it
    retrieved = question_service.get_question(db_session, created.id)
    
    assert retrieved is not None
    assert retrieved.id == created.id
    assert retrieved.question_text == "What is Java?"


def test_get_question_not_found(db_session: Session):
    """Test retrieving a non-existent question."""
    question = question_service.get_question(db_session, 99999)
    assert question is None


def test_get_all_questions(db_session: Session):
    """Test retrieving all questions with filters."""
    # Create multiple questions with distinct text to avoid similarity issues
    questions = [
        QuestionCreate(
            question_text=f"What is the main concept of topic {i} in computer science?",
            subject="CS" if i % 2 == 0 else "Math",
            difficulty_level="Easy",
            marks=5,
            exam_type="Mid",
            college="Test College",
        )
        for i in range(5)
    ]
    
    for q in questions:
        question_service.create_question(db_session, q)
    
    # Get all questions
    all_questions, total = question_service.get_all_questions(db_session)
    assert total == 5
    assert len(all_questions) == 5
    
    # Filter by subject
    cs_questions, cs_total = question_service.get_all_questions(db_session, subject="CS")
    assert cs_total >= 2
    
    # Filter by exam type
    mid_questions, mid_total = question_service.get_all_questions(db_session, exam_type="Mid")
    assert mid_total == 5


def test_update_question(db_session: Session):
    """Test updating a question."""
    # Create a question
    question_data = QuestionCreate(
        question_text="Original question",
        subject="CS",
        difficulty_level="Easy",
        marks=5,
        exam_type="Mid",
        college="Test College",
    )
    question = question_service.create_question(db_session, question_data)
    original_hash = question.question_hash
    
    # Update it
    update_data = QuestionUpdate(
        question_text="Updated question",
        difficulty_level="Hard",
        marks=10,
    )
    updated = question_service.update_question(db_session, question.id, update_data)
    
    assert updated.question_text == "Updated question"
    assert updated.difficulty_level == "Hard"
    assert updated.marks == 10
    assert updated.question_hash != original_hash  # Hash should change


def test_delete_question(db_session: Session):
    """Test deleting (archiving) a question."""
    # Create a question
    question_data = QuestionCreate(
        question_text="Question to delete",
        subject="CS",
        difficulty_level="Easy",
        marks=5,
        exam_type="Mid",
        college="Test College",
    )
    question = question_service.create_question(db_session, question_data)
    
    # Delete it
    success = question_service.delete_question(db_session, question.id)
    assert success is True
    
    # Verify it's permanently deleted
    deleted = question_service.get_question(db_session, question.id)
    assert deleted is None


def test_record_question_usage(db_session: Session):
    """Test recording question usage."""
    # Create a question
    question_data = QuestionCreate(
        question_text="Question for usage",
        subject="CS",
        difficulty_level="Easy",
        marks=5,
        exam_type="Mid",
        college="Test College",
    )
    question = question_service.create_question(db_session, question_data)
    assert question.usage_count == 1  # Initial usage count is 1
    
    # Record usage
    usage_data = QuestionUsageCreate(
        exam_name="Final Exam 2024",
        exam_type="End-Sem",
        academic_year="2023-24",
        college="Test College",
    )
    usage = question_service.record_question_usage(db_session, question.id, usage_data)
    
    assert usage.id is not None
    assert usage.question_id == question.id
    assert usage.exam_name == "Final Exam 2024"
    
    # Verify question usage count increased (was 1, now 2 after recording usage)
    updated_question = question_service.get_question(db_session, question.id)
    assert updated_question.usage_count == 2
    assert updated_question.last_used_date is not None


def test_get_question_usage_history(db_session: Session):
    """Test retrieving usage history."""
    # Create a question
    question_data = QuestionCreate(
        question_text="Question with history",
        subject="CS",
        difficulty_level="Easy",
        marks=5,
        exam_type="Mid",
        college="Test College",
    )
    question = question_service.create_question(db_session, question_data)
    
    # Record multiple usages
    for i in range(3):
        usage_data = QuestionUsageCreate(
            exam_name=f"Exam {i}",
            exam_type="Mid",
            academic_year="2023-24",
            college="Test College",
        )
        question_service.record_question_usage(db_session, question.id, usage_data)
    
    # Get history
    history = question_service.get_question_usage_history(db_session, question.id)
    assert len(history) == 3


def test_check_question_duplicate(db_session: Session):
    """Test duplicate checking."""
    # Create a question
    question_data = QuestionCreate(
        question_text="What is Python?",
        subject="CS",
        difficulty_level="Easy",
        marks=5,
        exam_type="Mid",
        college="Test College",
    )
    question = question_service.create_question(db_session, question_data)
    
    # Check for duplicate
    is_dup, exact, similar = question_service.check_question_duplicate(
        db_session, "What is Python?"
    )
    assert is_dup is True
    assert exact is True


def test_add_same_question_to_different_college(db_session: Session):
    """Test that the same question can be added to different colleges."""
    # Create a question in College A
    question_data_a = QuestionCreate(
        question_text="What is machine learning?",
        subject="CS",
        difficulty_level="Medium",
        marks=10,
        exam_type="End-Sem",
        college="College A",
    )
    question_a = question_service.create_question(db_session, question_data_a)
    assert question_a.college == "College A"
    assert question_a.usage_count == 1  # Initial usage count is 1
    
    # Add the same question to College B (should succeed)
    question_data_b = QuestionCreate(
        question_text="What is machine learning?",
        subject="CS",
        difficulty_level="Medium",
        marks=10,
        exam_type="End-Sem",
        college="College B",
    )
    question_b = question_service.create_question(db_session, question_data_b)
    assert question_b.college == "College B"
    assert question_b.id != question_a.id
    assert question_b.question_text == question_a.question_text
    # Usage count should be synchronized (both should have count = 2)
    assert question_b.usage_count == 2
    
    # Verify both questions exist and usage counts are synchronized
    db_session.refresh(question_a)
    assert question_a.usage_count == 2  # Should be synchronized


def test_cannot_add_duplicate_in_same_college(db_session: Session):
    """Test that duplicate questions cannot be added to the same college."""
    from app.services.question_service import DuplicateQuestionError
    
    # Create a question
    question_data = QuestionCreate(
        question_text="What is data science?",
        subject="CS",
        difficulty_level="Hard",
        marks=15,
        exam_type="End-Sem",
        college="College A",
    )
    question1 = question_service.create_question(db_session, question_data)
    original_usage_count = question1.usage_count
    
    # Try to add the same question to the same college (should raise error)
    with pytest.raises(DuplicateQuestionError) as exc_info:
        question_service.create_question(db_session, question_data)
    
    # Verify error details
    error = exc_info.value
    assert "question already exists" in str(error).lower() or "already exists" in str(error).lower()
    assert error.detail["code"] == "DUPLICATE_QUESTION_SAME_COLLEGE"
    assert error.detail["college"] == "College A"
    assert error.detail["existing_question_id"] == question1.id
    
    # Verify usage count was not incremented
    db_session.refresh(question1)
    assert question1.usage_count == original_usage_count


def test_get_usage_by_question_text(db_session: Session):
    """Test getting usage count and history by question text."""
    # Create a question in College A
    question_data_a = QuestionCreate(
        question_text="What is machine learning?",
        subject="CS",
        difficulty_level="Medium",
        marks=10,
        exam_type="End-Sem",
        college="College A",
    )
    question_a = question_service.create_question(db_session, question_data_a)
    assert question_a.usage_count == 1
    
    # Get usage by question text
    usage_data = question_service.get_usage_by_question_text(
        db_session, "What is machine learning?"
    )
    
    assert usage_data["usage_count"] == 1
    assert len(usage_data["question_ids"]) == 1
    assert question_a.id in usage_data["question_ids"]
    assert len(usage_data["questions"]) == 1
    assert len(usage_data["usage_history"]) == 0  # No usage recorded yet
    
    # Add the same question to College B
    question_data_b = QuestionCreate(
        question_text="What is machine learning?",
        subject="CS",
        difficulty_level="Medium",
        marks=10,
        exam_type="End-Sem",
        college="College B",
    )
    question_b = question_service.create_question(db_session, question_data_b)
    
    # Get usage again - should now show count of 2
    usage_data = question_service.get_usage_by_question_text(
        db_session, "What is machine learning?"
    )
    
    assert usage_data["usage_count"] == 2
    assert len(usage_data["question_ids"]) == 2
    assert question_a.id in usage_data["question_ids"]
    assert question_b.id in usage_data["question_ids"]
    assert len(usage_data["questions"]) == 2
    
    # Record usage for one of the questions
    usage_data_record = QuestionUsageCreate(
        exam_name="Final Exam 2024",
        exam_type="End-Sem",
        academic_year="2023-24",
        college="College A",
    )
    question_service.record_question_usage(db_session, question_a.id, usage_data_record)
    
    # Get usage again - should show usage history
    usage_data = question_service.get_usage_by_question_text(
        db_session, "What is machine learning?"
    )
    
    assert usage_data["usage_count"] == 3  # 2 from creation + 1 from recording
    assert len(usage_data["usage_history"]) == 1
    assert usage_data["usage_history"][0].exam_name == "Final Exam 2024"


def test_get_usage_by_question_text_not_found(db_session: Session):
    """Test getting usage for a question that doesn't exist."""
    usage_data = question_service.get_usage_by_question_text(
        db_session, "This question does not exist in the database"
    )
    
    assert usage_data["usage_count"] == 0
    assert len(usage_data["question_ids"]) == 0
    assert len(usage_data["questions"]) == 0
    assert len(usage_data["usage_history"]) == 0


