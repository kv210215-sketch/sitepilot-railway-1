# =============================================================================
# SitePilot — Deploy Bootstrap Script
# Запуск: Right-click → "Run with PowerShell" АБО
#         PowerShell: cd V3-папка; .\deploy-bootstrap.ps1
# =============================================================================
# Що робить:
#   КРОК 1 — Запускає локальний Postgres і перевіряє міграції
#   КРОК 2 — Перевіряє таблиці в БД
#   КРОК 3 — Git: додає нову міграцію, commit, push
# =============================================================================

$ErrorActionPreference = "Stop"
$Host.UI.RawUI.WindowTitle = "SitePilot Deploy Bootstrap"

function Write-Ok($msg)   { Write-Host "  [OK] $msg" -ForegroundColor Green }
function Write-Info($msg) { Write-Host "  [->] $msg" -ForegroundColor Cyan }
function Write-Warn($msg) { Write-Host "  [!!] $msg" -ForegroundColor Yellow }
function Write-Fail($msg) { Write-Host "  [XX] $msg" -ForegroundColor Red }
function Write-Step($msg) { Write-Host "`n=== $msg ===" -ForegroundColor Magenta }

$V3 = "C:\Users\Andriy\sitepilot\sitepilot-v2\sitepilot-monorepo-v2\sitepilot"
$Backend = "$V3\backend"

Clear-Host
Write-Host ""
Write-Host "  ╔══════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "  ║   SitePilot — Deploy Bootstrap v1.0     ║" -ForegroundColor Cyan
Write-Host "  ╚══════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# =============================================================================
# КРОК 1 — ЛОКАЛЬНИЙ POSTGRES + МІГРАЦІЇ
# =============================================================================
Write-Step "КРОК 1 — Запуск Postgres і міграцій"

# Перевірити наявність Docker
Write-Info "Перевірка Docker..."
$dockerExists = Get-Command docker -ErrorAction SilentlyContinue
if (-not $dockerExists) {
    Write-Fail "Docker не знайдений. Встановіть Docker Desktop і повторіть."
    exit 1
}
Write-Ok "Docker знайдений"

# Перейти в V3
Write-Info "Переходимо в V3: $V3"
Set-Location $V3

# Запустити postgres
# Сервіс називається 'db' в docker-compose.yml; container_name=sitepilot_db задається там же
Write-Info "Запускаємо db (postgres)..."
docker compose up -d db
if ($LASTEXITCODE -ne 0) {
    Write-Warn "docker compose up повернув код $LASTEXITCODE"
    Write-Info "Спробуємо продовжити..."
}

Write-Info "Чекаємо 5 секунд поки postgres стартує..."
Start-Sleep -Seconds 5

# Перевірити що postgres живий
Write-Info "Перевіряємо postgres health..."
$pgReady = $false
for ($i = 1; $i -le 10; $i++) {
    $result = docker exec sitepilot_db pg_isready -U postgres 2>&1
    if ($result -match "accepting connections") {
        $pgReady = $true
        break
    }
    Write-Info "Спроба $i/10 — postgres ще не готовий, чекаємо 2 сек..."
    Start-Sleep -Seconds 2
}

if (-not $pgReady) {
    Write-Fail "Postgres не запустився. Перевірте Docker Desktop."
    exit 1
}
Write-Ok "Postgres готовий"

# Перейти в backend
Set-Location $Backend
Write-Info "Робоча папка: $Backend"

# Перевірити node_modules
if (-not (Test-Path "$Backend\node_modules")) {
    Write-Info "node_modules не знайдено — запускаємо npm install..."
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Fail "npm install failed"
        exit 1
    }
}
Write-Ok "node_modules є"

# Запустити міграції
Write-Info "Запускаємо npm run migration:run..."
Write-Host ""
npm run migration:run
$migrationExitCode = $LASTEXITCODE
Write-Host ""

if ($migrationExitCode -ne 0) {
    Write-Fail "migration:run завершився з помилкою ($migrationExitCode)"
    Write-Warn "Перевір вивід вище. Найчастіші причини:"
    Write-Warn "  - Postgres не запущений"
    Write-Warn "  - Невірний DB_USER/DB_PASS/DB_NAME в backend/.env"
    Write-Warn "  - DB_NAME=sitepilot повинна існувати: docker exec sitepilot_db createdb -U postgres sitepilot"
    exit 1
}
Write-Ok "migration:run завершився успішно"

# =============================================================================
# КРОК 2 — ВЕРИФІКАЦІЯ БД
# =============================================================================
Write-Step "КРОК 2 — Верифікація таблиць в БД"

Write-Info "Список таблиць:"
docker exec sitepilot_db psql -U postgres -d sitepilot -c "\dt"

Write-Host ""
Write-Info "Записи в typeorm_migrations:"
docker exec sitepilot_db psql -U postgres -d sitepilot -c "SELECT name, timestamp FROM typeorm_migrations ORDER BY timestamp;"

