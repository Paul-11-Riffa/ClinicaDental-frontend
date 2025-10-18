// src/services/CrearUsuario.ts
import { Api } from "../lib/Api";
import axios from "axios";

export type TipoUsuario = {
  id: number;
  nombre: string;
  tiene_tabla_adicional: boolean;
};

export type CampoInfo = {
  tipo: string;
  requerido: boolean;
  max_length?: number;
  descripcion: string;
  opciones?: string[];
  formato?: string;
};

export type EstructuraCampos = {
  tipo_usuario: number;
  nombre_tipo: string;
  campos_base: Record<string, CampoInfo>;
  campos_adicionales: Record<string, CampoInfo>;
};

export type UsuarioCreado = {
  codigo: number;
  nombre: string;
  apellido: string;
  correoelectronico: string;
  sexo: string | null;
  telefono: string | null;
  idtipousuario: number;
  tipo_usuario_nombre: string;
  recibir_notificaciones: boolean;
  notificaciones_email: boolean;
  notificaciones_push: boolean;
  paciente?: any;
  odontologo?: any;
  recepcionista?: any;
};

export type RespuestaCreacion = {
  mensaje: string;
  usuario: UsuarioCreado;
};

/**
 * Obtiene los tipos de usuario disponibles para crear
 */
export async function obtenerTiposUsuario(): Promise<TipoUsuario[]> {
  try {
    console.log('🔍 Obteniendo tipos de usuario...');
    
    const { data } = await Api.get<{ tipos: TipoUsuario[] }>('/crear-usuario/tipos-usuario/');
    
    console.log('✅ Tipos de usuario obtenidos:', data.tipos);
    return data.tipos;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const mensaje = error.response?.data?.error || error.response?.data?.detail;
      
      console.error('❌ Error al obtener tipos de usuario:', {
        status,
        mensaje
      });
      
      if (status === 403) {
        throw new Error("No tienes permisos para ver los tipos de usuario.");
      }
      
      throw new Error(mensaje || "Error al obtener tipos de usuario.");
    }
    
    throw new Error("Error de conexión. Por favor, intente nuevamente.");
  }
}

/**
 * Obtiene los campos requeridos para un tipo de usuario específico
 */
export async function obtenerCamposRequeridos(tipoUsuario: number): Promise<EstructuraCampos> {
  try {
    console.log(`🔍 Obteniendo campos requeridos para tipo ${tipoUsuario}...`);
    
    const { data } = await Api.get<EstructuraCampos>(
      `/crear-usuario/campos-requeridos/?tipo=${tipoUsuario}`
    );
    
    console.log('✅ Campos requeridos obtenidos:', data);
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const mensaje = error.response?.data?.error || error.response?.data?.detail;
      
      console.error('❌ Error al obtener campos requeridos:', {
        status,
        mensaje,
        tipoUsuario
      });
      
      if (status === 400) {
        throw new Error("Tipo de usuario inválido.");
      }
      
      throw new Error(mensaje || "Error al obtener campos requeridos.");
    }
    
    throw new Error("Error de conexión. Por favor, intente nuevamente.");
  }
}

/**
 * Crea un nuevo usuario con los datos proporcionados
 */
export async function crearUsuario(
  tipoUsuario: number,
  datos: Record<string, any>
): Promise<RespuestaCreacion> {
  try {
    console.log(`🔄 Creando usuario tipo ${tipoUsuario}...`, {
      datos: {
        ...datos,
        password: datos.password ? '[PROTEGIDO]' : undefined
      }
    });
    
    const { data } = await Api.post<RespuestaCreacion>('/crear-usuario/', {
      tipo_usuario: tipoUsuario,
      datos
    });
    
    console.log('✅ Usuario creado exitosamente:', {
      codigo: data.usuario.codigo,
      nombre: data.usuario.nombre,
      tipo: data.usuario.tipo_usuario_nombre
    });
    
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const errorData = error.response?.data;
      
      console.error('❌ Error al crear usuario:', {
        status,
        errorData
      });
      
      // Errores específicos
      if (status === 403) {
        throw new Error("No tienes permisos para crear usuarios. Solo administradores pueden realizar esta acción.");
      }

      // Si el backend retorna 500 pero el usuario podría haberse creado
      if (status === 500) {
        console.warn('⚠️ Error 500 del servidor - posiblemente error en bitácora pero usuario creado');
        throw new Error("El usuario pudo haberse creado pero hubo un error en el registro. Por favor, verifica en la lista de usuarios.");
      }
      
      if (status === 400 && errorData?.detalles) {
        // Errores de validación detallados
        const errores: string[] = [];
        
        // Errores en el nivel superior
        Object.keys(errorData.detalles).forEach(campo => {
          if (campo === 'datos' && typeof errorData.detalles[campo] === 'object') {
            // Errores en los datos específicos
            Object.keys(errorData.detalles[campo]).forEach(campoDatos => {
              const mensajes = errorData.detalles[campo][campoDatos];
              if (Array.isArray(mensajes)) {
                errores.push(`${campoDatos}: ${mensajes.join(', ')}`);
              } else {
                errores.push(`${campoDatos}: ${mensajes}`);
              }
            });
          } else {
            const mensajes = errorData.detalles[campo];
            if (Array.isArray(mensajes)) {
              errores.push(`${campo}: ${mensajes.join(', ')}`);
            } else {
              errores.push(`${campo}: ${mensajes}`);
            }
          }
        });
        
        throw new Error(errores.join('\n'));
      }
      
      throw new Error(errorData?.error || "Error al crear el usuario.");
    }
    
    throw new Error("Error de conexión. Por favor, intente nuevamente.");
  }
}

/**
 * Validación local de datos antes de enviar al servidor
 */
export function validarDatosUsuario(
  datos: Record<string, any>,
  estructura: EstructuraCampos
): { valido: boolean; errores: string[] } {
  const errores: string[] = [];
  
  // Validar campos base
  Object.entries(estructura.campos_base).forEach(([campo, info]) => {
    const valor = datos[campo];
    
    if (info.requerido && (!valor || valor.toString().trim() === '')) {
      errores.push(`${campo} es requerido`);
    }
    
    if (valor && info.max_length && valor.toString().length > info.max_length) {
      errores.push(`${campo} no puede tener más de ${info.max_length} caracteres`);
    }
    
    if (valor && info.tipo === 'email' && !isValidEmail(valor)) {
      errores.push(`${campo} debe ser un email válido`);
    }
  });
  
  // Validar campos adicionales
  Object.entries(estructura.campos_adicionales).forEach(([campo, info]) => {
    const valor = datos[campo];
    
    if (info.requerido && (!valor || valor.toString().trim() === '')) {
      errores.push(`${campo} es requerido`);
    }
    
    if (valor && info.max_length && valor.toString().length > info.max_length) {
      errores.push(`${campo} no puede tener más de ${info.max_length} caracteres`);
    }
  });
  
  return {
    valido: errores.length === 0,
    errores
  };
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
