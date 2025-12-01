@echo off
echo ========================================
echo REINSTALACION COMPLETA - ReportesAPI
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
echo Paso 2: Desinstalando servicio ReportesAPI...
.\nssm.exe remove ReportesAPI confirm 2>nul
timeout /t 2 /nobreak >nul

echo.
echo Paso 3: Matando TODOS los procesos en puerto 8000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000') do (
    echo   - Matando proceso PID %%a
    taskkill /F /PID %%a 2>nul
)
timeout /t 2 /nobreak >nul

echo.
echo Paso 4: Verificando que el puerto este libre...
netstat -ano | findstr :8000
if %errorLevel% equ 0 (
    echo ADVERTENCIA: Todavia hay procesos, intentando de nuevo...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000') do (
        taskkill /F /PID %%a 2>nul
    )
    timeout /t 2 /nobreak >nul
    netstat -ano | findstr :8000
    if %errorLevel% equ 0 (
        echo ERROR: No se pudo liberar el puerto 8000
        echo Por favor reinicia el servidor e intenta de nuevo
        pause
        exit /b 1
    )
)
echo   [OK] Puerto 8000 liberado

echo.
echo Paso 5: Reinstalando servicio ReportesAPI...
.\nssm.exe install ReportesAPI "c:\ReportesWeb\run_backend_service.bat"
.\nssm.exe set ReportesAPI AppDirectory "c:\ReportesWeb\reporter_backend"
.\nssm.exe set ReportesAPI Description "Reportes Web - FastAPI Backend"
.\nssm.exe set ReportesAPI Start SERVICE_AUTO_START
.\nssm.exe set ReportesAPI AppStdout "c:\ReportesWeb\logs\backend.log"
.\nssm.exe set ReportesAPI AppStderr "c:\ReportesWeb\logs\backend.err"
.\nssm.exe set ReportesAPI AppStdoutCreationDisposition 4
.\nssm.exe set ReportesAPI AppStderrCreationDisposition 4
echo   [OK] Servicio reinstalado

echo.
echo Paso 6: Limpiando logs antiguos...
echo. > logs\backend.log
echo. > logs\backend.err
echo   [OK] Logs limpiados

echo.
echo Paso 7: Iniciando servicio ReportesAPI...
.\nssm.exe start ReportesAPI
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo Verificando resultado...
echo ========================================
echo.

echo Estado del servicio:
.\nssm.exe status ReportesAPI
echo.

echo Procesos en puerto 8000:
netstat -ano | findstr :8000
echo.

echo.
echo ========================================
echo Si el servicio muestra "SERVICE_RUNNING" y hay UN SOLO proceso, todo esta bien.
echo Intenta iniciar sesion en: http://localhost:3000/
echo.
pause
