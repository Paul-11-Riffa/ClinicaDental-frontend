// Interfaces para el módulo de Presupuestos Digitales

// ========================================
// Interfaces Base
// ========================================

export interface PresupuestoDigital {
  id: number;
  codigo_presupuesto: string;  // UUID completo
  codigo_corto: string;  // 8 primeros caracteres para display
  plan_tratamiento: number;  // ID del plan
  
  // Información anidada
  paciente_nombre: string;
  odontologo_nombre: string;
  plan_detalle: {
    id: number;
    fecha: string;
    estado_plan: string;
    total_items: number;
  };
  
  // Fechas
  fecha_emision: string;  // ISO timestamp
  fecha_vigencia: string;  // YYYY-MM-DD
  fecha_emitido: string | null;  // ISO timestamp
  
  // Usuario
  usuario_emite: number | null;
  usuario_emite_nombre: string | null;
  
  // Estado
  estado: 'Borrador' | 'Emitido' | 'Caducado' | 'Anulado';
  
  // Tipo
  es_tramo: boolean;
  numero_tramo: number | null;
  
  // Montos
  subtotal: string;  // Decimal como string
  descuento: string;
  total: string;
  cantidad_items: number;
  
  // Contenido
  terminos_condiciones: string;
  notas: string;
  
  // PDF
  pdf_url: string | null;
  pdf_generado: boolean;
  
  // Control
  esta_vigente: boolean;
  puede_editarse: boolean;
  dias_para_vencimiento: number;
}

export interface PresupuestoDigitalDetalle extends PresupuestoDigital {
  // Relaciones expandidas
  paciente: {
    id: number;
    nombre: string;
    apellido: string;
    correo: string;
  };
  odontologo: {
    id: number;
    nombre: string;
    apellido: string;
    especialidad: string;
  };
  
  // Items completos
  items: ItemPresupuestoDigital[];
}

export interface ItemPresupuestoDigital {
  id: number;
  presupuesto: number;
  item_plan: number;
  
  // Servicio info
  servicio_nombre: string;
  servicio_descripcion: string;
  pieza_dental: string | null;
  
  // Pricing
  precio_unitario: string;
  descuento_item: string;
  precio_final: string;  // Calculado automáticamente
  
  // Pagos parciales
  permite_pago_parcial: boolean;
  cantidad_cuotas: number | null;
  
  // Otros
  notas_item: string;
  orden: number;
}

// ========================================
// DTOs para Crear/Actualizar
// ========================================

export interface CrearPresupuestoDigitalDTO {
  plan_tratamiento_id: number;
  items_ids?: number[];  // Vacío = todos los items del plan
  fecha_vigencia?: string;  // YYYY-MM-DD, default: 30 días
  es_tramo?: boolean;
  numero_tramo?: number | null;
  descuento?: string;  // Descuento global
  terminos_condiciones?: string;
  notas?: string;
  items_config?: ItemConfigDTO[];  // Configuración específica por item
}

export interface ItemConfigDTO {
  item_id: number;
  descuento_item?: string;
  permite_pago_parcial?: boolean;
  cantidad_cuotas?: number | null;
  notas_item?: string;
}

export interface ActualizarPresupuestoDigitalDTO {
  fecha_vigencia?: string;
  descuento?: string;
  terminos_condiciones?: string;
  notas?: string;
}

// ========================================
// Respuestas de la API
// ========================================

export interface RespuestaPaginadaPresupuesto {
  count: number;
  next: string | null;
  previous: string | null;
  results: PresupuestoDigital[];
}

export interface RespuestaEmitirPresupuesto {
  mensaje: string;
  presupuesto: {
    id: number;
    estado: string;
    fecha_emitido: string;
    es_editable: boolean;
  };
}

export interface RespuestaVigenciaPresupuesto {
  esta_vigente: boolean;
  fecha_vigencia: string;
  dias_restantes: number;
  estado: string;
  mensaje: string;
}

export interface RespuestaGenerarPDF {
  mensaje: string;
  pdf_url: string;
  codigo_presupuesto: string;
}

export interface RespuestaDesglose {
  codigo_presupuesto: string;
  items: {
    servicio: string;
    pieza_dental: string | null;
    precio_unitario: number;
    descuento_item: number;
    precio_final: number;
    permite_pago_parcial: boolean;
    cantidad_cuotas: number | null;
  }[];
  subtotal: number;
  descuento_global: number;
  total: number;
  resumen: {
    cantidad_items: number;
    items_con_pago_parcial: number;
    es_tramo: boolean;
    numero_tramo: number | null;
  };
}

export interface PlanDisponible {
  id: number;
  paciente: string;
  odontologo: string;
  fecha_plan: string;
  fecha_aprobacion: string;
  total_items: number;
  monto_total: string;
  presupuestos_generados: number;
}

// ========================================
// Filtros para Listado
// ========================================

export interface FiltrosPresupuestosDigitales {
  search?: string;
  estado?: 'Borrador' | 'Emitido' | 'Caducado' | 'Anulado' | '';
  es_tramo?: boolean | '';
  plan_tratamiento?: number;
  ordering?: string;
  page?: number;
  page_size?: number;
}
