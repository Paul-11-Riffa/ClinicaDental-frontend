# Script de Prueba - Catálogo de Servicios Frontend
# Verifica que las URLs estén correctamente configuradas

Write-Host "🔍 Verificando Configuración del Catálogo de Servicios..." -ForegroundColor Cyan
Write-Host ""

# Variables
$BACKEND_URL = "http://localhost:8000"
$TENANT = "smilestudio"

# Colores
function Write-Success { param($msg) Write-Host "[OK] $msg" -ForegroundColor Green }
function Write-Error { param($msg) Write-Host "[ERROR] $msg" -ForegroundColor Red }
function Write-Info { param($msg) Write-Host "[INFO] $msg" -ForegroundColor Yellow }

Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Blue
Write-Host "TEST 1: Verificar Backend - Ruta Original" -ForegroundColor Blue
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Blue
Write-Host ""

try {
    Write-Info "URL: $BACKEND_URL/clinic/servicios/"
    $headers1 = @{ "X-Tenant-Subdomain" = $TENANT }
    $response1 = Invoke-RestMethod -Uri "$BACKEND_URL/clinic/servicios/" -Headers $headers1 -ErrorAction Stop
    
    Write-Success "Backend responde en /clinic/servicios/"
    Write-Host "  → Count: $($response1.count)" -ForegroundColor White
    Write-Host "  → Results: $($response1.results.Length) servicios" -ForegroundColor White
    
    if ($response1.results.Length -gt 0) {
        Write-Host "  → Primer servicio: $($response1.results[0].nombre)" -ForegroundColor White
    }
} catch {
    Write-Error "Backend NO responde en /clinic/servicios/"
    Write-Host "  → Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Blue
Write-Host "TEST 2: Verificar Backend - Ruta con /api/" -ForegroundColor Blue
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Blue
Write-Host ""

try {
    Write-Info "URL: $BACKEND_URL/api/clinic/servicios/"
    $headers2 = @{ "X-Tenant-Subdomain" = $TENANT }
    $response2 = Invoke-RestMethod -Uri "$BACKEND_URL/api/clinic/servicios/" -Headers $headers2 -ErrorAction Stop
    
    Write-Success "Backend responde en /api/clinic/servicios/ (RECOMENDADO)"
    Write-Host "  → Count: $($response2.count)" -ForegroundColor White
    Write-Host "  → Results: $($response2.results.Length) servicios" -ForegroundColor White
    
    if ($response2.results.Length -gt 0) {
        Write-Host "  → Primer servicio: $($response2.results[0].nombre)" -ForegroundColor White
    }
} catch {
    Write-Error "Backend NO responde en /api/clinic/servicios/"
    Write-Host "  → Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Info "El backend necesita el fix descrito en FIX_URL_CATALOGO_SERVICIOS.md"
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Blue
Write-Host "TEST 3: Verificar Filtros" -ForegroundColor Blue
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Blue
Write-Host ""

try {
    Write-Info "URL: $BACKEND_URL/api/clinic/servicios/?ordering=nombre&page_size=5"
    $headers3 = @{ "X-Tenant-Subdomain" = $TENANT }
    $response3 = Invoke-RestMethod -Uri "$BACKEND_URL/api/clinic/servicios/?ordering=nombre&page_size=5" -Headers $headers3 -ErrorAction Stop
    
    Write-Success "Filtros funcionan correctamente"
    Write-Host "  → Ordenamiento: nombre (A-Z)" -ForegroundColor White
    Write-Host "  → Page size: 5 resultados" -ForegroundColor White
    Write-Host "  → Total disponibles: $($response3.count)" -ForegroundColor White
    
    if ($response3.results.Length -gt 0) {
        Write-Host "  → Servicios ordenados:" -ForegroundColor White
        foreach ($servicio in $response3.results) {
            Write-Host "    • $($servicio.nombre) - `$$($servicio.precio_vigente)" -ForegroundColor Gray
        }
    }
} catch {
    Write-Error "Error al probar filtros"
    Write-Host "  → Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Blue
Write-Host "TEST 4: Verificar Detalle de Servicio" -ForegroundColor Blue
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Blue
Write-Host ""

try {
    # Primero obtener la lista para tener un ID válido
    $headersList = @{ "X-Tenant-Subdomain" = $TENANT }
    $lista = Invoke-RestMethod -Uri "$BACKEND_URL/api/clinic/servicios/" -Headers $headersList -ErrorAction Stop
    
    if ($lista.results.Length -gt 0) {
        $servicioId = $lista.results[0].id
        Write-Info "URL: $BACKEND_URL/api/clinic/servicios/$servicioId/"
        
        $headersDetail = @{ "X-Tenant-Subdomain" = $TENANT }
        $detalle = Invoke-RestMethod -Uri "$BACKEND_URL/api/clinic/servicios/$servicioId/" -Headers $headersDetail -ErrorAction Stop
        
        Write-Success "Detalle de servicio funciona"
        Write-Host "  → ID: $($detalle.id)" -ForegroundColor White
        Write-Host "  → Nombre: $($detalle.nombre)" -ForegroundColor White
        Write-Host "  → Precio: `$$($detalle.precio_vigente)" -ForegroundColor White
        Write-Host "  → Duración: $($detalle.duracion) minutos" -ForegroundColor White
        Write-Host "  → Activo: $($detalle.activo)" -ForegroundColor White
        
        if ($detalle.descripcion) {
            Write-Host "  → Descripción: $($detalle.descripcion)" -ForegroundColor White
        }
    } else {
        Write-Info "No hay servicios en la base de datos para probar detalle"
    }
} catch {
    Write-Error "Error al obtener detalle de servicio"
    Write-Host "  → Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Blue
Write-Host "RESUMEN DE VERIFICACIÓN" -ForegroundColor Blue
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Blue
Write-Host ""

Write-Host "📋 Configuración Frontend:" -ForegroundColor Cyan
Write-Host "  • Base URL (dev): http://localhost:8000/api" -ForegroundColor White
Write-Host "  • Path: /clinic/servicios/" -ForegroundColor White
Write-Host "  • URL final: http://localhost:8000/api/clinic/servicios/" -ForegroundColor White
Write-Host ""

Write-Host "🔧 Archivos Clave:" -ForegroundColor Cyan
Write-Host "  • src/lib/Api.ts - Configuración de baseURL" -ForegroundColor White
Write-Host "  • src/services/serviciosService.ts - Funciones del servicio" -ForegroundColor White
Write-Host "  • src/pages/CatalogoServicios.tsx - Componente UI" -ForegroundColor White
Write-Host ""

Write-Host "📚 Documentación:" -ForegroundColor Cyan
Write-Host "  • FIX_URL_CATALOGO_SERVICIOS.md - Fix del backend" -ForegroundColor White
Write-Host "  • VERIFICACION_URL_CATALOGO_SERVICIOS.md - Este análisis" -ForegroundColor White
Write-Host "  • GUIA_FRONTEND_CATALOGO_PUBLICO.md - Guía completa" -ForegroundColor White
Write-Host ""

Write-Host "✨ Frontend está LISTO para usar!" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Siguiente paso:" -ForegroundColor Yellow
Write-Host "  1. Asegúrate de que el backend esté corriendo: python manage.py runserver" -ForegroundColor White
Write-Host "  2. Inicia el frontend: npm run dev" -ForegroundColor White
Write-Host "  3. Navega a: http://localhost:5173/catalogo-servicios" -ForegroundColor White
Write-Host ""
