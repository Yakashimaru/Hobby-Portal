from bs4 import BeautifulSoup
from datetime import datetime
import re

try:
    from .scraping_utils import SmartScraper
except:
    from scraping_utils import SmartScraper

class GameDataParser:
    """Site-specific parsing functions"""
    
    @staticmethod
    def parse_siteD(response):
        soup = BeautifulSoup(response.content, 'html.parser')
        
        last_updated_span = soup.find('time', class_='gp-post-meta gp-meta-date')
        post_title_h1 = soup.find('h1', class_='gp-entry-title gp-single-title')

        if last_updated_span and post_title_h1:
            last_updated = last_updated_span.get_text(strip=True)
            post_title = post_title_h1.get_text(strip=True)

            # DEBUG: Print the raw text to see problematic characters
            print(f"DEBUG - Raw post_title: {repr(post_title)}")

            try:
                last_updated_date = datetime.strptime(last_updated, "%B %d, %Y")
                last_updated = last_updated_date.strftime("%Y-%m-%d")
            except ValueError:
                last_updated = None

            match = re.match(r'^(.*?) \[(.*?)\] \[(.*?)\]$', post_title)
            if match:
                game_name = match.group(1)
                ver_number = match.group(2)
                developer = match.group(3)
            else:
                game_name = None
                ver_number = None
                developer = None

            return {
                "last_updated": last_updated,
                "game": game_name,
                "version": ver_number,
                "developer": developer
            }
        
        elif last_updated_span:
            return {
                "last_updated": last_updated_span.get_text(strip=True),
                "game": None,
                "version": None,
                "developer": None
            }
        else:
            return {
                "last_updated": None,
                "game": None,
                "version": None,
                "developer": None
            }
    
    @staticmethod
    def auto_detect_site_and_parse(url, response):
        """Auto-detect site and use appropriate parser"""
        site_type = SmartScraper.get_site_type(url)

        if site_type == 'site_d':
            return GameDataParser.parse_siteD(response)
        elif site_type == 'site_f':
            return GameDataParser.parse_siteF(response)
        else:
            # Try generic parsing or return error
            return {
                "error": f"No parser available for site type: {site_type}",
                "last_updated": None,
                "game": None,
                "version": None,
                "developer": None
            }