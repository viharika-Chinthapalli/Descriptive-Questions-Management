"""Simple script to run the application."""

import uvicorn
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from parent directory (project root)
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(env_path)
# Also try loading from current directory for backward compatibility
load_dotenv()

if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    debug = os.getenv("DEBUG", "True").lower() == "true"
    
    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=debug,
    )


