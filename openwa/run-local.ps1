Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  OpenWA Local Gateway - Setup & Run (PowerShell)  " -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $scriptPath

if (-not (Test-Path "OpenWA")) {
    Write-Host "[1/4] Cloning OpenWA repository..." -ForegroundColor Yellow
    git clone https://github.com/rmyndharis/OpenWA.git OpenWA
}

Set-Location "$scriptPath\OpenWA"

if (-not (Test-Path ".env")) {
    Write-Host "[2/4] Creating .env file..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Add-Content -Path ".env" -Value "`nPORT=2785`nAUTO_START_SESSIONS=true"
}

if (-not (Test-Path "node_modules")) {
    Write-Host "[3/4] Installing dependencies..." -ForegroundColor Yellow
    npm install --ignore-scripts
}

Write-Host "[4/4] Starting OpenWA local development server..." -ForegroundColor Green
Write-Host ""
Write-Host "OpenWA Swagger API & Service : http://localhost:2785/api" -ForegroundColor Cyan
Write-Host ""

npm run start:dev
