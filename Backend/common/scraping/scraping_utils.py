from requests.sessions import Session
import random
import time
from urllib.parse import urlparse
import os

try:
    from ...constants.user_agents import USER_AGENTS
    
except:
    from constants.user_agents import USER_AGENTS

class SmartScraper:
    def __init__(self):
        self.session = Session()
        self.backoff_multiplier = 1.0
        self.consecutive_errors = 0
        self.circuit_breaker = {
            'failures': 0,
            'last_failure': None,
            'is_open': False
        }
        self.last_user_agent_change = 0
        
    def setup_headers(self):
        """Setup human-like headers"""
        self.session.headers.update({
            'User-Agent': random.choice(USER_AGENTS),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Cache-Control': 'max-age=0',
        })

    @staticmethod
    def get_site_type(url):
        """Map URL to site type using env variables"""
        domain = urlparse(url).netloc.lower()

        # Debug logging
        print("domain= " + domain)
        print(f"🔍 DEBUG - URL: {url}")
        print(f"🔍 DEBUG - Parsed domain: '{domain}'")
        print(f"🔍 DEBUG - SITE_D env: '{os.getenv('SITE_D', 'NOT_SET')}'")
        print(f"🔍 DEBUG - SITE_F env: '{os.getenv('SITE_F', 'NOT_SET')}'")
        print(f"🔍 DEBUG - SITE_I env: '{os.getenv('SITE_I', 'NOT_SET')}'")
        
        if domain == os.getenv('SITE_D', '').lower():
            return 'site_d'
        elif domain == os.getenv('SITE_F', '').lower():
            return 'site_f'
        elif domain == os.getenv('SITE_I', '').lower():
            return 'site_i'
        else:
            return 'unknown'
        
    def get_realistic_referer(self, base_url, site_type='generic'):
        """Get realistic referer based on site type"""
        base_referers = [base_url]  # Always include homepage

        site_type = SmartScraper.get_site_type(base_url) 
        
        if site_type == 'site_d':
            base_referers.extend([
                f"{base_url}/top-rated-games",
                f"{base_url}/top-trending-games"
            ])
        elif site_type == 'site_f':
            base_referers.extend([
                f"{base_url}/forums/games.2/",
                f"{base_url}/latest"
            ])
        elif site_type == 'site_i':
            base_referers.extend([
                f"{base_url}/games",
                f"{base_url}/latest"
            ])
        else:
            # Generic fallbacks that usually work
            base_referers.extend([
                f"{base_url}/games",
                f"{base_url}/latest"
            ])
        
        return random.choice(base_referers)
    
    def check_rate_limit_response(self, response, url):
        """Check if we're being rate limited"""
        rate_limit_indicators = [
            response.status_code in [429, 503, 502],
            'rate limit' in response.text.lower(),
            'too many requests' in response.text.lower(),
            'slow down' in response.text.lower(),
            'blocked' in response.text.lower(),
            len(response.text) < 100,  # Suspiciously short response
        ]
        
        if any(rate_limit_indicators):
            print(f"⚠️  Rate limit detected for {url}")
            return True
        return False
    
    def adaptive_sleep(self, base_sleep, rate_limited=False):
        """Adaptive sleep that increases if rate limited"""
        if rate_limited:
            sleep_time = base_sleep * random.uniform(3, 6)
            print(f"😴 Rate limited! Sleeping for {sleep_time:.1f}s")
        else:
            sleep_time = base_sleep * random.uniform(0.8, 1.2)
        
        time.sleep(sleep_time)
        return sleep_time
    
    def check_circuit_breaker(self):
        """Check if circuit breaker should trip"""
        # If too many failures, open circuit
        if self.circuit_breaker['failures'] >= 3:
            self.circuit_breaker['is_open'] = True
            self.circuit_breaker['last_failure'] = time.time()
            return True
        
        # If circuit is open, check if enough time has passed
        if self.circuit_breaker['is_open']:
            if time.time() - self.circuit_breaker['last_failure'] > 300:  # 5 minutes
                self.circuit_breaker['is_open'] = False
                self.circuit_breaker['failures'] = 0
                print("🔄 Circuit breaker reset - trying again")
                return False
            return True
        
        return False
    
    def maybe_rotate_user_agent(self):
        """Rotate user agent every few requests"""
        if time.time() - self.last_user_agent_change > 60:  # Every minute
            new_ua = random.choice(USER_AGENTS)
            self.session.headers['User-Agent'] = new_ua
            self.last_user_agent_change = time.time()
            print(f"🔄 Rotated User-Agent: {new_ua[:50]}...")
    
    def smart_get(self, url, sleep_low=3, sleep_high=8, timeout=30):
        """Main smart request function with all protections"""
        
        # Check circuit breaker
        if self.check_circuit_breaker():
            raise Exception("Circuit breaker open - too many failures")
        
        # Setup headers
        self.setup_headers()
        
        # Auto-extract base URL
        parsed_url = urlparse(url)
        base_url = f"{parsed_url.scheme}://{parsed_url.netloc}"
        
        # Set up referer if first request
        current_referer = self.session.headers.get('Referer', 'None')
        print(f"🔍 Current referer: {current_referer}")
        
        if 'Referer' not in self.session.headers:
            new_referer = self.get_realistic_referer(base_url)
            self.session.headers['Referer'] = new_referer
            print(f"🆕 Set new referer: {new_referer}")
        
        # Maybe rotate user agent
        self.maybe_rotate_user_agent()
        
        # Adaptive sleep with backoff
        base_sleep = random.uniform(sleep_low, sleep_high)
        actual_sleep = base_sleep * self.backoff_multiplier
        print(f"😴 Sleeping {actual_sleep:.1f}s (backoff: {self.backoff_multiplier:.1f}x)")
        time.sleep(actual_sleep)
        
        # Make the request
        response = self.session.get(url, timeout=timeout)
        
        # Check for rate limiting
        if self.check_rate_limit_response(response, url):
            self.consecutive_errors += 1
            self.circuit_breaker['failures'] += 1
            self.backoff_multiplier = min(self.backoff_multiplier * 1.5, 5.0)
            
            # Extra punishment sleep
            punishment_sleep = random.uniform(10, 20) * self.backoff_multiplier
            print(f"🚨 Punishment sleep: {punishment_sleep:.1f}s")
            time.sleep(punishment_sleep)
            
            raise Exception(f"Rate limited - backoff: {self.backoff_multiplier:.1f}x")
        
        # Success! Reset counters
        if response.status_code == 200:
            self.consecutive_errors = 0
            self.backoff_multiplier = max(self.backoff_multiplier * 0.9, 1.0)
        
        # Update referer for next request
        self.session.headers['Referer'] = url
        print(f"🔄 Updated referer to: {url}")
        
        return response
    
    def reset_state(self):
        """Reset all rate limiting state"""
        self.backoff_multiplier = 1.0
        self.consecutive_errors = 0
        self.circuit_breaker = {'failures': 0, 'last_failure': None, 'is_open': False}
        print("🔄 Scraper state reset")
    
    def get_status(self):
        """Get current scraper status"""
        return {
            "backoff_multiplier": self.backoff_multiplier,
            "consecutive_errors": self.consecutive_errors,
            "circuit_breaker_open": self.circuit_breaker['is_open'],
            "referer": self.session.headers.get('Referer', 'None')
        }