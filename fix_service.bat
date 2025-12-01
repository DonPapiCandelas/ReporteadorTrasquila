@echo off
echo ========================================
echo Solucionando Servicio ReportesWeb
echo ========================================
echo.

REM Verificar permisos de administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Este script debe ejecutarse como Administrador
    echo Click derecho en el archivo y selecciona "Ejecutar como administrador"
    pause
    exit /b 1
)

cd /d "c:\ReportesWeb"

echo Paso 1: Deteniendo servicio ReportesWeb...
nssm.exe stop ReportesWeb
timeout /t 3 /nobreak >nul

echo Paso 2: Buscando y deteniendo procesos Python en puerto 8000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000') do (
    echo Deteniendo proceso %%a
    taskkill /F /PID %%a 2>nul
)
timeout /t 2 /nobreak >nul

echo Paso 3: Desinstalando servicio actual...
nssm.exe remove ReportesWeb confirm
timeout /t 2 /nobreak >nul

echo Paso 4: Verificando que el puerto 8000 esté libre...
netstat -ano | findstr :8000
if %errorLevel% equ 0 (
    echo ADVERTENCIA: El puerto 8000 todavía está en uso
    echo Intentando liberar procesos restantes...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000') do (
        taskkill /F /PID %%a 2>nul
    )
    timeout /t 2 /nobreak >nul
)

echo Paso 5: Instalando servicio limpio...
nssm.exe install ReportesWeb "c:\ReportesWeb\run_service.bat"
nssm.exe set ReportesWeb AppDirectory "c:\ReportesWeb"
nssm.exe set ReportesWeb Description "Reportes Web Service - Backend + Frontend"
nssm.exe set ReportesWeb Start SERVICE_AUTO_START
nssm.exe set ReportesWeb AppStdout "c:\ReportesWeb\service.log"
nssm.exe set ReportesWeb AppStderr "c:\ReportesWeb\service.err"

echo Paso 6: Limpiando logs antiguos...
echo. > service.log
echo. > service.err

echo Paso 7: Iniciando servicio...
nssm.exe start ReportesWeb
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo Verificando estado del servicio...
echo ========================================
nssm.exe status ReportesWeb

echo.
echo Verificando puerto 8000...
netstat -ano | findstr :8000

echo.
echo ========================================
echo Proceso completado!
echo ========================================
echo.
echo Si el servicio esta en estado "SERVICE_RUNNING", todo esta correcto.
echo Prueba acceder a: http://localhost:8000
echo.
pause
