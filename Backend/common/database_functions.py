# Functions to interact with the database

from flask import Flask, request, jsonify

try:
    from .database_connection import connect_to_database, release_connection
    from ..common.handle_exceptions import internal_error_exception
    from ..common.data_functions import convert_keys_values_to_string
except:
    from database_connection import connect_to_database, release_connection
    from common.handle_exceptions import internal_error_exception
    from common.data_functions import convert_keys_values_to_string

##### Output SQL as dictionary #####
def dict_result(columns, rows):
    return [dict(zip(columns, row)) for row in rows]

##### GET function #####
def get_database(table_name, columns_order = None, sort_by_clause = None):
    conn = connect_to_database()
    try:
        cur = conn.cursor()

        columns_order = columns_order.strip() if columns_order else "*"

        sql_query = f"SELECT {columns_order} FROM {table_name} {sort_by_clause}"
        cur.execute(sql_query)

        rows = cur.fetchall()

        columns = [desc[0] for desc in cur.description]

        conn.commit()
        cur.close()

        return dict_result(columns, rows)

    except Exception as e:
        return internal_error_exception(e)
    finally:
        release_connection(conn)


##### GET function with INNER JOIN #####
def get_database_inner_join(table_name1, table_name2, join_clause ,order = "*", sort_by_clause = ""):
    conn = connect_to_database()
    try:
        cur = conn.cursor()

        sql_query = f"SELECT {order} FROM {table_name1} INNER JOIN {table_name2} ON {join_clause} {sort_by_clause}"
        cur.execute(sql_query)

        rows = cur.fetchall()

        columns = [desc[0] for desc in cur.description]

        conn.commit()
        cur.close()

        return dict_result(columns, rows)

    except Exception as e:
        return internal_error_exception(e)
    finally:
        release_connection(conn)

##### POST function #####
def post_database(table_name, data):
    conn = connect_to_database()
    try:
        cur = conn.cursor()

        column_names, column_values = convert_keys_values_to_string(data.keys(), data.values())

        # Split the comma-separated string of values into a list
        column_values_list = [v.strip() for v in column_values.split(',')]

        # Replace empty strings or "null" values with None
        for i, value in enumerate(column_values_list):
            if value.strip() == "" or value.strip().lower() == "null":
                column_values_list[i] = None

        sql_query = f"INSERT INTO {table_name} ({column_names}) VALUES ({', '.join(['%s'] * len(column_values_list))}) RETURNING *"

        cur.execute(sql_query, column_values_list)

        row = cur.fetchone()
        columns = [desc[0] for desc in cur.description]

        conn.commit()
        cur.close()

        return jsonify(dict(zip(columns, row))), 200

    except Exception as e:
        return internal_error_exception(e)
    finally:
        release_connection(conn)

##### PUT function #####
def put_database(table_name, data, condition_column):
    conn = connect_to_database()
    try:
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

        return jsonify({
            "code": 201,
            "message": "Data updated successfully"
        }), 201

    except Exception as e:
        return internal_error_exception(e)
    finally:
        release_connection(conn)

##### DELETE function #####
def delete_database(table_name, data):
    conn = connect_to_database()
    try:
        cur = conn.cursor()

        # Build the WHERE clause dynamically
        where_conditions = []
        where_values = []

        for key, value in data.items():
            where_conditions.append(f"{key} = %s")
            where_values.append(value)

        where_clause = ' AND '.join(where_conditions)

        # Retrieve the data to be deleted (for logging/confirmation)
        select_query = f"SELECT * FROM {table_name} WHERE {where_clause}"
        cur.execute(select_query, where_values)
        deleted_data = cur.fetchone()

        # Execute the delete query
        sql_query = f"DELETE FROM {table_name} WHERE {where_clause}"
        cur.execute(sql_query, where_values)

        # Get number of affected rows
        rows_affected = cur.rowcount

        conn.commit()
        cur.close()

        # Determine message based on results
        if rows_affected == 0:
            message = "No data found to delete"
        else:
            message = f"Successfully deleted {rows_affected} record(s)"

        return jsonify({
            "code": 200,
            "message": message,
            "deleted_data": deleted_data,
            "rows_affected": rows_affected
        }), 200

    except Exception as e:
        return internal_error_exception(e)
    finally:
        release_connection(conn)
