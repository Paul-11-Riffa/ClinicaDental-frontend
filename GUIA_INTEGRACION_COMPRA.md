# 🛒 Guía de Integración - Sistema de Compra (BuyDentalSmile)

## 📋 Objetivo

Integrar el sistema de compra/registro de empresas en `localhost` para que:
1. Los usuarios entren a `http://localhost:3000` (Landing Page)
2. Se registren y compren una suscripción
3. Se cree automáticamente su empresa/tenant
4. Puedan acceder a su subdominio (ej: `norte.localhost:5177`)

---

## 🏗️ Arquitectura de la Integración

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUJO COMPLETO                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Usuario → http://localhost:3000                         │
│     (Landing Page - BuyDentalSmile)                         │
│                                                              │
│  2. Usuario completa formulario de registro                 │
│     - Nombre de la empresa                                  │
│     - Email                                                  │
│     - Plan seleccionado                                     │
│                                                              │
│  3. Proceso de pago con Stripe                              │
│     - Tarjeta de crédito                                    │
│     - Confirmación de pago                                  │
│                                                              │
│  4. Backend crea:                                           │
│     ✓ Empresa/Tenant en la BD                               │
│     ✓ Usuario administrador                                 │
│     ✓ Subdominio (ej: norte)                                │
│                                                              │
│  5. Usuario redirigido a su subdominio                      │
│     → http://norte.localhost:5177/dashboard                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Estructura del Proyecto

```
workspace/
├── sitwo-project-main/              # Frontend Sistema Dental (ACTUAL)
│   ├── src/
│   ├── .env.local
│   └── package.json
│
└── BuyDentalSmile/                  # Landing Page de Compra (NUEVO)
    ├── src/
    ├── .env.local
    └── package.json
```

---

## 🚀 Paso 1: Clonar el Repositorio de Compra

```bash
# Navegar al directorio padre
cd "C:\Users\asus\Documents\Nueva carpeta (5)"

# Clonar el repositorio
git clone https://github.com/Paul-11-Riffa/BuyDentalSmile.git

# Entrar al directorio
cd BuyDentalSmile

# Instalar dependencias
npm install
```

---

## ⚙️ Paso 2: Configurar Variables de Entorno

### Para Desarrollo Local (BuyDentalSmile/.env.local)

```bash
# =============================================================================
# CONFIGURACIÓN LOCAL - BUYDENTAL
# =============================================================================

# -----------------------------------------------------------------------------
# API Y BACKEND (Mismo backend que usas actualmente)
# -----------------------------------------------------------------------------
VITE_API_URL=http://localhost:8000/api

# -----------------------------------------------------------------------------
# DOMINIO BASE
# -----------------------------------------------------------------------------
# Dominio base para los subdominios de las empresas
VITE_BASE_DOMAIN=localhost:5177

# -----------------------------------------------------------------------------
# FRONTEND URL
# -----------------------------------------------------------------------------
# URL de la landing page de compra
VITE_FRONTEND_URL=http://localhost:3000

# -----------------------------------------------------------------------------
# STRIPE - SISTEMA DE PAGOS (MODO TEST)
# -----------------------------------------------------------------------------
# Clave Pública de Stripe (Publishable Key)
# MODO TEST para desarrollo local
VITE_STRIPE_PUBLIC_KEY=pk_test_51SGSX5RxIhITCnEhwyPtoKa0LAWxHpMcr3Tw20Aqw9vkB8ncErHhIP1IvXmQjTdovbeQQMx55dGqiKqvTrJsjevj00Qd4GEebn

# -----------------------------------------------------------------------------
# MODO DESARROLLO
# -----------------------------------------------------------------------------
VITE_ENVIRONMENT=development
```

---

## 🔗 Paso 3: Modificar el Backend para Soportar Registro de Empresas

El backend necesita un endpoint para crear empresas/tenants cuando se completa el pago.

### Endpoint Requerido en Backend

