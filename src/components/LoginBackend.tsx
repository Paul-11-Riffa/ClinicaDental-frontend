// src/components/LoginBackend.tsx
import { useEffect, useRef } from "react";
import { Api, getCookie } from "../lib/Api";
import axios, { AxiosError } from "axios";

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginSuccess = {
  ok: boolean;
  message: string;
  token: string;
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    is_active: boolean;
  };
  usuario: {
    codigo: number;
    nombre: string;
    apellido: string;
    telefono: string | null;
    sexo: string | null;
    subtipo: "paciente" | "odontologo" | "recepcionista" | "administrador";
    idtipousuario: number;
  };
};

export type LoginError = {
  status?: number;
  detail?: string;
  fields?: Record<string, string>;
  serverError?: boolean;
  networkError?: boolean;
};

type Props = {
  /** Cuando pase de null a objeto, se dispara el login */
  payload: LoginPayload | null;
  onDone: (
      result:
          | { ok: true; data: LoginSuccess }
          | { ok: false; error: LoginError }
  ) => void;
};

/** Componente "backend" (sin UI): hace login real a /auth/login/ */
export default function LoginBackend({ payload, onDone }: Props): null {
  const isProcessingRef = useRef(false);
  const lastPayloadRef = useRef<LoginPayload | null>(null);

  useEffect(() => {
    // Guard 1: No hay payload
    if (!payload) {
      console.log("LoginBackend: No payload");
      return;
    }

    // Guard 2: Ya está procesando
    if (isProcessingRef.current) {
      console.log("LoginBackend: Ya procesando, ignorando...");
      return;
    }

    // Guard 3: Mismo payload que antes (evitar duplicados)
    if (lastPayloadRef.current &&
        lastPayloadRef.current.email === payload.email &&
        lastPayloadRef.current.password === payload.password) {
      console.log("LoginBackend: Mismo payload, ignorando duplicado");
      return;
    }

    console.log("LoginBackend: Procesando login para", payload.email);
    isProcessingRef.current = true;
    lastPayloadRef.current = payload;

    (async () => {
      try {
        // 1) Siembra CSRF (opcional para login, pero por consistencia)
        console.log("LoginBackend: Obteniendo CSRF token...");
        try {
          await Api.get("/auth/csrf/");
          console.log("LoginBackend: CSRF token obtenido exitosamente");
        } catch (csrfError) {
          console.warn("LoginBackend: Error obteniendo CSRF, continuando sin él:", csrfError);
        }

        const csrf = getCookie("csrftoken");
        const headers = csrf ? { "X-CSRFToken": csrf } : undefined;

        // 2) Body para login
        const body = {
          email: payload.email,
          password: payload.password,
        };

        const loginUrl = Api.defaults.baseURL + "/auth/login/";
        console.log("LoginBackend: Enviando login a", loginUrl);
        console.log("LoginBackend: Payload:", { email: payload.email, password: "[OCULTA]" });
        console.log("LoginBackend: Headers:", headers);

        const { data } = await Api.post<LoginSuccess>("/auth/login/", body, { headers });

        console.log("=== RESPUESTA COMPLETA DEL SERVIDOR ===");
        console.log("Data completa:", data);
        console.log("Tipo de data:", typeof data);
        console.log("Claves en data:", Object.keys(data || {}));
        console.log("data.token:", data?.token);
        console.log("data.ok:", data?.ok);
        console.log("data.message:", data?.message);
        console.log("data.user:", data?.user);
        console.log("data.usuario:", data?.usuario);
        console.log("=== FIN RESPUESTA ===");

        console.log("✅ LoginBackend: Login exitoso. Token recibido:", data.token);

        // Validar que la respuesta tenga la estructura esperada
        if (!data.token || !data.user || !data.usuario) {
          console.error("❌ LoginBackend: Respuesta incompleta del servidor");
          throw new Error("Respuesta incompleta del servidor");
        }

        onDone({ ok: true, data });
      } catch (err: unknown) {
        console.error("LoginBackend: Error en login", err);
        const error: LoginError = {};

        if (axios.isAxiosError(err)) {
          const ax = err as AxiosError<any>;
          error.status = ax.response?.status;

          console.log("LoginBackend: Detalles del error:");
          console.log("- Status:", ax.response?.status);
          console.log("- Status Text:", ax.response?.statusText);
          console.log("- Response Headers:", ax.response?.headers);
          console.log("- Response Data:", ax.response?.data);
          console.log("- Request URL:", ax.config?.url);
          console.log("- Request Method:", ax.config?.method);

          // Manejar errores específicos del servidor
          if (ax.response?.status === 500) {
            error.serverError = true;
            error.detail = "Error interno del servidor. Por favor, contacta al administrador del sistema.";
            console.error("LoginBackend: Error 500 - Problema en el servidor backend");
          } else if (ax.response?.status === 503) {
            error.serverError = true;
            error.detail = "Servicio temporalmente no disponible. Intenta nuevamente en unos minutos.";
          } else if (ax.response?.status === 502 || ax.response?.status === 504) {
            error.serverError = true;
            error.detail = "Error de conectividad con el servidor. Verifica tu conexión a internet.";
          } else if (!ax.response) {
            // Error de red
            error.networkError = true;
            error.detail = "No se pudo conectar al servidor. Verifica tu conexión a internet.";
          } else {
            // Intentar extraer información del error
            const d = ax.response?.data;
            if (d && typeof d === 'object') {
              // Respuesta JSON válida
              error.detail = typeof d["detail"] === "string" ? (d["detail"] as string) : undefined;
              const fields: Record<string, string> = {};
              Object.keys(d).forEach((k) => {
                if (k === "detail") return;
                const v = d[k];
                if (Array.isArray(v)) fields[k] = (v as unknown[]).join(" ");
                else if (typeof v === "string") fields[k] = v;
              });
              if (Object.keys(fields).length) error.fields = fields;
            } else if (typeof d === 'string' && d.includes('<!doctype html>')) {
              // Página HTML de error
              error.serverError = true;
              error.detail = `Error del servidor (${ax.response.status}). El backend devolvió una página de error en lugar de datos JSON.`;
            } else {
              error.detail = ax.message || "Error de comunicación con el servidor";
            }
          }
        } else {
          error.detail = "Error desconocido en la conexión";
          console.error("LoginBackend: Error no-axios:", err);
        }

        onDone({ ok: false, error });
      } finally {
        // Liberar el flag después de un pequeño delay para evitar race conditions
        setTimeout(() => {
          isProcessingRef.current = false;
          console.log("LoginBackend: Proceso completado");
        }, 100);
      }
    })();
  }, [payload, onDone]);

  return null;
}