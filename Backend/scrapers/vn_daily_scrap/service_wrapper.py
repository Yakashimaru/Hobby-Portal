# Backend/scrapers/vn_daily_scrap/service_wrapper.py
import os
import sys
import time
import threading
import subprocess
from pathlib import Path
import logging
import win32serviceutil
import win32service
import win32event
import servicemanager

backend_dir = Path(__file__).parent.parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# VENV SETUP - Fix the path detection
if getattr(sys, 'frozen', False):
    # Running in PyInstaller bundle - use the executable path
    print(f"Running in bundled mode: {sys.executable}")
    PYTHON_EXE = Path(sys.executable)
else:
    # Running normally - try to find venv
    project_root = Path(__file__).parent.parent.parent.parent  # Go up to project root
    VENV_PATH = project_root / ".venv"
    PYTHON_EXE = VENV_PATH / "Scripts" / "python.exe"

    if PYTHON_EXE.exists():
        site_packages = VENV_PATH / "Lib" / "site-packages"
        if str(site_packages) not in sys.path:
            sys.path.insert(0, str(site_packages))
        print(f"Using virtual environment: {VENV_PATH}")
    else:
        PYTHON_EXE = Path(sys.executable)
        print(f"Virtual environment not found at {VENV_PATH}, using system Python: {PYTHON_EXE}")

# Add Backend directory to Python path
backend_dir = Path(__file__).parent.parent.parent
sys.path.insert(0, str(backend_dir))

# Also add common directory for database imports
common_dir = backend_dir / "common"
sys.path.insert(0, str(common_dir))

from daily_scraper import DailyScraper

