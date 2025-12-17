"""FastAPI application entry point."""

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.exceptions import RequestValidationError
import os
import logging
from app.database import init_db, DATABASE_URL
from app.api import routes

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize database
logger.info(f"Initializing database at: {DATABASE_URL}")
init_db()
logger.info("Database initialization complete")

# Create FastAPI app
app = FastAPI(
    title="Question Bank Management System",
    description="POC for managing descriptive exam questions with duplicate detection",
    version="1.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
        errors.append({
            "field": field,
            "message": message,
            "type": error_type
        })
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Validation error",
            "errors": errors
        },
    )

# Include API routes
app.include_router(routes.router, prefix="/api", tags=["questions"])

# Mount static files (CSS, JS) - must be before root route
frontend_dir = os.path.join(os.path.dirname(__file__), "..", "frontend")
if os.path.exists(frontend_dir):
    app.mount("/static", StaticFiles(directory=frontend_dir, html=False), name="static")


@app.get("/")
async def root():
    """
    Root endpoint - serve frontend.

    Returns:
        FileResponse: HTML file.
    """
    frontend_path = os.path.join(os.path.dirname(__file__), "..", "frontend", "index.html")
    if os.path.exists(frontend_path):
        return FileResponse(frontend_path, media_type="text/html")
    return {"message": "Question Bank Management System API", "docs": "/docs"}


@app.get("/health")
async def health_check():
    """
    Health check endpoint.

    Returns:
        dict: Health status.
    """
    return {"status": "healthy"}

