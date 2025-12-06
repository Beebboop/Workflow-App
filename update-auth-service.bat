@echo off
chcp 65001 >nul
echo ========================================
echo Updating Auth Service in Docker
echo ========================================
echo.

cd infrastructure\docker

echo Stopping auth service...
docker-compose stop auth-service

echo Removing old container...
docker-compose rm -f auth-service

echo Building new image...
docker-compose build auth-service

echo Starting auth service...
docker-compose up -d auth-service

echo Waiting for service to start...
timeout /t 10 /nobreak >nul

echo Checking service status...
curl -s -o nul -w "%%{http_code}" http://localhost:3001/auth/health
if %errorlevel% equ 0 (
    echo Auth Service: ONLINE - http://localhost:3001
) else (
    echo Auth Service: OFFLINE
    echo Check logs: docker logs auth-service
)

echo.
echo ========================================
echo Auth Service Update Complete!
echo ========================================
echo.
pause