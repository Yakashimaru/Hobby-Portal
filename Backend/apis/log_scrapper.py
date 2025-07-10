import json
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from datetime import datetime
from pathlib import Path

app = Flask(__name__)
CORS(app)

@app.route("/logScrapper", methods=['POST'])
def log_scraping_success():
    try:
        data = request.get_json()
        # Create logs directory if it doesn't exist
        log_dir = Path("Backend/logs")
        log_dir.mkdir(exist_ok=True)
        
        log_file_path = log_dir / "scraping_success_log.json"
        
        # Handle batch data
        if 'batchData' in data:
            # This is a batch update - overwrite the entire file
            log_data = {}
            
            for game_name, source in data['batchData'].items():
                log_data[game_name] = {
                    "source": source,
                    "last_updated": data['timestamp']
                }
        else:
            # Individual update (for single game updates)
            if os.path.exists(log_file_path):
                with open(log_file_path, 'r', encoding='utf-8') as f:
                    log_data = json.load(f)
            else:
                log_data = {}
            
            # Add single game
            for key, value in data.items():
                if key != 'timestamp':
                    log_data[key] = {
                        "source": value,
                        "last_updated": data['timestamp']
                    }
        
        # Save back to file
        with open(log_file_path, 'w', encoding='utf-8') as f:
            json.dump(log_data, f, indent=2, ensure_ascii=False)
        
        return jsonify({"message": "Success logged"}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5006, debug=True)