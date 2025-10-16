# Setup Local - Sistema Dental Multi-Tenant
# Ejecutar como Administrador

Write-Host "🚀 Configurando Sistema Dental para desarrollo local..." -ForegroundColor Green

# Verificar si se ejecuta como administrador
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "❌ Error: Este script debe ejecutarse como Administrador" -ForegroundColor Red
    Write-Host "Haz clic derecho en PowerShell y selecciona 'Ejecutar como administrador'" -ForegroundColor Yellow
    pause
    exit
}

# 1. Configurar archivo hosts
Write-Host "📝 Configurando archivo hosts..." -ForegroundColor Yellow

$hostsPath = "C:\Windows\System32\drivers\etc\hosts"
$hostsContent = Get-Content $hostsPath -ErrorAction SilentlyContinue

# Verificar si ya están configurados los subdominios
$needsUpdate = $false
$entries = @(
    "127.0.0.1 localhost",
    "127.0.0.1 norte.localhost", 
    "127.0.0.1 sur.localhost",
    "127.0.0.1 este.localhost",
    "127.0.0.1 admin.localhost"
)

foreach ($entry in $entries) {
    if ($hostsContent -notcontains $entry) {
        $needsUpdate = $true
        break
    }
}

if ($needsUpdate) {
    Write-Host "   Agregando entradas al archivo hosts..." -ForegroundColor Cyan
    
    # Hacer backup
    Copy-Item $hostsPath "$hostsPath.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')" -ErrorAction SilentlyContinue
    
    # Agregar entradas
    Add-Content $hostsPath ""
    Add-Content $hostsPath "# === Dental Clinic Multi-Tenant ==="
    foreach ($entry in $entries) {
        if ($hostsContent -notcontains $entry) {
            Add-Content $hostsPath $entry
            Write-Host "   ✅ Agregado: $entry" -ForegroundColor Green
        }
    }
    Add-Content $hostsPath "# === End Dental Clinic ==="
} else {
    Write-Host "   ✅ Archivo hosts ya configurado" -ForegroundColor Green
}

# 2. Limpiar DNS
Write-Host "🔄 Limpiando caché DNS..." -ForegroundColor Yellow
try {
    ipconfig /flushdns | Out-Null
    Write-Host "   ✅ DNS cache limpiado" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️ No se pudo limpiar DNS cache (no es crítico)" -ForegroundColor Yellow
}

# 3. Verificar configuración
Write-Host "🔍 Verificando configuración..." -ForegroundColor Yellow

$testDomains = @("localhost", "norte.localhost", "sur.localhost", "este.localhost")
foreach ($domain in $testDomains) {
    try {
        $result = Test-NetConnection $domain -Port 80 -InformationLevel Quiet -WarningAction SilentlyContinue
        if ($result) {
            Write-Host "   ✅ $domain - OK" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️ $domain - No responde (normal si el backend no está corriendo)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "   ⚠️ $domain - Error en verificación" -ForegroundColor Yellow
    }
}

# 4. Mostrar instrucciones finales
Write-Host ""
Write-Host "🎉 ¡Configuración completada!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos pasos:" -ForegroundColor Cyan
Write-Host "1. Instalar dependencias:" -ForegroundColor White
Write-Host "   npm install" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Iniciar el frontend:" -ForegroundColor White  
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Iniciar el backend Django (en otra terminal):" -ForegroundColor White
Write-Host "   python manage.py runserver 0.0.0.0:8000" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Acceder al sistema:" -ForegroundColor White
Write-Host "   • Clínica Norte: http://norte.localhost:5173" -ForegroundColor Gray
Write-Host "   • Clínica Sur:   http://sur.localhost:5173" -ForegroundColor Gray
Write-Host "   • Clínica Este:  http://este.localhost:5173" -ForegroundColor Gray
Write-Host ""
Write-Host "🔧 Para problemas de conexión, verificar que el backend esté en puerto 8000" -ForegroundColor Yellow

pause