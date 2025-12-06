@echo off
chcp 65001 >nul
echo ========================================
echo Workflow Mobile Development
echo ========================================
echo.

echo [1/4] Starting microservices...
cd infrastructure\docker
docker-compose up -d
echo ✓ Microservices started
echo.

echo [2/4] Waiting for API Gateway...
timeout /t 10 /nobreak >nul

echo [3/4] Building mobile version...
cd ..\..\web-app
copy .env.mobile .env
npm run build
npx cap sync android
echo ✓ Mobile version built
echo.

echo [4/4] Opening Android Studio...
npx cap open android

echo.
echo ========================================
echo MOBILE DEVELOPMENT READY
echo ========================================
echo.
echo  App ID: com.vkr.workflowapp
echo  API Gateway: http://localhost:3000
echo  Mobile API: http://10.0.2.2:3000
echo.
echo In Android Studio:
echo 1. Build → Make Project
echo 2. Run → Run 'app'
echo 3. Choose emulator or device
echo.
pause