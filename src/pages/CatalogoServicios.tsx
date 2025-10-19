import { useState, useEffect } from "react";
import { obtenerServicios, obtenerServicio } from "../services/serviciosService";
import type {
  ServicioListado,
  Servicio,
  FiltrosServicios,
} from "../interfaces/Servicio";
import toast from "react-hot-toast";

export default function CatalogoServicios() {
  const [servicios, setServicios] = useState<ServicioListado[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalResultados, setTotalResultados] = useState(0);
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  
  // Modal de detalle
  const [modalAbierto, setModalAbierto] = useState(false);
  const [servicioDetalle, setServicioDetalle] = useState<Servicio | null>(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  // Estados para los filtros
  const [busqueda, setBusqueda] = useState("");
  const [precioMin, setPrecioMin] = useState("");
  const [precioMax, setPrecioMax] = useState("");
  const [duracionMin, setDuracionMin] = useState("");
  const [duracionMax, setDuracionMax] = useState("");
  const [ordenamiento, setOrdenamiento] = useState("nombre");
  const pageSize = 10;

  // Función para cargar servicios
  const cargarServicios = async () => {
    setLoading(true);
    try {
      const filtros: FiltrosServicios = {
        page: paginaActual,
        page_size: pageSize,
        ordering: ordenamiento,
      };

      if (busqueda.trim()) filtros.search = busqueda.trim();
      if (precioMin) filtros.precio_min = parseFloat(precioMin);
      if (precioMax) filtros.precio_max = parseFloat(precioMax);
      if (duracionMin) filtros.duracion_min = parseInt(duracionMin);
      if (duracionMax) filtros.duracion_max = parseInt(duracionMax);

      const response = await obtenerServicios(filtros);
      setServicios(response.results);
      setTotalResultados(response.count);
      setTotalPaginas(Math.ceil(response.count / pageSize));
    } catch (error) {
      console.error("Error cargando servicios:", error);
      toast.error("Error al cargar el catálogo de servicios");
    } finally {
      setLoading(false);
    }
  };

  // Cargar servicios cuando cambien los filtros o la página
  useEffect(() => {
    cargarServicios();
  }, [paginaActual, ordenamiento]);

  // Función para aplicar filtros (resetea a página 1)
  const aplicarFiltros = () => {
    setPaginaActual(1);
    cargarServicios();
  };

  // Función para limpiar filtros
  const limpiarFiltros = () => {
    setBusqueda("");
    setPrecioMin("");
    setPrecioMax("");
    setDuracionMin("");
    setDuracionMax("");
    setOrdenamiento("nombre");
    setPaginaActual(1);
  };

  // Manejar cambio de página
  const cambiarPagina = (nuevaPagina: number) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      setPaginaActual(nuevaPagina);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Función para abrir modal con detalles del servicio
  const verDetalleServicio = async (id: number) => {
    setModalAbierto(true);
    setLoadingDetalle(true);
    try {
      const detalle = await obtenerServicio(id);
      setServicioDetalle(detalle);
    } catch (error) {
      console.error("Error cargando detalle:", error);
      toast.error("No se pudo cargar el detalle del servicio");
      setModalAbierto(false);
    } finally {
      setLoadingDetalle(false);
    }
  };

  // Cerrar modal
  const cerrarModal = () => {
    setModalAbierto(false);
    setServicioDetalle(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Catálogo de Servicios
          </h1>
          <p className="text-gray-600">
            Explora nuestros servicios dentales disponibles
          </p>
        </div>

        {/* Panel de Filtros */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Filtros de Búsqueda
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {/* Búsqueda por texto */}
            <div className="lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar servicio
              </label>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && aplicarFiltros()}
                placeholder="Ej: Limpieza, Endodoncia..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Precio Mínimo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Precio mínimo ($)
              </label>
              <input
                type="number"
                value={precioMin}
                onChange={(e) => setPrecioMin(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Precio Máximo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Precio máximo ($)
              </label>
              <input
                type="number"
                value={precioMax}
                onChange={(e) => setPrecioMax(e.target.value)}
                placeholder="999.99"
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Ordenamiento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ordenar por
              </label>
              <select
                value={ordenamiento}
                onChange={(e) => setOrdenamiento(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="nombre">Nombre (A-Z)</option>
                <option value="-nombre">Nombre (Z-A)</option>
                <option value="costobase">Precio (Menor a Mayor)</option>
                <option value="-costobase">Precio (Mayor a Menor)</option>
                <option value="duracion">Duración (Corta a Larga)</option>
                <option value="-duracion">Duración (Larga a Corta)</option>
              </select>
            </div>

            {/* Duración Mínima */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duración mínima (min)
              </label>
              <input
                type="number"
                value={duracionMin}
                onChange={(e) => setDuracionMin(e.target.value)}
                placeholder="30"
                min="0"
                step="15"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Duración Máxima */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duración máxima (min)
              </label>
              <input
                type="number"
                value={duracionMax}
                onChange={(e) => setDuracionMax(e.target.value)}
                placeholder="120"
                min="0"
                step="15"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3">
            <button
              onClick={aplicarFiltros}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Aplicar Filtros
            </button>
            <button
              onClick={limpiarFiltros}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>

        {/* Resultados */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Servicios Disponibles
            </h2>
            <span className="text-sm text-gray-600">
              {totalResultados} resultado{totalResultados !== 1 ? "s" : ""}{" "}
              encontrado{totalResultados !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* Sin resultados */}
          {!loading && servicios.length === 0 && (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-gray-600 text-lg">
                No se encontraron servicios con los filtros seleccionados
              </p>
              <button
                onClick={limpiarFiltros}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                Limpiar filtros
              </button>
            </div>
          )}

          {/* Lista de servicios */}
          {!loading && servicios.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {servicios.map((servicio) => (
                <div
                  key={servicio.id}
                  className="border border-gray-200 rounded-lg p-5 hover:shadow-lg transition-shadow bg-white"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-800 flex-1">
                      {servicio.nombre}
                    </h3>
                    {servicio.activo && (
                      <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                        Activo
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Precio:</span>
                      <span className="text-2xl font-bold text-blue-600">
                        ${servicio.precio_vigente}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Duración:</span>
                      <span className="text-sm font-medium text-gray-800">
                        {servicio.duracion} minutos
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <button 
                      onClick={() => verDetalleServicio(servicio.id)}
                      className="w-full px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium text-sm"
                    >
                      Ver Detalles
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Paginación */}
          {!loading && servicios.length > 0 && totalPaginas > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => cambiarPagina(paginaActual - 1)}
                disabled={paginaActual === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Anterior
              </button>

              <div className="flex items-center gap-1">
                {[...Array(totalPaginas)].map((_, index) => {
                  const numeroPagina = index + 1;

                  // Mostrar solo algunas páginas alrededor de la actual
                  if (
                    numeroPagina === 1 ||
                    numeroPagina === totalPaginas ||
                    (numeroPagina >= paginaActual - 1 &&
                      numeroPagina <= paginaActual + 1)
                  ) {
                    return (
                      <button
                        key={numeroPagina}
                        onClick={() => cambiarPagina(numeroPagina)}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          paginaActual === numeroPagina
                            ? "bg-blue-600 text-white"
                            : "border border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {numeroPagina}
                      </button>
                    );
                  } else if (
                    numeroPagina === paginaActual - 2 ||
                    numeroPagina === paginaActual + 2
                  ) {
                    return (
                      <span key={numeroPagina} className="px-2">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
              </div>

              <button
                onClick={() => cambiarPagina(paginaActual + 1)}
                disabled={paginaActual === totalPaginas}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>

        {/* Modal de Detalle */}
        {modalAbierto && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header del modal */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">
                  Detalle del Servicio
                </h2>
                <button
                  onClick={cerrarModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Contenido del modal */}
              <div className="p-6">
                {loadingDetalle ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : servicioDetalle ? (
                  <div className="space-y-6">
                    {/* Nombre y estado */}
                    <div className="flex items-start justify-between">
                      <h3 className="text-2xl font-bold text-gray-800">
                        {servicioDetalle.nombre}
                      </h3>
                      {servicioDetalle.activo && (
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full font-medium">
                          Activo
                        </span>
                      )}
                    </div>

                    {/* Descripción */}
                    {servicioDetalle.descripcion && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">
                          Descripción
                        </h4>
                        <p className="text-gray-600 leading-relaxed">
                          {servicioDetalle.descripcion}
                        </p>
                      </div>
                    )}

                    {/* Información de precio y duración */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <p className="text-sm text-blue-600 font-medium mb-1">
                          Precio del Servicio
                        </p>
                        <p className="text-3xl font-bold text-blue-700">
                          ${servicioDetalle.precio_vigente}
                        </p>
                        {servicioDetalle.costobase !== servicioDetalle.precio_vigente && (
                          <p className="text-xs text-gray-500 mt-1">
                            Precio base: ${servicioDetalle.costobase}
                          </p>
                        )}
                      </div>

                      <div className="bg-purple-50 rounded-lg p-4">
                        <p className="text-sm text-purple-600 font-medium mb-1">
                          Duración Estimada
                        </p>
                        <p className="text-3xl font-bold text-purple-700">
                          {servicioDetalle.duracion}
                        </p>
                        <p className="text-sm text-purple-600">minutos</p>
                      </div>
                    </div>

                    {/* Fechas de registro */}
                    <div className="border-t border-gray-200 pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Fecha de creación:</span>
                          <p className="text-gray-800 font-medium">
                            {new Date(servicioDetalle.fecha_creacion).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Última modificación:</span>
                          <p className="text-gray-800 font-medium">
                            {new Date(servicioDetalle.fecha_modificacion).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Botón de acción */}
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={cerrarModal}
                        className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-gray-600 py-8">
                    No se pudo cargar el detalle del servicio
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
