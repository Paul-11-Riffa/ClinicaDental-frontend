import { Api } from "../lib/Api.ts";

export type EstadoConsulta = { id: number; estado: string; empresa: number };

export type PoliticaNoShow = {
  id: number;
  nombre: string | null;
  empresa: number; // id
  estado_consulta: number; // id
  penalizacion_economica: string | number | null;
  bloqueo_temporal: boolean;
  reprogramacion_obligatoria: boolean;
  alerta_interna: boolean;
  notificacion_paciente: boolean;
  notificacion_profesional: boolean;
  dias_bloqueo: number | null;
  activo: boolean;
  // Campos amigables (pueden venir según serializer)
  estado_consulta_nombre?: string;
  empresa_nombre?: string;
};

export type PoliticaNoShowListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: PoliticaNoShow[];
};

function authHeaders(token?: string, empresaId?: number) {
  return {
    ...(token ? { Authorization: `Token ${token}` } : {}),
    ...(empresaId ? { "X-Empresa-Id": String(empresaId) } : {}),
  };
}

/**
 * Lista estados de consulta filtrados por la empresa del usuario.
 * Enviamos X-Empresa-Id como respaldo por si el backend no logra derivarlo del user.
 */
export async function listarEstadosConsulta(
  token: string,
  empresaId?: number
): Promise<EstadoConsulta[]> {
  const { data } = await Api.get("/api/estadodeconsultas/", {
    headers: authHeaders(token, empresaId),
    params: empresaId ? { empresa: empresaId } : undefined,
  });
  return Array.isArray(data) ? data : data.results ?? [];
}

/**
 * Listar políticas con filtros, búsqueda, orden y paginación.
 * params soportados por el backend:
 * - page, page_size, search, activo, estado_consulta, ordering
 */
export async function listarPoliticasNoShow(
  token: string,
  params?: Partial<{
    page: number;
    page_size: number;
    search: string;
    activo: "" | "true" | "false";
    estado_consulta: number;
    ordering: string;
  }>,
  empresaId?: number
): Promise<PoliticaNoShowListResponse> {
  const { data, status } = await Api.get("/api/politicas-no-show/", {
    headers: authHeaders(token, empresaId),
    params,
  });
  if (status >= 400) {
    throw new Error(data?.detail || "Error al listar políticas");
  }
  // El backend puede o no paginar; normalizamos
  if (Array.isArray(data)) {
    return { count: data.length, next: null, previous: null, results: data };
  }
  return {
    count: data.count ?? (Array.isArray(data.results) ? data.results.length : 0),
    next: data.next ?? null,
    previous: data.previous ?? null,
    results: Array.isArray(data.results) ? data.results : data ?? [],
  };
}

/**
 * Crear política no show
 */
export async function crearPoliticaNoShow(form: any, token: string, empresaId?: number) {
  const res = await Api.post("/api/politicas-no-show/", form, {
    headers: authHeaders(token, empresaId),
    params: empresaId ? { empresa: empresaId } : undefined,
  });
  if (res.status >= 400) {
    throw new Error(res.data?.detail || "Error al crear política");
  }
  return res.data as PoliticaNoShow;
}

/**
 * Actualizar política (PATCH)
 */
export async function actualizarPoliticaNoShow(
  id: number,
  form: any,
  token: string,
  empresaId?: number
) {
  const res = await Api.patch(`/api/politicas-no-show/${id}/`, form, {
    headers: authHeaders(token, empresaId),
    params: empresaId ? { empresa: empresaId } : undefined,
  });
  if (res.status >= 400) {
    throw new Error(res.data?.detail || "Error al actualizar política");
  }
  return res.data as PoliticaNoShow;
}

/**
 * Eliminar política
 */
export async function eliminarPoliticaNoShow(id: number, token: string, empresaId?: number) {
  const res = await Api.delete(`/api/politicas-no-show/${id}/`, {
    headers: authHeaders(token, empresaId),
    params: empresaId ? { empresa: empresaId } : undefined,
  });
  if (res.status >= 400) {
    throw new Error(res.data?.detail || "Error al eliminar política");
  }
  return true;
}

/**
 * Obtener política por id
 */
export async function obtenerPoliticaNoShow(id: number, token: string, empresaId?: number) {
  const res = await Api.get(`/api/politicas-no-show/${id}/`, {
    headers: authHeaders(token, empresaId),
    params: empresaId ? { empresa: empresaId } : undefined,
  });
  if (res.status >= 400) {
    throw new Error(res.data?.detail || "Error al obtener política");
  }
  return res.data as PoliticaNoShow;
}