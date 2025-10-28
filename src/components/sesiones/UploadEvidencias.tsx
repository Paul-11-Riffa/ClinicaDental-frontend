import React, { useState, useRef } from "react";
import { subirEvidencia, validarArchivo, convertirABase64 } from "../../services/uploadService";

interface UploadEvidenciasProps {
  evidencias: string[];
  onChange: (urls: string[]) => void;
  maxFiles?: number;
  disabled?: boolean;
}

/**
 * Componente para subir evidencias (fotos/radiografías) a las sesiones
 * Soporta preview, eliminación y gestión de URLs
 */
const UploadEvidencias: React.FC<UploadEvidenciasProps> = ({
  evidencias,
  onChange,
  maxFiles = 10,
  disabled = false,
}) => {
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tipos de archivo permitidos
  const ALLOWED_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf", // Para reportes radiográficos
  ];

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB por archivo

  /**
   * Validar archivo antes de subir
   */
  const validarArchivoLocal = (file: File): string | null => {
    const resultado = validarArchivo(file, MAX_FILE_SIZE, ALLOWED_TYPES);
    
    if (!resultado.valid) {
      return resultado.error || "Error de validación";
    }

    if (evidencias.length >= maxFiles) {
      return `Máximo ${maxFiles} archivos permitidos.`;
    }

    return null;
  };

  /**
   * Subir archivo al servidor
   */
  const subirArchivoAlServidor = async (file: File): Promise<string> => {
    try {
      // Usar el servicio de upload con callback de progreso
      const url = await subirEvidencia(file, "evidencia_sesion", (progress) => {
        setUploadProgress(progress);
      });

      return url;
    } catch (err: any) {
      console.error("Error al subir archivo:", err);

      // FALLBACK: Si no tienes backend de upload, usar Base64 (solo desarrollo)
      if (import.meta.env.DEV) {
        console.warn("⚠️ Usando simulación de upload con Base64 (solo desarrollo)");
        return await convertirABase64(file);
      }

      throw new Error(
        err.message || "Error al subir el archivo"
      );
    }
  };

  /**
   * Manejar selección de archivos
   */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError(null);
    setUploading(true);
    setUploadProgress(0);

    try {
      const urls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validar archivo
        const errorValidacion = validarArchivoLocal(file);
        if (errorValidacion) {
          setError(errorValidacion);
          setUploading(false);
          return;
        }

        // Subir archivo
        const url = await subirArchivoAlServidor(file);
        urls.push(url);
      }

      // Actualizar array de evidencias
      onChange([...evidencias, ...urls]);

      // Limpiar input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err: any) {
      console.error("Error al procesar archivos:", err);
      setError(err.message || "Error al subir archivos");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  /**
   * Eliminar evidencia
   */
  const handleEliminar = (index: number) => {
    const nuevasEvidencias = evidencias.filter((_, i) => i !== index);
    onChange(nuevasEvidencias);
  };

  /**
   * Abrir diálogo de selección de archivos
   */
  const handleClickUpload = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  /**
   * Determinar si es imagen o PDF
   */
  const esImagen = (url: string): boolean => {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url) || url.startsWith("data:image");
  };

  return (
    <div className="space-y-4">
      {/* Zona de upload */}
      <div
        onClick={handleClickUpload}
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          disabled
            ? "border-gray-200 bg-gray-50 cursor-not-allowed"
            : uploading
            ? "border-blue-400 bg-blue-50"
            : "border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50 cursor-pointer"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,application/pdf"
          onChange={handleFileChange}
          disabled={disabled || uploading}
          className="hidden"
        />

        {uploading ? (
          <div className="space-y-2">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-blue-600 font-medium">
              Subiendo archivo... {uploadProgress}%
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 max-w-xs mx-auto">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : (
          <div>
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="mt-2 text-sm text-gray-600">
              <span className="font-semibold text-blue-600">Clic para subir</span> o
              arrastra archivos aquí
            </p>
            <p className="text-xs text-gray-500 mt-1">
              JPG, PNG, GIF, WEBP o PDF (máx. 5MB por archivo)
            </p>
            <p className="text-xs text-gray-500">
              {evidencias.length} de {maxFiles} archivos subidos
            </p>
          </div>
        )}
      </div>

      {/* Mensajes de error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-800">❌ {error}</p>
        </div>
      )}

      {/* Preview de evidencias */}
      {evidencias.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-700">
            Evidencias ({evidencias.length})
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {evidencias.map((url, index) => (
              <div
                key={index}
                className="relative group bg-gray-100 rounded-lg overflow-hidden aspect-square"
              >
                {/* Preview */}
                {esImagen(url) ? (
                  <img
                    src={url}
                    alt={`Evidencia ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <svg
                      className="w-12 h-12 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}

                {/* Overlay con acciones */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center gap-2">
                  {/* Ver */}
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="opacity-0 group-hover:opacity-100 transition-opacity bg-white text-gray-800 p-2 rounded-full hover:bg-gray-100"
                    title="Ver"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  </a>

                  {/* Eliminar */}
                  {!disabled && (
                    <button
                      onClick={() => handleEliminar(index)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                      title="Eliminar"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Número */}
                <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                  #{index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nota sobre el backend */}
      {import.meta.env.DEV && evidencias.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-xs text-yellow-800">
            ⚠️ <strong>Modo desarrollo:</strong> Las evidencias se están guardando como
            Base64. En producción, configura un servicio de almacenamiento real (S3,
            Cloudinary, etc.)
          </p>
        </div>
      )}
    </div>
  );
};

export default UploadEvidencias;
