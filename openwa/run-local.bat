@echo off
echo ===================================================
echo   OpenWA Local Gateway - Setup ^& Run (Windows)
echo ===================================================

cd /d "%~dp0"

IF NOT EXIST "OpenWA" (
    echo [1/4] Cloning OpenWA repository...
    git clone https://github.com/rmyndharis/OpenWA.git OpenWA
)

cd OpenWA

IF NOT EXIST ".env" (
    echo [2/4] Creating .env file...
    copy .env.example .env
    echo PORT=2785 >> .env
    echo AUTO_START_SESSIONS=true >> .env
)

IF NOT EXIST "node_modules" (
    echo [3/4] Installing dependencies...
    npm install --ignore-scripts
)

echo [4/4] Starting OpenWA local development server...
echo.
echo OpenWA Swagger API ^& Service : http://localhost:2785/api
echo.
npm run start:dev
