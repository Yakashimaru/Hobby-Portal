import os
import sys
from dotenv import load_dotenv

def load_environment():
    if len(sys.argv) > 1 and sys.argv[1] == 'test':
        env_file = os.path.join('Backend', '.env.test')          
        load_dotenv(env_file)
        try:
                print("""
┌─────────────────────────────────┐
│    HOBBY PORTAL - TEST MODE     │
└─────────────────────────────────┘  
                """)
        except UnicodeEncodeError:
             print("HOBBY PORTAL - TEST MODE")

    else:
        env_file = os.path.join('Backend', '.env')
        load_dotenv(env_file)
        try:
                print("""
┌─────────────────────────────────┐
│   HOBBY PORTAL - DEFAULT MODE   │
└─────────────────────────────────┘  
                """)
        except UnicodeEncodeError:
            print("HOBBY PORTAL - DEFAULT MODE")

load_environment()