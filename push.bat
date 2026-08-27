@echo off
chcp 65001 >nul
set PATH=C:\Program Files\Git\cmd;%PATH%
cd /d "C:\Users\summ3a\Desktop\github-deploy"
echo.
echo === رفع التعديلات على GitHub ===
echo.
git add -A
git commit -m "update %date% %time%"
git push origin main
echo.
echo === تم بنجاح ===
echo.
pause
