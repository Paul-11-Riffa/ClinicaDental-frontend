import { Api } from "../lib/Api";
import type {
  Combo,
  ComboListado,
  RespuestaPaginadaCombos,
  NuevoCombo,
  ActualizarCombo,
  PreviewComboRequest,
  PreviewComboResponse,
  ComboResponse,
  FiltrosCombos,
  EstadisticasCombos,
} from "../interfaces/Combo";

/**
 * Servicio para gestionar combos de servicios dentales
 * 
 * Base URL: /api/combos-servicios/
 * 
 * Ejemplo en desarrollo: http://localhost:8000/api/combos-servicios/
 * Ejemplo en producción: https://norte.notificct.dpdns.org/api/combos-servicios/
 * 
 * ✅ Requiere autenticación para todas las operaciones
 * ✅ Multi-tenant mediante header X-Tenant-Subdomain
 */

/**
 * Obtiene el listado de combos con filtros, búsqueda y paginación
 * @param filtros - Filtros opcionales para la búsqueda
 * @returns Promise con la respuesta paginada de combos
 */
export async function obtenerCombos(
  filtros?: FiltrosCombos
): Promise<RespuestaPaginadaCombos> {
  try {
    const response = await Api.get<RespuestaPaginadaCombos>(
      "/combos-servicios/",
      {
        params: filtros,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error al obtener combos:", error);
    throw error;
  }
}

/**
 * Obtiene el detalle completo de un combo específico
 * @param id - ID del combo
 * @returns Promise con el combo completo
 */
export async function obtenerComboDetalle(id: number): Promise<Combo> {
  try {
    const response = await Api.get<Combo>(`/combos-servicios/${id}/`);
    return response.data;
  } catch (error) {
    console.error(`Error al obtener combo ${id}:`, error);
    throw error;
  }
}

/**
 * Obtiene el detalle completo de un combo con información extendida de servicios
 * @param id - ID del combo
 * @returns Promise con el combo y detalles completos de servicios
 */
export async function obtenerComboDetalleCompleto(id: number): Promise<Combo> {
  try {
    const response = await Api.get<Combo>(
      `/combos-servicios/${id}/detalle_completo/`
    );
    return response.data;
  } catch (error) {
    console.error(`Error al obtener detalle completo del combo ${id}:`, error);
    throw error;
  }
}

/**
 * Crea un nuevo combo de servicios
 * @param combo - Datos del nuevo combo
 * @returns Promise con la respuesta del servidor y el combo creado
 */
export async function crearCombo(combo: NuevoCombo): Promise<ComboResponse> {
  try {
    const response = await Api.post<ComboResponse>(
      "/combos-servicios/",
      combo
    );
    return response.data;
  } catch (error) {
    console.error("Error al crear combo:", error);
    throw error;
  }
}

/**
 * Actualiza un combo existente
 * @param id - ID del combo a actualizar
 * @param combo - Datos actualizados del combo
 * @returns Promise con la respuesta del servidor y el combo actualizado
 */
export async function actualizarCombo(
  id: number,
  combo: NuevoCombo
): Promise<ComboResponse> {
  try {
    const response = await Api.put<ComboResponse>(
      `/combos-servicios/${id}/`,
      combo
    );
    return response.data;
  } catch (error) {
    console.error(`Error al actualizar combo ${id}:`, error);
    throw error;
  }
}

/**
 * Elimina un combo
 * @param id - ID del combo a eliminar
 * @returns Promise que se resuelve cuando el combo es eliminado
 */
export async function eliminarCombo(id: number): Promise<void> {
  try {
    await Api.delete(`/combos-servicios/${id}/`);
  } catch (error) {
    console.error(`Error al eliminar combo ${id}:`, error);
    throw error;
  }
}

/**
 * Previsualiza los cálculos de un combo sin guardarlo
 * Útil para mostrar el precio final mientras el usuario configura el combo
 * @param preview - Datos para previsualizar
 * @returns Promise con los cálculos del combo
 */
export async function previsualizarCombo(
  preview: PreviewComboRequest
): Promise<PreviewComboResponse> {
  try {
    const response = await Api.post<PreviewComboResponse>(
      "/combos-servicios/previsualizar/",
      preview
    );
    return response.data;
  } catch (error) {
    console.error("Error al previsualizar combo:", error);
    throw error;
  }
}

/**
 * Activa un combo (lo hace disponible para uso)
 * @param id - ID del combo a activar
 * @returns Promise con la respuesta del servidor
 */
export async function activarCombo(id: number): Promise<ComboResponse> {
  try {
    const response = await Api.post<ComboResponse>(
      `/combos-servicios/${id}/activar/`,
      {}
    );
    return response.data;
  } catch (error) {
    console.error(`Error al activar combo ${id}:`, error);
    throw error;
  }
}

/**
 * Desactiva un combo (lo oculta para uso)
 * @param id - ID del combo a desactivar
 * @returns Promise con la respuesta del servidor
 */
export async function desactivarCombo(id: number): Promise<ComboResponse> {
  try {
    const response = await Api.post<ComboResponse>(
      `/combos-servicios/${id}/desactivar/`,
      {}
    );
    return response.data;
  } catch (error) {
    console.error(`Error al desactivar combo ${id}:`, error);
    throw error;
  }
}

/**
 * Alterna el estado activo de un combo (activa si está inactivo, desactiva si está activo)
 * @param id - ID del combo
 * @param activo - Estado actual del combo
 * @returns Promise con la respuesta del servidor
 */
export async function toggleComboActivo(
  id: number,
  activo: boolean
): Promise<ComboResponse> {
  return activo ? desactivarCombo(id) : activarCombo(id);
}

/**
 * Obtiene estadísticas generales de combos
 * @returns Promise con las estadísticas
 */
export async function obtenerEstadisticasCombos(): Promise<EstadisticasCombos> {
  try {
    const response = await Api.get<EstadisticasCombos>(
      "/combos-servicios/estadisticas/"
    );
    return response.data;
  } catch (error) {
    console.error("Error al obtener estadísticas de combos:", error);
    throw error;
  }
}

/**
 * Valida los datos de un combo antes de enviarlo al backend
 * @param combo - Datos del combo a validar
 * @returns Array de errores encontrados (vacío si no hay errores)
 */
export function validarCombo(combo: NuevoCombo): string[] {
  const errores: string[] = [];

  // Validar nombre
  if (!combo.nombre || combo.nombre.trim() === "") {
    errores.push("El nombre del combo es obligatorio");
  }
  if (combo.nombre && combo.nombre.length > 200) {
    errores.push("El nombre no puede exceder 200 caracteres");
  }

  // Validar tipo de precio
  const tiposValidos: string[] = ["PORCENTAJE", "MONTO_FIJO", "PROMOCION"];
  if (!tiposValidos.includes(combo.tipo_precio)) {
    errores.push("Tipo de precio inválido");
  }

  // Validar valor de precio
  const valorPrecio = Number(combo.valor_precio);
  if (isNaN(valorPrecio) || valorPrecio <= 0) {
    errores.push("El valor del precio debe ser mayor a 0");
  }

  // Validar porcentaje
  if (combo.tipo_precio === "PORCENTAJE" && valorPrecio > 100) {
    errores.push("El descuento no puede ser mayor a 100%");
  }

  // Validar servicios
  if (!combo.detalles || combo.detalles.length === 0) {
    errores.push("Debes agregar al menos un servicio al combo");
  }

  // Validar cantidades y servicios duplicados
  if (combo.detalles && combo.detalles.length > 0) {
    const servicioIds = new Set<number>();

    combo.detalles.forEach((detalle, index) => {
      // Validar cantidad
      if (!detalle.cantidad || detalle.cantidad < 1) {
        errores.push(
          `El servicio #${index + 1} debe tener cantidad mayor a 0`
        );
      }

      // Validar duplicados
      if (servicioIds.has(detalle.servicio)) {
        errores.push("No puedes agregar el mismo servicio dos veces");
      }
      servicioIds.add(detalle.servicio);
    });
  }

  return errores;
}
