# Script para probar login con backend Django
Write-Host "Probando login con backend Django..." -ForegroundColor Green

# Probar endpoint de salud primero
Write-Host "`nProbando endpoint de salud..."
try {
    $healthResponse = Invoke-WebRequest -Uri "http://localhost:8000/api/health/" -Method GET -TimeoutSec 5 -UseBasicParsing
    Write-Host "OK - Backend responde: $($healthResponse.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "ERROR - Backend no responde en puerto 8000" -ForegroundColor Red
    Write-Host "Asegurate de que Django este corriendo:" -ForegroundColor Yellow
    Write-Host "  cd ../sitwo-project-backend-master" -ForegroundColor Gray  
    Write-Host "  python manage.py runserver 0.0.0.0:8000" -ForegroundColor Gray
    exit 1
}

# Probar login de Juan Perez (Norte)
Write-Host "`nProbando login de Juan Perez..."
$loginBody = @{
    email = "juan.perez@norte.com"
    password = "norte123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:8000/api/auth/login/" `
        -Method POST `
        -Body $loginBody `
        -ContentType "application/json" `
        -Headers @{"X-Tenant-Subdomain"="norte"}
    
    Write-Host "OK - Login exitoso!" -ForegroundColor Green
    Write-Host "Token: $($loginResponse.token.Substring(0, 20))..." -ForegroundColor Cyan
    Write-Host "Usuario: $($loginResponse.usuario.nombre) $($loginResponse.usuario.apellido)" -ForegroundColor Cyan
    Write-Host "Tipo: $($loginResponse.usuario.subtipo)" -ForegroundColor Cyan
    
    # Guardar token para siguientes pruebas
    $token = $loginResponse.token
    
    # Probar endpoint de pacientes
    Write-Host "`nProbando endpoint de pacientes..."
    $pacientesResponse = Invoke-RestMethod -Uri "http://localhost:8000/api/clinic/pacientes/" `
        -Headers @{
            "Authorization" = "Token $token"
            "X-Tenant-Subdomain" = "norte"
        }
    
    Write-Host "OK - Pacientes obtenidos: $($pacientesResponse.Count) registros" -ForegroundColor Green
    
} catch {
    Write-Host "ERROR en login:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Gray
    
    if ($_.Exception.Response) {
        $errorResponse = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorResponse)
        $errorText = $reader.ReadToEnd()
        Write-Host "Respuesta del servidor: $errorText" -ForegroundColor Yellow
    }
}

Write-Host "`nPrueba completada!" -ForegroundColor Green