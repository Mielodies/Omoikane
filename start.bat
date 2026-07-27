@echo off
title Omoikane - AI Study Tool
echo ===================================
echo   Omoikane - AI Study Tool
echo ===================================
echo.

if exist "backend\.env" (
    for /f "usebackq tokens=1,* delims==" %%a in ("backend\.env") do (
        set "%%a=%%b"
    )
)

if "%GROQ_API_KEY%"=="" (
    echo WARNING: GROQ_API_KEY is not set!
    echo Copy backend\.env.example to backend\.env and add your key.
    echo Get one free at: https://console.groq.com/
    echo.
)

echo Starting backend on port 3001...
start "Omoikane Backend" cmd /k "cd backend && node server.js"

timeout /t 2 /nobreak >nul

echo Starting frontend on port 5173...
start "Omoikane Frontend" cmd /k "cd frontend && node node_modules\vite\bin\vite.js"

echo.
echo Omoikane is starting!
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:3001
echo.
pause
