@echo off
cd /d "%~dp0"
set PORT=8765
set URL=http://localhost:%PORT%/offline-local/
where py >nul 2>nul
if %errorlevel%==0 (
  start "" py -m http.server %PORT% --directory offline-local
  start "" "%URL%"
  exit /b
)
where python >nul 2>nul
if %errorlevel%==0 (
  start "" python -m http.server %PORT% --directory offline-local
  start "" "%URL%"
  exit /b
)
echo Python nao encontrado. Instale Python 3 ou use outro servidor HTTP local.
pause
