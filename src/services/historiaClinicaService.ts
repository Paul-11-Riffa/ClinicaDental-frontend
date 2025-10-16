// src/services/historiaClinicaService.ts
import { Api } from '../lib/Api';
import type { 
  HistoriaClinica, 
  HistoriaClinicaCreate, 
  HistoriaClinicaUpdate,
  HCEItem,
  Paciente,
  DocumentoHistoriaClinica 
} from '../interfaces/HistoriaClinica';

/**
 * Obtiene todas las historias clínicas
 * @param pacienteId - Opcional: filtrar por paciente
 */
export const obtenerHistoriasClinicas = async (
  pacienteId?: number
): Promise<HCEItem[]> => {
  try {
    const url = pacienteId 
      ? `/historias-clinicas/?paciente=${pacienteId}`
      : '/historias-clinicas/';
    
    const response = await Api.get<HCEItem[]>(url);
    return response.data;
  } catch (error) {
    console.error('Error al obtener historias clínicas:', error);
    throw error;
  }
};

/**
 * Obtiene una historia clínica específica
 */
export const obtenerHistoriaClinica = async (
  id: number
): Promise<HistoriaClinica> => {
  try {
    const response = await Api.get<HistoriaClinica>(`/historias-clinicas/${id}/`);
    return response.data;
  } catch (error) {
    console.error(`Error al obtener historia clínica ${id}:`, error);
    throw error;
  }
};

/**
 * Crea una nueva historia clínica
 */
export const crearHistoriaClinica = async (
  data: HistoriaClinicaCreate
): Promise<HistoriaClinica> => {
  try {
    const response = await Api.post<HistoriaClinica>('/historias-clinicas/', data);
    return response.data;
  } catch (error) {
    console.error('Error al crear historia clínica:', error);
    throw error;
  }
};

/**
 * Actualiza una historia clínica existente
 */
export const actualizarHistoriaClinica = async (
  id: number,
  data: HistoriaClinicaUpdate
): Promise<HistoriaClinica> => {
  try {
    const response = await Api.patch<HistoriaClinica>(`/historias-clinicas/${id}/`, data);
    return response.data;
  } catch (error) {
    console.error(`Error al actualizar historia clínica ${id}:`, error);
    throw error;
  }
};

/**
 * Elimina una historia clínica
 */
export const eliminarHistoriaClinica = async (id: number): Promise<void> => {
  try {
    await Api.delete(`/historias-clinicas/${id}/`);
  } catch (error) {
    console.error(`Error al eliminar historia clínica ${id}:`, error);
    throw error;
  }
};

/**
 * Obtiene todos los pacientes para el selector
 */
export const obtenerPacientes = async (): Promise<Paciente[]> => {
  try {
    const response = await Api.get<Paciente[]>('/clinic/pacientes/');
    return response.data;
  } catch (error) {
    console.error('Error al obtener pacientes:', error);
    throw error;
  }
};

/**
 * Busca pacientes por nombre, apellido o RUT
 */
export const buscarPacientes = async (query: string): Promise<Paciente[]> => {
  try {
    const response = await Api.get<Paciente[]>(`/clinic/pacientes/?search=${encodeURIComponent(query)}`);
    return response.data;
  } catch (error) {
    console.error('Error al buscar pacientes:', error);
    throw error;
  }
};

/**
 * Obtiene documentos asociados a una historia clínica
 */
export const obtenerDocumentosHistoria = async (
  historiaId: number
): Promise<DocumentoHistoriaClinica[]> => {
  try {
    const response = await Api.get<DocumentoHistoriaClinica[]>(
      `/historias-clinicas/${historiaId}/documentos/`
    );
    return response.data;
  } catch (error) {
    console.error(`Error al obtener documentos de historia ${historiaId}:`, error);
    throw error;
  }
};

/**
 * Sube un documento a una historia clínica
 */
export const subirDocumentoHistoria = async (
  historiaId: number,
  formData: FormData
): Promise<DocumentoHistoriaClinica> => {
  try {
    const response = await Api.post<DocumentoHistoriaClinica>(
      `/historias-clinicas/${historiaId}/documentos/`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error(`Error al subir documento a historia ${historiaId}:`, error);
    throw error;
  }
};

/**
 * Elimina un documento de una historia clínica
 */
export const eliminarDocumentoHistoria = async (
  historiaId: number,
  documentoId: number
): Promise<void> => {
  try {
    await Api.delete(`/historias-clinicas/${historiaId}/documentos/${documentoId}/`);
  } catch (error) {
    console.error(`Error al eliminar documento ${documentoId} de historia ${historiaId}:`, error);
    throw error;
  }
};

/**
 * Exporta historias clínicas a PDF o Excel
 */
export const exportarHistoriasClinicas = async (
  pacienteId?: number,
  formato: 'pdf' | 'excel' = 'pdf'
): Promise<Blob> => {
  try {
    const params = new URLSearchParams();
    if (pacienteId) params.append('paciente', pacienteId.toString());
    params.append('formato', formato);
    
    const response = await Api.get(`/historias-clinicas/exportar/?${params}`, {
      responseType: 'blob'
    });
    
    return response.data;
  } catch (error) {
    console.error('Error al exportar historias clínicas:', error);
    throw error;
  }
};

/**
 * Formatea la fecha para mostrar en la UI
 */
export const formatearFecha = (fecha: string): string => {
  try {
    return new Date(fecha).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return fecha;
  }
};

/**
 * Formatea el nombre completo del paciente
 */
export const formatearNombrePaciente = (historia: HistoriaClinica | HCEItem): string => {
  if ('pacientecodigo' in historia && typeof historia.pacientecodigo === 'object') {
    const { nombre, apellido } = historia.pacientecodigo.codusuario;
    return `${nombre} ${apellido}`;
  }
  return 'Paciente desconocido';
};

/**
 * Valida los datos antes de crear/actualizar una historia clínica
 */
export const validarDatosHistoria = (data: HistoriaClinicaCreate | HistoriaClinicaUpdate): string[] => {
  const errores: string[] = [];
  
  if ('pacientecodigo' in data && (!data.pacientecodigo || data.pacientecodigo <= 0)) {
    errores.push('Debe seleccionar un paciente válido');
  }
  
  if ('motivoconsulta' in data && (!data.motivoconsulta || !data.motivoconsulta.trim())) {
    errores.push('El motivo de consulta es obligatorio');
  }
  
  if ('diagnostico' in data && (!data.diagnostico || !data.diagnostico.trim())) {
    errores.push('El diagnóstico es obligatorio');
  }
  
  if ('tratamiento' in data && (!data.tratamiento || !data.tratamiento.trim())) {
    errores.push('El tratamiento es obligatorio');
  }
  
  return errores;
};