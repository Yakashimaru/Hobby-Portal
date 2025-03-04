import json
from flask import Flask, request, jsonify
from flask_cors import CORS

# Libraries for scrapping
import requests
from bs4 import BeautifulSoup

# Libraries for date parsing
from datetime import datetime
import time
import random
import re

try:
    # Import modules:
    from ..common.handle_exceptions import simple_exception, json_exception
    # User agents
    from ..settings.user_agents import USER_AGENTS
except:
    from common.handle_exceptions import simple_exception, json_exception
    from settings.user_agents import USER_AGENTS

app = Flask(__name__)
CORS(app)

# After request function to add CORS headers
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')  # Allows all origins
    response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')  # Specifies allowed methods
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')  # Specifies allowed headers
    return response

@app.route("/getVNDate", methods=['POST'])
def get_last_updated():
    headers = {
        'User-Agent': random.choice(USER_AGENTS)
    }

    if request.is_json:
        try:
            data = request.get_json()
            url = data['url']

            try:
                sleep_low = data['limiter_low']
                sleep_high = data['limiter_high']
            except:
                sleep_low = 1
                sleep_high = 5

            # Sleep for a random interval to avoid rate limiting
            time.sleep(random.uniform(sleep_low, sleep_high))

            # Send a GET request to the URL
            response = requests.get(url)
            
            # Check if the request was successful
            if response.status_code == 200:
                # Parse the HTML content of the page
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # Find the span with the specific class
                last_updated_span = soup.find('time', class_='gp-post-meta gp-meta-date')

                # Find the h1 with the specific class
                post_title_h1 = soup.find('h1', class_='gp-entry-title gp-single-title')

                # Check if the span and h1 are found and return their content
                if last_updated_span and post_title_h1:
                    last_updated = last_updated_span.get_text(strip=True)
                    post_title = post_title_h1.get_text(strip=True)

                    # Convert `last_updated` to "(YYYY-MM-DD)" format
                    try:
                        last_updated_date = datetime.strptime(last_updated, "%B %d, %Y")
                        last_updated = last_updated_date.strftime("%Y-%m-%d")
                    except ValueError:
                        # Handle cases where the date format is unexpected
                        last_updated = None


                    # Use regex to parse the post title
                    match = re.match(r'^(.*?) \[(.*?)\] \[(.*?)\]$', post_title)
                    if match:
                        game_name = match.group(1)
                        ver_number = match.group(2)
                        developer = match.group(3)
                    else:
                        game_name = None
                        ver_number = None
                        developer = None

                    # Return if both data are found
                    return jsonify({
                        "code": 200,
                        "message": "Success",
                        "data": {
                            "last_updated": last_updated,
                            "game": game_name,
                            "version": ver_number,
                            "developer": developer
                        }
                    }), 200
                # If only the last updated date is found, return the last updated date
                elif last_updated_span:
                    return jsonify({
                        "code": 200,
                        "message": "Success",
                        "data": {
                            "last_updated": last_updated_span.get_text(strip=True),
                            "game": None,
                            "version": None,
                            "developer": None
                        }
                    }), 200
                else:
                    return jsonify({
                        "code": 200,
                        "message": "No entry found",
                        "data": {
                            "last_updated": None,
                            "game": None,
                            "version": None,
                            "developer": None
                        }
                    }), 200
                
        except requests.exceptions.RequestException as e:
            return simple_exception(e)
    else:
        print(request.get_data())
        return json_exception(str(request.get_data()))

if __name__ == '__main__':
    #app.run(host='0.0.0.0', port=5005, debug=True)
    app.run(port = 5005, debug=True)
