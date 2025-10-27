/**
 * Interfaces para la funcionalidad de Combos de Servicios
 * Backend API: /api/combos-servicios/
 */

import type { Servicio } from './Servicio';

/**
 * Tipos de precio disponibles para los combos
 */
export type TipoPrecio = 'PORCENTAJE' | 'MONTO_FIJO' | 'PROMOCION';

/**
 * Detalle de un servicio dentro de un combo
 */
export interface ComboDetalleServicio {
  id: number;
  servicio: {
    id: number;
    nombre: string;
    descripcion?: string;
    precio: string;
    duracion_minutos: number;
    activo: boolean;
  };
  cantidad: number;
  orden: number;
  subtotal: string;
}

/**
 * Interface para un Combo completo
 */
export interface Combo {
  id: number;
  nombre: string;
  descripcion?: string;
  tipo_precio: TipoPrecio;
  valor_precio: string;
  precio_total_servicios: string;
  precio_final: string;
  ahorro: string;
  activo: boolean;
  cantidad_servicios: number;
  duracion_total: number;
  fecha_creacion: string;
  fecha_actualizacion: string;
  detalles?: ComboDetalleServicio[];
}

/**
 * Interface para listar combos (versión simplificada)
 */
export interface ComboListado {
  id: number;
  nombre: string;
  descripcion?: string;
  tipo_precio: TipoPrecio;
  valor_precio: string;
  precio_total_servicios: string;
  precio_final: string;
  ahorro: string;
  activo: boolean;
  cantidad_servicios: number;
  duracion_total: number;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

/**
 * Respuesta paginada del backend
 */
export interface RespuestaPaginadaCombos {
  count: number;
  next: string | null;
  previous: string | null;
  results: ComboListado[];
}

/**
 * Detalle de un servicio para crear/editar combo
 */
export interface ComboDetalleInput {
  servicio: number;
  cantidad: number;
  orden: number;
}

/**
 * Interface para crear un nuevo combo
 */
export interface NuevoCombo {
  nombre: string;
  descripcion?: string;
  tipo_precio: TipoPrecio;
  valor_precio: string | number;
  activo: boolean;
  detalles: ComboDetalleInput[];
}

/**
 * Interface para actualizar un combo existente
 */
export interface ActualizarCombo extends NuevoCombo {
  id: number;
}

/**
 * Servicio para previsualización (sin guardar)
 */
export interface ServicioPreview {
  servicio_id: number;
  cantidad: number;
}

/**
 * Request para previsualizar combo
 */
export interface PreviewComboRequest {
  tipo_precio: TipoPrecio;
  valor_precio: string | number;
  servicios: ServicioPreview[];
}

/**
 * Respuesta de previsualización
 */
export interface PreviewComboResponse {
  tipo_precio: TipoPrecio;
  valor_precio: string;
  precio_total_servicios: string;
  precio_final: string;
  ahorro: string;
  duracion_total: number;
  cantidad_servicios: number;
}

/**
 * Respuesta al crear/actualizar combo
 */
export interface ComboResponse {
  mensaje: string;
  combo: Combo;
}

/**
 * Filtros para buscar combos
 */
export interface FiltrosCombos {
  search?: string;
  activo?: boolean | string;
  page?: number;
  page_size?: number;
}

/**
 * Estadísticas de combos
 */
export interface EstadisticasCombos {
  total_combos: number;
  combos_activos: number;
  combos_inactivos: number;
  ahorro_promedio: string;
  combo_mas_popular?: {
    id: number;
    nombre: string;
    veces_usado: number;
  };
}

/**
 * Servicio seleccionado para el formulario (con info adicional)
 */
export interface ServicioSeleccionado extends Servicio {
  cantidad: number;
}

/**
 * Errores de validación del backend
 */
export interface ErrorCombo {
  error: string;
  detalles?: Record<string, string[] | Record<string, string[]>[]>;
}
