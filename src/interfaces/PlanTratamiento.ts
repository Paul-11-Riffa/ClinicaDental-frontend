// Interfaces para el módulo de Planes de Tratamiento

// ========================================
// Interfaces Base
// ========================================

export interface PlanTratamiento {
  id: number;
  fechaplan: string;
  paciente_nombre: string;
  odontologo_nombre: string;
  estado_plan: 'Borrador' | 'Aprobado' | 'Cancelado';
  estado_aceptacion: 'Pendiente' | 'Aceptado' | 'Rechazado' | 'Caducado' | 'Parcial';
  montototal: string;
  subtotal_calculado: string;
  descuento: string;
  cantidad_items: number;
  items_activos: number;
  items_completados: number;
  es_borrador: boolean;
  puede_editarse: boolean;
  fecha_aprobacion: string | null;
  fecha_vigencia: string;
  version: number;
  notas_plan?: string;
}

export interface PlanTratamientoDetalle extends PlanTratamiento {
  paciente: {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
  };
  odontologo: {
    id: number;
    nombre: string;
    especialidad: string;
  };
  aceptacion_tipo: string | null;
  usuario_aprueba_nombre: string | null;
  es_aprobado: boolean;
  puede_ser_aceptado: boolean;
  items: ItemPlanTratamiento[];
  estadisticas: {
    total_items: number;
    items_pendientes: number;
    items_activos: number;
    items_cancelados: number;
    items_completados: number;
    progreso_porcentaje: number;
  };
}

export interface ItemPlanTratamiento {
  id: number;
  servicio_nombre: string;
  servicio_descripcion: string | null;
  servicio_duracion: number;
  pieza_dental_nombre: string | null;
  estado_nombre: string;
  costofinal: string;
  costo_base_servicio: string;
  fecha_objetivo: string | null;
  tiempo_estimado: number;
  estado_item: 'Pendiente' | 'Activo' | 'Cancelado' | 'Completado';
  notas_item: string;
  orden: number;
  es_activo: boolean;
  es_cancelado: boolean;
  puede_editarse: boolean;
}

// ========================================
// DTOs para Crear/Actualizar
// ========================================

export interface CrearPlanTratamientoDTO {
  codpaciente: number;
  cododontologo: number;
  fechaplan?: string;          // Opcional - formato YYYY-MM-DD (si no se envía, usa fecha actual)
  notas_plan?: string;
  descuento?: number;          // Descuento global en Bs. (default: 0)
  fecha_vigencia?: string;     // Fecha límite de vigencia YYYY-MM-DD
  items_iniciales?: CrearItemPlanDTO[]; // IMPORTANTE: Backend espera "items_iniciales"
}

export interface CrearItemPlanDTO {
  idservicio: number;          // IMPORTANTE: Backend espera "idservicio" (no codservicio)
  idpiezadental?: number | null; // IMPORTANTE: Backend espera "idpiezadental" (no codpiezadental)
  costofinal?: number;         // IMPORTANTE: Backend espera "costofinal" (no precio_unitario)
  fecha_objetivo?: string;     // Formato YYYY-MM-DD
  tiempo_estimado?: number;    // Tiempo en minutos
  estado_item?: 'Pendiente' | 'Activo' | 'Cancelado' | 'Completado'; // OPCIONAL: Estado del item (default: Pendiente)
  notas_item?: string;
  orden?: number;              // Orden de ejecución (0, 1, 2...)
  
  // NOTA: idestado NO debe enviarse - se asigna automáticamente en el backend
}

export interface ActualizarPlanTratamientoDTO {
  notas_plan?: string;
  descuento?: string;
  fecha_vigencia?: string;
}

export interface ActualizarItemPlanDTO {
  costofinal?: number;         // Costo final del ítem
  fecha_objetivo?: string;     // Fecha estimada (YYYY-MM-DD)
  tiempo_estimado?: number;    // Tiempo en minutos
  notas_item?: string;         // Notas del procedimiento
  orden?: number;              // Orden de ejecución
}

// ========================================
// Respuestas de la API
// ========================================

export interface RespuestaPaginadaPlan {
  count: number;
  next: string | null;
  previous: string | null;
  results: PlanTratamiento[];
}

export interface RespuestaAprobarPlan {
  success: boolean;
  mensaje: string;
  plan: {
    id: number;
    estado_plan: string;
    fecha_aprobacion: string;
    usuario_aprueba_nombre: string;
    es_borrador: boolean;
    puede_editarse: boolean;
    puede_ser_aceptado: boolean;
  };
}

export interface RespuestaItemAction {
  success: boolean;
  mensaje: string;
  item: {
    id: number;
    estado_item: string;
    es_activo?: boolean;
    es_cancelado?: boolean;
  };
  totales?: {
    subtotal: string;
    total: string;
  };
}

export interface RespuestaTotales {
  success: boolean;
  mensaje: string;
  totales: {
    subtotal: number;
    descuento: number;
    total: number;
    items_activos: number;
  };
}

export interface ValidacionAprobacion {
  puede_aprobar: boolean;
  motivos: string[];
  detalles: {
    es_borrador: boolean;
    items_totales: number;
    items_activos: number;
    items_pendientes: number;
    items_cancelados: number;
    items_completados: number;
    es_editable: boolean;
    estado_plan: string;
    usuario_puede_aprobar: boolean;
    // ✅ NUEVO: Información de debugging agregada por el backend
    debug?: {
      usuario_codigo: number;
      usuario_tipo_id: number;
      usuario_tipo_rol: string;
      plan_odontologo_id: number | null;
      es_odontologo_del_plan: boolean;
      es_admin: boolean;
    };
  };
}

// ========================================
// Filtros para Listado
// ========================================

export interface FiltrosPlanesTratamiento {
  search?: string;
  estado_plan?: 'Borrador' | 'Aprobado' | 'Cancelado' | '';
  estado_aceptacion?: 'Pendiente' | 'Aceptado' | 'Rechazado' | 'Caducado' | 'Parcial' | '';
  paciente?: number;
  odontologo?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}
