@echo off
title Meeting.ai - Autonomous Note Taker Launcher
color 0b

echo ========================================================
echo    MEETING.AI (BYOK) - AUTONOMOUS NOTE TAKER LAUNCHER
echo ========================================================
echo.
echo Direktori: D:\meetingai-replica
echo Membuka server aplikasi di http://localhost:3005 ...
echo.

cd /d D:\meetingai-replica

:: Buka browser otomatis setelah 3 detik
start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:3005"

:: Jalankan server Next.js lokal
npm run dev

pause
