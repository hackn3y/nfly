# Test NFL Predictor API

Write-Host "=== NFL Predictor API Test ===" -ForegroundColor Green
Write-Host ""

# Test 1: Health Check
Write-Host "1. Testing Backend Health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:4100/health" -Method GET
    Write-Host "   ✅ Backend is healthy!" -ForegroundColor Green
    Write-Host "   Uptime: $($health.uptime) seconds" -ForegroundColor Cyan
} catch {
    Write-Host "   ❌ Backend health check failed" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 2: Register User
Write-Host "2. Registering Test User..." -ForegroundColor Yellow
$registerBody = @{
    email = "test@nflpredictor.com"
    password = "password123"
    firstName = "John"
    lastName = "Doe"
    dateOfBirth = "1990-01-01"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "http://localhost:4100/api/auth/register" -Method POST -Body $registerBody -ContentType "application/json"
    Write-Host "   ✅ User registered successfully!" -ForegroundColor Green
    Write-Host "   User ID: $($registerResponse.data.user.id)" -ForegroundColor Cyan
    Write-Host "   Email: $($registerResponse.data.user.email)" -ForegroundColor Cyan
    Write-Host "   Tier: $($registerResponse.data.user.subscriptionTier)" -ForegroundColor Cyan
    $token = $registerResponse.data.token
    Write-Host "   Token: $($token.Substring(0, 20))..." -ForegroundColor Cyan
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "   ℹ️  User already exists, trying login..." -ForegroundColor Yellow

        # Login instead
        $loginBody = @{
            email = "test@nflpredictor.com"
            password = "password123"
        } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "http://localhost:4100/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
        Write-Host "   ✅ Logged in successfully!" -ForegroundColor Green
        $token = $loginResponse.data.token
        Write-Host "   Token: $($token.Substring(0, 20))..." -ForegroundColor Cyan
    } else {
        Write-Host "   ❌ Registration/Login failed: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""

# Test 3: Get Predictions
Write-Host "3. Getting Predictions..." -ForegroundColor Yellow
$headers = @{
    "Authorization" = "Bearer $token"
}

try {
    $predictions = Invoke-RestMethod -Uri "http://localhost:4100/api/predictions/upcoming" -Method GET -Headers $headers
    Write-Host "   ✅ Predictions retrieved!" -ForegroundColor Green
    if ($predictions.data) {
        Write-Host "   Found $($predictions.data.Count) upcoming games" -ForegroundColor Cyan
    } else {
        Write-Host "   No upcoming games (expected for mock data)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "   ⚠️  Predictions: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""

# Test 4: Calculate Gematria
Write-Host "4. Testing Gematria Calculator..." -ForegroundColor Yellow
$gematriaBody = @{
    text = "Kansas City Chiefs"
    methods = @("english", "pythagorean", "chaldean")
} | ConvertTo-Json

try {
    $gematria = Invoke-RestMethod -Uri "http://localhost:4100/api/gematria/calculate" -Method POST -Body $gematriaBody -ContentType "application/json" -Headers $headers
    Write-Host "   ✅ Gematria calculated!" -ForegroundColor Green
    Write-Host "   Text: '$($gematria.data.text)'" -ForegroundColor Cyan
    Write-Host "   English: $($gematria.data.results.english.value) (reduced: $($gematria.data.results.english.reduced))" -ForegroundColor Cyan
    Write-Host "   Pythagorean: $($gematria.data.results.pythagorean.value) (reduced: $($gematria.data.results.pythagorean.reduced))" -ForegroundColor Cyan
    Write-Host "   Chaldean: $($gematria.data.results.chaldean.value) (reduced: $($gematria.data.results.chaldean.reduced))" -ForegroundColor Cyan
} catch {
    Write-Host "   ❌ Gematria calculation failed" -ForegroundColor Red
}

Write-Host ""

# Test 5: Get Subscription Tiers
Write-Host "5. Getting Subscription Tiers..." -ForegroundColor Yellow
try {
    $tiers = Invoke-RestMethod -Uri "http://localhost:4100/api/subscriptions/tiers" -Method GET
    Write-Host "   ✅ Subscription tiers retrieved!" -ForegroundColor Green
    Write-Host "   Available tiers:" -ForegroundColor Cyan
    foreach ($tier in $tiers.data.PSObject.Properties) {
        Write-Host "     - $($tier.Name): `$$($tier.Value.price)/month" -ForegroundColor Cyan
    }
} catch {
    Write-Host "   ❌ Failed to get tiers" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Test Complete! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Open http://localhost:4100/api in your browser" -ForegroundColor White
Write-Host "  2. Open http://localhost:5000/docs for ML API docs" -ForegroundColor White
Write-Host "  3. Wait for mobile app to finish installing" -ForegroundColor White
Write-Host ""
Write-Host "Your test credentials:" -ForegroundColor Yellow
Write-Host "  Email: test@nflpredictor.com" -ForegroundColor White
Write-Host "  Password: password123" -ForegroundColor White
Write-Host ""
