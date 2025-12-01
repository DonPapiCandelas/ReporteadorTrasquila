@echo off
REM Script para ejecutar Caddy para el servicio de Windows
cd /d "c:\ReportesWeb"

REM Ejecutar Caddy con el Caddyfile
caddy\caddy.exe run --config Caddyfile
