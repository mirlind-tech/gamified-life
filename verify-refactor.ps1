# Verification script for refactoring changes

Write-Host "🔍 Verifying Refactoring Changes..."
Write-Host ""

$errors = @()

# Check .gitignore has security patterns
Write-Host "Checking .gitignore..." -NoNewline
$gitignore = Get-Content .gitignore -Raw
if ($gitignore -match "\.env" -and $gitignore -match "\.db") {
    Write-Host " OK" 
} else {
    Write-Host " FAIL - Missing security patterns" 
    $errors += ".gitignore missing patterns"
}

# Check backend/src structure exists
Write-Host "Checking backend modular structure..." -NoNewline
if ((Test-Path "backend/src/index.js") -and 
    (Test-Path "backend/src/database/index.js") -and 
    (Test-Path "backend/src/middleware/auth.js") -and
    (Test-Path "backend/src/routes/auth.js")) {
    Write-Host " OK" 
} else {
    Write-Host " FAIL - Missing backend modules" 
    $errors += "Backend modules missing"
}

# Check JWT_SECRET is set in backend .env
Write-Host "Checking JWT_SECRET..." -NoNewline
$envContent = Get-Content backend/.env -Raw
if ($envContent -match "JWT_SECRET=[a-zA-Z0-9]+") {
    Write-Host " OK" 
} else {
    Write-Host " FAIL - JWT_SECRET not set" 
    $errors += "JWT_SECRET issue"
}

# Check logger utility exists
Write-Host "Checking logger utility..." -NoNewline
if (Test-Path "mirlind-protocol-react/src/utils/logger.ts") {
    Write-Host " OK" 
} else {
    Write-Host " FAIL - Logger utility missing" 
    $errors += "Logger utility missing"
}

# Check component exports
Write-Host "Checking component exports..." -NoNewline
$componentsIndex = Get-Content mirlind-protocol-react/src/components/index.ts -Raw
if ($componentsIndex -match "AchievementBadge" -and $componentsIndex -match "Confetti") {
    Write-Host " OK" 
} else {
    Write-Host " FAIL - Component exports incomplete" 
    $errors += "Component exports incomplete"
}

# Check Skills renamed to MasterySkill
Write-Host "Checking Skill interface rename..." -NoNewline
$skillsContent = Get-Content mirlind-protocol-react/src/data/skills.ts -Raw
if ($skillsContent -match "export interface MasterySkill") {
    Write-Host " OK" 
} else {
    Write-Host " FAIL - MasterySkill not found" 
    $errors += "Skill interface not renamed"
}

# Check backend package.json has express-rate-limit
Write-Host "Checking backend dependencies..." -NoNewline
$packageJson = Get-Content backend/package.json -Raw
if ($packageJson -match "express-rate-limit") {
    Write-Host " OK" 
} else {
    Write-Host " FAIL - express-rate-limit not in dependencies" 
    $errors += "express-rate-limit missing"
}

Write-Host ""
if ($errors.Count -eq 0) {
    Write-Host "All checks passed!"
    Write-Host ""
    Write-Host "Next steps:"
    Write-Host "  1. cd backend; npm install"
    Write-Host "  2. Run git commands from REFACTORING_SUMMARY.md"
    Write-Host "  3. Test the application"
} else {
    Write-Host "Some checks failed:"
    foreach ($err in $errors) {
        Write-Host ("   - " + $err)
    }
}
