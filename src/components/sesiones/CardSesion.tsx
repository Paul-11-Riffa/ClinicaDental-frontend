import React, { useState } from "react";
import type { SesionTratamiento } from "../../interfaces/SesionTratamiento";
import { formatearDuracion, parsearProgreso } from "../../services/sesionesTratamientoService";

interface CardSesionProps {
  sesion: SesionTratamiento;
  onEditar?: (id: number) => void;
  onEliminar?: (id: number) => void;
  mostrarAcciones?: boolean;
}

/**
 * Card para mostrar información de una sesión individual
 */
const CardSesion: React.FC<CardSesionProps> = ({
  sesion,
  onEditar,
  onEliminar,
  mostrarAcciones = true,
}) => {
  const [mostrarEvidencias, setMostrarEvidencias] = useState(false);
  const progresoAnterior = parsearProgreso(sesion.progreso_anterior);
  const progresoActual = parsearProgreso(sesion.progreso_actual);
  const incremento = sesion.incremento_progreso;

  const formatearFecha = (fecha: string | null | undefined): string => {
    if (!fecha) {
      return "Fecha no disponible";
    }
    try {
      const [year, month, day] = fecha.split("-");
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error("Error al formatear fecha:", fecha, error);
      return fecha; // Retornar la fecha original si falla el formato
    }
  };

  return (
    <div className="border border-gray-300 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
      {/* Header con fecha y duración */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <span className="flex items-center gap-1">
            📅 {formatearFecha(sesion.fecha_sesion)}
          </span>
          {sesion.hora_inicio && (
            <span className="flex items-center gap-1">
              🕐 {sesion.hora_inicio.substring(0, 5)}
            </span>
          )}
          <span className="flex items-center gap-1">
            ⏱️ {formatearDuracion(sesion.duracion_minutos)}
          </span>
        </div>
        
        {mostrarAcciones && (onEditar || onEliminar) && (
          <div className="flex gap-2">
            {onEditar && (
              <button
                onClick={() => onEditar(sesion.id)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                title="Editar sesión"
              >
                ✏️ Editar
              </button>
            )}
            {onEliminar && (
              <button
                onClick={() => onEliminar(sesion.id)}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
                title="Eliminar sesión"
              >
                🗑️ Eliminar
              </button>
            )}
          </div>
        )}
      </div>

      {/* Barra de progreso */}
      <div className="mb-3">
        <div className="flex justify-between text-sm text-gray-700 mb-1">
          <span>Progreso:</span>
          <span className="font-semibold">
            {progresoAnterior.toFixed(0)}% → {progresoActual.toFixed(0)}%{" "}
            <span className="text-green-600">(+{incremento.toFixed(0)}%)</span>
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progresoActual}%` }}
          />
        </div>
      </div>

      {/* Acciones realizadas */}
      <div className="mb-2">
        <p className="text-xs font-semibold text-gray-700 mb-1">Acciones:</p>
        <p className="text-sm text-gray-600">{sesion.acciones_realizadas}</p>
      </div>

      {/* Notas (si existen) */}
      {sesion.notas_sesion && (
        <div className="mb-2">
          <p className="text-xs font-semibold text-gray-700 mb-1">Notas:</p>
          <p className="text-sm text-gray-600">{sesion.notas_sesion}</p>
        </div>
      )}

      {/* Complicaciones (si existen) */}
      {sesion.complicaciones && (
        <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded">
          <p className="text-xs font-semibold text-red-700 mb-1">⚠️ Complicaciones:</p>
          <p className="text-sm text-red-600">{sesion.complicaciones}</p>
        </div>
      )}

      {/* Footer con profesional y evidencias */}
      <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200">
        <div className="flex items-center gap-1 text-sm text-gray-600">
          👤 <span className="font-medium">{sesion.usuario_registro_nombre || "Profesional"}</span>
        </div>
        
        {sesion.evidencias && sesion.evidencias.length > 0 && (
          <button
            onClick={() => setMostrarEvidencias(!mostrarEvidencias)}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            📎 <span>{sesion.evidencias.length} evidencia(s)</span>
            <span className="text-xs">{mostrarEvidencias ? "▼" : "▶"}</span>
          </button>
        )}
      </div>

      {/* Galería de evidencias (expandible) */}
      {mostrarEvidencias && sesion.evidencias && sesion.evidencias.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs font-semibold text-gray-700 mb-2">Evidencias:</p>
          <div className="grid grid-cols-3 gap-2">
            {sesion.evidencias.map((url, index) => (
              <a
                key={index}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="block aspect-square rounded overflow-hidden hover:opacity-80 transition-opacity border border-gray-200"
                title={`Ver evidencia ${index + 1}`}
              >
                {/\.(jpg|jpeg|png|gif|webp)$/i.test(url) || url.startsWith("data:image") ? (
                  <img
                    src={url}
                    alt={`Evidencia ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <svg
                      className="w-8 h-8 text-gray-500"
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
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CardSesion;
