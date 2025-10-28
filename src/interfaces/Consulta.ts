/**
 * Interfaces para Consultas (Citas)
 */

export interface Consulta {
  id: number;
  fecha: string; // YYYY-MM-DD
  codpaciente: number;
  cododontologo: number;
  idhorario: number;
  idtipoconsulta: number;
  idestadoconsulta: number;
  observaciones?: string;
  empresa: number;

  // Campos expandidos (del serializer)
  paciente_nombre?: string;
  odontologo_nombre?: string;
  tipo_consulta?: string;
  estado_consulta?: string;
  horario_hora?: string;
}

export interface ConsultaDetalle extends Consulta {
  // Información detallada adicional si es necesaria
  created_at?: string;
  updated_at?: string;
}

export interface FiltrosConsultas {
  codpaciente?: number;
  cododontologo?: number;
  idestadoconsulta?: number;
  fecha?: string; // YYYY-MM-DD o "hoy"
  fecha_desde?: string;
  fecha_hasta?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

export interface RespuestaPaginadaConsultas {
  count: number;
  next: string | null;
  previous: string | null;
  results: Consulta[];
}

export interface CrearConsultaDTO {
  fecha: string;
  codpaciente: number;
  cododontologo: number;
  idhorario: number;
  idtipoconsulta: number;
  idestadoconsulta?: number;
  observaciones?: string;
}
