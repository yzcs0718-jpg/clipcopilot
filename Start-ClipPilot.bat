@echo off
cd /d "%~dp0"
py -3 tools/local_app.py --enable-local-ai
pause
