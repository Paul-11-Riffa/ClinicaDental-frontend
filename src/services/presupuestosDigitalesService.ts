import { Api } from "../lib/Api";
import type {
  PresupuestoDigital,
  PresupuestoDigitalDetalle,
  RespuestaPaginadaPresupuesto,
  CrearPresupuestoDigitalDTO,
  ActualizarPresupuestoDigitalDTO,
  RespuestaEmitirPresupuesto,
  RespuestaVigenciaPresupuesto,
  RespuestaGenerarPDF,
  RespuestaDesglose,
  PlanDisponible,
  FiltrosPresupuestosDigitales,
  // Imports para aceptación de presupuestos (SP3-T003)
  FiltrosMisPresupuestos,
  RespuestaPuedeAceptar,
  AceptarPresupuestoDTO,
  RespuestaAceptarPresupuesto,
  HistorialAceptaciones,
  FirmaDigital,
} from "../interfaces/PresupuestoDigital";

/**
 * Servicio para gestionar Presupuestos Digitales
 * 
 * Base URL: /api/presupuestos-digitales/
 * 
 * Funcionalidades implementadas (SP3-T002):
 * - Generar presupuestos totales o parciales (por tramos)
 * - Seleccionar ítems específicos del plan
 * - Aplicar descuentos globales y por ítem
 * - Configurar pagos parciales/cuotas
 * - Gestión de estados: Borrador → Emitido → Caducado
 * - Control de vigencia con fechas límite
 * - Generación de PDF trazable
 */

// ========================================
// CRUD de Presupuestos Digitales
// ========================================

/**
 * Obtiene el listado de presupuestos digitales con filtros y paginación
 * @param filtros - Filtros opcionales para la búsqueda
 * @returns Promise con la respuesta paginada de presupuestos
 */
export async function obtenerPresupuestosDigitales(
  filtros?: FiltrosPresupuestosDigitales
): Promise<RespuestaPaginadaPresupuesto> {
  try {
    const response = await Api.get<RespuestaPaginadaPresupuesto>(
      "/presupuestos-digitales/",
      { params: filtros }
    );
    return response.data;
  } catch (error) {
    console.error("Error al obtener presupuestos digitales:", error);
    throw error;
  }
}

/**
 * Obtiene el detalle completo de un presupuesto digital
 * @param id - ID del presupuesto a consultar
 * @returns Promise con los datos completos del presupuesto (incluye items)
 */
export async function obtenerPresupuestoDigital(
  id: number
): Promise<PresupuestoDigitalDetalle> {
  try {
    const response = await Api.get<PresupuestoDigitalDetalle>(
      `/presupuestos-digitales/${id}/`
    );
    return response.data;
  } catch (error) {
    console.error(`Error al obtener presupuesto digital ${id}:`, error);
    throw error;
  }
}

/**
 * Crea un nuevo presupuesto digital (estado inicial: Borrador)
 * @param presupuesto - Datos del nuevo presupuesto
 * @returns Promise con el presupuesto creado (incluye items y detalles completos)
 */
export async function crearPresupuestoDigital(
  presupuesto: CrearPresupuestoDigitalDTO
): Promise<PresupuestoDigitalDetalle> {
  try {
    const response = await Api.post<PresupuestoDigitalDetalle>(
      "/presupuestos-digitales/",
      presupuesto
    );
    return response.data;
  } catch (error) {
    console.error("Error al crear presupuesto digital:", error);
    throw error;
  }
}

/**
 * Actualiza un presupuesto digital (solo si está en estado Borrador)
 * @param id - ID del presupuesto a actualizar
 * @param cambios - Campos a actualizar
 * @returns Promise con el presupuesto actualizado
 */
export async function actualizarPresupuestoDigital(
  id: number,
  cambios: ActualizarPresupuestoDigitalDTO
): Promise<PresupuestoDigital> {
  try {
    const response = await Api.patch<PresupuestoDigital>(
      `/presupuestos-digitales/${id}/`,
      cambios
    );
    return response.data;
  } catch (error) {
    console.error(`Error al actualizar presupuesto digital ${id}:`, error);
    throw error;
  }
}

/**
 * Elimina un presupuesto digital (solo si está en estado Borrador)
 * @param id - ID del presupuesto a eliminar
 * @returns Promise vacía
 */
