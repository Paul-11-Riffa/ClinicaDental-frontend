# 🌐 Guía de Integración Web - Sistema de Compra (BuyDentalSmile)

## 📋 Objetivo

Integrar el sistema de compra/registro de empresas en **WEB** para que:
1. Los usuarios entren a `http://localhost:3000` (Landing Page Web)
2. Se registren y compren una suscripción vía web
3. Se cree automáticamente su empresa/tenant
4. Puedan acceder a su subdominio web (ej: `norte.localhost:5177`)

---

## 🏗️ Arquitectura Web Multi-Proyecto

```
┌─────────────────────────────────────────────────────────────┐
│                    ESTRUCTURA WEB                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  📁 workspace/                                              │
│    ├── sitwo-project-main/         (Puerto 5177)           │
│    │   ├── Sistema Dental (React)                          │
│    │   ├── Subdominios: norte/sur/este.localhost:5177      │
│    │   └── Para clínicas ya registradas                     │
│    │                                                         │
│    ├── BuyDentalSmile/             (Puerto 3000)           │
│    │   ├── Landing Page (React)                            │
│    │   ├── localhost:3000                                   │
│    │   └── Registro + Pago con Stripe                       │
│    │                                                         │
│    └── backend/                    (Puerto 8000)           │
│        ├── API Django                                       │
│        ├── Multi-tenant                                     │
│        └── Procesamiento de pagos                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Paso 1: Clonar Repositorio BuyDentalSmile

```bash
# Abrir PowerShell y navegar al directorio padre
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

Crear archivo `.env.local` en `BuyDentalSmile/`:

```bash
# =============================================================================
# CONFIGURACIÓN LOCAL WEB - BUYDENTAL
# =============================================================================

# -----------------------------------------------------------------------------
# API Y BACKEND (Mismo backend que usas actualmente)
# -----------------------------------------------------------------------------
VITE_API_URL=http://localhost:8000/api

# -----------------------------------------------------------------------------
# DOMINIO BASE PARA WEB
# -----------------------------------------------------------------------------
# Dominio base para los subdominios de las empresas
# Desarrollo: localhost:5177
# Producción: notificct.dpdns.org
VITE_BASE_DOMAIN=localhost:5177

# -----------------------------------------------------------------------------
# FRONTEND URL (Landing Page Web)
# -----------------------------------------------------------------------------
# URL de la landing page de compra
VITE_FRONTEND_URL=http://localhost:3000

# -----------------------------------------------------------------------------
# STRIPE - SISTEMA DE PAGOS (MODO TEST WEB)
# -----------------------------------------------------------------------------
# Clave Pública de Stripe (Publishable Key)
# MODO TEST para desarrollo local web
VITE_STRIPE_PUBLIC_KEY=pk_test_51SGSX5RxIhITCnEhwyPtoKa0LAWxHpMcr3Tw20Aqw9vkB8ncErHhIP1IvXmQjTdovbeQQMx55dGqiKqvTrJsjevj00Qd4GEebn

# -----------------------------------------------------------------------------
# MODO DESARROLLO WEB
# -----------------------------------------------------------------------------
VITE_ENVIRONMENT=development
VITE_PLATFORM=web
```

---

## 🔗 Paso 3: Endpoints Backend para Registro Web

### 3.1 Endpoint: Crear Payment Intent (Stripe)

```python
# backend/api/views/stripe_views.py

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
import stripe
from django.conf import settings

stripe.api_key = settings.STRIPE_SECRET_KEY

@api_view(['POST'])
@permission_classes([AllowAny])
def create_payment_intent(request):
    """
    Crea un Payment Intent para procesar el pago web
    
    Payload:
    {
        "amount": 29900,
        "plan": "basico",
        "email": "admin@norte.com",
        "empresa": "Clinica Norte"
    }
    """
    try:
        amount = request.data.get('amount')
        plan = request.data.get('plan')
        email = request.data.get('email')
        empresa = request.data.get('empresa')
        
        if not all([amount, plan, email, empresa]):
            return Response({
                'error': 'Faltan datos obligatorios'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Crear Payment Intent
        intent = stripe.PaymentIntent.create(
            amount=int(amount),  # Monto en centavos
            currency='clp',  # Peso chileno
            metadata={
                'plan': plan,
                'email': email,
                'empresa': empresa
            },
            receipt_email=email,
            description=f'Suscripción {plan} - {empresa}'
        )
        
        return Response({
            'clientSecret': intent.client_secret,
            'paymentIntentId': intent.id
        }, status=status.HTTP_200_OK)
        
    except stripe.error.StripeError as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({
            'error': f'Error interno: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
```

