
@echo off
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

echo Installing service...
"%~dp0dist\service_wrapper.exe" install

echo.

echo Configuring service for auto-start...
sc config VNDailyScraper start= auto

echo.

echo All operations completed successfully!
echo Service installation complete!
echo To test service: net start VNDailyScraper
pause