# Script de verificación del entorno local
# Ejecutar en PowerShell normal (no como administrador)

Write-Host "🔍 Verificando configuración del entorno local..." -ForegroundColor Green

# 1. Verificar Node.js
Write-Host "`n📦 Verificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "   ✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Node.js no está instalado o no está en PATH" -ForegroundColor Red
    Write-Host "   Descargar desde: https://nodejs.org/" -ForegroundColor Cyan
}

# 2. Verificar npm
Write-Host "`n📦 Verificando npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "   ✅ npm: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "   ❌ npm no está disponible" -ForegroundColor Red
}

# 3. Verificar subdominios en hosts
Write-Host "`n🌐 Verificando configuración de subdominios..." -ForegroundColor Yellow
$hostsPath = "C:\Windows\System32\drivers\etc\hosts"
$hostsContent = Get-Content $hostsPath -ErrorAction SilentlyContinue

$domains = @("norte.localhost", "sur.localhost", "este.localhost")
$allConfigured = $true

foreach ($domain in $domains) {
    if ($hostsContent -match "127\.0\.0\.1\s+$domain") {
        Write-Host "   ✅ $domain configurado" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $domain NO configurado" -ForegroundColor Red
        $allConfigured = $false
    }
}

if (-not $allConfigured) {
    Write-Host "   💡 Ejecutar setup-local.ps1 como administrador para configurar" -ForegroundColor Cyan
}

# 4. Verificar resolución DNS
Write-Host "`n🔍 Verificando resolución DNS..." -ForegroundColor Yellow
foreach ($domain in $domains) {
    try {
        $result = Resolve-DnsName $domain -ErrorAction SilentlyContinue
        if ($result -and $result.IPAddress -contains "127.0.0.1") {
            Write-Host "   ✅ $domain resuelve a 127.0.0.1" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️ $domain no resuelve correctamente" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "   ❌ Error resolviendo $domain" -ForegroundColor Red
    }
}

# 5. Verificar dependencias del proyecto
Write-Host "`n📋 Verificando dependencias del proyecto..." -ForegroundColor Yellow
if (Test-Path "package.json") {
    Write-Host "   ✅ package.json encontrado" -ForegroundColor Green
    
    if (Test-Path "node_modules") {
        Write-Host "   ✅ node_modules existe" -ForegroundColor Green
        Write-Host "   💡 Ejecutar 'npm run dev' para iniciar el frontend" -ForegroundColor Cyan
    } else {
        Write-Host "   ⚠️ node_modules no existe" -ForegroundColor Yellow
        Write-Host "   💡 Ejecutar 'npm install' para instalar dependencias" -ForegroundColor Cyan
    }
} else {
    Write-Host "   ❌ package.json no encontrado" -ForegroundColor Red
    Write-Host "   💡 Asegúrate de estar en el directorio del proyecto" -ForegroundColor Cyan
}

# 6. Verificar archivos de configuración
Write-Host "`n⚙️ Verificando archivos de configuración..." -ForegroundColor Yellow

$configFiles = @(
    ".env.local",
    "vite.config.ts",
    "src/lib/Api.ts"
)

foreach ($file in $configFiles) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file existe" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $file no encontrado" -ForegroundColor Red
    }
}

# 7. Mostrar comandos para iniciar
Write-Host "`n🚀 Comandos para iniciar el proyecto:" -ForegroundColor Green
Write-Host ""
Write-Host "1. Instalar dependencias (si no están instaladas):" -ForegroundColor White
Write-Host "   npm install" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Iniciar frontend (terminal 1):" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Iniciar backend Django (terminal 2):" -ForegroundColor White
Write-Host "   cd ../sitwo-project-backend-master" -ForegroundColor Gray
Write-Host "   python manage.py runserver 0.0.0.0:8000" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Acceder al sistema:" -ForegroundColor White
Write-Host "   • Clínica Norte: http://norte.localhost:5173" -ForegroundColor Cyan
Write-Host "   • Clínica Sur:   http://sur.localhost:5173" -ForegroundColor Cyan
Write-Host "   • Clínica Este:  http://este.localhost:5173" -ForegroundColor Cyan
Write-Host ""

# 8. Verificar puertos disponibles
Write-Host "🔌 Verificando puertos..." -ForegroundColor Yellow
$ports = @(5173, 8000)
foreach ($port in $ports) {
    $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connection) {
        Write-Host "   ⚠️ Puerto $port está en uso" -ForegroundColor Yellow
    } else {
        Write-Host "   ✅ Puerto $port disponible" -ForegroundColor Green
    }
}

Write-Host "`n✨ Verificación completada!" -ForegroundColor Green