### 3.2 Endpoint: Registrar Empresa Web

```python
# backend/api/views/empresa_views.py

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from api.models import Empresa, Usuario, TipoUsuario
import stripe
import secrets
import string

def generar_password_temporal():
    """Genera una contraseña temporal segura"""
    chars = string.ascii_letters + string.digits + "!@#$%"
    return ''.join(secrets.choice(chars) for _ in range(12))

@api_view(['POST'])
@permission_classes([AllowAny])
def registrar_empresa_web(request):
    """
    Endpoint para registrar nueva empresa después de pago exitoso web
    
    Payload:
    {
        "nombre_empresa": "Clinica Norte",
        "subdominio": "norte",
        "email_admin": "admin@norte.com",
        "nombre_admin": "Juan",
        "apellido_admin": "Pérez",
        "telefono_admin": "+56912345678",
        "plan": "basico",
        "stripe_payment_intent": "pi_xxxxxxxxxxxxx"
    }
    """
    
    try:
        # Extraer datos
        nombre_empresa = request.data.get('nombre_empresa')
        subdominio = request.data.get('subdominio', '').lower().strip()
        email_admin = request.data.get('email_admin')
        nombre_admin = request.data.get('nombre_admin')
        apellido_admin = request.data.get('apellido_admin')
        telefono_admin = request.data.get('telefono_admin', '')
        plan = request.data.get('plan')
        payment_intent_id = request.data.get('stripe_payment_intent')
        
        # Validaciones
        if not all([nombre_empresa, subdominio, email_admin, nombre_admin, apellido_admin, plan, payment_intent_id]):
            return Response({
                'error': 'Faltan datos obligatorios',
                'campos_requeridos': ['nombre_empresa', 'subdominio', 'email_admin', 'nombre_admin', 'apellido_admin', 'plan', 'stripe_payment_intent']
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validar formato de subdominio
        import re
        if not re.match(r'^[a-z0-9-]+$', subdominio):
            return Response({
                'error': 'El subdominio solo puede contener letras minúsculas, números y guiones'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verificar que el subdominio no existe
        if Empresa.objects.filter(subdominio=subdominio).exists():
            return Response({
                'error': f'El subdominio "{subdominio}" ya está en uso',
                'sugerencia': f'Prueba con: {subdominio}1, {subdominio}2, o {subdominio}-chile'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verificar que el email no existe
        if Usuario.objects.filter(email=email_admin).exists():
            return Response({
                'error': f'El email "{email_admin}" ya está registrado'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verificar pago con Stripe
        stripe.api_key = settings.STRIPE_SECRET_KEY
        try:
            payment_intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            
            if payment_intent.status != 'succeeded':
                return Response({
                    'error': 'El pago no fue exitoso',
                    'estado_pago': payment_intent.status
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except stripe.error.StripeError as e:
            return Response({
                'error': f'Error al verificar pago: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Crear empresa y usuario en una transacción
        with transaction.atomic():
            # 1. Crear empresa/tenant
            empresa = Empresa.objects.create(
                nombre=nombre_empresa,
                subdominio=subdominio,
                plan=plan,
                estado='activo',
                stripe_customer_id=payment_intent.customer,
                stripe_subscription_id=payment_intent.get('subscription'),
                stripe_payment_intent_id=payment_intent_id
            )
            
            # 2. Obtener tipo de usuario Administrador
            tipo_admin = TipoUsuario.objects.get(codigo=1)  # 1 = Administrador
            
            # 3. Generar contraseña temporal
            password_temporal = generar_password_temporal()
            
            # 4. Crear usuario administrador
            usuario = Usuario.objects.create(
                email=email_admin,
                nombre=nombre_admin,
                apellido=apellido_admin,
                telefono=telefono_admin,
                idtipousuario=tipo_admin,
                empresa=empresa,
                is_active=True,
                is_staff=False,
                is_superuser=False
            )
            
            usuario.set_password(password_temporal)
            usuario.save()
            
            # 5. Enviar email con credenciales (implementar según tu sistema)
            # from api.utils.email import enviar_credenciales_web
            # enviar_credenciales_web(email_admin, password_temporal, subdominio, nombre_admin)
        
        # Construir URL de acceso web
        url_acceso = f'http://{subdominio}.localhost:5177/login'
        
        return Response({
            'success': True,
            'message': 'Empresa registrada exitosamente',
            'data': {
                'empresa_id': empresa.id,
                'empresa_nombre': nombre_empresa,
                'subdominio': subdominio,
                'url_acceso': url_acceso,
                'email_admin': email_admin,
                'password_temporal': password_temporal,  # Solo para desarrollo
                'plan': plan,
                'instrucciones': [
                    f'1. Accede a: {url_acceso}',
                    f'2. Email: {email_admin}',
                    f'3. Contraseña: {password_temporal}',
                    '4. Cambia tu contraseña en el perfil'
                ]
            }
        }, status=status.HTTP_201_CREATED)
        
    except TipoUsuario.DoesNotExist:
        return Response({
            'error': 'Error de configuración: Tipo de usuario Administrador no existe'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    except Exception as e:
        return Response({
            'error': f'Error al registrar empresa: {str(e)}',
            'tipo_error': type(e).__name__
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Agregar a urls.py
from django.urls import path
from api.views import stripe_views, empresa_views

urlpatterns = [
    # ... otras rutas
    
    # Stripe
    path('stripe/create-payment-intent/', stripe_views.create_payment_intent, name='create_payment_intent'),
    
    # Empresas
    path('empresas/registrar/', empresa_views.registrar_empresa_web, name='registrar_empresa_web'),
]
```

