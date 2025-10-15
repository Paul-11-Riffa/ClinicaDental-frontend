// src/services/consentimientoService.ts
import { Api } from '../lib/Api';

// Interface para los datos que se envían al backend al crear un consentimiento
export interface NuevoConsentimientoData {
  paciente: number; // Se requiere el ID del paciente
  consulta?: number; // ID opcional de la consulta relacionada
  plan_tratamiento?: number; // ID opcional del plan de tratamiento
  titulo: string;
  texto_contenido: string;
  firma_base64: string; // La firma como un string en base64
}

// Interface que representa el objeto Consentimiento completo que devuelve la API
export interface Consentimiento {
  id: number;
  paciente: number;
  consulta?: number;
  plan_tratamiento?: number;
  titulo: string;
  texto_contenido:string;
  firma_base64: string;
  paciente_nombre: string;
  paciente_apellido: string;
  fecha_creacion: string;
  fecha_creacion_formateada: string;
  ip_creacion: string;
  empresa: number;
}

/**
 * Llama a la API para crear un nuevo registro de consentimiento firmado.
 * @param datos Los datos del consentimiento a guardar.
 * @returns La respuesta de la API con el consentimiento creado.
 */
export const crearConsentimiento = async (datos: NuevoConsentimientoData): Promise<Consentimiento> => {
  try {
    const response = await Api.post('/consentimientos/', datos);
    return response.data;
  } catch (error) {
    console.error("Error al crear el consentimiento:", error);
    // Propagar el error para que el componente que llama pueda manejarlo
    throw error;
  }
};

/**
 * Llama a la API para obtener la lista de todos los consentimientos de un paciente.
 * @param pacienteId El ID del paciente para filtrar los consentimientos.
 * @returns Una lista de los consentimientos firmados por el paciente.
 */
export const listarConsentimientosDePaciente = async (pacienteId: number): Promise<Consentimiento[]> => {
  try {
    // Usamos el filtro por 'paciente' que definimos en el backend
    const response = await Api.get(`/consentimientos/?paciente=${pacienteId}`);
    // La API devuelve un objeto con formato {count, results, next, previous}
    return response.data.results || [];
  } catch (error) {
    console.error(`Error al listar los consentimientos del paciente ${pacienteId}:`, error);
    throw error;
  }
};

/**
 * Llama a la API para descargar el PDF de un consentimiento.
 * @param consentimientoId El ID del consentimiento para descargar el PDF.
 */
export const descargarPDFConsentimiento = async (consentimientoId: number): Promise<Blob> => {
  try {
    const response = await Api.get(`/consentimientos/${consentimientoId}/pdf/`, {
      responseType: 'blob' // Importante para recibir el PDF como blob
    });
    return response.data;
  } catch (error) {
    console.error(`Error al descargar el PDF del consentimiento ${consentimientoId}:`, error);
    throw error;
  }
};