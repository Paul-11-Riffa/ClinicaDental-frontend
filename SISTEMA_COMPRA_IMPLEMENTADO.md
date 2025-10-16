# 🎯 Sistema de Compra Implementado - Frontend

## ✅ Lo que ya está listo

### 1. **Página de Landing/Compra** (`src/pages/LandingCompra.tsx`)
- ✅ Hero section con llamado a la acción
- ✅ Sección de características del producto
- ✅ Tarjetas de planes (Básico, Profesional, Premium)
- ✅ Formulario de registro en 3 pasos:
  - **Paso 1**: Datos de la empresa (nombre, subdominio, teléfono, dirección)
  - **Paso 2**: Datos del administrador (nombre, email, RUT, teléfono)
  - **Paso 3**: Selección de plan y pago con Stripe

### 2. **Servicio de Empresas** (`src/services/empresaService.ts`)
- ✅ `crearPaymentIntent()` - Crear intención de pago en Stripe
- ✅ `registrarEmpresa()` - Registrar empresa después del pago exitoso
- ✅ `verificarSubdominio()` - Verificar disponibilidad de subdominio en tiempo real
- ✅ `obtenerPlanes()` - Obtener lista de planes disponibles

### 3. **Integración de Stripe**
- ✅ Stripe.js instalado (`@stripe/stripe-js`, `@stripe/react-stripe-js`)
- ✅ Elemento CardElement para captura segura de tarjetas
- ✅ Confirmación de pago con `stripe.confirmCardPayment()`
- ✅ Clave pública configurada en `.env.local`

### 4. **Router Actualizado** (`src/Router.tsx`)
- ✅ Detección automática de subdominio
- ✅ Si NO hay subdominio (localhost) → Muestra `LandingCompra`
- ✅ Si hay subdominio (norte.localhost) → Muestra `Home` normal
- ✅ Flujo: Compra en localhost → Redirección a {subdominio}.localhost:5177/login

### 5. **Variables de Entorno** (`.env.local`)
```bash
VITE_STRIPE_PUBLIC_KEY=pk_test_51SGSX5RxIhITCnEhwyPtoKa0LAWxHpMcr3Tw20Aqw9vkB8ncErHhIP1IvXmQjTdovbeQQMx55dGqiKqvTrJsjevj00Qd4GEebn
VITE_BASE_DOMAIN=localhost:5177  # Para desarrollo
VITE_API_URL=http://localhost:8000/api
```

---

## 🔧 Lo que falta en el Backend

### 1. **Endpoint: Crear Payment Intent**
```python
# POST /api/empresas/crear-payment-intent/
{
    "amount": 49990,  # Precio en pesos chilenos
    "plan": "profesional"
}

# Respuesta esperada:
{
    "clientSecret": "pi_xxxxx_secret_xxxxx",
    "paymentIntentId": "pi_xxxxx"
}
```

**Implementación requerida:**
```python
import stripe
from django.conf import settings

stripe.api_key = settings.STRIPE_SECRET_KEY

@api_view(['POST'])
def crear_payment_intent(request):
    amount = request.data.get('amount')
    plan = request.data.get('plan')
    
    intent = stripe.PaymentIntent.create(
        amount=int(amount * 100),  # Stripe usa centavos
        currency='clp',
        metadata={'plan': plan}
    )
    
    return Response({
        'clientSecret': intent.client_secret,
        'paymentIntentId': intent.id
    })
```

### 2. **Endpoint: Registrar Empresa**
```python
# POST /api/empresas/registrar/
{
    "nombre_empresa": "Clínica Dental Norte",
    "subdominio": "norte",
    "telefono": "+56912345678",
    "direccion": "Av. Principal 123",
    "nombre_admin": "Juan",
    "apellido_admin": "Pérez",
    "email_admin": "juan@clinica.cl",
    "rut_admin": "12345678-9",
    "telefono_admin": "+56987654321",
    "plan": "profesional",
    "payment_intent_id": "pi_xxxxx"
}

# Respuesta esperada:
{
    "success": true,
    "message": "Empresa registrada exitosamente",
    "empresa_id": 123,
    "subdominio": "norte",
    "redirect_url": "http://norte.localhost:5177/login"
}
```

**Implementación requerida:**
```python
@api_view(['POST'])
@transaction.atomic
def registrar_empresa(request):
    # 1. Verificar pago en Stripe
    payment_intent_id = request.data.get('payment_intent_id')
    intent = stripe.PaymentIntent.retrieve(payment_intent_id)
    
    if intent.status != 'succeeded':
        return Response({'error': 'Pago no completado'}, status=400)
    
    # 2. Crear empresa (tenant)
    empresa = Empresa.objects.create(
        nombre=request.data.get('nombre_empresa'),
        subdominio=request.data.get('subdominio'),
        telefono=request.data.get('telefono'),
        direccion=request.data.get('direccion'),
        plan=request.data.get('plan'),
        activa=True
    )
    
    # 3. Crear usuario administrador
    usuario = Usuario.objects.create_user(
        email=request.data.get('email_admin'),
        nombre=request.data.get('nombre_admin'),
        apellido=request.data.get('apellido_admin'),
        rut=request.data.get('rut_admin'),
        telefono=request.data.get('telefono_admin'),
        tipo_usuario=TipoUsuario.ADMINISTRADOR,
        empresa=empresa
    )
    
    # 4. Configurar base de datos del tenant
    setup_tenant_database(empresa.subdominio)
    
    return Response({
        'success': True,
        'message': 'Empresa registrada exitosamente',
        'empresa_id': empresa.id,
        'subdominio': empresa.subdominio,
        'redirect_url': f'http://{empresa.subdominio}.localhost:5177/login'
    })
```

