@echo off
REM 포트 3000-3010 정리 후 dev server 시작
setlocal enabledelayedexpansion

echo [개발 서버 시작 전 포트 정리]

for /L %%i in (3000,1,3010) do (
    for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":%%i "') do (
        if not "%%a"=="" (
            echo 포트 %%i 정리 중 (PID: %%a)
            taskkill /PID %%a /F >nul 2>&1
        )
    )
)

echo.
echo [개발 서버 시작]
set PORT=3000
cd /d %~dp0
npm run dev

pause
