// src/pages/GestionRoles.tsx
import { useEffect, useMemo, useState } from "react";
import TopBar from "../components/TopBar";
import {
  buscarUsuarios,
  listarTiposUsuario,
  cambiarRolPorCodigo,
} from "../services/Usuarios";
import type { TipoUsuario, Usuario } from "../services/Usuarios";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

export default function GestionRoles() {
  const { user, isAuth, loading } = useAuth();

  // filtros y datos
  const [query, setQuery] = useState<string>("");
  const [tipos, setTipos] = useState<TipoUsuario[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loadingList, setLoadingList] = useState<boolean>(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        setError("No se pudo cargar la lista de usuarios/roles.");
      } finally {
        if (alive) setLoadingList(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [query]);

  // acción: cambiar rol
  async function onChangeRol(codigoUsuario: number, nuevoIdTipo: number) {
    try {
      setSaving(codigoUsuario);
      setError(null);
      await cambiarRolPorCodigo(codigoUsuario, nuevoIdTipo);
      // reflejar en UI
      setUsuarios((prev) =>
        prev.map((u) =>
          u.codigo === codigoUsuario ? { ...u, idtipousuario: nuevoIdTipo } : u
        )
      );
    } catch (e) {
      setError("No se pudo actualizar el rol.");
    } finally {
      setSaving(null);
    }
  }

  // opciones de select
  const opcionesRol = useMemo(
    () =>
      tipos.map((t) => ({
        value: t.identificacion,
        label: t.rol,
      })),
    [tipos]
  );

  // si no está autenticado
  if (!isAuth && !loading) return <Navigate to="/login" replace />;

  // si no es admin, bloquea
  if (!loading && isAuth && !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopBar />
        <div className="max-w-4xl mx-auto p-6">
          <h1 className="text-xl font-semibold text-gray-900">
            Acceso restringido
          </h1>
          <p className="text-gray-600">
            Solo los administradores pueden gestionar roles.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-white">
      <TopBar />

      <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <header className="mb-6 sm:mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Gestionar Roles</h2>
          <p className="text-gray-600">
            Busca usuarios y cambia su rol en el sistema.
          </p>
        </header>

        {/* Buscador */}
        <div className="mb-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full sm:w-96 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            placeholder="Buscar por nombre, apellido o correo…"
          />
        </div>

        {/* Estados */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        {loadingList ? (
          <div className="text-gray-600">Cargando usuarios…</div>
        ) : usuarios.length === 0 ? (
          <div className="text-gray-600">No hay usuarios para mostrar.</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-cyan-100 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-cyan-50 text-cyan-900">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Código</th>
                  <th className="px-4 py-3 text-left font-semibold">Nombre</th>
                  <th className="px-4 py-3 text-left font-semibold">Apellido</th>
                  <th className="px-4 py-3 text-left font-semibold">Correo</th>
                  <th className="px-4 py-3 text-left font-semibold">Rol</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => {
                  return (
                    <tr key={u.codigo} className="border-t">
                      <td className="px-4 py-3">{u.codigo}</td>
                      <td className="px-4 py-3">{u.nombre}</td>
                      <td className="px-4 py-3">{u.apellido}</td>
                      <td className="px-4 py-3">{u.correoelectronico}</td>
                      <td className="px-4 py-3">
                        <select
                          className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          value={u.idtipousuario}
                          onChange={(e) =>
                            onChangeRol(u.codigo, Number(e.target.value))
                          }
                          disabled={saving === u.codigo}
                        >
                          {opcionesRol.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        {saving === u.codigo && (
                          <span className="ml-2 text-xs text-gray-500">
                            Guardando…
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
