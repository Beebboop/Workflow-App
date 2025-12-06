@echo off
chcp 65001 >nul
echo ========================================
echo Updating Web Application in Docker
echo ========================================
echo.

cd infrastructure\docker

echo Stopping web application...
docker-compose stop web-app

echo Removing old container...
docker-compose rm -f web-app

echo Building new image...
docker-compose build web-app

echo Starting web application...
docker-compose up -d web-app

echo Waiting for application to start...
echo Web app may take longer to build and start...
timeout /t 20 /nobreak >nul

echo Checking application status...
set "WEB_APP_ONLINE=0"
for /l %%i in (1,1,5) do (
    curl -s -f -o nul http://localhost:5173 >nul 2>&1
    if !errorlevel! equ 0 (
        set "WEB_APP_ONLINE=1"
        goto :web_app_check_done
    )
    echo Waiting for web app... [attempt %%i/5]
    timeout /t 5 /nobreak >nul
)

:web_app_check_done
if %WEB_APP_ONLINE% equ 1 (
    echo Web Application: ONLINE - http://localhost:5173
) else (
    echo Web Application: Still starting or OFFLINE
    echo Check logs: docker logs web-app -f
)

echo.
echo ========================================
echo Web Application Update Complete!
echo ========================================
echo.
pause