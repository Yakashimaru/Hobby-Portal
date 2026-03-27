### This module handles the connection to the PostgreSQL database using psycopg2.

import psycopg2
import psycopg2.pool
from dotenv import load_dotenv
import os

load_dotenv()

_pool = psycopg2.pool.SimpleConnectionPool(
    1, 10,
    database = os.getenv('DATABASE_NAME'),
    user = os.getenv('DATABASE_USER'),
    host = os.getenv('DATABASE_HOST'),
    password = os.getenv('DATABASE_PASSWORD'),
    port = os.getenv('DATABASE_PORT')
)

def connect_to_database():
    return _pool.getconn()

def release_connection(conn):
    _pool.putconn(conn)



