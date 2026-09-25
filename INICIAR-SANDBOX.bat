@echo off
cd /d "%~dp0"
set PORT=8766
set URL=http://localhost:%PORT%/sandbox-offline/
where py >nul 2>nul
if %errorlevel%==0 (
  start "" py -m http.server %PORT% --directory sandbox-offline
  start "" "%URL%"
  exit /b
)
where python >nul 2>nul
if %errorlevel%==0 (
  start "" python -m http.server %PORT% --directory sandbox-offline
  start "" "%URL%"
  exit /b
)
echo Python nao encontrado. Instale Python 3 ou use outro servidor HTTP local.
pause
