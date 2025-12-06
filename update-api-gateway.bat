@echo off
chcp 65001 >nul
echo ========================================
echo Updating API Gateway in Docker
echo ========================================
echo.

cd infrastructure\docker

echo Stopping API Gateway...
docker-compose stop api-gateway

echo Removing old container...
docker-compose rm -f api-gateway

echo Building new image...
docker-compose build api-gateway

echo Starting API Gateway...
docker-compose up -d api-gateway

echo Waiting for service to start...
timeout /t 10 /nobreak >nul

echo Checking service status...
curl -s -o nul -w "%%{http_code}" http://localhost:3000/health
if %errorlevel% equ 0 (
    echo API Gateway: ONLINE - http://localhost:3000
) else (
    echo API Gateway: OFFLINE
    echo Check logs: docker logs api-gateway
)

echo.
echo ========================================
echo API Gateway Update Complete!
echo ========================================
echo.
pause