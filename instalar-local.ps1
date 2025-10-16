# Script completo de instalación y configuración
# Ejecutar en PowerShell normal

Write-Host "🦷 Configurando Sistema Dental Multi-Tenant..." -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

# 1. Verificar Node.js
Write-Host "`n📦 Verificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "   ✅ Node.js encontrado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Node.js no encontrado" -ForegroundColor Red
    Write-Host "   📥 Descarga Node.js desde: https://nodejs.org/" -ForegroundColor Cyan
    Write-Host "   💡 Reinicia PowerShell después de instalar Node.js" -ForegroundColor Yellow
    pause
    exit
}

# 2. Verificar si estamos en el directorio correcto
Write-Host "`n📁 Verificando estructura del proyecto..." -ForegroundColor Yellow
if (!(Test-Path "package.json")) {
    Write-Host "   ❌ package.json no encontrado" -ForegroundColor Red
    Write-Host "   💡 Asegúrate de estar en el directorio sitwo-project-main" -ForegroundColor Yellow
    pause
    exit
}

if (!(Test-Path "src")) {
    Write-Host "   ❌ Directorio src/ no encontrado" -ForegroundColor Red
    pause
    exit
}

Write-Host "   ✅ Estructura del proyecto correcta" -ForegroundColor Green

# 3. Instalar dependencias npm
Write-Host "`n📦 Instalando dependencias..." -ForegroundColor Yellow
Write-Host "   (Esto puede tomar unos minutos...)" -ForegroundColor Gray

try {
    npm install
    Write-Host "   ✅ Dependencias instaladas correctamente" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Error instalando dependencias" -ForegroundColor Red
    Write-Host "   💡 Intenta manualmente: npm install" -ForegroundColor Yellow
    pause
    exit
}

# 4. Verificar archivo .env.local
Write-Host "`n⚙️ Verificando configuración..." -ForegroundColor Yellow
if (Test-Path ".env.local") {
    Write-Host "   ✅ .env.local existe" -ForegroundColor Green
} else {
    Write-Host "   ⚠️ .env.local no encontrado, creando..." -ForegroundColor Yellow
    
    $envContent = @"
# Variables de entorno para desarrollo local
VITE_API_BASE=localhost:8000
VITE_TENANT_SUBDOMAIN=norte
VITE_ENVIRONMENT=development

# Para testing sin subdominios (opcional)
VITE_FORCE_TENANT=norte

# URLs del backend (para diferentes entornos)
VITE_BACKEND_URL=http://localhost:8000
VITE_API_URL=http://localhost:8000/api
"@
    
    $envContent | Out-File -FilePath ".env.local" -Encoding UTF8
    Write-Host "   ✅ .env.local creado" -ForegroundColor Green
}

# 5. Verificar configuración de subdominios
Write-Host "`n🌐 Verificando subdominios..." -ForegroundColor Yellow
$hostsPath = "C:\Windows\System32\drivers\etc\hosts"
$hostsContent = Get-Content $hostsPath -ErrorAction SilentlyContinue

$domainsConfigured = $true
$domains = @("norte.localhost", "sur.localhost", "este.localhost")

foreach ($domain in $domains) {
    if ($hostsContent -match "127\.0\.0\.1\s+$domain") {
        Write-Host "   ✅ $domain configurado" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $domain NO configurado" -ForegroundColor Red
        $domainsConfigured = $false
    }
}

if (-not $domainsConfigured) {
    Write-Host "`n⚠️ Subdominios no configurados" -ForegroundColor Yellow
    Write-Host "   💡 Para configurar subdominios automáticamente:" -ForegroundColor Cyan
    Write-Host "   1. Abre PowerShell como ADMINISTRADOR" -ForegroundColor White
    Write-Host "   2. Navega a este directorio" -ForegroundColor White
    Write-Host "   3. Ejecuta: .\setup-local.ps1" -ForegroundColor White
    Write-Host ""
    Write-Host "   💡 O configura manualmente editando C:\Windows\System32\drivers\etc\hosts" -ForegroundColor Cyan
    Write-Host "   Agregar estas líneas:" -ForegroundColor White
    foreach ($domain in $domains) {
        Write-Host "   127.0.0.1 $domain" -ForegroundColor Gray
    }
}

# 6. Mostrar resumen
Write-Host "`n🎉 ¡Configuración completada!" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

Write-Host "`n📋 Estado del proyecto:" -ForegroundColor Cyan
Write-Host "   ✅ Node.js instalado" -ForegroundColor Green
Write-Host "   ✅ Dependencias npm instaladas" -ForegroundColor Green
Write-Host "   ✅ Variables de entorno configuradas" -ForegroundColor Green

if ($domainsConfigured) {
    Write-Host "   ✅ Subdominios configurados" -ForegroundColor Green
} else {
    Write-Host "   ⚠️ Subdominios pendientes (ejecutar setup-local.ps1 como admin)" -ForegroundColor Yellow
}

Write-Host "`n🚀 Para iniciar el proyecto:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Iniciar frontend (este terminal):" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Iniciar backend (otra terminal):" -ForegroundColor White
Write-Host "   cd ../sitwo-project-backend-master" -ForegroundColor Gray
Write-Host "   python manage.py runserver 0.0.0.0:8000" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Acceder al sistema:" -ForegroundColor White

if ($domainsConfigured) {
    Write-Host "   🏥 Clínica Norte: http://norte.localhost:5173" -ForegroundColor Cyan
    Write-Host "   🏥 Clínica Sur:   http://sur.localhost:5173" -ForegroundColor Cyan
    Write-Host "   🏥 Clínica Este:  http://este.localhost:5173" -ForegroundColor Cyan
} else {
    Write-Host "   🏥 Temporal:      http://localhost:5173" -ForegroundColor Yellow
    Write-Host "   (Configurar subdominios para acceso completo)" -ForegroundColor Gray
}

Write-Host "`n🔧 Comandos útiles:" -ForegroundColor Cyan
Write-Host "   .\verificar-local.ps1   # Verificar configuración" -ForegroundColor Gray
Write-Host "   npm run build           # Compilar para producción" -ForegroundColor Gray
Write-Host "   npm run lint            # Verificar código" -ForegroundColor Gray

Write-Host "`n📚 Documentación:" -ForegroundColor Cyan
Write-Host "   README-LOCAL.md         # Guía completa de desarrollo local" -ForegroundColor Gray
Write-Host "   SETUP_LOCAL.md          # Configuración de subdominios" -ForegroundColor Gray

Write-Host "`n✨ ¡Todo listo para desarrollar!" -ForegroundColor Green