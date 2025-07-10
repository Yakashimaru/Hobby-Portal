# Backend/scrapers/vn_daily_scrap/daily_scraper.py
import sqlite3
import random
import logging
from datetime import datetime
from pathlib import Path

class DailyScraper:
    def __init__(self):
        try:
            from ...common.logging_config import setup_logger, get_database_path
        except ImportError:
            from common.logging_config import setup_logger, get_database_path
        
        # Setup centralized logging
        self.logger = setup_logger('daily_scraper', 'daily_scraper.log')
        
        # Use centralized database path
        self.state_db_path = get_database_path('daily_scraper_state.db')
        self.init_database()
    
    def init_database(self):
        """Initialize state tracking database"""
        with sqlite3.connect(self.state_db_path) as conn:
            conn.execute('''
                CREATE TABLE IF NOT EXISTS daily_runs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    run_date DATE UNIQUE,
                    games_processed INTEGER,
                    games_successful INTEGER,
                    games_failed INTEGER,
                    start_time TIMESTAMP,
                    end_time TIMESTAMP,
                    status TEXT
                )
            ''')
    
    def has_run_today(self):
        """Check if scraper has already run today"""
        today = datetime.now().date()
        with sqlite3.connect(self.state_db_path) as conn:
            cursor = conn.execute(
                "SELECT COUNT(*) FROM daily_runs WHERE run_date = ? AND status = 'completed'", 
                (today,)
            )
            return cursor.fetchone()[0] > 0
    
    def run_daily_scraping(self):
        """Main scraping function - orchestrates the daily scraping process"""
        if self.has_run_today():
            self.logger.info("Daily scraping already completed today. Exiting.")
            return
        
        today = datetime.now().date()
        start_time = datetime.now()
        target_games = random.randint(15, 35)
        
        self.logger.info(f"Starting daily scraping session - target: {target_games} games")
        
        # Record start of run
        with sqlite3.connect(self.state_db_path) as conn:
            conn.execute('''
                INSERT OR REPLACE INTO daily_runs 
                (run_date, games_processed, games_successful, games_failed, start_time, status)
                VALUES (?, 0, 0, 0, ?, 'running')
            ''', (today, start_time))
        
        try:
            # Import and use the daily scraper orchestrator
            from daily_scraper_orchestrator import DailyScraperOrchestrator
            
            orchestrator = DailyScraperOrchestrator()
            result = orchestrator.run_batch_update(target_games)
            
            if result.get('success'):
                # Extract results
                total = result.get('total_processed', 0)
                successful = result.get('successful', 0)
                failed = result.get('failed', 0)
                end_time = datetime.now()
                
                self.logger.info(f"Daily scraping completed!")
                self.logger.info(f"  Total games processed: {total}")
                self.logger.info(f"  Successful: {successful}")
                self.logger.info(f"  Failed: {failed}")
                self.logger.info(f"  Duration: {end_time - start_time}")
                
                # Update run record with results
                with sqlite3.connect(self.state_db_path) as conn:
                    conn.execute('''
                        UPDATE daily_runs 
                        SET games_processed = ?, games_successful = ?, games_failed = ?, 
                            end_time = ?, status = 'completed'
                        WHERE run_date = ?
                    ''', (total, successful, failed, end_time, today))
                
                return True
            else:
                self.logger.error(f"Daily scraping failed: {result.get('error', 'Unknown error')}")
                
                # Mark as failed
                with sqlite3.connect(self.state_db_path) as conn:
                    conn.execute('''
                        UPDATE daily_runs 
                        SET status = 'failed', end_time = ?
                        WHERE run_date = ?
                    ''', (datetime.now(), today))
                
                return False
                
        except Exception as e:
            self.logger.error(f"Error in daily scraping orchestrator: {e}")
            
            # Mark as failed
            with sqlite3.connect(self.state_db_path) as conn:
                conn.execute('''
                    UPDATE daily_runs 
                    SET status = 'failed', end_time = ?
                    WHERE run_date = ?
                ''', (datetime.now(), today))
            
            return False

def main():
    """Entry point for manual execution"""
    scraper = DailyScraper()
    scraper.run_daily_scraping()

if __name__ == "__main__":
    main()