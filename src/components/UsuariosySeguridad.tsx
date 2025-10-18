// src/components/UsuariosySeguridad.tsx
import { Link, Navigate, useNavigate } from "react-router-dom";
import TopBar from "./TopBar";
import { useAuth } from "../context/AuthContext";
import { useEffect, useMemo, useState } from "react";
import { Api } from "../lib/Api";

type UsuarioItem = {
  codigo: number;
  nombre: string;
  apellido: string;
  correoelectronico: string;
  idtipousuario: number; // 1 admin, 3 recep, 4 odontólogo
};

const ROL_LABEL: Record<number, string> = {
  1: "Administradores del Sistema",
  4: "Odontólogos de la clínica",
  3: "Recepcionistas de la clínica",
};
const TARGET_ROLES = [1, 3, 4];

export default function UsuariosySeguridad() {
  const { isAuth, loading } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState<UsuarioItem[]>([]);
  const [uLoading, setULoading] = useState(false);
  const [uError, setUError] = useState<string | null>(null);

  const toArray = (data: any): UsuarioItem[] => {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.results)) return data.results;
    return [];
  };

  const fetchUsers = async () => {
    setULoading(true);
    setUError(null);
    try {
      const { data } = await Api.get("/usuarios/", {
        params: { roles: "1,3,4", page_size: 1000 },
      });
      const list = toArray(data).filter((u) => TARGET_ROLES.includes(u.idtipousuario));
      setUsers(list);
    } catch (e: any) {
      setUError(e?.response?.data?.detail || "No se pudo cargar la lista de usuarios por rol.");
    } finally {
      setULoading(false);
    }
  };

  useEffect(() => {
    if (isAuth) fetchUsers();
  }, [isAuth]);

  const grouped = useMemo(() => {
    const g: Record<number, UsuarioItem[]> = { 1: [], 3: [], 4: [] };
    for (const u of users) g[u.idtipousuario]?.push(u);
    [1, 3, 4].forEach((k) =>
      g[k].sort((a, b) => {
        const ap = a.apellido.localeCompare(b.apellido);
        return ap !== 0 ? ap : a.nombre.localeCompare(b.nombre);
      })
    );
    return g;
  }, [users]);

  if (loading) return <div className="min-h-screen grid place-items-center">Cargando…</div>;
  if (!isAuth) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-white">
      <TopBar />

      <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Header */}
        <header className="flex items-center justify-between mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg hover:bg-white/50 transition-colors"
              title="Volver"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <img src="/dentist.svg" className="w-7 h-7 sm:w-8 sm:h-8" alt="" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Usuarios & Seguridad</h2>
          </div>
          <span className="text-xs sm:text-sm px-2.5 sm:px-3 py-1 rounded-full bg-emerald-100 text-emerald-700">
            Accesos disponibles
          </span>
        </header>

        {/* Layout: izquierda (acciones) / derecha (listado) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Izquierda: columna de acciones compactas */}
          <section className="lg:col-span-4">
            <div className="space-y-4">
              {/* Gestionar roles */}
              <Link
                to="/usuarios"
                className="flex items-center gap-4 rounded-xl border border-cyan-100 bg-white/80 p-4 hover:shadow-md transition"
              >
                <div className="w-11 h-11 rounded-xl bg-cyan-100 grid place-items-center shrink-0">
                  <svg className="w-5 h-5 text-cyan-700" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 10-8 0v4M5 11h14l-1 10H6L5 11z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">Gestionar roles</p>
                  <p className="text-xs text-gray-500">Lista de usuarios y cambio de rol</p>
                </div>
                <span className="ml-auto text-cyan-700">→</span>
              </Link>

              {/* Crear nuevo usuario */}
              <Link
                to="/crear-usuario"
                className="flex items-center gap-4 rounded-xl border border-emerald-100 bg-white/80 p-4 hover:shadow-md transition"
              >
                <div className="w-11 h-11 rounded-xl bg-emerald-100 grid place-items-center shrink-0">
                  <svg className="w-5 h-5 text-emerald-700" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">Crear usuario</p>
                  <p className="text-xs text-gray-500">Agregar personal o pacientes al sistema</p>
                </div>
                <span className="ml-auto text-emerald-700">→</span>
              </Link>

              {/* Registrar Historia Clínica */}
              <Link
                to="/historias/registrar"
                className="flex items-center gap-4 rounded-xl border border-teal-100 bg-white/80 p-4 hover:shadow-md transition"
              >
                <div className="w-11 h-11 rounded-xl bg-teal-100 grid place-items-center shrink-0">
                  <svg className="w-5 h-5 text-teal-700" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">Registrar Historia Clínica</p>
                  <p className="text-xs text-gray-500">Nuevo episodio de paciente</p>
                </div>
                <span className="ml-auto text-teal-700">→</span>
              </Link>

              {/* Consultar Historia Clínica */}
              <Link
                to="/historias/consultar"
                className="flex items-center gap-4 rounded-xl border border-indigo-100 bg-white/80 p-4 hover:shadow-md transition"
              >
                <div className="w-11 h-11 rounded-xl bg-indigo-100 grid place-items-center shrink-0">
                  <svg className="w-5 h-5 text-indigo-700" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">Consultar Historia Clínica</p>
                  <p className="text-xs text-gray-500">Buscar paciente / ver episodios</p>
                </div>
                <span className="ml-auto text-indigo-700">→</span>
              </Link>
            </div>
          </section>

          {/* Derecha: panel ancho con usuarios por rol */}
          <aside className="lg:col-span-8">
            <div className="bg-white/80 border border-cyan-100 rounded-2xl p-4 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">Usuarios de la clinica</h3>
                <button
                  onClick={fetchUsers}
                  className="text-xs px-2 py-1 rounded-full bg-cyan-100 text-cyan-700 hover:bg-cyan-200"
                >
                  Recargar
                </button>
              </div>

              {uLoading && <p className="text-sm text-gray-500">Cargando usuarios…</p>}
              {uError && <p className="text-sm text-red-600 mb-2">{uError}</p>}

              {!uLoading && !uError && (
                <div className="space-y-6">
                  {[1, 4, 3].map((rol) => (
                    <div key={rol}>
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg sm:text-xl font-bold text-gray-900">
                          {ROL_LABEL[rol] ?? `Rol ${rol}`}
                        </h4>
                        <span className="text-xs rounded-full px-2 py-0.5 bg-gray-100 text-gray-600">
                          {grouped[rol]?.length ?? 0}
                        </span>
                      </div>
                      <ul className="mt-2 grid sm:grid-cols-2 gap-2">
                        {(grouped[rol] ?? []).map((u) => (
                          <li
                            key={u.codigo}
                            className="flex items-center justify-between rounded-lg border border-gray-100 bg-white px-3 py-2"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {u.apellido} {u.nombre}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {u.correoelectronico}
                              </p>
                            </div>
                            <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                              #{u.codigo}
                            </span>
                          </li>
                        ))}
                        {((grouped[rol] ?? []).length === 0) && (
                          <li className="text-xs text-gray-500 italic">No hay usuarios en este rol.</li>
                        )}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>

      <footer className="bg-gray-900 text-white py-6 sm:py-10 mt-10 sm:mt-20">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 text-center text-gray-400 text-xs sm:text-sm">
          © {new Date().getFullYear()} Clínica Dental. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}
