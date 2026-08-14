# AddisAbaba Guest Houses — start full stack (API + mobile web + admin web)
# Requires: Node.js, Flutter SDK with Chrome

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

Write-Host "=== AddisAbaba Guest Houses ===" -ForegroundColor Cyan

# Backend
Write-Host "`n[1/3] Starting API on http://localhost:3000 ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend'; if (-not (Test-Path .env)) { Copy-Item .env.example .env }; npm run dev"

Start-Sleep -Seconds 4

# Check Flutter
$flutter = Get-Command flutter -ErrorAction SilentlyContinue
if (-not $flutter) {
    Write-Host "`nFlutter not found in PATH. Install from https://docs.flutter.dev/get-started/install/windows" -ForegroundColor Red
    Write-Host "API is running. Open http://localhost:3000/health in browser." -ForegroundColor Green
    exit 1
}

# Mobile web
Write-Host "`n[2/3] Starting mobile app (Chrome) on http://localhost:8080 ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\mobile'; flutter pub get; flutter run -d chrome --web-port=8080"

Start-Sleep -Seconds 3

# Admin web
Write-Host "`n[3/3] Starting admin panel (Chrome) on http://localhost:8081 ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\admin'; flutter pub get; flutter run -d chrome --web-port=8081"

Write-Host "`n=== Ready ===" -ForegroundColor Green
Write-Host "  Website (SEO): http://localhost:3000"
Write-Host "  Guest houses:  http://localhost:3000/guest-houses"
Write-Host "  Operator demo: http://localhost:3000/demo"
Write-Host "  API:           http://localhost:3000/v1"
Write-Host "  Mobile:        http://localhost:8080  (login: Guest or Host quick chips, OTP 123456)"
Write-Host "  Admin:         http://localhost:8081  (uses X-Admin-Key automatically)"
Write-Host "`nDemo flow:"
Write-Host "  1. Open website > Browse guest houses > open a stay (videos on property page)"
Write-Host "  2. Demo (/demo) or Mobile > Guest > book a stay"
Write-Host "  3. Host (+251988013094) > approve booking; upload tour videos on Host tab"
Write-Host "  4. Admin > approve pending listings (prop_3)"
