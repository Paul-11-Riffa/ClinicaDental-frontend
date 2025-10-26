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
 * @param monto - Monto a formatear
 * @returns String formateado (ej: "Bs 1.500,00")
 */
export function formatearMonto(monto: string | number): string {
  const numero = typeof monto === 'string' ? parseFloat(monto) : monto;
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