```python
# backend/api/views.py

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from .models import Empresa, Usuario, TipoUsuario
import stripe

@api_view(['POST'])
@permission_classes([AllowAny])
def registrar_empresa(request):
    """
    Endpoint para registrar nueva empresa después de pago exitoso
    
    Payload esperado:
    {
        "nombre_empresa": "Clinica Norte",
        "subdominio": "norte",
        "email_admin": "admin@norte.com",
        "nombre_admin": "Juan",
        "apellido_admin": "Pérez",
        "plan": "basico",  # basico, profesional, empresarial
        "stripe_payment_intent": "pi_xxxxxxxxxxxxx"
    }
    """
    
    try:
        # Validar datos
        nombre_empresa = request.data.get('nombre_empresa')
        subdominio = request.data.get('subdominio')
        email_admin = request.data.get('email_admin')
        nombre_admin = request.data.get('nombre_admin')
        apellido_admin = request.data.get('apellido_admin')
        plan = request.data.get('plan')
        payment_intent = request.data.get('stripe_payment_intent')
        
        if not all([nombre_empresa, subdominio, email_admin, nombre_admin, apellido_admin, plan]):
            return Response({
                'error': 'Faltan datos obligatorios'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verificar que el subdominio no existe
        if Empresa.objects.filter(subdominio=subdominio).exists():
            return Response({
                'error': 'El subdominio ya existe'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verificar pago con Stripe
        stripe.api_key = settings.STRIPE_SECRET_KEY
        try:
            payment = stripe.PaymentIntent.retrieve(payment_intent)
            if payment.status != 'succeeded':
                return Response({
                    'error': 'El pago no fue exitoso'
                }, status=status.HTTP_400_BAD_REQUEST)
        except stripe.error.StripeError as e:
            return Response({
                'error': f'Error al verificar pago: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Crear empresa y usuario administrador en una transacción
        with transaction.atomic():
            # 1. Crear empresa/tenant
            empresa = Empresa.objects.create(
                nombre=nombre_empresa,
                subdominio=subdominio,
                plan=plan,
                estado='activo',
                stripe_customer_id=payment.customer,
                stripe_subscription_id=payment.get('subscription')
            )
            
            # 2. Crear usuario administrador
            tipo_admin = TipoUsuario.objects.get(codigo=1)  # 1 = Administrador
            
            usuario = Usuario.objects.create_user(
                email=email_admin,
                nombre=nombre_admin,
                apellido=apellido_admin,
                idtipousuario=tipo_admin,
                empresa=empresa,
                is_active=True
            )
            
            # Generar contraseña temporal
            password_temporal = Usuario.objects.make_random_password(length=12)
            usuario.set_password(password_temporal)
            usuario.save()
            
            # Enviar email con credenciales (implementar según tu sistema)
            # send_welcome_email(email_admin, password_temporal, subdominio)
        
        return Response({
            'success': True,
            'message': 'Empresa registrada exitosamente',
            'data': {
                'empresa_id': empresa.id,
                'subdominio': subdominio,
                'url': f'http://{subdominio}.localhost:5177',
                'email_admin': email_admin,
                # IMPORTANTE: En producción NO enviar la contraseña
                # Se debe enviar por email separado
                'password_temporal': password_temporal  # Solo para desarrollo
            }
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({
            'error': f'Error al registrar empresa: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Agregar a urls.py
from django.urls import path
from .views import registrar_empresa

urlpatterns = [
    # ... otras rutas
    path('empresas/registrar/', registrar_empresa, name='registrar_empresa'),
]
```

---

## 🎨 Paso 4: Flujo de Registro en el Frontend de Compra

### Componente de Registro con Stripe

