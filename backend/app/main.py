"""FastAPI application entry point."""

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import os
import logging
from app.database import init_db, DATABASE_URL
from app.api import routes

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Question Bank Management System",
    description="POC for managing descriptive exam questions with duplicate detection",
    version="1.0.0",
)

# Configure CORS
# Note: When allow_credentials=True, you cannot use allow_origins=["*"]
# Must specify exact origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # React frontend (Vite default)
        "http://localhost:5173",  # Vite alternative port
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://localhost:8000",  # Backend itself (for direct access)
        "http://127.0.0.1:8000",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Custom handler for validation errors to provide clearer error messages.
    
    Args:
        request (Request): The request object.
        exc (RequestValidationError): The validation error.
        
    Returns:
        JSONResponse: JSON response with validation errors.
    """
    errors = []
    for error in exc.errors():
        field = " -> ".join(str(loc) for loc in error["loc"])
        message = error["msg"]
        error_type = error["type"]
        
        # Provide user-friendly messages for common validation errors
        if "question_id" in field.lower() and "int_parsing" in error_type:
            input_value = error.get('input', 'unknown')
            # Check if the input looks like question text (not a number)
            if isinstance(input_value, str) and not input_value.isdigit() and len(input_value) > 5:
                message = (
                    f"Invalid question ID. The question_id must be a numeric value (integer), "
                    f"but received: '{input_value[:50]}...'. "
                    f"Question IDs are numeric identifiers, not text."
                )
            else:
                message = (
                    f"Invalid question ID. The question_id must be a valid integer, "
                    f"but received: {input_value}."
                )
        elif "int_parsing" in error_type or "int_parsing" in str(error_type):
            message = (
                f"Invalid integer value for {field}. Expected a number but received: {error.get('input', 'unknown')}."
            )
        elif "string_type" in error_type:
            message = (
                f"Invalid value for {field}. Expected text/string but received: {error.get('input', 'unknown')}."
            )
        elif "missing" in error_type or "required" in error_type.lower():
            message = (
                f"Missing required parameter: {field}. Please provide a value for this parameter."
            )
        elif "question_text" in field.lower():
            # Special handling for question_text parameter
            input_value = error.get('input', 'unknown')
            if "min_length" in error_type or "string_too_short" in error_type:
                message = (
                    f"Question text must be at least 10 characters long. "
                    f"Received: {len(str(input_value))} characters."
                )
            else:
                message = (
                    f"Invalid question text parameter. {error.get('msg', 'Validation failed')}. "
                    f"Please ensure the question text is properly formatted."
                )
        
        errors.append({
            "field": field,
            "message": message,
            "type": error_type,
            "input": error.get("input", None)
        })
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Validation error",
            "errors": errors,
            "help": "For Question Usage History, use text-based endpoints: /api/questions/usage-by-text"
        },
    )

# Include API routes
app.include_router(routes.router, prefix="/api", tags=["questions"])

@app.get("/")
async def root():
    """
    Root endpoint - API information.

    Returns:
        dict: API information and links.
    """
    return {
        "message": "Question Bank Management System API",
        "version": "1.0.0",
        "docs": "/docs",
        "frontend": "React frontend runs separately on http://localhost:3000 (see frontend-react folder)"
    }


@app.on_event("startup")
async def startup_event():
    """Initialize database and log startup information."""
    logger.info(f"Application starting with database: {DATABASE_URL[:50]}...")
    try:
        # Initialize database tables on startup
        init_db()
        logger.info("Database initialized successfully")
    except ConnectionError as e:
        logger.warning(f"Database initialization failed: {e}")
        logger.warning("Application will start but database operations may fail until connection is fixed")
        logger.info("If you see database errors, check SUPABASE_SETUP.md for setup instructions.")
    except Exception as e:
        logger.warning(f"Database initialization error: {e}")
        logger.warning("Application will start but database operations may fail until connection is fixed")


@app.get("/health")
async def health_check():
    """
    Health check endpoint.

    Returns:
        dict: Health status.
    """
    return {"status": "healthy"}

