# 🦷 Sistema de Gestión Dental Multi-Tenant

Sistema SaaS para gestión de clínicas dentales con React + TypeScript + Vite frontend y Django backend multi-tenant.

## 🚀 Configuración Local Rápida

### 1. Instalación Automática
```bash
npm run setup
```

### 2. Configurar Subdominios (Como Administrador)
```powershell
# En PowerShell como Administrador
.\setup-local.ps1
```

### 3. Iniciar el Sistema
```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend (directorio separado)
cd ../sitwo-project-backend-master
python manage.py runserver 0.0.0.0:8000
```

### 4. Acceder
- 🏥 **Norte**: http://norte.localhost:5173
- 🏥 **Sur**: http://sur.localhost:5173  
- 🏥 **Este**: http://este.localhost:5173

## 📚 Documentación

- 🤖 **AI Guidelines**: [`.github/copilot-instructions.md`](./.github/copilot-instructions.md)
- 📖 **Configuración Multi-Tenant**: Ver sección [Arquitectura](#🏗️-arquitectura) más abajo

## 🛠️ Comandos Útiles

```bash
npm run verify      # Verificar configuración
npm run dev:norte   # Iniciar en subdominio específico
npm run lint        # Verificar código
npm run build       # Compilar para producción
```

## 🏗️ Arquitectura

### Frontend (React + TypeScript + Vite)
- **Multi-tenancy** por subdominio automático
- **Authentication** con JWT + Context API
- **UI** con TailwindCSS 4
- **Routing** con React Router 7

### Backend (Django - Repositorio Separado)
- **Multi-tenant** con aislamiento por empresa
- **REST API** con Django REST Framework
- **Database** PostgreSQL (Supabase)
- **Auth** JWT + CSRF protection

## 🔐 Flujo de Usuario

1. **Registro** → Crea cuenta de paciente
2. **Login** → Autentica y detecta rol
3. **Dashboard** → Automático según `idtipousuario`:
   - `2` = Paciente Dashboard
   - `1` = Admin Dashboard

## 🎯 Funcionalidades

### Pacientes
- ✅ Agendar citas
- ✅ Ver/reprogramar citas
- ✅ Historia clínica
- ✅ Notificaciones

### Administradores  
- ✅ Gestión pacientes/citas
- ✅ Usuarios y roles
- ✅ Bitácora auditoría
- ✅ Políticas No-Show

## 🚨 Troubleshooting

```bash
# Verificar configuración
npm run verify

# Problema subdominios
ping norte.localhost  # Debe responder 127.0.0.1

# Backend no conecta
curl http://localhost:8000/api/health/

# Puerto ocupado
npm run dev -- --port 3000
```

## ⚙️ Configuración de Subdominios (Windows)

### Método Manual
1. Abrir PowerShell como **Administrador**
2. Editar archivo hosts:
```powershell
notepad C:\Windows\System32\drivers\etc\hosts
```
3. Agregar al final:
```
127.0.0.1 norte.localhost
127.0.0.1 sur.localhost  
127.0.0.1 este.localhost
```
4. Guardar y limpiar DNS:
```powershell
ipconfig /flushdns
```

### Verificar
```bash
ping norte.localhost  # Debe responder desde 127.0.0.1
```

---

## 📝 Notas Técnicas

- **Frontend**: Puerto automático (5173, 5174, 5175...)
- **Backend**: Puerto fijo 8000
- **Multi-tenancy**: Header `X-Tenant-Subdomain` 
- **Auth**: JWT tokens + CSRF protection
- **Database**: PostgreSQL via Supabase