```typescript
// BuyDentalSmile/src/components/RegistroEmpresa.tsx

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface FormData {
  nombreEmpresa: string;
  subdominio: string;
  emailAdmin: string;
  nombreAdmin: string;
  apellidoAdmin: string;
  plan: 'basico' | 'profesional' | 'empresarial';
}

const FormularioRegistro = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    nombreEmpresa: '',
    subdominio: '',
    emailAdmin: '',
    nombreAdmin: '',
    apellidoAdmin: '',
    plan: 'basico'
  });

  const planes = {
    basico: { nombre: 'Básico', precio: 29900, features: ['5 usuarios', '100 pacientes'] },
    profesional: { nombre: 'Profesional', precio: 49900, features: ['20 usuarios', '500 pacientes'] },
    empresarial: { nombre: 'Empresarial', precio: 99900, features: ['Usuarios ilimitados', 'Pacientes ilimitados'] }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Crear Payment Intent en el backend
      const { data: intentData } = await axios.post(
        `${import.meta.env.VITE_API_URL}/stripe/create-payment-intent/`,
        {
          amount: planes[formData.plan].precio,
          plan: formData.plan,
          email: formData.emailAdmin,
          empresa: formData.nombreEmpresa
        }
      );

      // 2. Confirmar pago con Stripe
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        intentData.clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: `${formData.nombreAdmin} ${formData.apellidoAdmin}`,
              email: formData.emailAdmin
            }
          }
        }
      );

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      if (paymentIntent?.status === 'succeeded') {
        // 3. Registrar empresa en el backend
        const { data: empresaData } = await axios.post(
          `${import.meta.env.VITE_API_URL}/empresas/registrar/`,
          {
            nombre_empresa: formData.nombreEmpresa,
            subdominio: formData.subdominio,
            email_admin: formData.emailAdmin,
            nombre_admin: formData.nombreAdmin,
            apellido_admin: formData.apellidoAdmin,
            plan: formData.plan,
            stripe_payment_intent: paymentIntent.id
          }
        );

        // 4. Redirigir al subdominio de la empresa
        const subdominioUrl = `http://${formData.subdominio}.localhost:5177/login`;
        
        // Mostrar mensaje de éxito con credenciales
        alert(`
          ¡Registro exitoso!
          
          Tu empresa ha sido creada.
          Subdominio: ${formData.subdominio}
          Email: ${formData.emailAdmin}
          Contraseña temporal: ${empresaData.data.password_temporal}
          
          Serás redirigido a tu panel de administración.
        `);

        // Redirigir
        window.location.href = subdominioUrl;
      }

    } catch (err: any) {
      console.error('Error en registro:', err);
      setError(err.response?.data?.error || err.message || 'Error al procesar el registro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Registra tu Clínica Dental</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Datos de la Empresa */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Datos de la Empresa</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Nombre de la Empresa</label>
            <input
              type="text"
              value={formData.nombreEmpresa}
              onChange={(e) => setFormData({ ...formData, nombreEmpresa: e.target.value })}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Subdominio (será tu URL: {formData.subdominio || 'nombre'}.localhost:5177)
            </label>
            <input
              type="text"
              value={formData.subdominio}
              onChange={(e) => setFormData({ ...formData, subdominio: e.target.value.toLowerCase() })}
              className="w-full border rounded px-3 py-2"
              placeholder="nombre-clinica"
              pattern="[a-z0-9-]+"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Solo letras minúsculas, números y guiones
            </p>
          </div>
        </div>

        {/* Datos del Administrador */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Administrador Principal</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nombre</label>
              <input
                type="text"
                value={formData.nombreAdmin}
                onChange={(e) => setFormData({ ...formData, nombreAdmin: e.target.value })}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Apellido</label>
              <input
                type="text"
                value={formData.apellidoAdmin}
                onChange={(e) => setFormData({ ...formData, apellidoAdmin: e.target.value })}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={formData.emailAdmin}
              onChange={(e) => setFormData({ ...formData, emailAdmin: e.target.value })}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
        </div>

        {/* Selección de Plan */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Selecciona tu Plan</h2>
          
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(planes).map(([key, plan]) => (
              <div
                key={key}
                className={`border-2 rounded-lg p-4 cursor-pointer ${
                  formData.plan === key ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                }`}
                onClick={() => setFormData({ ...formData, plan: key as FormData['plan'] })}
              >
                <h3 className="font-bold text-lg">{plan.nombre}</h3>
                <p className="text-2xl font-bold text-blue-600 my-2">
                  ${plan.precio.toLocaleString('es-CL')}/mes
                </p>
                <ul className="text-sm space-y-1">
                  {plan.features.map((feature, i) => (
                    <li key={i}>✓ {feature}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Tarjeta de Crédito */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Método de Pago</h2>
          
          <div className="border rounded px-3 py-3 bg-gray-50">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                  },
                  invalid: {
                    color: '#9e2146',
                  },
                },
              }}
            />
          </div>
          
          <p className="text-sm text-gray-500 mt-2">
            💳 Usa 4242 4242 4242 4242 para pruebas (cualquier fecha futura y CVC)
          </p>
        </div>

        {/* Botón de Envío */}
        <button
          type="submit"
          disabled={!stripe || loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Procesando...' : `Pagar $${planes[formData.plan].precio.toLocaleString('es-CL')} y Crear Cuenta`}
        </button>
      </form>
    </div>
  );
};

// Wrapper con Stripe Provider
export default function RegistroEmpresa() {
  return (
    <Elements stripe={stripePromise}>
      <FormularioRegistro />
    </Elements>
  );
}
```

---

## 🔄 Paso 5: Iniciar Ambos Proyectos

```bash
# Terminal 1 - Backend Django
cd sitwo-project-backend-master
python manage.py runserver 0.0.0.0:8000

# Terminal 2 - Frontend Sistema Dental (Puerto 5177)
cd sitwo-project-main
npm run dev
# Se iniciará en http://localhost:5177

# Terminal 3 - Landing Page de Compra (Puerto 3000)
cd BuyDentalSmile
npm run dev -- --port 3000
# Se iniciará en http://localhost:3000
```

---

## 🧪 Paso 6: Flujo de Prueba

### 1. Acceder a la Landing Page
```
http://localhost:3000
```

### 2. Completar el Formulario
- Nombre Empresa: "Clínica Norte"
- Subdominio: "norte"
- Nombre Admin: "Juan"
- Apellido Admin: "Pérez"
- Email: "admin@norte.com"
- Plan: "Básico"

### 3. Datos de Tarjeta de Prueba (Stripe Test Mode)
```
Número: 4242 4242 4242 4242
Fecha: Cualquier fecha futura (ej: 12/25)
CVC: Cualquier 3 dígitos (ej: 123)
```

### 4. Después del Pago Exitoso
- Se crea la empresa en la BD
- Se crea el usuario administrador
- Eres redirigido a: `http://norte.localhost:5177/login`

### 5. Iniciar Sesión
```
Email: admin@norte.com
Password: [contraseña temporal mostrada]
```

---

## 📝 Actualizar Guía de Implementación Móvil

Agregar esta sección al final de `GUIA_IMPLEMENTACION_MOVIL.md`:

```markdown
## 🛒 Sistema de Compra y Registro de Empresas

### Arquitectura Multi-Proyecto
```
localhost:3000  → Landing Page (BuyDentalSmile)
localhost:8000  → Backend API (Django)
localhost:5177  → Sistema Dental (React)
```

### Flujo de Registro
1. Usuario accede a `http://localhost:3000`
2. Completa formulario + pago Stripe
3. Backend crea empresa y usuario admin
4. Redirige a `http://{subdominio}.localhost:5177`

### Endpoints de Registro
```
POST /api/stripe/create-payment-intent/
POST /api/empresas/registrar/
```

### Variables de Entorno Requeridas
```bash
# BuyDentalSmile/.env.local
VITE_API_URL=http://localhost:8000/api
VITE_BASE_DOMAIN=localhost:5177
VITE_FRONTEND_URL=http://localhost:3000
VITE_STRIPE_PUBLIC_KEY=pk_test_...
```
```

---

## ✅ Checklist de Implementación

- [ ] Clonar repositorio BuyDentalSmile
- [ ] Instalar dependencias (`npm install`)
- [ ] Configurar `.env.local` con variables locales
- [ ] Agregar endpoint `/empresas/registrar/` en backend
- [ ] Configurar Stripe en backend (SECRET_KEY)
- [ ] Iniciar backend en puerto 8000
- [ ] Iniciar sistema dental en puerto 5177
- [ ] Iniciar landing page en puerto 3000
- [ ] Probar flujo completo de registro
- [ ] Verificar creación de empresa en BD
- [ ] Verificar acceso al subdominio creado

---

Esta guía te permitirá tener todo el flujo de compra funcionando en local sin necesidad de dominios externos.