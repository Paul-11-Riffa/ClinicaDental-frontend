// src/pages/GestionRoles.tsx
import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { toast, Toaster } from "react-hot-toast";
import TopBar from "../components/TopBar";
import CambiarRolModal from "../components/CambiarRolModal";
import {
  buscarUsuarios,
  listarTiposUsuario,
  cambiarRolPorCodigo,
} from "../services/Usuarios";
import type { TipoUsuario, Usuario } from "../services/Usuarios";
import { useAuth } from "../context/AuthContext";

const ROLES_INFO: Record<number, { nombre: string; badge: string; icon: string }> = {
  1: { nombre: "Administrador", badge: "bg-purple-100 text-purple-700 border-purple-300", icon: "⚙️" },
  2: { nombre: "Paciente", badge: "bg-blue-100 text-blue-700 border-blue-300", icon: "👤" },
  3: { nombre: "Odontólogo", badge: "bg-green-100 text-green-700 border-green-300", icon: "👨‍⚕️" },
  4: { nombre: "Recepcionista", badge: "bg-amber-100 text-amber-700 border-amber-300", icon: "📋" },
};

export default function GestionRoles() {
  const { user, isAuth, loading } = useAuth();
  const navigate = useNavigate();

  // filtros y datos
  const [query, setQuery] = useState<string>("");
  const [tipos, setTipos] = useState<TipoUsuario[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loadingList, setLoadingList] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal de cambio de rol
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<Usuario | null>(null);
  const [mostrarModal, setMostrarModal] = useState(false);

  // --- detectar si es admin (idtipousuario === 1) soportando user.usuario.idtipousuario
  type CurrentUser =
    | { idtipousuario?: number; usuario?: { idtipousuario?: number } }
    | null
    | undefined;

  const idTipoUsuarioActual =
    ((user as CurrentUser)?.idtipousuario ??
      (user as CurrentUser)?.usuario?.idtipousuario ??
      0) || 0;

  const isAdmin = idTipoUsuarioActual === 1;

  // cargar tipos y usuarios
  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setLoadingList(true);
        setError(null);
        const [u, t] = await Promise.all([
          buscarUsuarios(query),
          listarTiposUsuario(),
        ]);
        if (!alive) return;
        setUsuarios(u);
        setTipos(t);
      } catch (e) {
        if (!alive) return;
        const mensaje = e instanceof Error ? e.message : "No se pudo cargar la lista de usuarios/roles.";
        setError(mensaje);
        toast.error(mensaje);
      } finally {
        if (alive) setLoadingList(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [query]);

  // Abrir modal de confirmación
  const abrirModalCambioRol = (usuario: Usuario) => {
    setUsuarioSeleccionado(usuario);
    setMostrarModal(true);
  };

  // Confirmar cambio de rol
  const confirmarCambioRol = async (nuevoIdTipo: number) => {
    if (!usuarioSeleccionado) return;

    const toastId = toast.loading(`Cambiando rol de ${usuarioSeleccionado.nombre}...`);

    try {
      setError(null);
      const usuarioActualizado = await cambiarRolPorCodigo(usuarioSeleccionado.codigo, nuevoIdTipo);
      
      // Actualizar en UI
      setUsuarios((prev) =>
        prev.map((u) =>
          u.codigo === usuarioSeleccionado.codigo ? usuarioActualizado : u
        )
      );

      const rolInfo = ROLES_INFO[nuevoIdTipo] || { nombre: "rol", icon: "✓" };
      toast.success(
        `${rolInfo.icon} Rol cambiado exitosamente a ${rolInfo.nombre}\n✓ El historial del usuario se mantiene intacto`, 
        { 
          id: toastId,
          duration: 5000 
        }
      );
      
      setMostrarModal(false);
      setUsuarioSeleccionado(null);
    } catch (e) {
      const mensaje = e instanceof Error ? e.message : "No se pudo actualizar el rol.";
      setError(mensaje);
      toast.error(mensaje, { id: toastId });
      throw e; // Propagar error para que el modal lo maneje
    }
  };

  // Cancelar cambio
  const cancelarCambioRol = () => {
    setMostrarModal(false);
    setUsuarioSeleccionado(null);
  };

  const getRolInfo = (rolId: number) => {
    return ROLES_INFO[rolId] || { nombre: "Desconocido", badge: "bg-gray-100 text-gray-700 border-gray-300", icon: "❓" };
  };

  // si no está autenticado
  if (!isAuth && !loading) return <Navigate to="/login" replace />;

  // si no es admin, bloquea
  if (!loading && isAuth && !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopBar />
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-red-50 border-l-4 border-red-500 rounded-r-lg p-4">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <h1 className="text-xl font-semibold text-red-900">Acceso Restringido</h1>
                <p className="text-red-700 mt-1">
                  Solo los administradores pueden gestionar roles de usuarios.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-white">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#374151',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            borderRadius: '12px',
            padding: '16px',
            fontSize: '14px',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />

      <TopBar />

      <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Header */}
        <header className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg hover:bg-white/50 transition-colors"
              title="Volver"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Gestionar Roles de Usuarios</h2>
              <p className="text-gray-600 text-sm">
                Administra los roles y permisos de los usuarios del sistema
              </p>
            </div>
          </div>
        </header>

        {/* Buscador y estadísticas */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-cyan-500 focus:outline-none text-sm"
                placeholder="🔍 Buscar por nombre, apellido o correo..."
              />
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="px-3 py-1.5 rounded-full bg-cyan-100 text-cyan-700 font-medium">
              {usuarios.length} {usuarios.length === 1 ? 'usuario' : 'usuarios'}
            </span>
          </div>
        </div>

        {/* Estados de error */}
        {error && (
          <div className="mb-4 rounded-xl border-l-4 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-700">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Loading state */}
        {loadingList ? (
          <div className="bg-white rounded-xl border border-cyan-100 p-12 text-center">
            <div className="inline-block w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600">Cargando usuarios...</p>
          </div>
        ) : usuarios.length === 0 ? (
          <div className="bg-white rounded-xl border border-cyan-100 p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <p className="text-gray-600 font-medium mb-2">No hay usuarios para mostrar</p>
            <p className="text-gray-500 text-sm">
              {query ? "Intenta con otro término de búsqueda" : "Aún no hay usuarios registrados"}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-cyan-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-cyan-50 to-blue-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Correo Electrónico
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Rol Actual
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {usuarios.map((u) => {
                    const rolInfo = getRolInfo(u.idtipousuario);
                    return (
                      <tr key={u.codigo} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                              {u.nombre[0]}{u.apellido[0]}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {u.nombre} {u.apellido}
                              </p>
                              <p className="text-xs text-gray-500">ID: #{u.codigo}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm text-gray-900">{u.correoelectronico}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${rolInfo.badge}`}>
                            <span>{rolInfo.icon}</span>
                            <span>{rolInfo.nombre}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <button
                            onClick={() => abrirModalCambioRol(u)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-sm font-medium hover:from-cyan-700 hover:to-blue-700 transition-all shadow-sm hover:shadow-md"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                            Cambiar Rol
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Modal de cambio de rol */}
      {mostrarModal && usuarioSeleccionado && (
        <CambiarRolModal
          usuario={usuarioSeleccionado}
          roles={tipos}
          onConfirmar={confirmarCambioRol}
          onCancelar={cancelarCambioRol}
        />
      )}
    </div>
  );
}
