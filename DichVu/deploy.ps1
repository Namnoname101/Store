# Deploy script for daitruongstore
$envFile = Join-Path $PSScriptRoot ".env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*FLY_API_TOKEN\s*=\s*["'']?(.*?)["'']?\s*$') {
            $env:FLY_API_TOKEN = $matches[1]
            $env:FLY_ACCESS_TOKEN = $matches[1]
        }
    }
}

if (-not $env:FLY_API_TOKEN) {
    Write-Host "Warning: FLY_API_TOKEN not found in .env, falling back to global fly auth session." -ForegroundColor Yellow
} else {
    Write-Host "Using project isolated FLY_API_TOKEN for daitruongstore." -ForegroundColor Green
}

fly deploy --ha=false
