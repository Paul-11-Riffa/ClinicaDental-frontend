// src/interfaces/HistoriaClinica.ts

export interface Usuario {
  codigo: number;
  nombre: string;
  apellido: string;
  correoelectronico?: string;
  telefono?: string;
  rut?: string;
}

export interface Paciente {
  codigo: number;
  codusuario: Usuario;
  carnetidentidad?: string | null;
  fechanacimiento?: string | null;
  direccion?: string | null;
}

export interface HistoriaClinica {
  id: number;
  pacientecodigo: {
    codigo: number;
    codusuario: {
      nombre: string;
      apellido: string;
      rut: string;
    };
  };
  episodio: number;
  fecha: string;
  motivoconsulta: string;
  antecedentesfamiliares?: string;
  antecedentespersonales?: string;
  examengeneral?: string;
  examenregional?: string;
  examenbucal?: string;
  diagnostico: string;
  tratamiento: string;
  receta?: string;
  alergias?: string;
  enfermedades?: string;
  updated_at?: string;
}

export interface HistoriaClinicaCreate {
  pacientecodigo: number;
  motivoconsulta: string;
  antecedentesfamiliares?: string;
  antecedentespersonales?: string;
  examengeneral?: string;
  examenregional?: string;
  examenbucal?: string;
  diagnostico: string;
  tratamiento: string;
  receta?: string;
  alergias?: string;
  enfermedades?: string;
}

export interface HistoriaClinicaUpdate {
  motivoconsulta?: string;
  antecedentesfamiliares?: string;
  antecedentespersonales?: string;
  examengeneral?: string;
  examenregional?: string;
  examenbucal?: string;
  diagnostico?: string;
  tratamiento?: string;
  receta?: string;
  alergias?: string;
  enfermedades?: string;
}

// Para compatibilidad con el formato actual del backend
export interface HCEItem {
  id: number;
  pacientecodigo: number;
  episodio: number;
  fecha: string; // ISO
  alergias?: string | null;
  enfermedades?: string | null;
  motivoconsulta?: string | null;
  diagnostico?: string | null;
  updated_at?: string | null;
  antecedentesfamiliares?: string | null;
  antecedentespersonales?: string | null;
  examengeneral?: string | null;
  examenregional?: string | null;
  examenbucal?: string | null;
  tratamiento?: string | null;
  receta?: string | null;
}

export interface DocumentoHistoriaClinica {
  id: number;
  historia_clinica: number;
  archivo: string;
  tipo_documento: string;
  fecha_documento: string;
  notas: string;
  fecha_subida: string;
}

export interface DocumentoUpload {
  file: File;
  tipo_documento: string;
  fecha_documento: string;
  notas: string;
  preview?: string;
}