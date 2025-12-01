@echo off
echo ========================================
echo Iniciando Servicios de Produccion
echo ========================================
echo.

REM Verificar permisos de administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Este script debe ejecutarse como Administrador
    pause
    exit /b 1
)

echo Iniciando ReportesAPI...
nssm.exe start ReportesAPI
timeout /t 2 /nobreak >nul

echo Iniciando ReportesCaddy...
nssm.exe start ReportesCaddy
timeout /t 2 /nobreak >nul

echo.
echo Estado de los servicios:
echo ------------------------
nssm.exe status ReportesAPI
nssm.exe status ReportesCaddy
echo.
pause
