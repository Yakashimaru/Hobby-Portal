import json
from flask import Flask, request, jsonify
from flask_cors import CORS
import os, sys

from ..common.handle_exceptions import simple_exception, json_exception
from ..common.crud_database import get_database, post_database, put_database, delete_database


app = Flask(__name__)
CORS(app)

def get_table_name(route_path):
    if "/get" in route_path:
        return route_path.split("/get")[1]
    elif "/add" in route_path:
        return route_path.split("/add")[1]
    elif "/update" in route_path:
        return route_path.split("/update")[1]
    elif "/delete" in route_path:
        return route_path.split("/delete")[1]
    

@app.route("/getGames", methods=['GET'])
@app.route("/getMultigames", methods=['GET'])
@app.route("/getGames", methods=['GET'])
@app.route("/getVisualNovel", methods=['GET'])
@app.route("/getKpop", methods=['GET'])
@app.route("/getFigurine", methods=['GET'])
def get_data():
    try:
        table_name = get_table_name(request.path)
        return get_database(table_name)
    
    except Exception as e:
        return simple_exception(e)
    
    
@app.route("/addGames", methods=['POST'])
@app.route("/addMultigames", methods=['POST'])
@app.route("/addGames", methods=['POST'])
@app.route("/addVisualNovel", methods=['POST'])    
@app.route("/addKpop", methods=['POST'])    
@app.route("/addFigurine", methods=['POST'])
def addFigurine():
    if request.is_json:
        try:
            data = request.get_json()
            table_name = get_table_name(request.path)

            return post_database(table_name, data)

        except Exception as e:
            return simple_exception(e)
    else:
        print("here")
        print(request.get_data())
        return json_exception(str(request.get_data()))


@app.route("/updateGames", methods=['PUT'])
@app.route("/updateMultigames", methods=['PUT'])
@app.route("/updateGames", methods=['PUT'])
@app.route("/updateVisualNovel", methods=['PUT'])    
@app.route("/updateKpop", methods=['PUT'])    
@app.route("/updateFigurine", methods=['PUT'])
def updateFigurine():
    if request.is_json:
        try:
            data = request.get_json()
            table_name = get_table_name(request.path)

            return put_database(table_name, data)

        except Exception as e:
            return simple_exception(e)
    else:
        return json_exception(str(request.get_data()))

@app.route("/deleteGames", methods=['DELETE'])
@app.route("/deleteMultigames", methods=['DELETE'])
@app.route("/deleteGames", methods=['DELETE'])
@app.route("/deleteVisualNovel", methods=['DELETE'])   
@app.route("/deleteKpop", methods=['DELETE'])   
@app.route("/deleteFigurine", methods=['DELETE'])
def deleteFigurine():
    if request.is_json:
        try:
            data = request.get_json()
            table_name = get_table_name(request.path)

            return delete_database(table_name, data)
        
        except Exception as e:
            return simple_exception(e)
    else:
        return json_exception(str(request.get_data()))

if __name__ == '__main__':
    #app.run(host='0.0.0.0', port=5004, debug=True)
    app.run(port = 5004, debug=True)