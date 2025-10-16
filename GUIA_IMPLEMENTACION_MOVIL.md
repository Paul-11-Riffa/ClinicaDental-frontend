# 📱 Guía de Implementación - Sistema Dental Multi-Tenant

## � Índice Rápido

- [Sistema de Compra y Registro](#-sistema-de-compra-y-registro) ⭐ **NUEVO**
- [Arquitectura General](#️-arquitectura-general)
- [Sistema de Autenticación](#-sistema-de-autenticación)
- [Cliente API](#-cliente-api)
- [Gestión de Citas](#-gestión-de-citas)
- [Historias Clínicas](#-historias-clínicas)
- [Troubleshooting](#-troubleshooting-común)

---

## 💳 Sistema de Compra y Registro

### Flujo Completo
```
1. Usuario → http://localhost:5177 (SIN subdominio)
   ↓
2. Muestra LandingCompra con planes y formulario
   ↓
3. Usuario completa 3 pasos:
   - Datos de empresa (nombre, subdominio, contacto)
   - Datos del administrador
   - Selección de plan + pago Stripe
   ↓
4. Pago procesado por Stripe
   ↓
5. Backend crea empresa y usuario admin
   ↓
6. Redirección a: http://{subdominio}.localhost:5177/login
```

### Detección de Subdominio (Router.tsx)
```typescript
function tieneSubdominio(): boolean {
  const hostname = window.location.hostname;
  
  // localhost sin subdominio → Mostrar landing
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return false;
  }
  
  // localhost con subdominio → Mostrar app
  if (hostname.includes('localhost')) {
    const parts = hostname.split('.');
    return parts.length > 1 && parts[0] !== 'localhost';
  }
  
  // Producción: verificar subdominios
  const parts = hostname.split('.');
  return parts.length >= 3 && parts[0] !== 'www';
}

// En el router:
{ index: true, element: tieneSubdominio() ? <Home/> : <LandingCompra/> }
```

### Servicios de Compra (empresaService.ts)
```typescript
// Verificar disponibilidad de subdominio (en tiempo real)
export const verificarSubdominio = async (subdominio: string): Promise<boolean> => {
  const response = await Api.post('/public/validar-subdomain/', {
    subdomain: subdominio
  });
  return response.data.disponible;
};

// Crear intención de pago en Stripe
export const crearPaymentIntent = async (data: PaymentIntentData) => {
  const response = await Api.post('/empresas/crear-payment-intent/', data);
  return response.data; // { clientSecret, paymentIntentId }
};

// Registrar empresa después del pago exitoso
export const registrarEmpresa = async (data: RegistroEmpresaData) => {
  const response = await Api.post('/empresas/registrar/', data);
  return response.data; // { success, redirect_url }
};
```

### Planes Disponibles
```typescript
export const obtenerPlanes = (): Plan[] => {
  return [
    {
      id: 'basico',
      nombre: 'Plan Básico',
      precio: 29990,
      caracteristicas: [
        'Hasta 2 odontólogos',
        'Gestión de citas',
        'Historias clínicas digitales',
        'Soporte por email',
        'Almacenamiento 5GB'
      ]
    },
    {
      id: 'profesional',
      nombre: 'Plan Profesional',
      precio: 49990,
      popular: true,
      caracteristicas: [
        'Hasta 5 odontólogos',
        'Todo lo del Plan Básico',
        'Recordatorios automáticos',
        'Reportes avanzados',
        'Almacenamiento 20GB',
        'Soporte prioritario'
      ]
    },
    {
      id: 'premium',
      nombre: 'Plan Premium',
      precio: 79990,
      caracteristicas: [
        'Odontólogos ilimitados',
        'Todo lo del Plan Profesional',
        'API para integraciones',
        'Backup automático diario',
        'Almacenamiento 100GB',
        'Soporte 24/7',
        'Capacitación incluida'
      ]
    }
  ];
};
```

### Integración Stripe
```typescript
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Inicializar Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// En el componente
const FormularioRegistro = () => {
  const stripe = useStripe();
  const elements = useElements();
  
  const handleSubmit = async (e: React.FormEvent) => {
    // 1. Crear Payment Intent
    const { clientSecret } = await crearPaymentIntent({
      amount: planSeleccionado.precio,
      plan: formData.plan
    });
    
    // 2. Confirmar pago
    const cardElement = elements.getElement(CardElement);
    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: cardElement }
    });
    
    // 3. Registrar empresa si pago exitoso
    if (paymentIntent?.status === 'succeeded') {
      await registrarEmpresa(formData);
      // Redirigir a subdominio de la empresa
    }
  };
};
```

### Variables de Entorno Requeridas
```bash
# .env.local
VITE_STRIPE_PUBLIC_KEY=pk_test_51SGSX5...
VITE_BASE_DOMAIN=localhost:5177  # Desarrollo
VITE_API_URL=http://localhost:8000/api
```

### Tarjetas de Prueba Stripe
```
✅ Pago Exitoso:
   4242 4242 4242 4242
   Fecha: 12/25
   CVC: 123

❌ Pago Rechazado (para pruebas):
   4000 0000 0000 0002
```

---

## �🏗️ Arquitectura General

### Frontend (React + TypeScript + Vite)
```
src/
├── components/          # Componentes reutilizables
│   ├── AdminDashboard.tsx
│   ├── PacienteDashboard.tsx
│   ├── OdontologoDashboard.tsx
│   ├── RecepcionistaDashboard.tsx
│   ├── TopBar.tsx
│   └── ProtectedRoute.tsx
├── pages/              # Páginas principales
│   ├── Home.tsx
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   ├── LandingCompra.tsx          # ⭐ NUEVO: Página de compra
│   ├── AgendarCita.tsx
│   ├── MisCitas.tsx
│   ├── RegistrarHistoriaClinica.tsx
│   ├── ConsultarHistoriaClinica.tsx
│   └── Reportes.tsx
├── context/            # Estado global
│   └── AuthContext.tsx
├── services/           # Lógica de negocio
│   ├── Auth.tsx
│   ├── empresaService.ts          # ⭐ NUEVO: Gestión de empresas
│   ├── historiaClinicaService.ts
│   ├── consentimientoService.ts
│   └── Usuarios.ts
├── lib/               # Configuración
│   ├── Api.ts         # Cliente HTTP
│   └── csrf.ts
└── interfaces/        # Tipos TypeScript
    └── HistoriaClinica.ts
```

---

## 🔐 Sistema de Autenticación

### Flujo de Login
```typescript
// 1. Login Component (src/pages/Login.tsx)
const handleLogin = async (email: string, password: string) => {
  // Detectar tenant automáticamente
  const tenant = detectTenant() || 'norte';
  
  // Obtener CSRF token
  await Api.get('/auth/csrf/');
  
  // Realizar login
  const response = await Api.post('/auth/login/', {
    email,
    password
  });
  
  // Adoptar token y usuario
  adoptToken(response.data.token);
  setUser(response.data.user);
};
```

### AuthContext (src/context/AuthContext.tsx)
```typescript
interface AuthContextType {
  isAuth: boolean;
  user: User | null;
  token: string | null;
  adoptToken: (token: string) => void;
  logout: () => void;
}

// Detección automática de tenant
function detectTenant(): string | null {
  const hostname = window.location.hostname;
  if (hostname.includes('localhost')) {
    return hostname.split('.')[0]; // norte.localhost -> "norte"
  }
  return hostname.split('.')[0]; // norte.tudominio.com -> "norte"
}
```

---

## 🌐 Cliente API (src/lib/Api.ts)

### Configuración Multi-Tenant
```typescript
const Api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  withCredentials: true,
});

// Interceptor para agregar headers automáticamente
Api.interceptors.request.use((config) => {
  const tenant = detectTenant();
  const token = localStorage.getItem('token');
  
  if (tenant) {
    config.headers['X-Tenant-Subdomain'] = tenant;
  }
  
  if (token) {
    config.headers['Authorization'] = `Token ${token}`;
  }
  
  return config;
});
```

### Manejo de CSRF
```typescript
// src/lib/csrf.ts
export const getCsrfToken = async (): Promise<string> => {
  const response = await Api.get('/auth/csrf/');
  return response.data.csrfToken;
};

// Uso automático en requests POST/PUT/DELETE
const csrfToken = await getCsrfToken();
config.headers['X-CSRFToken'] = csrfToken;
```

---

## 🎯 Sistema de Roles y Dashboards

### Tipos de Usuario
```typescript
enum TipoUsuario {
  ADMINISTRADOR = 1,
  PACIENTE = 2,
  RECEPCIONISTA = 3,
  ODONTOLOGO = 4
}

// Routing automático en Dashboard.tsx
const Dashboard = () => {
  const { user } = useAuth();
  
  switch (user?.idtipousuario) {
    case 1: return <AdminDashboard />;
    case 2: return <PacienteDashboard />;
    case 3: return <RecepcionistaDashboard />;
    case 4: return <OdontologoDashboard />;
    default: return <Navigate to="/login" />;
  }
};
```

### Protección de Rutas
```typescript
// src/components/ProtectedRoute.tsx
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuth } = useAuth();
  
  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};
```

---

## 🏥 Gestión de Citas

### Agendar Cita (src/pages/AgendarCita.tsx)
```typescript
const agendarCita = async (citaData: CitaCreate) => {
  try {
    const response = await Api.post('/consultas/', {
      paciente: citaData.pacienteId,
      odontologo: citaData.odontologoId,
      fecha_consulta: citaData.fecha,
      hora_consulta: citaData.hora,
      tipo_consulta: citaData.tipo,
      observaciones: citaData.observaciones
    });
    
    toast.success('Cita agendada correctamente');
    return response.data;
  } catch (error) {
    toast.error('Error al agendar la cita');
    throw error;
  }
};
```

### Ver Citas (src/pages/MisCitas.tsx)
```typescript
const obtenerCitas = async (pacienteId?: number) => {
  const url = pacienteId 
    ? `/consultas/?paciente=${pacienteId}`
    : '/consultas/';
    
  const response = await Api.get(url);
  return response.data;
};

const reprogramarCita = async (citaId: number, nuevaFecha: string, nuevaHora: string) => {
  const response = await Api.patch(`/consultas/${citaId}/`, {
    fecha_consulta: nuevaFecha,
    hora_consulta: nuevaHora
  });
  return response.data;
};
```

---

## 📋 Historias Clínicas

### Interfaces (src/interfaces/HistoriaClinica.ts)
```typescript
export interface HistoriaClinica {
  id: number;
  pacientecodigo: {
    codigo: number;
    codusuario: {
      nombre: string;
      apellido: string;
      rut: string;
    };
  };
  episodio: number;
  fecha: string;
  motivoconsulta: string;
  antecedentesfamiliares?: string;
  antecedentespersonales?: string;
  examengeneral?: string;
  examenregional?: string;
  examenbucal?: string;
  diagnostico: string;
  tratamiento: string;
  receta?: string;
}

export interface HistoriaClinicaCreate {
  pacientecodigo: number;
  motivoconsulta: string;
  diagnostico: string;
  tratamiento: string;
  // ... otros campos opcionales
}
```

### Servicio (src/services/historiaClinicaService.ts)
```typescript
export const crearHistoriaClinica = async (data: HistoriaClinicaCreate): Promise<HistoriaClinica> => {
  const response = await Api.post<HistoriaClinica>('/historias-clinicas/', data);
  return response.data;
};

export const obtenerHistoriasClinicas = async (pacienteId?: number): Promise<HCEItem[]> => {
  const url = pacienteId 
    ? `/historias-clinicas/?paciente=${pacienteId}`
    : '/historias-clinicas/';
  const response = await Api.get<HCEItem[]>(url);
  return response.data;
};

export const obtenerHistoriaClinica = async (id: number): Promise<HistoriaClinica> => {
  const response = await Api.get<HistoriaClinica>(`/historias-clinicas/${id}/`);
  return response.data;
};
```

### Registrar Historia (src/pages/RegistrarHistoriaClinica.tsx)
```typescript
const RegistrarHistoriaClinica = () => {
  const [formData, setFormData] = useState<HistoriaClinicaCreate>({
    pacientecodigo: 0,
    motivoconsulta: '',
    diagnostico: '',
    tratamiento: '',
    // ... otros campos
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    const errores = validarDatosHistoria(formData);
    if (errores.length > 0) {
      errores.forEach(error => toast.error(error));
      return;
    }

    try {
      await crearHistoriaClinica(formData);
      toast.success('Historia clínica creada correctamente');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Error al crear la historia clínica');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Formulario completo con todos los campos */}
    </form>
  );
};
```

---

## 📊 Sistema de Reportes

### Filtros y Exportación (src/pages/Reportes.tsx)
```typescript
interface FiltrosReporte {
  fechaInicio?: string;
  fechaFin?: string;
  odontologoId?: number;
  tipoConsulta?: string;
}

const obtenerReportes = async (filtros: FiltrosReporte) => {
  const params = new URLSearchParams();
  
  if (filtros.fechaInicio) {
    params.append('fecha_inicio', convertirFechaParaBackend(filtros.fechaInicio));
  }
  if (filtros.fechaFin) {
    params.append('fecha_fin', convertirFechaParaBackend(filtros.fechaFin));
  }
  if (filtros.odontologoId) {
    params.append('odontologo', filtros.odontologoId.toString());
  }

  const response = await Api.get(`/reportes/?${params}`);
  return response.data;
};

// Conversión de fecha DD/MM/YYYY -> YYYY-MM-DD
const convertirFechaParaBackend = (fecha: string): string => {
  const [dia, mes, año] = fecha.split('/');
  return `${año}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
};

// Exportar a CSV
const exportToCSV = (data: ConsultaReporte[], filename: string) => {
  const headers = [
    'Fecha',
    'Paciente',
    'Odontólogo',
    'Tipo Consulta',
    'Estado',
    'Hora'
  ];

  const csvContent = [
    headers.join(','),
    ...data.map(consulta => [
      formatearFecha(consulta.fecha_consulta),
      `"${consulta.paciente_nombre} ${consulta.paciente_apellido}"`,
      `"${consulta.odontologo_nombre} ${consulta.odontologo_apellido}"`,
      `"${consulta.tipo_consulta}"`,
      `"${consulta.estado}"`,
      consulta.hora_consulta
    ].join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
};
```

---

## 🔄 Router Configuration (src/Router.tsx)

### Rutas Principales
```typescript
export const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    children: [
      { index: true, element: <Home /> },
      
      // Públicas
      { path: "/login", element: <Login /> },
      { path: "/register", element: <RegisterPatientForm /> },
      { path: "/forgot-password", element: <ForgotPassword /> },
      { path: "/reset-password", element: <ResetPassword /> },

      // Protegidas
      {
        path: "/dashboard",
        element: <ProtectedRoute><Dashboard /></ProtectedRoute>
      },
      {
        path: "/agendar-cita",
        element: <ProtectedRoute><AgendarCita /></ProtectedRoute>
      },
      {
        path: "/mis-citas",
        element: <ProtectedRoute><MisCitas /></ProtectedRoute>
      },
      
      // Historias Clínicas
      {
        path: "/registrar-historia-clinica",
        element: <ProtectedRoute><RegistrarHistoriaClinica /></ProtectedRoute>
      },
      {
        path: "/consultar-historia-clinica",
        element: <ProtectedRoute><ConsultarHistoriaClinica /></ProtectedRoute>
      },
      {
        path: "/mis-historias",
        element: <ProtectedRoute><ConsultarHistoriaClinicaPaciente /></ProtectedRoute>
      },

      // Administración
      {
        path: "/usuarios",
        element: <ProtectedRoute><GestionRoles /></ProtectedRoute>
      },
      {
        path: "/reportes",
        element: <ProtectedRoute><Reportes /></ProtectedRoute>
      },

      // 404
      { path: "*", element: <div>404 - Página no encontrada</div> }
    ]
  }
]);
```

---

## 🎨 Componentes UI Clave

### TopBar (src/components/TopBar.tsx)
```typescript
const TopBar = () => {
  const { user, logout } = useAuth();
  
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/dashboard" className="flex items-center gap-2">
          <img src="/dentist.svg" className="w-8 h-8" alt="Logo" />
          <span className="font-bold text-xl">Dental System</span>
        </Link>
        
        <div className="flex items-center gap-4">
          <span>Hola, {user?.nombre}</span>
          <button onClick={logout} className="btn-secondary">
            Cerrar Sesión
          </button>
        </div>
      </div>
    </header>
  );
};
```

### ProtectedRoute (src/components/ProtectedRoute.tsx)
```typescript
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuth, loading } = useAuth();
  
  if (loading) {
    return <div className="loading-spinner">Cargando...</div>;
  }
  
  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};
```

---

## 📱 Responsive Design

### TailwindCSS Classes Utilizadas
```css
/* Layout responsivo */
.container: mx-auto px-4 sm:px-6 lg:px-8
.grid: grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
.flex: flex-col sm:flex-row
.hidden: hidden sm:block

/* Espaciado responsive */
.p-4: p-4 sm:p-6 lg:p-8
.text-sm: text-sm sm:text-base lg:text-lg
.gap-4: gap-4 sm:gap-6 lg:gap-8

/* Breakpoints */
/* sm: 640px */
/* md: 768px */
/* lg: 1024px */
/* xl: 1280px */
```

### Componentes Móvil-First
```typescript
// Ejemplo: Dashboard adaptativo
const AdminDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header responsive */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6 sm:mb-10">
        <h1 className="text-xl sm:text-2xl font-bold">Panel Admin</h1>
      </header>

      {/* Grid responsive */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Cards que se adaptan al tamaño */}
      </section>
    </div>
  );
};
```

---

## 🛠️ Utilidades y Helpers

### Formateo de Fechas
```typescript
export const formatearFecha = (fecha: string): string => {
  try {
    return new Date(fecha).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return fecha;
  }
};

