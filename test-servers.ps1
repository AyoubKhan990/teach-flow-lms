# Test script for LearnStream servers
Write-Host "`n=== LearnStream Server Status Test ===`n" -ForegroundColor Cyan

# Test Backend
Write-Host "Testing Backend (http://localhost:8000)..." -ForegroundColor Yellow
try {
    $backend = Invoke-WebRequest -Uri "http://localhost:8000" -TimeoutSec 5 -UseBasicParsing
    Write-Host "✅ Backend Server: RUNNING" -ForegroundColor Green
    Write-Host "   Status Code: $($backend.StatusCode)" -ForegroundColor Green
    Write-Host "   Response: $($backend.Content.Trim())" -ForegroundColor Gray
} catch {
    Write-Host "❌ Backend Server: NOT RUNNING" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nTesting Frontend (http://localhost:5173)..." -ForegroundColor Yellow
try {
    $frontend = Invoke-WebRequest -Uri "http://localhost:5173" -TimeoutSec 5 -UseBasicParsing
    Write-Host "✅ Frontend Server: RUNNING" -ForegroundColor Green
    Write-Host "   Status Code: $($frontend.StatusCode)" -ForegroundColor Green
    Write-Host "   Access at: http://localhost:5173" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Frontend Server: NOT RUNNING" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Check ports
Write-Host "`nChecking listening ports..." -ForegroundColor Yellow
$ports = Get-NetTCPConnection -LocalPort 8000,5173 -State Listen -ErrorAction SilentlyContinue
if ($ports) {
    $ports | ForEach-Object {
        Write-Host "   Port $($_.LocalPort): LISTENING (PID: $($_.OwningProcess))" -ForegroundColor Green
    }
} else {
    Write-Host "   No servers listening on ports 8000 or 5173" -ForegroundColor Red
}

Write-Host "`n=== Test Complete ===`n" -ForegroundColor Cyan

