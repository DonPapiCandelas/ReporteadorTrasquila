@echo off
cd /d "c:\ReportesWeb\reporter_backend"
"c:\ReportesWeb\reporter_backend\venv\Scripts\python.exe" -m uvicorn app.main:app --host 0.0.0.0 --port 8000
