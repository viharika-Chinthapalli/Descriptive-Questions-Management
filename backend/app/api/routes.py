"""FastAPI route handlers."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError, DatabaseError
from typing import List, Optional
import logging
from urllib.parse import unquote
from app.database import get_db
from app.schemas import (
    QuestionCreate,
    QuestionUpdate,
    QuestionResponse,
    QuestionUsageCreate,
    QuestionUsageByTextCreate,
    QuestionUsageByTextRequest,
    QuestionUsageResponse,
    SimilarityCheckResponse,
    QuestionSearchResponse,
    QuestionUsageByTextResponse,
)
from app.services import question_service
from app.services.question_service import DuplicateQuestionError

logger = logging.getLogger(__name__)
router = APIRouter()


def handle_database_error(e: Exception) -> HTTPException:
    """
    Handle database connection errors and provide user-friendly messages.
    
    Args:
        e: Database exception.
        
    Returns:
        HTTPException: Formatted HTTP exception.
    """
    error_msg = str(e)
    
    if "Tenant or user not found" in error_msg or "authentication failed" in error_msg.lower():
        logger.error(f"Database authentication error: {error_msg}")
        return HTTPException(
            status_code=503,
            detail={
                "message": "Database authentication failed. Please check your Supabase connection string.",
                "error": "DATABASE_AUTH_ERROR",
                "hint": (
                    "Verify your DATABASE_URL in .env file. For Connection Pooler, username should be postgres.[PROJECT-REF]. "
                    "Get a fresh connection string from: Supabase Dashboard → Settings → Database → Connection Pooling → Session mode. "
                    "Make sure password is URL-encoded (use: python encode_password.py YOUR_PASSWORD)"
                ),
                "help": "Run 'python fix_supabase_connection.py' for an interactive fix, or 'python test_supabase_auth.py' to diagnose."
            }
        )
    elif "could not translate host name" in error_msg.lower() or "getaddrinfo" in error_msg.lower():
        logger.error(f"Database connection error: {error_msg}")
        return HTTPException(
            status_code=503,
            detail={
                "message": "Cannot connect to Supabase. Please check if your project is active.",
                "error": "DATABASE_CONNECTION_ERROR",
                "hint": "Go to https://supabase.com/dashboard and restore your project if it's paused"
            }
        )
    else:
        logger.error(f"Database error: {error_msg}")
        return HTTPException(
            status_code=503,
            detail={
                "message": "Database error occurred. Please check your Supabase configuration.",
                "error": "DATABASE_ERROR",
                "hint": "See SUPABASE_SETUP.md for setup instructions"
            }
        )


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
    except (OperationalError, DatabaseError) as e:
        raise handle_database_error(e)
    except DuplicateQuestionError as e:
        # Return 400 Bad Request with clear error message
        detail = e.to_detail()
        # Use the message from detail if available, otherwise use the exception message
        error_message = detail.get("message", str(e))
        raise HTTPException(status_code=400, detail={
            "message": error_message,
            **detail
        })
    except ValueError as e:
        raise HTTPException(status_code=400, detail={"message": str(e), "code": "VALIDATION_ERROR"})


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
    try:
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
    except (OperationalError, DatabaseError) as e:
        raise handle_database_error(e)


@router.post("/questions/usage-by-text/search", response_model=QuestionUsageByTextResponse)
def get_usage_by_question_text(
    request_data: QuestionUsageByTextRequest,
    db: Session = Depends(get_db),
):
    """
    Get usage count and history for a question by its text (PRIMARY endpoint for Question Usage History).

    Finds all questions with the same text (across all colleges) and returns aggregated usage.
    Question Usage History is entirely text-based - no question IDs required.

    Uses POST method to avoid URL length limits and encoding issues with special characters.

    Args:
        request_data (QuestionUsageByTextRequest): Request containing question text.
        db (Session): Database session.

    Returns:
        QuestionUsageByTextResponse: Usage information including count, history, and matching questions.
    """
    try:
        question_text = request_data.question_text.strip()
        
        logger.info(f"Received request for usage by question text (length: {len(question_text) if question_text else 0})")
        if question_text:
            logger.debug(f"Question text sample: {question_text[:100]}...")
        
        # Ensure question_text is a string and not empty
        if not question_text or not isinstance(question_text, str):
            logger.warning(f"Invalid question_text type or value: {type(question_text)}, value: {question_text}")
            raise HTTPException(
                status_code=422,
                detail={
                    "message": "question_text must be a non-empty string.",
                    "hint": "For Question Usage History, provide the question text (not a numeric ID).",
                    "errors": [
                        {
                            "field": "question_text",
                            "message": "question_text must be a non-empty string.",
                            "type": "value_error"
                        }
                    ]
                }
            )
        
        # Validate length (already trimmed above)
        if len(question_text) < 10:
            logger.warning(f"Question text too short: {len(question_text)} characters")
            raise HTTPException(
                status_code=422,
                detail={
                    "message": "question_text must be at least 10 characters long.",
                    "hint": "Please provide the full question text.",
                    "errors": [
                        {
                            "field": "question_text",
                            "message": "question_text must be at least 10 characters long.",
                            "type": "value_error"
                        }
                    ]
                }
            )
        
        logger.info(f"Processing usage query for question text (first 50 chars: {question_text[:50]}...)")
        
        result = question_service.get_usage_by_question_text(db, question_text)
        logger.info(f"Retrieved usage data: count={result.get('usage_count', 0)}, matching_questions={result.get('matching_questions_count', 0)}, history_items={len(result.get('usage_history', []))}")
        
        # Convert usage_history dicts to QuestionUsageResponse objects
        usage_history_responses = []
        for usage_dict in result.get("usage_history", []):
            try:
                usage_response = QuestionUsageResponse(**usage_dict)
                usage_history_responses.append(usage_response)
            except Exception as e:
                logger.error(f"Error creating QuestionUsageResponse: {e}, data: {usage_dict}")
                # Skip invalid usage records rather than failing the entire request
                continue
        
        # Convert Question ORM objects to QuestionResponse objects
        question_responses = []
        for question in result.get("questions", []):
            try:
                question_response = QuestionResponse.model_validate(question)
                question_responses.append(question_response)
            except Exception as e:
                logger.error(f"Error creating QuestionResponse: {e}, question_id: {getattr(question, 'id', 'unknown')}")
                # Skip invalid questions rather than failing the entire request
                continue
        
        return QuestionUsageByTextResponse(
            usage_count=result["usage_count"],
            question_text=result["question_text"],
            matching_questions_count=result["matching_questions_count"],
            usage_history=usage_history_responses,
            questions=question_responses,
        )
    except (OperationalError, DatabaseError) as e:
        raise handle_database_error(e)
    except Exception as e:
        logger.error(f"Unexpected error in get_usage_by_question_text: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={
                "message": "An unexpected error occurred while fetching usage data.",
                "error": "INTERNAL_SERVER_ERROR",
                "hint": "Please check the server logs for more details."
            }
        )


@router.post("/questions/usage-by-text", response_model=QuestionUsageResponse, status_code=201)
def record_question_usage_by_text(
    usage_data: QuestionUsageByTextCreate,
    db: Session = Depends(get_db),
):
    """
    Record question usage using question text (PRIMARY endpoint for Question Usage History).

    This endpoint finds a matching question by text (across all colleges) and
    records usage for it. Question Usage History is entirely text-based - no question IDs required.

    Args:
        usage_data (QuestionUsageByTextCreate): Usage information including question_text and usage details.
        db (Session): Database session.

    Returns:
        QuestionUsageResponse: Created usage record.

    Raises:
        HTTPException: If question not found or database error occurs.
    """
    try:
        # Extract and validate question_text
        question_text = usage_data.question_text.strip()
        if not question_text or len(question_text) < 10:
            raise HTTPException(
                status_code=422,
                detail={
                    "message": "question_text must be at least 10 characters long.",
                    "hint": "Please provide the full question text (not a numeric ID)."
                }
            )
        
        # Create QuestionUsageCreate from the usage_data
        usage = QuestionUsageCreate(
            exam_name=usage_data.exam_name,
            exam_type=usage_data.exam_type,
            academic_year=usage_data.academic_year,
            college=usage_data.college,
        )
        
        usage_record = question_service.record_question_usage_by_text(
            db, question_text, usage
        )
        
        # Enrich response with question_text for frontend display
        # Reason: QuestionUsageResponse schema includes question_text, but ORM model doesn't
        usage_response = QuestionUsageResponse(
            id=usage_record.id,
            question_id=usage_record.question_id,
            question_text=question_text,  # Use the input question_text
            exam_name=usage_record.exam_name,
            exam_type=usage_record.exam_type,
            academic_year=usage_record.academic_year,
            college=usage_record.college,
            date_used=usage_record.date_used,
        )
        return usage_response
    except (OperationalError, DatabaseError) as e:
        raise handle_database_error(e)
    except ValueError as e:
        # Question not found for the given text
        raise HTTPException(
            status_code=404,
            detail={
                "message": str(e),
                "error": "QUESTION_NOT_FOUND",
                "hint": "No question found matching the provided text. Please check the question text."
            }
        )


@router.get("/questions/usage-by-text", response_model=QuestionUsageByTextResponse)
def get_usage_by_question_text_get(
    question_text: str = Query(..., description="Question text to get usage for"),
    db: Session = Depends(get_db),
):
    """
    GET endpoint for usage by question text (legacy support).
    
    Note: This endpoint may have issues with special characters. 
    Use POST /questions/usage-by-text/search for better reliability.
    """
    try:
        # URL decode the question text
        from urllib.parse import unquote
        question_text = unquote(question_text, encoding='utf-8').strip()
        
        if not question_text or len(question_text) < 10:
            raise HTTPException(
                status_code=422,
                detail={
                    "message": "question_text must be at least 10 characters long.",
                    "hint": "Please provide the full question text."
                }
            )
        
        result = question_service.get_usage_by_question_text(db, question_text)
        
        usage_history_responses = [
            QuestionUsageResponse(**usage_dict)
            for usage_dict in result.get("usage_history", [])
        ]
        
        question_responses = [
            QuestionResponse.model_validate(question)
            for question in result.get("questions", [])
        ]
        
        return QuestionUsageByTextResponse(
            usage_count=result["usage_count"],
            question_text=result["question_text"],
            matching_questions_count=result["matching_questions_count"],
            usage_history=usage_history_responses,
            questions=question_responses,
        )
    except (OperationalError, DatabaseError) as e:
        raise handle_database_error(e)
    except Exception as e:
        logger.error(f"Error in get_usage_by_question_text_get: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={"message": "An unexpected error occurred.", "error": "INTERNAL_SERVER_ERROR"}
        )


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
    try:
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
    except (OperationalError, DatabaseError) as e:
        raise handle_database_error(e)


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
    try:
        question = question_service.get_question(db, question_id)
        if not question:
            raise HTTPException(status_code=404, detail="Question not found")
        return question
    except (OperationalError, DatabaseError) as e:
        raise handle_database_error(e)


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
    try:
        question = question_service.update_question(db, question_id, question_update)
        if not question:
            raise HTTPException(status_code=404, detail="Question not found")
        return question
    except (OperationalError, DatabaseError) as e:
        raise handle_database_error(e)


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
    try:
        success = question_service.delete_question(db, question_id)
        if not success:
            raise HTTPException(status_code=404, detail="Question not found")
        return {"message": "Question permanently deleted successfully", "question_id": question_id}
    except (OperationalError, DatabaseError) as e:
        raise handle_database_error(e)