### 3.3 Configurar Stripe en Django

```python
# backend/settings.py

# Stripe Configuration
STRIPE_PUBLIC_KEY = env('STRIPE_PUBLIC_KEY', default='pk_test_...')
STRIPE_SECRET_KEY = env('STRIPE_SECRET_KEY', default='sk_test_...')
STRIPE_WEBHOOK_SECRET = env('STRIPE_WEBHOOK_SECRET', default='whsec_...')
```

---

## 🎨 Paso 4: Componente Web de Registro

### 4.1 Instalar Dependencias de Stripe Web

```bash
cd BuyDentalSmile
npm install @stripe/stripe-js @stripe/react-stripe-js axios react-hot-toast
```

### 4.2 Crear Componente de Registro Web

```typescript
// BuyDentalSmile/src/components/RegistroEmpresaWeb.tsx

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface FormDataWeb {
  nombreEmpresa: string;
  subdominio: string;
  emailAdmin: string;
  nombreAdmin: string;
  apellidoAdmin: string;
  telefonoAdmin: string;
  plan: 'basico' | 'profesional' | 'empresarial';
}

const PLANES = {
  basico: {
    nombre: 'Plan Básico',
    precio: 29900,
    descripcion: 'Ideal para clínicas pequeñas',
    features: [
      '✓ Hasta 5 usuarios',
      '✓ Hasta 100 pacientes',
      '✓ Agenda básica',
      '✓ Historias clínicas',
      '✓ Soporte por email'
    ]
  },
  profesional: {
    nombre: 'Plan Profesional',
    precio: 49900,
    descripcion: 'Para clínicas en crecimiento',
    features: [
      '✓ Hasta 20 usuarios',
      '✓ Hasta 500 pacientes',
      '✓ Agenda avanzada',
      '✓ Historias clínicas completas',
      '✓ Reportes y estadísticas',
      '✓ Soporte prioritario'
    ]
  },
  empresarial: {
    nombre: 'Plan Empresarial',
    precio: 99900,
    descripcion: 'Para múltiples sucursales',
    features: [
      '✓ Usuarios ilimitados',
      '✓ Pacientes ilimitados',
      '✓ Multi-sucursal',
      '✓ API personalizada',
      '✓ Reportes avanzados',
      '✓ Soporte 24/7',
      '✓ Capacitación incluida'
    ]
  }
};

const FormularioRegistroWeb = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormDataWeb>({
    nombreEmpresa: '',
    subdominio: '',
    emailAdmin: '',
    nombreAdmin: '',
    apellidoAdmin: '',
    telefonoAdmin: '',
    plan: 'basico'
  });

  const handleChange = (field: keyof FormDataWeb, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'subdominio' ? value.toLowerCase().trim() : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      toast.error('Stripe no está disponible');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Procesando pago...');

    try {
      // 1. Crear Payment Intent
      const { data: intentData } = await axios.post(
        `${import.meta.env.VITE_API_URL}/stripe/create-payment-intent/`,
        {
          amount: PLANES[formData.plan].precio,
          plan: formData.plan,
          email: formData.emailAdmin,
          empresa: formData.nombreEmpresa
        }
      );

      toast.loading('Confirmando pago...', { id: toastId });

      // 2. Confirmar pago con tarjeta
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Elemento de tarjeta no encontrado');
      }

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        intentData.clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: `${formData.nombreAdmin} ${formData.apellidoAdmin}`,
              email: formData.emailAdmin,
              phone: formData.telefonoAdmin
            }
          }
        }
      );

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      if (paymentIntent?.status === 'succeeded') {
        toast.loading('Creando tu cuenta...', { id: toastId });

        // 3. Registrar empresa en backend
        const { data: empresaData } = await axios.post(
          `${import.meta.env.VITE_API_URL}/empresas/registrar/`,
          {
            nombre_empresa: formData.nombreEmpresa,
            subdominio: formData.subdominio,
            email_admin: formData.emailAdmin,
            nombre_admin: formData.nombreAdmin,
            apellido_admin: formData.apellidoAdmin,
            telefono_admin: formData.telefonoAdmin,
            plan: formData.plan,
            stripe_payment_intent: paymentIntent.id
          }
        );

        toast.success('¡Registro exitoso!', { id: toastId });

        // 4. Mostrar credenciales y redirigir
        const urlAcceso = empresaData.data.url_acceso;
        const email = empresaData.data.email_admin;
        const password = empresaData.data.password_temporal;

        // Mostrar modal con credenciales
        const mensaje = `
          ✅ ¡Tu clínica ha sido creada exitosamente!
          
          📧 Email: ${email}
          🔑 Contraseña temporal: ${password}
          🌐 URL: ${urlAcceso}
          
          Guarda estas credenciales y serás redirigido en 10 segundos...
        `;

        alert(mensaje);

        // Copiar credenciales al portapapeles
        navigator.clipboard.writeText(`Email: ${email}\nContraseña: ${password}\nURL: ${urlAcceso}`);
        toast.success('Credenciales copiadas al portapapeles');

        // Redirigir después de 10 segundos
        setTimeout(() => {
          window.location.href = urlAcceso;
        }, 10000);
      }

    } catch (err: any) {
      console.error('Error en registro:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Error al procesar el registro';
      toast.error(errorMsg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const planSeleccionado = PLANES[formData.plan];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <Toaster position="top-center" />
      
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🦷 Registra tu Clínica Dental
          </h1>
          <p className="text-lg text-gray-600">
            Sistema de gestión dental profesional - 100% web
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Datos de la Empresa */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              🏢 Datos de la Empresa
            </h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre de la Clínica *
                </label>
                <input
                  type="text"
                  value={formData.nombreEmpresa}
                  onChange={(e) => handleChange('nombreEmpresa', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Clínica Dental Norte"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Subdominio (Tu URL única) *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.subdominio}
                    onChange={(e) => handleChange('subdominio', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-32"
                    placeholder="norte"
                    pattern="[a-z0-9-]+"
                    required
                  />
                  <span className="absolute right-3 top-3 text-gray-400 text-sm">
                    .localhost:5177
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Solo letras minúsculas, números y guiones
                </p>
              </div>
            </div>
          </div>

          {/* Datos del Administrador */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              👤 Administrador Principal
            </h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.nombreAdmin}
                  onChange={(e) => handleChange('nombreAdmin', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Juan"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Apellido *
                </label>
                <input
                  type="text"
                  value={formData.apellidoAdmin}
                  onChange={(e) => handleChange('apellidoAdmin', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Pérez"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.emailAdmin}
                  onChange={(e) => handleChange('emailAdmin', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="admin@clinica.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={formData.telefonoAdmin}
                  onChange={(e) => handleChange('telefonoAdmin', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+56912345678"
                />
              </div>
            </div>
          </div>

          {/* Selección de Plan */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              💎 Selecciona tu Plan
            </h2>
            
            <div className="grid md:grid-cols-3 gap-4">
              {Object.entries(PLANES).map(([key, plan]) => (
                <div
                  key={key}
                  onClick={() => setFormData({ ...formData, plan: key as FormDataWeb['plan'] })}
                  className={`relative cursor-pointer border-2 rounded-xl p-6 transition-all ${
                    formData.plan === key
                      ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {formData.plan === key && (
                    <div className="absolute top-2 right-2">
                      <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                        ✓ Seleccionado
                      </span>
                    </div>
                  )}
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {plan.nombre}
                  </h3>
                  
                  <p className="text-3xl font-bold text-blue-600 mb-2">
                    ${plan.precio.toLocaleString('es-CL')}
                  </p>
                  
                  <p className="text-sm text-gray-500 mb-4">
                    por mes
                  </p>
                  
                  <p className="text-sm text-gray-600 mb-4">
                    {plan.descripcion}
                  </p>
                  
                  <ul className="space-y-2 text-sm">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="text-gray-700">
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Método de Pago */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              💳 Método de Pago
            </h2>
            
            <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4 mb-4">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#424770',
                      '::placeholder': {
                        color: '#aab7c4',
                      },
                      padding: '12px',
                    },
                    invalid: {
                      color: '#9e2146',
                    },
                  },
                }}
              />
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>💡 Modo de prueba:</strong> Usa la tarjeta{' '}
                <code className="bg-white px-2 py-1 rounded">4242 4242 4242 4242</code>
                {' '}con cualquier fecha futura y CVC
              </p>
            </div>
          </div>

          {/* Resumen y Botón */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-2xl font-bold">Total a Pagar</h3>
                <p className="text-blue-100">Plan {planSeleccionado.nombre}</p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold">
                  ${planSeleccionado.precio.toLocaleString('es-CL')}
                </p>
                <p className="text-blue-100">por mes</p>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={!stripe || loading}
              className="w-full bg-white text-blue-600 py-4 rounded-lg font-bold text-lg hover:bg-blue-50 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-all transform hover:scale-105"
            >
              {loading ? '⏳ Procesando...' : `🚀 Pagar y Crear Mi Clínica`}
            </button>
            
            <p className="text-center text-blue-100 text-sm mt-4">
              🔒 Pago seguro procesado por Stripe
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

// Wrapper con Stripe Provider
export default function RegistroEmpresaWeb() {
  return (
    <Elements stripe={stripePromise}>
      <FormularioRegistroWeb />
    </Elements>
  );
}
```

---

## 🚀 Paso 5: Configurar package.json

```json
// BuyDentalSmile/package.json
{
  "name": "buydentalsmile-web",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite --port 3000",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@stripe/react-stripe-js": "^2.4.0",
    "@stripe/stripe-js": "^2.2.2",
    "axios": "^1.6.2",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-hot-toast": "^2.4.1"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.2.2",
    "vite": "^5.0.8"
  }
}
```

---

## 🔄 Paso 6: Iniciar Todo el Sistema Web

```powershell
# Terminal 1 - Backend Django
cd "C:\Users\asus\Documents\Nueva carpeta (5)\sitwo-project-backend-master"
python manage.py runserver 0.0.0.0:8000

