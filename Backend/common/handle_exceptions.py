# This file contains functions to handle exceptions in the application

import sys, os
from flask import jsonify

#Unable to connect to database
def internal_error_exception(exception):
    exc_type, exc_obj, exc_tb = sys.exc_info()
    fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
    ex_str = str(exception) + " at " + str(exc_type) + ": " + fname + ": line " + str(exc_tb.tb_lineno)
    print(ex_str)

    return jsonify({
        "code": 500,
        "message": "Internal error: " + ex_str
    }), 500

#Invalid JSON input
def json_exception(data):
    return jsonify({
        "code": 400,
        "message": "Invalid JSON input: " + data
    }), 400

#Simple exception
def simple_exception(e):
    return jsonify({
        "code": 500,
        "message": str(e)
    }), 500