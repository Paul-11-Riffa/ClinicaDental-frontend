// src/pages/DetalleCombo.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams, Navigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import TopBar from "../components/TopBar";
import { toast, Toaster } from "react-hot-toast";
import {
  obtenerComboDetalleCompleto,
  eliminarCombo,
  toggleComboActivo,
} from "../services/combosService";
import type { Combo } from "../interfaces/Combo";

export default function DetalleCombo() {
  const { isAuth, user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [combo, setCombo] = useState<Combo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      cargarCombo(parseInt(id));
    }
  }, [id]);

  const cargarCombo = async (comboId: number) => {
    setLoading(true);
    try {
      const data = await obtenerComboDetalleCompleto(comboId);
      setCombo(data);
    } catch (error: any) {
      console.error("Error al cargar combo:", error);
      toast.error(
        error?.response?.data?.detail || "Error al cargar el combo"
      );
      navigate("/combos");
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarCombo = async () => {
    if (!combo) return;

    if (
      !window.confirm(
        `¿Está seguro de que desea eliminar el combo "${combo.nombre}"? Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }

    try {
      await eliminarCombo(combo.id);
      toast.success("Combo eliminado exitosamente");
      navigate("/combos");
    } catch (error: any) {
      console.error("Error al eliminar combo:", error);
      toast.error(
        error?.response?.data?.detail || "Error al eliminar el combo"
      );
    }
  };

  const handleToggleActivo = async () => {
    if (!combo) return;

    try {
      const response = await toggleComboActivo(combo.id, combo.activo);
      toast.success(
        response.mensaje ||
          `Combo ${combo.activo ? "desactivado" : "activado"} exitosamente`
      );
      cargarCombo(combo.id);
    } catch (error: any) {
      console.error("Error al cambiar estado del combo:", error);
      toast.error(
        error?.response?.data?.detail || "Error al cambiar el estado del combo"
      );
    }
  };

  const getTipoPrecioLabel = (tipo: string) => {
    switch (tipo) {
      case "PORCENTAJE":
        return "📊 Descuento Porcentual";
      case "MONTO_FIJO":
        return "💵 Precio Fijo";
      case "PROMOCION":
        return "⭐ Precio Promocional";
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

  // Mostrar loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Toaster position="top-right" />
        <TopBar />
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  // Si no se encontró el combo
  if (!combo) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Toaster position="top-right" />
        <TopBar />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">❌</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Combo no encontrado
            </h3>
            <p className="text-gray-500 mb-6">
              El combo que buscas no existe o fue eliminado
            </p>
            <Link
              to="/combos"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
            >
              ← Volver a la lista
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      <TopBar />

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm">
          <Link to="/combos" className="text-blue-600 hover:text-blue-800">
            Combos
          </Link>
          <span className="mx-2 text-gray-500">/</span>
          <span className="text-gray-700">{combo.nombre}</span>
        </nav>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between">
            <div className="flex-1 mb-4 md:mb-0">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-800">
                  📦 {combo.nombre}
                </h1>
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
                <p className="text-gray-600 text-lg">{combo.descripcion}</p>
              )}
            </div>

            {/* Acciones */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => navigate(`/combos/${combo.id}/editar`)}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition font-medium"
              >
                ✏️ Editar
              </button>
              <button
                onClick={handleToggleActivo}
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
                  onClick={handleEliminarCombo}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                >
                  🗑️ Eliminar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Información de Precios */}
        <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            💰 Información de Precios
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-1">Tipo de Precio</p>
                <p className="text-lg font-semibold text-gray-800">
                  {getTipoPrecioLabel(combo.tipo_precio)}
                </p>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-1">Valor</p>
                <p className="text-2xl font-bold text-blue-600">
                  {combo.tipo_precio === "PORCENTAJE"
                    ? `${parseFloat(combo.valor_precio || "0").toFixed(0)}% de descuento`
                    : `$${parseFloat(combo.valor_precio || "0").toFixed(2)}`}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">
                  Precio sin combo (suma de servicios)
                </p>
                <p className="text-xl font-semibold text-gray-700 line-through">
                  ${parseFloat(combo.precio_total_servicios || "0").toFixed(2)}
                </p>
              </div>
            </div>

            <div className="flex flex-col justify-center items-center bg-white rounded-lg p-6 shadow">
              <p className="text-sm text-gray-600 mb-2">Precio Final del Combo</p>
              <p className="text-4xl font-bold text-green-600 mb-3">
                ${parseFloat(combo.precio_final || "0").toFixed(2)} ✨
              </p>
              <div className="text-center">
                <p className="text-lg font-semibold text-blue-600 mb-1">
                  Cliente Ahorra
                </p>
                <p className="text-3xl font-bold text-blue-600">
                  💰 ${parseFloat(combo.ahorro || "0").toFixed(2)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  (
                  {combo.precio_total_servicios && parseFloat(combo.precio_total_servicios) > 0
                    ? (
                        (parseFloat(combo.ahorro || "0") /
                          parseFloat(combo.precio_total_servicios)) *
                        100
                      ).toFixed(1)
                    : "0"}
                  % de descuento)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Servicios Incluidos */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            📦 Servicios Incluidos ({combo.cantidad_servicios})
          </h2>

          {combo.detalles && combo.detalles.length > 0 ? (
            <div className="space-y-4">
              {combo.detalles.map((detalle, index) => (
                <div
                  key={detalle.id}
                  className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                    {index + 1}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          {detalle.servicio.nombre}
                        </h3>
                        {detalle.servicio.descripcion && (
                          <p className="text-sm text-gray-600">
                            {detalle.servicio.descripcion}
                          </p>
                        )}
                      </div>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          detalle.servicio.activo
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {detalle.servicio.activo ? "Activo" : "Inactivo"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Precio Unitario</p>
                        <p className="font-semibold text-gray-800">
                          ${parseFloat(detalle.servicio.precio || "0").toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Cantidad</p>
                        <p className="font-semibold text-gray-800">
                          ×{detalle.cantidad || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Subtotal</p>
                        <p className="font-semibold text-green-600">
                          ${parseFloat(detalle.subtotal || "0").toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Duración</p>
                        <p className="font-semibold text-gray-800">
                          ⏱️ {detalle.servicio.duracion_minutos || 0} min
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Total */}
              <div className="border-t-2 border-gray-300 pt-4 mt-4">
                <div className="flex justify-between items-center text-lg">
                  <span className="font-semibold text-gray-700">
                    Duración Total:
                  </span>
                  <span className="font-bold text-blue-600">
                    ⏱️ {combo.duracion_total || 0} minutos
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              No hay servicios incluidos en este combo
            </p>
          )}
        </div>

        {/* Información Adicional */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            📅 Información Adicional
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 mb-1">Fecha de Creación</p>
              <p className="font-semibold text-gray-800">
                {new Date(combo.fecha_creacion).toLocaleString("es-ES", {
                  dateStyle: "long",
                  timeStyle: "short",
                })}
              </p>
            </div>

            <div>
              <p className="text-gray-500 mb-1">Última Actualización</p>
              <p className="font-semibold text-gray-800">
                {new Date(combo.fecha_actualizacion).toLocaleString("es-ES", {
                  dateStyle: "long",
                  timeStyle: "short",
                })}
              </p>
            </div>

            <div>
              <p className="text-gray-500 mb-1">ID del Combo</p>
              <p className="font-semibold text-gray-800 font-mono">
                #{combo.id}
              </p>
            </div>

            <div>
              <p className="text-gray-500 mb-1">Estado</p>
              <p className="font-semibold text-gray-800">
                {combo.activo
                  ? "🟢 Disponible para agendar"
                  : "🔴 No disponible para agendar"}
              </p>
            </div>
          </div>
        </div>

        {/* Botones de navegación */}
        <div className="mt-8 flex justify-between">
          <Link
            to="/combos"
            className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition font-semibold"
          >
            ← Volver a la lista
          </Link>

          <button
            onClick={() => navigate(`/combos/${combo.id}/editar`)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            ✏️ Editar Combo
          </button>
        </div>
      </div>
    </div>
  );
}
