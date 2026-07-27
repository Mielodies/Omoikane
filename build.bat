@echo off
title Omoikane - Production Build
echo ===================================
echo   Building Omoikane for Production
echo ===================================
echo.

echo Building frontend...
cd frontend
call node node_modules\vite\bin\vite.js build
cd ..

echo.
echo Setting NODE_ENV=production...
copy /y backend\.env backend\.env.backup >nul 2>&1
powershell -Command "(Get-Content backend\.env) -replace 'NODE_ENV=development','NODE_ENV=production' | Set-Content backend\.env"

echo.
echo ===================================
echo   Build complete!
echo   Run 'start-prod.bat' to launch.
echo ===================================
pause
