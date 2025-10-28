import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { obtenerSesionesPorPlan } from "../services/sesionesTratamientoService";
import type { SesionesPorPlan, ItemConSesiones } from "../interfaces/SesionTratamiento";
import BarraProgresoItem from "../components/sesiones/BarraProgresoItem";
import CardSesion from "../components/sesiones/CardSesion";

/**
 * Página para listar todas las sesiones de un plan de tratamiento
 * Muestra las sesiones agrupadas por ítem con información de progreso
 */
const ListarSesionesPlan: React.FC = () => {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();

  const [datos, setDatos] = useState<SesionesPorPlan | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [itemExpandido, setItemExpandido] = useState<number | null>(null);

  useEffect(() => {
    cargarSesiones();
  }, [planId]);

  const cargarSesiones = async () => {
    if (!planId) {
      setError("ID de plan no proporcionado");
      setCargando(false);
      return;
    }

    try {
      setCargando(true);
      setError(null);
      const resultado = await obtenerSesionesPorPlan(parseInt(planId));
      setDatos(resultado);
    } catch (err: any) {
      console.error("Error al cargar sesiones:", err);
      setError(err.message || "Error al cargar las sesiones del plan");
    } finally {
      setCargando(false);
    }
  };

  const toggleItem = (itemId: number) => {
    setItemExpandido(itemExpandido === itemId ? null : itemId);
  };

  const handleRegistrarNueva = () => {
    navigate(`/planes/${planId}/registrar-sesion`);
  };

  const handleEditar = (sesionId: number) => {
    navigate(`/sesiones/${sesionId}/editar`);
  };

  const handleEliminar = async (sesionId: number) => {
    if (!window.confirm("¿Está seguro de eliminar esta sesión?")) {
      return;
    }

    try {
      // Aquí se implementaría la eliminación
      // await eliminarSesion(sesionId);
      alert("Funcionalidad de eliminación por implementar");
      cargarSesiones(); // Recargar después de eliminar
    } catch (err: any) {
      alert(`Error al eliminar: ${err.message || "Error desconocido"}`);
    }
  };

  const formatearFecha = (fecha: string | null | undefined): string => {
    if (!fecha) {
      return "Fecha no disponible";
    }
    try {
      const [year, month, day] = fecha.split("-");
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error("Error al formatear fecha:", fecha, error);
      return fecha; // Retornar la fecha original si falla el formato
    }
  };

  const obtenerColorEstado = (estado: string): string => {
    switch (estado) {
      case "Completado":
        return "bg-green-100 text-green-800 border-green-300";
      case "Activo":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "Pendiente":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "Cancelado":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  if (cargando) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando sesiones...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800 font-semibold mb-2">❌ Error</p>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  if (!datos || datos.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800 font-semibold mb-2">ℹ️ Sin sesiones</p>
          <p className="text-yellow-600 mb-4">
            No hay sesiones registradas para este plan de tratamiento
          </p>
          <button
            onClick={handleRegistrarNueva}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            ➕ Registrar Primera Sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Sesiones del Plan de Tratamiento
            </h1>
            <p className="text-gray-600 mt-1">
              Plan #{planId} - {datos.items.length} ítem(s)
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              ← Volver
            </button>
            <button
              onClick={handleRegistrarNueva}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              ➕ Registrar Sesión
            </button>
          </div>
        </div>
      </div>

      {/* Lista de ítems con sesiones */}
      <div className="space-y-4">
        {datos.items.map((item: ItemConSesiones) => (
          <div
            key={item.item_id}
            className="bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden"
          >
            {/* Header del ítem (siempre visible) */}
            <div
              className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleItem(item.item_id)}
            >
              <div className="flex items-center justify-between">
                {/* Info del servicio */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {item.servicio}
                    </h3>
                    <span
                      className={`px-3 py-1 text-xs font-semibold border rounded-full ${obtenerColorEstado(
                        item.estado_item
                      )}`}
                    >
                      {item.estado_item}
                    </span>
                  </div>

                  {/* Barra de progreso */}
                  <div className="mb-2">
                    <BarraProgresoItem
                      progreso={item.progreso_actual}
                      mostrarPorcentaje={true}
                      altura="h-3"
                    />
                  </div>

                  {/* Estadísticas */}
                  <div className="flex gap-4 text-sm text-gray-600">
                    <span>📋 {item.total_sesiones} sesión(es)</span>
                    <span>
                      📅 Última: {formatearFecha(item.ultima_sesion_fecha)}
                    </span>
                    <span>📊 Progreso: {item.progreso_actual.toFixed(0)}%</span>
                  </div>
                </div>

                {/* Botón expandir/colapsar */}
                <div className="ml-4">
                  <button className="text-2xl text-gray-500 hover:text-gray-700">
                    {itemExpandido === item.item_id ? "▼" : "▶"}
                  </button>
                </div>
              </div>
            </div>

            {/* Lista de sesiones (expandible) */}
            {itemExpandido === item.item_id && (
              <div className="border-t border-gray-200 bg-gray-50 p-4">
                <h4 className="text-md font-semibold text-gray-700 mb-3">
                  Sesiones Registradas ({item.sesiones.length})
                </h4>

                {item.sesiones.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No hay sesiones registradas para este ítem
                  </p>
                ) : (
                  <div className="space-y-3">
                    {item.sesiones.map((sesion) => (
                      <CardSesion
                        key={sesion.id}
                        sesion={sesion}
                        onEditar={handleEditar}
                        onEliminar={handleEliminar}
                        mostrarAcciones={true}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer con resumen */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <div className="text-sm text-blue-800">
            <span className="font-semibold">Total:</span> {datos.items.length} ítem(s) •{" "}
            {datos.items.reduce((sum, item) => sum + item.total_sesiones, 0)} sesión(es)
            registrada(s)
          </div>
          <div className="text-sm text-blue-800">
            <span className="font-semibold">Completados:</span>{" "}
            {datos.items.filter((i) => i.estado_item === "Completado").length} de{" "}
            {datos.items.length}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListarSesionesPlan;
