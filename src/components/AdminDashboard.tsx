// src/components/AdminDashboard.tsx
import { Link, Navigate } from "react-router-dom";
import TopBar from "./TopBar.tsx";
import { useAuth } from "../context/AuthContext.tsx";
import { useEffect, useState } from "react";
import { Api } from "../lib/Api.ts";
import { toast, Toaster } from "react-hot-toast";
import Bitacora from "./Bitacora.tsx";
import { descargarPDFConsentimiento } from "../services/consentimientoService";

type Counts = {
  users?: number;
  pacientes?: number;
  consultas?: number;
};

export default function AdminDashboard() {
  console.log("Estoy dentro de admin");
  const { isAuth, user } = useAuth();
  const [counts, setCounts] = useState<Counts>({});
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState<'dashboard' | 'bitacora' | 'consentimientos'>('dashboard');
  const [consentimientos, setConsentimientos] = useState<any[]>([]);
  const [loadingConsentimientos, setLoadingConsentimientos] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!isAuth) return;
      try {
        setLoading(true);
        const [u, p, c] = await Promise.all([
          Api.get<{ count: number }>("/users/count/").catch(
            () => ({ data: { count: 0 } } as never)
          ),
          Api.get<{ count?: number; results?: never[] }>(
            "/pacientes/?limit=1"
          ).catch(() => ({ data: { results: [] } } as never)),
          Api.get<{ count?: number; results?: never[] }>(
            "/consultas/?limit=1"
          ).catch(() => ({ data: { results: [] } } as never)),
        ]);
        setCounts({
          users: u?.data?.count ?? 0,
          pacientes:
            p?.data?.count ??
            (Array.isArray(p?.data?.results) ? p.data.results.length : 0),
          consultas:
            c?.data?.count ??
            (Array.isArray(c?.data?.results) ? c.data.results.length : 0),
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAuth]);

  // Función para cargar consentimientos
  useEffect(() => {
    if (activeView === 'consentimientos') {
      cargarConsentimientos();
    }
  }, [activeView]);

  const cargarConsentimientos = async () => {
    setLoadingConsentimientos(true);
    try {
      const response = await Api.get('/consentimientos/?page_size=100');
      const list = Array.isArray(response.data) ? response.data : (response.data?.results ?? []);
      setConsentimientos(list || []);
    } catch {
      toast.error("No se pudieron cargar los consentimientos");
      setConsentimientos([]);
    } finally {
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

  const handleValidarConsentimiento = async (consentimientoId: number) => {
    if (!window.confirm("¿Está seguro de que desea validar este consentimiento?")) {
      return;
    }
    
    try {
      await Api.post(`/consentimientos/${consentimientoId}/firmar-validar/`);
      toast.success("Consentimiento validado exitosamente");
      // Recargar la lista para reflejar el cambio
      cargarConsentimientos();
    } catch (error) {
      console.error("Error al validar el consentimiento:", error);
      toast.error("No se pudo validar el consentimiento.");
    }
  };

  if (!isAuth) return <Navigate to="/login" replace />;

  // Si estamos en la vista de consentimientos
  if (activeView === 'consentimientos') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-white">
        <TopBar />
        <Toaster />
        <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          {/* Header con botón de regreso */}
          <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6 sm:mb-10">
            <div className="flex items-center gap-3">
              <img src="/dentist.svg" className="w-7 h-7 sm:w-8 sm:h-8" alt="" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                Gestión de Consentimientos
              </h2>
            </div>
            <button
              onClick={() => setActiveView('dashboard')}
              className="self-start sm:self-auto text-xs sm:text-sm px-2.5 sm:px-3 py-1 rounded-full bg-cyan-100 text-cyan-700 hover:bg-cyan-200 transition-colors"
            >
              ← Volver al Panel
            </button>
          </header>

          {/* Tabla de Consentimientos */}
          <div className="bg-white/80 backdrop-blur-sm border border-cyan-100 rounded-2xl p-4 sm:p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Lista de Consentimientos Firmados
            </h3>
            
            {loadingConsentimientos ? (
              <p className="text-gray-500">Cargando consentimientos…</p>
            ) : consentimientos.length === 0 ? (
              <p className="text-gray-500">No hay consentimientos firmados.</p>
            ) : (
              <div className="overflow-auto border rounded-lg bg-white shadow">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-2">Paciente</th>
                      <th className="text-left p-2">Fecha de Firma</th>
                      <th className="text-left p-2">Título</th>
                      <th className="text-left p-2">Validado</th>
                      <th className="text-left p-2">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {consentimientos.map((c) => (
                      <tr key={c.id} className="border-t">
                        <td className="p-2">{c.paciente_nombre} {c.paciente_apellido}</td>
                        <td className="p-2 whitespace-nowrap">
                          {new Date(c.fecha_creacion).toLocaleDateString()}
                        </td>
                        <td className="p-2 max-w-xs truncate" title={c.titulo}>
                          {c.titulo.length > 30 
                            ? `${c.titulo.substring(0, 30)}...` 
                            : c.titulo}
                        </td>
                        <td className="p-2">
                          {c.fecha_validacion 
                            ? <span className="text-green-600">Sí - {c.validado_por_nombre} {c.validado_por_apellido}</span>
                            : <span className="text-red-600">No</span>
                          }
                        </td>
                        <td className="p-2">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleDescargarPDF(c.id)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Descargar PDF"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                            </button>
                            {!c.fecha_validacion && user?.idtipousuario && [1, 4].includes(user.idtipousuario) && (
                              <button
                                onClick={() => handleValidarConsentimiento(c.id)}
                                className="text-green-600 hover:text-green-800"
                                title="Validar Consentimiento"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>

        <footer className="bg-gray-900 text-white py-6 sm:py-10 mt-10 sm:mt-20">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 text-center text-gray-400 text-xs sm:text-sm">
            © {new Date().getFullYear()} Clínica Dental. Todos los derechos
            reservados.
          </div>
        </footer>
      </div>
    );
  }

  // Si estamos en la vista de bitácora
  if (activeView === 'bitacora') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-white">
        <TopBar />
        <Toaster />

        <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          {/* Header con botón de regreso */}
          <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6 sm:mb-10">
            <div className="flex items-center gap-3">
              <img src="/dentist.svg" className="w-7 h-7 sm:w-8 sm:h-8" alt="" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                Bitácora de Auditoría
              </h2>
            </div>
            <button
              onClick={() => setActiveView('dashboard')}
              className="self-start sm:self-auto text-xs sm:text-sm px-2.5 sm:px-3 py-1 rounded-full bg-cyan-100 text-cyan-700 hover:bg-cyan-200 transition-colors"
            >
              ← Volver al Panel
            </button>
          </header>

          <Bitacora />
        </main>

        <footer className="bg-gray-900 text-white py-6 sm:py-10 mt-10 sm:mt-20">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 text-center text-gray-400 text-xs sm:text-sm">
            © {new Date().getFullYear()} Clínica Dental. Todos los derechos
            reservados.
          </div>
        </footer>
      </div>
    );
  }

  // Vista principal del dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-white">
      <TopBar />
      <Toaster />

      <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6 sm:mb-10">
          <div className="flex items-center gap-3">
            <img src="/dentist.svg" className="w-7 h-7 sm:w-8 sm:h-8" alt="" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              Panel de la Clínica
            </h2>
          </div>
          <span className="self-start sm:self-auto text-xs sm:text-sm px-2.5 sm:px-3 py-1 rounded-full bg-emerald-100 text-emerald-700">
            {loading ? "Sincronizando…" : "Conectado al backend"}
          </span>
        </header>

        {/* KPIs */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[
            { label: "Usuarios", value: counts.users ?? 0 },
            { label: "Pacientes", value: counts.pacientes ?? 0 },
            { label: "Consultas", value: counts.consultas ?? 0 },
          ].map((k, i) => (
            <div
              key={i}
              className="bg-white/80 backdrop-blur-sm border border-cyan-100 rounded-2xl p-4 sm:p-6 shadow-sm"
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-teal-600 grid place-items-center shrink-0">
                  <img src="/dentist.svg" className="w-5 h-5 sm:w-6 sm:h-6" alt="" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-gray-500">{k.label}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">
                    {k.value}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Acciones rápidas */}
        <section className="mt-6 sm:mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">

          {/* <— CAMBIO AQUÍ: apunta al panel Usuarios & Seguridad —> */}
          <Link
            to="/usuarios-seguridad"
            className="group bg-white/80 border border-cyan-100 rounded-2xl p-4 sm:p-6 hover:shadow-lg transition"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-cyan-100 grid place-items-center shrink-0">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 text-sm sm:text-base">
                  Gestionar Pacientes
                </p>
                <p className="text-xs sm:text-sm text-gray-500">
                  Altas, ediciones, historial
                </p>
              </div>
            </div>
          </Link>

          <Link
            to="/agenda"
            className="group bg-white/80 border border-cyan-100 rounded-2xl p-4 sm:p-6 hover:shadow-lg transition"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-cyan-100 grid place-items-center shrink-0">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7h8M8 11h8M8 15h6M5 7h.01M5 11h.01M5 15h.01"
                  />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 text-sm sm:text-base">
                  Agenda & Consultas
                </p>
                <p className="text-xs sm:text-sm text-gray-500">
                  Turnos, estados, pagos
                </p>
              </div>
            </div>
          </Link>

          <Link
            to="/reportes"
            className="group bg-white/80 border border-cyan-100 rounded-2xl p-4 sm:p-6 hover:shadow-lg transition"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-cyan-100 grid place-items-center shrink-0">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 11V3a1 1 0 012 0v8h3l-4 4-4-4h3zM5 19h14"
                  />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 text-sm sm:text-base">
                  Reportes
                </p>
                <p className="text-xs sm:text-sm text-gray-500">
                  KPI clínicos y financieros
                </p>
              </div>
            </div>
          </Link>

          {/* Registrar Historia Clínica */}
          <Link
            to="/registrar-historia-clinica"
            className="group bg-white/80 border border-green-100 rounded-2xl p-4 sm:p-6 hover:shadow-lg transition"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-green-100 grid place-items-center shrink-0">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-green-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 text-sm sm:text-base">
                  Registrar Historia Clínica
                </p>
                <p className="text-xs sm:text-sm text-gray-500">
                  Nueva historia para paciente
                </p>
              </div>
            </div>
          </Link>

          {/* Consultar Historia Clínica */}
          <Link
            to="/consultar-historia-clinica"
            className="group bg-white/80 border border-blue-100 rounded-2xl p-4 sm:p-6 hover:shadow-lg transition"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-blue-100 grid place-items-center shrink-0">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-blue-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 text-sm sm:text-base">
                  Consultar Historias Clínicas
                </p>
                <p className="text-xs sm:text-sm text-gray-500">
                  Ver historial de pacientes
                </p>
              </div>
            </div>
          </Link>

          {/* Catálogo de Servicios */}
          <Link
            to="/catalogo-servicios"
            className="group bg-white/80 border border-indigo-100 rounded-2xl p-4 sm:p-6 hover:shadow-lg transition"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-indigo-100 grid place-items-center shrink-0">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 text-sm sm:text-base">
                  Catálogo de Servicios
                </p>
                <p className="text-xs sm:text-sm text-gray-500">
                  Consultar servicios dentales disponibles
                </p>
              </div>
            </div>
          </Link>

          {/* Combos de Servicios */}
          <Link
            to="/combos"
            className="group bg-white/80 border border-purple-100 rounded-2xl p-4 sm:p-6 hover:shadow-lg transition"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-purple-100 grid place-items-center shrink-0">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-purple-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                  />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 text-sm sm:text-base">
                  Combos de Servicios
                </p>
                <p className="text-xs sm:text-sm text-gray-500">
                  Gestionar paquetes y ofertas de servicios
                </p>
              </div>
            </div>
          </Link>

          {/* Planes de Tratamiento */}
          <Link
            to="/planes-tratamiento"
            className="group bg-white/80 border border-teal-100 rounded-2xl p-4 sm:p-6 hover:shadow-lg transition"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-teal-100 grid place-items-center shrink-0">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-teal-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 text-sm sm:text-base">
                  Planes de Tratamiento
                </p>
                <p className="text-xs sm:text-sm text-gray-500">
                  Crear y gestionar planes de tratamiento
                </p>
              </div>
            </div>
          </Link>

          {/* Presupuestos Digitales */}
          <Link
            to="/presupuestos-digitales"
            className="group bg-white/80 border border-emerald-100 rounded-2xl p-4 sm:p-6 hover:shadow-lg transition"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-emerald-100 grid place-items-center shrink-0">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 text-sm sm:text-base">
                  Presupuestos Digitales
                </p>
                <p className="text-xs sm:text-sm text-gray-500">
                  Generar y gestionar presupuestos
                </p>
              </div>
            </div>
          </Link>

          {/* Bitácora de Auditoría (solo admins) */}
          {user?.idtipousuario === 1 && (
            <button
              onClick={() => setActiveView('bitacora')}
              className="group bg-white/80 border border-purple-100 rounded-2xl p-4 sm:p-6 hover:shadow-lg transition text-left w-full"
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-purple-100 grid place-items-center shrink-0">
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 text-purple-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-sm sm:text-base">
                    Bitácora de Auditoría
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500">
                    Registro de actividades y seguridad
                  </p>
                </div>
                <span className="ml-auto text-purple-700 group-hover:translate-x-0.5 transition">
                  →
                </span>
              </div>
            </button>
          )}

          {/* Gestionar Consentimientos (solo admins y odontólogos) */}
          {user?.idtipousuario && [1, 4].includes(user.idtipousuario) && (
            <button
              onClick={() => setActiveView('consentimientos')}
              className="group bg-white/80 border border-orange-100 rounded-2xl p-4 sm:p-6 hover:shadow-lg transition text-left w-full"
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-orange-100 grid place-items-center shrink-0">
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 text-orange-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-sm sm:text-base">
                    Gestionar Consentimientos
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500">
                    Validar y descargar consentimientos
                  </p>
                </div>
                <span className="ml-auto text-orange-700 group-hover:translate-x-0.5 transition">
                  →
                </span>
              </div>
            </button>
          )}
        </section>
      </main>

      <footer className="bg-gray-900 text-white py-6 sm:py-10 mt-10 sm:mt-20">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 text-center text-gray-400 text-xs sm:text-sm">
          © {new Date().getFullYear()} Clínica Dental. Todos los derechos
          reservados.
        </div>
      </footer>
    </div>
  );
}