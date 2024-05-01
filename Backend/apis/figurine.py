import json
from flask import Flask, request, jsonify
from flask_cors import CORS
import os, sys

from ..common.handle_exceptions import simple_exception, json_exception
from ..common.crud_database import get_database, post_database, put_database, delete_database


app = Flask(__name__)
CORS(app)

table_name = "figurine"

@app.route("/getFigurine", methods=['GET'])
def getFigurine():
    try:
        return get_database(table_name)
    
    except Exception as e:
        return simple_exception(e)
    
    
    
@app.route("/addFigurine", methods=['POST'])
def addFigurine():
    if request.is_json:
        try:
            data = request.get_json()

            return post_database(table_name, data)

        except Exception as e:
            return simple_exception(e)
    else:
        print("here")
        print(request.get_data())
        return json_exception(str(request.get_data()))



@app.route("/updateFigurine", methods=['PUT'])
def updateFigurine():
    if request.is_json:
        try:
            data = request.get_json()

            return put_database(table_name, data)

        except Exception as e:
            return simple_exception(e)
    else:
        return json_exception(str(request.get_data()))


@app.route("/deleteFigurine", methods=['DELETE'])
def deleteFigurine():
    if request.is_json:
        try:
            data = request.get_json()

            return delete_database(table_name, data)
        
        except Exception as e:
            return simple_exception(e)
    else:
        return json_exception(str(request.get_data()))

if __name__ == '__main__':
    #app.run(host='0.0.0.0', port=5004, debug=True)
    app.run(port = 5004, debug=True)