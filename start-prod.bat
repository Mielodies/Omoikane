@echo off
title Omoikane - Production
echo ===================================
echo   Omoikane - Production Mode
echo ===================================
echo.

if exist "backend\.env" (
    for /f "usebackq tokens=1,* delims==" %%a in ("backend\.env") do (
        set "%%a=%%b"
    )
)

echo Starting Omoikane on port 3001...
echo Frontend is served from the backend.
echo.
echo   URL: http://localhost:3001
echo.

set NODE_ENV=production
cd backend && node server.js
