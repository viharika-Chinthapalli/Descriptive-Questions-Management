"""Pydantic schemas for request/response validation."""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime


class QuestionBase(BaseModel):
    """Base schema for question data."""

    question_text: str = Field(
        ..., 
        min_length=10, 
        description="The question text (minimum 10 characters)",
        examples=["What is the difference between Python and Java programming languages?"]
    )
    subject: str = Field(
        ..., 
        min_length=1, 
        description="Subject/course name",
        examples=["Computer Science"]
    )
    topic: Optional[str] = Field(
        None, 
        description="Topic/unit within subject",
        examples=["Programming Languages"]
    )
    difficulty_level: str = Field(
        ..., 
        description="Difficulty level: Easy, Medium, or Hard",
        examples=["Medium"]
    )
    marks: int = Field(
        ..., 
        gt=0, 
        description="Marks allocated to the question",
        examples=[10]
    )
    exam_type: str = Field(
        ..., 
        min_length=1,
        description="Exam type (e.g., Mid, End-Sem, Practical, Internal, External)",
        examples=["Mid"]
    )
    college: str = Field(
        ..., 
        min_length=1, 
        description="College/university name",
        examples=["ABC University"]
    )

    @field_validator("difficulty_level")
    @classmethod
    def validate_difficulty(cls, v: str) -> str:
        """Validate difficulty level."""
        allowed = ["Easy", "Medium", "Hard"]
        if v not in allowed:
            raise ValueError(f"Difficulty must be one of: {', '.join(allowed)}")
        return v


class QuestionCreate(QuestionBase):
    """Schema for creating a new question."""

    pass


class QuestionUpdate(BaseModel):
    """Schema for updating a question."""

    question_text: Optional[str] = Field(None, min_length=10)
    subject: Optional[str] = Field(None, min_length=1)
    topic: Optional[str] = None
    difficulty_level: Optional[str] = None
    marks: Optional[int] = Field(None, gt=0)
    exam_type: Optional[str] = None
    college: Optional[str] = Field(None, min_length=1)
    status: Optional[str] = Field(None, description="Status: Active, Blocked, or Archived")

    @field_validator("difficulty_level")
    @classmethod
    def validate_difficulty(cls, v: Optional[str]) -> Optional[str]:
        """Validate difficulty level."""
        if v is not None:
            allowed = ["Easy", "Medium", "Hard"]
            if v not in allowed:
                raise ValueError(f"Difficulty must be one of: {', '.join(allowed)}")
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        """Validate status."""
        if v is not None:
            allowed = ["Active", "Blocked", "Archived"]
            if v not in allowed:
                raise ValueError(f"Status must be one of: {', '.join(allowed)}")
        return v


class QuestionUsageCreate(BaseModel):
    """Schema for recording question usage."""

    exam_name: str = Field(..., min_length=1, description="Name of the exam")
    exam_type: str = Field(..., description="Type of exam")
    academic_year: str = Field(..., min_length=1, description="Academic year (e.g., 2023-24)")
    college: str = Field(..., min_length=1, description="College where question is used")


class QuestionUsageByTextCreate(BaseModel):
    """Schema for recording question usage by question text."""

    question_text: str = Field(
        ...,
        min_length=10,
        description="Question text to record usage for (text input, not numeric ID)"
    )
    exam_name: str = Field(..., min_length=1, description="Name of the exam")
    exam_type: str = Field(..., description="Type of exam")
    academic_year: str = Field(..., min_length=1, description="Academic year (e.g., 2023-24)")
    college: str = Field(..., min_length=1, description="College where question is used")


class QuestionUsageByTextRequest(BaseModel):
    """Schema for requesting usage by question text."""

    question_text: str = Field(
        ...,
        min_length=10,
        description="Question text to get usage for (text input, not numeric ID)"
    )


class QuestionResponse(QuestionBase):
    """Schema for question response."""

    id: int
    question_hash: str
    created_date: datetime
    usage_count: int
    last_used_date: Optional[datetime]
    status: str

    class Config:
        from_attributes = True


class QuestionUsageResponse(BaseModel):
    """Schema for question usage response."""

    id: int
    question_id: int  # Internal database reference only - not required for API usage
    question_text: str  # Primary identifier for Question Usage History (text-based)
    exam_name: str
    exam_type: str
    academic_year: str
    college: str
    date_used: datetime

    class Config:
        from_attributes = True


class SimilarityCheckResponse(BaseModel):
    """Schema for similarity check response."""

    is_duplicate: bool
    exact_match: bool
    similar_questions: List[QuestionResponse] = Field(default_factory=list)
    similarity_scores: List[float] = Field(default_factory=list)


class QuestionSearchResponse(BaseModel):
    """Schema for question search response."""

    questions: List[QuestionResponse]
    total: int
    page: int
    page_size: int


class QuestionUsageByTextResponse(BaseModel):
    """Schema for usage information by question text."""

    usage_count: int
    question_text: str  # The question text that was searched
    matching_questions_count: int  # Number of matching questions (replaces question_ids)
    usage_history: List[QuestionUsageResponse]
    questions: List[QuestionResponse]

    class Config:
        from_attributes = True


