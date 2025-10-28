// ============================================
// INTERFACES PARA SESIONES DE TRATAMIENTO
// ============================================

/**
 * Interfaz para el detalle de un ítem del plan dentro de una sesión
 */
export interface ItemPlanDetalle {
  id: number;
  idservicio: {
    id: number;
    nombre: string;
    costobase: string;
  };
  estado_item: string; // 'Pendiente' | 'Activo' | 'Completado' | 'Cancelado'
}

/**
 * Interfaz para el detalle de una consulta dentro de una sesión
 */
export interface ConsultaDetalle {
  id: number;
  fecha: string; // YYYY-MM-DD
  codpaciente: number;
}

/**
 * Interfaz principal para una sesión de tratamiento
 */
export interface SesionTratamiento {
  id: number;
  item_plan: ItemPlanDetalle | number;
  consulta: ConsultaDetalle | number;
  fecha_sesion: string; // YYYY-MM-DD
  hora_inicio: string | null; // HH:MM:SS
  duracion_minutos: number;
  progreso_anterior: string; // Decimal como string
  progreso_actual: string; // Decimal como string
  incremento_progreso: number;
  acciones_realizadas: string;
  notas_sesion: string | null;
  complicaciones: string | null;
  evidencias: string[]; // Array de URLs
  usuario_registro: number;
  usuario_registro_nombre?: string;
  fecha_registro: string; // ISO 8601
  fecha_modificacion?: string; // ISO 8601
  paciente_nombre?: string;
  servicio_nombre?: string;
  empresa: number;
}

/**
 * Interfaz para el formulario de registro de sesión
 */
export interface FormularioSesion {
  item_plan: number;
  consulta: number;
  fecha_sesion: string; // YYYY-MM-DD
  hora_inicio?: string; // HH:MM:SS
  duracion_minutos: number;
  progreso_actual: number; // 0-100
  acciones_realizadas: string;
  notas_sesion?: string;
  complicaciones?: string;
  evidencias?: string[];
}

/**
 * Interfaz para las sesiones agrupadas por ítem
 */
export interface ItemConSesiones {
  item_id: number;
  servicio: string;
  estado_item: string;
  total_sesiones: number;
  progreso_actual: number;
  ultima_sesion_fecha: string; // YYYY-MM-DD
  sesiones: SesionTratamiento[];
}

/**
 * Interfaz para el progreso de un ítem específico
 */
export interface ProgresoItem {
  item_plan_id: number;
  progreso_actual: number;
  total_sesiones: number;
  ultima_sesion_fecha: string | null;
  estado_item: string;
  puede_facturar: boolean;
}

/**
 * Interfaz para el progreso general de un plan
 */
export interface ProgresoPlan {
  plan_id: number;
  progreso_general: number;
  total_items: number;
  items_completados: number;
  items_activos: number;
  items_pendientes: number;
  plan_completado: boolean;
}

/**
 * Interfaz para la respuesta de sesiones por plan
 */
export interface SesionesPorPlan {
  plan_id: number;
  items: ItemConSesiones[];
}

/**
 * Interfaz para las estadísticas del odontólogo
 */
export interface EstadisticasOdontologo {
  total_sesiones: number;
  total_pacientes: number;
  duracion_promedio_minutos: number;
  duracion_total_minutos: number;
  progreso_promedio_incremento: number;
  periodo: {
    desde: string; // YYYY-MM-DD
    hasta: string; // YYYY-MM-DD
  };
}

/**
 * Interfaz para la información adicional del usuario
 */
export interface UsuarioRegistroInfo {
  id: number;
  nombre_completo: string;
  email: string;
}

/**
 * Interfaz para la información del plan de tratamiento
 */
export interface PlanTratamientoInfo {
  id: number;
  estado_plan: string;
  fecha_aprobacion: string | null;
  total_items: number;
}

/**
 * Interfaz para las estadísticas de un ítem
 */
export interface EstadisticasItem {
  total_sesiones: number;
  duracion_total_minutos: number;
  progreso_actual: number;
  estado_item: string;
}

/**
 * Interfaz extendida para el detalle completo de una sesión
 */
export interface SesionTratamientoDetalle extends SesionTratamiento {
  usuario_registro_info?: UsuarioRegistroInfo;
  plan_tratamiento_info?: PlanTratamientoInfo;
  estadisticas_item?: EstadisticasItem;
}

/**
 * Interfaz para respuestas paginadas de sesiones
 */
export interface SesionesPaginadas {
  count: number;
  next: string | null;
  previous: string | null;
  results: SesionTratamiento[];
}

/**
 * Interfaz para los errores de validación
 */
export interface ErroresValidacion {
  [campo: string]: string[];
}

/**
 * Interfaz para los query parameters de listado
 */
export interface QueryParamsSesiones {
  item_plan?: number;
  plan?: number;
  paciente?: number;
  fecha_desde?: string; // YYYY-MM-DD
  fecha_hasta?: string; // YYYY-MM-DD
  page?: number;
}

/**
 * Interfaz para marcar ítem como completado
 */
export interface MarcarCompletadoRequest {
  notas?: string;
}

/**
 * Interfaz para la respuesta de marcar completado
 */
export interface MarcarCompletadoResponse {
  message: string;
  item_id: number;
  estado_item: string;
}
