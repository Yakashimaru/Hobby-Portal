import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

try:
    # Import modules:
    from ..common.handle_exceptions import simple_exception, json_exception
    from ..common.scraping.scraping_utils import SmartScraper
    from ..common.scraping.game_data_parser import GameDataParser
except:
    from common.handle_exceptions import simple_exception, json_exception
    from common.scraping.scraping_utils import SmartScraper
    from common.scraping.game_data_parser import GameDataParser

load_dotenv('Backend\.env.sites')

app = Flask(__name__)
CORS(app)

# Single scraper instance that maintains state
scraper = SmartScraper()

# After request function to add CORS headers
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')  # Allows all origins
    response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')  # Specifies allowed methods
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')  # Specifies allowed headers
    return response

@app.route("/getVNDate", methods=['POST'])
def get_last_updated():
    if request.is_json:
        try:
            data = request.get_json()
            url = data['url']

            sleep_low = data.get('limiter_low', 3)
            sleep_high = data.get('limiter_high', 8)

            response = scraper.smart_get(url, sleep_low, sleep_high)
            
            # Check if the request was successful
            if response.status_code == 200:
                return GameDataParser.auto_detect_site_and_parse(url, response)
            else:
                return jsonify({
                    "code": response.status_code,
                    "message": f"HTTP Error: {response.status_code}",
                    "data": None
                }), response.status_code
                
        except Exception as e:
            return simple_exception(e)
    else:
        print(request.get_data())
        return json_exception(str(request.get_data()))

@app.route("/resetScraper", methods=['POST'])
def reset_scraper():
    """Reset scraper state"""
    scraper.reset_state()
    return jsonify({"message": "Scraper state reset"}), 200

@app.route("/getScraperStatus", methods=['GET'])
def get_scraper_status():
    """Get scraper status"""
    return jsonify(scraper.get_status()), 200

if __name__ == '__main__':
    #app.run(host='0.0.0.0', port=5005, debug=True)
    app.run(port = 5005, debug=True)

