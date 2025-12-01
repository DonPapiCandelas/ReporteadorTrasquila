@echo off
echo ========================================
echo Limpiando Servicio Antiguo ReportesWeb
echo ========================================
echo.

REM Verificar permisos de administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Este script debe ejecutarse como Administrador
    echo Click derecho y selecciona "Ejecutar como administrador"
    pause
    exit /b 1
)

cd /d "c:\ReportesWeb"

echo Paso 1: Deteniendo servicio ReportesWeb...
nssm.exe stop ReportesWeb 2>nul
timeout /t 2 /nobreak >nul

echo Paso 2: Matando procesos en puerto 8000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000') do (
    echo   - Deteniendo proceso PID %%a
    taskkill /F /PID %%a 2>nul
)
timeout /t 1 /nobreak >nul

echo Paso 3: Desinstalando servicio ReportesWeb...
nssm.exe remove ReportesWeb confirm 2>nul
timeout /t 1 /nobreak >nul

echo Paso 4: Verificando limpieza...
netstat -ano | findstr :8000
if %errorLevel% equ 0 (
    echo ADVERTENCIA: Todavia hay procesos en el puerto 8000
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000') do (
        taskkill /F /PID %%a 2>nul
    )
) else (
    echo   - Puerto 8000 liberado correctamente
)

echo.
echo ========================================
echo Limpieza completada!
echo ========================================
echo.
echo El servicio antiguo ha sido eliminado.
echo Ahora puedes instalar los nuevos servicios.
echo.
pause
