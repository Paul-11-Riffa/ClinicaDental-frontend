// src/pages/ListarPresupuestosDigitales.tsx
import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import TopBar from "../components/TopBar";
import { toast, Toaster } from "react-hot-toast";
import {
  obtenerPresupuestosDigitales,
  eliminarPresupuestoDigital,
  formatearMonto,
  getEstadoPresupuestoColor,
} from "../services/presupuestosDigitalesService";
import type {
  PresupuestoDigital,
  FiltrosPresupuestosDigitales,
} from "../interfaces/PresupuestoDigital";

export default function ListarPresupuestosDigitales() {
  const { isAuth, user } = useAuth();
  const [presupuestos, setPresupuestos] = useState<PresupuestoDigital[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState<FiltrosPresupuestosDigitales>({
    page: 1,
    page_size: 10,
  });
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Cargar presupuestos
  useEffect(() => {
    cargarPresupuestos();
  }, [filtros]);

  const cargarPresupuestos = async () => {
    setLoading(true);
    try {
      const response = await obtenerPresupuestosDigitales(filtros);
      setPresupuestos(response.results);
      setTotalCount(response.count);
      setTotalPages(Math.ceil(response.count / (filtros.page_size || 10)));
    } catch (error: any) {
      console.error("Error al cargar presupuestos:", error);
      toast.error(
        error?.response?.data?.detail ||
          "Error al cargar los presupuestos digitales"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarPresupuesto = async (presupuestoId: number) => {
    if (
      !window.confirm(
        "¿Está seguro de que desea eliminar este presupuesto? Solo se pueden eliminar presupuestos en estado Borrador."
      )
    ) {
      return;
    }

    try {
      await eliminarPresupuestoDigital(presupuestoId);
      toast.success("Presupuesto eliminado exitosamente");
      cargarPresupuestos();
    } catch (error: any) {
      console.error("Error al eliminar presupuesto:", error);
      toast.error(
        error?.response?.data?.detail ||
          "Error al eliminar el presupuesto. Solo se pueden eliminar presupuestos en borrador."
      );
    }
  };

  const handleFiltroChange = (
    campo: keyof FiltrosPresupuestosDigitales,
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
              Presupuestos Digitales
            </h2>
          </div>
          {(user?.idtipousuario === 1 || user?.idtipousuario === 3) && (
            <Link
              to="/presupuestos-digitales/crear"
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
              Nuevo Presupuesto
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
                Buscar por código
              </label>
              <input
                type="text"
                placeholder="A1B2C3D4..."
                value={filtros.search || ""}
                onChange={(e) => handleFiltroChange("search", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              />
            </div>

            {/* Estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                value={filtros.estado || ""}
                onChange={(e) => handleFiltroChange("estado", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              >
                <option value="">Todos los estados</option>
                <option value="Borrador">Borrador</option>
                <option value="Emitido">Emitido</option>
                <option value="Caducado">Caducado</option>
                <option value="Anulado">Anulado</option>
              </select>
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Presupuesto
              </label>
              <select
                value={filtros.es_tramo === true ? "true" : filtros.es_tramo === false ? "false" : ""}
                onChange={(e) =>
                  handleFiltroChange(
                    "es_tramo",
                    e.target.value === "" ? "" : e.target.value === "true"
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              >
                <option value="">Todos</option>
                <option value="false">Presupuesto Total</option>
                <option value="true">Presupuesto Parcial (Tramo)</option>
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
              onClick={cargarPresupuestos}
              className="px-4 py-2 text-sm bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
            >
              Buscar
            </button>
          </div>
        </div>

        {/* Tabla de presupuestos */}
        <div className="bg-white/80 backdrop-blur-sm border border-cyan-100 rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando presupuestos...</p>
            </div>
          ) : presupuestos.length === 0 ? (
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
                No se encontraron presupuestos digitales
              </p>
              {(user?.idtipousuario === 1 || user?.idtipousuario === 3) && (
                <Link
                  to="/presupuestos-digitales/crear"
                  className="inline-block mt-4 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
                >
                  Crear primer presupuesto
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
                        Código
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Paciente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha Emisión
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vigencia
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {presupuestos.map((presupuesto) => (
                      <tr key={presupuesto.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {presupuesto.codigo_corto}
                          </div>
                          {presupuesto.es_tramo && presupuesto.numero_tramo && (
                            <div className="text-xs text-gray-500">
                              Tramo {presupuesto.numero_tramo}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {presupuesto.paciente_nombre}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(presupuesto.fecha_emision).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatearMonto(presupuesto.total)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getEstadoPresupuestoColor(
                              presupuesto.estado
                            )}`}
                          >
                            {presupuesto.estado}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {presupuesto.esta_vigente ? (
                            <span className="text-green-600 flex items-center gap-1">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Vigente ({presupuesto.dias_para_vencimiento}d)
                            </span>
                          ) : (
                            <span className="text-red-600 flex items-center gap-1">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                              Vencido
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {presupuesto.es_tramo ? (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                              Parcial
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                              Total
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <Link
                            to={`/presupuestos-digitales/${presupuesto.id}`}
                            className="text-cyan-600 hover:text-cyan-900"
                          >
                            Ver
                          </Link>
                          {presupuesto.puede_editarse &&
                            (user?.idtipousuario === 1 ||
                              user?.idtipousuario === 3) && (
                              <button
                                onClick={() => handleEliminarPresupuesto(presupuesto.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Eliminar
                              </button>
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
