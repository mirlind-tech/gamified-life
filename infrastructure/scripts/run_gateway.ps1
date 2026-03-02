$ErrorActionPreference = 'Stop'
$env:PATH += ";$env:USERPROFILE\.cargo\bin"
Set-Location "C:\Users\mirli\gamified-life"

$existing = Get-Process gateway -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "Stopping existing gateway process..."
    $existing | Stop-Process -Force
    Start-Sleep -Seconds 1
}

cargo run -p gateway --bin gateway
