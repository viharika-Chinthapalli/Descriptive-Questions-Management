"""FastAPI route handlers."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.schemas import (
    QuestionCreate,
    QuestionUpdate,
    QuestionResponse,
    QuestionUsageCreate,
    QuestionUsageResponse,
    SimilarityCheckResponse,
    QuestionSearchResponse,
)
from app.services import question_service
from app.services.question_service import DuplicateQuestionError

router = APIRouter()


@router.post("/questions", response_model=QuestionResponse, status_code=201)
def create_question(
    question: QuestionCreate,
    db: Session = Depends(get_db),
):
    """
    Create a new question.
    Prevents duplicate questions within the same college.

    Args:
        question (QuestionCreate): Question data.
        db (Session): Database session.

    Returns:
        QuestionResponse: Created question.

    Raises:
        HTTPException: If duplicate question found in the same college.
    """
    try:
        return question_service.create_question(db, question)
    except DuplicateQuestionError as e:
        raise HTTPException(status_code=400, detail=e.to_detail())
    except ValueError as e:
        raise HTTPException(status_code=400, detail={"message": str(e), "code": "VALIDATION_ERROR"})


@router.get("/questions/{question_id}", response_model=QuestionResponse)
def get_question(
    question_id: int,
    db: Session = Depends(get_db),
):
    """
    Get a question by ID.

    Args:
        question_id (int): Question ID.
        db (Session): Database session.

    Returns:
        QuestionResponse: Question data.

    Raises:
        HTTPException: If question not found.
    """
    question = question_service.get_question(db, question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    return question


@router.get("/questions", response_model=QuestionSearchResponse)
def get_questions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    subject: Optional[str] = None,
    exam_type: Optional[str] = None,
    college: Optional[str] = None,
    status: Optional[str] = None,
    search_text: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    Get all questions with optional filters and pagination.

    Args:
        skip (int): Number of records to skip.
        limit (int): Maximum number of records to return.
        subject (Optional[str]): Filter by subject.
        exam_type (Optional[str]): Filter by exam type.
        college (Optional[str]): Filter by college.
        status (Optional[str]): Filter by status.
        search_text (Optional[str]): Search in question text.
        db (Session): Database session.

    Returns:
        QuestionSearchResponse: List of questions with pagination info.
    """
    questions, total = question_service.get_all_questions(
        db=db,
        skip=skip,
        limit=limit,
        subject=subject,
        exam_type=exam_type,
        college=college,
        status=status,
        search_text=search_text,
    )
    
    return QuestionSearchResponse(
        questions=questions,
        total=total,
        page=skip // limit + 1 if limit > 0 else 1,
        page_size=limit,
    )


@router.put("/questions/{question_id}", response_model=QuestionResponse)
def update_question(
    question_id: int,
    question_update: QuestionUpdate,
    db: Session = Depends(get_db),
):
    """
    Update a question.

    Args:
        question_id (int): Question ID.
        question_update (QuestionUpdate): Updated question data.
        db (Session): Database session.

    Returns:
        QuestionResponse: Updated question.

    Raises:
        HTTPException: If question not found.
    """
    question = question_service.update_question(db, question_id, question_update)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    return question


@router.delete("/questions/{question_id}", status_code=200)
def delete_question(
    question_id: int,
    db: Session = Depends(get_db),
):
    """
    Permanently delete a question from the database.

    Args:
        question_id (int): Question ID.
        db (Session): Database session.

    Returns:
        dict: Success message.

    Raises:
        HTTPException: If question not found.
    """
    success = question_service.delete_question(db, question_id)
    if not success:
        raise HTTPException(status_code=404, detail="Question not found")
    return {"message": "Question permanently deleted successfully", "question_id": question_id}


@router.post("/questions/{question_id}/usage", response_model=QuestionUsageResponse, status_code=201)
def record_question_usage(
    question_id: int,
    usage: QuestionUsageCreate,
    db: Session = Depends(get_db),
):
    """
    Record that a question has been used in an exam.

    Args:
        question_id (int): Question ID.
        usage (QuestionUsageCreate): Usage information.
        db (Session): Database session.

    Returns:
        QuestionUsageResponse: Created usage record.

    Raises:
        HTTPException: If question not found or invalid data.
    """
    try:
        return question_service.record_question_usage(db, question_id, usage)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/questions/{question_id}/usage", response_model=List[QuestionUsageResponse])
def get_question_usage_history(
    question_id: int,
    db: Session = Depends(get_db),
):
    """
    Get usage history for a question.

    Args:
        question_id (int): Question ID.
        db (Session): Database session.

    Returns:
        List[QuestionUsageResponse]: List of usage records.
    """
    return question_service.get_question_usage_history(db, question_id)


@router.get("/questions/check-similarity", response_model=SimilarityCheckResponse)
def check_question_similarity(
    question_text: str = Query(..., min_length=10),
    exclude_id: Optional[int] = Query(None),
    college: Optional[str] = Query(None, description="College name. If provided, only checks duplicates in this college."),
    db: Session = Depends(get_db),
):
    """
    Check if a question is duplicate or similar to existing questions.
    If college is provided, only checks within that college.

    Args:
        question_text (str): Question text to check.
        exclude_id (Optional[int]): Question ID to exclude from results.
        college (Optional[str]): College name. If provided, only checks duplicates in this college.
        db (Session): Database session.

    Returns:
        SimilarityCheckResponse: Similarity check results.
    """
    is_duplicate, exact_match, similar_questions = question_service.check_question_duplicate(
        db, question_text, exclude_id=exclude_id, college=college
    )
    
    questions = [q for q, _ in similar_questions]
    scores = [score for _, score in similar_questions]
    
    return SimilarityCheckResponse(
        is_duplicate=is_duplicate,
        exact_match=exact_match,
        similar_questions=questions,
        similarity_scores=scores,
    )