export const formatearFechaCorta = (fecha: string): string => {
  try {
    return new Date(fecha).toLocaleDateString('es-CL');
  } catch {
    return fecha;
  }
};
```

### Validaciones
```typescript
export const validarEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const validarRUT = (rut: string): boolean => {
  // Validación RUT chileno
  const cleaned = rut.replace(/[.-]/g, '');
  if (cleaned.length < 8) return false;
  
  const dv = cleaned.slice(-1);
  const numbers = cleaned.slice(0, -1);
  
  // Algoritmo de validación RUT
  let suma = 0;
  let multiplicador = 2;
  
  for (let i = numbers.length - 1; i >= 0; i--) {
    suma += parseInt(numbers[i]) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }
  
  const dvCalculado = 11 - (suma % 11);
  const dvFinal = dvCalculado === 11 ? '0' : dvCalculado === 10 ? 'K' : dvCalculado.toString();
  
  return dv.toUpperCase() === dvFinal;
};
```

---

## 🔧 Variables de Entorno (.env.local)

```bash
# URLs del backend
VITE_API_BASE=localhost:8000
VITE_BACKEND_URL=http://localhost:8000
VITE_API_URL=http://localhost:8000/api

# Configuración multi-tenant
VITE_TENANT_SUBDOMAIN=norte
VITE_FORCE_TENANT=norte

