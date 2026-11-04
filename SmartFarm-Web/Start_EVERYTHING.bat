@echo off
echo ==========================================
echo    Starting SmartFarm Backend (Django)
echo ==========================================
start "Django Backend" cmd /c "cd /d "C:\Users\asrav\OneDrive\Pictures\Desktop\SmartFarmBackend" && venv\Scripts\python.exe manage.py runserver"

timeout /t 3 /nobreak > nul

echo ==========================================
echo    Starting SmartFarm Web App
echo ==========================================
start "Web App Server" cmd /c "cd /d "%~dp0" && python -m http.server 8080"

echo.
echo Servers are running! Opening browser...
start http://localhost:8080
