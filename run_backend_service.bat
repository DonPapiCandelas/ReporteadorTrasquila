@echo off
REM Script para ejecutar el backend FastAPI para el servicio de Windows
cd /d "c:\ReportesWeb\reporter_backend"

REM Activar entorno virtual
call venv\Scripts\activate.bat

REM Ejecutar uvicorn
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --log-level info
