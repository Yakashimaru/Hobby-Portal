### This module handles the connection to the PostgreSQL database using psycopg2.

import psycopg2
from dotenv import load_dotenv
import os

load_dotenv()

def connect_to_database():
    return psycopg2.connect(
        database = os.getenv('DATABASE_NAME'), 
        user = os.getenv('DATABASE_USER'), 
        host= os.getenv('DATABASE_HOST'),
        password = os.getenv('DATABASE_PASSWORD'),
        port = os.getenv('DATABASE_PORT')
    )



