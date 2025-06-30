# service_wrapper.spec
# -*- mode: python ; coding: utf-8 -*-

import sys
import os
from pathlib import Path

# Get project root 
current_dir = os.path.dirname(os.path.abspath(__name__))
project_root = Path(current_dir).parent.parent.parent.parent

block_cipher = None

a = Analysis(
    ['../service_wrapper.py'],
    pathex=[
        str(project_root),
        str(project_root / 'Backend'),
        str(project_root / 'Backend' / 'common'),
        str(project_root / 'Backend' / 'scrapers'),
    ],
    binaries=[
        # Add pywin32 binaries manually if needed
    ],
    datas=[
        # Include entire Backend directory
        (str(project_root / 'Backend'), 'Backend'),
    ],
    hiddenimports=[
        # Windows Service essentials - explicit imports
        'servicemanager',
        'win32serviceutil', 
        'win32service',
        'win32event',
        'win32api',
        'win32timezone',
        'pywintypes',
        'pythoncom',
        'win32con',  # Add this
        'win32file',  # Add this
        'winerror',  # Add this
        
        # Application modules
        'daily_scraper',
        'daily_scraper_orchestrator',
        'database_connection',  # This was missing!
        
        # Common modules - use correct paths
        'common.database_functions',
        'common.database_connection',  # Add this too
        'common.handle_exceptions',
        'common.logging_config',
        'common.data_functions',  # Also needed by database_functions
        'scrapers.vn_parsers.game_data_parser',  # This is the correct one
                
        # Standard libraries that might be missed
        'sqlite3',
        'logging',
        'threading',
        'pathlib',
        'datetime',
        'time',
        'random',
        'os',
        'sys',
        
        # Third party dependencies
        'requests',
        'bs4',  # Correct import name for beautifulsoup4
        'lxml',
        'dotenv',
        'psycopg2',
        
        # Remove Flask since we're not using CRUD API
        # 'flask',
        # 'flask_cors',
        # 'werkzeug',
        # 'jinja2',
        # 'markupsafe',
        # 'itsdangerous',
        # 'click',
        
        # Don't need CRUD API module
        # 'apis.crud_apis',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        'build',
        'dist', 
        '__pycache__',
        '*.pyc',
        '*.pyo'
    ],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

# Add .env.sites manually if it exists
env_sites_path = project_root / '.env.sites'
if env_sites_path.exists():
    a.datas.append(('.env.sites', str(env_sites_path), 'DATA'))

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='service_wrapper',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)