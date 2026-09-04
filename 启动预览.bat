@echo off
chcp 65001 >nul
title 于师傅的导演台 - 本地预览
cd /d "%~dp0"
echo ==============================================
echo    于师傅的导演台 - 本地预览
echo    浏览器访问: http://localhost:4173
echo    关闭此窗口即可停止服务
echo ==============================================
echo.
npm run preview
echo.
echo 服务已停止。
pause
