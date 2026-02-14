@echo off
REM Export All Data Script for Windows
REM This script exports all person data from the Django application to JSON

echo 🚀 Starting data export...
echo ==================================

REM Default output file with timestamp
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
set "timestamp=%YYYY%%MM%%DD%_%HH%%Min%%Sec%"

set "OUTPUT_FILE=exports/fullz_export_%timestamp%.json"

REM Create exports directory if it doesn't exist
if not exist "exports" mkdir exports

echo Running with docker-compose...
docker-compose exec backend python manage.py export_all_data --output "%OUTPUT_FILE%" --pretty

echo ==================================
echo ✅ Export completed!
echo 📁 File saved as: %OUTPUT_FILE%
pause