class VNDailyScrapService(win32serviceutil.ServiceFramework):
    _svc_name_ = "VNDailyScraper"
    _svc_display_name_ = "VN Daily Scraper Service"
    _svc_description_ = "Daily scraping service for visual novel updates"
    
    def __init__(self, args):
        # CRITICAL: Ensure virtual environment is available before calling parent
        # Only set up venv paths when NOT running in bundled mode
        if not getattr(sys, 'frozen', False):
            project_root = Path(__file__).parent.parent.parent.parent
            venv_path = project_root / ".venv"
            
            if venv_path.exists():
                site_packages = venv_path / "Lib" / "site-packages"
                if str(site_packages) not in sys.path:
                    sys.path.insert(0, str(site_packages))
                # Also set PYTHONPATH environment variable
                pythonpath = os.environ.get('PYTHONPATH', '')
                if str(site_packages) not in pythonpath:
                    os.environ['PYTHONPATH'] = f"{site_packages};{pythonpath}"
        
        # Add Backend directory to Python path
        backend_dir = Path(__file__).parent.parent.parent
        sys.path.insert(0, str(backend_dir))
        common_dir = backend_dir / "common"
        sys.path.insert(0, str(common_dir))
        
        win32serviceutil.ServiceFramework.__init__(self, args)
        self.hWaitStop = win32event.CreateEvent(None, 0, 0, None)
        self.is_running = True
        
        try:
            # Add Backend to path for imports
            backend_dir = Path(__file__).parent.parent.parent
            sys.path.insert(0, str(backend_dir))
            from common.logging_config import setup_logger
            self.logger = setup_logger('VNDailyScrapService', 'vn_daily_service.log')
        except ImportError:
            # Fallback to old method if import fails
            log_dir = self.get_user_log_directory()
            log_file = log_dir / "vn_daily_service.log"
            logging.basicConfig(
                filename=str(log_file),
                level=logging.INFO,
                format='%(asctime)s - %(levelname)s - %(message)s'
            )
            self.logger = logging.getLogger('VNDailyScrapService')
    
    
    def SvcStop(self):
        self.ReportServiceStatus(win32service.SERVICE_STOP_PENDING)
        win32event.SetEvent(self.hWaitStop)
        self.is_running = False
        self.logger.info("VN Daily Scraper Service stop requested")
    
    def SvcDoRun(self):
        try:
            # Report running status IMMEDIATELY - before any other operations
            self.ReportServiceStatus(win32service.SERVICE_RUNNING)
            
            # THEN do logging and start main loop
            servicemanager.LogMsg(servicemanager.EVENTLOG_INFORMATION_TYPE,
                                servicemanager.PYS_SERVICE_STARTED,
                                (self._svc_name_, ''))
            
            self.logger.info("VN Daily Scraper Service started and reported RUNNING")
            self.main_loop()
            
        except Exception as e:
            # If anything fails, still try to log it
            try:
                self.logger.error(f"Service startup error: {e}")
            except:
                pass
            # Re-report as stopped
            self.ReportServiceStatus(win32service.SERVICE_STOPPED)
            raise
    
    @classmethod
    def install_service_auto_start(cls):
        """Install service with automatic startup"""
        import win32serviceutil
        import win32service
        
        try:
            # Install the service
            win32serviceutil.InstallService(
                cls._svc_reg_class_,
                cls._svc_name_,
                cls._svc_display_name_,
                startType=win32service.SERVICE_AUTO_START,  # This sets it to automatic
                description=cls._svc_description_
            )
            print(f"Service '{cls._svc_display_name_}' installed successfully")
            print("Startup type: Automatic (will start with Windows)")
            
            # Optionally start it immediately
            try:
                win32serviceutil.StartService(cls._svc_name_)
                print("Service started successfully")
            except Exception as e:
                print(f"Service installed but failed to start: {e}")
                print("You can start it manually with: net start VNDailyScraper")
                
        except Exception as e:
            print(f"Failed to install service: {e}")
    
    def main_loop(self):
        """Fast startup, then run scraper based on schedule"""
        # CRITICAL: Report service as started IMMEDIATELY
        self.ReportServiceStatus(win32service.SERVICE_RUNNING)
        self.logger.info("VN Daily Scraper Service started - reported RUNNING to Windows")
        
        # Start background thread for actual work
        background_thread = threading.Thread(target=self.background_operations, daemon=True)
        background_thread.start()
        self.logger.info("Background operations thread started")
        
        # Main service loop - just monitor stop events
        while self.is_running:
            if win32event.WaitForSingleObject(self.hWaitStop, 5000) == win32event.WAIT_OBJECT_0:
                break
        
        self.logger.info("Service stop requested - cleaning up")
    
    def background_operations(self):
        """Run actual operations in background thread"""
        try:
            # Log to Event Viewer
            servicemanager.LogMsg(servicemanager.EVENTLOG_INFORMATION_TYPE, 1, 
                                (self._svc_name_, 'Background operations starting'))
            
            # Give service time to fully initialize
            self.logger.info("Background thread starting - waiting 5 seconds for full service init")
            time.sleep(5)
            
            servicemanager.LogMsg(servicemanager.EVENTLOG_INFORMATION_TYPE, 2, 
                                (self._svc_name_, 'Checking if should run scraper today'))
            
            # Check if we should run scraper (only once per day, only if not run yet)
            should_run_scraper = self.should_run_scraper_today()
            
            servicemanager.LogMsg(servicemanager.EVENTLOG_INFORMATION_TYPE, 3, 
                                (self._svc_name_, f'Should run scraper: {should_run_scraper}'))
            
            if should_run_scraper:
                servicemanager.LogMsg(servicemanager.EVENTLOG_INFORMATION_TYPE, 4, 
                                    (self._svc_name_, 'Setting up database access for daily scraper'))
                
                # Wait a bit more for system to be fully ready
                self.logger.info("Scheduled scraping session detected - will start in 25 seconds")
                time.sleep(25)
                
                # Set up database access directly (no CRUD API needed)
                db_ready = self.setup_database_access()
                
                if db_ready:
                    servicemanager.LogMsg(servicemanager.EVENTLOG_INFORMATION_TYPE, 5, 
                                        (self._svc_name_, 'Database access ready'))
                    
                    # Give a moment for setup to complete
                    self.logger.info("Database setup ready...")
                    time.sleep(5)
                    
                    servicemanager.LogMsg(servicemanager.EVENTLOG_INFORMATION_TYPE, 6, 
                                        (self._svc_name_, 'Starting daily scraper execution'))
                    
                    # Run the daily scraper directly - no CRUD API needed
                    try:
                        self.logger.info("Running daily scraper...")
                        scraper = DailyScraper()
                        
                        # # Override the database path to use consistent location
                        # log_dir = self.get_user_log_directory()
                        # scraper.state_db_path = log_dir / "daily_scraper_state.db"
                        try:
                            from common.logging_config import get_database_path
                            scraper.state_db_path = get_database_path("daily_scraper_state.db")
                        except ImportError:
                            # Fallback to old method
                            log_dir = self.get_user_log_directory()
                            scraper.state_db_path = log_dir / "daily_scraper_state.db"

                        scraper.init_database()
                        
                        servicemanager.LogMsg(servicemanager.EVENTLOG_INFORMATION_TYPE, 60, 
                                            (self._svc_name_, f'Scraper using database: {scraper.state_db_path}'))
                        
                        result = scraper.run_daily_scraping()
                        
                        servicemanager.LogMsg(servicemanager.EVENTLOG_INFORMATION_TYPE, 7, 
                                            (self._svc_name_, f'Daily scraper completed with result: {result}'))
                        self.logger.info("Daily scraper completed")
                    except Exception as e:
                        servicemanager.LogMsg(servicemanager.EVENTLOG_ERROR_TYPE, 8, 
                                            (self._svc_name_, f'Daily scraper error: {str(e)}'))
                        self.logger.error(f"Daily scraper error: {e}")
                    
                    # Enter idle monitoring mode - no API to monitor
                    servicemanager.LogMsg(servicemanager.EVENTLOG_INFORMATION_TYPE, 9, 
                                        (self._svc_name_, 'Entering idle monitoring mode'))
                    self.logger.info("Daily scraper completed - entering idle mode...")
                    self.idle_monitoring()
                else:
                    servicemanager.LogMsg(servicemanager.EVENTLOG_ERROR_TYPE, 10, 
                                        (self._svc_name_, 'Failed to set up database access'))
                    self.logger.error("Failed to set up database access - service will just monitor")
                    self.idle_monitoring()
            else:
                servicemanager.LogMsg(servicemanager.EVENTLOG_INFORMATION_TYPE, 11, 
                                    (self._svc_name_, 'Scraper already ran today - entering idle mode'))
                self.logger.info("Scraper already ran today or not scheduled - service will just monitor")
                self.idle_monitoring()
                
        except Exception as e:
            servicemanager.LogMsg(servicemanager.EVENTLOG_ERROR_TYPE, 12, 
                                (self._svc_name_, f'Background operations error: {str(e)}'))
            self.logger.error(f"Background operations error: {e}")
            self.idle_monitoring()
    
    def should_run_scraper_today(self):
        """Check if scraper should run today (fast check)"""
        try:
            # Import DailyScraper and override its database path
            from daily_scraper import DailyScraper
            temp_scraper = DailyScraper()
            
            try:
                from common.logging_config import get_database_path
                temp_scraper.state_db_path = get_database_path("daily_scraper_state.db")
            except ImportError:
                # Fallback to old method
                log_dir = self.get_user_log_directory()
                temp_scraper.state_db_path = log_dir / "daily_scraper_state.db"
            
            # Re-initialize database with new path
            temp_scraper.init_database()
            
            # Log the database path for debugging
            servicemanager.LogMsg(servicemanager.EVENTLOG_INFORMATION_TYPE, 50, 
                                (self._svc_name_, f'Using database path: {temp_scraper.state_db_path}'))
            
            has_run = temp_scraper.has_run_today()
            
            if has_run:
                self.logger.info("Scraper already completed today")
                servicemanager.LogMsg(servicemanager.EVENTLOG_INFORMATION_TYPE, 51, 
                                    (self._svc_name_, f'Database shows already ran: {temp_scraper.state_db_path}'))
                return False
            else:
                self.logger.info("Scraper not run today - scheduling execution")
                servicemanager.LogMsg(servicemanager.EVENTLOG_INFORMATION_TYPE, 52, 
                                    (self._svc_name_, f'Database shows not run today: {temp_scraper.state_db_path}'))
                return True
                
        except Exception as e:
            self.logger.error(f"Error checking scraper status: {e}")
            servicemanager.LogMsg(servicemanager.EVENTLOG_ERROR_TYPE, 53, 
                                (self._svc_name_, f'Error checking database: {str(e)}'))
            return False  # Don't run if we can't check safely
    
    def setup_database_access(self):
        """Set up database access - no CRUD API needed"""
        try:
            servicemanager.LogMsg(servicemanager.EVENTLOG_INFORMATION_TYPE, 99, 
                                (self._svc_name_, 'Setting up direct database access'))
            
            # Add the bundled Backend directory to Python path
            import sys
            if getattr(sys, 'frozen', False):
                # Running in PyInstaller bundle
                bundle_dir = sys._MEIPASS
                backend_path = os.path.join(bundle_dir, 'Backend')
                if backend_path not in sys.path:
                    sys.path.insert(0, backend_path)
                    servicemanager.LogMsg(servicemanager.EVENTLOG_INFORMATION_TYPE, 98, 
                                        (self._svc_name_, f'Added to Python path: {backend_path}'))
            
            # Load environment files - find them dynamically
            from dotenv import load_dotenv
            
            # Find project root by looking for marker files
            current_dir = Path(__file__).parent
            project_root = None
            
            # Search upwards for project root (look for Backend folder)
            for parent in [current_dir] + list(current_dir.parents):
                if (parent / 'Backend').exists():
                    project_root = parent
                    break
            
            if not project_root:
                servicemanager.LogMsg(servicemanager.EVENTLOG_ERROR_TYPE, 104, 
                                    (self._svc_name_, 'Could not find project root directory'))
                return False
            
            servicemanager.LogMsg(servicemanager.EVENTLOG_INFORMATION_TYPE, 105, 
                                (self._svc_name_, f'Found project root: {project_root}'))
            
            # Load main .env file
            main_env_path = project_root / 'Backend' / '.env'
            if main_env_path.exists():
                load_dotenv(main_env_path)
                servicemanager.LogMsg(servicemanager.EVENTLOG_INFORMATION_TYPE, 106, 
                                    (self._svc_name_, f'Loaded main .env from {main_env_path}'))
            
            # Load .env.sites file
            sites_env_path = project_root / '.env.sites'
            if sites_env_path.exists():
                load_dotenv(sites_env_path)
                servicemanager.LogMsg(servicemanager.EVENTLOG_INFORMATION_TYPE, 107, 
                                    (self._svc_name_, f'Loaded .env.sites from {sites_env_path}'))
            else:
                # Try alternative location
                sites_env_path = project_root / 'Backend' / '.env.sites'
                if sites_env_path.exists():
                    load_dotenv(sites_env_path)
                    servicemanager.LogMsg(servicemanager.EVENTLOG_INFORMATION_TYPE, 108, 
                                        (self._svc_name_, f'Loaded .env.sites from {sites_env_path}'))
                else:
                    servicemanager.LogMsg(servicemanager.EVENTLOG_WARNING_TYPE, 109, 
                                        (self._svc_name_, 'Could not find .env.sites file'))
            
            # Verify critical environment variables are loaded
            site_d_url = os.getenv('SITE_D_URL')
            site_f_url = os.getenv('SITE_F_URL')
            
            if site_d_url and site_f_url:
                servicemanager.LogMsg(servicemanager.EVENTLOG_INFORMATION_TYPE, 110, 
                                    (self._svc_name_, 'Site URLs loaded successfully'))
            else:
                servicemanager.LogMsg(servicemanager.EVENTLOG_WARNING_TYPE, 111, 
                                    (self._svc_name_, f'Missing site URLs - SITE_D_URL: {bool(site_d_url)}, SITE_F_URL: {bool(site_f_url)}'))
            
            servicemanager.LogMsg(servicemanager.EVENTLOG_INFORMATION_TYPE, 100, 
                                (self._svc_name_, 'Database access ready'))
            
            return True
            
        except Exception as e:
            servicemanager.LogMsg(servicemanager.EVENTLOG_ERROR_TYPE, 101, 
                                (self._svc_name_, f'Failed to set up database access: {str(e)}'))
            return False
    
    def get_user_log_directory(self):
        """Get consistent log directory for both service and normal execution"""
        import os
        
        # Try to get the actual user directory, not SYSTEM user
        # Check various environment variables that might point to user directory
        user_profile = None
        
        # Try different ways to get user directory
        for env_var in ['USERPROFILE', 'HOME']:
            user_profile = os.environ.get(env_var)
            if user_profile and 'Users' in user_profile:
                break
        
        # If we couldn't find user profile, fall back to a shared location
        if not user_profile or 'system32' in user_profile.lower():
            # Use ProgramData for shared access
            user_profile = os.environ.get('PROGRAMDATA', 'C:\\ProgramData')
            log_dir = Path(user_profile) / "hobby-portal" / "logs"
        else:
            # Use actual user AppData
            log_dir = Path(user_profile) / "AppData" / "Local" / "hobby-portal" / "logs"
        
        log_dir.mkdir(parents=True, exist_ok=True)
        return log_dir
    
    def idle_monitoring(self):
        """Just monitor service without APIs"""
        self.logger.info("Service in idle monitoring mode")
        while self.is_running:
            if win32event.WaitForSingleObject(self.hWaitStop, 30000) == win32event.WAIT_OBJECT_0:
                break
        self.logger.info("Idle monitoring stopped")

