import json
from flask import Flask, request, jsonify
from flask_cors import CORS
import os, sys

# Import modules:
try:
    from ..common.handle_exceptions import simple_exception, json_exception
    from ..common.database_functions import get_database, post_database, put_database, delete_database, get_database_inner_join
    from ..constants.table_constants import VALID_TABLES, VN_TABLE_ORDER, VN_SORTBY_ORDER
except:
    from common.handle_exceptions import simple_exception, json_exception
    from common.database_functions import get_database, post_database, put_database, delete_database, get_database_inner_join
    from constants.table_constants import VALID_TABLES, VN_TABLE_ORDER, VN_SORTBY_ORDER

app = Flask(__name__)
CORS(app)

#returns the table name from the route path
def get_table_name(route_path):
    route_table = None
    if "/get" in route_path:
        route_table = route_path.split("/get")[1]
    elif "/add" in route_path:
        route_table = route_path.split("/add")[1]
    elif "/update" in route_path:
        route_table = route_path.split("/update")[1]
    elif "/delete" in route_path:
        route_table = route_path.split("/delete")[1]

    # Convert to lowercase for case-insensitive comparison
    table_key = route_table.lower() if route_table else None
    
    # Check if the requested table is in our whitelist
    if table_key not in VALID_TABLES:
        raise ValueError(f"Invalid table name: {route_table}")
    
    # Return the validated table name from the whitelist
    return VALID_TABLES[table_key]
    
#GET request to get data from the database
@app.route("/getGames", methods=['GET'])
@app.route("/getMultigames", methods=['GET'])
@app.route("/getVisualNovel", methods=['GET'])
@app.route("/getKpop", methods=['GET'])
@app.route("/getFigurine", methods=['GET'])
def get_data():
    try:
        table_name = get_table_name(request.path)

        # For visual novel table
        if table_name == "visualnovel":
            return get_database_inner_join(
                table_name, 
                "uservisualnovel", 
                "visualnovel.id = uservisualnovel.id", 
                VN_TABLE_ORDER,
                VN_SORTBY_ORDER)
        
        # For other tables
        return get_database(table_name)
    
    except Exception as e:
        return simple_exception(e)


#POST request to add data to the database    
@app.route("/addGames", methods=['POST'])
@app.route("/addMultigames", methods=['POST'])
@app.route("/addVisualNovel", methods=['POST'])    
@app.route("/addUserVisualNovel", methods=['POST'])    
@app.route("/addKpop", methods=['POST'])    
@app.route("/addFigurine", methods=['POST'])
def add_data():
    if request.is_json:
        try:
            data = request.get_json()
            table_name = get_table_name(request.path)

            return post_database(table_name, data)

        except Exception as e:
            return simple_exception(e)
    else:
        print(request.get_data())
        return json_exception(str(request.get_data()))


#PUT request to update data in the database
@app.route("/updateGames", methods=['PUT'])
@app.route("/updateMultigames", methods=['PUT'])
@app.route("/updateVisualNovel", methods=['PUT'])   
@app.route("/updateUserVisualNovel", methods=['PUT'])    
@app.route("/updateKpop", methods=['PUT'])    
@app.route("/updateFigurine", methods=['PUT'])
def update_data():
    if request.is_json:
        try:
            data = request.get_json()
            table_name = get_table_name(request.path)
            
            # If the data has an id field, update by id
            if ("id" in data):
                return put_database(table_name, data, "id")
            else:
                return put_database(table_name, data, "game")

        except Exception as e:
            return simple_exception(e)
    else:
        return json_exception(str(request.get_data()))

#DELETE request to delete data from the database
@app.route("/deleteGames", methods=['DELETE'])
@app.route("/deleteMultigames", methods=['DELETE'])
@app.route("/deleteVisualNovel", methods=['DELETE'])   
@app.route("/deleteKpop", methods=['DELETE'])   
@app.route("/deleteFigurine", methods=['DELETE'])
def delete_data():
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
    app.run(host='0.0.0.0', port=5004, debug=True)