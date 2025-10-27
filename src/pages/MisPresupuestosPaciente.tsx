// src/pages/MisPresupuestosPaciente.tsx
import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import TopBar from "../components/TopBar";
import { toast, Toaster } from "react-hot-toast";
import {
  obtenerMisPresupuestos,
  formatearMonto,
  calcularDiasRestantes,
  estaVigente,
} from "../services/presupuestosDigitalesService";
import type {
  PresupuestoParaPaciente,
  FiltrosMisPresupuestos,
} from "../interfaces/PresupuestoDigital";

export default function MisPresupuestosPaciente() {
  const { isAuth, user } = useAuth();
  const navigate = useNavigate();
  const [presupuestos, setPresupuestos] = useState<PresupuestoParaPaciente[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState<FiltrosMisPresupuestos>({
    page: 1,
    page_size: 10,
  });
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Verificar que el usuario sea paciente
  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  if (user?.idtipousuario !== 2) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopBar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">
              Acceso Restringido
            </h3>
            <p className="text-yellow-700">
              Esta sección es exclusiva para pacientes. Si eres odontólogo o
              administrador, accede a la gestión de presupuestos desde tu dashboard.
            </p>
            <button
              onClick={() => navigate("/dashboard")}
              className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
            >
              Ir al Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    cargarPresupuestos();
  }, [filtros]);

  const cargarPresupuestos = async () => {
    setLoading(true);
    try {
      const response = await obtenerMisPresupuestos(filtros);
      // El backend retorna PresupuestoDigital[], lo convertimos a formato para paciente
      const presupuestosFormateados: PresupuestoParaPaciente[] = (response.results as any[]).map((p: any) => ({
        id: p.id,
        codigo_presupuesto: p.codigo_corto || p.codigo_presupuesto,  // Priorizar código corto para display
        tipo_presupuesto: p.es_tramo ? "Parcial" : "Total",
        fecha_emision: p.fecha_emision,
        fecha_vigencia: p.fecha_vigencia,
        esta_vigente: estaVigente(p.fecha_vigencia, p.estado),
        monto_total: p.total || p.monto_total || "0.00",
        monto_neto: p.total || p.monto_neto || "0.00",
        estado_aceptacion: p.estado_aceptacion || "Pendiente",
        plan_tratamiento: {
          id: p.plan_tratamiento,
          odontologo: p.odontologo_nombre || "No especificado",
        },
        items: (p.items || []).map((item: any) => ({
          id: item.id,
          descripcion: item.servicio_nombre || item.descripcion || "Servicio",
          cantidad: 1,
          precio_unitario: item.precio_unitario || "0.00",
          subtotal: item.precio_final || item.subtotal || "0.00",
          permite_pago_parcial: item.permite_pago_parcial || false,
          cantidad_cuotas: item.cantidad_cuotas || null,
          pieza_dental: item.pieza_dental || null,
        })),
        dias_restantes: calcularDiasRestantes(p.fecha_vigencia),
      }));
      
      setPresupuestos(presupuestosFormateados);
      setTotalCount(response.count);
      setTotalPages(Math.ceil(response.count / (filtros.page_size || 10)));
    } catch (error: any) {
      console.error("Error al cargar presupuestos:", error);
      toast.error(
        error?.response?.data?.detail ||
          "Error al cargar tus presupuestos. Intenta nuevamente."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFiltroEstado = (estado: FiltrosMisPresupuestos["estado_aceptacion"]) => {
    setFiltros({ ...filtros, estado_aceptacion: estado, page: 1 });
  };

  const handleFiltroVigencia = (vigente: boolean | undefined) => {
    setFiltros({ ...filtros, esta_vigente: vigente, page: 1 });
  };

  const cambiarPagina = (nuevaPagina: number) => {
    setFiltros({ ...filtros, page: nuevaPagina });
  };

  const getEstadoBadgeColor = (estado: string) => {
    const colores: Record<string, string> = {
      Pendiente: "bg-yellow-100 text-yellow-800",
      Aceptado: "bg-green-100 text-green-800",
      Parcial: "bg-blue-100 text-blue-800",
      Rechazado: "bg-red-100 text-red-800",
    };
    return colores[estado] || "bg-gray-100 text-gray-800";
  };

  const getVigenciaBadge = (fechaVigencia: string, estado: string) => {
    const dias = calcularDiasRestantes(fechaVigencia);
    const vigente = dias >= 0 && estado === "Pendiente";

    if (!vigente) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          Caducado
        </span>
      );
    }

    if (dias <= 3) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {dias} {dias === 1 ? "día" : "días"} restante{dias !== 1 ? "s" : ""}
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
        Vigente ({dias} días)
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      <TopBar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Volver al Dashboard
          </button>

          <div className="flex items-center mb-4">
            <svg
              className="w-8 h-8 text-blue-600 mr-3"
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
            <h1 className="text-3xl font-bold text-gray-900">
              Mis Presupuestos Dentales
            </h1>
          </div>
          <p className="text-gray-600">
            Revisa y acepta los presupuestos emitidos por tu odontólogo
          </p>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Filtro Estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado de Aceptación
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleFiltroEstado(undefined)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    !filtros.estado_aceptacion
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => handleFiltroEstado("Pendiente")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filtros.estado_aceptacion === "Pendiente"
                      ? "bg-yellow-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Pendientes
                </button>
                <button
                  onClick={() => handleFiltroEstado("Aceptado")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filtros.estado_aceptacion === "Aceptado"
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Aceptados
                </button>
                <button
                  onClick={() => handleFiltroEstado("Parcial")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filtros.estado_aceptacion === "Parcial"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Parciales
                </button>
              </div>
            </div>

            {/* Filtro Vigencia */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vigencia
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleFiltroVigencia(undefined)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filtros.esta_vigente === undefined
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => handleFiltroVigencia(true)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filtros.esta_vigente === true
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Vigentes
                </button>
                <button
                  onClick={() => handleFiltroVigencia(false)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filtros.esta_vigente === false
                      ? "bg-red-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Caducados
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Presupuestos */}
        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-2 flex-1">
                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </div>
                  <div className="h-8 w-24 bg-gray-200 rounded-full"></div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
                <div className="h-10 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : presupuestos.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg
              className="mx-auto h-16 w-16 text-gray-400 mb-4"
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay presupuestos
            </h3>
            <p className="text-gray-500">
              No se encontraron presupuestos con los filtros seleccionados.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6">
              {presupuestos.map((presupuesto) => (
                <div
                  key={presupuesto.id}
                  className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200 transform hover:-translate-y-1"
                >
                  <div className="p-6">
                    {/* Header del Card */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
                      <div className="mb-3 sm:mb-0">
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                          Presupuesto #{presupuesto.codigo_presupuesto}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Dr(a). {presupuesto.plan_tratamiento.odontologo}
                        </p>
                      </div>
                      <div className="flex flex-col items-start sm:items-end gap-2">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getEstadoBadgeColor(
                            presupuesto.estado_aceptacion
                          )}`}
                        >
                          {presupuesto.estado_aceptacion}
                        </span>
                        {getVigenciaBadge(
                          presupuesto.fecha_vigencia,
                          presupuesto.estado_aceptacion
                        )}
                      </div>
                    </div>

                    {/* Información Principal */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 pb-4 border-b border-gray-200">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Fecha Emisión</p>
                        <p className="font-medium text-gray-900">
                          {new Date(presupuesto.fecha_emision).toLocaleDateString(
                            "es-BO",
                            { year: "numeric", month: "short", day: "numeric" }
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Válido Hasta</p>
                        <p className="font-medium text-gray-900">
                          {new Date(presupuesto.fecha_vigencia).toLocaleDateString(
                            "es-BO",
                            { year: "numeric", month: "short", day: "numeric" }
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Monto Total</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {formatearMonto(presupuesto.monto_total)}
                        </p>
                      </div>
                    </div>

                    {/* Items del Presupuesto */}
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Tratamientos Incluidos ({presupuesto.items.length})
                      </p>
                      <div className="space-y-2">
                        {presupuesto.items.slice(0, 3).map((item) => (
                          <div
                            key={item.id}
                            className="flex justify-between items-center text-sm"
                          >
                            <span className="text-gray-700">
                              • {item.descripcion}
                              {item.pieza_dental && (
                                <span className="text-gray-500 ml-1">
                                  (Pieza {item.pieza_dental})
                                </span>
                              )}
                            </span>
                            <span className="font-medium text-gray-900">
                              {formatearMonto(item.subtotal)}
                            </span>
                          </div>
                        ))}
                        {presupuesto.items.length > 3 && (
                          <p className="text-sm text-gray-500 italic">
                            + {presupuesto.items.length - 3} tratamiento(s) más
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      {presupuesto.estado_aceptacion === "Pendiente" &&
                      presupuesto.esta_vigente ? (
                        <Link
                          to={`/presupuestos/${presupuesto.id}/aceptar`}
                          className="flex-1 inline-flex justify-center items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <svg
                            className="w-5 h-5 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          Aceptar Presupuesto
                        </Link>
                      ) : (
                        <Link
                          to={`/presupuestos/${presupuesto.id}/aceptar`}
                          className="flex-1 inline-flex justify-center items-center px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          <svg
                            className="w-5 h-5 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                          Ver Detalles
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="mt-6 flex justify-center items-center gap-2">
                <button
                  onClick={() => cambiarPagina(filtros.page! - 1)}
                  disabled={filtros.page === 1}
                  aria-label="Página anterior"
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  Anterior
                </button>
                <span className="px-4 py-2 text-gray-700 font-medium" aria-live="polite">
                  Página {filtros.page} de {totalPages}
                </span>
                <button
                  onClick={() => cambiarPagina(filtros.page! + 1)}
                  disabled={filtros.page === totalPages}
                  aria-label="Página siguiente"
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
