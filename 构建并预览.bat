@echo off
chcp 65001 >nul
title 于师傅画布 - 构建并预览
cd /d "%~dp0"
echo ==============================================
echo    第 1 步：构建生产版本（npm run build）
echo ==============================================
echo.
call npm run build
if errorlevel 1 (
    echo.
    echo [失败] 构建出错，请检查上方报错信息。
    pause
    exit /b 1
)
echo.
echo ==============================================
echo    第 2 步：启动预览  http://localhost:4173
echo ==============================================
echo.
call npm run preview
echo.
echo 服务已停止。
pause
