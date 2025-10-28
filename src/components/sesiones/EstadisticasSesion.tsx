import React from "react";
import type { EstadisticasOdontologo } from "../../interfaces/SesionTratamiento";
import { formatearDuracion } from "../../services/sesionesTratamientoService";

interface EstadisticasSesionProps {
  estadisticas: EstadisticasOdontologo;
}

/**
 * Componente para mostrar estadísticas de sesiones del odontólogo
 */
const EstadisticasSesion: React.FC<EstadisticasSesionProps> = ({ estadisticas }) => {
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
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">
        📊 Estadísticas del Periodo
      </h3>

      {/* Periodo */}
      <div className="text-sm text-gray-600 mb-4">
        <span className="font-semibold">Periodo:</span>{" "}
        {formatearFecha(estadisticas.periodo.desde)} -{" "}
        {formatearFecha(estadisticas.periodo.hasta)}
      </div>

      {/* Grid de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Sesiones */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-semibold mb-1">
                Total Sesiones
              </p>
              <p className="text-3xl font-bold text-blue-800">
                {estadisticas.total_sesiones}
              </p>
            </div>
            <div className="text-4xl">📋</div>
          </div>
        </div>

        {/* Total Pacientes */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-semibold mb-1">
                Pacientes Atendidos
              </p>
              <p className="text-3xl font-bold text-green-800">
                {estadisticas.total_pacientes}
              </p>
            </div>
            <div className="text-4xl">👥</div>
          </div>
        </div>

        {/* Duración Total */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-semibold mb-1">
                Tiempo Total
              </p>
              <p className="text-3xl font-bold text-purple-800">
                {formatearDuracion(estadisticas.duracion_total_minutos)}
              </p>
            </div>
            <div className="text-4xl">⏱️</div>
          </div>
        </div>

        {/* Duración Promedio */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600 font-semibold mb-1">
                Duración Promedio
              </p>
              <p className="text-3xl font-bold text-yellow-800">
                {formatearDuracion(Math.round(estadisticas.duracion_promedio_minutos))}
              </p>
            </div>
            <div className="text-4xl">⏰</div>
          </div>
        </div>

        {/* Progreso Promedio */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-indigo-600 font-semibold mb-1">
                Progreso Promedio
              </p>
              <p className="text-3xl font-bold text-indigo-800">
                +{estadisticas.progreso_promedio_incremento.toFixed(1)}%
              </p>
            </div>
            <div className="text-4xl">📈</div>
          </div>
        </div>

        {/* Sesiones por Paciente */}
        <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-pink-600 font-semibold mb-1">
                Sesiones por Paciente
              </p>
              <p className="text-3xl font-bold text-pink-800">
                {(estadisticas.total_sesiones / (estadisticas.total_pacientes || 1)).toFixed(1)}
              </p>
            </div>
            <div className="text-4xl">📊</div>
          </div>
        </div>
      </div>

      {/* Insights adicionales */}
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">💡 Insights</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>
            • Promedio de{" "}
            <span className="font-semibold">
              {(estadisticas.total_sesiones / (estadisticas.total_pacientes || 1)).toFixed(1)} sesiones
            </span>{" "}
            por paciente
          </li>
          <li>
            • Incremento promedio de progreso por sesión:{" "}
            <span className="font-semibold">
              {estadisticas.progreso_promedio_incremento.toFixed(1)}%
            </span>
          </li>
          <li>
            • Tiempo promedio por sesión:{" "}
            <span className="font-semibold">
              {formatearDuracion(Math.round(estadisticas.duracion_promedio_minutos))}
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default EstadisticasSesion;
