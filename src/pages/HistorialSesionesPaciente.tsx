import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  obtenerSesionesPorPaciente,
  formatearFecha,
} from "../services/sesionesTratamientoService";
import type { SesionesPaginadas, SesionTratamiento } from "../interfaces/SesionTratamiento";
import CardSesion from "../components/sesiones/CardSesion";

/**
 * Página para ver el historial de sesiones de un paciente
 * Muestra timeline con filtros por fecha y agrupación por plan
 */
const HistorialSesionesPaciente: React.FC = () => {
  const { pacienteId } = useParams<{ pacienteId: string }>();
  const navigate = useNavigate();

  const [datos, setDatos] = useState<SesionesPaginadas | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [fechaDesde, setFechaDesde] = useState<string>("");
  const [fechaHasta, setFechaHasta] = useState<string>("");
  const [planExpandido, setPlanExpandido] = useState<number | null>(null);

  useEffect(() => {
    cargarHistorial();
  }, [pacienteId, fechaDesde, fechaHasta]);

  const cargarHistorial = async () => {
    if (!pacienteId) {
      setError("ID de paciente no proporcionado");
      setCargando(false);
      return;
    }

    try {
      setCargando(true);
      setError(null);
      const resultado = await obtenerSesionesPorPaciente(
        parseInt(pacienteId),
        fechaDesde || undefined,
        fechaHasta || undefined
      );
      setDatos(resultado);
    } catch (err: any) {
      console.error("Error al cargar historial:", err);
      setError(err.message || "Error al cargar el historial del paciente");
    } finally {
      setCargando(false);
    }
  };

  const handleLimpiarFiltros = () => {
    setFechaDesde("");
    setFechaHasta("");
  };

  const handleVerDetalle = (sesionId: number) => {
    navigate(`/sesiones/${sesionId}`);
  };

  const togglePlan = (planId: number) => {
    setPlanExpandido(planExpandido === planId ? null : planId);
  };

  // Agrupar sesiones por plan
  const agruparPorPlan = (sesiones: SesionTratamiento[]) => {
    const planesMap = new Map<number, SesionTratamiento[]>();

    sesiones.forEach((sesion) => {
      const itemPlan = typeof sesion.item_plan === "object" ? sesion.item_plan : null;
      // Asumimos que tenemos acceso al plan_id, sino usar un ID genérico
      const planId = (sesion as any).plan_id || 0;

      if (!planesMap.has(planId)) {
        planesMap.set(planId, []);
      }
      planesMap.get(planId)!.push(sesion);
    });

    return Array.from(planesMap.entries()).map(([planId, sesiones]) => ({
      planId,
      sesiones,
    }));
  };

  const formatearFechaLocal = (fecha: string | null | undefined): string => {
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

  if (cargando) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando historial...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800 font-semibold mb-2">❌ Error</p>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  const sesiones = datos?.results || [];
  const planesAgrupados = agruparPorPlan(sesiones);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              📅 Historial de Sesiones
            </h1>
            <p className="text-gray-600 mt-1">
              Paciente #{pacienteId} - {sesiones.length} sesión(es)
            </p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            ← Volver
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            🔍 Filtros
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Fecha Desde
              </label>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Fecha Hasta
              </label>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleLimpiarFiltros}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium"
              >
                Limpiar Filtros
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      {sesiones.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800 font-semibold mb-2">ℹ️ Sin sesiones</p>
          <p className="text-yellow-600">
            No hay sesiones registradas{" "}
            {fechaDesde || fechaHasta ? "en el rango de fechas seleccionado" : "para este paciente"}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Vista agrupada por plan */}
          {planesAgrupados.map(({ planId, sesiones }) => (
            <div
              key={planId}
              className="bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden"
            >
              {/* Header del plan */}
              <div
                className="p-4 bg-blue-50 border-b border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors"
                onClick={() => togglePlan(planId)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Plan de Tratamiento #{planId || "General"}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {sesiones.length} sesión(es) registrada(s)
                    </p>
                  </div>
                  <button className="text-2xl text-gray-500 hover:text-gray-700">
                    {planExpandido === planId ? "▼" : "▶"}
                  </button>
                </div>
              </div>

              {/* Timeline de sesiones */}
              {planExpandido === planId && (
                <div className="p-4">
                  <div className="relative">
                    {/* Línea vertical del timeline */}
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-blue-200"></div>

                    {/* Sesiones */}
                    <div className="space-y-6">
                      {sesiones
                        .sort(
                          (a, b) =>
                            new Date(b.fecha_sesion).getTime() -
                            new Date(a.fecha_sesion).getTime()
                        )
                        .map((sesion, index) => (
                          <div key={sesion.id} className="relative pl-12">
                            {/* Punto en el timeline */}
                            <div className="absolute left-2 top-3 w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow"></div>

                            {/* Card de sesión */}
                            <CardSesion
                              sesion={sesion}
                              onEditar={() => navigate(`/sesiones/${sesion.id}/editar`)}
                              mostrarAcciones={true}
                            />
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Resumen */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex justify-between items-center text-sm">
              <div className="text-blue-800">
                <span className="font-semibold">Total de sesiones:</span> {sesiones.length}
              </div>
              <div className="text-blue-800">
                <span className="font-semibold">Planes:</span> {planesAgrupados.length}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Paginación (si existe) */}
      {datos && (datos.next || datos.previous) && (
        <div className="mt-6 flex justify-center gap-4">
          {datos.previous && (
            <button
              onClick={() => {
                /* Implementar paginación */
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              ← Anterior
            </button>
          )}
          {datos.next && (
            <button
              onClick={() => {
                /* Implementar paginación */
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Siguiente →
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default HistorialSesionesPaciente;
