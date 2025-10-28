import { Api, TENANT_SUBDOMAIN } from "../lib/Api";
import type {
  Consulta,
  ConsultaDetalle,
  FiltrosConsultas,
  RespuestaPaginadaConsultas,
  CrearConsultaDTO,
} from "../interfaces/Consulta";

/**
 * Servicio para gestionar Consultas (Citas)
 * Base URL: /api/consultas/
 */

/**
 * Headers comunes para todas las peticiones
 */
const getHeaders = () => {
  const token = localStorage.getItem("authToken");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Token ${token}`;
  }

  if (TENANT_SUBDOMAIN) {
    headers["X-Tenant-Subdomain"] = TENANT_SUBDOMAIN;
  }

  return headers;
};

/**
 * Obtener listado de consultas con filtros
 * @param filtros Filtros opcionales
 * @returns Lista paginada de consultas
 */
export const obtenerConsultas = async (
  filtros?: FiltrosConsultas
): Promise<RespuestaPaginadaConsultas> => {
  try {
    const response = await Api.get<RespuestaPaginadaConsultas>(
      "/consultas/",
      {
        params: filtros,
        headers: getHeaders(),
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error al obtener consultas:", error);
    throw error.response?.data || error;
  }
};

/**
 * Obtener consultas de un paciente específico
 * @param pacienteId ID del paciente
 * @param filtrosAdicionales Filtros adicionales opcionales
 * @returns Lista de consultas del paciente
 */
export const obtenerConsultasPorPaciente = async (
  pacienteId: number,
  filtrosAdicionales?: Omit<FiltrosConsultas, 'codpaciente'>
): Promise<Consulta[]> => {
  try {
    const response = await obtenerConsultas({
      codpaciente: pacienteId,
      page_size: 1000, // Obtener todas las consultas del paciente
      ...filtrosAdicionales,
    });
    return response.results;
  } catch (error: any) {
    console.error("Error al obtener consultas del paciente:", error);
    throw error;
  }
};

/**
 * Obtener consultas de un odontólogo específico
 * @param odontologoId ID del odontólogo
 * @param filtrosAdicionales Filtros adicionales opcionales
 * @returns Lista de consultas del odontólogo
 */
export const obtenerConsultasPorOdontologo = async (
  odontologoId: number,
  filtrosAdicionales?: Omit<FiltrosConsultas, 'cododontologo'>
): Promise<Consulta[]> => {
  try {
    const response = await obtenerConsultas({
      cododontologo: odontologoId,
      page_size: 1000,
      ...filtrosAdicionales,
    });
    return response.results;
  } catch (error: any) {
    console.error("Error al obtener consultas del odontólogo:", error);
    throw error;
  }
};

/**
 * Obtener detalle de una consulta específica
 * @param id ID de la consulta
 * @returns Detalle de la consulta
 */
export const obtenerConsulta = async (
  id: number
): Promise<ConsultaDetalle> => {
  try {
    const response = await Api.get<ConsultaDetalle>(
      `/consultas/${id}/`,
      {
        headers: getHeaders(),
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error al obtener consulta:", error);
    throw error.response?.data || error;
  }
};

/**
 * Crear nueva consulta
 * @param datos Datos de la consulta
 * @returns Consulta creada
 */
export const crearConsulta = async (
  datos: CrearConsultaDTO
): Promise<Consulta> => {
  try {
    const response = await Api.post<Consulta>(
      "/consultas/",
      datos,
      {
        headers: getHeaders(),
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error al crear consulta:", error);
    throw error.response?.data || error;
  }
};

/**
 * Formatear fecha de consulta para mostrar
 * @param fecha Fecha en formato YYYY-MM-DD
 * @returns Fecha formateada
 */
export const formatearFechaConsulta = (fecha: string): string => {
  const date = new Date(fecha + 'T00:00:00');
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
};

// Exportar todo el servicio
export default {
  obtenerConsultas,
  obtenerConsultasPorPaciente,
  obtenerConsultasPorOdontologo,
  obtenerConsulta,
  crearConsulta,
  formatearFechaConsulta,
};
