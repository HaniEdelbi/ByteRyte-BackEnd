# ByteRyte API Test Script
# Tests all Phase 1 MVP endpoints

$baseUrl = "http://192.168.10.135:3000"
$testEmail = "test-$(Get-Random)@example.com"
$testPassword = "test-hash-$(Get-Random)"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "ByteRyte API Test Suite" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Test 1: Health Check
Write-Host "1. Testing Health Check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
    Write-Host "PASS - Health Check: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "FAIL - Health Check Failed: $_" -ForegroundColor Red
    exit 1
}

# Test 2: Register
Write-Host "`n2. Testing User Registration..." -ForegroundColor Yellow
$registerBody = @{
    email = $testEmail
    name = "Test User"
    passwordVerifier = $testPassword
    encryptedVaultKey = "encrypted-key-abc123"
    deviceFingerprint = "test-device-powershell"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" `
        -Method Post `
        -ContentType "application/json" `
        -Body $registerBody
    
    Write-Host " Registration Successful" -ForegroundColor Green
    Write-Host "   User ID: $($registerResponse.user.id)" -ForegroundColor Gray
    Write-Host "   Email: $($registerResponse.user.email)" -ForegroundColor Gray
    Write-Host "   Name: $($registerResponse.user.name)" -ForegroundColor Gray
    Write-Host "   Token: $($registerResponse.token.Substring(0, 20))..." -ForegroundColor Gray
    
    $token = $registerResponse.token
    $userId = $registerResponse.user.id
} catch {
    Write-Host " Registration Failed: $_" -ForegroundColor Red
    Write-Host "Response: $($_.ErrorDetails.Message)" -ForegroundColor Red
    exit 1
}

# Test 3: Get Vaults
Write-Host "`n3  Testing Get Vaults..." -ForegroundColor Yellow
try {
    $headers = @{
        Authorization = "Bearer $token"
    }
    
    $vaultsResponse = Invoke-RestMethod -Uri "$baseUrl/api/vaults" `
        -Method Get `
        -Headers $headers
    
    Write-Host " Vaults Retrieved: $($vaultsResponse.data.Count) vault(s)" -ForegroundColor Green
    if ($vaultsResponse.data.Count -gt 0) {
        $vaultId = $vaultsResponse.data[0].id
        Write-Host "   Vault ID: $vaultId" -ForegroundColor Gray
        Write-Host "   Name: $($vaultsResponse.data[0].name)" -ForegroundColor Gray
        Write-Host "   Items: $($vaultsResponse.data[0].itemCount)" -ForegroundColor Gray
    }
} catch {
    Write-Host " Get Vaults Failed: $_" -ForegroundColor Red
    exit 1
}

# Test 4: Create Password
Write-Host "`n4  Testing Create Password..." -ForegroundColor Yellow
$passwordBody = @{
    vaultId = $vaultId
    encryptedBlob = "encrypted-password-data-123"
    category = "login"
    favorite = $true
} | ConvertTo-Json

try {
    $createPasswordResponse = Invoke-RestMethod -Uri "$baseUrl/api/passwords" `
        -Method Post `
        -Headers $headers `
        -ContentType "application/json" `
        -Body $passwordBody
    
    Write-Host " Password Created" -ForegroundColor Green
    Write-Host "   Password ID: $($createPasswordResponse.data.id)" -ForegroundColor Gray
    Write-Host "   Category: $($createPasswordResponse.data.category)" -ForegroundColor Gray
    Write-Host "   Favorite: $($createPasswordResponse.data.favorite)" -ForegroundColor Gray
    
    $passwordId = $createPasswordResponse.data.id
} catch {
    Write-Host " Create Password Failed: $_" -ForegroundColor Red
    Write-Host "Response: $($_.ErrorDetails.Message)" -ForegroundColor Red
    exit 1
}

# Test 5: List Passwords
Write-Host "`n5  Testing List Passwords..." -ForegroundColor Yellow
try {
    $listPasswordsResponse = Invoke-RestMethod -Uri "$baseUrl/api/passwords" `
        -Method Get `
        -Headers $headers
    
    Write-Host " Passwords Listed: $($listPasswordsResponse.count) password(s)" -ForegroundColor Green
    foreach ($item in $listPasswordsResponse.items) {
        Write-Host "   - ID: $($item.id)" -ForegroundColor Gray
        Write-Host "     Category: $($item.category)" -ForegroundColor Gray
        Write-Host "     Favorite: $($item.favorite)" -ForegroundColor Gray
    }
} catch {
    Write-Host " List Passwords Failed: $_" -ForegroundColor Red
    exit 1
}

