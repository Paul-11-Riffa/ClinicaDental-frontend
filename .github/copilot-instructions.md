# Copilot Instructions - Sistema de Gestión Dental Multi-Tenant

## 🏥 Descripción del Proyecto

Sistema SaaS multi-tenant para gestión de clínicas dentales con React + TypeScript + Vite frontend y Django backend. Cada clínica tiene su propio subdominio para aislamiento completo de datos.

## 🏗️ Arquitectura Frontend

### Estructura de Componentes
- **`src/pages/`**: Vistas principales (Home, Login, Dashboard, AgendarCita, MisCitas)
- **`src/components/`**: Componentes reutilizables (AdminDashboard, PacienteDashboard, TopBar)
- **`src/context/AuthContext.tsx`**: Manejo global de autenticación y estado de usuario
- **`src/lib/Api.ts`**: Cliente HTTP con detección automática de tenant y manejo de CSRF
- **`src/services/`**: Lógica de negocio (Auth.tsx, consentimientoService.ts)

### Multi-Tenancy Frontend
```typescript
// Detección automática de tenant por subdominio
function detectTenant(): string | null {
  const hostname = window.location.hostname;
  // norte.localhost:5173 → "norte"
  // sur.tudominio.com → "sur"
}
```

## 🔐 Flujo de Autenticación

### Registro de Pacientes
1. **Formulario**: `RegisterPatientForm.tsx` → datos personales + info médica
2. **Backend Component**: `RegisterPatientBackend.tsx` → maneja CSRF + POST a `/api/auth/register/`
3. **Validación**: Email único, datos obligatorios según rol
4. **Redirección**: Éxito → Login, Error → Toast con detalles

### Login y Sesión
```typescript
// AuthContext pattern
const { isAuth, user, token, adoptToken, logout } = useAuth();

// Tipos de usuario
user.idtipousuario === 2 // Paciente → PacienteDashboard
user.idtipousuario === 1 // Odontólogo/Admin → AdminDashboard
```

## 🌐 Configuración API Multi-Tenant

### Desarrollo Local
```typescript
// vite.config.ts proxy
proxy: {
  "/api": {
    target: "http://localhost:8000", // Django backend
    changeOrigin: true,
    // Preserva headers para detección de tenant
  }
}
```

### Producción
```typescript
const baseURL = `https://${hostname}/api`; // notificct.dpdns.org
```

## 📱 Patrones de Desarrollo

### Protección de Rutas
```typescript
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>
// Verifica isAuth antes de renderizar
```

### Manejo de Estado
- **Local**: `useState` para formularios y UI temporal
- **Global**: `AuthContext` para autenticación y datos de usuario
- **Server**: React Query/SWR pattern en componentes (no implementado aún)

### Convenciones de Naming
- **Componentes**: PascalCase (`AdminDashboard.tsx`)
- **Páginas**: PascalCase en `pages/` (`AgendarCita.tsx`)
- **Servicios**: camelCase (`consentimientoService.ts`)
- **APIs**: snake_case siguiendo Django REST (`/api/clinic/pacientes/`)

## 🔧 Configuración de Desarrollo

### Variables de Entorno (.env.local)
```bash
VITE_API_BASE=localhost:8000
VITE_TENANT_SUBDOMAIN=norte  # Para testing sin subdominio
```

### Subdominios Locales (Windows)
```
# C:\Windows\System32\drivers\etc\hosts
127.0.0.1 norte.localhost
127.0.0.1 sur.localhost
127.0.0.1 este.localhost
```

### Comandos de Desarrollo
```bash
npm run dev        # Frontend en localhost:5173
npm run build      # Build para producción
npm run lint       # ESLint + TypeScript
```

## 🚨 Patrones de Error

### Toast Notifications
```typescript
import { toast } from 'react-hot-toast';

// Éxito
toast.success("Cita agendada correctamente");

// Error
toast.error("No se pudo procesar la solicitud");
```

### Error Boundaries
- `ErrorBoundary.tsx` para capturar errores de React
- Axios interceptors en `Api.ts` para errores HTTP

## 🎯 Funcionalidades Clave

### Gestión de Citas
- **Agendar**: `AgendarCita.tsx` → Selección de fecha/hora/odontólogo
- **Ver Citas**: `MisCitas.tsx` → Lista con filtros y acciones
- **Reprogramar**: Modal con validación de disponibilidad

### Dashboards Dinámicos
- **Paciente**: Enlaces rápidos, configuración de notificaciones
- **Admin**: KPIs, gestión de usuarios, bitácora de auditoría

### Historias Clínicas
- `RegistrarHistoriaClinica.tsx` → Formulario complejo con validaciones
- Upload de documentos → Integración con S3/backend storage

## 🔄 Integración Backend

### Endpoints Principales
```typescript
// Pacientes (filtrado automático por tenant)
GET /api/clinic/pacientes/
POST /api/clinic/pacientes/

// Citas
GET /api/clinic/consultas/
POST /api/clinic/consultas/

// Usuarios
GET /api/users/me/
PATCH /api/users/me/
```

### Headers Requeridos
```typescript
Authorization: Bearer ${token}  // JWT de Supabase
X-Tenant-Subdomain: ${tenant}   // Multi-tenancy
X-CSRFToken: ${csrfToken}       // Para POST/PUT/DELETE
```

## 🎨 Estilos y UI

### TailwindCSS Patterns
- **Layout**: `container mx-auto px-4`
- **Cards**: `bg-white rounded-lg shadow-md p-6`
- **Buttons**: `bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg`
- **Forms**: `space-y-4` para spacing vertical

### Responsive Design
- Mobile-first approach
- `sm:`, `md:`, `lg:` breakpoints
- Grid layouts que colapsan en móvil

## ⚠️ Consideraciones Importantes

1. **CSRF**: Siempre llamar `/api/auth/csrf/` antes de operaciones mutantes
2. **Tenant Isolation**: Cada request incluye tenant header automáticamente
3. **Authentication**: Verificar `isAuth` y `user` antes de operaciones protegidas
4. **Loading States**: Mostrar spinners durante requests async
5. **Error Handling**: Usar toast para feedback inmediato al usuario

## 🔍 Debugging

### Frontend Console Logs
```typescript
console.log("🔧 API Configuration:", { baseURL, tenant, environment });
console.log("🔐 Auth State:", { isAuth, user, token: !!token });
```

### Network Tab
- Verificar headers `X-Tenant-Subdomain` en requests
- Comprobar respuestas CSRF antes de POSTs
- Validar JWT tokens en Authorization headers

## 📚 Recursos de Referencia

- **Backend API Docs**: Ver `API_DOCUMENTATION.md` en backend repo
- **Architecture**: Ver `ARCHITECTURE.md` para entender multi-tenancy
- **Setup**: Ver `SETUP_DEVELOPMENT.md` para configuración local
- **AWS Deploy**: Ver `GUIA_DESPLIEGUE_AWS.md` para producción