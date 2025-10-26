// src/pages/AgregarItemPlan.tsx
import { useState, useEffect } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import TopBar from "../components/TopBar";
import { toast, Toaster } from "react-hot-toast";
import { Api } from "../lib/Api";
import {
  obtenerPlanTratamiento,
  agregarItemPlan,
  formatearMonto,
} from "../services/planesTratamientoService";
import type { 
  PlanTratamientoDetalle,
  CrearItemPlanDTO 
} from "../interfaces/PlanTratamiento";

interface Servicio {
  id: number;
  nombre: string;
  descripcion?: string;
  costobase: string;
  precio_vigente?: string;
  duracion?: number;
  activo?: boolean;
}

interface PiezaDental {
  codigo: number;
  numero: string;
  nombre: string;
}

export default function AgregarItemPlan() {
  const { isAuth, user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<PlanTratamientoDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Datos para dropdowns
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [piezasDentales, setPiezasDentales] = useState<PiezaDental[]>([]);

  // Formulario de nuevo item
  const [nuevoItem, setNuevoItem] = useState({
    idservicio: 0,
    idpiezadental: null as number | null,
    costofinal: 0,
    fecha_objetivo: "",
    tiempo_estimado: 0,
    estado_item: "Pendiente" as const,
    notas_item: "",
    orden: 0,
  });

  // Calculadora de descuento
  const [precioBase, setPrecioBase] = useState(0);
  const [descuentoPorcentaje, setDescuentoPorcentaje] = useState(0);

  // Calcular costo final automáticamente
  useEffect(() => {
    if (precioBase > 0) {
      const descuentoEnBs = (precioBase * descuentoPorcentaje) / 100;
      const costoFinal = precioBase - descuentoEnBs;
      setNuevoItem((prev) => ({ ...prev, costofinal: costoFinal }));
    }
  }, [precioBase, descuentoPorcentaje]);

  useEffect(() => {
    if (id) {
      cargarDatos();
    }
  }, [id]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [planData, serviciosRes, piezasRes] = await Promise.all([
        obtenerPlanTratamiento(parseInt(id!)),
        Api.get<{ results: Servicio[] }>("/clinic/servicios/"),
        Api.get<{ results: PiezaDental[] }>("/clinic/piezas-dentales/?page_size=100"),
      ]);

      setPlan(planData);
      setServicios(serviciosRes.data.results || []);
      setPiezasDentales(piezasRes.data.results || []);
      
      // Establecer orden inicial
      setNuevoItem((prev) => ({
        ...prev,
        orden: planData.items.length,
      }));
    } catch (error: any) {
      console.error("Error al cargar datos:", error);
      toast.error("Error al cargar el plan de tratamiento");
      navigate("/planes-tratamiento");
    } finally {
      setLoading(false);
    }
  };

  const handleSeleccionarServicio = (idservicio: number) => {
    const servicio = servicios.find((s) => s.id === idservicio);
    if (servicio) {
      const precio = parseFloat(servicio.precio_vigente || servicio.costobase);
      
      setPrecioBase(precio);
      setDescuentoPorcentaje(0);
      
      setNuevoItem({
        ...nuevoItem,
        idservicio,
        costofinal: precio,
        tiempo_estimado: servicio.duracion || 0,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!plan) return;

    if (nuevoItem.idservicio === 0) {
      toast.error("Debe seleccionar un servicio");
      return;
    }

    if (!nuevoItem.costofinal || nuevoItem.costofinal <= 0) {
      toast.error("Debe especificar un precio válido");
      return;
    }

    setGuardando(true);
    try {
      const itemData: CrearItemPlanDTO = {
        idservicio: nuevoItem.idservicio,
        idpiezadental: nuevoItem.idpiezadental,
        costofinal: nuevoItem.costofinal,
        fecha_objetivo: nuevoItem.fecha_objetivo || undefined,
        tiempo_estimado: nuevoItem.tiempo_estimado || undefined,
        estado_item: "Pendiente",
        notas_item: nuevoItem.notas_item || undefined,
        orden: nuevoItem.orden,
      };

      console.log("📤 Agregando ítem al plan:", itemData);
      
      const response = await agregarItemPlan(parseInt(id!), itemData);
      toast.success(response.mensaje || "Ítem agregado exitosamente");
      navigate(`/planes-tratamiento/${id}`);
    } catch (error: any) {
      console.error("❌ Error al agregar ítem:", error);
      
      if (error?.response?.data) {
        const errorData = error.response.data;
        
        if (typeof errorData === 'object' && !errorData.detail) {
          Object.entries(errorData).forEach(([campo, mensajes]) => {
            const mensaje = Array.isArray(mensajes) ? mensajes[0] : mensajes;
            toast.error(`${campo}: ${mensaje}`);
          });
        } else {
          toast.error(errorData.detail || errorData.error || "Error al agregar el ítem");
        }
      } else {
        toast.error("Error al agregar el ítem al plan");
      }
    } finally {
      setGuardando(false);
    }
  };

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  if (user?.idtipousuario !== 1 && user?.idtipousuario !== 3) {
    toast.error("No tiene permisos para agregar ítems");
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-white">
        <TopBar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!plan) {
    return <Navigate to="/planes-tratamiento" replace />;
  }

  if (!plan.puede_editarse) {
    toast.error("Este plan no puede ser editado (ya fue aprobado)");
    return <Navigate to={`/planes-tratamiento/${id}`} replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-white">
      <TopBar />
      <Toaster position="top-right" />

      <main className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Header */}
        <header className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(`/planes-tratamiento/${id}`)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg
              className="w-6 h-6 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Agregar Procedimiento al Plan #{plan.id}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Paciente: {plan.paciente.nombre} {plan.paciente.apellido}
            </p>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Formulario de Nuevo Ítem */}
          <div className="bg-white/80 backdrop-blur-sm border border-cyan-100 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              ➕ Nuevo Procedimiento/Servicio
            </h3>
            
            <div className="space-y-4">
              {/* Servicio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Servicio/Procedimiento <span className="text-red-500">*</span>
                </label>
                <select
                  value={nuevoItem.idservicio === 0 ? "" : String(nuevoItem.idservicio)}
                  onChange={(e) => {
                    const idservicio = e.target.value === "" ? 0 : Number(e.target.value);
                    handleSeleccionarServicio(idservicio);
                  }}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                >
                  <option value="">-- Seleccione un servicio --</option>
                  {servicios.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre} - Bs. {s.precio_vigente || s.costobase}
                    </option>
                  ))}
                </select>
              </div>

              {/* Pieza Dental */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pieza Dental (Opcional)
                </label>
                <select
                  value={nuevoItem.idpiezadental === null ? "" : String(nuevoItem.idpiezadental)}
                  onChange={(e) =>
                    setNuevoItem({
                      ...nuevoItem,
                      idpiezadental: e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                >
                  <option value="">-- Sin pieza específica --</option>
                  {piezasDentales.map((p) => (
                    <option key={p.codigo} value={p.codigo}>
                      {p.numero} - {p.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Calculadora de Precio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  💰 Precio del Servicio
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  
                  {/* Precio Base */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Precio Base (Bs)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={precioBase || ""}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
                      placeholder="Auto-completa"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Se auto-completa al seleccionar servicio
                    </p>
                  </div>

                  {/* Descuento */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Descuento (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={descuentoPorcentaje || ""}
                      onChange={(e) => setDescuentoPorcentaje(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                      placeholder="0"
                    />
                  </div>

                  {/* Costo Final */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Costo Final (Bs) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={nuevoItem.costofinal || ""}
                      onChange={(e) => {
                        const valor = parseFloat(e.target.value) || 0;
                        setNuevoItem({ ...nuevoItem, costofinal: valor });
                        if (precioBase > 0) {
                          const descuento = ((precioBase - valor) / precioBase) * 100;
                          setDescuentoPorcentaje(Math.max(0, descuento));
                        }
                      }}
                      required
                      className="w-full px-3 py-2 border-2 border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 font-bold text-green-700 bg-green-50"
                      placeholder="0.00"
                    />
                    {descuentoPorcentaje > 0 && precioBase > 0 && (
                      <p className="text-xs text-green-600 mt-1 font-medium">
                        ✓ Ahorro: {formatearMonto((precioBase * descuentoPorcentaje) / 100)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Fecha Objetivo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha Objetivo
                </label>
                <input
                  type="date"
                  value={nuevoItem.fecha_objetivo}
                  onChange={(e) =>
                    setNuevoItem({ ...nuevoItem, fecha_objetivo: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                />
              </div>

              {/* Tiempo Estimado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tiempo Estimado (minutos)
                </label>
                <input
                  type="number"
                  min="0"
                  value={nuevoItem.tiempo_estimado === 0 ? "" : nuevoItem.tiempo_estimado}
                  onChange={(e) =>
                    setNuevoItem({
                      ...nuevoItem,
                      tiempo_estimado: e.target.value === "" ? 0 : parseInt(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                />
              </div>

              {/* Notas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas del Procedimiento
                </label>
                <textarea
                  value={nuevoItem.notas_item}
                  onChange={(e) =>
                    setNuevoItem({ ...nuevoItem, notas_item: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  placeholder="Observaciones, precauciones, materiales requeridos, etc."
                />
              </div>

              {/* Orden */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Orden de Ejecución
                </label>
                <input
                  type="number"
                  min="0"
                  value={nuevoItem.orden}
                  onChange={(e) =>
                    setNuevoItem({
                      ...nuevoItem,
                      orden: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Orden en que se ejecutará este procedimiento (0 = sin orden específico)
                </p>
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={() => navigate(`/planes-tratamiento/${id}`)}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {guardando && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              )}
              {guardando ? "Agregando..." : "Agregar Procedimiento"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
