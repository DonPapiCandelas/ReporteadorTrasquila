@echo off
echo ========================================
echo Instalando Servicios de Produccion
echo ReportesAPI + ReportesCaddy
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

REM Verificar que Caddy este instalado
if not exist "caddy\caddy.exe" (
    echo ERROR: Caddy no esta instalado
    echo Ejecuta primero: install_caddy.bat
    pause
    exit /b 1
)

REM Verificar que el frontend este compilado
if not exist "reporter_frontend\dist\index.html" (
    echo ERROR: El frontend no esta compilado
    echo Ejecuta primero: build_frontend.bat
    pause
    exit /b 1
)

echo.
echo ===== INSTALANDO SERVICIO: ReportesAPI =====
echo.

REM Instalar servicio del backend
nssm.exe install ReportesAPI "c:\ReportesWeb\run_backend_service.bat"
nssm.exe set ReportesAPI AppDirectory "c:\ReportesWeb\reporter_backend"
nssm.exe set ReportesAPI Description "Reportes Web - FastAPI Backend"
nssm.exe set ReportesAPI Start SERVICE_AUTO_START
nssm.exe set ReportesAPI AppStdout "c:\ReportesWeb\logs\backend.log"
nssm.exe set ReportesAPI AppStderr "c:\ReportesWeb\logs\backend.err"
nssm.exe set ReportesAPI AppStdoutCreationDisposition 4
nssm.exe set ReportesAPI AppStderrCreationDisposition 4
nssm.exe set ReportesAPI AppRotateFiles 1
nssm.exe set ReportesAPI AppRotateOnline 1
nssm.exe set ReportesAPI AppRotateBytes 1048576

echo   - Servicio ReportesAPI instalado

echo.
echo ===== INSTALANDO SERVICIO: ReportesCaddy =====
echo.

REM Instalar servicio de Caddy
nssm.exe install ReportesCaddy "c:\ReportesWeb\run_caddy_service.bat"
nssm.exe set ReportesCaddy AppDirectory "c:\ReportesWeb"
nssm.exe set ReportesCaddy Description "Reportes Web - Caddy Reverse Proxy"
nssm.exe set ReportesCaddy Start SERVICE_AUTO_START
nssm.exe set ReportesCaddy AppStdout "c:\ReportesWeb\logs\caddy.log"
nssm.exe set ReportesCaddy AppStderr "c:\ReportesWeb\logs\caddy.err"
nssm.exe set ReportesCaddy AppStdoutCreationDisposition 4
nssm.exe set ReportesCaddy AppStderrCreationDisposition 4
nssm.exe set ReportesCaddy DependOnService ReportesAPI

echo   - Servicio ReportesCaddy instalado (dependiente de ReportesAPI)

echo.
echo ===== CREANDO DIRECTORIO DE LOGS =====
if not exist "logs" mkdir logs
echo   - Directorio c:\ReportesWeb\logs creado

echo.
echo ===== INICIANDO SERVICIOS =====
echo.

echo Iniciando ReportesAPI...
nssm.exe start ReportesAPI
timeout /t 3 /nobreak >nul

echo Iniciando ReportesCaddy...
nssm.exe start ReportesCaddy
timeout /t 2 /nobreak >nul

echo.
echo ========================================
echo Verificando estado de los servicios...
echo ========================================
echo.

echo ReportesAPI:
nssm.exe status ReportesAPI
echo.

echo ReportesCaddy:
nssm.exe status ReportesCaddy
echo.

echo ========================================
echo Instalacion Completada!
echo ========================================
echo.
echo Si ambos servicios muestran "SERVICE_RUNNING", todo esta correcto.
echo.
echo Accede a la aplicacion en:
echo   http://localhost:3000/
echo.
echo Accede a la documentacion del API en:
echo   http://localhost:3000/docs
echo.
echo NOTA: Los servicios se iniciaran automaticamente al reiniciar Windows.
echo.
pause
