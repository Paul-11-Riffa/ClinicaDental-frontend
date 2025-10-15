import { useEffect, useMemo, useRef, useState } from "react";
import ProtectedRoute from "../components/ProtectedRoute";
import TopBar from "../components/TopBar";
import { Api } from "../lib/Api";
import { Toaster, toast } from "react-hot-toast";
import { descargarPDFConsentimiento } from "../services/consentimientoService";

type PacienteApi = {
  codusuario: {
    codigo: number;
    nombre: string;
    apellido: string;
  };
};

type HCEItem = {
  id: number;
  pacientecodigo: number;
  episodio: number;
  fecha: string; // ISO
  alergias?: string | null;
  enfermedades?: string | null;
  motivoconsulta?: string | null;
  diagnostico?: string | null;
  updated_at?: string | null;
};

type Consentimiento = {
  id: number;
  paciente: number;
  consulta?: number;
  titulo: string;
  texto_contenido: string;
  fecha_creacion: string;
  fecha_creacion_formateada: string;
  paciente_nombre: string;
  paciente_apellido: string;
  validado_por_nombre?: string;
  validado_por_apellido?: string;
  fecha_validacion?: string;
};

export default function ConsultarHistoriaClinica() {
  // pacientes
  const [pacientes, setPacientes] = useState<PacienteApi[]>([]);
  const [loadingPacientes, setLoadingPacientes] = useState(true);

  // búsqueda
  const [query] = useState("");
  const debounceRef = useRef<number | null>(null);

  // selección
  const [pacienteId, setPacienteId] = useState<number | "">("");

  // historias
  const [historias, setHistorias] = useState<HCEItem[]>([]);
  const [loadingHistorias, setLoadingHistorias] = useState(false);
  // consentimientos
  const [consentimientos, setConsentimientos] = useState<Consentimiento[]>([]);
  const [loadingConsentimientos, setLoadingConsentimientos] = useState(false);

  // documentos
  const [documentos, setDocumentos] = useState<Record<number, DocumentoClinico[]>>({});
  const [historiaExpandida, setHistoriaExpandida] = useState<number | null>(null);
  const [loadingDocumentos, setLoadingDocumentos] = useState<Record<number, boolean>>({});

  // cargar pacientes iniciales
  useEffect(() => {
    (async () => {
      try {
        const { data } = await Api.get("/pacientes/?page_size=100");
        const list = Array.isArray(data) ? data : (data?.results ?? []);
        setPacientes(list || []);
      } catch {
        toast.error("No se pudieron cargar pacientes");
      } finally {
        setLoadingPacientes(false);
      }
    })();
  }, []);

  // búsqueda en servidor (fallback: no rompe si no está activo)
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      const q = query.trim();
      if (q.length < 2) return;
      try {
        const { data } = await Api.get(`/pacientes/?search=${encodeURIComponent(q)}&page_size=100`);
        const list = Array.isArray(data) ? data : (data?.results ?? []);
        if (!Array.isArray(list) || list.length === 0) {
          // fallback: filtrar lo ya cargado
          setPacientes((prev) =>
            prev.filter((p) => {
              const full = `${p?.codusuario?.nombre ?? ""} ${p?.codusuario?.apellido ?? ""}`.toLowerCase();
              return full.includes(q.toLowerCase());
            })
          );
        } else {
          setPacientes(list);
        }
      } catch {
        // ignorar error de búsqueda
      }
    }, 350);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query]);

  const optionsPacientes = useMemo(
    () =>
      Array.isArray(pacientes)
        ? pacientes.map((p) => ({
            id: p?.codusuario?.codigo,
            label: `${p?.codusuario?.nombre ?? ""} ${p?.codusuario?.apellido ?? ""}`.trim(),
          }))
        : [],
    [pacientes]
  );

  // cargar historias al seleccionar
  const cargarHistorias = async (id: number) => {
    setLoadingHistorias(true);
    setLoadingConsentimientos(true);
    try {
      // Cargar historias y consentimientos concurrentemente
      const [historiasResponse, consentimientosResponse] = await Promise.all([
        Api.get(`/historias-clinicas/?paciente=${id}&page_size=1000`),
        Api.get(`/consentimientos/?paciente=${id}&page_size=1000`)
      ]);
      
      const historiasList = Array.isArray(historiasResponse.data) ? historiasResponse.data : (historiasResponse.data?.results ?? []);
      const consentimientosList = Array.isArray(consentimientosResponse.data) ? consentimientosResponse.data : (consentimientosResponse.data?.results ?? []);
      
      setHistorias(historiasList || []);
      setConsentimientos(consentimientosList || []);
    } catch {
      toast.error("No se pudo obtener el historial clínico o los consentimientos");
      setHistorias([]);
      setConsentimientos([]);
    } finally {
      setLoadingHistorias(false);
      setLoadingConsentimientos(false);
    }
  };

  const handleDescargarPDF = async (consentimientoId: number) => {
    try {
      const pdfBlob = await descargarPDFConsentimiento(consentimientoId);
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `consentimiento_${consentimientoId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error al descargar el PDF:", error);
      toast.error("No se pudo descargar el PDF del consentimiento.");
    }
  };

  const cargarDocumentos = async (historiaId: number) => {
    if (documentos[historiaId]) {
      // Si ya están cargados, solo expandir/colapsar
      setHistoriaExpandida(historiaExpandida === historiaId ? null : historiaId);
      return;
    }

    setLoadingDocumentos(prev => ({ ...prev, [historiaId]: true }));
    try {
      const { data } = await Api.get(`/documentos-clinicos/?idhistorialclinico=${historiaId}`);
      const list = Array.isArray(data) ? data : (data?.results ?? []);
      setDocumentos(prev => ({ ...prev, [historiaId]: list || [] }));
      setHistoriaExpandida(historiaId);
    } catch (err) {
      console.error("Error cargando documentos:", err);
      toast.error("No se pudieron cargar los documentos");
    } finally {
      setLoadingDocumentos(prev => ({ ...prev, [historiaId]: false }));
    }
  };

  const descargarDocumento = async (documentoId: string) => {
    try {
      const { data } = await Api.get(`/documentos-clinicos/${documentoId}/download_url/`);
      if (data.download_url) {
        window.open(data.download_url, '_blank');
      }
    } catch (err) {
      console.error("Error al obtener URL de descarga:", err);
      toast.error("No se pudo obtener el documento");
    }
  };

  const getTipoDocumentoLabel = (tipo: string) => {
    const tipos: Record<string, string> = {
      radiografia: "Radiografía",
      examen_laboratorio: "Examen de Laboratorio",
      imagen_diagnostico: "Imagen de Diagnóstico",
      consentimiento: "Consentimiento Informado",
      receta: "Receta Médica",
      foto_clinica: "Foto Clínica",
      otro: "Otro",
    };
    return tipos[tipo] || tipo;
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-white">
        <TopBar />
        <Toaster />

        <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          <header className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800">
              Consultar Historia Clínica
            </h1>
            <p className="text-gray-500">
              Selecciona al paciente para ver sus episodios de Historia Clínica (HCE).
            </p>
          </header>

          {/* Filtros */}
          <section className="bg-white rounded-2xl shadow p-4 sm:p-6 grid gap-4 sm:gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Paciente
              </label>
              <select
                value={pacienteId}
                onChange={(e) => {
                  const v = e.target.value ? Number(e.target.value) : "";
                  setPacienteId(v);
                  if (v) cargarHistorias(v);
                }}
                className="w-full border rounded-lg p-2"
                disabled={loadingPacientes}
              >
                <option value="">Selecciona…</option>
                {optionsPacientes.map((op) => (
                  <option key={op.id} value={op.id}>
                    {op.label}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {/* Resultados */}
          <section className="mt-8">
            {!pacienteId ? (
              <p className="text-gray-500">Selecciona un paciente para ver su historial.</p>
            ) : (
              <div className="space-y-4">
                {historias.map((h) => (
                  <div key={h.id} className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-auto">
                      <table className="min-w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left p-2">Fecha</th>
                            <th className="text-left p-2">Episodio</th>
                            <th className="text-left p-2">Motivo de consulta</th>
                            <th className="text-left p-2">Diagnóstico</th>
                            <th className="text-left p-2">Alergias</th>
                            <th className="text-left p-2">Enfermedades</th>
                            <th className="text-left p-2">Documentos</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-t">
                            <td className="p-2 whitespace-nowrap">
                              {new Date(h.fecha).toLocaleString()}
                            </td>
                            <td className="p-2">{h.episodio}</td>
                            <td className="p-2">{h.motivoconsulta || "-"}</td>
                            <td className="p-2">{h.diagnostico || "-"}</td>
                            <td className="p-2">{h.alergias || "-"}</td>
                            <td className="p-2">{h.enfermedades || "-"}</td>
                            <td className="p-2">
                              <button
                                type="button"
                                onClick={() => cargarDocumentos(h.id)}
                                disabled={loadingDocumentos[h.id]}
                                className="text-cyan-600 hover:text-cyan-700 text-sm font-medium flex items-center gap-1"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                {loadingDocumentos[h.id] ? "Cargando..." : "Ver documentos"}
                              </button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Documentos expandibles */}
                    {historiaExpandida === h.id && (
                      <div className="border-t bg-gray-50 p-4">
                        <h3 className="font-semibold text-gray-700 mb-3">
                          Documentos Clínicos
                        </h3>
                        {documentos[h.id]?.length === 0 ? (
                          <p className="text-sm text-gray-500">No hay documentos adjuntos</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {documentos[h.id]?.map((doc) => (
                              <div
                                key={doc.id}
                                className="bg-white rounded-lg border p-3 hover:shadow-md transition-shadow"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1">
                                    <p className="font-medium text-sm text-gray-800 truncate" title={doc.nombre_archivo}>
                                      {doc.nombre_archivo}
                                    </p>
                                    <p className="text-xs text-cyan-600 font-medium">
                                      {getTipoDocumentoLabel(doc.tipo_documento)}
                                    </p>
                                    <p className="text-xs text-gray-400 uppercase mt-1">
                                      .{doc.extension}
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => descargarDocumento(doc.id)}
                                    className="text-cyan-600 hover:text-cyan-700 flex-shrink-0 ml-2"
                                    title="Descargar"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                  </button>
                                </div>
                                <div className="text-xs text-gray-600 space-y-1 border-t pt-2">
                                  <p className="flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span>Fecha: {new Date(doc.fecha_documento).toLocaleDateString('es-ES')}</span>
                                  </p>
                                  <p className="flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <span>Tamaño: {doc.tamanio_mb.toFixed(2)} MB</span>
                                  </p>
                                  <p className="flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    <span className="truncate" title={doc.profesional_nombre}>
                                      Por: {doc.profesional_nombre}
                                    </span>
                                  </p>
                                  {doc.notas && (
                                    <p className="italic text-gray-500 pt-1 border-t">
                                      "{doc.notas}"
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </ProtectedRoute>
  );
}
