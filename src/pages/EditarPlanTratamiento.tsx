// src/pages/EditarPlanTratamiento.tsx
import { useState, useEffect } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import TopBar from "../components/TopBar";
import { toast, Toaster } from "react-hot-toast";
import {
  obtenerPlanTratamiento,
  actualizarPlanTratamiento,
} from "../services/planesTratamientoService";
import type { 
  PlanTratamientoDetalle,
  ActualizarPlanTratamientoDTO 
} from "../interfaces/PlanTratamiento";

export default function EditarPlanTratamiento() {
  const { isAuth, user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<PlanTratamientoDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Formulario de edición (solo campos editables según backend)
  const [formData, setFormData] = useState<ActualizarPlanTratamientoDTO>({
    notas_plan: "",
    descuento: "",
    fecha_vigencia: "",
  });

  useEffect(() => {
    if (id) {
      cargarPlan();
    }
  }, [id]);

  const cargarPlan = async () => {
    setLoading(true);
    try {
      const planData = await obtenerPlanTratamiento(parseInt(id!));
      setPlan(planData);
      
      // Cargar datos actuales en el formulario
      setFormData({
        notas_plan: planData.notas_plan || "",
        descuento: planData.descuento || "0",
        fecha_vigencia: planData.fecha_vigencia || "",
      });
    } catch (error: any) {
      console.error("Error al cargar plan:", error);
      toast.error(
        error?.response?.data?.detail ||
          "Error al cargar el plan de tratamiento"
      );
      navigate("/planes-tratamiento");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!plan) return;

    // Validar que esté en borrador
    if (!plan.es_borrador || !plan.puede_editarse) {
      toast.error("Solo se pueden editar planes en estado Borrador");
      return;
    }

    setGuardando(true);
    try {
      // Preparar payload (solo enviar campos que cambiaron)
      const cambios: ActualizarPlanTratamientoDTO = {};
      
      if (formData.notas_plan !== plan.notas_plan) {
        cambios.notas_plan = formData.notas_plan;
      }
      
      if (formData.descuento !== plan.descuento) {
        cambios.descuento = formData.descuento;
      }
      
      if (formData.fecha_vigencia !== plan.fecha_vigencia) {
        cambios.fecha_vigencia = formData.fecha_vigencia;
      }

      // Si no hay cambios
      if (Object.keys(cambios).length === 0) {
        toast.error("No hay cambios para guardar");
        return;
      }

      console.log("📤 Actualizando plan con cambios:", cambios);
      
      await actualizarPlanTratamiento(parseInt(id!), cambios);
      toast.success("Plan de tratamiento actualizado exitosamente");
      navigate(`/planes-tratamiento/${id}`);
    } catch (error: any) {
      console.error("❌ Error al actualizar plan:", error);
      
      if (error?.response?.data) {
        const errorData = error.response.data;
        
        if (typeof errorData === 'object' && !errorData.detail) {
          Object.entries(errorData).forEach(([campo, mensajes]) => {
            const mensaje = Array.isArray(mensajes) ? mensajes[0] : mensajes;
            toast.error(`${campo}: ${mensaje}`);
          });
        } else {
          toast.error(errorData.detail || "Error al actualizar el plan");
        }
      } else {
        toast.error("Error al actualizar el plan de tratamiento");
      }
    } finally {
      setGuardando(false);
    }
  };

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  // Verificar permisos (solo admin u odontólogo)
  if (user?.idtipousuario !== 1 && user?.idtipousuario !== 3) {
    toast.error("No tiene permisos para editar planes de tratamiento");
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-white">
        <TopBar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando plan...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!plan) {
    return <Navigate to="/planes-tratamiento" replace />;
  }

  // Verificar que puede editarse
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
              Editar Plan de Tratamiento #{plan.id}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Paciente: {plan.paciente.nombre} {plan.paciente.apellido}
            </p>
          </div>
        </header>

        {/* Alerta de estado */}
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-yellow-600 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h4 className="font-medium text-yellow-800">
                Plan en estado Borrador
              </h4>
              <p className="text-sm text-yellow-700 mt-1">
                Solo se pueden editar algunos campos. Para modificar los ítems, 
                vaya al detalle del plan.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Formulario de Edición */}
          <div className="bg-white/80 backdrop-blur-sm border border-cyan-100 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              📝 Información Editable
            </h3>
            
            <div className="space-y-4">
              {/* Notas del Plan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas del Plan
                </label>
                <textarea
                  value={formData.notas_plan}
                  onChange={(e) =>
                    setFormData({ ...formData, notas_plan: e.target.value })
                  }
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  placeholder="Descripción general del plan, diagnóstico, observaciones..."
                />
              </div>

              {/* Descuento Global */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descuento Global (Bs)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.descuento}
                  onChange={(e) =>
                    setFormData({ ...formData, descuento: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  placeholder="0.00"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Descuento aplicado al total del plan (en bolivianos)
                </p>
              </div>

              {/* Fecha de Vigencia */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Vigencia
                </label>
                <input
                  type="date"
                  value={formData.fecha_vigencia}
                  onChange={(e) =>
                    setFormData({ ...formData, fecha_vigencia: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Fecha hasta la cual es válido el plan de tratamiento
                </p>
              </div>
            </div>
          </div>

          {/* Información de solo lectura */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              ℹ️ Información del Plan (Solo lectura)
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Paciente:</p>
                <p className="font-medium text-gray-900">
                  {plan.paciente.nombre} {plan.paciente.apellido}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Odontólogo:</p>
                <p className="font-medium text-gray-900">
                  {plan.odontologo.nombre}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Total de Ítems:</p>
                <p className="font-medium text-gray-900">
                  {plan.estadisticas.total_items}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Monto Total:</p>
                <p className="font-medium text-cyan-600">
                  Bs. {parseFloat(plan.montototal).toFixed(2)}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              * Para editar paciente, odontólogo o ítems, debe crear un nuevo plan.
            </p>
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
              {guardando ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>

          {/* Nota informativa */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            <p className="font-medium mb-1">💡 Campos editables:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Notas del plan (descripción, diagnóstico, observaciones)</li>
              <li>Descuento global aplicado al total</li>
              <li>Fecha de vigencia del plan</li>
            </ul>
            <p className="mt-2 text-xs">
              <strong>Nota:</strong> Los ítems del plan se gestionan desde la vista de detalle.
            </p>
          </div>
        </form>
      </main>
    </div>
  );
}
