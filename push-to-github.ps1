# ============================================================
# Script automatico: inizializza repo Git e push su GitHub
# Repo: https://github.com/Dfiniello/SOSAround
# ============================================================

$ErrorActionPreference = "Stop"
Set-Location -Path $PSScriptRoot

Write-Host ""
Write-Host "=== STEP 1/7: Verifica .gitignore ===" -ForegroundColor Cyan
if (-not (Test-Path ".gitignore")) {
    Write-Host "ERRORE: .gitignore mancante. Interrompo." -ForegroundColor Red
    exit 1
}
Write-Host "OK: .gitignore presente." -ForegroundColor Green

Write-Host ""
Write-Host "=== STEP 2/7: Inizializzazione repo Git ===" -ForegroundColor Cyan
if (Test-Path ".git") {
    Write-Host "Repo Git gia' esistente. Salto git init." -ForegroundColor Yellow
} else {
    git init -b main
    Write-Host "Repo inizializzato con branch 'main'." -ForegroundColor Green
}

Write-Host ""
Write-Host "=== STEP 3/7: Configurazione remote 'origin' ===" -ForegroundColor Cyan
$existingRemote = git remote 2>$null
if ($existingRemote -contains "origin") {
    $currentUrl = git remote get-url origin
    Write-Host "Remote 'origin' gia' impostato: $currentUrl" -ForegroundColor Yellow
    git remote set-url origin https://github.com/Dfiniello/SOSAround.git
    Write-Host "Aggiornato a https://github.com/Dfiniello/SOSAround.git" -ForegroundColor Green
} else {
    git remote add origin https://github.com/Dfiniello/SOSAround.git
    Write-Host "Remote 'origin' aggiunto." -ForegroundColor Green
}

Write-Host ""
Write-Host "=== STEP 4/7: Fetch contenuto esistente da GitHub ===" -ForegroundColor Cyan
git fetch origin
Write-Host "Fetch completato." -ForegroundColor Green

Write-Host ""
Write-Host "=== STEP 5/7: Add + Commit dei file locali ===" -ForegroundColor Cyan
git add .
# Verifica che node_modules NON sia stato aggiunto
$staged = git diff --cached --name-only
if ($staged -match "node_modules/") {
    Write-Host "ATTENZIONE: node_modules e' tra i file staged. Interrompo per sicurezza." -ForegroundColor Red
    Write-Host "Controlla il .gitignore." -ForegroundColor Red
    exit 1
}
Write-Host "File staged (esclusi node_modules):" -ForegroundColor Green
$staged | Select-Object -First 30 | ForEach-Object { Write-Host "  + $_" }
$totalFiles = ($staged | Measure-Object).Count
Write-Host "Totale file: $totalFiles" -ForegroundColor Green

# Commit solo se ci sono cambiamenti
$hasChanges = git status --porcelain
if ($hasChanges) {
    git commit -m "Initial commit: SOSAround React Native/Expo app (Clean Architecture)"
    Write-Host "Commit creato." -ForegroundColor Green
} else {
    Write-Host "Nessun cambiamento da committare." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== STEP 6/7: Merge con README esistente su GitHub ===" -ForegroundColor Cyan
# Pull con merge per preservare il README.md gia' presente sul repo remoto
git pull origin main --allow-unrelated-histories --no-rebase -m "Merge remote README into local project"
Write-Host "Merge completato." -ForegroundColor Green

Write-Host ""
Write-Host "=== STEP 7/7: Push su GitHub ===" -ForegroundColor Cyan
Write-Host "Se ti viene chiesta autenticazione, usa il tuo account GitHub." -ForegroundColor Yellow
git push -u origin main
Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "FATTO! Controlla: https://github.com/Dfiniello/SOSAround" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
