@echo off
echo ========================================
echo Deteniendo Servicios de Produccion
echo ========================================
echo.

REM Verificar permisos de administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Este script debe ejecutarse como Administrador
    pause
    exit /b 1
)

echo Deteniendo ReportesCaddy...
nssm.exe stop ReportesCaddy
timeout /t 2 /nobreak >nul

echo Deteniendo ReportesAPI...
nssm.exe stop ReportesAPI
timeout /t 2 /nobreak >nul

echo.
echo Estado de los servicios:
echo ------------------------
nssm.exe status ReportesAPI
nssm.exe status ReportesCaddy
echo.
pause
