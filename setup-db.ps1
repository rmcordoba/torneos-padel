# ─── CONFIGURACIÓN ───────────────────────────────────────────────────────────
$PG_VERSION  = "16"                  # 16 o 17
$PG_PORT     = "5432"                # puerto donde corre ese postgres
$PG_PASSWORD = "root"                 # contraseña del superusuario postgres

$DB_NAME     = "torneos_padel"
$DB_USER     = "padel"
$DB_PASS     = "padel_secret"
# ─────────────────────────────────────────────────────────────────────────────

$PSQL = "C:\Program Files\PostgreSQL\$PG_VERSION\bin\psql.exe"
$env:PGPASSWORD = $PG_PASSWORD

Write-Host "=> Eliminando base de datos anterior..." -ForegroundColor Yellow
& $PSQL -U postgres -p $PG_PORT -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>&1

Write-Host "=> Eliminando usuario anterior..." -ForegroundColor Yellow
& $PSQL -U postgres -p $PG_PORT -c "DROP USER IF EXISTS $DB_USER;" 2>&1

Write-Host "=> Creando usuario y base de datos..." -ForegroundColor Yellow
& $PSQL -U postgres -p $PG_PORT -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS' CREATEDB;" 2>&1
& $PSQL -U postgres -p $PG_PORT -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>&1
& $PSQL -U postgres -p $PG_PORT -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>&1

Write-Host "=> Corriendo migraciones..." -ForegroundColor Yellow
npx prisma migrate dev --name init

Write-Host "=> Listo!" -ForegroundColor Green