export async function eliminarPresupuestoDigital(id: number): Promise<void> {
  try {
    await Api.delete(`/presupuestos-digitales/${id}/`);
  } catch (error) {
    console.error(`Error al eliminar presupuesto digital ${id}:`, error);
    throw error;
  }
}

// ========================================
// Acciones de Presupuesto
// ========================================

/**
 * Emite un presupuesto digital (lo hace inmutable)
 * Solo puede ser ejecutado por el odontólogo asignado o admin
 * @param id - ID del presupuesto a emitir
 * @returns Promise con la respuesta de emisión
 */
export async function emitirPresupuestoDigital(
  id: number
): Promise<RespuestaEmitirPresupuesto> {
  try {
    const response = await Api.post<RespuestaEmitirPresupuesto>(
      `/presupuestos-digitales/${id}/emitir/`,
      { confirmar: true }
    );
    return response.data;
  } catch (error) {
    console.error(`Error al emitir presupuesto digital ${id}:`, error);
    throw error;
  }
}

/**
 * Verifica la vigencia de un presupuesto digital
 * @param id - ID del presupuesto
 * @returns Promise con información de vigencia
 */
export async function verificarVigenciaPresupuesto(
  id: number
): Promise<RespuestaVigenciaPresupuesto> {
  try {
    const response = await Api.get<RespuestaVigenciaPresupuesto>(
      `/presupuestos-digitales/${id}/vigencia/`
    );
    return response.data;
  } catch (error) {
    console.error(`Error al verificar vigencia del presupuesto ${id}:`, error);
    throw error;
  }
}

/**
 * Genera y descarga el PDF de un presupuesto digital
 * @param id - ID del presupuesto
 * @returns Promise con el blob del PDF para descarga directa
 */
export async function generarPDFPresupuesto(
  id: number
): Promise<Blob> {
  try {
    const response = await Api.post(
      `/presupuestos-digitales/${id}/generar-pdf/`,
      {},
      {
        responseType: 'blob' // ⚠️ IMPORTANTE: El backend retorna PDF binario, no JSON
      }
    );
    return response.data;
  } catch (error) {
    console.error(`Error al generar PDF del presupuesto ${id}:`, error);
    throw error;
  }
}

/**
 * Obtiene el desglose detallado de un presupuesto
 * @param id - ID del presupuesto
 * @returns Promise con el desglose completo
 */
export async function obtenerDesglosePresupuesto(
  id: number
): Promise<RespuestaDesglose> {
  try {
    const response = await Api.get<RespuestaDesglose>(
      `/presupuestos-digitales/${id}/desglose/`
    );
    return response.data;
  } catch (error) {
    console.error(`Error al obtener desglose del presupuesto ${id}:`, error);
    throw error;
  }
}

/**
 * Obtiene la lista de planes de tratamiento disponibles para generar presupuestos
 * (solo planes aprobados)
 * @returns Promise con la lista de planes disponibles
 */
export async function obtenerPlanesDisponibles(): Promise<PlanDisponible[]> {
  try {
    const response = await Api.get<PlanDisponible[]>(
      "/presupuestos-digitales/planes-disponibles/"
    );
    return response.data;
  } catch (error) {
    console.error("Error al obtener planes disponibles:", error);
    throw error;
  }
}

// ========================================
// Helpers
// ========================================

/**
 * Formatea el monto en formato moneda boliviana
 * @param monto - Monto a formatear (puede ser string, number, null o undefined)
 * @returns String formateado (ej: "Bs 1.500,00") o "Bs 0,00" si el valor es inválido
 */
export function formatearMonto(monto: string | number | null | undefined): string {
  // Validar que el monto no sea null, undefined o vacío
  if (monto === null || monto === undefined || monto === '' || monto === 'null' || monto === 'undefined') {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
    }).format(0);
  }

  // Convertir a número
  let numero: number;
  if (typeof monto === 'string') {
    numero = parseFloat(monto);
    // Verificar que parseFloat haya retornado un número válido
    if (isNaN(numero)) {
      console.warn(`⚠️ formatearMonto: Valor inválido recibido: "${monto}". Usando 0.`);
      numero = 0;
    }
  } else {
    numero = monto;
    // Verificar que sea un número válido
    if (isNaN(numero) || !isFinite(numero)) {
      console.warn(`⚠️ formatearMonto: Número inválido recibido: ${monto}. Usando 0.`);
      numero = 0;
    }
  }

  return new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB',
  }).format(numero);
}

