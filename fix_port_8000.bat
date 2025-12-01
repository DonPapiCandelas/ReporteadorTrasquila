@echo off
echo ========================================
echo REPARACION DE EMERGENCIA - Puerto 8000
echo ========================================
echo.

REM Verificar permisos de administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Este script debe ejecutarse como Administrador
    pause
    exit /b 1
)

cd /d "c:\ReportesWeb"

echo Paso 1: Deteniendo servicio ReportesAPI...
.\nssm.exe stop ReportesAPI 2>nul
timeout /t 2 /nobreak >nul

echo.
echo Paso 2: Matando TODOS los procesos en puerto 8000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000') do (
    echo   - Matando proceso PID %%a
    taskkill /F /PID %%a 2>nul
)
timeout /t 2 /nobreak >nul

echo.
echo Paso 3: Verificando que el puerto este libre...
netstat -ano | findstr :8000
if %errorLevel% equ 0 (
    echo ADVERTENCIA: Todavia hay procesos, intentando de nuevo...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000') do (
        taskkill /F /PID %%a 2>nul
    )
    timeout /t 2 /nobreak >nul
) else (
    echo   [OK] Puerto 8000 liberado
)

echo.
echo Paso 4: Iniciando servicio ReportesAPI...
.\nssm.exe start ReportesAPI
timeout /t 3 /nobreak >nul

echo.
echo Paso 5: Verificando estado...
.\nssm.exe status ReportesAPI

echo.
echo Verificando puerto 8000...
netstat -ano | findstr :8000

echo.
echo ========================================
echo Reparacion completada!
echo ========================================
echo.
echo Si el servicio muestra "SERVICE_RUNNING" y hay UN SOLO proceso en puerto 8000, todo esta bien.
echo Intenta iniciar sesion nuevamente en: http://localhost:3000/
echo.
pause