# Terminal 2 - Sistema Dental (Puerto 5177)
cd "C:\Users\asus\Documents\Nueva carpeta (5)\sitwo-project-main"
npm run dev

# Terminal 3 - Landing Page Web (Puerto 3000)
cd "C:\Users\asus\Documents\Nueva carpeta (5)\BuyDentalSmile"
npm run dev
```

---

## 🧪 Paso 7: Probar el Flujo Completo Web

### 1. Acceder a la Landing Page Web
```
http://localhost:3000
```

### 2. Completar Formulario de Registro
```
Nombre Empresa: Clínica Dental Sur
Subdominio: sur
Nombre: María
Apellido: González
Email: maria@sur.com
Teléfono: +56912345678
Plan: Profesional
```

### 3. Datos de Tarjeta de Prueba
```
Número: 4242 4242 4242 4242
Fecha: 12/26
CVC: 123
```

### 4. Después del Pago
- ✅ Se procesa el pago
- ✅ Se crea la empresa en BD
- ✅ Se crea usuario administrador
- ✅ Aparece modal con credenciales
- ✅ Redirige a: `http://sur.localhost:5177/login`

### 5. Login en el Sistema
```
Email: maria@sur.com
Password: [contraseña temporal mostrada]
```

---

## ✅ Checklist de Implementación Web

- [ ] Clonar BuyDentalSmile
- [ ] Instalar dependencias web (`npm install`)
- [ ] Configurar `.env.local` para web
- [ ] Agregar endpoints en backend
- [ ] Configurar Stripe SECRET_KEY en backend
- [ ] Iniciar backend (puerto 8000)
- [ ] Iniciar sistema dental (puerto 5177)
- [ ] Iniciar landing web (puerto 3000)
- [ ] Probar flujo completo de registro web
- [ ] Verificar creación en BD
- [ ] Verificar acceso al subdominio

---

Esta guía está específicamente diseñada para implementación **WEB** del sistema de compra en tu proyecto actual.