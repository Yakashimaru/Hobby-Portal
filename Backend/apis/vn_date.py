import json
from flask import Flask, request, jsonify
from flask_cors import CORS

from ..common.handle_exceptions import simple_exception, json_exception

#for scrapping
import requests
from bs4 import BeautifulSoup
import time
import random
from ..settings.user_agents import USER_AGENTS

app = Flask(__name__)
CORS(app)

@app.route("/getVNDate", methods=['POST'])
def get_last_updated():
    headers = {
        'User-Agent': random.choice(USER_AGENTS)
    }

    if request.is_json:
        try:
            # Sleep for a random interval to avoid rate limiting
            time.sleep(random.uniform(1, 5))

            data = request.get_json()
            url = data['url']
            # Send a GET request to the URL
            response = requests.get(url)
            
            # Check if the request was successful
            if response.status_code == 200:
                # Parse the HTML content of the page
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # Find the span with the specific class
                last_updated_span = soup.find('span', class_='meta-item last-updated')
                
                # Check if the span is found and return its content
                if last_updated_span:
                    return jsonify({
                        "code": 200,
                        "message": "Success",
                        "data": last_updated_span.get_text(strip=True)
                    }), 200
                
        except requests.exceptions.RequestException as e:
            return simple_exception(e)
    else:
        print(request.get_data())
        return json_exception(str(request.get_data()))

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5005, debug=True)
    #app.run(port = 5005, debug=True)
