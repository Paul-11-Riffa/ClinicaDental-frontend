// src/pages/CrearEditarCombo.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import TopBar from "../components/TopBar";
import { toast, Toaster } from "react-hot-toast";
import {
  crearCombo,
  actualizarCombo,
  obtenerComboDetalle,
  previsualizarCombo,
  validarCombo,
} from "../services/combosService";
import { obtenerServicios } from "../services/serviciosService";
import type {
  NuevoCombo,
  TipoPrecio,
  PreviewComboResponse,
  ComboDetalleInput,
} from "../interfaces/Combo";
import type { ServicioListado } from "../interfaces/Servicio";

interface ServicioSeleccionado extends ServicioListado {
  cantidad: number;
}

export default function CrearEditarCombo() {
  const { isAuth, user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const esEdicion = Boolean(id);

  // Estado del formulario
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tipoPrecio, setTipoPrecio] = useState<TipoPrecio>("PORCENTAJE");
  const [valorPrecio, setValorPrecio] = useState<string>("10");

  // Servicios
  const [serviciosDisponibles, setServiciosDisponibles] = useState<
    ServicioListado[]
  >([]);
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState<
    ServicioSeleccionado[]
  >([]);
  const [busquedaServicio, setBusquedaServicio] = useState("");

  // Preview y carga
  const [preview, setPreview] = useState<PreviewComboResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingServicios, setLoadingServicios] = useState(true);
  const [loadingCombo, setLoadingCombo] = useState(esEdicion);

  // Cargar servicios disponibles
  useEffect(() => {
    cargarServicios();
  }, []);

  // Cargar combo si es edición
  useEffect(() => {
    if (esEdicion && id) {
      cargarCombo(parseInt(id));
    }
  }, [id, esEdicion]);

  // Calcular preview cuando cambian los datos
  useEffect(() => {
    if (serviciosSeleccionados.length > 0) {
      calcularPreview();
    } else {
      setPreview(null);
    }
  }, [serviciosSeleccionados, tipoPrecio, valorPrecio]);

  const cargarServicios = async () => {
    setLoadingServicios(true);
    try {
      const response = await obtenerServicios({ activo: true, page_size: 100 });
      setServiciosDisponibles(response.results);
    } catch (error: any) {
      console.error("Error al cargar servicios:", error);
      toast.error("Error al cargar los servicios disponibles");
    } finally {
      setLoadingServicios(false);
    }
  };

  const cargarCombo = async (comboId: number) => {
    setLoadingCombo(true);
    try {
      const combo = await obtenerComboDetalle(comboId);

      setNombre(combo.nombre);
      setDescripcion(combo.descripcion || "");
      setTipoPrecio(combo.tipo_precio);
      setValorPrecio(combo.valor_precio);

      // Cargar servicios seleccionados
      if (combo.detalles) {
        const serviciosConCantidad: ServicioSeleccionado[] = combo.detalles.map(
          (detalle) => ({
            id: detalle.servicio.id,
            nombre: detalle.servicio.nombre,
            costobase: detalle.servicio.precio,
            precio_vigente: detalle.servicio.precio,
            duracion: detalle.servicio.duracion_minutos,
            activo: detalle.servicio.activo,
            cantidad: detalle.cantidad,
          })
        );
        setServiciosSeleccionados(serviciosConCantidad);
      }
    } catch (error: any) {
      console.error("Error al cargar combo:", error);
      toast.error("Error al cargar el combo");
      navigate("/combos");
    } finally {
      setLoadingCombo(false);
    }
  };

  const calcularPreview = async () => {
    try {
      const previewData = await previsualizarCombo({
        tipo_precio: tipoPrecio,
        valor_precio: valorPrecio,
        servicios: serviciosSeleccionados.map((s) => ({
          servicio_id: s.id,
          cantidad: s.cantidad,
        })),
      });
      setPreview(previewData);
    } catch (error) {
      console.error("Error al calcular preview:", error);
      // No mostrar error toast aquí para no molestar al usuario mientras escribe
    }
  };

  const agregarServicio = (servicio: ServicioListado) => {
    // Verificar si ya está agregado
    if (serviciosSeleccionados.find((s) => s.id === servicio.id)) {
      toast.error("Este servicio ya está agregado al combo");
      return;
    }

    setServiciosSeleccionados([
      ...serviciosSeleccionados,
      { ...servicio, cantidad: 1 },
    ]);
    setBusquedaServicio("");
  };

  const eliminarServicio = (servicioId: number) => {
    setServiciosSeleccionados(
      serviciosSeleccionados.filter((s) => s.id !== servicioId)
    );
  };

  const actualizarCantidad = (servicioId: number, cantidad: number) => {
    if (cantidad < 1) {
      toast.error("La cantidad debe ser mayor a 0");
      return;
    }

    setServiciosSeleccionados(
      serviciosSeleccionados.map((s) =>
        s.id === servicioId ? { ...s, cantidad } : s
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Preparar datos
    const comboData: NuevoCombo = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || undefined,
      tipo_precio: tipoPrecio,
      valor_precio: valorPrecio,
      activo: true,
      detalles: serviciosSeleccionados.map((s, index) => ({
        servicio: s.id,
        cantidad: s.cantidad,
        orden: index + 1,
      })),
    };

    // Validar
    const errores = validarCombo(comboData);
    if (errores.length > 0) {
      errores.forEach((error) => toast.error(error));
      return;
    }

    setLoading(true);
    try {
      if (esEdicion && id) {
        const response = await actualizarCombo(parseInt(id), comboData);
        toast.success(response.mensaje || "Combo actualizado exitosamente");
      } else {
        const response = await crearCombo(comboData);
        toast.success(response.mensaje || "Combo creado exitosamente");
      }
      navigate("/combos");
    } catch (error: any) {
      console.error("Error al guardar combo:", error);

      // Manejar errores del backend
      if (error?.response?.data) {
        const errorData = error.response.data;

        if (errorData.error) {
          toast.error(errorData.error);
        }

        if (errorData.detalles) {
          Object.entries(errorData.detalles).forEach(([field, messages]) => {
            if (Array.isArray(messages)) {
              messages.forEach((msg) => toast.error(`${field}: ${msg}`));
            }
          });
        }
      } else {
        toast.error("Error al guardar el combo");
      }
    } finally {
      setLoading(false);
    }
  };

  // Filtrar servicios disponibles
  const serviciosFiltrados = serviciosDisponibles
    .filter((s) => !serviciosSeleccionados.find((sel) => sel.id === s.id))
    .filter((s) =>
      busquedaServicio
        ? s.nombre.toLowerCase().includes(busquedaServicio.toLowerCase())
        : true
    );

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

  // Mostrar loading si está cargando el combo
  if (loadingCombo) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopBar />
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      <TopBar />

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            🎁 {esEdicion ? "Editar" : "Crear Nuevo"} Combo
          </h1>
          <p className="text-gray-600 mt-2">
            {esEdicion
              ? "Actualiza la información del combo"
              : "Crea un nuevo paquete de servicios con descuento"}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Información Básica */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              📋 Información Básica
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del combo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Paquete Limpieza Completa"
                  maxLength={200}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {nombre.length}/200 caracteres
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Describe brevemente qué incluye este combo"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Tipo de Precio */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              💰 Tipo de Precio
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selecciona el tipo de precio{" "}
                  <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    type="button"
                    onClick={() => setTipoPrecio("PORCENTAJE")}
                    className={`p-4 border-2 rounded-lg transition ${
                      tipoPrecio === "PORCENTAJE"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <div className="text-2xl mb-2">📊</div>
                    <div className="font-semibold">Descuento Porcentual</div>
                    <div className="text-sm text-gray-600">
                      Aplica un % de descuento
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTipoPrecio("MONTO_FIJO")}
                    className={`p-4 border-2 rounded-lg transition ${
                      tipoPrecio === "MONTO_FIJO"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <div className="text-2xl mb-2">💵</div>
                    <div className="font-semibold">Precio Fijo</div>
                    <div className="text-sm text-gray-600">
                      Define un precio total
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTipoPrecio("PROMOCION")}
                    className={`p-4 border-2 rounded-lg transition ${
                      tipoPrecio === "PROMOCION"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <div className="text-2xl mb-2">⭐</div>
                    <div className="font-semibold">Precio Promocional</div>
                    <div className="text-sm text-gray-600">
                      Precio especial de promo
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {tipoPrecio === "PORCENTAJE"
                    ? "Porcentaje de descuento"
                    : "Precio"}
                  <span className="text-red-500"> *</span>
                </label>
                <div className="relative w-64">
                  {tipoPrecio !== "PORCENTAJE" && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                      $
                    </span>
                  )}
                  <input
                    type="number"
                    value={valorPrecio}
                    onChange={(e) => setValorPrecio(e.target.value)}
                    min="0"
                    max={tipoPrecio === "PORCENTAJE" ? "100" : undefined}
                    step={tipoPrecio === "PORCENTAJE" ? "1" : "0.01"}
                    className={`w-full ${
                      tipoPrecio !== "PORCENTAJE" ? "pl-8" : "pl-4"
                    } pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                    required
                  />
                  {tipoPrecio === "PORCENTAJE" && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                      %
                    </span>
                  )}
                </div>

                {tipoPrecio === "PORCENTAJE" && (
                  <p className="text-sm text-gray-600 mt-2">
                    💡 Se aplicará un {valorPrecio}% de descuento sobre el
                    precio total de los servicios
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Servicios Incluidos */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              📦 Servicios Incluidos
            </h2>

            {/* Buscador de servicios */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar y agregar servicio{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={busquedaServicio}
                onChange={(e) => setBusquedaServicio(e.target.value)}
                placeholder="🔍 Buscar servicio por nombre..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-2"
              />

              {/* Lista desplegable de servicios filtrados */}
              {busquedaServicio && serviciosFiltrados.length > 0 && (
                <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-lg">
                  {serviciosFiltrados.map((servicio) => (
                    <button
                      key={servicio.id}
                      type="button"
                      onClick={() => agregarServicio(servicio)}
                      className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-200 last:border-b-0 transition"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-semibold text-gray-800">
                            {servicio.nombre}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">
                            ${parseFloat(servicio.precio_vigente).toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {servicio.duracion} min
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {busquedaServicio &&
                serviciosFiltrados.length === 0 &&
                !loadingServicios && (
                  <p className="text-sm text-gray-500 italic">
                    No se encontraron servicios
                  </p>
                )}
            </div>

            {/* Servicios seleccionados */}
            {serviciosSeleccionados.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <div className="text-4xl mb-2">📋</div>
                <p className="text-gray-600">No hay servicios agregados</p>
                <p className="text-sm text-gray-500">
                  Busca y selecciona servicios de la lista de arriba
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {serviciosSeleccionados.map((servicio, index) => (
                  <div
                    key={servicio.id}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </div>

                    <div className="flex-1">
                      <div className="font-semibold text-gray-800">
                        {servicio.nombre}
                      </div>
                      <div className="text-sm text-gray-600">
                        ${parseFloat(servicio.precio_vigente).toFixed(2)} ×{" "}
                        {servicio.cantidad} = $
                        {(
                          parseFloat(servicio.precio_vigente) * servicio.cantidad
                        ).toFixed(2)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700">
                        Cantidad:
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={servicio.cantidad}
                        onChange={(e) =>
                          actualizarCantidad(
                            servicio.id,
                            parseInt(e.target.value) || 1
                          )
                        }
                        className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => eliminarServicio(servicio.id)}
                      className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Previsualización */}
          {preview && serviciosSeleccionados.length > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                📊 Previsualización
              </h2>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-gray-700">
                  <span>Precio total servicios:</span>
                  <span className="font-bold text-lg">
                    ${parseFloat(preview.precio_total_servicios).toFixed(2)}
                  </span>
                </div>

                {tipoPrecio === "PORCENTAJE" && (
                  <div className="flex justify-between items-center text-red-600">
                    <span>Descuento ({preview.valor_precio}%):</span>
                    <span className="font-bold text-lg">
                      -$
                      {(
                        parseFloat(preview.precio_total_servicios) -
                        parseFloat(preview.precio_final)
                      ).toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="border-t-2 border-gray-300 pt-3"></div>

                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-gray-800">
                    Precio final:
                  </span>
                  <span className="text-3xl font-bold text-green-600">
                    ${parseFloat(preview.precio_final).toFixed(2)} ✨
                  </span>
                </div>

                <div className="flex justify-between items-center text-blue-600">
                  <span className="font-semibold">Cliente ahorra:</span>
                  <span className="text-xl font-bold">
                    💰 ${parseFloat(preview.ahorro).toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-gray-700">
                  <span>Duración total:</span>
                  <span className="font-semibold">
                    ⏱️ {preview.duracion_total} minutos
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate("/combos")}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || serviciosSeleccionados.length === 0}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <span>✓</span>
                  <span>{esEdicion ? "Actualizar" : "Guardar"} Combo</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
