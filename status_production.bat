@echo off
echo ========================================
echo Estado de Servicios de Produccion
echo ========================================
echo.

cd /d "c:\ReportesWeb"

echo === SERVICIOS ===
echo.
echo ReportesAPI:
nssm.exe status ReportesAPI 2>nul
if %errorLevel% neq 0 echo   [NO INSTALADO]
echo.

echo ReportesCaddy:
nssm.exe status ReportesCaddy 2>nul
if %errorLevel% neq 0 echo   [NO INSTALADO]
echo.

echo === PUERTOS ===
echo.
echo Procesos en puerto 8000 (Backend):
netstat -ano | findstr :8000
if %errorLevel% neq 0 echo   [NINGUN PROCESO]
echo.

echo Procesos en puerto 3000 (Caddy):
netstat -ano | findstr :3000
if %errorLevel% neq 0 echo   [NINGUN PROCESO]
echo.

echo === ARCHIVOS CRITICOS ===
echo.
if exist "caddy\caddy.exe" (
    echo [OK] Caddy instalado
) else (
    echo [ERROR] Caddy NO instalado
)

if exist "reporter_frontend\dist\index.html" (
    echo [OK] Frontend compilado
) else (
    echo [ERROR] Frontend NO compilado
)

if exist "reporter_backend\venv\Scripts\python.exe" (
    echo [OK] Backend virtual environment
) else (
    echo [ERROR] Backend venv NO encontrado
)

echo.
echo === LOGS RECIENTES ===
echo.
if exist "logs\backend.err" (
    echo Ultimos errores del backend:
    powershell -Command "Get-Content logs\backend.err -Tail 5 -ErrorAction SilentlyContinue"
) else (
    echo [Sin logs de backend]
)

echo.
echo ========================================
pause
