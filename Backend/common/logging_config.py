import os
import logging
from pathlib import Path
from datetime import datetime

def get_app_log_directory():
    """Get centralized log directory - always use actual user's AppData"""
    
    # Always try to use the real user's AppData, even for services
    if os.name == 'nt':  # Windows
        # Try to get actual user directory
        users_dir = Path("C:/Users")
        
        # Look for the most recently accessed user directory (likely the real user)
        if users_dir.exists():
            user_dirs = [d for d in users_dir.iterdir() if d.is_dir() and d.name not in ['Public', 'Default', 'All Users']]
            if user_dirs:
                # Sort by last access time and pick the most recent
                latest_user_dir = max(user_dirs, key=lambda d: d.stat().st_atime)
                log_dir = latest_user_dir / "AppData" / "Local" / "hobby-portal" / "logs"
                
                # Check if we can write to it
                try:
                    log_dir.mkdir(parents=True, exist_ok=True)
                    # Test write access
                    test_file = log_dir / "test_write.tmp"
                    test_file.touch()
                    test_file.unlink()
                    return log_dir
                except:
                    pass
        
        # Fallback to ProgramData if user directory doesn't work
        program_data = os.environ.get('PROGRAMDATA', 'C:\\ProgramData')
        log_dir = Path(program_data) / "hobby-portal" / "logs"
    else:
        # Linux/Mac
        log_dir = Path.home() / ".local" / "share" / "hobby-portal" / "logs"
    
    log_dir.mkdir(parents=True, exist_ok=True)
    return log_dir

def setup_logger(name, log_filename, level=logging.INFO):
    """Setup a logger that writes to centralized directory"""
    
    log_dir = get_app_log_directory()
    
    # Use the filename as-is without adding date
    log_file = log_dir / log_filename
    
    # Create logger
    logger = logging.getLogger(name)
    logger.setLevel(level)
    
    # Clear any existing handlers to avoid duplicates
    logger.handlers.clear()
    
    # File handler with append mode (default)
    file_handler = logging.FileHandler(log_file, encoding='utf-8')
    file_formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
    file_handler.setFormatter(file_formatter)
    logger.addHandler(file_handler)
    
    # Console handler (only for non-service execution)
    if not os.environ.get('RUNNING_AS_SERVICE'):
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(file_formatter)
        logger.addHandler(console_handler)
    
    logger.propagate = False
    return logger

def get_database_path(db_filename):
    """Get database path in centralized log directory"""
    log_dir = get_app_log_directory()
    return log_dir / db_filename