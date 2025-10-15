import { useEffect } from "react";
import { Api, getCookie } from "../lib/Api";
import axios, { AxiosError } from "axios";

export type RegisterPatientPayload = {
  email: string;
  password: string;
  nombre?: string;
  apellido?: string;
  telefono?: string;

  // requeridos para PACIENTE
  sexo: string;
  direccion: string;
  fechanacimiento: string;      // "YYYY-MM-DD"
  carnetidentidad: string;

  idtipousuario?: number;       // opcional; por defecto el back usa 2
};

export type RegisterSuccess = {
  ok: boolean;
  message: string;
  user: { id: number; email: string; first_name: string; last_name: string };
  usuario_codigo: string;
  subtipo: "paciente" | "odontologo" | "recepcionista";
  idtipousuario: number;
};

export type RegisterError = {
  status?: number;
  detail?: string;
  fields?: Record<string, string>;
};

type Props = {
  /** Cuando pase de null a objeto, se dispara el registro */
  payload: RegisterPatientPayload | null;
  onDone: (
    result:
      | { ok: true; data: RegisterSuccess }
      | { ok: false; error: RegisterError }
  ) => void;
};

/** Componente “backend” (sin UI): hace CSRF + POST real a /auth/register/ */
export default function RegisterPatientBackend({ payload, onDone }: Props): null {
  useEffect(() => {
    if (!payload) return;

    (async () => {
      try {
        // 1) siembra CSRF (set-cookie: csrftoken)
        await Api.get("/auth/csrf/");
        const csrf = getCookie("csrftoken");
        const headers = csrf ? { "X-CSRFToken": csrf } : undefined;

        // 2) body (rol no se envía; back asume "paciente")
        const body = {
          email: payload.email,
          password: payload.password,
          nombre: payload.nombre,
          apellido: payload.apellido,
          telefono: payload.telefono,
          sexo: payload.sexo,
          direccion: payload.direccion,
          fechanacimiento: payload.fechanacimiento,
          carnetidentidad: payload.carnetidentidad,
          idtipousuario: payload.idtipousuario,
        };

        const { data } = await Api.post<RegisterSuccess>("/auth/register/", body, { headers });
        onDone({ ok: true, data });
      } catch (err: unknown) {
        const error: RegisterError = {};
        if (axios.isAxiosError(err)) {
          const ax = err as AxiosError<Record<string, unknown>>;
          error.status = ax.response?.status;

          const d = ax.response?.data;
          if (d) {
            error.detail = typeof d["detail"] === "string" ? (d["detail"] as string) : undefined;
            const fields: Record<string, string> = {};
            Object.keys(d).forEach((k) => {
              if (k === "detail") return;
              const v = d[k];
              if (Array.isArray(v)) fields[k] = (v as unknown[]).join(" ");
              else if (typeof v === "string") fields[k] = v;
            });
            if (Object.keys(fields).length) error.fields = fields;
          } else {
            error.detail = ax.message;
          }
        } else {
          error.detail = "Error desconocido";
        }
        onDone({ ok: false, error });
      }
    })();
  }, [payload, onDone]);

  return null;
}
