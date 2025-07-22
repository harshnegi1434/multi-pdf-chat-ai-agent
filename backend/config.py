# Simple configuration for InsightPDF Backend
import os

class Settings:
    """Basic settings - only the essential ones"""
    
    # Required
    GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "")
    
    # Server (with good defaults)
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    
    # AI Settings (optimized defaults)
    CHUNK_SIZE: int = int(os.getenv("CHUNK_SIZE", "1000"))
    CHUNK_OVERLAP: int = int(os.getenv("CHUNK_OVERLAP", "200"))
    MAX_SEARCH_RESULTS: int = int(os.getenv("MAX_SEARCH_RESULTS", "4"))
    
    # File limits
    MAX_FILE_SIZE: int = int(os.getenv("MAX_FILE_SIZE", str(50 * 1024 * 1024)))  # 50MB

# Global settings
settings = Settings()

# Simple validation
def validate_settings():
    if not settings.GOOGLE_API_KEY:
        raise ValueError("GOOGLE_API_KEY environment variable is required")
