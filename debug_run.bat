@echo off
cd /d "c:\ReportesWeb\reporter_backend"
call venv\Scripts\activate
echo --- DIAGNOSTIC MODE ---
echo Running uvicorn directly...
python -c "from app.main import app; import uvicorn; print('Routes loaded:', [r.path for r in app.routes]); uvicorn.run(app, host='0.0.0.0', port=8001)"
pause
