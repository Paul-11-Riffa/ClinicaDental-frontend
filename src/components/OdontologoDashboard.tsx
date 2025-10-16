// src/components/OdontologoDashboard.tsx
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
  historias_clinicas?: number;
};

export default function OdontologoDashboard() {
  console.log("Dashboard Odontólogo cargado");
  const { isAuth, user } = useAuth();
  const [counts, setCounts] = useState<Counts>({});
  const [loading, setLoading] = useState(false);
  const [citasHoy, setCitasHoy] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!isAuth) return;
      try {
        setLoading(true);
        
        // Obtener estadísticas del odontólogo
        const [p, ch, cp, hc] = await Promise.all([
          Api.get<{ count?: number; results?: never[] }>("/pacientes/?limit=1").catch(() => ({ data: { results: [] } })),
          Api.get<{ count?: number; results?: any[] }>("/consultas/?fecha=hoy").catch(() => ({ data: { results: [] } })),
          Api.get<{ count?: number; results?: never[] }>("/consultas/?estado=pendiente&limit=1").catch(() => ({ data: { results: [] } })),
          Api.get<{ count?: number; results?: never[] }>("/historias-clinicas/?limit=1").catch(() => ({ data: { results: [] } })),
        ]);

        setCounts({
          pacientes: (p?.data as any)?.count ?? (Array.isArray(p?.data?.results) ? p.data.results.length : 0),
          consultas_hoy: (ch?.data as any)?.count ?? (Array.isArray(ch?.data?.results) ? ch.data.results.length : 0),
          consultas_pendientes: (cp?.data as any)?.count ?? (Array.isArray(cp?.data?.results) ? cp.data.results.length : 0),
          historias_clinicas: (hc?.data as any)?.count ?? (Array.isArray(hc?.data?.results) ? hc.data.results.length : 0),
        });

        // Guardar las citas de hoy para mostrar en la agenda
        if (ch?.data?.results) {
          setCitasHoy(ch.data.results);
        }
      } catch (error) {
        console.error("Error cargando datos del odontólogo:", error);
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
            Panel Odontólogo
          </h1>
          <p className="text-gray-600 mt-2">
            Bienvenido Dr./Dra. {user?.nombre} {user?.apellido}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
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
              <div className="p-3 rounded-full bg-purple-100">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{counts.historias_clinicas ?? 0}</p>
                <p className="text-gray-600">Historias Clínicas</p>
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
                to="/registrar-historia-clinica"
                className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <svg className="w-8 h-8 text-purple-600 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div>
                  <h3 className="font-semibold text-gray-900">Registrar Historia</h3>
                  <p className="text-gray-600">Crear historia clínica</p>
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
            <h2 className="text-xl font-bold text-gray-900 mb-6">Citas de Hoy</h2>
            {loading ? (
              <div className="text-center text-gray-500">Cargando citas...</div>
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
                          {cita.hora || "Sin hora"}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        cita.estado === 'confirmada' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {cita.estado || "Pendiente"}
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
      </div>
    </div>
  );
}