@echo off
chcp 65001 >nul
echo ========================================
echo Mobile Development Setup
echo ========================================
echo.

echo [1/4] Getting local IP address...
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr "IPv4"') do (
    set "local_ip=%%i"
    goto :ip_found
)
:ip_found
set "local_ip=%local_ip: =%"
echo Local IP Address: %local_ip%
echo.

echo [2/4] Updating capacitor config with local IP...
node -e "
const fs = require('fs');
const configPath = './capacitor.config.ts';
let config = fs.readFileSync(configPath, 'utf8');

// Обновляем URL с локальным IP
const newConfig = config.replace(
  /url:\\s*['\\\"].*?['\\\"]/,
  'url: \\'http://%local_ip%:5173\\''
);

fs.writeFileSync(configPath, newConfig);
console.log(' Capacitor config updated with IP: %local_ip%');
"
echo.

echo [3/4] Syncing Capacitor...
npx cap sync android
if %errorlevel% neq 0 (
    echo ERROR: Capacitor sync failed
    pause
    exit /b 1
)
echo  Capacitor synced
echo.

echo [4/4] Starting development server...
echo.
echo  DEVELOPMENT SERVER STARTING...
echo    URL: http://%local_ip%:5173
echo    Android: Use this URL in Capacitor
echo.
set VITE_API_URL=http://%local_ip%:3000
set VITE_WS_URL=http://%local_ip%:3003
set VITE_MOBILE_API_URL=http://%local_ip%:3000
set VITE_MOBILE_WS_URL=http://%local_ip%:3003

npm run dev -- --host %local_ip%

pause