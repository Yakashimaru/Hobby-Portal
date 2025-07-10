
@echo off

:: Check for admin rights
net session >nul 2>&1
if %errorLevel% == 0 (
    echo Administrative permissions confirmed.
) else (
    echo Requesting administrative privileges...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

echo Stopping existing service...
sc stop VNDailyScraper >nul 2>&1

echo Activating virtual environment...
call "%~dp0..\..\..\..\.venv\Scripts\activate.bat"

echo Cleaning previous build...
if exist "%~dp0build" rmdir /s /q "%~dp0build"
if exist "%~dp0dist" rmdir /s /q "%~dp0dist"

echo Building service...
cd /d "%~dp0"
pyinstaller "%~dp0service_wrapper.spec"

echo Build complete!
echo.

sc delete VNDailyScraper >nul 2>&1
timeout /t 3 /nobreak >nul

echo Installing service...
"%~dp0dist\service_wrapper.exe" install

echo.

echo Configuring service for auto-start...
sc config VNDailyScraper start= auto

echo.

sc start VNDailyScraper

echo All operations completed successfully!
echo Service installation complete!
@REM pause