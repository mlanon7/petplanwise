@echo off
REM ============================================================
REM  Pet Cost & Vet Bill Calculator — local dev server
REM  Tries Node, then Python, then PHP. First match wins.
REM  Usage: double-click this file, or run from cmd:  serve.bat
REM ============================================================

setlocal
set PORT=8080

echo.
echo  Pet Cost ^& Vet Bill Calculator — local server
echo  ------------------------------------------------
echo  Trying to start on http://localhost:%PORT%/
echo.

REM ---- Try Node (npx serve) ----
where npx >nul 2>nul
if %ERRORLEVEL% == 0 (
  echo  ^> Found Node. Starting via npx serve...
  echo  ^> Open http://localhost:%PORT%/ in your browser.
  echo  ^> Press Ctrl+C to stop.
  echo.
  npx --yes serve -l %PORT% "%~dp0"
  goto :end
)

REM ---- Try Python 3 ----
where py >nul 2>nul
if %ERRORLEVEL% == 0 (
  echo  ^> Found Python. Starting http.server...
  echo  ^> Open http://localhost:%PORT%/ in your browser.
  echo  ^> Press Ctrl+C to stop.
  echo.
  py -3 -m http.server %PORT% --directory "%~dp0"
  goto :end
)
where python >nul 2>nul
if %ERRORLEVEL% == 0 (
  echo  ^> Found Python. Starting http.server...
  echo  ^> Open http://localhost:%PORT%/ in your browser.
  echo  ^> Press Ctrl+C to stop.
  echo.
  python -m http.server %PORT% --directory "%~dp0"
  goto :end
)

REM ---- Try PHP ----
where php >nul 2>nul
if %ERRORLEVEL% == 0 (
  echo  ^> Found PHP. Starting built-in server...
  echo  ^> Open http://localhost:%PORT%/ in your browser.
  echo  ^> Press Ctrl+C to stop.
  echo.
  php -S localhost:%PORT% -t "%~dp0"
  goto :end
)

echo  ^> No Node, Python, or PHP found on PATH.
echo.
echo  Install one of these (any one works):
echo    Node.js    https://nodejs.org/        (recommended)
echo    Python     https://www.python.org/downloads/
echo    PHP        https://windows.php.net/
echo.
echo  Then re-run this script.

:end
endlocal
pause
