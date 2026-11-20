@echo off
title Meeting.ai - Login Akun Google
color 0a

echo ========================================================
echo   MEETING.AI - LOGIN AKUN GOOGLE UNTUK BOT PERSISTEN
echo ========================================================
echo.
echo Membuka jendela browser Chromium...
echo Silakan login ke akun Google Anda di jendela yang muncul.
echo Sesi login Anda akan tersimpan permanen di data/browser_profile.
echo.
echo Setelah selesai login, cukup TUTUP jendela browser tersebut.
echo.

cd /d D:\meetingai-replica
node scripts/login-google.js

echo.
echo Selesai! Bot sekarang sudah memiliki sesi login Google resmi.
pause