/**
 * Obtiene el color de badge según el estado del presupuesto
 * @param estado - Estado del presupuesto
 * @returns Clases de Tailwind para el badge
 */
export function getEstadoPresupuestoColor(estado: string): string {
  const colores: Record<string, string> = {
    Borrador: 'bg-yellow-100 text-yellow-800',
    Emitido: 'bg-green-100 text-green-800',
    Caducado: 'bg-red-100 text-red-800',
    Anulado: 'bg-gray-100 text-gray-800',
  };
  return colores[estado] || 'bg-gray-100 text-gray-800';
}

/**
 * Calcula los días restantes hasta la fecha de vigencia
 * @param fechaVigencia - Fecha de vigencia en formato YYYY-MM-DD
 * @returns Número de días restantes (puede ser negativo si ya venció)
 */
export function calcularDiasRestantes(fechaVigencia: string): number {
  const hoy = new Date();
  const vigencia = new Date(fechaVigencia);
  const diferencia = vigencia.getTime() - hoy.getTime();
  return Math.ceil(diferencia / (1000 * 60 * 60 * 24));
}

/**
 * Determina si un presupuesto está vigente
 * @param fechaVigencia - Fecha de vigencia en formato YYYY-MM-DD
 * @param estado - Estado actual del presupuesto
 * @returns true si está vigente, false si no
 */
export function estaVigente(fechaVigencia: string, estado: string): boolean {
  if (estado !== 'Emitido') return false;
  const diasRestantes = calcularDiasRestantes(fechaVigencia);
  return diasRestantes >= 0;
}

// ========================================
// Aceptación de Presupuestos (SP3-T003)
// ========================================

/**
 * Obtiene los presupuestos del paciente autenticado
 * Endpoint exclusivo para pacientes que retorna solo sus presupuestos
 * @param filtros - Filtros opcionales (estado, vigencia, plan)
 * @returns Promise con presupuestos paginados del paciente
 */
export async function obtenerMisPresupuestos(
  filtros?: FiltrosMisPresupuestos
): Promise<RespuestaPaginadaPresupuesto> {
  try {
    const response = await Api.get<RespuestaPaginadaPresupuesto>(
      "/presupuestos-digitales/mis-presupuestos/",
      { params: filtros }
    );
    return response.data;
  } catch (error) {
    console.error("Error al obtener mis presupuestos:", error);
    throw error;
  }
}

/**
 * Verifica si el paciente puede aceptar un presupuesto
 * Valida: permisos, vigencia, estado, items, etc.
 * @param id - ID del presupuesto a verificar
 * @returns Promise con validaciones detalladas y razones
 */
export async function puedeAceptarPresupuesto(
  id: number
): Promise<RespuestaPuedeAceptar> {
  try {
    const response = await Api.get<RespuestaPuedeAceptar>(
      `/presupuestos-digitales/${id}/puede-aceptar/`
    );
    return response.data;
  } catch (error) {
    console.error(`Error al verificar si puede aceptar presupuesto ${id}:`, error);
    throw error;
  }
}

/**
 * Acepta un presupuesto (total o parcialmente) con firma digital
 * 
 * ⚠️ IMPORTANTE: Este endpoint tiene rate limiting de 10 aceptaciones/hora
 * 
 * Errores posibles:
 * - 400: Validación fallida (presupuesto caducado, ya aceptado, etc.)
 * - 403: Sin permisos (no es el paciente del presupuesto)
 * - 429: Rate limit excedido (más de 10 aceptaciones en 1 hora)
 * 
 * @param id - ID del presupuesto a aceptar
 * @param datos - Tipo aceptación, firma digital, items seleccionados, notas
 * @returns Promise con detalles de la aceptación y URL del comprobante PDF
 */
export async function aceptarPresupuesto(
  id: number,
  datos: AceptarPresupuestoDTO
): Promise<RespuestaAceptarPresupuesto> {
  try {
    const response = await Api.post<RespuestaAceptarPresupuesto>(
      `/presupuestos-digitales/${id}/aceptar/`,
      datos
    );
    return response.data;
  } catch (error: any) {
    console.error(`Error al aceptar presupuesto ${id}:`, error);
    
    // Manejo especial de error de rate limiting
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      const mensaje = retryAfter 
        ? `Límite de aceptaciones alcanzado. Intenta nuevamente en ${retryAfter} segundos.`
        : 'Has alcanzado el límite de 10 aceptaciones por hora. Por favor, intenta más tarde.';
      throw new Error(mensaje);
    }
    
    throw error;
  }
}

