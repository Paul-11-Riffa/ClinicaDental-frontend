import { Api, getCookie } from "../lib/Api";

// -------------------------------
// Tipos
// -------------------------------

// Campos base
export type RegisterPayloadBase = {
  email: string;
  password: string;
  nombre?: string;
  apellido?: string;
  telefono?: string;
  sexo?: string; // obligatorio si rol = "paciente"
  idtipousuario?: number;
  rol?: "paciente" | "odontologo" | "recepcionista";
};

// Campos extra si rol = "paciente"
export type RegisterPacienteExtra = {
  carnetidentidad?: string;
  fechanacimiento?: string; // formato "YYYY-MM-DD"
  direccion?: string;
};

// Payload completo
export type RegisterPayload = RegisterPayloadBase & RegisterPacienteExtra;

// Respuesta de backend
export type RegisterResponse = {
  ok: boolean;
  message: string;
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  };
  usuario_codigo: string;
  subtipo: "paciente" | "odontologo" | "recepcionista";
  idtipousuario: number;
};

// -------------------------------
// Función de registro
// -------------------------------
export async function registerUser(
  payload: RegisterPayload
): Promise<RegisterResponse> {
  // 1) Sembrar cookie CSRF
  await Api.get("/auth/csrf/");

  // 2) Leer cookie
  const csrf = getCookie("csrftoken");
  const headers = csrf ? { "X-CSRFToken": csrf } : undefined;

  // 3) POST /auth/register/
  const { data } = await Api.post<RegisterResponse>(
    "/auth/register/",
    payload,
    { headers }
  );

  return data;
}