# Entorno
VITE_ENVIRONMENT=development
```

---

## 📋 Endpoints del Backend

### Autenticación
```
POST /api/auth/login/
POST /api/auth/register/
POST /api/auth/logout/
GET  /api/auth/csrf/
POST /api/auth/forgot-password/
POST /api/auth/reset-password/
```

### Usuarios
```
GET    /api/users/me/
PATCH  /api/users/me/
GET    /api/users/count/
```

### Pacientes
```
GET    /api/pacientes/
POST   /api/pacientes/
GET    /api/pacientes/{id}/
PATCH  /api/pacientes/{id}/
DELETE /api/pacientes/{id}/
```

### Consultas/Citas
```
GET    /api/consultas/
POST   /api/consultas/
GET    /api/consultas/{id}/
PATCH  /api/consultas/{id}/
DELETE /api/consultas/{id}/
```

### Historias Clínicas
```
GET    /api/historias-clinicas/
POST   /api/historias-clinicas/
GET    /api/historias-clinicas/{id}/
PATCH  /api/historias-clinicas/{id}/
DELETE /api/historias-clinicas/{id}/
```

### Reportes
```
GET /api/reportes/
  ?fecha_inicio=YYYY-MM-DD
  &fecha_fin=YYYY-MM-DD
  &odontologo=ID
  &tipo_consulta=TIPO