### 3. **Endpoint: Verificar Subdominio**
```python
# POST /api/public/validar-subdomain/
{
    "subdomain": "norte"
}

# Respuesta esperada:
{
    "ok": true,
    "disponible": true,  # o false si ya existe
    "subdomain": "norte",
    "mensaje": "El subdominio está disponible"
}
```

**✅ Frontend ya actualizado** - El servicio `empresaService.ts` ya está configurado correctamente para usar este endpoint.

**Implementación requerida en Backend:**
```python
@api_view(['POST'])
def validar_subdomain(request):
    subdomain = request.data.get('subdomain', '').strip().lower()
    
    # Validar formato
    if not re.match(r'^[a-z0-9-]{3,}$', subdomain):
        return Response({
            'ok': True,
            'disponible': False,
            'subdomain': subdomain,
            'mensaje': 'Formato inválido. Solo letras minúsculas, números y guiones (mínimo 3 caracteres)'
        })
    
    # Verificar si existe
    existe = Empresa.objects.filter(subdominio=subdomain).exists()
    
    return Response({
        'ok': True,
        'disponible': not existe,
        'subdomain': subdomain,
        'mensaje': 'El subdominio está disponible' if not existe else 'Este subdominio ya está en uso.'
    })
```

### 4. **Variables de Entorno Backend**
```bash
# settings.py o .env del backend
STRIPE_SECRET_KEY=sk_test_xxxxx  # Clave SECRETA de Stripe (NUNCA en frontend)
STRIPE_PUBLIC_KEY=pk_test_xxxxx  # Misma que en frontend
STRIPE_WEBHOOK_SECRET=whsec_xxxxx  # Para webhooks de Stripe
```

---

## 🚀 Flujo Completo del Sistema

```
1. Usuario accede a http://localhost:5177
   ↓
2. Router detecta NO HAY subdominio → Muestra LandingCompra
   ↓
3. Usuario completa formulario de 3 pasos
   ↓
4. Frontend llama POST /api/empresas/crear-payment-intent/
   ↓
5. Backend crea PaymentIntent en Stripe
   ↓
6. Frontend muestra CardElement de Stripe
   ↓
7. Usuario ingresa tarjeta y confirma
   ↓
8. Stripe procesa el pago
   ↓
9. Frontend llama POST /api/empresas/registrar/ con payment_intent_id
   ↓
10. Backend verifica pago, crea empresa y usuario admin
    ↓
11. Backend configura base de datos del tenant
    ↓
12. Backend responde con success y redirect_url
    ↓
13. Frontend redirige a http://norte.localhost:5177/login
    ↓
14. Usuario inicia sesión en su nueva clínica
```

---

## 🧪 Cómo Probar en Desarrollo

### Tarjetas de Prueba de Stripe
```
✅ Pago Exitoso:
   Número: 4242 4242 4242 4242
   Fecha: Cualquier fecha futura (12/25)
   CVC: Cualquier 3 dígitos (123)
   ZIP: Cualquier código (12345)

❌ Pago Rechazado:
   Número: 4000 0000 0000 0002
   (Para probar manejo de errores)
```

### Pasos para Probar:

1. **Iniciar backend:**
   ```bash
   cd backend
   python manage.py runserver 0.0.0.0:8000
   ```

2. **Iniciar frontend:**
   ```bash
   npm run dev
   ```

3. **Acceder a landing:**
   - URL: `http://localhost:5177` (SIN subdominio)
   - Debe mostrar la página de compra

4. **Completar registro:**
   - Llenar datos de empresa (subdominio: "prueba")
   - Llenar datos de admin
   - Usar tarjeta de prueba Stripe
   - Completar pago

5. **Verificar redirección:**
   - Debe redirigir a `http://prueba.localhost:5177/login`
   - Allí puede iniciar sesión con las credenciales creadas

---

## 📋 Checklist de Implementación Backend

- [ ] Instalar `stripe` en Python: `pip install stripe`
- [ ] Configurar `STRIPE_SECRET_KEY` en settings
- [ ] Crear endpoint `/api/empresas/crear-payment-intent/`
- [ ] Crear endpoint `/api/empresas/registrar/`
- [ ] Crear endpoint `/api/empresas/verificar-subdominio/`
- [ ] Implementar lógica de multi-tenancy (crear BD del tenant)
- [ ] Configurar CORS para permitir localhost:5177
- [ ] Probar con tarjetas de prueba de Stripe
- [ ] (Opcional) Configurar webhooks de Stripe para confirmaciones

---

## 🎨 Personalización

### Cambiar Planes
Edita `src/services/empresaService.ts` en la función `obtenerPlanes()`:

```typescript
export const obtenerPlanes = (): Plan[] => {
  return [
    {
      id: 'basico',
      nombre: 'Plan Básico',
      precio: 29990,  // Cambiar precio
      caracteristicas: [
        'Tu característica aquí',
        // ...
      ]
    },
    // ...
  ];
};
```

### Cambiar Dominio Base
Actualiza `.env.local`:
```bash
# Desarrollo
VITE_BASE_DOMAIN=localhost:5177

# Producción
VITE_BASE_DOMAIN=tudominio.com
```

---

## 🔒 Seguridad

### ✅ Buenas Prácticas Implementadas:
- Stripe maneja datos de tarjetas (PCI compliance)
- Solo clave PÚBLICA de Stripe en frontend
- Validación de subdominio en tiempo real
- Verificación de pago en backend antes de crear empresa

### ⚠️ Pendientes en Backend:
- Encriptar datos sensibles en BD
- Rate limiting en endpoints de registro
- Validación de RUT chileno
- Email de confirmación al administrador
- Logs de auditoría para pagos

---

¡El frontend está 100% listo! Solo falta implementar los 3 endpoints en el backend Django. 🚀
