@echo off
chcp 65001 >nul
echo ========================================
echo Debug Login Request
echo ========================================
echo.

echo Testing login directly to auth service (port 3001)...
curl -v -X POST http://localhost:3001/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@example.com\",\"password\":\"password\"}" ^
  -w "\n\nStatus Code: %%{http_code}\n"

echo.
echo Testing login through API Gateway (port 3000)...
curl -v -X POST http://localhost:3000/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@example.com\",\"password\":\"password\"}" ^
  -w "\n\nStatus Code: %%{http_code}\n"

echo.
pause