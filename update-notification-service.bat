@echo off
chcp 65001 >nul
echo ========================================
echo Updating Notification Service in Docker
echo ========================================
echo.

cd infrastructure\docker

echo Stopping notification service...
docker-compose stop notification-service

echo Removing old container...
docker-compose rm -f notification-service

echo Building new image...
docker-compose build notification-service

echo Starting notification service...
docker-compose up -d notification-service

echo Waiting for service to start...
timeout /t 10 /nobreak >nul

echo Checking service status...
curl -s -o nul -w "%%{http_code}" http://localhost:3003/notifications/health
if %errorlevel% equ 0 (
    echo Notification Service: ONLINE - http://localhost:3003
) else (
    echo Notification Service: OFFLINE
    echo Check logs: docker logs notification-service
)

echo.
echo ========================================
echo Notification Service Update Complete!
echo ========================================
echo.
pause