# Test 6: Update Password
Write-Host "`n6  Testing Update Password..." -ForegroundColor Yellow
$updateBody = @{
    category = "payment"
    favorite = $false
    encryptedBlob = "updated-encrypted-data-456"
} | ConvertTo-Json

try {
    $updateResponse = Invoke-RestMethod -Uri "$baseUrl/api/passwords/$passwordId" `
        -Method Put `
        -Headers $headers `
        -ContentType "application/json" `
        -Body $updateBody
    
    Write-Host " Password Updated" -ForegroundColor Green
    Write-Host "   Success: $($updateResponse.success)" -ForegroundColor Gray
    Write-Host "   Message: $($updateResponse.message)" -ForegroundColor Gray
} catch {
    Write-Host " Update Password Failed: $_" -ForegroundColor Red
    exit 1
}

# Test 7: Get Devices
Write-Host "`n7  Testing Get Devices..." -ForegroundColor Yellow
try {
    $devicesResponse = Invoke-RestMethod -Uri "$baseUrl/api/devices" `
        -Method Get `
        -Headers $headers
    
    Write-Host " Devices Retrieved: $($devicesResponse.count) device(s)" -ForegroundColor Green
    foreach ($device in $devicesResponse.data) {
        Write-Host "   - Name: $($device.name)" -ForegroundColor Gray
        Write-Host "     Browser: $($device.browser)" -ForegroundColor Gray
        Write-Host "     OS: $($device.os)" -ForegroundColor Gray
    }
} catch {
    Write-Host " Get Devices Failed: $_" -ForegroundColor Red
    exit 1
}

# Test 8: Delete Password
Write-Host "`n8  Testing Delete Password..." -ForegroundColor Yellow
try {
    $deleteResponse = Invoke-RestMethod -Uri "$baseUrl/api/passwords/$passwordId" `
        -Method Delete `
        -Headers $headers
    
    Write-Host " Password Deleted" -ForegroundColor Green
    Write-Host "   Success: $($deleteResponse.success)" -ForegroundColor Gray
    Write-Host "   Message: $($deleteResponse.message)" -ForegroundColor Gray
} catch {
    Write-Host " Delete Password Failed: $_" -ForegroundColor Red
    exit 1
}

# Test 9: Logout
Write-Host "`n9  Testing Logout..." -ForegroundColor Yellow
try {
    $logoutResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/logout" `
        -Method Post `
        -Headers $headers `
        -ContentType "application/json" `
        -Body "{}"
    
    Write-Host " Logout Successful" -ForegroundColor Green
    Write-Host "   Success: $($logoutResponse.success)" -ForegroundColor Gray
    Write-Host "   Message: $($logoutResponse.message)" -ForegroundColor Gray
} catch {
    Write-Host " Logout Failed: $_" -ForegroundColor Red
    exit 1
}

# Test 10: Login
Write-Host "`n Testing Login..." -ForegroundColor Yellow
$loginBody = @{
    email = $testEmail
    passwordVerifier = $testPassword
    deviceFingerprint = "test-device-powershell"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" `
        -Method Post `
        -ContentType "application/json" `
        -Body $loginBody
    
    Write-Host " Login Successful" -ForegroundColor Green
    Write-Host "   User ID: $($loginResponse.user.id)" -ForegroundColor Gray
    Write-Host "   Email: $($loginResponse.user.email)" -ForegroundColor Gray
    Write-Host "   Name: $($loginResponse.user.name)" -ForegroundColor Gray
    Write-Host "   Token: $($loginResponse.token.Substring(0, 20))..." -ForegroundColor Gray
} catch {
    Write-Host " Login Failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "ALL TESTS PASSED!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Test Summary:" -ForegroundColor Cyan
Write-Host "   Health Check - PASS" -ForegroundColor Green
Write-Host "   User Registration - PASS" -ForegroundColor Green
Write-Host "   Get Vaults - PASS" -ForegroundColor Green
Write-Host "   Create Password - PASS" -ForegroundColor Green
Write-Host "   List Passwords - PASS" -ForegroundColor Green
Write-Host "   Update Password - PASS" -ForegroundColor Green
Write-Host "   Get Devices - PASS" -ForegroundColor Green
Write-Host "   Delete Password - PASS" -ForegroundColor Green
Write-Host "   Logout - PASS" -ForegroundColor Green
Write-Host "   Login - PASS" -ForegroundColor Green
Write-Host "`nBackend is ready for frontend integration!`n" -ForegroundColor Cyan

