import json
from flask import Flask, request, jsonify
from flask_cors import CORS
import os, sys

# from invokes import invoke_http

from settings.databaseConnection import conn

app = Flask(__name__)
CORS(app)

@app.route("/getFigurine", methods=['GET'])
def getFigurine():
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM figurine")
        rows = cur.fetchall()
        conn.commit()
        cur.close()
        return jsonify(rows)

    except Exception as e:
        # Unexpected error in code
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        ex_str = str(e) + " at " + str(exc_type) + ": " + fname + ": line " + str(exc_tb.tb_lineno)
        print(ex_str)

        return jsonify({
            "code": 500,
            "message": "Internal error: " + ex_str
        }), 500
    

    
@app.route("/addFigurine", methods=['POST'])
def addFigurine():
    if request.is_json:
        try:
            cur = conn.cursor()

            cur.execute("INSERT INTO datacamp_courses(course_name, course_instructor, topic) VALUES('Introduction to SQL','Izzy Weber','Julia')")

            conn.commit()
            cur.close()
            conn.close()

        except Exception as e:
            # Unexpected error in code
            exc_type, exc_obj, exc_tb = sys.exc_info()
            fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
            ex_str = str(e) + " at " + str(exc_type) + ": " + fname + ": line " + str(exc_tb.tb_lineno)
            print(ex_str)

            return jsonify({
                "code": 500,
                "message": "Internal error: " + ex_str
            }), 500
    else:
        return jsonify({
        "code": 400,
        "message": "Invalid JSON input: " + str(request.get_data())
    }), 400



@app.route("/updateFigurine", methods=['POST'])
def updateFigurine():
    if request.is_json:
        try:
            cur = conn.cursor()

            cur.execute("UPDATE datacamp_courses SET course_instructor = 'Izzy Weber' WHERE course_name = 'Introduction to SQL'")

            conn.commit()
            cur.close()
            conn.close()
        except Exception as e:
            # Unexpected error in code
            exc_type, exc_obj, exc_tb = sys.exc_info()
            fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
            ex_str = str(e) + " at " + str(exc_type) + ": " + fname + ": line " + str(exc_tb.tb_lineno)
            print(ex_str)

            return jsonify({
                "code": 500,
                "message": "Internal error: " + ex_str
            }), 500
    else:
        return jsonify({
        "code": 400,
        "message": "Invalid JSON input: " + str(request.get_data())
    }), 400



@app.route("/deleteFigurine", methods=['POST'])
def deleteFigurine():
    if request.is_json:
        try:
            cur = conn.cursor()

            cur.execute("DELETE FROM datacamp_courses WHERE course_name = 'Introduction to SQL'")

            conn.commit()
            cur.close()
            conn.close()
        except Exception as e:
                    # Unexpected error in code
                    exc_type, exc_obj, exc_tb = sys.exc_info()
                    fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
                    ex_str = str(e) + " at " + str(exc_type) + ": " + fname + ": line " + str(exc_tb.tb_lineno)
                    print(ex_str)

                    return jsonify({
                        "code": 500,
                        "message": "Internal error: " + ex_str
                    }), 500
    else:
        return jsonify({
        "code": 400,
        "message": "Invalid JSON input: " + str(request.get_data())
    }), 400


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5004, debug=True)
