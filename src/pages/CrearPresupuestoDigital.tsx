// src/pages/CrearPresupuestoDigital.tsx
import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import TopBar from "../components/TopBar";
import { toast, Toaster } from "react-hot-toast";
import { Api } from "../lib/Api";
import {
  crearPresupuestoDigital,
  obtenerPlanesDisponibles,
  formatearMonto,
} from "../services/presupuestosDigitalesService";
import type {
  CrearPresupuestoDigitalDTO,
  ItemConfigDTO,
  PlanDisponible,
} from "../interfaces/PresupuestoDigital";
import type { PlanTratamientoDetalle, ItemPlanTratamiento } from "../interfaces/PlanTratamiento";

export default function CrearPresupuestoDigital() {
  const { isAuth, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Datos para dropdowns
  const [planesDisponibles, setPlanesDisponibles] = useState<PlanDisponible[]>([]);
  const [planSeleccionado, setPlanSeleccionado] = useState<PlanTratamientoDetalle | null>(null);
  const [itemsDisponibles, setItemsDisponibles] = useState<ItemPlanTratamiento[]>([]);

  // Formulario principal
  const [formData, setFormData] = useState<CrearPresupuestoDigitalDTO>({
    plan_tratamiento_id: 0,
    items_ids: [],
    fecha_vigencia: "",
    es_tramo: false,
    numero_tramo: null,
    descuento: "0.00",
    terminos_condiciones: "",
    notas: "",
    items_config: [],
  });

  // Items seleccionados con configuración
  const [itemsSeleccionados, setItemsSeleccionados] = useState<Set<number>>(new Set());
  const [configuracionItems, setConfiguracionItems] = useState<Map<number, ItemConfigDTO>>(new Map());

  useEffect(() => {
    cargarPlanesDisponibles();
    // Calcular fecha vigencia por defecto (30 días)
    const fechaDefault = new Date();
    fechaDefault.setDate(fechaDefault.getDate() + 30);
    setFormData((prev) => ({
      ...prev,
      fecha_vigencia: fechaDefault.toISOString().split('T')[0],
    }));
  }, []);

  const cargarPlanesDisponibles = async () => {
    try {
      const planes = await obtenerPlanesDisponibles();
      setPlanesDisponibles(planes);
    } catch (error) {
      console.error("Error al cargar planes disponibles:", error);
      toast.error("Error al cargar los planes disponibles");
    }
  };

  const handlePlanChange = async (planId: number) => {
    if (planId === 0) {
      setPlanSeleccionado(null);
      setItemsDisponibles([]);
      setItemsSeleccionados(new Set());
      setConfiguracionItems(new Map());
      return;
    }

    try {
      const response = await Api.get<PlanTratamientoDetalle>(`/planes-tratamiento/${planId}/`);
      setPlanSeleccionado(response.data);
      setItemsDisponibles(response.data.items || []);
      
      setFormData((prev) => ({
        ...prev,
        plan_tratamiento_id: planId,
        items_ids: [],
      }));
      
      setItemsSeleccionados(new Set());
      setConfiguracionItems(new Map());
    } catch (error) {
      console.error("Error al cargar plan:", error);
      toast.error("Error al cargar el plan de tratamiento");
    }
  };

  const toggleItem = (itemId: number) => {
    const newSeleccionados = new Set(itemsSeleccionados);
    
    if (newSeleccionados.has(itemId)) {
      newSeleccionados.delete(itemId);
      const newConfig = new Map(configuracionItems);
      newConfig.delete(itemId);
      setConfiguracionItems(newConfig);
    } else {
      newSeleccionados.add(itemId);
      // Inicializar configuración por defecto
      const newConfig = new Map(configuracionItems);
      newConfig.set(itemId, {
        item_id: itemId,
        descuento_item: "0.00",
        permite_pago_parcial: false,
        cantidad_cuotas: null,
        notas_item: "",
      });
      setConfiguracionItems(newConfig);
    }
    
    setItemsSeleccionados(newSeleccionados);
  };

  const updateItemConfig = (itemId: number, campo: keyof ItemConfigDTO, valor: any) => {
    const newConfig = new Map(configuracionItems);
    const config = newConfig.get(itemId) || {
      item_id: itemId,
      descuento_item: "0.00",
      permite_pago_parcial: false,
      cantidad_cuotas: null,
      notas_item: "",
    };
    
    newConfig.set(itemId, {
      ...config,
      [campo]: valor,
    });
    
    setConfiguracionItems(newConfig);
  };

  const calcularSubtotal = (): number => {
    if (!formData.es_tramo) {
      // Presupuesto total: sumar todos los items del plan
      return itemsDisponibles.reduce((sum, item) => sum + parseFloat(item.costofinal), 0);
    } else {
      // Presupuesto parcial: solo items seleccionados
      return itemsDisponibles
        .filter((item) => itemsSeleccionados.has(item.id))
        .reduce((sum, item) => {
          const config = configuracionItems.get(item.id);
          const descuento = config?.descuento_item ? parseFloat(config.descuento_item) : 0;
          return sum + (parseFloat(item.costofinal) - descuento);
        }, 0);
    }
  };

  const calcularTotal = (): number => {
    const subtotal = calcularSubtotal();
    const descuentoGlobal = parseFloat(formData.descuento || "0");
    return Math.max(0, subtotal - descuentoGlobal);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.plan_tratamiento_id === 0) {
      toast.error("Debe seleccionar un plan de tratamiento");
      return;
    }

    if (formData.es_tramo && !formData.numero_tramo) {
      toast.error("Debe especificar el número de tramo");
      return;
    }

    if (formData.es_tramo && itemsSeleccionados.size === 0) {
      toast.error("Debe seleccionar al menos un ítem para el presupuesto parcial");
      return;
    }

    setLoading(true);
    try {
      const payload: CrearPresupuestoDigitalDTO = {
        plan_tratamiento_id: formData.plan_tratamiento_id,
        items_ids: formData.es_tramo ? Array.from(itemsSeleccionados) : [],
        fecha_vigencia: formData.fecha_vigencia,
        es_tramo: formData.es_tramo,
        numero_tramo: formData.es_tramo ? formData.numero_tramo : null,
        descuento: formData.descuento,
        terminos_condiciones: formData.terminos_condiciones,
        notas: formData.notas,
        items_config: formData.es_tramo ? Array.from(configuracionItems.values()) : [],
      };

      console.log("📤 Enviando presupuesto al backend:", payload);

      const presupuestoCreado = await crearPresupuestoDigital(payload);
      toast.success("Presupuesto digital creado exitosamente");
      
      if (presupuestoCreado.id) {
        navigate(`/presupuestos-digitales/${presupuestoCreado.id}`);
      } else {
        navigate("/presupuestos-digitales");
      }
    } catch (error: any) {
      console.error("❌ Error al crear presupuesto:", error);
      
      if (error?.response?.data) {
        const errorData = error.response.data;
        console.error("🔍 Detalle del error:", errorData);
        
        if (typeof errorData === 'object' && !errorData.detail) {
          Object.entries(errorData).forEach(([campo, mensajes]) => {
            const mensaje = Array.isArray(mensajes) ? mensajes[0] : mensajes;
            toast.error(`${campo}: ${mensaje}`);
          });
        } else {
          toast.error(errorData.detail || "Error al crear el presupuesto digital");
        }
      } else {
        toast.error("Error al crear el presupuesto digital");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  if (user?.idtipousuario !== 1 && user?.idtipousuario !== 3) {
    toast.error("No tiene permisos para crear presupuestos digitales");
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-white">
      <TopBar />
      <Toaster position="top-right" />

      <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Header */}
        <header className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Crear Presupuesto Digital
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Estado inicial: Borrador • Puede editarse hasta emitir
            </p>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Selección de Plan */}
          <div className="bg-white/80 backdrop-blur-sm border border-cyan-100 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              📋 Plan de Tratamiento
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Seleccionar Plan Aprobado <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.plan_tratamiento_id === 0 ? "" : formData.plan_tratamiento_id}
                  onChange={(e) => handlePlanChange(e.target.value === "" ? 0 : Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                >
                  <option value="">-- Seleccione un plan aprobado --</option>
                  {planesDisponibles.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.paciente} - Dr. {plan.odontologo} ({new Date(plan.fecha_plan).toLocaleDateString()}) - {formatearMonto(plan.monto_total)}
                    </option>
                  ))}
                </select>
                {planesDisponibles.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    No hay planes de tratamiento aprobados disponibles
                  </p>
                )}
              </div>

              {planSeleccionado && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">Información del Plan</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
                    <div>
                      <span className="font-medium">Paciente:</span> {planSeleccionado.paciente.nombre} {planSeleccionado.paciente.apellido}
                    </div>
                    <div>
                      <span className="font-medium">Odontólogo:</span> {planSeleccionado.odontologo.nombre}
                    </div>
                    <div>
                      <span className="font-medium">Total Items:</span> {planSeleccionado.items?.length || 0}
                    </div>
                    <div>
                      <span className="font-medium">Total Plan:</span> {formatearMonto(planSeleccionado.montototal)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tipo de Presupuesto */}
          {planSeleccionado && (
            <div className="bg-white/80 backdrop-blur-sm border border-cyan-100 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                🎯 Tipo de Presupuesto
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={!formData.es_tramo}
                      onChange={() => setFormData({ ...formData, es_tramo: false, numero_tramo: null })}
                      className="w-4 h-4 text-cyan-600 focus:ring-cyan-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Presupuesto Total (Todos los ítems del plan)
                    </span>
                  </label>
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={formData.es_tramo}
                      onChange={() => setFormData({ ...formData, es_tramo: true, numero_tramo: 1 })}
                      className="w-4 h-4 text-cyan-600 focus:ring-cyan-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Presupuesto Parcial (Por tramo - seleccionar ítems)
                    </span>
                  </label>
                </div>

                {formData.es_tramo && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Número de Tramo <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.numero_tramo || ""}
                        onChange={(e) => setFormData({ ...formData, numero_tramo: parseInt(e.target.value) })}
                        required={formData.es_tramo}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                        placeholder="Ej: 1, 2, 3..."
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Indique la secuencia del tramo (1ra fase, 2da fase, etc.)
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Selección de Items (solo si es parcial) */}
          {formData.es_tramo && itemsDisponibles.length > 0 && (
            <div className="bg-white/80 backdrop-blur-sm border border-cyan-100 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                ✅ Seleccionar Ítems para el Presupuesto
              </h3>
              
              <div className="space-y-3">
                {itemsDisponibles.map((item) => {
                  const isSelected = itemsSeleccionados.has(item.id);
                  const config = configuracionItems.get(item.id);
                  
                  return (
                    <div key={item.id} className={`border rounded-lg p-4 ${isSelected ? 'border-cyan-500 bg-cyan-50' : 'border-gray-200'}`}>
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleItem(item.id)}
                          className="mt-1 w-4 h-4 text-cyan-600 focus:ring-cyan-500"
                        />
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="font-medium text-gray-900">{item.servicio_nombre}</h4>
                              {item.pieza_dental_nombre && (
                                <p className="text-sm text-gray-600">Pieza: {item.pieza_dental_nombre}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">{formatearMonto(item.costofinal)}</p>
                              <p className="text-xs text-gray-500">{item.tiempo_estimado} min</p>
                            </div>
                          </div>

                          {/* Configuración del item si está seleccionado */}
                          {isSelected && (
                            <div className="mt-3 pt-3 border-t border-cyan-200 grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Descuento específico (Bs)
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  max={parseFloat(item.costofinal)}
                                  value={config?.descuento_item || "0.00"}
                                  onChange={(e) => updateItemConfig(item.id, 'descuento_item', e.target.value)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-cyan-500"
                                />
                              </div>

                              <div>
                                <label className="flex items-center gap-2 text-xs font-medium text-gray-700 mb-1">
                                  <input
                                    type="checkbox"
                                    checked={config?.permite_pago_parcial || false}
                                    onChange={(e) => updateItemConfig(item.id, 'permite_pago_parcial', e.target.checked)}
                                    className="w-3 h-3 text-cyan-600 focus:ring-cyan-500"
                                  />
                                  Permitir pago parcial
                                </label>
                                {config?.permite_pago_parcial && (
                                  <input
                                    type="number"
                                    min="2"
                                    max="12"
                                    value={config?.cantidad_cuotas || ""}
                                    onChange={(e) => updateItemConfig(item.id, 'cantidad_cuotas', parseInt(e.target.value))}
                                    placeholder="# cuotas"
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-cyan-500"
                                  />
                                )}
                              </div>

                              <div className="md:col-span-2">
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Notas del ítem
                                </label>
                                <textarea
                                  rows={2}
                                  value={config?.notas_item || ""}
                                  onChange={(e) => updateItemConfig(item.id, 'notas_item', e.target.value)}
                                  placeholder="Observaciones específicas de este ítem..."
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-cyan-500"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {itemsSeleccionados.size > 0 && (
                <div className="mt-4 p-3 bg-cyan-50 rounded-lg border border-cyan-200">
                  <p className="text-sm font-medium text-cyan-900">
                    {itemsSeleccionados.size} ítems seleccionados de {itemsDisponibles.length}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Configuración General */}
          {planSeleccionado && (
            <div className="bg-white/80 backdrop-blur-sm border border-cyan-100 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                ⚙️ Configuración del Presupuesto
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Vigencia
                  </label>
                  <input
                    type="date"
                    value={formData.fecha_vigencia}
                    onChange={(e) => setFormData({ ...formData, fecha_vigencia: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Fecha límite de validez del presupuesto (default: 30 días)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descuento Global (Bs)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.descuento}
                    onChange={(e) => setFormData({ ...formData, descuento: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Descuento adicional sobre el total
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Términos y Condiciones
                  </label>
                  <textarea
                    rows={5}
                    value={formData.terminos_condiciones}
                    onChange={(e) => setFormData({ ...formData, terminos_condiciones: e.target.value })}
                    placeholder="Ingrese los términos y condiciones del presupuesto..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notas Internas
                  </label>
                  <textarea
                    rows={3}
                    value={formData.notas}
                    onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                    placeholder="Notas internas del presupuesto (no visibles para el paciente)..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Resumen de Totales */}
          {planSeleccionado && (
            <div className="bg-white/80 backdrop-blur-sm border border-cyan-100 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                💰 Resumen del Presupuesto
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{formatearMonto(calcularSubtotal())}</span>
                </div>
                
                {parseFloat(formData.descuento) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Descuento Global:</span>
                    <span className="font-medium text-red-600">- {formatearMonto(formData.descuento)}</span>
                  </div>
                )}
                
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total del Presupuesto:</span>
                    <span className="text-cyan-600">{formatearMonto(calcularTotal())}</span>
                  </div>
                </div>
                
                <p className="text-xs text-gray-500 text-right">
                  Los totales se calcularán automáticamente en el servidor
                </p>
              </div>
            </div>
          )}

          {/* Botones de Acción */}
          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !planSeleccionado}
              className="px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              )}
              {loading ? "Creando presupuesto..." : "Crear Presupuesto"}
            </button>
          </div>

          {/* Nota informativa */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            <p className="font-medium mb-1">ℹ️ Información importante:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>El presupuesto se creará en estado <strong>Borrador</strong></li>
              <li>Podrá editar el presupuesto mientras esté en borrador</li>
              <li>Una vez emitido, el presupuesto será <strong>inmutable</strong></li>
              <li>Se generará un código único de trazabilidad</li>
              <li>El presupuesto tendrá vigencia hasta la fecha especificada</li>
            </ul>
          </div>
        </form>
      </main>
    </div>
  );
}
