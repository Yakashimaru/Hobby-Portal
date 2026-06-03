REM @echo off

REM Activate virtual environment
cd /d "%~dp0.venv\Scripts"
call activate

REM run backend
cd /d "%~dp0"
start /min "Backend-CRUD" cmd /k py -m Backend.apis.crud_apis

REM run scrapper
cd /d "%~dp0"
start /min "Backend-Scraping" cmd /k py -m Backend.apis.vn_date

REM run scrapper log
cd /d "%~dp0"
start /min "Backend-Scrapping Logger" cmd /k py -m Backend.apis.log_scrapper

REM build Frontend then run preview
cd /d "%~dp0Frontend"
call npm run build
start /min "Frontend" cmd /k "title Frontend & npm run preview"

timeout /t 3 /nobreak >nul
start http://localhost:4173/vn
