// src/pages/CrearUsuario.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, Toaster } from "react-hot-toast";
import TopBar from "../components/TopBar";
import { useAuth } from "../context/AuthContext";
import {
  obtenerTiposUsuario,
  obtenerCamposRequeridos,
  crearUsuario,
  validarDatosUsuario,
  type TipoUsuario,
  type EstructuraCampos,
  type CampoInfo,
} from "../services/CrearUsuario";

const ICONOS_ROL: Record<number, string> = {
  1: "⚙️",
  2: "👤",
  3: "👨‍⚕️",
  4: "📋",
};

const COLORES_ROL: Record<number, string> = {
  1: "from-purple-500 to-purple-700",
  2: "from-blue-500 to-blue-700",
  3: "from-green-500 to-green-700",
  4: "from-amber-500 to-amber-700",
};

export default function CrearUsuario() {
  const { user, isAuth, loading } = useAuth();
  const navigate = useNavigate();

  const [tiposUsuario, setTiposUsuario] = useState<TipoUsuario[]>([]);
  const [tipoSeleccionado, setTipoSeleccionado] = useState<number | null>(null);
  const [estructuraCampos, setEstructuraCampos] = useState<EstructuraCampos | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loadingForm, setLoadingForm] = useState(false);
  const [loadingCampos, setLoadingCampos] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verificar si es admin
  type CurrentUser =
    | { idtipousuario?: number; usuario?: { idtipousuario?: number } }
    | null
    | undefined;

  const idTipoUsuarioActual =
    ((user as CurrentUser)?.idtipousuario ??
      (user as CurrentUser)?.usuario?.idtipousuario ??
      0) || 0;

  const isAdmin = idTipoUsuarioActual === 1;

  // Cargar tipos de usuario
  useEffect(() => {
    if (isAuth && isAdmin) {
      cargarTiposUsuario();
    }
  }, [isAuth, isAdmin]);

  // Cargar campos cuando se selecciona un tipo
  useEffect(() => {
    if (tipoSeleccionado) {
      cargarCamposRequeridos(tipoSeleccionado);
    }
  }, [tipoSeleccionado]);

  const cargarTiposUsuario = async () => {
    try {
      const tipos = await obtenerTiposUsuario();
      setTiposUsuario(tipos);
    } catch (e) {
      const mensaje = e instanceof Error ? e.message : "Error al cargar tipos de usuario";
      toast.error(mensaje);
    }
  };

  const cargarCamposRequeridos = async (tipo: number) => {
    setLoadingCampos(true);
    setError(null);
    try {
      const estructura = await obtenerCamposRequeridos(tipo);
      setEstructuraCampos(estructura);
      setFormData({});
    } catch (e) {
      const mensaje = e instanceof Error ? e.message : "Error al cargar campos";
      setError(mensaje);
      toast.error(mensaje);
    } finally {
      setLoadingCampos(false);
    }
  };

  const handleChange = (campo: string, valor: any) => {
    setFormData(prev => ({ ...prev, [campo]: valor }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tipoSeleccionado || !estructuraCampos) return;

    // Validación local
    const { valido, errores } = validarDatosUsuario(formData, estructuraCampos);
    if (!valido) {
      setError(errores.join('\n'));
      toast.error("Por favor, corrija los errores en el formulario");
      return;
    }

    const toastId = toast.loading("Creando usuario...");
    setLoadingForm(true);

    try {
      const respuesta = await crearUsuario(tipoSeleccionado, formData);

      toast.success(
        `${ICONOS_ROL[tipoSeleccionado]} ${respuesta.mensaje}\n✓ Usuario creado con código #${respuesta.usuario.codigo}`,
        {
          id: toastId,
          duration: 5000,
        }
      );

      // Reset form
      setFormData({});
      setTipoSeleccionado(null);
      setEstructuraCampos(null);

      // Opcional: navegar a lista de usuarios después de 2 segundos
      setTimeout(() => {
        navigate("/usuarios");
      }, 2000);
    } catch (e) {
      const mensaje = e instanceof Error ? e.message : "Error al crear usuario";
      setError(mensaje);
      toast.error(mensaje, { id: toastId, duration: 6000 });
    } finally {
      setLoadingForm(false);
    }
  };

  const renderCampo = (nombre: string, info: CampoInfo) => {
    const valor = formData[nombre] || "";

    const inputClasses = "w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-cyan-500 focus:outline-none transition-colors";

    switch (info.tipo) {
      case "email":
        return (
          <input
            type="email"
            value={valor}
            onChange={(e) => handleChange(nombre, e.target.value)}
            required={info.requerido}
            maxLength={info.max_length}
            placeholder={info.descripcion}
            className={inputClasses}
          />
        );

      case "date":
        return (
          <input
            type="date"
            value={valor}
            onChange={(e) => handleChange(nombre, e.target.value)}
            required={info.requerido}
            className={inputClasses}
          />
        );

      case "boolean":
        return (
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={valor || false}
              onChange={(e) => handleChange(nombre, e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
            />
            <span className="text-sm text-gray-700">{info.descripcion}</span>
          </label>
        );

      case "text":
        return (
          <textarea
            value={valor}
            onChange={(e) => handleChange(nombre, e.target.value)}
            required={info.requerido}
            placeholder={info.descripcion}
            className={inputClasses}
            rows={3}
          />
        );

      default:
        if (info.opciones) {
          return (
            <select
              value={valor}
              onChange={(e) => handleChange(nombre, e.target.value)}
              required={info.requerido}
              className={inputClasses}
            >
              <option value="">Seleccione...</option>
              {info.opciones.map((opcion) => (
                <option key={opcion} value={opcion}>
                  {opcion}
                </option>
              ))}
            </select>
          );
        }

        return (
          <input
            type="text"
            value={valor}
            onChange={(e) => handleChange(nombre, e.target.value)}
            required={info.requerido}
            maxLength={info.max_length}
            placeholder={info.descripcion}
            className={inputClasses}
          />
        );
    }
  };

  if (!isAuth && !loading) {
    navigate("/login");
    return null;
  }

  if (!loading && isAuth && !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopBar />
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-red-50 border-l-4 border-red-500 rounded-r-lg p-4">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <h1 className="text-xl font-semibold text-red-900">Acceso Restringido</h1>
                <p className="text-red-700 mt-1">
                  Solo los administradores pueden crear nuevos usuarios.
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
            background: "#fff",
            color: "#374151",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
            borderRadius: "12px",
            padding: "16px",
            fontSize: "14px",
          },
        }}
      />

      <TopBar />

      <main className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Crear Nuevo Usuario</h2>
              <p className="text-gray-600 text-sm">
                Agregue un nuevo usuario al sistema con un rol específico
              </p>
            </div>
          </div>
        </header>

        {/* Selector de tipo de usuario */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            1. Seleccione el tipo de usuario a crear:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {tiposUsuario.map((tipo) => (
              <button
                key={tipo.id}
                type="button"
                onClick={() => setTipoSeleccionado(tipo.id)}
                className={`
                  relative p-4 rounded-xl border-2 transition-all
                  ${
                    tipoSeleccionado === tipo.id
                      ? `border-transparent bg-gradient-to-br ${COLORES_ROL[tipo.id]} text-white shadow-lg scale-105`
                      : "border-gray-200 bg-white text-gray-700 hover:border-cyan-300 hover:shadow-md"
                  }
                `}
              >
                <div className="text-3xl mb-2">{ICONOS_ROL[tipo.id]}</div>
                <div className="font-semibold">{tipo.nombre}</div>
                {tipoSeleccionado === tipo.id && (
                  <div className="absolute top-2 right-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Formulario dinámico */}
        {loadingCampos && (
          <div className="bg-white rounded-xl border border-cyan-100 p-12 text-center">
            <div className="inline-block w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600">Cargando formulario...</p>
          </div>
        )}

        {estructuraCampos && !loadingCampos && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-xl border border-cyan-100 shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center text-sm font-bold">
                  2
                </span>
                Complete la información general
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(estructuraCampos.campos_base).map(([nombre, info]) => (
                  <div key={nombre} className={info.tipo === "text" ? "md:col-span-2" : ""}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {nombre.charAt(0).toUpperCase() + nombre.slice(1)}
                      {info.requerido && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {renderCampo(nombre, info)}
                    {info.descripcion && info.tipo !== "boolean" && (
                      <p className="mt-1 text-xs text-gray-500">{info.descripcion}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Campos adicionales */}
            {Object.keys(estructuraCampos.campos_adicionales).length > 0 && (
              <div className="bg-white rounded-xl border border-cyan-100 shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center text-sm font-bold">
                    3
                  </span>
                  Información específica de {estructuraCampos.nombre_tipo}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(estructuraCampos.campos_adicionales).map(([nombre, info]) => (
                    <div key={nombre} className={info.tipo === "text" ? "md:col-span-2" : ""}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {nombre.charAt(0).toUpperCase() + nombre.slice(1)}
                        {info.requerido && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {renderCampo(nombre, info)}
                      {info.descripcion && info.tipo !== "boolean" && (
                        <p className="mt-1 text-xs text-gray-500">{info.descripcion}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 rounded-r-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <p className="font-semibold text-red-900">Error al crear usuario</p>
                    <pre className="text-sm text-red-700 mt-1 whitespace-pre-wrap">{error}</pre>
                  </div>
                </div>
              </div>
            )}

            {/* Botones */}
            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => {
                  setFormData({});
                  setTipoSeleccionado(null);
                  setEstructuraCampos(null);
                  setError(null);
                }}
                disabled={loadingForm}
                className="flex-1 px-6 py-3 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loadingForm}
                className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold hover:from-cyan-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
              >
                {loadingForm ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Creando usuario...
                  </span>
                ) : (
                  `✓ Crear ${estructuraCampos.nombre_tipo}`
                )}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
