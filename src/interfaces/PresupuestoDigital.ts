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

// ========================================
// Aceptación de Presupuestos (SP3-T003)
// ========================================

/**
 * Estructura de la firma digital para aceptación de presupuestos
 * Incluye timestamp, hash SHA-256 y metadata del usuario
 */
export interface FirmaDigital {
  timestamp: string;           // ISO 8601 UTC (ej: "2025-10-26T10:30:00Z")
  user_id: number;             // Código del usuario que firma
  signature_hash: string;      // Hash SHA-256 del contenido firmado (formato: "sha256:abc123...")
  consent_text: string;        // Texto del consentimiento aceptado
  ip_address?: string;         // IP del cliente (opcional)
}

/**
 * DTO para enviar al endpoint de aceptar presupuesto
 */
export interface AceptarPresupuestoDTO {
  tipo_aceptacion: "Total" | "Parcial";
  items_aceptados?: number[];  // Requerido si tipo_aceptacion === "Parcial"
  firma_digital: FirmaDigital;
  notas?: string;              // Notas opcionales del paciente
}

/**
 * Registro de una aceptación de presupuesto
 */
export interface AceptacionPresupuesto {
  id: number;
  tipo_aceptacion: "Total" | "Parcial";
  fecha_aceptacion: string;    // ISO 8601 timestamp
  estado: "Confirmada" | "Anulada";
  items_aceptados?: any[];     // Items con detalles (servicio_nombre, precio_final, etc.)
  comprobante_pdf: string;     // URL relativa del PDF (ej: "/media/comprobantes/...")
  puede_descargar: boolean;
  notas?: string;
  monto_aceptado?: string;     // Monto total aceptado
  firma_digital_hash?: string; // Hash SHA-256 de la firma digital
}

/**
 * Validaciones detalladas de si un presupuesto puede ser aceptado
 */
export interface ValidacionesPresupuesto {
  es_paciente_del_presupuesto: boolean;
  presupuesto_emitido: boolean;
  no_caducado: boolean;
  no_aceptado_previamente: boolean;
  tiene_items: boolean;
}

/**
 * Información resumida del presupuesto para la verificación
 */
export interface InfoPresupuestoVerificacion {
  id: string;
  codigo_presupuesto: string;
  fecha_vigencia: string;
  dias_restantes: number;
  permite_aceptacion_parcial: boolean;
  items_total: number;
  items_con_pago_parcial: number;
}

/**
 * Respuesta del endpoint puede-aceptar
 */
export interface RespuestaPuedeAceptar {
  puede_aceptar: boolean;
  razones: string[];           // Array de razones si no puede aceptar
  validaciones: ValidacionesPresupuesto;
  presupuesto?: InfoPresupuestoVerificacion;  // Presente si puede_aceptar === true
}

/**
 * Respuesta del endpoint aceptar presupuesto
 */
export interface RespuestaAceptarPresupuesto {
  success: boolean;
  mensaje: string;
  aceptacion: AceptacionPresupuesto;
  presupuesto: {
    id: string;
    codigo_presupuesto: string;
    estado_aceptacion: string;  // "Aceptado", "Parcial", "Pendiente"
    total_aceptaciones: number;
  };
}

/**
 * Historial completo de aceptaciones de un presupuesto
 */
export interface HistorialAceptaciones {
  presupuesto_id: string;
  codigo_presupuesto: string;
  total_aceptaciones: number;
  aceptaciones: AceptacionPresupuesto[];
}

/**
 * Filtros para el endpoint mis-presupuestos (pacientes)
 */
export interface FiltrosMisPresupuestos {
  estado_aceptacion?: "Pendiente" | "Aceptado" | "Rechazado" | "Parcial";
  esta_vigente?: boolean;
  plan_tratamiento?: number;
  page?: number;
  page_size?: number;
}

/**
 * Item de presupuesto con información extendida para la vista del paciente
 */
export interface ItemPresupuestoParaPaciente {
  id: number;
  descripcion: string;
  cantidad: number;
  precio_unitario: string;
  subtotal: string;
  permite_pago_parcial: boolean;
  cantidad_cuotas?: number | null;
  pieza_dental?: string | null;
}

/**
 * Presupuesto extendido para la vista del paciente (mis-presupuestos)
 */
export interface PresupuestoParaPaciente {
  id: number;                  // ID numérico del presupuesto
  codigo_presupuesto: string;  // UUID o código corto
  tipo_presupuesto: "Total" | "Parcial";
  fecha_emision: string;
  fecha_vigencia: string;
  esta_vigente: boolean;
  monto_total: string;
  monto_neto: string;
  estado_aceptacion: "Pendiente" | "Aceptado" | "Rechazado" | "Parcial";
  plan_tratamiento: {
    id: number;
    odontologo: string;
  };
  items: ItemPresupuestoParaPaciente[];
  dias_restantes?: number;     // Calculado en frontend
}
