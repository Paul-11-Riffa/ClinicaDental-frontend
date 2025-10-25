// src/pages/ListarPlanesTratamiento.tsx
import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import TopBar from "../components/TopBar";
import { toast, Toaster } from "react-hot-toast";
import {
  obtenerPlanesTratamiento,
  formatearMonto,
  getEstadoPlanColor,
  eliminarPlanTratamiento,
} from "../services/planesTratamientoService";
import type {
  PlanTratamiento,
  FiltrosPlanesTratamiento,
} from "../interfaces/PlanTratamiento";

export default function ListarPlanesTratamiento() {
  const { isAuth, user } = useAuth();
  const [planes, setPlanes] = useState<PlanTratamiento[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState<FiltrosPlanesTratamiento>({
    page: 1,
    page_size: 10,
  });
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Cargar planes de tratamiento
  useEffect(() => {
    cargarPlanes();
  }, [filtros]);

  const cargarPlanes = async () => {
    setLoading(true);
    try {
      const response = await obtenerPlanesTratamiento(filtros);
      setPlanes(response.results);
      setTotalCount(response.count);
      setTotalPages(Math.ceil(response.count / (filtros.page_size || 10)));
    } catch (error: any) {
      console.error("Error al cargar planes:", error);
      toast.error(
        error?.response?.data?.detail ||
          "Error al cargar los planes de tratamiento"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarPlan = async (planId: number) => {
    if (
      !window.confirm(
        "¿Está seguro de que desea eliminar este plan de tratamiento?"
      )
    ) {
      return;
    }

    try {
      await eliminarPlanTratamiento(planId);
      toast.success("Plan de tratamiento eliminado exitosamente");
      cargarPlanes();
    } catch (error: any) {
      console.error("Error al eliminar plan:", error);
      toast.error(
        error?.response?.data?.detail ||
          "Error al eliminar el plan. Solo se pueden eliminar planes en borrador."
      );
    }
  };

  const handleFiltroChange = (
    campo: keyof FiltrosPlanesTratamiento,
    valor: any
  ) => {
    setFiltros((prev) => ({
      ...prev,
      [campo]: valor,
      page: 1, // Resetear a primera página al cambiar filtros
    }));
  };

  const limpiarFiltros = () => {
    setFiltros({
      page: 1,
      page_size: 10,
    });
  };

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-white">
      <TopBar />
      <Toaster position="top-right" />

      <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6 sm:mb-10">
          <div className="flex items-center gap-3">
            <svg
              className="w-7 h-7 sm:w-8 sm:h-8 text-cyan-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              Planes de Tratamiento
            </h2>
          </div>
          {(user?.idtipousuario === 1 || user?.idtipousuario === 3) && (
            <Link
              to="/planes-tratamiento/crear"
              className="self-start sm:self-auto text-xs sm:text-sm px-4 py-2 rounded-lg bg-cyan-600 text-white hover:bg-cyan-700 transition-colors flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Nuevo Plan
            </Link>
          )}
        </header>

        {/* Filtros */}
        <div className="bg-white/80 backdrop-blur-sm border border-cyan-100 rounded-2xl p-4 sm:p-6 shadow-sm mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Filtros</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Búsqueda */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buscar
              </label>
              <input
                type="text"
                placeholder="Nombre paciente u odontólogo..."
                value={filtros.search || ""}
                onChange={(e) => handleFiltroChange("search", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              />
            </div>

            {/* Estado Plan */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado del Plan
              </label>
              <select
                value={filtros.estado_plan || ""}
                onChange={(e) =>
                  handleFiltroChange("estado_plan", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              >
                <option value="">Todos</option>
                <option value="Borrador">Borrador</option>
                <option value="Aprobado">Aprobado</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>

            {/* Estado Aceptación */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado Aceptación
              </label>
              <select
                value={filtros.estado_aceptacion || ""}
                onChange={(e) =>
                  handleFiltroChange("estado_aceptacion", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              >
                <option value="">Todos</option>
                <option value="Pendiente">Pendiente</option>
                <option value="Aceptado">Aceptado</option>
                <option value="Rechazado">Rechazado</option>
              </select>
            </div>
          </div>

          {/* Botones de filtro */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={limpiarFiltros}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Limpiar Filtros
            </button>
            <button
              onClick={cargarPlanes}
              className="px-4 py-2 text-sm bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
            >
              Buscar
            </button>
          </div>
        </div>

        {/* Tabla de planes */}
        <div className="bg-white/80 backdrop-blur-sm border border-cyan-100 rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando planes...</p>
            </div>
          ) : planes.length === 0 ? (
            <div className="p-8 text-center">
              <svg
                className="w-16 h-16 text-gray-400 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-gray-600">
                No se encontraron planes de tratamiento
              </p>
              {(user?.idtipousuario === 1 || user?.idtipousuario === 3) && (
                <Link
                  to="/planes-tratamiento/crear"
                  className="inline-block mt-4 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
                >
                  Crear primer plan
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Paciente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Odontólogo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Items
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {planes.map((plan) => (
                      <tr key={plan.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(plan.fechaplan).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {plan.paciente_nombre}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {plan.odontologo_nombre}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getEstadoPlanColor(
                              plan.estado_plan
                            )}`}
                          >
                            {plan.estado_plan}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatearMonto(plan.montototal)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {plan.items_activos} / {plan.cantidad_items}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <Link
                            to={`/planes-tratamiento/${plan.id}`}
                            className="text-cyan-600 hover:text-cyan-900"
                          >
                            Ver
                          </Link>
                          {plan.puede_editarse &&
                            (user?.idtipousuario === 1 ||
                              user?.idtipousuario === 3) && (
                              <>
                                <Link
                                  to={`/planes-tratamiento/${plan.id}/editar`}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  Editar
                                </Link>
                                <button
                                  onClick={() => handleEliminarPlan(plan.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Eliminar
                                </button>
                              </>
                            )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Mostrando{" "}
                    <span className="font-medium">
                      {(filtros.page! - 1) * filtros.page_size! + 1}
                    </span>{" "}
                    a{" "}
                    <span className="font-medium">
                      {Math.min(filtros.page! * filtros.page_size!, totalCount)}
                    </span>{" "}
                    de <span className="font-medium">{totalCount}</span>{" "}
                    resultados
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setFiltros((prev) => ({
                          ...prev,
                          page: Math.max(1, prev.page! - 1),
                        }))
                      }
                      disabled={filtros.page === 1}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    <span className="px-3 py-1 text-sm text-gray-700">
                      Página {filtros.page} de {totalPages}
                    </span>
                    <button
                      onClick={() =>
                        setFiltros((prev) => ({
                          ...prev,
                          page: Math.min(totalPages, prev.page! + 1),
                        }))
                      }
                      disabled={filtros.page === totalPages}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
