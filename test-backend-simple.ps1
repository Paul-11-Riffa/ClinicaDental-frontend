# Script de prueba de conectividad con backend
Write-Host "Probando conectividad con backend Django..." -ForegroundColor Green

$urls = @(
    "http://localhost:8000/api/health/",
    "http://norte.localhost:8000/api/health/",
    "http://sur.localhost:8000/api/health/",
    "http://este.localhost:8000/api/health/"
)

foreach ($url in $urls) {
    Write-Host "`nProbando: $url" -ForegroundColor Yellow
    
    try {
        $response = Invoke-WebRequest -Uri $url -Method GET -TimeoutSec 5 -UseBasicParsing
        Write-Host "OK - Status: $($response.StatusCode)" -ForegroundColor Green
        Write-Host "Response: $($response.Content)" -ForegroundColor Cyan
    } catch {
        Write-Host "ERROR - No se pudo conectar" -ForegroundColor Red
        Write-Host "Detalle: $($_.Exception.Message)" -ForegroundColor Gray
    }
}

Write-Host "`nPara iniciar backend:" -ForegroundColor Yellow
Write-Host "cd ../sitwo-project-backend-master" -ForegroundColor Gray
Write-Host "python manage.py runserver 0.0.0.0:8000" -ForegroundColor Gray