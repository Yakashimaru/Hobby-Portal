import os
import sys
from dotenv import load_dotenv

def load_environment():
    if len(sys.argv) > 1 and sys.argv[1] == 'test':
        env_file = 'Backend\.env.test'           
        load_dotenv(env_file)
        # print(f"Using TEST database")
        print("""
┌─────────────────────────────────┐
│    HOBBY PORTAL - TEST MODE     │
└─────────────────────────────────┘  
        """)

    else:
        load_dotenv('Backend\.env')
        print("""
┌─────────────────────────────────┐
│   HOBBY PORTAL - DEFAULT MODE   │
└─────────────────────────────────┘  
        """)

load_environment()