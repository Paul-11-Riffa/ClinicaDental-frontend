// src/services/Usuarios.ts
import { Api } from "../lib/Api.ts";
import axios from "axios";
import { TENANT_SUBDOMAIN } from "../lib/Api";

export type Usuario = {
  codigo: number;
  nombre: string;
  apellido: string;
  correoelectronico: string;
  telefono?: string | null;
  idtipousuario: number;
};

export type TipoUsuario = {
  identificacion: number;   // id del rol (1=admin, 2=paciente, etc.)
  rol: string;              // nombre del rol
  descripcion?: string;     // si tu backend devuelve "descripcion"
};

// Acepta ambos formatos de respuesta: array plano o paginado { results: [...] }
type ArrOrPaginated<T> = T[] | { results: T[] };

export async function buscarUsuarios(q: string = ""): Promise<Usuario[]> {
  // SIN /api/
  const { data } = await Api.get<ArrOrPaginated<Usuario>>(
    "/usuarios/",
    { params: q ? { search: q } : undefined }
  );
  return Array.isArray(data) ? data : (data.results ?? []);
}

export async function listarTiposUsuario(): Promise<TipoUsuario[]> {
  // SIN /api/
  const { data } = await Api.get<ArrOrPaginated<TipoUsuario>>("/tipos-usuario/");
  return Array.isArray(data) ? data : (data.results ?? []);
}

/**
 * Cambia el rol de un usuario
 * ✅ NUEVO: El backend SIEMPRE procesa el cambio exitosamente
 * ✅ Preserva automáticamente el historial del usuario (consultas, planes, etc.)
 * ✅ Ya NO falla por datos relacionados (foreign key constraints)
 */
export async function cambiarRolPorCodigo(
  codigo: number,
  idtipousuario: number
): Promise<Usuario> {
  try {
    console.log(`🔄 Cambiando rol del usuario #${codigo} a rol ${idtipousuario}...`);
    
    // SIN /api/ - El Api.ts ya agrega /api/
    const { data } = await Api.patch<Usuario>(`/usuarios/${codigo}/`, { 
      idtipousuario 
    });
    
    console.log(`✅ Rol cambiado exitosamente. El historial del usuario se mantiene intacto:`, data);
    return data;
    
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const mensaje = error.response?.data?.detail || error.response?.data?.message;
      
      console.error('❌ Error al cambiar rol:', {
        status,
        mensaje,
        codigo,
        nuevoRol: idtipousuario
      });
      
      // Errores específicos (ya NO hay error 500 por foreign key)
      if (status === 403) {
        throw new Error("No tienes permisos para cambiar roles. Solo administradores pueden realizar esta acción.");
      }
      if (status === 404) {
        throw new Error(`Usuario con código ${codigo} no encontrado.`);
      }
      if (status === 400) {
        throw new Error(mensaje || "Datos inválidos. Verifique el rol seleccionado.");
      }
      
      // Error genérico (red, timeout, etc.)
      throw new Error(mensaje || "Error al cambiar el rol del usuario. Por favor, intente nuevamente.");
    }
    
    throw new Error("Error de conexión. Por favor, intente nuevamente.");
  }
}

/* ===========================
   PERFIL (GET / PATCH propio)
   =========================== */

export type Perfil = {
  codigo: number;
  nombre: string;
  apellido: string;
  correoelectronico: string;
  sexo: "M" | "F" | null;
  telefono: string | null;
  idtipousuario: number;
  recibir_notificaciones: boolean;
};

export type EditarPerfilPayload = {
  correoelectronico?: string;
  telefono?: string;
  password?: string;
  password_confirm?: string;
};

/** GET /api/usuario/me */
export async function verMiPerfil(): Promise<Perfil> {
  try {
    console.log('🔍 Obteniendo perfil del usuario...');

    const { data } = await Api.get<Perfil>("/usuario/me", {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Tenant-Subdomain': TENANT_SUBDOMAIN || undefined
      }
    });

    console.log('✅ Perfil obtenido:', data);
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('❌ Error detallado:', {
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });
    }

    throw new Error("Error al obtener el perfil: " + (error instanceof Error ? error.message : "Error desconocido"));
  }
}

// Función auxiliar para validar el payload antes de enviarlo al backend
function validarPayload(payload: EditarPerfilPayload): void {
  if (payload.password && payload.password_confirm) {
    if (payload.password !== payload.password_confirm) {
      throw new Error("Las contraseñas no coinciden");
    }
    if (payload.password.length < 8) {
      throw new Error("La contraseña debe tener al menos 8 caracteres");
    }
  }

  if (payload.correoelectronico && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.correoelectronico)) {
    throw new Error("Correo electrónico inválido");
  }
}

/** PATCH /api/usuario/me (envía solo el/los campos a modificar) */
export async function editarMiPerfil(partial: EditarPerfilPayload): Promise<Perfil> {
  // Preparamos los datos para enviar al backend (fuera del try para que esté disponible en catch)
  const datosFiltrados: Record<string, any> = {};

  try {
    // Validamos el payload antes de enviarlo
    validarPayload(partial);

    // Manejo de contraseña - incluir ambos campos si se está actualizando la contraseña
    if (partial.password) {
      datosFiltrados.password = partial.password;
      datosFiltrados.password_confirm = partial.password_confirm;
    }

    // Manejo de correo electrónico
    if (partial.correoelectronico?.trim()) {
      datosFiltrados.correoelectronico = partial.correoelectronico.trim();
    }

    // Manejo especial del teléfono (puede ser null)
    if (partial.telefono !== undefined) {
      datosFiltrados.telefono = partial.telefono ? partial.telefono.trim() : null;
    }

    // Verificar si hay datos para actualizar
    if (Object.keys(datosFiltrados).length === 0) {
      throw new Error("No hay campos válidos para actualizar");
    }

    console.log('🔄 Enviando actualización de perfil:', {
      ...datosFiltrados,
      password: datosFiltrados.password ? '[PROTEGIDO]' : undefined,
      password_confirm: datosFiltrados.password_confirm ? '[PROTEGIDO]' : undefined
    });

    // Agregar timeout y headers específicos
    const { data } = await Api.patch<Perfil>("/usuario/me", datosFiltrados, {
      timeout: 8000, // timeout de 8 segundos
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Tenant-Subdomain': TENANT_SUBDOMAIN || undefined
      }
    });

    console.log('✅ Perfil actualizado correctamente');
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // Extraer el mensaje de error del backend
      const mensajeError = error.response?.data?.detail ||
                          error.response?.data?.message ||
                          error.response?.data;

      if (error.response?.status === 400 && error.response.data?.password_confirm) {
        throw new Error("Las contraseñas no coinciden o no cumplen con los requisitos");
      }

      console.error('❌ Error al actualizar perfil:', {
        status: error.response?.status,
        mensaje: mensajeError,
        datos_enviados: {
          ...datosFiltrados,
          password: datosFiltrados?.password ? '[PROTEGIDO]' : undefined,
          password_confirm: datosFiltrados?.password_confirm ? '[PROTEGIDO]' : undefined
        }
      });

      // Manejar errores específicos
      if (error.response?.status === 400) {
        const mensaje = typeof mensajeError === 'string' ?
          mensajeError :
          'Error en los datos enviados. Por favor, verifique los campos.';
        throw new Error(mensaje);
      }
    }

    // Si no es un error de axios o no tiene response
    throw new Error("Error al actualizar el perfil. Por favor, intente nuevamente.");
  }
}
