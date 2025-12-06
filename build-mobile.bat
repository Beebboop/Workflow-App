@echo off
chcp 65001 >nul
echo ========================================
echo Workflow Mobile Build
echo ========================================
echo.

echo [1/3] Building Vue.js application...
cd web-app
npm run build
if %errorlevel% neq 0 (
    echo ERROR: Vue build failed
    pause
    exit /b 1
)

echo [2/3] Syncing with Capacitor...
npx cap sync android
if %errorlevel% neq 0 (
    echo ERROR: Capacitor sync failed
    pause
    exit /b 1
)

echo [3/3] Opening Android Studio...
npx cap open android
if %errorlevel% neq 0 (
    echo ERROR: Failed to open Android Studio
    echo Please open manually: web-app\android
    pause
    exit /b 1
)

echo.
echo ========================================
echo MOBILE PROJECT READY
echo ========================================
echo.
echo  App ID: com.vkr.workflowapp
echo  Android Studio: web-app\android
echo  Next: Build → Run on emulator/device
echo.
pause