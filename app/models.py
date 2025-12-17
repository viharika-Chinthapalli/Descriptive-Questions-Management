"""SQLAlchemy database models."""

from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Question(Base):
    """Question model for storing exam questions."""

    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    question_text = Column(Text, nullable=False, index=True)
    # Hash is not unique across colleges; allow same question text for different colleges
    question_hash = Column(String(64), nullable=False, index=True)
    subject = Column(String(200), nullable=False, index=True)
    topic = Column(String(200), index=True)
    difficulty_level = Column(String(20), nullable=False, index=True)  # Easy/Medium/Hard
    marks = Column(Integer, nullable=False)
    exam_type = Column(String(50), nullable=False, index=True)  # Mid/End-Sem/Practical/Internal/External
    college = Column(String(200), nullable=False, index=True)
    created_date = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    usage_count = Column(Integer, default=0, nullable=False)
    last_used_date = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(20), default="Active", nullable=False, index=True)  # Active/Blocked/Archived
    embedding = Column(JSON, nullable=True)  # Store embedding as JSON array

    # Relationship to usage history
    usage_history = relationship("QuestionUsage", back_populates="question", cascade="all, delete-orphan")


class QuestionUsage(Base):
    """Question usage tracking model."""

    __tablename__ = "question_usage"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False, index=True)
    exam_name = Column(String(200), nullable=False)
    exam_type = Column(String(50), nullable=False)
    academic_year = Column(String(20), nullable=False, index=True)
    college = Column(String(200), nullable=False, index=True)
    date_used = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationship to question
    question = relationship("Question", back_populates="usage_history")


