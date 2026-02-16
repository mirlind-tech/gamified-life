# PowerShell script to rename the frontend folder
# Run this when the folder is not in use by any process

if (Test-Path "mirlind-protocol-react") {
    Rename-Item -Path "mirlind-protocol-react" -NewName "web"
    Write-Host "✅ Renamed 'mirlind-protocol-react' to 'web'"
} else {
    Write-Host "⚠️  Folder 'mirlind-protocol-react' not found - may already be renamed"
}
