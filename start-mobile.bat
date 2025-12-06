@echo off
chcp 65001 >nul
echo ========================================
echo Workflow App - Mobile Development Setup
echo ========================================
echo.

echo [1/4] Starting backend services...
cd infrastructure\docker
echo Stopping any running services...
docker-compose down

echo Building and starting services for mobile...
docker-compose up -d --build
if %errorlevel% neq 0 (
    echo ERROR: Docker compose failed
    pause
    exit /b 1
)
cd ..\..
echo  Backend services started
echo.

echo [2/4] Waiting for services to initialize...
echo Please wait 15 seconds for services to start...
timeout /t 15 /nobreak >nul

echo.
echo [3/4] Building mobile web app...
cd web-app
echo Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: npm install failed
    pause
    exit /b 1
)

echo Building for mobile...
call npm run build:mobile
if %errorlevel% neq 0 (
    echo ERROR: Build failed
    pause
    exit /b 1
)
cd ..
echo  Web app built for mobile
echo.

echo [4/4] Setting up Capacitor for Android...
cd web-app
echo Syncing Capacitor...
call npx cap sync android
if %errorlevel% neq 0 (
    echo ERROR: Capacitor sync failed
    pause
    exit /b 1
)

echo Opening Android Studio...
call npx cap open android
if %errorlevel% neq 0 (
    echo WARNING: Could not open Android Studio automatically
    echo Please open Android Studio manually: web-app\android
)
cd ..
echo  Android project ready
echo.

echo ========================================
echo MOBILE SETUP COMPLETE
echo ========================================
echo.
echo  MOBILE DEVELOPMENT READY
echo.
echo  Backend Services:
echo    API Gateway:       http://localhost:3000
echo    Auth Service:      http://localhost:3001  
echo    Task Service:      http://localhost:3002
echo    Notification Service: http://localhost:3003
echo.
echo  Mobile App:
echo    Android Project:   web-app\android\
echo    Web Build:         web-app\dist\
echo.
echo  Next Steps:
echo    1. Build APK in Android Studio
echo    2. Run on emulator or device
echo    3. For emulator: Use 10.0.2.2 for localhost
echo.
echo  Quick Test Commands:
echo    Build APK:    cd web-app && npm run android:build
echo    Run on device: cd web-app && npm run android:run
echo.
echo ========================================
echo.
pause