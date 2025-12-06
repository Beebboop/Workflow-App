@echo off
chcp 65001 >nul
echo ========================================
echo Updating Task Service in Docker
echo ========================================
echo.

cd infrastructure\docker

echo Stopping task service...
docker-compose stop task-service

echo Removing old container...
docker-compose rm -f task-service

echo Building new image...
docker-compose build task-service

echo Starting task service...
docker-compose up -d task-service

echo Waiting for service to start...
timeout /t 10 /nobreak >nobreak

echo Checking service status...
curl -s -o nul -w "%%{http_code}" http://localhost:3002/tasks/health
if %errorlevel% equ 0 (
    echo Task Service: ONLINE - http://localhost:3002
) else (
    echo Task Service: OFFLINE
    echo Check logs: docker logs task-service
)

echo.
echo ========================================
echo Task Service Update Complete!
echo ========================================
echo.
pause