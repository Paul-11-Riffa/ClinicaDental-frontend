// src/components/RecepcionistaDashboard.tsx
import { Link } from "react-router-dom";
import TopBar from "./TopBar.tsx";
import { useAuth } from "../context/AuthContext.tsx";
import { useEffect, useState } from "react";
import { Api } from "../lib/Api.ts";
import { toast, Toaster } from "react-hot-toast";

type Counts = {
  pacientes?: number;
  consultas_hoy?: number;
  consultas_pendientes?: number;
  citas_por_confirmar?: number;
};

export default function RecepcionistaDashboard() {
  console.log("Dashboard Recepcionista cargado");
  const { isAuth, user } = useAuth();
  const [counts, setCounts] = useState<Counts>({});
  const [loading, setLoading] = useState(false);
  const [citasHoy, setCitasHoy] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!isAuth) return;
      try {
        setLoading(true);
        
        // Obtener estadísticas de recepción
        const [p, ch, cp, cpc] = await Promise.all([
          Api.get<{ count?: number; results?: never[] }>("/pacientes/?limit=1").catch(() => ({ data: { results: [] } })),
          Api.get<{ count?: number; results?: any[] }>("/consultas/?fecha=hoy").catch(() => ({ data: { results: [] } })),
          Api.get<{ count?: number; results?: never[] }>("/consultas/?estado=pendiente&limit=1").catch(() => ({ data: { results: [] } })),
          Api.get<{ count?: number; results?: never[] }>("/consultas/?estado=por_confirmar&limit=1").catch(() => ({ data: { results: [] } })),
        ]);

        setCounts({
          pacientes: (p?.data as any)?.count ?? (Array.isArray(p?.data?.results) ? p.data.results.length : 0),
          consultas_hoy: (ch?.data as any)?.count ?? (Array.isArray(ch?.data?.results) ? ch.data.results.length : 0),
          consultas_pendientes: (cp?.data as any)?.count ?? (Array.isArray(cp?.data?.results) ? cp.data.results.length : 0),
          citas_por_confirmar: (cpc?.data as any)?.count ?? (Array.isArray(cpc?.data?.results) ? cpc.data.results.length : 0),
        });

        // Guardar las citas de hoy para mostrar en la agenda
        if (ch?.data?.results) {
          setCitasHoy(ch.data.results);
        }
      } catch (error) {
        console.error("Error cargando datos de recepción:", error);
        toast.error("Error al cargar los datos del dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuth]);

  if (!isAuth) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar />
      <Toaster position="top-right" />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Panel Recepcionista
          </h1>
          <p className="text-gray-600 mt-2">
            Bienvenido/a {user?.nombre} {user?.apellido}
          </p>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{counts.pacientes ?? 0}</p>
                <p className="text-gray-600">Pacientes</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{counts.consultas_hoy ?? 0}</p>
                <p className="text-gray-600">Citas Hoy</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{counts.consultas_pendientes ?? 0}</p>
                <p className="text-gray-600">Citas Pendientes</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5-5-5h5v-12h-5l5-5 5 5h-5v12z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{counts.citas_por_confirmar ?? 0}</p>
                <p className="text-gray-600">Por Confirmar</p>
              </div>
            </div>
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Panel de navegación */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Acciones Rápidas</h2>
            <div className="space-y-4">
              <Link
                to="/agenda"
                className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <svg className="w-8 h-8 text-blue-600 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div>
                  <h3 className="font-semibold text-gray-900">Ver Agenda</h3>
                  <p className="text-gray-600">Consultar citas programadas</p>
                </div>
              </Link>

              <Link
                to="/agendar-cita"
                className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
              >
                <svg className="w-8 h-8 text-green-600 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <div>
                  <h3 className="font-semibold text-gray-900">Agendar Cita</h3>
                  <p className="text-gray-600">Programar nueva consulta</p>
                </div>
              </Link>

              <Link
                to="/register-patient"
                className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <svg className="w-8 h-8 text-purple-600 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                <div>
                  <h3 className="font-semibold text-gray-900">Registrar Paciente</h3>
                  <p className="text-gray-600">Agregar nuevo paciente</p>
                </div>
              </Link>

              <Link
                to="/mis-citas"
                className="flex items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
              >
                <svg className="w-8 h-8 text-orange-600 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <div>
                  <h3 className="font-semibold text-gray-900">Gestionar Citas</h3>
                  <p className="text-gray-600">Ver y administrar citas</p>
                </div>
              </Link>

              <Link
                to="/consultar-historia-clinica"
                className="flex items-center p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                <svg className="w-8 h-8 text-indigo-600 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <div>
                  <h3 className="font-semibold text-gray-900">Consultar Historias</h3>
                  <p className="text-gray-600">Ver historiales médicos</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Citas de hoy */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Agenda de Hoy</h2>
            {loading ? (
              <div className="text-center text-gray-500">Cargando agenda...</div>
            ) : citasHoy.length > 0 ? (
              <div className="space-y-3">
                {citasHoy.slice(0, 5).map((cita, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {cita.paciente_nombre || "Paciente"}
                        </p>
                        <p className="text-sm text-gray-600">
                          {cita.hora || "Sin hora"} - Dr. {cita.odontologo_nombre || "Sin asignar"}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        cita.estado === 'confirmada' 
                          ? 'bg-green-100 text-green-800'
                          : cita.estado === 'por_confirmar'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {cita.estado === 'por_confirmar' ? 'Por confirmar' : cita.estado || "Pendiente"}
                      </span>
                    </div>
                  </div>
                ))}
                {citasHoy.length > 5 && (
                  <Link 
                    to="/agenda" 
                    className="block text-center text-blue-600 hover:text-blue-800 text-sm mt-3"
                  >
                    Ver todas las citas ({citasHoy.length})
                  </Link>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500">
                No hay citas programadas para hoy
              </div>
            )}
          </div>
        </div>

        {/* Recordatorio para confirmar citas */}
        {counts.citas_por_confirmar && counts.citas_por_confirmar > 0 && (
          <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-red-800">
                  Tienes {counts.citas_por_confirmar} citas por confirmar
                </h3>
                <p className="mt-1 text-sm text-red-700">
                  Es importante confirmar las citas para evitar no-shows.
                </p>
                <Link 
                  to="/mis-citas" 
                  className="mt-2 inline-block text-sm font-medium text-red-800 hover:text-red-900"
                >
                  Ver citas por confirmar →
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}