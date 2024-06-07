REM @echo off

REM Activate virtual environment
cd /d "%~dp0.venv\Scripts"
call activate

REM run backend
cd /d "%~dp0"
start "Backend" cmd /k py -m Backend.apis.crud_apis

REM run scrapper
cd /d "%~dp0"
start "Backend" cmd /k py -m Backend.apis.vn_date

REM run frontend
cd /d "%~dp0Frontend\my-app"
start "Frontend" cmd /k npm start 

