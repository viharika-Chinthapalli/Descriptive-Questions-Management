"""Service for question CRUD operations."""

from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from app.models import Question, QuestionUsage
from app.schemas import QuestionCreate, QuestionUpdate, QuestionUsageCreate
from app.services.similarity_service import (
    generate_hash,
    generate_embedding,
    check_similarity,
    check_exact_duplicate,
)


class DuplicateQuestionError(ValueError):
    """Custom exception for duplicate or similar questions."""

    def __init__(self, message: str, detail: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.detail = detail or {"message": message}

    def to_detail(self) -> Dict[str, Any]:
        return {"message": str(self), **self.detail}


def create_question(db: Session, question: QuestionCreate) -> Question:
    """
    Create a new question in the database.
    
    Duplicate Detection Rules:
    1. Same question, same college → Raises error: "Question already exists"
    2. Same question, different college → Allows creation, sets usage_count to
       the total number of times this question has been added across all colleges
    
    Args:
        db (Session): Database session.
        question (QuestionCreate): Question data.

    Returns:
        Question: Created question object.

    Raises:
        DuplicateQuestionError: If duplicate question found in the same college.
    """
    # Check for existing exact matches (any college)
    question_hash = generate_hash(question.question_text)
    existing_exact_all = (
        db.query(Question)
        .filter(
            Question.question_hash == question_hash,
            Question.status == "Active",
        )
        .all()
    )

    # If an exact duplicate exists in the same college, raise an error
    existing_same_college = next(
        (q for q in existing_exact_all if q.college == question.college), None
    )
    if existing_same_college:
        raise DuplicateQuestionError(
            message="Question already exists",
            detail={
                "code": "DUPLICATE_QUESTION_SAME_COLLEGE",
                "message": "Question already exists",
                "college": question.college,
                "existing_question_id": existing_same_college.id,
            },
        )

    # If exact matches exist in other colleges, synchronize usage_count across all
    if existing_exact_all:
        # When the same question is added to another college, usage_count should
        # represent how many times this question has been added in total
        # (irrespective of college). This is:
        #   existing_exact_all (current count) + 1 (this new insert).
        new_total_usage = len(existing_exact_all) + 1
        # Update all existing matches to the new total usage count
        for q in existing_exact_all:
            q.usage_count = new_total_usage
        db.flush()  # stage updates before adding new question
        # If exact duplicate exists in another college, allow adding to new college
        # Skip similarity check since we're allowing cross-college duplicates
        # Only check similarity if no exact duplicates exist anywhere
    else:
        # Check for similar questions within the same college (only if no exact duplicate exists)
        is_duplicate, exact_match, similar_questions = check_similarity(
            db, question.question_text, college=question.college
        )
        if is_duplicate:
            similar_count = len(similar_questions)
            similar_ids = [q.id for q, _ in similar_questions[:5]]  # Show first 5 IDs
            raise DuplicateQuestionError(
                message=(
                    f"Similar question(s) found in college '{question.college}'. "
                    "Please review existing questions or modify your question text."
                ),
                detail={
                    "code": "SIMILAR_QUESTION",
                    "college": question.college,
                    "similar_count": similar_count,
                    "similar_question_ids": similar_ids,
                },
            )
    
    # Generate hash and embedding
    embedding = generate_embedding(question.question_text)
    
    # Set usage_count:
    # - If this is the first time the question is added anywhere: 1
    # - If it already exists in other colleges: total number of occurrences
    usage_count = len(existing_exact_all) + 1 if existing_exact_all else 1
    
    db_question = Question(
        question_text=question.question_text,
        question_hash=question_hash,
        subject=question.subject,
        topic=question.topic,
        difficulty_level=question.difficulty_level,
        marks=question.marks,
        exam_type=question.exam_type,
        college=question.college,
        embedding=embedding,
        status="Active",
        usage_count=usage_count,
    )
    
    db.add(db_question)
    db.commit()
    db.refresh(db_question)
    
    return db_question


def get_question(db: Session, question_id: int) -> Optional[Question]:
    """
    Get a question by ID.

    Args:
        db (Session): Database session.
        question_id (int): Question ID.

    Returns:
        Optional[Question]: Question if found, None otherwise.
    """
    return db.query(Question).filter(Question.id == question_id).first()


def get_all_questions(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    subject: Optional[str] = None,
    exam_type: Optional[str] = None,
    college: Optional[str] = None,
    status: Optional[str] = None,
    search_text: Optional[str] = None,
) -> Tuple[List[Question], int]:
    """
    Get all questions with optional filters.

    Args:
        db (Session): Database session.
        skip (int): Number of records to skip.
        limit (int): Maximum number of records to return.
        subject (Optional[str]): Filter by subject.
        exam_type (Optional[str]): Filter by exam type.
        college (Optional[str]): Filter by college.
        status (Optional[str]): Filter by status.
        search_text (Optional[str]): Search in question text.

    Returns:
        Tuple[List[Question], int]: List of questions and total count.
    """
    query = db.query(Question)
    
    # Apply filters
    if subject:
        query = query.filter(Question.subject.ilike(f"%{subject}%"))
    if exam_type:
        query = query.filter(Question.exam_type == exam_type)
    if college:
        query = query.filter(Question.college.ilike(f"%{college}%"))
    if status:
        query = query.filter(Question.status == status)
    if search_text:
        query = query.filter(Question.question_text.ilike(f"%{search_text}%"))
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    questions = query.order_by(Question.created_date.desc()).offset(skip).limit(limit).all()
    
    return questions, total


def update_question(db: Session, question_id: int, question_update: QuestionUpdate) -> Optional[Question]:
    """
    Update a question.

    Args:
        db (Session): Database session.
        question_id (int): Question ID.
        question_update (QuestionUpdate): Updated question data.

    Returns:
        Optional[Question]: Updated question if found, None otherwise.
    """
    db_question = get_question(db, question_id)
    if not db_question:
        return None
    
    # Update fields
    update_data = question_update.model_dump(exclude_unset=True)
    
    # If question text is updated, regenerate hash and embedding
    if "question_text" in update_data:
        db_question.question_hash = generate_hash(update_data["question_text"])
        db_question.embedding = generate_embedding(update_data["question_text"])
    
    for field, value in update_data.items():
        setattr(db_question, field, value)
    
    db.commit()
    db.refresh(db_question)
    
    return db_question


def delete_question(db: Session, question_id: int) -> bool:
    """
    Permanently delete a question from the database.

    Args:
        db (Session): Database session.
        question_id (int): Question ID.

    Returns:
        bool: True if question was found and deleted, False otherwise.
    """
    try:
        db_question = get_question(db, question_id)
        if not db_question:
            return False
        
        # Permanently delete the question
        # Note: This will also delete related usage history due to cascade="all, delete-orphan"
        db.delete(db_question)
        db.commit()
        
        return True
    except Exception as e:
        db.rollback()
        raise e


def record_question_usage(db: Session, question_id: int, usage: QuestionUsageCreate) -> QuestionUsage:
    """
    Record that a question has been used in an exam.

    Args:
        db (Session): Database session.
        question_id (int): Question ID.
        usage (QuestionUsageCreate): Usage information.

    Returns:
        QuestionUsage: Created usage record.
    """
    # Get question and update usage count
    db_question = get_question(db, question_id)
    if not db_question:
        raise ValueError(f"Question with ID {question_id} not found")
    
    # Create usage record
    db_usage = QuestionUsage(
        question_id=question_id,
        exam_name=usage.exam_name,
        exam_type=usage.exam_type,
        academic_year=usage.academic_year,
        college=usage.college,
    )
    
    db.add(db_usage)
    
    # Update question usage statistics
    db_question.usage_count += 1
    from datetime import datetime
    db_question.last_used_date = datetime.utcnow()
    
    db.commit()
    db.refresh(db_usage)
    
    return db_usage


def record_question_usage_by_text(
    db: Session,
    question_text: str,
    usage: QuestionUsageCreate,
) -> QuestionUsage:
    """
    Record question usage using question text instead of explicit question ID.

    This function:
    - Finds all active questions that exactly match the given text (across colleges)
      using the same hash logic as get_usage_by_question_text.
    - Records usage for the first matching question.

    Args:
        db (Session): Database session.
        question_text (str): Question text to match.
        usage (QuestionUsageCreate): Usage information.

    Returns:
        QuestionUsage: Created usage record.

    Raises:
        ValueError: If no matching question is found for the given text.
    """
    # Reuse the same matching logic as get_usage_by_question_text
    question_hash = generate_hash(question_text)
    matching_questions = (
        db.query(Question)
        .filter(
            Question.question_hash == question_hash,
            Question.status == "Active",
        )
        .all()
    )

    if not matching_questions:
        raise ValueError("Question not found for the given text")

    # Record usage for the first matching question
    # Reason: Frontend only needs aggregated usage, and IDs are internal details.
    primary_question = matching_questions[0]
    return record_question_usage(db, primary_question.id, usage)


def get_question_usage_history(db: Session, question_id: int) -> List[QuestionUsage]:
    """
    Get usage history for a question.

    Args:
        db (Session): Database session.
        question_id (int): Question ID.

    Returns:
        List[QuestionUsage]: List of usage records.
    """
    return (
        db.query(QuestionUsage)
        .filter(QuestionUsage.question_id == question_id)
        .order_by(QuestionUsage.date_used.desc())
        .all()
    )


def check_question_duplicate(db: Session, question_text: str, exclude_id: Optional[int] = None, college: Optional[str] = None) -> Tuple[bool, bool, List[Tuple[Question, float]]]:
    """
    Check if a question is duplicate or similar to existing questions.
    If college is provided, only checks within that college.

    Args:
        db (Session): Database session.
        question_text (str): Question text to check.
        exclude_id (Optional[int]): Question ID to exclude from results.
        college (Optional[str]): College name to filter by. If provided, only checks duplicates in this college.

    Returns:
        Tuple[bool, bool, List[Tuple[Question, float]]]:
            - is_duplicate: True if exact or similar match found
            - exact_match: True if exact match found
            - similar_questions: List of (question, similarity_score) tuples
    """
    return check_similarity(db, question_text, exclude_id=exclude_id, college=college)


def get_usage_by_question_text(db: Session, question_text: str) -> Dict[str, Any]:
    """
    Get usage count and history for a question by its text.
    Finds all questions with the same text (across all colleges) and aggregates their usage.

    Args:
        db (Session): Database session.
        question_text (str): Question text to search for.

    Returns:
        Dict[str, Any]: Dictionary containing:
            - usage_count: Total usage count across all matching questions
            - question_text: The question text that was searched
            - matching_questions_count: Number of matching questions
            - usage_history: Combined usage history from all matching questions (with question_text)
            - questions: List of matching question objects
    """
    # Generate hash to find exact matches
    question_hash = generate_hash(question_text)
    
    # Find all questions with the same hash (same question text, any college)
    matching_questions = (
        db.query(Question)
        .filter(
            Question.question_hash == question_hash,
            Question.status == "Active",
        )
        .all()
    )
    
    if not matching_questions:
        return {
            "usage_count": 0,
            "question_text": question_text,
            "matching_questions_count": 0,
            "usage_history": [],
            "questions": [],
        }
    
    # Get all question IDs for querying usage history
    question_ids = [q.id for q in matching_questions]
    
    # Get combined usage history from all matching questions
    all_usage_history = (
        db.query(QuestionUsage)
        .filter(QuestionUsage.question_id.in_(question_ids))
        .order_by(QuestionUsage.date_used.desc())
        .all()
    )
    
    # Enrich usage history with question_text
    # Reason: Frontend needs question text, not IDs, for display
    enriched_usage_history = []
    for usage in all_usage_history:
        # Find the question for this usage record to get its text
        usage_question = next(
            (q for q in matching_questions if q.id == usage.question_id),
            None
        )
        if usage_question:
            # Create a dict with question_text added
            usage_dict = {
                "id": usage.id,
                "question_id": usage.question_id,
                "question_text": usage_question.question_text,
                "exam_name": usage.exam_name,
                "exam_type": usage.exam_type,
                "academic_year": usage.academic_year,
                "college": usage.college,
                "date_used": usage.date_used,
            }
            enriched_usage_history.append(usage_dict)
    
    # Get usage count (should be the same for all matching questions due to synchronization)
    # Use the first question's usage_count as they should all be synchronized
    usage_count = matching_questions[0].usage_count if matching_questions else 0
    
    return {
        "usage_count": usage_count,
        "question_text": question_text,
        "matching_questions_count": len(matching_questions),
        "usage_history": enriched_usage_history,
        "questions": matching_questions,
    }