/**
 * Obtiene el historial completo de aceptaciones de un presupuesto
 * Útil para ver aceptaciones parciales previas
 * @param id - ID del presupuesto
 * @returns Promise con array de aceptaciones ordenadas por fecha (más reciente primero)
 */
export async function obtenerHistorialAceptaciones(
  id: number
): Promise<HistorialAceptaciones> {
  try {
    const response = await Api.get<HistorialAceptaciones>(
      `/presupuestos-digitales/${id}/historial-aceptaciones/`
    );
    return response.data;
  } catch (error) {
    console.error(`Error al obtener historial de aceptaciones del presupuesto ${id}:`, error);
    throw error;
  }
}

/**
 * Descarga el comprobante PDF de una aceptación específica
 * El PDF incluye código QR para verificación
 * 
 * Uso:
 * ```typescript
 * const blob = await descargarComprobanteAceptacion(42);
 * const url = window.URL.createObjectURL(blob);
 * const link = document.createElement('a');
 * link.href = url;
 * link.download = `comprobante_${codigoPresupuesto}.pdf`;
 * link.click();
 * window.URL.revokeObjectURL(url);
 * ```
 * 
 * @param aceptacionId - ID de la aceptación (no del presupuesto)
 * @returns Promise con el Blob del PDF
 */
export async function descargarComprobanteAceptacion(
  aceptacionId: number
): Promise<Blob> {
  try {
    const response = await Api.get(
      `/presupuestos-digitales/aceptaciones/${aceptacionId}/descargar-comprobante/`,
      { responseType: 'blob' }
    );
    return response.data;
  } catch (error) {
    console.error(`Error al descargar comprobante de aceptación ${aceptacionId}:`, error);
    throw error;
  }
}

/**
 * Genera el hash SHA-256 para la firma digital
 * Utiliza Web Crypto API nativa del navegador
 * 
 * @param data - String con los datos a hashear (timestamp|userId|presupuestoId|items)
 * @returns Promise con el hash en formato hexadecimal (sin prefijo "sha256:")
 * @throws Error si el navegador no soporta Web Crypto API
 */
export async function generarHashFirma(data: string): Promise<string> {
  try {
    // Verificar soporte de Web Crypto API
    if (!crypto?.subtle?.digest) {
      throw new Error('Tu navegador no soporta la generación de firmas digitales. Por favor, actualiza tu navegador.');
    }

    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Backend espera el hash sin prefijo "sha256:"
    return hashHex;
  } catch (error) {
    console.error("Error al generar hash de firma digital:", error);
    throw error instanceof Error ? error : new Error("No se pudo generar la firma digital");
  }
}

/**
 * Construye la estructura completa de firma digital
 * 
 * @param userId - ID del usuario que firma
 * @param presupuestoId - ID del presupuesto
 * @param itemsAceptados - Array de IDs de items (vacío si aceptación total)
 * @param consentText - Texto del consentimiento
 * @returns Promise con objeto FirmaDigital completo
 */
export async function construirFirmaDigital(
  userId: number,
  presupuestoId: string | number,
  itemsAceptados: number[],
  consentText: string
): Promise<FirmaDigital> {
  try {
    // Timestamp en formato ISO 8601 UTC
    const timestamp = new Date().toISOString();

    // Construir string de datos para hashear (incluye consent para mayor seguridad)
    const itemsStr = itemsAceptados.sort().join(',');
    const dataParaHash = `${timestamp}|${userId}|${presupuestoId}|${itemsStr}|${consentText}`;

    // Generar hash SHA-256
    const signature_hash = await generarHashFirma(dataParaHash);
    
    // Intentar obtener IP (opcional, puede fallar en algunos contextos)
    let ip_address: string | undefined;
    try {
      // Esta es una aproximación - en producción idealmente el backend la detecta
      ip_address = window.location.hostname;
    } catch {
      ip_address = undefined;
    }
    
    return {
      timestamp,
      user_id: userId,
      signature_hash,
      consent_text: consentText,
      ip_address,
    };
  } catch (error) {
    console.error("Error al construir firma digital:", error);
    throw error;
  }
}