if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1].lower() == 'debug':
        # Debug mode - run without Windows Service
        print("Running in debug mode...")
        try:
            # Test basic imports first
            print("Testing imports...")
            from daily_scraper import DailyScraper
            print("✓ DailyScraper import successful")
            
            # Test log directory creation
            log_dir = Path(__file__).parent.parent.parent / "logs"
            log_dir.mkdir(exist_ok=True)
            print(f"✓ Log directory ready: {log_dir}")
            
            # Test the scraper logic directly (skip Windows Service wrapper)
            print("Testing daily scraper directly...")
            scraper = DailyScraper()
            print("✓ DailyScraper object created")
            
            # Test checking if should run
            should_run = scraper.has_run_today()
            print(f"✓ Should run today check: {not should_run} (has_run_today: {should_run})")
            
            # Test the orchestrator import
            print("Testing orchestrator import...")
            import sys
            backend_dir = Path(__file__).parent.parent.parent
            sys.path.insert(0, str(backend_dir))
            sys.path.insert(0, str(backend_dir / "common"))
            
            from daily_scraper_orchestrator import DailyScraperOrchestrator
            print("✓ DailyScraperOrchestrator import successful")
            
            orchestrator = DailyScraperOrchestrator()
            print("✓ DailyScraperOrchestrator object created")
            
            print("✓ All components test successful!")
            print("The service should work. The issue might be Windows Service context.")
            
        except Exception as e:
            print(f"✗ Error in debug mode: {e}")
            import traceback
            traceback.print_exc()
    elif len(sys.argv) == 1:
        # Normal service mode
        servicemanager.Initialize()
        servicemanager.PrepareToHostSingle(VNDailyScrapService)
        servicemanager.StartServiceCtrlDispatcher()
    else:
        # Command line operations (install, remove, start, stop)
        win32serviceutil.HandleCommandLine(VNDailyScrapService)