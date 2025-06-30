# Backend/scrapers/vn_daily_scrap/daily_scraper_orchestrator.py
import sys
import random
import time
import logging
import os
import sqlite3
from pathlib import Path
from datetime import datetime, timedelta

# Add Backend directory to Python path for imports
backend_dir = Path(__file__).parent.parent.parent
sys.path.insert(0, str(backend_dir))

# Add Backend directory to Python path for imports FIRST
backend_dir = Path(__file__).parent.parent.parent
sys.path.insert(0, str(backend_dir))               # For package imports (common.database_functions)
sys.path.insert(0, str(backend_dir / "common"))    # For internal imports (database_connection)

# Import existing modules
try:
    # Try relative imports first (when imported as module)
    from ...common.database_functions import get_database, put_database
    from ...common.scraping.scraping_utils import SmartScraper
    from ..vn_parsers.game_data_parser import GameDataParser
    from ...common.logging_config import setup_logger, get_database_path
except ImportError:
    # Fall back to absolute imports (when run directly)
    from common.database_functions import get_database, put_database
    from common.scraping.scraping_utils import SmartScraper
    from scrapers.vn_parsers.game_data_parser import GameDataParser
    from common.logging_config import setup_logger, get_database_path


class DailyScraperOrchestrator:
    def __init__(self):
        self.smart_scraper = SmartScraper()
        self.setup_logging()
        self.setup_summary_logging()  # Add clean summary logs
    
    def load_env_files(self):
        """Load environment files dynamically - works in any context"""
        try:
            from dotenv import load_dotenv
            
            # Find project root by looking for Backend folder
            current_dir = Path(__file__).parent
            project_root = None
            
            # Search upwards for project root
            for parent in [current_dir] + list(current_dir.parents):
                if (parent / 'Backend').exists():
                    project_root = parent
                    break
            
            if not project_root:
                self.logger.error("Could not find project root directory")
                return False
            
            self.logger.debug(f"Found project root: {project_root}")
            
            # Load .env.sites file
            sites_env_paths = [
                project_root / '.env.sites',
                project_root / 'Backend' / '.env.sites'
            ]
            
            env_loaded = False
            for env_path in sites_env_paths:
                if env_path.exists():
                    load_dotenv(env_path)
                    self.logger.debug(f"Loaded .env.sites from: {env_path}")
                    env_loaded = True
                    break
            
            if not env_loaded:
                self.logger.error(f"Could not find .env.sites in any of these paths: {sites_env_paths}")
                return False
            
            return True
            
        except Exception as e:
            self.logger.error(f"Error loading environment files: {e}")
            return False

    def setup_logging(self):
        """Setup detailed logging for orchestrator"""
        self.logger = setup_logger('orchestrator', 'orchestrator.log')
    
    def setup_summary_logging(self):
        self.summary_logger = setup_logger('summary', 'scraping_summary.log')
    
    def run_batch_update(self, target_count=None):
        """Main batch update function using direct database/scraper calls"""
        if target_count is None:
            target_count = random.randint(15, 30)
        
        self.logger.info(f"Starting batch update for {target_count} games")
        
        # Step 1: Get all games directly from database
        all_games = get_database('visualnovel')
        if isinstance(all_games, dict) and 'error' in all_games:
            self.logger.error(f"Database error: {all_games['error']}")
            return {'success': False, 'error': 'Database connection failed'}
        
        self.logger.info(f"Retrieved {len(all_games)} games from database")
        
        # Step 2: Filter scrapeable games
        scrapeable_games = self.filter_scrapeable_games(all_games)
        self.logger.info(f"Found {len(scrapeable_games)} scrapeable games")
        
        # Step 3: Select games to process using smart selection
        selected_games = self.select_games_smart(scrapeable_games, target_count)
        self.logger.info(f"Selected {len(selected_games)} games for processing")
        
        # Step 4: Process each game
        results = []
        successful_count = 0
        failed_count = 0
        
        for i, game in enumerate(selected_games, 1):
            game_name = game.get('game', 'Unknown')
            self.logger.info(f"[{i:2d}/{len(selected_games)}] Processing: {game_name}")
            
            try:
                # Scrape the game
                scrape_result = self.scrape_single_game(game)
                
                if scrape_result['success']:
                    # Update in database
                    update_result = self.update_game_database(game, scrape_result['data'])
                    
                    if update_result['success']:
                        successful_count += 1
                        results.append({
                            'game': game_name,
                            'status': 'success',
                            'source': scrape_result['source'],
                            'data': scrape_result['data']
                        })
                        
                        # Log successful scrape to state database
                        self.log_scraping_result(game, True, scrape_result['source'], scrape_result['data'])
                        
                        # Clean summary log (what you want to see)
                        self.summary_logger.info(f"{game_name} SUCCESSFUL {scrape_result['source']}")
                        
                        self.logger.info(f" SUCCESS ({scrape_result['source']})")
                    else:
                        failed_count += 1
                        results.append({
                            'game': game_name,
                            'status': 'failed',
                            'error': 'Database update failed',
                            'source': scrape_result['source']
                        })
                        
                        # Log failed database update
                        self.log_scraping_result(game, False, scrape_result['source'], error='Database update failed')
                        
                        # Clean summary log
                        self.summary_logger.info(f"{game_name} FAILED database_update")
                        
                        self.logger.error(f" DB UPDATE FAILED")
                else:
                    failed_count += 1
                    results.append({
                        'game': game_name,
                        'status': 'failed',
                        'error': 'Scraping failed',
                        'source': 'none'
                    })
                    
                    # Log failed scraping
                    self.log_scraping_result(game, False, 'all_sources', error='Scraping failed')
                    
                    # Clean summary log
                    self.summary_logger.info(f"{game_name} FAILED scraping")
                    
                    self.logger.error(f"  SCRAPING FAILED")
                    
            except Exception as e:
                failed_count += 1
                results.append({
                    'game': game_name,
                    'status': 'failed',
                    'error': str(e),
                    'source': 'none'
                })
                                    # Clean summary log
                self.summary_logger.info(f"{game_name} FAILED error")
                    
                self.logger.error(f"  ERROR: {e}")
            
            # Add delay between games (3-8 seconds)
            if i < len(selected_games):
                delay = random.uniform(3, 8)
                time.sleep(delay)
        
        # Summary
        self.logger.info(f"Batch update completed!")
        self.logger.info(f"  Total: {len(selected_games)}")
        self.logger.info(f"  Successful: {successful_count}")
        self.logger.info(f"  Failed: {failed_count}")
        
        return {
            'success': True,
            'total_processed': len(selected_games),
            'successful': successful_count,
            'failed': failed_count,
            'results': results
        }
    
    def filter_scrapeable_games(self, all_games):
        """Filter games that have URLs for scraping AND are Ongoing/Watchlist"""
        scrapeable = []
        for game in all_games:
            # Only process Ongoing or Watchlist games
            status = game.get('status', '').strip()
            if status not in ['Ongoing', 'Watchlist']:
                continue
                
            has_primary = game.get('game') and game['game'].strip()
            has_src_f = game.get('src_f') and game['src_f'].strip()
            
            if has_primary or has_src_f:
                scrapeable.append(game)
        
        return scrapeable
    
    def select_games_smart(self, games, target_count):
        # """Hardcoded selection for testing - Being A Dik and Eternum"""
    
        # # Hardcode the games we want to test
        # target_game_names = ['Being a Dik', 'Eternum']
        
        # selected_games = []
        
        # # Find these specific games in the database
        # for game in games:
        #     game_name = game.get('game', '').strip()
        #     if any(target in game_name for target in target_game_names):
        #         selected_games.append(game)
        #         self.logger.info(f"Found target game: {game_name} (ID: {game.get('id')})")
        
        # self.logger.info(f"Hardcoded selection: {len(selected_games)} games - {[g.get('game') for g in selected_games]}")
        # return selected_games
        """Smart game selection with coverage - prevents repeats and ensures eventual full coverage"""
        
        # Configuration parameters
        EXCLUSION_DAYS = 7
        HIGH_PRIORITY_RATIO = 0.4   # 40% to top games
        MEDIUM_PRIORITY_RATIO = 0.35 # 35% to medium games  
        LOW_PRIORITY_RATIO = 0.25   # 25% to others
        MIN_RATING_HIGH = 7
        MIN_RATING_MEDIUM = 5
        MIN_DAYS_HIGH = 30
        MIN_DAYS_MEDIUM = 15
        
        today = datetime.now().date()
        exclusion_date = today - timedelta(days=EXCLUSION_DAYS)
        
        # Step 1: Get recently scraped games (last 7 days)
        recently_scraped_ids = self.get_recently_scraped_game_ids(exclusion_date)
        
        self.logger.info(f"Excluding {len(recently_scraped_ids)} recently scraped games (last {EXCLUSION_DAYS} days)")
        
        # Step 2: Separate available games from recently scraped
        available_games = [game for game in games if game.get('id') not in recently_scraped_ids]
        recently_scraped_games = [game for game in games if game.get('id') in recently_scraped_ids]
        
        self.logger.info(f"Available games: {len(available_games)}, Recently scraped: {len(recently_scraped_games)}")
        
        # Step 3: Categorize available games into priority buckets
        high_priority = []
        medium_priority = []
        low_priority = []
        
        for game in available_games:
            rating = float(game.get('rating', 0)) if game.get('rating') else 0
            days_since_update = self.calculate_days_since_update(game)
            
            if rating >= MIN_RATING_HIGH and days_since_update >= MIN_DAYS_HIGH:
                high_priority.append(game)
            elif rating >= MIN_RATING_MEDIUM and days_since_update >= MIN_DAYS_MEDIUM:
                medium_priority.append(game)
            else:
                low_priority.append(game)
        
        self.logger.info(f"Priority buckets - High: {len(high_priority)}, Medium: {len(medium_priority)}, Low: {len(low_priority)}")
        
        # Step 4: Calculate target counts for each bucket
        high_target = int(target_count * HIGH_PRIORITY_RATIO)
        medium_target = int(target_count * MEDIUM_PRIORITY_RATIO)
        low_target = int(target_count * LOW_PRIORITY_RATIO)
        
        # Step 5: Select games from each bucket
        selections = []
        
        # High priority selection
        if high_priority:
            selected_high = random.sample(high_priority, min(high_target, len(high_priority)))
            selections.extend(selected_high)
            self.logger.info(f"Selected {len(selected_high)} high-priority games")
        
        # Medium priority selection  
        if medium_priority:
            selected_medium = random.sample(medium_priority, min(medium_target, len(medium_priority)))
            selections.extend(selected_medium)
            self.logger.info(f"Selected {len(selected_medium)} medium-priority games")
        
        # Low priority selection
        if low_priority:
            selected_low = random.sample(low_priority, min(low_target, len(low_priority)))
            selections.extend(selected_low)
            self.logger.info(f"Selected {len(selected_low)} low-priority games")
        
        # Step 6: Fill remaining slots if needed
        remaining_needed = target_count - len(selections)
        if remaining_needed > 0:
            # First try to get more from available games that weren't selected
            unselected_available = [g for g in available_games if g not in selections]
            if unselected_available:
                additional_from_available = random.sample(
                    unselected_available, 
                    min(remaining_needed, len(unselected_available))
                )
                selections.extend(additional_from_available)
                remaining_needed = target_count - len(selections)
                self.logger.info(f"Added {len(additional_from_available)} additional games from available pool")
            
            # If still need more, fall back to recently scraped games
            if remaining_needed > 0 and recently_scraped_games:
                fallback_games = random.sample(
                    recently_scraped_games,
                    min(remaining_needed, len(recently_scraped_games))
                )
                selections.extend(fallback_games)
                self.logger.info(f"Added {len(fallback_games)} games from recently scraped (fallback)")
        
        # Step 7: Final shuffle to avoid any ordering patterns
        random.shuffle(selections)
        
        self.logger.info(f"Final selection: {len(selections)} games with smart coverage logic")
        return selections
    
    def get_recently_scraped_game_ids(self, exclusion_date):
        """Get IDs of games scraped recently using SQLite state database"""
        try:
            state_db_path = get_database_path('daily_scraper_state.db')
            
            if not state_db_path.exists():
                self.logger.info("No state database found - treating all games as available")
                return set()
            
            import sqlite3
            with sqlite3.connect(state_db_path) as conn:
                # Check if the table exists first
                cursor = conn.execute("""
                    SELECT name FROM sqlite_master 
                    WHERE type='table' AND name='game_scrape_log'
                """)
                
                if not cursor.fetchone():
                    self.logger.info("No scrape log table found - treating all games as available")
                    return set()
                
                # Get recently scraped game IDs
                cursor = conn.execute("""
                    SELECT DISTINCT game_id 
                    FROM game_scrape_log 
                    WHERE scrape_date > ? AND success = 1
                """, (exclusion_date,))
                
                return {row[0] for row in cursor.fetchall() if row[0]}
                
        except Exception as e:
            self.logger.warning(f"Error checking recently scraped games: {e}")
            return set()
    
    def calculate_days_since_update(self, game):
        """Calculate days since last update for a game"""
        today = datetime.now().date()
        
        if not game.get('last_updated'):
            return 365  # Never updated = very old
        
        try:
            # Handle the TO_CHAR formatted date from database (DD/MM/YYYY)
            date_str = game['last_updated']
            if '/' in date_str:
                day, month, year = date_str.split('/')
                last_updated_date = datetime(int(year), int(month), int(day)).date()
                return (today - last_updated_date).days
        except Exception:
            pass
        
        return 365  # Default to very old if can't parse
    
    def scrape_single_game(self, game):
        """Scrape a single game with fallback logic"""
        # Try primary URL first
        if game.get('game'):
            primary_url = self.generate_primary_url(game['game'])
            result = self.scrape_url(primary_url)
            if result['success']:
                return {
                    'success': True,
                    'source': 'primary',
                    'data': result['data']
                }
        
        # Try src_f as fallback
        if game.get('src_f'):
            src_f_url = self.generate_src_f_url(game['src_f'])
            result = self.scrape_url(src_f_url)
            if result['success']:
                return {
                    'success': True,
                    'source': 'src_f',
                    'data': result['data']
                }
        
        return {'success': False, 'source': 'none', 'data': None}
    
    def scrape_url(self, url):
        """Scrape a URL using existing SmartScraper"""
        try:
            response = self.smart_scraper.smart_get(url, 3, 8)
            
            if response.status_code == 200:
                # Use existing parser
                parsed_data = GameDataParser.auto_detect_site_and_parse(url, response)
                
                if parsed_data.get('last_updated'):
                    return {
                        'success': True,
                        'data': parsed_data
                    }
            
            return {'success': False, 'data': None}
            
        except Exception as e:
            return {'success': False, 'data': None, 'error': str(e)}
    
    def update_game_database(self, game, scraped_data):
        """Update game in database using existing function"""
        try:
            update_data = {'id': game['id']}
            
            if scraped_data.get('developer'):
                update_data['developer'] = scraped_data['developer']
            if scraped_data.get('last_updated'):
                update_data['last_updated'] = scraped_data['last_updated']
            if scraped_data.get('version'):
                update_data['last_updated_ver'] = scraped_data['version']
            if scraped_data.get('year'):
                update_data['year'] = scraped_data['year']

            # Log what we're about to update
            self.logger.info(f"Updating game ID {game['id']} ({game.get('game', 'Unknown')}) with data: {update_data}")
            
            # Use existing database function
            result = put_database('visualnovel', update_data, 'id')
            
            # Handle Flask response vs direct response
            if isinstance(result, tuple):
                # Flask response: (response_object, status_code)
                response_obj, status_code = result
                if status_code in [200, 201]:
                    self.logger.info(f"✅ Database update successful for game ID {game['id']}")
                    return {'success': True}
                else:
                    # Try to get error message from response
                    try:
                        if hasattr(response_obj, 'get_json'):
                            error_data = response_obj.get_json()
                            error_msg = error_data.get('message', 'Unknown error')
                        else:
                            error_msg = str(response_obj)
                    except:
                        error_msg = f"HTTP {status_code}"
                        self.logger.error(f"Database update failed for game ID {game['id']}: {error_msg}")
                    return {'success': False, 'error': error_msg}
            elif isinstance(result, dict):
                # Direct dict response
                if 'error' in result:
                    self.logger.error(f"Database update failed for game ID {game['id']}: {result['error']}")
                    return {'success': False, 'error': result['error']}
                else:
                    self.logger.info(f"Database update successful for game ID {game['id']}")
                    return {'success': True}
            else:
                # Assume success if no error structure
                return {'success': True}
                
        except Exception as e:
            # Check if it's the Flask context error
            if "Working outside of application context" in str(e):
                # Try direct database connection approach
                return self.update_game_database_direct(game, scraped_data)
            else:
                return {'success': False, 'error': str(e)}
    
    def update_game_database_direct(self, game, scraped_data):
        """Direct database update without Flask context"""
        try:
            import sqlite3
            from database_connection import connect_to_database
            
            # Build update data
            update_fields = []
            update_values = []
            
            if scraped_data.get('developer'):
                update_fields.append("developer = %s")
                update_values.append(scraped_data['developer'])
            if scraped_data.get('last_updated'):
                update_fields.append("last_updated = %s") 
                update_values.append(scraped_data['last_updated'])
            if scraped_data.get('version'):
                update_fields.append("last_updated_ver = %s")
                update_values.append(scraped_data['version'])
            if scraped_data.get('year'):
                update_fields.append("year = %s")
                update_values.append(scraped_data['year'])
            
            if not update_fields:
                return {'success': False, 'error': 'No data to update'}
            
            # Direct database update
            conn = connect_to_database()
            cur = conn.cursor()
            
            set_clause = ', '.join(update_fields)
            sql_query = f"UPDATE visualnovel SET {set_clause} WHERE id = %s"
            update_values.append(game['id'])
            
            cur.execute(sql_query, update_values)
            conn.commit()
            
            rows_affected = cur.rowcount
            cur.close()
            conn.close()
            
            if rows_affected > 0:
                return {'success': True}
            else:
                return {'success': False, 'error': 'No rows updated'}
                
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def log_scraping_result(self, game, success, source, scraped_data=None, error=None):
        """Log scraping result to state database for tracking"""
        try:
            state_db_path = get_database_path('daily_scraper_state.db')
            today = datetime.now().date()
            
            with sqlite3.connect(state_db_path) as conn:
                # Ensure the table exists
                conn.execute('''
                    CREATE TABLE IF NOT EXISTS game_scrape_log (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        game_id INTEGER,
                        game_name TEXT,
                        scrape_date DATE,
                        success BOOLEAN,
                        source_used TEXT,
                        error_message TEXT,
                        last_updated_found TEXT
                    )
                ''')
                
                # Insert the log entry
                conn.execute('''
                    INSERT INTO game_scrape_log 
                    (game_id, game_name, scrape_date, success, source_used, error_message, last_updated_found)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (
                    game.get('id'),
                    game.get('game'),
                    today,
                    success,
                    source,
                    error,
                    scraped_data.get('last_updated') if scraped_data else None
                ))
                
        except Exception as e:
            self.logger.warning(f"Failed to log scraping result: {e}")

    def generate_primary_url(self, game_name):
        """Generate primary site URL using SITE_D_URL from .env.sites"""
        try:
            # Load environment files
            if not self.load_env_files():
                return None
            
            # Get base URL from environment
            base_url = os.getenv('SITE_D_URL')
            if not base_url:
                self.logger.error("SITE_D_URL not found in environment")
                return None
            
            # Format game name: replace spaces with hyphens, remove special characters
            formatted_name = game_name.lower().replace(' ', '-')
            import re
            formatted_name = re.sub(r'[^\w\-]', '', formatted_name)
            
            url = f"{base_url}/{formatted_name}"
            self.logger.debug(f"Generated primary URL: {url}")
            return url
            
        except Exception as e:
            self.logger.error(f"Error generating primary URL: {e}")
            return None
    
    def generate_src_f_url(self, src_f_id):
        """Generate src F URL using SITE_F_URL from .env.sites"""
        try:
            # Load environment files
            if not self.load_env_files():
                return None
            
            # Get base URL from environment
            base_url = os.getenv('SITE_F_URL')
            if not base_url:
                self.logger.error("SITE_F_URL not found in environment")
                return None
            
            url = f"{base_url}/{src_f_id}"
            self.logger.debug(f"Generated src_f URL: {url}")
            return url
            
        except Exception as e:
            self.logger.error(f"Error generating src_f URL: {e}")
            return None

# Function for standalone execution
def run_batch_update(target_count=None):
    orchestrator = DailyScraperOrchestrator()
    return orchestrator.run_batch_update(target_count)

if __name__ == "__main__":
    run_batch_update()