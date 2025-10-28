import { Api, TENANT_SUBDOMAIN } from "../lib/Api";

/**
 * Servicio para gestionar la subida de archivos (evidencias)
 * 
 * CONFIGURACIÓN REQUERIDA:
 * 1. Backend debe tener endpoint /api/upload/evidencias/
 * 2. O configurar servicio externo (S3, Cloudinary, etc.)
 */

export interface UploadResponse {
  url: string;
  file_url?: string;
  filename?: string;
  size?: number;
  type?: string;
  id?: number;
}

/**
 * Headers para upload
 */
const getUploadHeaders = () => {
  const token = localStorage.getItem("authToken");
  const headers: Record<string, string> = {};

  if (token) {
    headers["Authorization"] = `Token ${token}`;
  }

  if (TENANT_SUBDOMAIN) {
    headers["X-Tenant-Subdomain"] = TENANT_SUBDOMAIN;
  }

  // Note: NO establecer Content-Type para FormData, el browser lo hace automáticamente
  return headers;
};

/**
 * Subir archivo de evidencia al servidor
 * @param file Archivo a subir
 * @param tipo Tipo de evidencia (por defecto: 'evidencia_sesion')
 * @param onProgress Callback para progreso de subida
 * @returns URL del archivo subido
 */
export const subirEvidencia = async (
  file: File,
  tipo: string = "evidencia_sesion",
  onProgress?: (progress: number) => void
): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("tipo", tipo);

  try {
    const response = await Api.post<UploadResponse>(
      "/upload/evidencias/",
      formData,
      {
        headers: getUploadHeaders(),
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onProgress) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentCompleted);
          }
        },
      }
    );

    // Retornar la URL del archivo
    return response.data.url || response.data.file_url || "";
  } catch (error: any) {
    console.error("Error al subir evidencia:", error);
    throw error.response?.data || error;
  }
};

/**
 * Subir múltiples archivos
 * @param files Lista de archivos
 * @param tipo Tipo de evidencia
 * @param onProgress Callback para progreso total
 * @returns Array de URLs
 */
export const subirMultiplesEvidencias = async (
  files: File[],
  tipo: string = "evidencia_sesion",
  onProgress?: (progress: number) => void
): Promise<string[]> => {
  const urls: string[] = [];
  const totalFiles = files.length;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const url = await subirEvidencia(file, tipo, (fileProgress) => {
      if (onProgress) {
        // Calcular progreso total
        const completedFiles = i;
        const currentFileProgress = fileProgress / 100;
        const totalProgress = ((completedFiles + currentFileProgress) / totalFiles) * 100;
        onProgress(Math.round(totalProgress));
      }
    });
    urls.push(url);
  }

  return urls;
};

/**
 * Eliminar evidencia del servidor
 * @param urlOrId URL de la evidencia o ID numérico
 */
export const eliminarEvidencia = async (urlOrId: string | number): Promise<void> => {
  try {
    let evidenciaId: number;

    if (typeof urlOrId === 'number') {
      // Si es un número, usarlo directamente
      evidenciaId = urlOrId;
    } else {
      // Si es string (URL), intentar extraer el ID del final de la URL
      // Asumiendo formato: .../evidencias/2025/10/27/abc123_file.jpg
      // O la URL podría tener el ID de alguna forma
      // Por ahora, asumimos que no podemos extraer el ID de la URL
      // Por lo tanto, esta función debería recibir el ID directamente
      throw new Error("Se requiere el ID de la evidencia para eliminarla. Use eliminarEvidenciaPorId()");
    }

    await Api.delete(`/upload/evidencias/${evidenciaId}/`, {
      headers: getUploadHeaders(),
    });
  } catch (error: any) {
    console.error("Error al eliminar evidencia:", error);
    throw error;
  }
};

/**
 * Eliminar evidencia por ID
 * @param id ID de la evidencia
 */
export const eliminarEvidenciaPorId = async (id: number): Promise<void> => {
  try {
    await Api.delete(`/upload/evidencias/${id}/`, {
      headers: getUploadHeaders(),
    });
  } catch (error: any) {
    console.error("Error al eliminar evidencia:", error);
    throw error;
  }
};

/**
 * CONFIGURACIÓN PARA S3 (Alternativa)
 * Si prefieres usar S3 directamente desde el frontend:
 */

export interface S3Config {
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
}

/**
 * Subir a S3 (requiere configuración adicional)
 * Nota: Es más seguro usar presigned URLs desde el backend
 */
export const subirAWS3 = async (
  file: File,
  config: S3Config,
  onProgress?: (progress: number) => void
): Promise<string> => {
  // Implementación con AWS SDK
  // Recomendación: Usar presigned URLs desde backend por seguridad
  throw new Error("Función no implementada. Usar presigned URLs desde backend.");
};

/**
 * CONFIGURACIÓN PARA CLOUDINARY (Alternativa)
 */

export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
}

/**
 * Subir a Cloudinary
 */
export const subirACloudinary = async (
  file: File,
  config: CloudinaryConfig,
  onProgress?: (progress: number) => void
): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", config.uploadPreset);

  try {
    const xhr = new XMLHttpRequest();
    
    return new Promise((resolve, reject) => {
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable && onProgress) {
          const percentCompleted = Math.round((e.loaded * 100) / e.total);
          onProgress(percentCompleted);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          resolve(response.secure_url);
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Upload failed"));
      });

      xhr.open("POST", `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`);
      xhr.send(formData);
    });
  } catch (error: any) {
    console.error("Error al subir a Cloudinary:", error);
    throw error;
  }
};

/**
 * Validar archivo antes de subir
 */
export const validarArchivo = (
  file: File,
  maxSize: number = 5 * 1024 * 1024, // 5MB por defecto
  allowedTypes: string[] = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "application/pdf"]
): { valid: boolean; error?: string } => {
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Tipo de archivo no permitido: ${file.type}`,
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `El archivo es demasiado grande. Tamaño máximo: ${Math.round(maxSize / 1024 / 1024)}MB`,
    };
  }

  return { valid: true };
};

/**
 * Convertir archivo a Base64 (SOLO para desarrollo)
 * NO usar en producción
 */
export const convertirABase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

// Exportar todo el servicio
export default {
  subirEvidencia,
  subirMultiplesEvidencias,
  eliminarEvidencia,
  eliminarEvidenciaPorId,
  subirAWS3,
  subirACloudinary,
  validarArchivo,
  convertirABase64,
};
