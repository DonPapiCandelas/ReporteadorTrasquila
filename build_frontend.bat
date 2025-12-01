@echo off
echo ========================================
echo Compilando Frontend para Produccion
echo ========================================
echo.

cd /d "c:\ReportesWeb\reporter_frontend"

echo Verificando dependencias de Node.js...
if not exist "node_modules" (
    echo Instalando dependencias...
    call npm install
    if %errorLevel% neq 0 (
        echo ERROR: No se pudieron instalar las dependencias
        pause
        exit /b 1
    )
)

echo.
echo Compilando frontend React con Vite...
call npm run build

if %errorLevel% neq 0 (
    echo.
    echo ERROR: La compilacion fallo
    pause
    exit /b 1
)

echo.
echo ========================================
echo Compilacion exitosa!
echo ========================================
echo.
echo Archivos generados en: c:\ReportesWeb\reporter_frontend\dist
echo.
dir dist /b
echo.
pause
