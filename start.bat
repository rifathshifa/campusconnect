@echo off
title CampusConnect Starter
echo ===================================================
echo             CampusConnect Services
echo ===================================================
echo.

echo [1/2] Launching Backend Flask Server...
start "CampusConnect Backend" /d "%~dp0backend" cmd /k "call venv\Scripts\activate && python run.py"

echo [2/2] Launching Frontend Vite Server...
start "CampusConnect Frontend" /d "%~dp0frontend" cmd /k "npm run dev"

echo.
echo ===================================================
echo Both services have been launched in separate windows.
echo This launcher window will automatically close in 5s.
echo ===================================================
timeout /t 5 >nul
