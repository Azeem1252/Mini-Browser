# Compilation script for Windows (MinGW/g++)
g++ -std=c++17 -Wall -Wextra main.cpp -o browser_engine.exe -I.

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "To run the server:" -ForegroundColor Yellow
    Write-Host "  ./browser_engine.exe" -ForegroundColor Cyan
} else {
    Write-Host "❌ Build failed!" -ForegroundColor Red
}
