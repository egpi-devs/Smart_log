@echo off
title EGPI — Start All Servers
color 0A

echo.
echo  ============================================
echo   EGPI Management System — Starting Servers
echo  ============================================
echo.

echo  [1/3] Starting Production API on port 8000...
start "Production API :8000" cmd /k "cd /d "%~dp0Production\backend" && python manage.py runserver 0.0.0.0:8000"
timeout /t 2 /nobreak >nul

echo  [2/3] Starting QC API on port 8002...
start "QC API :8002" cmd /k "cd /d "%~dp0QC\backend" && python manage.py runserver 0.0.0.0:8002"
timeout /t 2 /nobreak >nul

echo  [3/3] Starting Frontend on port 8080...
start "Frontend :8080" cmd /k "cd /d "%~dp0Frontend" && python serve.py"
timeout /t 2 /nobreak >nul

echo.
echo  ============================================
echo   All servers started!
echo.
echo   Frontend  :  http://10.0.100.175:8080
echo   Prod API  :  http://10.0.100.175:8000/api
echo   QC API    :  http://10.0.100.175:8002/api
echo  ============================================
echo.
pause
