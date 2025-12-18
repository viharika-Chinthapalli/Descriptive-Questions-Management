"""Service for detecting duplicate and similar questions using embeddings."""

import hashlib
from typing import List, Tuple, Optional
import numpy as np
from sqlalchemy.orm import Session
from app.models import Question
import os
from dotenv import load_dotenv

load_dotenv()

# Load similarity threshold from environment
SIMILARITY_THRESHOLD = float(os.getenv("SIMILARITY_THRESHOLD", "0.85"))

# Initialize sentence transformer model (lazy loading)
_model = None


def get_model():
    """
    Get or initialize the sentence transformer model.
    
    Lazy import to avoid import errors at module level.

    Returns:
        SentenceTransformer: The model instance.
        
    Raises:
        ImportError: If sentence_transformers is not properly installed.
    """
    global _model
    if _model is None:
        try:
            from sentence_transformers import SentenceTransformer
            # Using a lightweight model suitable for POC
            _model = SentenceTransformer("all-MiniLM-L6-v2")
        except ImportError as e:
            raise ImportError(
                "sentence-transformers is not properly installed. "
                "Please run: pip install --upgrade sentence-transformers huggingface-hub"
            ) from e
    return _model


def normalize_text(text: str) -> str:
    """
    Normalize text for hashing (lowercase, strip whitespace).

    Args:
        text (str): Input text.

    Returns:
        str: Normalized text.
    """
    return text.lower().strip()


def generate_hash(question_text: str) -> str:
    """
    Generate SHA256 hash for exact duplicate detection.

    Args:
        question_text (str): Question text.

    Returns:
        str: SHA256 hash of normalized question text.
    """
    normalized = normalize_text(question_text)
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


def generate_embedding(question_text: str) -> List[float]:
    """
    Generate embedding vector for similarity detection.

    Args:
        question_text (str): Question text.

    Returns:
        List[float]: Embedding vector as a list.
    """
    model = get_model()
    embedding = model.encode(question_text, convert_to_numpy=True)
    return embedding.tolist()


def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    """
    Calculate cosine similarity between two vectors.

    Args:
        vec1 (List[float]): First embedding vector.
        vec2 (List[float]): Second embedding vector.

    Returns:
        float: Cosine similarity score between 0 and 1.
    """
    v1 = np.array(vec1)
    v2 = np.array(vec2)
    dot_product = np.dot(v1, v2)
    norm1 = np.linalg.norm(v1)
    norm2 = np.linalg.norm(v2)
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return float(dot_product / (norm1 * norm2))


def check_exact_duplicate(db: Session, question_hash: str, college: Optional[str] = None) -> Optional[Question]:
    """
    Check if a question with the same hash already exists.
    If college is provided, only checks within that college.

    Args:
        db (Session): Database session.
        question_hash (str): Hash of the question text.
        college (Optional[str]): College name to filter by. If provided, only checks duplicates in this college.

    Returns:
        Optional[Question]: Existing question if found, None otherwise.
    """
    query = db.query(Question).filter(
        Question.question_hash == question_hash,
        Question.status == "Active"
    )
    if college:
        query = query.filter(Question.college == college)
    return query.first()


def find_similar_questions(
    db: Session, embedding: List[float], threshold: float = SIMILARITY_THRESHOLD, exclude_id: Optional[int] = None, college: Optional[str] = None
) -> List[Tuple[Question, float]]:
    """
    Find questions with similar embeddings above the threshold.
    If college is provided, only checks within that college.

    Args:
        db (Session): Database session.
        embedding (List[float]): Embedding vector to compare against.
        threshold (float): Similarity threshold (default from env).
        exclude_id (Optional[int]): Question ID to exclude from results.
        college (Optional[str]): College name to filter by. If provided, only checks duplicates in this college.

    Returns:
        List[Tuple[Question, float]]: List of (question, similarity_score) tuples.
    """
    # Get all active questions with embeddings
    query = db.query(Question).filter(
        Question.status == "Active",
        Question.embedding.isnot(None)
    )
    
    if exclude_id:
        query = query.filter(Question.id != exclude_id)
    
    if college:
        query = query.filter(Question.college == college)
    
    questions = query.all()
    
    similar_questions = []
    for question in questions:
        if question.embedding:
            similarity = cosine_similarity(embedding, question.embedding)
            if similarity >= threshold:
                similar_questions.append((question, similarity))
    
    # Sort by similarity score (descending)
    similar_questions.sort(key=lambda x: x[1], reverse=True)
    
    return similar_questions


def check_similarity(
    db: Session, question_text: str, exclude_id: Optional[int] = None, college: Optional[str] = None
) -> Tuple[bool, bool, List[Tuple[Question, float]]]:
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
    # Check for exact duplicate
    question_hash = generate_hash(question_text)
    exact_match_question = check_exact_duplicate(db, question_hash, college=college)
    
    exact_match = exact_match_question is not None
    
    # Generate embedding for similarity check
    embedding = generate_embedding(question_text)
    
    # Find similar questions
    similar_questions = find_similar_questions(db, embedding, exclude_id=exclude_id, college=college)
    
    # Consider it a duplicate if exact match or similar questions found
    is_duplicate = exact_match or len(similar_questions) > 0
    
    # Include exact match in similar questions if found
    if exact_match and exact_match_question:
        # Check if exact match is already in similar_questions
        if not any(q.id == exact_match_question.id for q, _ in similar_questions):
            similar_questions.insert(0, (exact_match_question, 1.0))
    
    return is_duplicate, exact_match, similar_questions


