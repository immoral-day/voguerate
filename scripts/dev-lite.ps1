$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$frontendEnv = Join-Path $root "frontend\.env.local"

if (!(Test-Path $frontendEnv)) {
    "VITE_API_URL=/api" | Set-Content -LiteralPath $frontendEnv
}

Write-Host "Starting lightweight backend on http://localhost:8080 ..."
docker compose -f (Join-Path $root "docker-compose.yml") up -d backend

Write-Host "Starting frontend on http://127.0.0.1:5173 ..."
Push-Location (Join-Path $root "frontend")
try {
    npm run dev:local
} finally {
    Pop-Location
}
