// src/pages/ListarCombos.tsx
import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import TopBar from "../components/TopBar";
import { toast, Toaster } from "react-hot-toast";
import {
  obtenerCombos,
  eliminarCombo,
  toggleComboActivo,
} from "../services/combosService";
import type { ComboListado, FiltrosCombos } from "../interfaces/Combo";

export default function ListarCombos() {
  const { isAuth, user } = useAuth();
  const navigate = useNavigate();
  const [combos, setCombos] = useState<ComboListado[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState<FiltrosCombos>({
    page: 1,
    page_size: 10,
  });
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  // Cargar combos
  useEffect(() => {
    cargarCombos();
  }, [filtros]);

  const cargarCombos = async () => {
    setLoading(true);
    try {
      const response = await obtenerCombos(filtros);
      setCombos(response.results);
      setTotalCount(response.count);
      setTotalPages(Math.ceil(response.count / (filtros.page_size || 10)));
    } catch (error: any) {
      console.error("Error al cargar combos:", error);
      toast.error(
        error?.response?.data?.detail || "Error al cargar los combos"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarCombo = async (comboId: number) => {
    if (
      !window.confirm(
        "¿Está seguro de que desea eliminar este combo? Esta acción no se puede deshacer."
      )
    ) {
      return;
    }

    try {
      await eliminarCombo(comboId);
      toast.success("Combo eliminado exitosamente");
      cargarCombos();
    } catch (error: any) {
      console.error("Error al eliminar combo:", error);
      toast.error(
        error?.response?.data?.detail || "Error al eliminar el combo"
      );
    }
  };

  const handleToggleActivo = async (comboId: number, activo: boolean) => {
    try {
      const response = await toggleComboActivo(comboId, activo);
      toast.success(response.mensaje || `Combo ${activo ? "desactivado" : "activado"} exitosamente`);
      cargarCombos();
    } catch (error: any) {
      console.error("Error al cambiar estado del combo:", error);
      toast.error(
        error?.response?.data?.detail || "Error al cambiar el estado del combo"
      );
    }
  };

  const handleFiltroChange = (
    campo: keyof FiltrosCombos,
    valor: any
  ) => {
    setFiltros((prev) => ({
      ...prev,
      [campo]: valor,
      page: 1, // Reset a página 1 cuando cambian filtros
    }));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleFiltroChange("search", searchTerm);
  };

  const handlePageChange = (newPage: number) => {
    setFiltros((prev) => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getTipoPrecioLabel = (tipo: string) => {
    switch (tipo) {
      case "PORCENTAJE":
        return "📊 Descuento";
      case "MONTO_FIJO":
        return "💵 Precio Fijo";
      case "PROMOCION":
        return "⭐ Promoción";
      default:
        return tipo;
    }
  };

  // Verificar autenticación
  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  // Verificar roles permitidos
  const rolesPermitidos = ["administrador", "odontologo", "recepcionista"];
  if (user && !rolesPermitidos.includes(user.subtipo)) {
    toast.error("No tienes permisos para acceder a esta sección");
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      <TopBar />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              🎁 Combos de Servicios
            </h1>
            <p className="text-gray-600 mt-2">
              Gestiona los paquetes y combos de servicios dentales
            </p>
          </div>
          <Link
            to="/combos/nuevo"
            className="mt-4 md:mt-0 inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition shadow-lg"
          >
            <span className="mr-2">➕</span>
            Crear Nuevo Combo
          </Link>
        </div>

        {/* Filtros y búsqueda */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Búsqueda */}
            <form onSubmit={handleSearchSubmit} className="md:col-span-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="🔍 Buscar por nombre o descripción..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                >
                  Buscar
                </button>
              </div>
            </form>

            {/* Filtro por estado */}
            <select
              value={filtros.activo?.toString() || ""}
              onChange={(e) =>
                handleFiltroChange(
                  "activo",
                  e.target.value === "" ? undefined : e.target.value === "true"
                )
              }
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos los estados</option>
              <option value="true">🟢 Solo Activos</option>
              <option value="false">🔴 Solo Inactivos</option>
            </select>
          </div>

          {/* Botón limpiar filtros */}
          {(filtros.search || filtros.activo !== undefined) && (
            <button
              onClick={() => {
                setSearchTerm("");
                setFiltros({ page: 1, page_size: 10 });
              }}
              className="mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              🔄 Limpiar filtros
            </button>
          )}
        </div>

        {/* Contador de resultados */}
        <div className="mb-4 text-gray-600">
          Mostrando {combos.length} de {totalCount} combos
        </div>

        {/* Lista de combos */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : combos.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No hay combos disponibles
            </h3>
            <p className="text-gray-500 mb-6">
              {filtros.search
                ? "No se encontraron combos con los filtros aplicados"
                : "Comienza creando tu primer combo de servicios"}
            </p>
            {!filtros.search && (
              <Link
                to="/combos/nuevo"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
              >
                <span className="mr-2">➕</span>
                Crear Primer Combo
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-6">
            {combos.map((combo) => (
              <div
                key={combo.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
              >
                {/* Header del combo */}
                <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-800">
                        📦 {combo.nombre}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          combo.activo
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {combo.activo ? "🟢 Activo" : "🔴 Inactivo"}
                      </span>
                    </div>
                    {combo.descripcion && (
                      <p className="text-gray-600">{combo.descripcion}</p>
                    )}
                  </div>
                </div>

                {/* Información del precio */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Precio Final</p>
                    <p className="text-2xl font-bold text-green-600">
                      ${parseFloat(combo.precio_final || "0").toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">
                      {getTipoPrecioLabel(combo.tipo_precio)}
                    </p>
                    <p className="text-lg font-semibold text-gray-700">
                      {combo.tipo_precio === "PORCENTAJE"
                        ? `${parseFloat(combo.valor_precio || "0").toFixed(0)}%`
                        : `$${parseFloat(combo.valor_precio || "0").toFixed(2)}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Cliente Ahorra</p>
                    <p className="text-lg font-semibold text-blue-600">
                      💰 ${parseFloat(combo.ahorro || "0").toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Duración Total</p>
                    <p className="text-lg font-semibold text-gray-700">
                      ⏱️ {combo.duracion_total || 0} min
                    </p>
                  </div>
                </div>

                {/* Metadatos */}
                <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                  <span className="flex items-center gap-1">
                    📋 {combo.cantidad_servicios || 0}{" "}
                    {combo.cantidad_servicios === 1 ? "servicio" : "servicios"}
                  </span>
                  <span className="flex items-center gap-1">
                    💵 Precio sin combo: $
                    {parseFloat(combo.precio_total_servicios || "0").toFixed(2)}
                  </span>
                  <span className="flex items-center gap-1">
                    📅 Creado:{" "}
                    {new Date(combo.fecha_creacion).toLocaleDateString("es-ES")}
                  </span>
                </div>

                {/* Acciones */}
                <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => navigate(`/combos/${combo.id}`)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                  >
                    👁️ Ver Detalle
                  </button>
                  <button
                    onClick={() => navigate(`/combos/${combo.id}/editar`)}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition font-medium"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => handleToggleActivo(combo.id, combo.activo)}
                    className={`px-4 py-2 rounded-lg transition font-medium ${
                      combo.activo
                        ? "bg-gray-500 text-white hover:bg-gray-600"
                        : "bg-green-500 text-white hover:bg-green-600"
                    }`}
                  >
                    {combo.activo ? "⛔ Desactivar" : "✅ Activar"}
                  </button>
                  {user?.subtipo === "administrador" && (
                    <button
                      onClick={() => handleEliminarCombo(combo.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                    >
                      🗑️ Eliminar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center items-center gap-2">
            <button
              onClick={() => handlePageChange(filtros.page! - 1)}
              disabled={filtros.page === 1}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              ← Anterior
            </button>

            <div className="flex gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => {
                  // Mostrar solo algunas páginas
                  if (
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(page - (filtros.page || 1)) <= 2
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-4 py-2 rounded-lg font-medium ${
                          page === filtros.page
                            ? "bg-blue-600 text-white"
                            : "bg-white border border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  } else if (
                    page === (filtros.page || 1) - 3 ||
                    page === (filtros.page || 1) + 3
                  ) {
                    return (
                      <span key={page} className="px-2 py-2">
                        ...
                      </span>
                    );
                  }
                  return null;
                }
              )}
            </div>

            <button
              onClick={() => handlePageChange(filtros.page! + 1)}
              disabled={filtros.page === totalPages}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
