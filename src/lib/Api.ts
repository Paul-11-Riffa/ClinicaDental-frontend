import axios, { AxiosHeaders } from "axios";
import type { AxiosInstance, Method, InternalAxiosRequestConfig } from "axios";

// Detectar subdominio para multi-tenancy
function detectTenant(): string | null {
  const hostname = window.location.hostname;

  // Desarrollo local: norte.localhost, sur.localhost, etc.
  if (hostname.includes('localhost')) {
    const parts = hostname.split('.');
    if (parts.length > 1 && parts[0] !== 'localhost' && parts[0] !== '127') {
      return parts[0]; // 'norte', 'sur', 'este', etc.
    }
  }

  // Producción: norte.tudominio.com
  const parts = hostname.split('.');
  if (parts.length >= 3 && parts[0] !== 'www') {
    return parts[0]; // primer subdominio
  }

  return null;
}

const currentTenant = detectTenant();

// EXPORTED: usa el mismo tenant que imprime la consola
export const TENANT_SUBDOMAIN: string | null = currentTenant;
// Opcional para debugging global en el navegador
;(window as any).__TENANT__ = currentTenant;

// Construcción de baseURL con soporte para multi-tenancy
const baseURL: string = (() => {
  if (import.meta.env.DEV) {
    // Desarrollo: Usar localhost:8000 directamente con header X-Tenant-Subdomain
    return "http://localhost:8000/api";
  } else {
    // Producción: usar subdominios reales
    const hostname = window.location.hostname;
    return `https://${hostname}/api`;
  }
})();

console.log("🔧 API Configuration:");
console.log("- Environment:", import.meta.env.DEV ? "development" : "production");
console.log("- VITE_API_BASE:", import.meta.env.VITE_API_BASE);
console.log("- baseURL final:", baseURL);
console.log("- 🏢 Tenant detectado:", currentTenant || "ninguno (sin subdominio)");

export const Api: AxiosInstance = axios.create({
  baseURL,
  withCredentials: true,
});

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
}

export interface Usuario {
  codigo: number;
  nombre: string;
  apellido: string;
  subtipo: string;
  idtipousuario: number;
  recibir_notificaciones?: boolean;
}

export function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()!.split(";").shift() ?? null;
  return null;
}

// 👉 Helper para saber si una URL es absoluta (no la tocamos en ese caso)
function isAbsoluteUrl(u: string): boolean {
  return /^https?:\/\//i.test(u);
}

// 👉 Interceptor: normaliza URL para evitar doble "/api" y agrega CSRF en métodos mutantes
Api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // --- Normalización anti "/api/api/..." ---
  if (typeof config.url === "string" && !isAbsoluteUrl(config.url)) {
    const base = String(config.baseURL ?? Api.defaults.baseURL ?? "");
    let url = config.url;

    // Asegura slash inicial en rutas relativas
    if (!url.startsWith("/")) url = `/${url}`;

    // Si base termina en "/api" y la url empieza con "/api/", quita el prefijo duplicado
    if (base.endsWith("/api") && url.startsWith("/api/")) {
      url = url.replace(/^\/api\/+/, "/"); // "/api/usuario/me" -> "/usuario/me"
    }

    config.url = url;
  }

  // --- Headers para multi-tenancy y CSRF ---
  const hdrs = AxiosHeaders.from(config.headers);

  // En desarrollo, enviar subdominio como header para multi-tenancy
  if (import.meta.env.DEV && TENANT_SUBDOMAIN) {
    hdrs.set("X-Tenant-Subdomain", TENANT_SUBDOMAIN);
  }

  // CSRF para métodos que lo requieren
  const method = (config.method ?? "get").toLowerCase() as Method;
  if (method === "post" || method === "put" || method === "patch" || method === "delete") {
    const csrf = getCookie("csrftoken");
    if (csrf) {
      hdrs.set("X-CSRFToken", csrf);
    }
  }

  config.headers = hdrs;
  return config;
});

// Interceptor de respuesta para debugging
Api.interceptors.response.use(
  (response) => {
    // Solo log en desarrollo para no contaminar producción
    if (import.meta.env.DEV) {
      console.log("✅ API Success:");
      console.log("- URL:", response.config.url);
      console.log("- Method:", response.config.method?.toUpperCase());
      console.log("- Status:", response.status);
      console.log("- Data:", response.data);
    }
    return response;
  },
  (error) => {
    // Logging exhaustivo de errores para debugging
    console.error("❌ API Error:");
    console.error("- URL:", error.config?.url);
    console.error("- Method:", error.config?.method?.toUpperCase());
    console.error("- Status:", error.response?.status);
    console.error("- Status Text:", error.response?.statusText);
    console.error("- Response Headers:", error.response?.headers);
    console.error("- Response Data:", error.response?.data);
    console.error("- Error Message:", error.message);
    
    // Ayuda para diagnosticar errores comunes
    if (error.response?.status === 400) {
      console.warn("⚠️ Error 400 (Bad Request) - Verifica:");
      console.warn("  - Validaciones del backend en response.data");
      console.warn("  - Formato del payload enviado");
      console.warn("  - Campos requeridos");
    } else if (error.response?.status === 403) {
      console.warn("⚠️ Error 403 (Forbidden) - Verifica:");
      console.warn("  - Permisos del usuario");
      console.warn("  - Token de autenticación");
    } else if (error.response?.status === 404) {
      console.warn("⚠️ Error 404 (Not Found) - Verifica:");
      console.warn("  - La URL del endpoint");
      console.warn("  - El ID del recurso existe");
    }
    
    return Promise.reject(error);
  }
);

export async function seedCsrf(): Promise<void> {
  await Api.get("/auth/csrf/");
}

export const updateUserSettings = async (settings: { recibir_notificaciones: boolean }, token: string) => {
  try {
    const response = await Api.patch('/auth/user/settings/', settings, {
      headers: { 'Authorization': `Token ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error("Error al actualizar las preferencias:", error);
    throw error;
  }
};

export const cancelarCita = async (consultaId: number, motivo?: string): Promise<void> => {
  try {
    await Api.post(`/consultas/${consultaId}/cancelar/`, { motivo_cancelacion: motivo || '' });
  } catch (error) {
    console.error(`Error al cancelar la cita ${consultaId}:`, error);
    throw error;
  }
};

export const reprogramarCita = async (consultaId: number, nuevaFecha: string, nuevoHorarioId: number) => {
  try {
    const response = await Api.patch(`/consultas/${consultaId}/reprogramar/`, {
      fecha: nuevaFecha,
      idhorario: nuevoHorarioId,
    });
    return response.data;
  } catch (error) {
    console.error(`Error al reprogramar la cita ${consultaId}:`, error);
    throw error;
  }
};

export const obtenerHorariosDisponibles = async (fecha: string, odontologoId: number) => {
  try {
    const response = await Api.get(`/horarios/disponibles/?fecha=${fecha}&odontologo_id=${odontologoId}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener horarios disponibles:', error);
    throw error;
  }
};