```

---

## 🚀 Comandos de Desarrollo

```bash
# Instalar dependencias
npm install

# Desarrollo
npm run dev                 # Puerto automático
npm run dev -- --port 3000 # Puerto específico

# Build
npm run build
npm run preview

# Linting
npm run lint
npm run lint:fix

# Verificar configuración
npm run verify
```

---

## 📱 Consideraciones Móviles

### 1. **Touch Targets**
- Botones mínimo 44x44px
- Espaciado adecuado entre elementos clickeables

### 2. **Navegación**
- Menú hamburguesa en móvil
- Breadcrumbs claros
- Botones "Volver" prominentes

### 3. **Formularios**
- Input types apropiados (tel, email, date)
- Validación en tiempo real
- Labels claros y descriptivos

### 4. **Performance**
- Lazy loading de componentes
- Imágenes optimizadas
- Bundle splitting

### 5. **UX Móvil**
- Feedback haptico en acciones
- Loading states visibles
- Error handling claro
- Offline capability considerado

---

## 🔍 Debugging y Logs

### Console Logs Implementados
```typescript
// En Api.ts
console.log("🔧 API Configuration:", { baseURL, tenant, environment });

// En AuthContext
console.log("🔐 Auth State:", { isAuth, user, token: !!token });

// En servicios
console.log("📊 Fetching reportes with filters:", filtros);
console.log("💾 Saving historia clinica:", data);
```

### Error Handling
```typescript
try {
  const result = await apiCall();
  return result;
} catch (error) {
  console.error('❌ Error en operación:', error);
  toast.error('Error al procesar la solicitud');
  throw error;
}
```

### Warnings Comunes (Normales - No son Errores)

#### Warning 405 en /api/auth/login/
```
WARNING: Method Not Allowed: /api/auth/login/
"GET /api/auth/login/ HTTP/1.1" 405 5957
```

**Causa**: Cuando navegas a `http://norte.localhost:5177/login`, el navegador hace GET para cargar la página.

