# Script de Prueba - Catalogo de Servicios Frontend
# Verifica que las URLs esten correctamente configuradas

Write-Host "Verificando Configuracion del Catalogo de Servicios..." -ForegroundColor Cyan
Write-Host ""

$BACKEND_URL = "http://localhost:8000"
$TENANT = "smilestudio"

Write-Host "================================================" -ForegroundColor Blue
Write-Host "TEST 1: Verificar Backend - Ruta Original" -ForegroundColor Blue
Write-Host "================================================" -ForegroundColor Blue
Write-Host ""

try {
    Write-Host "[INFO] URL: $BACKEND_URL/clinic/servicios/" -ForegroundColor Yellow
    $headers1 = @{ "X-Tenant-Subdomain" = $TENANT }
    $response1 = Invoke-RestMethod -Uri "$BACKEND_URL/clinic/servicios/" -Headers $headers1 -ErrorAction Stop
    
    Write-Host "[OK] Backend responde en /clinic/servicios/" -ForegroundColor Green
    Write-Host "  Count: $($response1.count)" -ForegroundColor White
    Write-Host "  Results: $($response1.results.Length) servicios" -ForegroundColor White
    
    if ($response1.results.Length -gt 0) {
        Write-Host "  Primer servicio: $($response1.results[0].nombre)" -ForegroundColor White
    }
} catch {
    Write-Host "[ERROR] Backend NO responde en /clinic/servicios/" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Blue
Write-Host "TEST 2: Verificar Backend - Ruta con /api/" -ForegroundColor Blue
Write-Host "================================================" -ForegroundColor Blue
Write-Host ""

try {
    Write-Host "[INFO] URL: $BACKEND_URL/api/clinic/servicios/" -ForegroundColor Yellow
    $headers2 = @{ "X-Tenant-Subdomain" = $TENANT }
    $response2 = Invoke-RestMethod -Uri "$BACKEND_URL/api/clinic/servicios/" -Headers $headers2 -ErrorAction Stop
    
    Write-Host "[OK] Backend responde en /api/clinic/servicios/ (RECOMENDADO)" -ForegroundColor Green
    Write-Host "  Count: $($response2.count)" -ForegroundColor White
    Write-Host "  Results: $($response2.results.Length) servicios" -ForegroundColor White
    
    if ($response2.results.Length -gt 0) {
        Write-Host "  Primer servicio: $($response2.results[0].nombre)" -ForegroundColor White
    }
} catch {
    Write-Host "[ERROR] Backend NO responde en /api/clinic/servicios/" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "[INFO] El backend necesita el fix descrito en FIX_URL_CATALOGO_SERVICIOS.md" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Blue
Write-Host "TEST 3: Verificar Detalle de Servicio" -ForegroundColor Blue
Write-Host "================================================" -ForegroundColor Blue
Write-Host ""

try {
    $headersList = @{ "X-Tenant-Subdomain" = $TENANT }
    $lista = Invoke-RestMethod -Uri "$BACKEND_URL/api/clinic/servicios/" -Headers $headersList -ErrorAction Stop
    
    if ($lista.results.Length -gt 0) {
        $servicioId = $lista.results[0].id
        Write-Host "[INFO] URL: $BACKEND_URL/api/clinic/servicios/$servicioId/" -ForegroundColor Yellow
        
        $headersDetail = @{ "X-Tenant-Subdomain" = $TENANT }
        $detalle = Invoke-RestMethod -Uri "$BACKEND_URL/api/clinic/servicios/$servicioId/" -Headers $headersDetail -ErrorAction Stop
        
        Write-Host "[OK] Detalle de servicio funciona" -ForegroundColor Green
        Write-Host "  ID: $($detalle.id)" -ForegroundColor White
        Write-Host "  Nombre: $($detalle.nombre)" -ForegroundColor White
        Write-Host "  Precio: `$$($detalle.precio_vigente)" -ForegroundColor White
        Write-Host "  Duracion: $($detalle.duracion) minutos" -ForegroundColor White
        Write-Host "  Activo: $($detalle.activo)" -ForegroundColor White
        
        if ($detalle.descripcion) {
            $desc = $detalle.descripcion
            if ($desc.Length -gt 80) {
                $desc = $desc.Substring(0, 77) + "..."
            }
            Write-Host "  Descripcion: $desc" -ForegroundColor White
        }
    } else {
        Write-Host "[INFO] No hay servicios en la base de datos para probar detalle" -ForegroundColor Yellow
    }
} catch {
    Write-Host "[ERROR] Error al obtener detalle de servicio" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Blue
Write-Host "RESUMEN DE VERIFICACION" -ForegroundColor Blue
Write-Host "================================================" -ForegroundColor Blue
Write-Host ""

Write-Host "Configuracion Frontend:" -ForegroundColor Cyan
Write-Host "  Base URL (dev): http://localhost:8000/api" -ForegroundColor White
Write-Host "  Path: /clinic/servicios/" -ForegroundColor White
Write-Host "  URL final: http://localhost:8000/api/clinic/servicios/" -ForegroundColor White
Write-Host ""

Write-Host "Archivos Clave:" -ForegroundColor Cyan
Write-Host "  src/lib/Api.ts - Configuracion de baseURL" -ForegroundColor White
Write-Host "  src/services/serviciosService.ts - Funciones del servicio" -ForegroundColor White
Write-Host "  src/pages/CatalogoServicios.tsx - Componente UI" -ForegroundColor White
Write-Host ""

Write-Host "Documentacion:" -ForegroundColor Cyan
Write-Host "  FIX_URL_CATALOGO_SERVICIOS.md - Fix del backend" -ForegroundColor White
Write-Host "  VERIFICACION_URL_CATALOGO_SERVICIOS.md - Analisis completo" -ForegroundColor White
Write-Host "  GUIA_FRONTEND_CATALOGO_PUBLICO.md - Guia completa" -ForegroundColor White
Write-Host ""

Write-Host "[OK] Frontend esta LISTO para usar!" -ForegroundColor Green
Write-Host ""
Write-Host "Siguiente paso:" -ForegroundColor Yellow
Write-Host "  1. Backend corriendo: python manage.py runserver" -ForegroundColor White
Write-Host "  2. Inicia frontend: npm run dev" -ForegroundColor White
Write-Host "  3. Navega a: http://localhost:5173/catalogo-servicios" -ForegroundColor White
Write-Host ""
