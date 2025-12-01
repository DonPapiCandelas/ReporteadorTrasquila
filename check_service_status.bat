@echo off
echo ========================================
echo Estado del Servicio ReportesWeb
echo ========================================
echo.

cd /d "c:\ReportesWeb"

echo 1. Estado del servicio:
nssm.exe status ReportesWeb
echo.

echo 2. Procesos usando puerto 8000:
netstat -ano | findstr :8000
echo.

echo 3. Ultimos errores (service.err):
echo ----------------------------------------
type service.err | findstr /C:"ERROR" | more +1
echo.

echo 4. Ultimos logs (service.log):
echo ----------------------------------------
type service.log | more +1
echo.

echo ========================================
pause
