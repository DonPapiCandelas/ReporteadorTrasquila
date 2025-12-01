@echo off
echo ========================================
echo Instalando Caddy Server
echo ========================================
echo.

cd /d "c:\ReportesWeb"

REM Crear directorio para Caddy si no existe
if not exist "caddy" mkdir caddy

echo Descargando Caddy v2.8.4 para Windows...
echo.

REM Descargar Caddy usando PowerShell
powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://github.com/caddyserver/caddy/releases/download/v2.8.4/caddy_2.8.4_windows_amd64.zip' -OutFile 'caddy\caddy.zip'}"

if %errorLevel% neq 0 (
    echo ERROR: No se pudo descargar Caddy
    echo.
    echo Por favor descarga manualmente desde:
    echo https://github.com/caddyserver/caddy/releases/download/v2.8.4/caddy_2.8.4_windows_amd64.zip
    echo.
    echo Y extraelo en: c:\ReportesWeb\caddy\
    pause
    exit /b 1
)

echo Extrayendo Caddy...
powershell -Command "Expand-Archive -Path 'caddy\caddy.zip' -DestinationPath 'caddy' -Force"

if %errorLevel% neq 0 (
    echo ERROR: No se pudo extraer Caddy
    pause
    exit /b 1
)

echo Limpiando archivo temporal...
del caddy\caddy.zip 2>nul

echo.
echo ========================================
echo Caddy instalado correctamente!
echo ========================================
echo.
echo Ubicacion: c:\ReportesWeb\caddy\caddy.exe
echo Version:
caddy\caddy.exe version
echo.
pause
