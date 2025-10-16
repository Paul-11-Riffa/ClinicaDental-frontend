# Script de prueba de conectividad con backend
Write-Host "🧪 Probando conectividad con backend Django..." -ForegroundColor Green

$backends = @(
    @{ Name = "Sin subdominio"; Url = "http://localhost:8000/api/health/" },
    @{ Name = "Norte"; Url = "http://norte.localhost:8000/api/health/" },
    @{ Name = "Sur"; Url = "http://sur.localhost:8000/api/health/" },
    @{ Name = "Este"; Url = "http://este.localhost:8000/api/health/" }
)

foreach ($backend in $backends) {
    Write-Host "`n🔍 Probando: $($backend.Name)" -ForegroundColor Yellow
    Write-Host "   URL: $($backend.Url)" -ForegroundColor Gray
    
    try {
        $response = Invoke-WebRequest -Uri $backend.Url -Method GET -TimeoutSec 5 -UseBasicParsing
        Write-Host "   ✅ Status: $($response.StatusCode)" -ForegroundColor Green
        
        if ($response.Content) {
            $content = $response.Content | ConvertFrom-Json -ErrorAction SilentlyContinue
            if ($content) {
                Write-Host "   📄 Response: $($content | ConvertTo-Json -Compress)" -ForegroundColor Cyan
            } else {
                Write-Host "   📄 Response: $($response.Content)" -ForegroundColor Cyan
            }
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode) {
            Write-Host "   ❌ Error $statusCode" -ForegroundColor Red
        } else {
            Write-Host "   ❌ No se pudo conectar (servidor no responde)" -ForegroundColor Red
        }
        Write-Host "   💬 Detalle: $($_.Exception.Message)" -ForegroundColor Gray
    }
}

Write-Host "`n📋 Resumen:" -ForegroundColor Cyan
Write-Host "- Si el backend Django está corriendo, deberías ver responses 200" -ForegroundColor White
Write-Host "- Si alguno responde con 404, puede que el endpoint no exista" -ForegroundColor White  
Write-Host "- Si no responde, verifica que Django esté en puerto 8000" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Para iniciar backend:" -ForegroundColor Yellow
Write-Host "   cd ../sitwo-project-backend-master" -ForegroundColor Gray
Write-Host "   python manage.py runserver 0.0.0.0:8000" -ForegroundColor Gray