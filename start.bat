@echo off
rem ===================================================================
rem  Yi Hua Huang - Portfolio : one-click local server
rem  Double-click this file. It opens http://localhost:5500/
rem  A second window runs the server - keep that one open.
rem ===================================================================
cd /d "%~dp0"
set PORT=5500

where node >nul 2>nul
if not errorlevel 1 goto NODE
where py >nul 2>nul
if not errorlevel 1 goto PY
where python >nul 2>nul
if not errorlevel 1 goto PYTHON
goto NOTHING

:NODE
echo Using Node.js
start "Portfolio server - keep this window open" cmd /k node serve.js
goto OPEN

:PY
echo Node.js not found - using Python
start "Portfolio server - keep this window open" cmd /k py -m http.server %PORT%
goto OPEN

:PYTHON
echo Node.js not found - using Python
start "Portfolio server - keep this window open" cmd /k python -m http.server %PORT%
goto OPEN

:OPEN
echo Waiting for the server to start ...
timeout /t 3 >nul
start http://localhost:%PORT%/
echo.
echo   Browser opened at http://localhost:%PORT%/
echo   The other window is the server. Closing it stops the site.
echo.
pause
exit /b

:NOTHING
echo.
echo   Neither Node.js nor Python is installed on this PC.
echo   Just double-click  index.html  instead - it works without a server.
echo.
pause