Write-Host ""
Write-Info "Кількість таблиць:"
$tableCount = docker exec sitepilot_db psql -U postgres -d sitepilot -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';"
$tableCount = $tableCount.Trim()
Write-Host "  Таблиць у public schema: $tableCount" -ForegroundColor White

if ([int]$tableCount -ge 14) {
    Write-Ok "Всі таблиці створені ($tableCount включно з typeorm_migrations)"
} else {
    Write-Warn "Очікувалось 14+ таблиць, знайдено: $tableCount"
}

$migrationCount = docker exec sitepilot_db psql -U postgres -d sitepilot -t -c "SELECT count(*) FROM typeorm_migrations;"
$migrationCount = $migrationCount.Trim()
if ([int]$migrationCount -eq 4) {
    Write-Ok "4 міграції зафіксовані в typeorm_migrations"
} else {
    Write-Warn "Очікувалось 4 міграції, знайдено: $migrationCount"
}

# =============================================================================
# КРОК 3 — GIT
# =============================================================================
Write-Step "КРОК 3 — Git bootstrap"

Set-Location $V3

Write-Info "git status:"
git status
Write-Host ""

# Перевірити чи є remote
$remotes = git remote 2>&1
if ($remotes -notmatch "origin") {
    Write-Warn "Remote 'origin' не знайдений"
    Write-Host ""
    Write-Host "  Зараз потрібно:" -ForegroundColor Yellow
    Write-Host "  1. Відкрити github.com → New repository" -ForegroundColor Yellow
    Write-Host "  2. Name: sitepilot-railway  |  Private  |  БЕЗ README/gitignore" -ForegroundColor Yellow
    Write-Host "  3. Після створення скопіювати URL репо" -ForegroundColor Yellow
    Write-Host ""
    $githubUrl = Read-Host "  Вставте GitHub URL репо (https://github.com/USERNAME/sitepilot-railway.git)"

    if ($githubUrl -match "github.com") {
        git remote add origin $githubUrl
        Write-Ok "Remote origin додано: $githubUrl"
    } else {
        Write-Warn "URL не схожий на GitHub. Додайте вручну:"
        Write-Warn "  git remote add origin https://github.com/USERNAME/sitepilot-railway.git"
    }
} else {
    Write-Ok "Remote origin вже є: $(git remote get-url origin)"
}

# Додати нову міграцію до staging
Write-Info "Додаємо нову міграцію в staging..."
git add "$Backend\src\database\migrations\1714000000000-InitialSchema.ts"

Write-Info "git status після add:"
git status
Write-Host ""

# Перевірити чи є що комітити
$staged = git diff --cached --name-only
if ($staged -match "InitialSchema") {
    Write-Info "Комітимо..."
    git commit -m "feat(db): add InitialSchema migration for fresh production DB bootstrap"
    Write-Ok "Commit створено"
} else {
    Write-Info "InitialSchema вже закомічена або staged — пропускаємо commit"
}

Write-Info "git log (останні 3 коміти):"
git log --oneline -3
Write-Host ""

# Push
$remoteUrl = git remote get-url origin 2>&1
if ($remoteUrl -match "github.com") {
    Write-Info "Пушимо на GitHub..."
    git push -u origin main
    if ($LASTEXITCODE -eq 0) {
        Write-Ok "git push успішний!"
    } else {
        Write-Warn "git push не вдався. Можливо потрібна авторизація."
        Write-Warn "Виконайте вручну: git push -u origin main"
    }
} else {
    Write-Warn "Remote origin не вказаний або не GitHub. Push пропущено."
    Write-Warn "Після додавання remote: git push -u origin main"
}

# =============================================================================
# ФІНАЛЬНИЙ SUMMARY
# =============================================================================
Write-Step "SUMMARY"
Write-Host ""
Write-Ok "КРОК 1 — міграції: перевір вивід вище"
Write-Ok "КРОК 2 — таблиці: $tableCount таблиць, $migrationCount міграцій"

$currentRemote = git remote get-url origin 2>&1
if ($currentRemote -match "github.com") {
    Write-Ok "КРОК 3 — Git remote: $currentRemote"
} else {
    Write-Warn "КРОК 3 — Git remote: не налаштовано"
}

Write-Host ""
Write-Host "  ── Наступні кроки (вручну) ──────────────────────" -ForegroundColor Cyan
Write-Host "  4. GitHub → Settings → Secrets → RAILWAY_TOKEN" -ForegroundColor White
Write-Host "  5. railway.app → New Project → sitepilot-railway" -ForegroundColor White
Write-Host "  6. Railway → PostgreSQL plugin → backend service" -ForegroundColor White
Write-Host "  7. railway run --service backend npm run migration:run" -ForegroundColor White
Write-Host "  8. Railway → frontend service → NEXT_PUBLIC_API_URL" -ForegroundColor White
Write-Host "  9. Оновити CORS_ORIGINS у backend Variables" -ForegroundColor White
Write-Host "  10. Smoke test: GET /health, register, login, dashboard" -ForegroundColor White
Write-Host ""
Write-Host "  Детальні інструкції: V3/DEPLOY_CHECKLIST.md" -ForegroundColor Cyan
Write-Host ""

Set-Location $V3
