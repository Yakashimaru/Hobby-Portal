REM @echo off

REM Activate virtual environment
cd /d "%~dp0.venv\Scripts"
call activate

REM run backend
cd /d "%~dp0Backend"
start cmd /k py figurine.py

REM run frontend
cd /d "%~dp0Frontend\my-app"
start cmd /k npm start 

