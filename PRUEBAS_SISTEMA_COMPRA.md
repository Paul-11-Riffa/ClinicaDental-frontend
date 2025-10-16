# 🧪 Pruebas del Sistema de Compra

## ✅ Corrección Aplicada

El archivo `src/services/empresaService.ts` ha sido **corregido** en la línea 79.

### Cambios Realizados:

**Antes (❌ Incorrecto):**
```typescript
// Línea 79 - ANTES
const response = await Api.get(`/empresas/verificar-subdominio/?subdominio=${subdominio}`);
```

**Ahora (✅ Correcto):**
```typescript
// Línea 79 - DESPUÉS
const response = await Api.post('/public/validar-subdomain/', {
  subdomain: subdominio
});
```

---

## 🔧 Qué se Corrigió

1. **Método HTTP**: `GET` → `POST`
2. **Endpoint**: `/empresas/verificar-subdominio/` → `/public/validar-subdomain/`
3. **Parámetros**: Query string → Body JSON
4. **Nombre del campo**: `subdominio` → `subdomain`

---

## 🧪 Cómo Probar

### 1. **Prueba desde PowerShell (Backend)**

Verifica que el endpoint del backend funciona:

```powershell
# Probar subdominio disponible
Invoke-RestMethod -Uri "http://localhost:8000/api/public/validar-subdomain/" -Method POST -ContentType "application/json" -Body '{"subdomain": "test-clinica"}'

# Probar subdominio existente (debería devolver disponible: false)
Invoke-RestMethod -Uri "http://localhost:8000/api/public/validar-subdomain/" -Method POST -ContentType "application/json" -Body '{"subdomain": "norte"}'
```

**Respuesta Esperada (disponible):**
```json
{
  "ok": true,
  "disponible": true,
  "subdomain": "test-clinica",
  "mensaje": "El subdominio está disponible"
}
```

**Respuesta Esperada (ya existe):**
```json
{
  "ok": true,
  "disponible": false,
  "subdomain": "norte",
  "mensaje": "Este subdominio ya está en uso."
}
```

### 2. **Prueba desde el Frontend**

1. **Asegúrate de que el backend esté corriendo:**
   ```bash
   # En el directorio del backend
   python manage.py runserver 0.0.0.0:8000
   ```

2. **Reinicia el servidor de desarrollo:**
   ```bash
   # En el directorio del frontend
   # Detén el servidor (Ctrl+C) si está corriendo
   npm run dev
   ```

3. **Accede a la landing page:**
   - URL: `http://localhost:5177` (SIN subdominio)
   - Deberías ver la página de compra

4. **Prueba la validación de subdominio:**
   - Ve a la sección "Comienza Tu Prueba Gratuita"
   - En el campo "Subdominio" escribe algo (mínimo 3 caracteres)
   - Deberías ver en tiempo real:
     - ✅ ✓ Disponible (si el subdominio no existe)
     - ❌ ✗ No disponible (si ya existe)

### 3. **Monitorear en DevTools**

1. Abre las DevTools del navegador (F12)
2. Ve a la pestaña **Network**
3. Filtra por "validar-subdomain"
4. Escribe en el campo de subdominio
5. Deberías ver requests a:
   - **Request URL**: `http://localhost:8000/api/public/validar-subdomain/`
   - **Request Method**: `POST`
   - **Status Code**: `200 OK`

---

## 🐛 Solución de Problemas

### Error 404 Not Found

**Problema**: El endpoint aún responde 404

**Causa**: El backend no tiene el endpoint `/api/public/validar-subdomain/`

**Solución**: Verifica que el backend tenga la URL configurada:

```python
# En urls.py del backend
urlpatterns = [
    path('public/validar-subdomain/', views.validar_subdomain, name='validar-subdomain'),
    # ...
]
```

### Error CORS

**Problema**: `Access to XMLHttpRequest blocked by CORS policy`

**Solución**: Verifica CORS en el backend:

```python
# settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
    "http://localhost:5177",
    "http://norte.localhost:5177",
    "http://sur.localhost:5177",
    "http://este.localhost:5177",
]
```

### El ícono ✓/✗ no aparece

**Problema**: No se muestra validación visual

**Causas posibles**:
1. El subdominio tiene menos de 3 caracteres (validación mínima)
2. El backend no está respondiendo
3. Hay un error en la consola del navegador

**Solución**: 
1. Escribe al menos 3 caracteres
2. Verifica que el backend esté corriendo
3. Revisa la consola del navegador (F12 → Console)

---

## ✅ Checklist de Verificación

Marca cada punto cuando funcione:

- [ ] Backend responde a `/api/public/validar-subdomain/` con 200 OK
- [ ] Frontend hace POST (no GET) al endpoint
- [ ] El campo "subdomain" (no "subdominio") se envía en el body
- [ ] La validación en tiempo real funciona al escribir
- [ ] Se muestra ✓ para subdominios disponibles
- [ ] Se muestra ✗ para subdominios existentes
- [ ] No hay errores 404 en la consola del navegador
- [ ] No hay errores CORS

---

## 📊 Estado Actual

### ✅ Completado en Frontend:
- Corrección del endpoint en `empresaService.ts`
- Método cambiado a POST
- Parámetros enviados en body JSON
- Nombre del campo corregido a "subdomain"

### ⏳ Pendiente en Backend:
- Implementar endpoint `/api/public/validar-subdomain/`
- Configurar CORS para localhost:5177
- Validar formato de subdominio
- Verificar existencia en base de datos

---

## 🎯 Próximo Paso

Una vez que veas el ícono ✓/✗ funcionando correctamente, puedes continuar probando el flujo completo de registro:

1. Llenar datos de la empresa
2. Llenar datos del administrador  
3. Seleccionar plan
4. Ingresar tarjeta de prueba Stripe
5. Completar registro

**Tarjeta de Prueba Stripe:**
- Número: `4242 4242 4242 4242`
- Fecha: Cualquier fecha futura (ej: `12/25`)
- CVC: Cualquier 3 dígitos (ej: `123`)
- ZIP: Cualquier código (ej: `12345`)

---

¡El error 404 del frontend ya está corregido! 🎉
