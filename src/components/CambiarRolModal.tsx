// src/components/CambiarRolModal.tsx
import { useState } from "react";
import type { Usuario, TipoUsuario } from "../services/Usuarios";

type Props = {
  usuario: Usuario;
  roles: TipoUsuario[];
  onConfirmar: (nuevoRolId: number) => Promise<void>;
  onCancelar: () => void;
};

const ROLES_INFO: Record<number, { nombre: string; descripcion: string; badge: string }> = {
  1: { nombre: "Administrador", descripcion: "Acceso completo al sistema", badge: "bg-purple-100 text-purple-700" },
  2: { nombre: "Paciente", descripcion: "Usuario que recibe atención", badge: "bg-blue-100 text-blue-700" },
  3: { nombre: "Odontólogo", descripcion: "Profesional de la salud dental", badge: "bg-green-100 text-green-700" },
  4: { nombre: "Recepcionista", descripcion: "Personal administrativo", badge: "bg-amber-100 text-amber-700" },
};

export default function CambiarRolModal({ usuario, roles, onConfirmar, onCancelar }: Props) {
  const [nuevoRol, setNuevoRol] = useState<number>(usuario.idtipousuario);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getRolInfo = (rolId: number) => {
    return ROLES_INFO[rolId] || { nombre: "Desconocido", descripcion: "", badge: "bg-gray-100 text-gray-700" };
  };

  const rolActualInfo = getRolInfo(usuario.idtipousuario);
  const nuevoRolInfo = getRolInfo(nuevoRol);
  const hayCambio = nuevoRol !== usuario.idtipousuario;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hayCambio) {
      setError("El rol seleccionado es el mismo que el actual");
      return;
    }

    // Confirmación adicional para cambios críticos
    const confirmar = window.confirm(
      `✅ CONFIRMACIÓN FINAL\n\n` +
      `¿Confirma el cambio de rol para ${usuario.nombre} ${usuario.apellido}?\n\n` +
      `Rol actual: ${rolActualInfo.nombre}\n` +
      `Nuevo rol: ${nuevoRolInfo.nombre}\n\n` +
      `✓ El historial completo del usuario se mantendrá intacto.\n` +
      `✓ Las consultas, citas y datos se preservarán automáticamente.\n\n` +
      `¿Desea continuar?`
    );

    if (!confirmar) return;

    setLoading(true);
    setError(null);

    try {
      await onConfirmar(nuevoRol);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cambiar el rol");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-4 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold">⚠️ Confirmar Cambio de Rol</h3>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {/* Información del usuario */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-cyan-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">Usuario seleccionado</p>
                <p className="text-lg font-bold text-gray-900">{usuario.nombre} {usuario.apellido}</p>
                <p className="text-sm text-gray-600">{usuario.correoelectronico}</p>
                <p className="text-xs text-gray-500 mt-1">Código: #{usuario.codigo}</p>
              </div>
            </div>
          </div>

          {/* Rol actual */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Rol Actual
            </label>
            <div className={`px-4 py-3 rounded-lg border-2 ${rolActualInfo.badge} border-current`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold">{rolActualInfo.nombre}</p>
                  <p className="text-sm opacity-80">{rolActualInfo.descripcion}</p>
                </div>
                <span className="text-2xl">👤</span>
              </div>
            </div>
          </div>

          {/* Selector de nuevo rol */}
          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nuevo Rol <span className="text-red-500">*</span>
              </label>
              <select
                value={nuevoRol}
                onChange={(e) => {
                  setNuevoRol(Number(e.target.value));
                  setError(null);
                }}
                disabled={loading}
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-cyan-500 focus:outline-none text-gray-900 font-medium disabled:opacity-50"
              >
                {roles.map((rol) => {
                  const info = getRolInfo(rol.identificacion);
                  return (
                    <option key={rol.identificacion} value={rol.identificacion}>
                      {info.nombre} - {info.descripcion}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Vista previa del nuevo rol */}
            {hayCambio && (
              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Vista Previa del Cambio
                </label>
                <div className={`px-4 py-3 rounded-lg border-2 ${nuevoRolInfo.badge} border-current`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold">{nuevoRolInfo.nombre}</p>
                      <p className="text-sm opacity-80">{nuevoRolInfo.descripcion}</p>
                    </div>
                    <span className="text-2xl">✨</span>
                  </div>
                </div>
              </div>
            )}

            {/* Advertencia */}
            {hayCambio && (
              <div className="mb-5 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-bold text-blue-900 mb-2">ℹ️ Información del Cambio de Rol</p>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600">✅</span>
                        <span>El cambio se aplicará <strong>inmediatamente</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600">✅</span>
                        <span><strong>Todo el historial</strong> del usuario se mantendrá intacto (consultas, citas, planes)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600">✅</span>
                        <span>El usuario mantendrá su información personal y correo electrónico</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600">✅</span>
                        <span>Se crearán automáticamente los registros necesarios para el rol de {nuevoRolInfo.nombre}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600">ℹ️</span>
                        <span>El perfil anterior se preservará para mantener referencias históricas</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={onCancelar}
                disabled={loading}
                className="flex-1 px-6 py-3 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !hayCambio}
                className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold hover:from-cyan-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Guardando cambio...
                  </span>
                ) : (
                  "✓ Confirmar y Cambiar Rol"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
