# Forge Platform — start dev stack (Windows PowerShell)
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

Write-Host "=== Forge Platform ===" -ForegroundColor Cyan

if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
  Write-Host "Installing pnpm..." -ForegroundColor Yellow
  npm install -g pnpm
}

Write-Host "`n[1/3] Starting PostgreSQL (Docker)..." -ForegroundColor Green
Set-Location "$Root\docker"
docker compose up -d postgres
Set-Location $Root
Start-Sleep -Seconds 8

Write-Host "`n[2/3] Installing dependencies..." -ForegroundColor Green
pnpm install

Write-Host "`n[3/3] DB migrate + dev servers..." -ForegroundColor Green
pnpm db:migrate

Write-Host @"

Ready! Starting API + Admin + Runtime...

  Admin:    http://localhost:5173
  Runtime:  http://localhost:5174
  API:      http://localhost:4000/health

Press Ctrl+C to stop.

"@ -ForegroundColor Cyan

pnpm dev:all
