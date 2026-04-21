@echo off
title EGPI — Start All Servers
color 0A

echo.
echo  ============================================
echo   EGPI Management System — Starting Servers
echo  ============================================
echo.

echo  [1/3] Starting Portal on port 8080...
start "Portal :4000" cmd /k "python serve.py"
timeout /t 2 /nobreak >nul

echo  [2/3] Starting QC System on port 8001...
start "QC System :4001" cmd /k "cd /d "%~dp0QC\backend" && python manage.py runserver 0.0.0.0:8001"
timeout /t 2 /nobreak >nul

echo  [3/3] Starting Production System on port 8002...
start "Production System :4002" cmd /k "cd /d "%~dp0Production\backend" && python manage.py runserver 0.0.0.0:8002"
timeout /t 2 /nobreak >nul

echo.
echo  ============================================
echo   All systems started!
echo.
echo   Portal      :  http://localhost:8080
echo   QC System   :  http://localhost:8001
echo   Prod System :  http://localhost:8002
echo  ============================================
echo.
pause
