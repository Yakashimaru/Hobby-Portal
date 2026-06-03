import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

try:
    from ..common.handle_exceptions import simple_exception, json_exception
    from ..common.scraping.scraping_utils import SmartScraper
    from ..scrapers.vn_parsers.game_data_parser import GameDataParser
    from ..scrapers.vn_parsers.banner_helper import download_banner
except:
    from common.handle_exceptions import simple_exception, json_exception
    from common.scraping.scraping_utils import SmartScraper
    from Backend.scrapers.vn_parsers.game_data_parser import GameDataParser
    from Backend.scrapers.vn_parsers.banner_helper import download_banner

env_sites_file = os.path.join('Backend', '.env.sites')
load_dotenv(env_sites_file)

app = Flask(__name__)
CORS(app)

# Single scraper instance that maintains state
scraper = SmartScraper()

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
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

            if response.status_code == 200:
                return GameDataParser.auto_detect_site_and_parse(url, response)
            else:
                return jsonify({
                    "code": response.status_code,
                    "message": f"HTTP Error: {response.status_code}",
                    "data": None
                }), response.status_code

        except Exception as e:
            print(f"Error processing request: {e} For game URL: {url}")
            return simple_exception(e)
    else:
        print(request.get_data())
        return json_exception(str(request.get_data()))

@app.route("/downloadBanner", methods=['POST'])
def download_banner_route():
    if not request.is_json:
        return jsonify({"error": "Expected JSON"}), 400

    try:
        data = request.get_json()
        banner_url = data.get('banner_url')
        game_name = data.get('game_name')

        if not banner_url or not game_name:
            return jsonify({"error": "banner_url and game_name are required"}), 400

        result = download_banner(banner_url, game_name)

        return jsonify({"success": True, **result}), 200

    except Exception as e:
        print(f"Banner download error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/resetScraper", methods=['POST'])
def reset_scraper():
    scraper.reset_state()
    return jsonify({"message": "Scraper state reset"}), 200

@app.route("/getScraperStatus", methods=['GET'])
def get_scraper_status():
    return jsonify(scraper.get_status()), 200

if __name__ == '__main__':
    app.run(port=5005, debug=True)
