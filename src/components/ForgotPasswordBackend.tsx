import { useEffect } from "react";
import axios, { AxiosError } from "axios";
import { Api, getCookie } from "../lib/Api";

export type ForgotPasswordPayload = { email: string };

export type ForgotPasswordSuccess = {
  ok: boolean;
  message?: string; // algunos backends no mandan body
};

export type ForgotPasswordError = {
  status?: number;
  detail?: string;
  fields?: Record<string, string>;
  isNetworkError?: boolean;
  aborted?: boolean;
};

type Props = {
  /** Cuando pase de null a objeto, se dispara la solicitud para la recuperación de contraseña */
  payload: ForgotPasswordPayload | null;
  onDone: (
    result:
      | { ok: true; data: ForgotPasswordSuccess }
      | { ok: false; error: ForgotPasswordError }
  ) => void;
};

const ENDPOINT = "/auth/password-reset/"; // 👈 Asegúrate de que coincide con urls.py

export default function ForgotPasswordBackend({ payload, onDone }: Props): null {
  useEffect(() => {
    if (!payload) return;

    const ac = new AbortController();

    (async () => {
      try {
        // 1) Siembra CSRF (si usas cookie CSRF)
        await Api.get("/auth/csrf/", { signal: ac.signal });
        const csrf = getCookie("csrftoken");
        const headers = csrf ? { "X-CSRFToken": csrf } : undefined;

        // 2) Post: acepta 200/201/202/204 como éxito
        const res = await Api.post<ForgotPasswordSuccess>(
          ENDPOINT,
          { email: payload.email },
          {
            headers,
            signal: ac.signal,
            validateStatus: (s) =>
              [200, 201, 202, 204].includes(s ?? 0) || (s ?? 0) >= 400,
          }
        );

        if ([200, 201, 202, 204].includes(res.status)) {
          onDone({ ok: true, data: res.data ?? { ok: true } });
          return;
        }

        // Si llegó aquí es >=400 (por validateStatus)
        const d = res.data as any;
        onDone({
          ok: false,
          error: {
            status: res.status,
            detail: typeof d?.detail === "string" ? d.detail : undefined,
            fields: parseFieldErrors(d),
          },
        });
      } catch (err: unknown) {
        if (ac.signal.aborted) {
          onDone({ ok: false, error: { aborted: true, detail: "Solicitud cancelada" } });
          return;
        }
        const error: ForgotPasswordError = {};
        if (axios.isAxiosError(err)) {
          const ax = err as AxiosError<any>;
          error.status = ax.response?.status;
          const d = ax.response?.data;
          if (d) {
            error.detail = typeof d?.detail === "string" ? d.detail : ax.message;
            error.fields = parseFieldErrors(d);
          } else {
            error.detail = ax.message;
            error.isNetworkError = true;
          }
        } else {
          error.detail = "Error desconocido";
        }
        onDone({ ok: false, error });
      }
    })();

    return () => {
      ac.abort();
    };
  }, [payload, onDone]);

  return null;
}

function parseFieldErrors(d: any): Record<string, string> | undefined {
  if (!d || typeof d !== "object") return undefined;
  const out: Record<string, string> = {};
  for (const k of Object.keys(d)) {
    if (k === "detail") continue;
    const v = (d as any)[k];
    if (Array.isArray(v)) out[k] = v.join(" ");
    else if (typeof v === "string") out[k] = v;
  }
  return Object.keys(out).length ? out : undefined;
}
