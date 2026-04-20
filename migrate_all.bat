@echo off
title EGPI — Run All Migrations
color 0B

echo.
echo  ============================================
echo   EGPI Management System — Database Migrations
echo  ============================================
echo.

echo  [1/2] PROCESSING PRODUCTION BACKEND...
cd /d "%~dp0Production\backend"

echo  - Running Django Migrations (Production)...
python manage.py makemigrations
python manage.py migrate

echo  - Running Custom Scripts (Production)...
if exist migrate_audit.py (
    echo    * Running migrate_audit.py...
    python migrate_audit.py
)
if exist migrate_audit_logs.py (
    echo    * Running migrate_audit_logs.py...
    python migrate_audit_logs.py
)
if exist migrate_machine_section.py (
    echo    * Running migrate_machine_section.py...
    python migrate_machine_section.py
)
if exist migrate_production.py (
    echo    * Running migrate_production.py...
    python migrate_production.py
)
if exist migrate_production_materials.py (
    echo    * Running migrate_production_materials.py...
    python migrate_production_materials.py
)
if exist migrate_production_products.py (
    echo    * Running migrate_production_products.py...
    python migrate_production_products.py
)

echo.
echo  [2/2] PROCESSING QC BACKEND...
cd /d "%~dp0QC\backend"

echo  - Running Django Migrations (QC)...
python manage.py makemigrations
python manage.py migrate

echo  - Running Custom Scripts (QC)...
if exist migrate_audit.py (
    echo    * Running migrate_audit.py...
    python migrate_audit.py
)
if exist migrate_status_columns.py (
    echo    * Running migrate_status_columns.py...
    python migrate_status_columns.py
)

echo.
echo  ============================================
echo   All migrations completed!
echo  ============================================
echo.
pause
