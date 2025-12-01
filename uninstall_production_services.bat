@echo off
echo ========================================
echo Desinstalar Servicios de Produccion
echo ========================================
echo.

REM Verificar permisos de administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Este script debe ejecutarse como Administrador
    pause
    exit /b 1
)

echo ADVERTENCIA: Esto eliminara los servicios ReportesAPI y ReportesCaddy
echo.
set /p confirm="Estas seguro? (S/N): "
if /i not "%confirm%"=="S" (
    echo Operacion cancelada
    pause
    exit /b 0
)

echo.
echo Deteniendo servicios...
nssm.exe stop ReportesCaddy 2>nul
nssm.exe stop ReportesAPI 2>nul
timeout /t 2 /nobreak >nul

echo Desinstalando ReportesCaddy...
nssm.exe remove ReportesCaddy confirm

echo Desinstalando ReportesAPI...
nssm.exe remove ReportesAPI confirm

echo.
echo Servicios desinstalados correctamente
echo.
pause
