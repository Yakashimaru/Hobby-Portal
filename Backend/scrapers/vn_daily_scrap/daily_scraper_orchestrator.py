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
    
    # Safe rating handling function
    def safe_get_rating(self, game):
        """Safely get rating as float, handling None/empty values"""
        rating = game.get('rating')
        if rating is None or rating == '' or rating == 'None':
            return 0.0
        try:
            return float(rating)
        except (ValueError, TypeError):
            return 0.0
    
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
        # """Hardcoded selection for testing - Game Title A and Game Title B"""
    
        # # Hardcode the games we want to test
        # target_game_names = ['Game Title A', 'Game Title B']
        
        # selected_games = []
        
        # # Find these specific games in the database
        # for game in games:
        #     game_name = game.get('game', '').strip()
        #     if any(target in game_name for target in target_game_names):
        #         selected_games.append(game)
        #         self.logger.info(f"Found target game: {game_name} (ID: {game.get('id')})")
        
        # self.logger.info(f"Hardcoded selection: {len(selected_games)} games - {[g.get('game') for g in selected_games]}")
        # return selected_games
        """Smart game selection with GUARANTEED full coverage over time"""

        # Debug: Check top games by rating
        self.logger.info("Top 10 games by rating:")
        sorted_by_rating = sorted(games, key=lambda g: self.safe_get_rating(g), reverse=True)
        for i, game in enumerate(sorted_by_rating[:10]):
            rating = self.safe_get_rating(game)
            self.logger.info(f"  {i+1}. {game.get('game')} - Rating: {rating}")
    
        # Configuration parameters
        EXCLUSION_DAYS = 5
        HIGH_PRIORITY_RATIO = 0.4   
        MEDIUM_PRIORITY_RATIO = 0.35 
        MIN_RATING_HIGH = 7
        MIN_RATING_MEDIUM = 5
        MIN_DAYS_SINCE_SCRAPE_HIGH = 21    
        MIN_DAYS_SINCE_SCRAPE_MEDIUM = 7  
        
        # Coverage guarantee parameters
        NEVER_SCRAPED_MIN_SLOTS = max(1, int(target_count * 0.1))  # At least 10% for never-scraped
        STALE_GAME_THRESHOLD = 30  # Games not scraped in 30+ days get priority boost
        
        today = datetime.now().date()
        
        # Step 1: Get scraping history for ALL games
        scraping_history = self.get_scraping_history()
        
        # Step 2: Categorize ALL games by scraping status
        never_scraped = []
        recently_scraped = []  # Within exclusion period
        stale_games = []       # Not recent, but not never
        available_games = []   # All non-recent games
        
        for game in games:
            game_id = game.get('id')
            days_since_scrape = self.calculate_days_since_scrape(game, scraping_history)
            
            if days_since_scrape == 999:  # Never scraped
                never_scraped.append(game)
                available_games.append(game)
            elif days_since_scrape <= EXCLUSION_DAYS:  # Recently scraped
                recently_scraped.append(game)
            elif days_since_scrape >= STALE_GAME_THRESHOLD:  # Stale games
                stale_games.append(game)
                available_games.append(game)
            else:  # Regular available games
                available_games.append(game)
        
        self.logger.info(f"Game categories - Never scraped: {len(never_scraped)}, "
                        f"Recently scraped: {len(recently_scraped)}, "
                        f"Stale (30+ days): {len(stale_games)}, "
                        f"Total available: {len(available_games)}")
        
        # Step 3: GUARANTEE coverage - reserve slots for never-scraped games
        selections = []
        remaining_slots = target_count
        
        # PHASE 1: Mandatory never-scraped games (coverage guarantee)
        if never_scraped and remaining_slots > 0:
            # Sort never-scraped by rating (highest first)
            never_scraped_sorted = sorted(never_scraped, 
                                        key=lambda g: self.safe_get_rating(g), 
                                        reverse=True)
            
            never_scraped_count = min(NEVER_SCRAPED_MIN_SLOTS, len(never_scraped), remaining_slots)
            selected_never_scraped = never_scraped_sorted[:never_scraped_count]
            selections.extend(selected_never_scraped)
            remaining_slots -= len(selected_never_scraped)
            
            self.logger.info(f"COVERAGE GUARANTEE: Selected {len(selected_never_scraped)} never-scraped games")
        
        # PHASE 2: Priority boost for stale games
        stale_boost_slots = min(int(remaining_slots * 0.2), len(stale_games))  # 20% for stale
        if stale_games and stale_boost_slots > 0 and remaining_slots > 0:
            # Sort stale games by rating and days since scrape
            stale_games_sorted = sorted(stale_games, 
                                    key=lambda g: (self.safe_get_rating(g), 
                                                self.calculate_days_since_scrape(g, scraping_history)), 
                                    reverse=True)
            
            selected_stale = [g for g in stale_games_sorted[:stale_boost_slots] if g not in selections]
            selections.extend(selected_stale)
            remaining_slots -= len(selected_stale)
            
            self.logger.info(f"STALE BOOST: Selected {len(selected_stale)} stale games")
        
        # PHASE 3: Regular priority buckets (from remaining available games)
        if remaining_slots > 0:
            # Remove already selected games from available pool
            remaining_available = [g for g in available_games if g not in selections]
            
            # Categorize remaining games into priority buckets
            high_priority = []
            medium_priority = []
            low_priority = []
            
            for game in remaining_available:
                rating = self.safe_get_rating(game)
                days_since_scrape = self.calculate_days_since_scrape(game, scraping_history)
                
                if rating >= MIN_RATING_HIGH and days_since_scrape >= MIN_DAYS_SINCE_SCRAPE_HIGH:
                    high_priority.append(game)
                elif rating >= MIN_RATING_MEDIUM and days_since_scrape >= MIN_DAYS_SINCE_SCRAPE_MEDIUM:
                    medium_priority.append(game)
                else:
                    low_priority.append(game)
            
            # Calculate bucket targets based on remaining slots
            high_target = int(remaining_slots * HIGH_PRIORITY_RATIO)
            medium_target = int(remaining_slots * MEDIUM_PRIORITY_RATIO)
            low_target = remaining_slots - high_target - medium_target
            
            # Select from buckets (oldest first within each bucket)
            bucket_selections = []
            
            # High priority
            if high_priority and high_target > 0:
                high_sorted = sorted(high_priority, 
                                key=lambda g: self.calculate_days_since_scrape(g, scraping_history), 
                                reverse=True)
                bucket_selections.extend(high_sorted[:high_target])
            
            # Medium priority
            if medium_priority and medium_target > 0:
                medium_sorted = sorted(medium_priority,
                                    key=lambda g: self.calculate_days_since_scrape(g, scraping_history),
                                    reverse=True)
                bucket_selections.extend(medium_sorted[:medium_target])
            
            # Low priority
            if low_priority and low_target > 0:
                low_sorted = sorted(low_priority,
                                key=lambda g: self.calculate_days_since_scrape(g, scraping_history),
                                reverse=True)
                bucket_selections.extend(low_sorted[:low_target])
            
            selections.extend(bucket_selections)
            remaining_slots -= len(bucket_selections)
            
            self.logger.info(f"BUCKET SELECTION: Added {len(bucket_selections)} games from priority buckets")
        
        self.logger.info(f"Priority buckets - High: {len(high_priority)}, Medium: {len(medium_priority)}, Low: {len(low_priority)}")
        if high_priority:
            self.logger.info(f"High priority games: {[g.get('game') for g in high_priority[:5]]}")


        # PHASE 4: Fill any remaining slots with oldest available games
        if remaining_slots > 0:
            remaining_available = [g for g in available_games if g not in selections]
            if remaining_available:
                # Sort by days since scrape (oldest first)
                oldest_available = sorted(remaining_available,
                                        key=lambda g: self.calculate_days_since_scrape(g, scraping_history),
                                        reverse=True)
                additional_games = oldest_available[:remaining_slots]
                selections.extend(additional_games)
                remaining_slots -= len(additional_games)
                
                self.logger.info(f"FILL REMAINING: Added {len(additional_games)} oldest available games")
        
        # PHASE 5: Last resort - use recently scraped games if still need more
        if remaining_slots > 0 and recently_scraped:
            # Sort recently scraped by oldest first
            recently_scraped_sorted = sorted(recently_scraped,
                                        key=lambda g: self.calculate_days_since_scrape(g, scraping_history),
                                        reverse=True)
            fallback_games = recently_scraped_sorted[:remaining_slots]
            selections.extend(fallback_games)
            
            self.logger.info(f"FALLBACK: Added {len(fallback_games)} from recently scraped")
        
        # Final shuffle to avoid patterns (but log the pre-shuffle selection for debugging)
        self.logger.info(f"Pre-shuffle selection summary:")
        self.logger.info(f"  Never scraped: {len([g for g in selections if self.calculate_days_since_scrape(g, scraping_history) == 999])}")
        self.logger.info(f"  Stale (30+ days): {len([g for g in selections if 30 <= self.calculate_days_since_scrape(g, scraping_history) < 999])}")  # ← Updated
        self.logger.info(f"  Recent (< 30 days): {len([g for g in selections if self.calculate_days_since_scrape(g, scraping_history) < 30])}")  # ← Updated
        
        random.shuffle(selections)
        
        self.logger.info(f"FINAL SELECTION: {len(selections)} games with guaranteed full coverage")
        return selections

    def get_coverage_stats(self):
        """Get statistics about scraping coverage - useful for monitoring"""
        try:
            all_games = get_database('visualnovel')
            if isinstance(all_games, dict) and 'error' in all_games:
                return {'error': 'Database connection failed'}
            
            # Filter to scrapeable games only
            scrapeable_games = self.filter_scrapeable_games(all_games)
            self.logger.info(f"Top 10 scrapeable games by rating:")
            sorted_by_rating = sorted(scrapeable_games, key=lambda g: self.safe_get_rating(g), reverse=True)
            for i, game in enumerate(sorted_by_rating[:10]):
                rating = self.safe_get_rating(game)
                self.logger.info(f"  {i+1}. {game.get('game', 'No Name')} - Rating: {rating} (raw: {game.get('rating')})")
            scraping_history = self.get_scraping_history()
            
            today = datetime.now().date()
            
            stats = {
                'total_scrapeable': len(scrapeable_games),
                'never_scraped': 0,
                'scraped_last_7_days': 0,
                'scraped_last_15_days': 0,
                'scraped_over_30_days_ago': 0,
                'coverage_percentage': 0
            }
            
            for game in scrapeable_games:
                game_id = game.get('id')
                if game_id in scraping_history:
                    days_ago = (today - scraping_history[game_id]).days
                    if days_ago <= 7:
                        stats['scraped_last_7_days'] += 1
                    elif days_ago <= 15:
                        stats['scraped_last_15_days'] += 1
                    elif days_ago >= 30:
                        stats['scraped_over_30_days_ago'] += 1
                else:
                    stats['never_scraped'] += 1
            
            # Calculate coverage percentage
            scraped_count = stats['total_scrapeable'] - stats['never_scraped']
            if stats['total_scrapeable'] > 0:
                stats['coverage_percentage'] = (scraped_count / stats['total_scrapeable']) * 100
            
            return stats
            
        except Exception as e:
            return {'error': str(e)}
    
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
        
    def get_scraping_history(self):
        """Get scraping history for all games - returns dict of {game_id: last_scraped_date}"""
        try:
            state_db_path = get_database_path('daily_scraper_state.db')
            
            if not state_db_path.exists():
                self.logger.info("No state database found - treating all games as never scraped")
                return {}
            
            with sqlite3.connect(state_db_path) as conn:
                # Check if the table exists first
                cursor = conn.execute("""
                    SELECT name FROM sqlite_master 
                    WHERE type='table' AND name='game_scrape_log'
                """)
                
                if not cursor.fetchone():
                    self.logger.info("No scrape log table found - treating all games as never scraped")
                    return {}
                
                # Get the most recent successful scrape date for each game
                cursor = conn.execute("""
                    SELECT game_id, MAX(scrape_date) as last_scraped
                    FROM game_scrape_log 
                    WHERE success = 1
                    GROUP BY game_id
                """)
                
                history = {}
                for row in cursor.fetchall():
                    game_id, date_str = row
                    if game_id and date_str:
                        # Convert string date back to date object
                        try:
                            history[game_id] = datetime.strptime(date_str, '%Y-%m-%d').date()
                        except ValueError:
                            # Handle different date formats if needed
                            pass
                
                return history
                
        except Exception as e:
            self.logger.warning(f"Error getting scraping history: {e}")
            return {}
    
    def calculate_days_since_scrape(self, game, scraping_history):
        """Calculate days since WE last scraped this game"""
        today = datetime.now().date()
        game_id = game.get('id')
        
        if game_id in scraping_history:
            last_scraped = scraping_history[game_id]
            return (today - last_scraped).days
        else:
            # Never scraped = very high priority (999 days)
            return 999
    
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