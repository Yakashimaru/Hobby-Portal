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

REM run frontend2
cd /d "%~dp0Frontend2"
start /min "Frontend2" cmd /k npm run dev

start http://localhost:5173/vn