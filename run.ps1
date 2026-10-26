# ==============================================================================
# Windows PowerShell Launcher: FinSimulate Intelligent Finance System
# ==============================================================================

Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host " INTELLIGENT PERSONAL FINANCE AND FUTURE SIMULATION SYSTEM" -ForegroundColor Yellow
Write-Host " DSE Final Semester / Capstone Engineering Project" -ForegroundColor Cyan
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host ""

$ROOT_DIR = $PSScriptRoot
$BACKEND_DIR = Join-Path $ROOT_DIR "backend"
$FRONTEND_DIR = Join-Path $ROOT_DIR "frontend"

# Step 1: Ensure Python and Node are available
Write-Host "[1/4] Verifying Environment Toolchain..." -ForegroundColor Green
python --version
node -v

# Step 2: Initialize Database and Seed Demonstration Data
Write-Host "`n[2/4] Initializing SQLite Database & Seeding Demo Records..." -ForegroundColor Green
Set-Location $BACKEND_DIR
python seed_data.py
Set-Location $ROOT_DIR

# Step 3: Launch Flask Backend Server in a new PowerShell window
Write-Host "`n[3/4] Starting Python Flask API Server on http://127.0.0.1:5000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$BACKEND_DIR'; python app.py"

Start-Sleep -Seconds 2

# Step 4: Launch Frontend Dev Server
Write-Host "`n[4/4] Starting Vite React Frontend on http://127.0.0.1:5173..." -ForegroundColor Green
Write-Host "`n===================================================================" -ForegroundColor Yellow
Write-Host " DEMO LOGIN CREDENTIALS:" -ForegroundColor Cyan
Write-Host " Username: demo_user" -ForegroundColor White
Write-Host " Password: Password123!" -ForegroundColor White
Write-Host " Frontend: http://localhost:5173" -ForegroundColor White
Write-Host " Backend:  http://127.0.0.1:5000/api/health" -ForegroundColor White
Write-Host "===================================================================" -ForegroundColor Yellow
Write-Host ""

Set-Location $FRONTEND_DIR
npm run dev
