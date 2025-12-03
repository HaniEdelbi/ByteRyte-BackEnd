# ByteRyte Backend - Quick Test Script

Write-Host "🧪 Testing ByteRyte Backend..." -ForegroundColor Cyan
Write-Host ""

# Test health endpoint
Write-Host "📍 Testing Health Endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/health" -Method GET
    Write-Host "✅ Health Check PASSED!" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json)
} catch {
    Write-Host "❌ Health Check FAILED!" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

Write-Host ""
Write-Host "✅ Server is running on http://localhost:3000" -ForegroundColor Green
Write-Host "📚 API Documentation: See API_TESTING.md" -ForegroundColor Cyan
