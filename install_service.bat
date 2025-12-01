@echo off
echo Installing ReportesWeb Service...
cd /d "c:\ReportesWeb"

REM Install the service
nssm.exe install ReportesWeb "c:\ReportesWeb\run_service.bat"

REM Configure the service
nssm.exe set ReportesWeb AppDirectory "c:\ReportesWeb"
nssm.exe set ReportesWeb Description "Reportes Web Service - Backend + Frontend"
nssm.exe set ReportesWeb Start SERVICE_AUTO_START
nssm.exe set ReportesWeb AppStdout "c:\ReportesWeb\service.log"
nssm.exe set ReportesWeb AppStderr "c:\ReportesWeb\service.err"

echo Service installed. Starting...
nssm.exe start ReportesWeb

echo Done. Please check http://localhost:8000
pause
