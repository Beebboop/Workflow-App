@echo off
chcp 65001 >nul
echo ========================================
echo Checking Auth Service Logs
echo ========================================
echo.

docker logs auth-service --tail 50

echo.
echo ========================================
echo Recent Errors in Auth Service
echo ========================================
echo.

docker logs auth-service --tail 100 | findstr /i "error fail exception"

echo.
pause