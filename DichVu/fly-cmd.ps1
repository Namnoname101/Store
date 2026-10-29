# Helper script to run fly commands with FLY_API_TOKEN from .env
$envFile = Join-Path $PSScriptRoot ".env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*FLY_API_TOKEN\s*=\s*["'']?(.*?)["'']?\s*$') {
            $env:FLY_API_TOKEN = $matches[1]
        }
    }
}

& fly $args
