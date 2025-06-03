import os
import sys
from dotenv import load_dotenv

def load_environment():
    if len(sys.argv) > 1 and sys.argv[1] == 'test':
        env_file = 'Backend\.env.test'           
        result = load_dotenv(env_file)
        print(f"Using TEST database")

    else:
        result = load_dotenv('Backend\.env')
        print(f"Using DEFAULT database")

load_environment()