// Interfaces para el módulo de Catálogo de Servicios

export interface Servicio {
  id: number;
  nombre: string;
  descripcion: string | null;
  costobase: string;
  precio_vigente: string;
  duracion: number;
  activo: boolean;
  fecha_creacion: string;
  fecha_modificacion: string;
  empresa: number;
}

export interface ServicioListado {
  id: number;
  nombre: string;
  costobase: string;
  precio_vigente: string;
  duracion: number;
  activo: boolean;
}

export interface RespuestaPaginada<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface FiltrosServicios {
  search?: string;
  precio_min?: number;
  precio_max?: number;
  duracion_min?: number;
  duracion_max?: number;
  activo?: boolean | '';
  ordering?: string;
  page?: number;
  page_size?: number;
}

export interface NuevoServicio {
  nombre: string;
  descripcion: string;
  costobase: string;
  duracion: number;
  activo: boolean;
}
