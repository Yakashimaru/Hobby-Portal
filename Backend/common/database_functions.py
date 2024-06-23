# Functions to interact with the database

from flask import Flask, request, jsonify

from ..settings.database_connection import connect_to_database
from ..common.handle_exceptions import internal_error_exception
from ..common.data_functions import convert_keys_values_to_string

##### GET function #####
def get_database(table_name):
    try:
        conn = connect_to_database()
        cur = conn.cursor()
        
        sql_query = f"SELECT * FROM {table_name}"
        cur.execute(sql_query)

        rows = cur.fetchall()

        columns = [desc[0] for desc in cur.description]

        conn.commit()
        cur.close()
        conn.close()

        result = {'columns': columns, 'rows': rows}

        return jsonify(result)

    except Exception as e:
        return internal_error_exception(e)


##### GET function with INNER JOIN #####
def get_database_inner_join(table_name1, table_name2, join_clause ,order = "*", sort_by_clause = ""):
    try:
        conn = connect_to_database()
        cur = conn.cursor()
        
        sql_query = f"SELECT {order} FROM {table_name1} INNER JOIN {table_name2} ON {join_clause} {sort_by_clause}"
        cur.execute(sql_query)

        rows = cur.fetchall()

        columns = [desc[0] for desc in cur.description]

        conn.commit()
        cur.close()
        conn.close()

        result = {'columns': columns, 'rows': rows}

        return jsonify(result)

    except Exception as e:
        return internal_error_exception(e)
    
##### POST function #####
def post_database(table_name, data):
    try:
        conn = connect_to_database()
        cur = conn.cursor()

        #column_names, column_values = get_keys_and_values(data)

        column_names, column_values = convert_keys_values_to_string(data.keys(), data.values())

        # Split the comma-separated string of values into a list
        column_values_list = [v.strip() for v in column_values.split(',')]

        # Replace empty strings or "null" values with None
        for i, value in enumerate(column_values_list):
            if value.strip() == "" or value.strip().lower() == "null":
                column_values_list[i] = None

        # Construct the SQL query with placeholders for values
        sql_query = f"INSERT INTO {table_name} ({column_names}) VALUES ({', '.join(['%s'] * len(column_values_list))})"

        # Execute the query with column values as parameters
        cur.execute(sql_query, column_values_list)

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({
            "code": 200,
            "message": "Data inserted successfully"
        }), 200

    except Exception as e:
        return internal_error_exception(e)

##### PUT function #####
def put_database(table_name, data, condition_column):
    try:
        conn = connect_to_database()
        cur = conn.cursor()
        
        # Build the SET part of the query dynamically
        set_clause = ', '.join([f"{key} = %s" for key in data.keys() if key != condition_column])
        condition_value = data[condition_column]
        del data[condition_column]

        # Create the SQL query
        sql_query = f"UPDATE {table_name} SET {set_clause} WHERE {condition_column} = %s"
        
        # Execute the SQL query
        cur.execute(sql_query, (*data.values(), condition_value))

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({
            "code": 201,
            "message": "Data updated successfully"
        }), 201
    
    except Exception as e:
        return internal_error_exception(e)

##### DELETE function #####
def delete_database(table_name, data):
    try:
        conn = connect_to_database()
        cur = conn.cursor()

        where_clause, where_values = get_keys_and_values(data)

        # Retrieve the data to be deleted
        select_query = f"SELECT * FROM {table_name} WHERE {where_clause} = %s"
        cur.execute(select_query, (where_values,))
        deleted_data = cur.fetchone()

        #Execute the delete query
        sql_query = f"DELETE FROM {table_name} WHERE {where_clause} = %s"
        cur.execute(sql_query, (where_values,))

        #cur.execute("DELETE FROM datacamp_courses WHERE course_name = 'Introduction to SQL'")

        conn.commit()
        cur.close()
        conn.close()

        message = "Successfully deleted"
        if deleted_data is None:
            message = "No data found to delete"

        
        return jsonify({
            "code": 200,
            "message": message,
            "data": deleted_data
        }), 200
    
    except Exception as e:
        return internal_error_exception(e)
