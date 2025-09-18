@echo off
echo ===========================================
echo COVID-19 Data Import from Local CSV Files
echo ===========================================
echo.

cd /d "%~dp0"

echo Building import tool...
dotnet build --configuration Release
if errorlevel 1 (
    echo.
    echo Build failed! Please check the errors above.
    pause
    exit /b 1
)

echo.
echo Running data import...
echo.

dotnet run --configuration Release

echo.
echo Import process completed.
pause