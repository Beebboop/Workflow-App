@echo off
chcp 65001 >nul
echo ========================================
echo Workflow App - Full System Startup
echo ========================================
echo.

echo [1/3] Building microservices...
cd infrastructure\docker
echo Stopping any running services...
docker-compose down

echo Building and starting services...
docker-compose up -d --build
if %errorlevel% neq 0 (
    echo ERROR: Docker compose failed
    pause
    exit /b 1
)
cd ..\..
echo  Microservices started in Docker
echo.

echo [2/3] Waiting for services to initialize...
echo Please wait 15 seconds for all services to start...
timeout /t 15 /nobreak >nul

echo.
echo [3/3] Checking service status...
docker ps --filter "name=workflow" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo.
echo ========================================
echo SERVICES STATUS
echo ========================================
echo.

echo Checking API Gateway...
curl -s -o nul -w "%%{http_code}" http://localhost:3000/health
if %errorlevel% equ 0 (
    echo  API Gateway: ONLINE - http://localhost:3000
) else (
    echo  API Gateway: OFFLINE
)

echo Checking Auth Service...
curl -s -o nul -w "%%{http_code}" http://localhost:3001/auth/health
if %errorlevel% equ 0 (
    echo  Auth Service: ONLINE - http://localhost:3001
) else (
    echo  Auth Service: OFFLINE
)

echo Checking Task Service...
curl -s -o nul -w "%%{http_code}" http://localhost:3002/tasks/health
if %errorlevel% equ 0 (
    echo  Task Service: ONLINE - http://localhost:3002
) else (
    echo  Task Service: OFFLINE
)

echo Checking Notification Service...
curl -s -o nul -w "%%{http_code}" http://localhost:3003/notifications/health
if %errorlevel% equ 0 (
    echo  Notification Service: ONLINE - http://localhost:3003
) else (
    echo  Notification Service: OFFLINE
)

echo.
echo ========================================
echo ACCESS URLs
echo ========================================
echo.
echo  API ENDPOINTS:
echo    API Gateway:       http://localhost:3000
echo    Auth Service:      http://localhost:3001
echo    Task Service:      http://localhost:3002
echo    Notification Service: http://localhost:3003
echo.
echo   DATABASES:
echo    Auth DB:          localhost:5432 (auth_service)
echo    Task DB:          localhost:5433 (task_service)
echo    Notification DB:  localhost:5434 (notification_service)
echo.
echo  WEB APPLICATION:
echo    Web App:          http://localhost:5173 (run separately)
echo.
echo ========================================
echo NEXT STEPS
echo ========================================
echo.
echo 1. Open new terminal and run web application:
echo    cd web-app && npm run dev
echo.
echo.
echo 2. Open browser: http://localhost:5173
echo.
echo ========================================
echo.
pause