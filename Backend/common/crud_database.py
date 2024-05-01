from flask import Flask, request, jsonify

from ..settings.database_connection import connect_to_database
from ..common.handle_exceptions import internal_error_exception

def get_keys_and_values(data):
    keys = ", ".join(map(str, data.keys()))
    values = ", ".join(map(str, data.values()))
    return keys, values

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

        result = {'columns': columns, 'rows': rows}

        return jsonify(result)

    except Exception as e:
        return internal_error_exception(e)
    

def post_database(table_name, data):
    try:
        conn = connect_to_database()
        cur = conn.cursor()

        column_names, column_values = get_keys_and_values(data)

        # Construct the SQL query with placeholders for values
        sql_query = f"INSERT INTO {table_name} ({column_names}) VALUES ({', '.join(['%s'] * len(column_values.split(',')))})"

        # Split column values string into individual values
        values = [v.strip() for v in column_values.split(',')]

        # Execute the query with column values as parameters
        cur.execute(sql_query, values)

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({
            "code": 200,
            "message": "Data inserted successfully"
        }), 200

    except Exception as e:
        return internal_error_exception(e)


def put_database(table_name, data):
    try:
        conn = connect_to_database()
        cur = conn.cursor()
        
        # sql_query = f"UPDATE {table_name} SET ({update_query}) WHERE ({', '.join(['%s'] * len(column_values.split(',')))})"
        # cur.execute(sql_query, (table_name, update_query, where_clause))
        #cur.execute("UPDATE datacamp_courses SET course_instructor = 'Izzy Weber' WHERE course_name = 'Introduction to SQL'")

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({
            "code": 200,
            "message": "Data updated successfully"
        }), 200
    
    except Exception as e:
        return internal_error_exception(e)


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