**Solución**: ✅ **Ignorar** - Es comportamiento normal. El frontend hace POST correctamente cuando envías el formulario.

**Verificación**: Abre DevTools → Network → Verás POST con código 200 cuando hagas login.

---

## 🚨 Troubleshooting Común

### 1. Error CORS
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solución**: Verificar que el backend tenga configurado CORS correctamente con el dominio del frontend.

### 2. Token Expirado
```
401 Unauthorized
```
**Solución**: El usuario debe hacer login nuevamente. El AuthContext maneja esto automáticamente redirigiendo a `/login`.

### 3. Tenant No Detectado
```
X-Tenant-Subdomain: null
```
**Solución**: Verificar que estás accediendo desde un subdominio válido (norte/sur/este.localhost).

### 4. Backend No Responde
```
Network Error / ERR_CONNECTION_REFUSED
```
**Solución**: 
```bash
# Verificar que el backend esté corriendo
curl http://localhost:8000/api/health/

# Si no responde, iniciar backend
cd ../backend
python manage.py runserver 0.0.0.0:8000
```

### 5. Puerto en Uso
```
Port 5173 is in use, trying another one...
```
**Solución**: Normal - Vite encuentra automáticamente otro puerto (5174, 5175, etc.)

---

Esta guía cubre toda la implementación actual del sistema. Puedes usarla como referencia para entender cómo está estructurado todo y cómo implementar nuevas funcionalidades siguiendo los mismos patrones.