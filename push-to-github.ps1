# ============================================================
# Script di RECUPERO: completa push su GitHub
# Repo: https://github.com/Dfiniello/SOSAround
# ============================================================

# NB: NON usiamo "Stop" per non interrompere su warning
$ErrorActionPreference = "Continue"
Set-Location -Path $PSScriptRoot

Write-Host ""
Write-Host "=== STEP 1/6: Pulizia eventuali processi git hung ===" -ForegroundColor Cyan
Get-Process -Name "git*" -ErrorAction SilentlyContinue | ForEach-Object {
    Write-Host "Termino processo git PID $($_.Id)..." -ForegroundColor Yellow
    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
}
Start-Sleep -Seconds 1
if (Test-Path ".git/index.lock") {
    Remove-Item ".git/index.lock" -Force
    Write-Host "Rimosso .git/index.lock" -ForegroundColor Green
}
Write-Host "OK pulizia." -ForegroundColor Green

Write-Host ""
Write-Host "=== STEP 2/6: Verifica stato corrente ===" -ForegroundColor Cyan
Write-Host "Branch corrente:" -ForegroundColor Yellow
git branch --show-current
Write-Host "Commit locale HEAD:" -ForegroundColor Yellow
git log --oneline -1
Write-Host "Remote origin:" -ForegroundColor Yellow
git remote get-url origin

Write-Host ""
Write-Host "=== STEP 3/6: Aggiorno riferimenti remoti ===" -ForegroundColor Cyan
git fetch origin
Write-Host "Fetch completato." -ForegroundColor Green

Write-Host ""
Write-Host "=== STEP 4/6: Merge con README esistente (unrelated histories) ===" -ForegroundColor Cyan
# Controlla se gia' fatto merge
$parents = (git cat-file -p HEAD | Select-String "^parent ").Count
if ($parents -ge 2) {
    Write-Host "HEAD e' gia' un merge commit. Salto." -ForegroundColor Yellow
} else {
    git merge origin/main --allow-unrelated-histories --no-edit
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ATTENZIONE: merge ha conflitti. Risolvili manualmente con 'git status'." -ForegroundColor Red
        exit 1
    }
    Write-Host "Merge OK." -ForegroundColor Green
}

Write-Host ""
Write-Host "=== STEP 5/6: Verifica esclusione node_modules ===" -ForegroundColor Cyan
$bigFiles = git ls-tree -r HEAD --name-only | Where-Object { $_ -match "node_modules/" }
if ($bigFiles) {
    Write-Host "ATTENZIONE: node_modules e' presente nei commit. Interrompo." -ForegroundColor Red
    exit 1
}
Write-Host "OK: node_modules escluso correttamente." -ForegroundColor Green

Write-Host ""
Write-Host "=== STEP 6/6: Push su GitHub ===" -ForegroundColor Cyan
Write-Host "Se ti chiede autenticazione, accetta nel browser." -ForegroundColor Yellow
Write-Host "Eseguo: git push -u origin main" -ForegroundColor Yellow
git push -u origin main
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host "  SUCCESSO! Codice pushato su:" -ForegroundColor Green
    Write-Host "  https://github.com/Dfiniello/SOSAround" -ForegroundColor Green
    Write-Host "============================================================" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Red
    Write-Host "  PUSH FALLITO. Verifica autenticazione GitHub." -ForegroundColor Red
    Write-Host "  Prova: git config --global credential.helper manager" -ForegroundColor Red
    Write-Host "============================================================" -ForegroundColor Red
}
