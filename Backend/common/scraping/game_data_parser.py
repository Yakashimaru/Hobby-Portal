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
    def parse_siteF(response):
        soup = BeautifulSoup(response.content, 'html.parser')
    
        # Extract from the main content
        last_updated = None
        version = None
        developer = None
        game_title = None

        # Target the FIRST article (main post) specifically to avoid old data
        first_post = soup.find('article', class_='message')
        
        if first_post:
            # Look for bold tags only within the first post
            bold_tags = first_post.find_all('b')
            
            for bold_tag in bold_tags:
                text = bold_tag.get_text().strip()
                parent = bold_tag.parent
                
                if text == 'Thread Updated' and parent:
                    # Get the text immediately after this bold tag
                    parent_text = parent.get_text()
                    match = re.search(r'Thread Updated:\s*(\d{4}-\d{2}-\d{2})', parent_text)
                    if match:
                        last_updated = match.group(1)

                if text == 'Release Date' and parent:
                    # Get the text immediately after this bold tag
                    parent_text = parent.get_text()
                    match = re.search(r'Release Date:\s*(\d{4})-\d{2}-\d{2}', parent_text)
                    if match:
                        year = int(match.group(1)) 
                        
        # Extract game title, version, and developer from page title
        title_element = soup.find('title')
        if title_element:
            title_text = title_element.get_text()
            if '|' in title_text:
                game_part = title_text.split('|')[0].strip()
                
                # Extract version and developer from brackets
                brackets = re.findall(r'\[([^\]]+)\]', game_part)
                if len(brackets) >= 2:
                    version = brackets[0]  # First bracket is version
                    developer = brackets[1]  # Second bracket is developer
                elif len(brackets) == 1:
                    # If only one bracket, assume it's version
                    version = brackets[0]
                
                # Remove prefix and all brackets to get clean game title
                game_title = re.sub(r'^VN\s*-\s*Ren\'Py\s*-\s*', '', game_part)  # Remove prefix
                game_title = re.sub(r'\s*\[.*?\]\s*', '', game_title).strip()     # Remove [brackets]
        
        return {
            "last_updated": last_updated,
            "game": game_title,
            "version": version,
            "developer": developer,
            "year": year
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
                "developer": None,
                "year": None
            }