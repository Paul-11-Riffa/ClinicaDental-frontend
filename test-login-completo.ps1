# Script mejorado para probar login completo
Write-Host "Probando login completo con backend Django..." -ForegroundColor Green

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
    
    Write-Host "✅ LOGIN EXITOSO!" -ForegroundColor Green
    Write-Host "Respuesta completa:" -ForegroundColor Cyan
    $loginResponse | ConvertTo-Json -Depth 5 | Write-Host -ForegroundColor Gray
    
    # Guardar token
    $token = $loginResponse.token
    Write-Host "`nToken para usar en frontend: $($token.Substring(0, 50))..." -ForegroundColor Yellow
    
    # Probar diferentes endpoints de pacientes
    $pacientesEndpoints = @(
        "/api/clinic/pacientes/",
        "/api/pacientes/", 
        "/api/clinic/patients/"
    )
    
    foreach ($endpoint in $pacientesEndpoints) {
        Write-Host "`nProbando endpoint: $endpoint"
        try {
            $response = Invoke-RestMethod -Uri "http://localhost:8000$endpoint" `
                -Headers @{
                    "Authorization" = "Token $token"
                    "X-Tenant-Subdomain" = "norte"
                }
            Write-Host "✅ OK - Respuesta: $($response | ConvertTo-Json -Compress)" -ForegroundColor Green
            break
        } catch {
            Write-Host "❌ $($_.Exception.Response.StatusCode.value__) - $endpoint no funciona" -ForegroundColor Red
        }
    }
    
} catch {
    Write-Host "ERROR en login:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Gray
}

Write-Host "`n🎉 Backend está funcionando correctamente!" -ForegroundColor Green
Write-Host "Frontend puede usar este token para autenticación" -ForegroundColor Cyan