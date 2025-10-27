// src/components/HistorialAceptaciones.tsx
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  obtenerHistorialAceptaciones,
  descargarComprobanteAceptacion,
  formatearMonto,
} from "../services/presupuestosDigitalesService";
import type { HistorialAceptaciones as HistorialAceptacionesType } from "../interfaces/PresupuestoDigital";

interface HistorialAceptacionesProps {
  presupuestoId: number;
  codigoPresupuesto?: string;
}

export default function HistorialAceptaciones({
  presupuestoId,
  codigoPresupuesto,
}: HistorialAceptacionesProps) {
  const [historial, setHistorial] = useState<HistorialAceptacionesType | null>(null);
  const [loading, setLoading] = useState(true);
  const [descargando, setDescargando] = useState<number | null>(null);
  const [mostrarPreview, setMostrarPreview] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [cargandoPreview, setCargandoPreview] = useState(false);

  useEffect(() => {
    cargarHistorial();
  }, [presupuestoId]);

  const cargarHistorial = async () => {
    setLoading(true);
    try {
      const data = await obtenerHistorialAceptaciones(presupuestoId);
      setHistorial(data);
    } catch (error: any) {
      console.error("Error al cargar historial:", error);
      toast.error(
        error?.response?.data?.detail ||
          "Error al cargar el historial de aceptaciones"
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewComprobante = async (aceptacionId: number) => {
    setCargandoPreview(true);
    try {
      const blob = await descargarComprobanteAceptacion(aceptacionId);
      const url = window.URL.createObjectURL(blob);
      setPdfPreviewUrl(url);
      setMostrarPreview(true);
    } catch (error: any) {
      console.error("Error al cargar preview:", error);
      toast.error(
        error?.response?.data?.detail || "Error al cargar el preview del comprobante"
      );
    } finally {
      setCargandoPreview(false);
    }
  };

  const cerrarPreview = () => {
    if (pdfPreviewUrl) {
      window.URL.revokeObjectURL(pdfPreviewUrl);
      setPdfPreviewUrl(null);
    }
    setMostrarPreview(false);
  };

  const handleDescargarComprobante = async (aceptacionId: number) => {
    setDescargando(aceptacionId);
    try {
      toast.loading("Descargando comprobante...", { id: "download-pdf" });

      const blob = await descargarComprobanteAceptacion(aceptacionId);

      // Crear URL del blob
      const url = window.URL.createObjectURL(blob);

      // Crear elemento <a> temporal
      const link = document.createElement("a");
      link.href = url;
      link.download = `comprobante_${codigoPresupuesto || presupuestoId}_aceptacion_${aceptacionId}_${
        new Date().toISOString().split("T")[0]
      }.pdf`;

      // Agregar al DOM, hacer click y remover
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Limpiar URL del blob
      window.URL.revokeObjectURL(url);

      toast.success("📄 Comprobante descargado correctamente", {
        id: "download-pdf",
      });
    } catch (error: any) {
      console.error("Error al descargar comprobante:", error);
      toast.error(
        error?.response?.data?.detail || "Error al descargar el comprobante PDF",
        { id: "download-pdf" }
      );
    } finally {
      setDescargando(null);
    }
  };

  const getBadgeEstado = (estado: string) => {
    const badges = {
      Aceptado: "bg-green-100 text-green-800 border-green-200",
      Pendiente: "bg-yellow-100 text-yellow-800 border-yellow-200",
      Rechazado: "bg-red-100 text-red-800 border-red-200",
      Cancelado: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return badges[estado as keyof typeof badges] || badges.Pendiente;
  };

  const getBadgeTipo = (tipo: string) => {
    const badges = {
      Total: "bg-blue-100 text-blue-800 border-blue-200",
      Parcial: "bg-purple-100 text-purple-800 border-purple-200",
    };
    return badges[tipo as keyof typeof badges] || badges.Total;
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString("es-BO", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Historial de Aceptaciones
        </h3>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!historial || historial.total_aceptaciones === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Historial de Aceptaciones
        </h3>
        <div className="text-center py-12">
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
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            Sin Aceptaciones Registradas
          </h4>
          <p className="text-gray-600 text-sm max-w-sm mx-auto">
            Este presupuesto aún no ha sido aceptado. El historial se mostrará aquí
            una vez que el paciente acepte el presupuesto.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <svg
            className="w-6 h-6 text-blue-600 mr-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900">
            Historial de Aceptaciones
          </h3>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
          <p className="text-sm font-medium text-blue-900">
            {historial.total_aceptaciones}{" "}
            {historial.total_aceptaciones === 1 ? "Aceptación" : "Aceptaciones"}
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Línea vertical del timeline */}
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200"></div>

        {/* Items del timeline */}
        <div className="space-y-6">
          {historial.aceptaciones.map((aceptacion, index) => (
            <div key={aceptacion.id} className="relative pl-12">
              {/* Punto del timeline */}
              <div
                className={`absolute left-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  index === 0
                    ? "bg-blue-600 text-white ring-4 ring-blue-100"
                    : "bg-white border-2 border-gray-300"
                }`}
              >
                {index === 0 ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                )}
              </div>

              {/* Card de aceptación */}
              <div
                className={`bg-white border rounded-lg p-5 ${
                  index === 0
                    ? "border-blue-300 shadow-md"
                    : "border-gray-200 shadow-sm"
                }`}
              >
                {/* Header de la card */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
                  <div className="mb-3 sm:mb-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getBadgeTipo(
                          aceptacion.tipo_aceptacion
                        )}`}
                      >
                        {aceptacion.tipo_aceptacion}
                      </span>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getBadgeEstado(
                          aceptacion.estado
                        )}`}
                      >
                        {aceptacion.estado}
                      </span>
                      {index === 0 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                          Más reciente
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {formatearFecha(aceptacion.fecha_aceptacion)}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-sm text-gray-500 mb-1">ID Aceptación</p>
                    <p className="font-mono text-sm font-medium text-gray-900">
                      #{aceptacion.id}
                    </p>
                  </div>
                </div>

                {/* Monto (si está disponible) */}
                {aceptacion.monto_aceptado && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-700 font-medium mb-1">
                      Monto Aceptado
                    </p>
                    <p className="text-2xl font-bold text-blue-900">
                      {formatearMonto(aceptacion.monto_aceptado)}
                    </p>
                  </div>
                )}

                {/* Items (si es Parcial y hay items) */}
                {aceptacion.tipo_aceptacion === "Parcial" &&
                  aceptacion.items_aceptados &&
                  aceptacion.items_aceptados.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-900 mb-2">
                        Tratamientos Aceptados:{" "}
                        <span className="text-purple-600">
                          {aceptacion.items_aceptados.length}{" "}
                          {aceptacion.items_aceptados.length === 1
                            ? "tratamiento"
                            : "tratamientos"}
                        </span>
                      </p>
                      <div className="space-y-2">
                        {aceptacion.items_aceptados.map((item: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-start justify-between p-2 bg-gray-50 rounded border border-gray-200"
                          >
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {item.servicio_nombre || item.descripcion}
                              </p>
                              {item.pieza_dental && (
                                <p className="text-xs text-gray-500">
                                  Pieza dental: {item.pieza_dental}
                                </p>
                              )}
                            </div>
                            {item.precio_final && (
                              <p className="text-sm font-semibold text-gray-900 ml-3">
                                {formatearMonto(item.precio_final)}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Notas */}
                {aceptacion.notas && (
                  <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-xs text-gray-600 font-medium mb-1">
                      📝 Notas del Paciente
                    </p>
                    <p className="text-sm text-gray-800">{aceptacion.notas}</p>
                  </div>
                )}

                {/* Información de firma digital */}
                {aceptacion.firma_digital_hash && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start">
                      <svg
                        className="w-5 h-5 text-green-600 mr-2 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div className="flex-1">
                        <p className="text-xs text-green-700 font-medium mb-1">
                          Firma Digital Verificada
                        </p>
                        <p className="text-xs text-green-600 font-mono break-all">
                          {aceptacion.firma_digital_hash.substring(0, 40)}...
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Botones de preview y descarga */}
                {aceptacion.puede_descargar && (
                  <div className="flex gap-2 flex-wrap">
                    {/* Botón Preview */}
                    <button
                      onClick={() => handlePreviewComprobante(aceptacion.id)}
                      disabled={cargandoPreview}
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center px-4 py-2 bg-white border border-blue-600 text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {cargandoPreview ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                          Cargando...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Ver Preview
                        </>
                      )}
                    </button>

                    {/* Botón Descargar */}
                    <button
                      onClick={() => handleDescargarComprobante(aceptacion.id)}
                      disabled={descargando === aceptacion.id}
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {descargando === aceptacion.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Descargando...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Descargar
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer con información adicional */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-start">
          <svg
            className="w-5 h-5 text-blue-600 mr-3 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="text-sm text-gray-600">
            <p className="mb-1">
              <strong>Nota:</strong> Cada aceptación genera un comprobante digital con
              código QR para verificación.
            </p>
            <p>
              Las aceptaciones parciales te permiten aceptar solo algunos tratamientos
              ahora y los demás posteriormente.
            </p>
          </div>
        </div>
      </div>

      {/* Modal de Preview del PDF */}
      {mostrarPreview && pdfPreviewUrl && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={cerrarPreview}
        >
          <div
            className="bg-white rounded-lg w-full max-w-4xl h-5/6 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Preview del Comprobante
              </h3>
              <button
                onClick={cerrarPreview}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Cerrar preview"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Contenido del PDF */}
            <div className="flex-1 overflow-hidden">
              <iframe
                src={pdfPreviewUrl}
                className="w-full h-full border-0"
                title="Preview del Comprobante PDF"
              />
            </div>

            {/* Footer con botones */}
            <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={cerrarPreview}
                className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
