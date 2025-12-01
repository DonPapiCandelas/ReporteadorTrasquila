@echo off
cd /d "c:\ReportesWeb"
echo Stopping ReportesWeb Service...
nssm.exe stop ReportesWeb
nssm.exe remove ReportesWeb confirm
echo Service removed.
pause
