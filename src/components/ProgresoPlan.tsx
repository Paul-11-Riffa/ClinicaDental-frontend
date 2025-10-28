import React, { useState, useEffect } from "react";
import { obtenerProgresoPlan } from "../services/sesionesTratamientoService";
import type { ProgresoPlan as ProgresoPlanType } from "../interfaces/SesionTratamiento";
import BarraProgresoItem from "./sesiones/BarraProgresoItem";

interface ProgresoPlanProps {
  planId: number;
  onActualizar?: () => void;
}

/**
 * Componente para mostrar el dashboard de progreso de un plan de tratamiento
 * Muestra progreso general, contador de ítems y badges de estado
 */
const ProgresoPlan: React.FC<ProgresoPlanProps> = ({ planId, onActualizar }) => {
  const [progreso, setProgreso] = useState<ProgresoPlanType | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cargarProgreso();
  }, [planId]);

  const cargarProgreso = async () => {
    try {
      setCargando(true);
      setError(null);
      const datos = await obtenerProgresoPlan(planId);
      setProgreso(datos);

      // Callback si existe
      if (onActualizar) {
        onActualizar();
      }
    } catch (err: any) {
      console.error("Error al cargar progreso:", err);
      setError(err.message || "Error al cargar el progreso del plan");
    } finally {
      setCargando(false);
    }
  };

  if (cargando) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Cargando progreso...</span>
        </div>
      </div>
    );
  }

  if (error || !progreso) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800 font-semibold">❌ Error</p>
        <p className="text-red-600 text-sm">{error || "No se pudo cargar el progreso"}</p>
      </div>
    );
  }

  const porcentajeCompletado =
    progreso.total_items > 0
      ? (progreso.items_completados / progreso.total_items) * 100
      : 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-800">
            📊 Progreso del Plan de Tratamiento
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Plan #{progreso.plan_id}
          </p>
        </div>
        <button
          onClick={cargarProgreso}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
          title="Actualizar progreso"
        >
          🔄 Actualizar
        </button>
      </div>

      {/* Progreso General */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold text-gray-700">
            Progreso General
          </span>
          <span className="text-2xl font-bold text-blue-600">
            {progreso.progreso_general.toFixed(1)}%
          </span>
        </div>
        <BarraProgresoItem
          progreso={progreso.progreso_general}
          mostrarPorcentaje={false}
          altura="h-6"
          animate={true}
        />
      </div>

      {/* Estado del Plan */}
      {progreso.plan_completado && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-2xl">✅</span>
            <div>
              <p className="text-green-800 font-semibold">
                ¡Plan de Tratamiento Completado!
              </p>
              <p className="text-green-600 text-sm mt-1">
                Se ha creado automáticamente la entrada en el historial clínico del paciente.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Grid de Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Total Items */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <p className="text-sm text-blue-600 font-semibold mb-1">
            Total Ítems
          </p>
          <p className="text-3xl font-bold text-blue-800">
            {progreso.total_items}
          </p>
        </div>

        {/* Items Completados */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <p className="text-sm text-green-600 font-semibold mb-1">
            Completados
          </p>
          <p className="text-3xl font-bold text-green-800">
            {progreso.items_completados}
          </p>
          <p className="text-xs text-green-600 mt-1">
            {porcentajeCompletado.toFixed(0)}%
          </p>
        </div>

        {/* Items Activos */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <p className="text-sm text-yellow-600 font-semibold mb-1">
            En Progreso
          </p>
          <p className="text-3xl font-bold text-yellow-800">
            {progreso.items_activos}
          </p>
        </div>

        {/* Items Pendientes */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-600 font-semibold mb-1">
            Pendientes
          </p>
          <p className="text-3xl font-bold text-gray-800">
            {progreso.items_pendientes}
          </p>
        </div>
      </div>

      {/* Barra de progreso de ítems completados */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold text-gray-700">
            Ítems Completados
          </span>
          <span className="text-sm text-gray-600">
            {progreso.items_completados} de {progreso.total_items}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-green-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${porcentajeCompletado}%` }}
          />
        </div>
      </div>

      {/* Insights */}
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">💡 Resumen</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          {progreso.items_activos > 0 && (
            <li>
              • {progreso.items_activos} ítem(s) en progreso actualmente
            </li>
          )}
          {progreso.items_pendientes > 0 && (
            <li>
              • {progreso.items_pendientes} ítem(s) aún por iniciar
            </li>
          )}
          {progreso.items_completados > 0 && (
            <li>
              • {progreso.items_completados} ítem(s) completado(s) exitosamente
            </li>
          )}
          {progreso.plan_completado ? (
            <li className="text-green-600 font-semibold">
              • ✅ Todos los tratamientos han sido completados
            </li>
          ) : (
            <li>
              • {(100 - progreso.progreso_general).toFixed(1)}% restante para
              completar el plan
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default ProgresoPlan;
