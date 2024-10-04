REM @echo off

REM Activate virtual environment
cd /d "%~dp0"

REM Run docker compose
start cmd /k "docker-compose up"

REM Wait a few seconds to allow services to start
timeout /t 5 /nobreak >nul

REM Open the URL in Chrome
start chrome http://localhost
