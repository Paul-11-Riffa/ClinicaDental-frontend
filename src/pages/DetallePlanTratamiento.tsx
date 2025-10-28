// src/pages/DetallePlanTratamiento.tsx
import { useState, useEffect } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import TopBar from "../components/TopBar";
import { toast, Toaster } from "react-hot-toast";
import {
  obtenerPlanTratamiento,
  aprobarPlanTratamiento,
  validarAprobacionPlan,
  activarItemPlan,
  cancelarItemPlan,
  completarItemPlan,
  eliminarItemPlan,
  formatearMonto,
  getEstadoPlanColor,
  getEstadoItemColor,
} from "../services/planesTratamientoService";
import type { 
  PlanTratamientoDetalle, 
  ItemPlanTratamiento,
  ValidacionAprobacion 
} from "../interfaces/PlanTratamiento";

export default function DetallePlanTratamiento() {
  const { isAuth, user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<PlanTratamientoDetalle | null>(null);
  const [validacion, setValidacion] = useState<ValidacionAprobacion | null>(null);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);

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
      
      // Validar si puede aprobar el plan
      if (planData.es_borrador) {
        try {
          const validacionData = await validarAprobacionPlan(parseInt(id!));
          setValidacion(validacionData);
          
          // 🔍 Logging de validación y debug info
          console.log("📋 Validación de aprobación cargada:");
          console.log("  - puede_aprobar:", validacionData.puede_aprobar);
          console.log("  - motivos:", validacionData.motivos);
          console.log("  - usuario_puede_aprobar:", validacionData.detalles.usuario_puede_aprobar);
          
          if (validacionData.detalles?.debug) {
            console.log("  - Debug info del backend:");
            console.log("    · usuario_codigo:", validacionData.detalles.debug.usuario_codigo);
            console.log("    · usuario_tipo:", validacionData.detalles.debug.usuario_tipo_rol);
            console.log("    · plan_odontologo_id:", validacionData.detalles.debug.plan_odontologo_id);
            console.log("    · es_odontologo_del_plan:", validacionData.detalles.debug.es_odontologo_del_plan);
            console.log("    · es_admin:", validacionData.detalles.debug.es_admin);
          }
        } catch (error) {
          console.warn("Error al validar aprobación:", error);
          setValidacion(null);
        }
      }
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

  const handleAprobarPlan = async () => {
    // ✅ Backend corregido - Usar validación del backend
    // Ver: SOLUCION_VALIDACION_APROBACION.md y ANALISIS_FIX_BACKEND_VALIDACION.md
    
    if (validacion && !validacion.puede_aprobar) {
      const motivos = validacion.motivos.join('\n• ');
      
      // Mostrar información de debug en consola para troubleshooting
      if (validacion.detalles?.debug) {
        console.warn("⚠️ Aprobación denegada - Debug info:");
        console.warn("  Usuario código:", validacion.detalles.debug.usuario_codigo);
        console.warn("  Odontólogo del plan:", validacion.detalles.debug.plan_odontologo_id);
        console.warn("  Es odontólogo asignado:", validacion.detalles.debug.es_odontologo_del_plan);
        console.warn("  Es admin:", validacion.detalles.debug.es_admin);
      }
      
      toast.error(`No se puede aprobar el plan:\n\n• ${motivos}`, {
        duration: 6000,
      });
      return;
    }

    if (
      !window.confirm(
        "¿Está seguro de aprobar este plan? Una vez aprobado no podrá editarse."
      )
    ) {
      return;
    }

    setProcesando(true);
    try {
      // Capturar respuesta completa del backend
      console.log("🔄 Iniciando aprobación del plan:", id);
      console.log("📤 Request:", {
        url: `/planes-tratamiento/${id}/aprobar/`,
        method: 'POST',
        payload: { confirmar: true }
      });
      
      const response = await aprobarPlanTratamiento(parseInt(id!));
      
      console.log("✅ Plan aprobado exitosamente");
      console.log("📥 Response:", response);
      
      // Mensaje de éxito según documentación del backend
      toast.success(
        response.mensaje || "Plan de tratamiento aprobado exitosamente",
        { duration: 4000 }
      );
      
      // Recargar plan para ver cambios
      cargarPlan();
    } catch (error: any) {
      // Logging exhaustivo del error según documentación
      console.error("❌ Error al aprobar plan - Detalles completos:");
      console.error("Error object:", error);
      console.error("Response status:", error.response?.status);
      console.error("Response headers:", error.response?.headers);
      console.error("Response data:", error.response?.data);
      
      // Mostrar error real del backend según INSTRUCCIONES_TESTING_FRONTEND.md
      let mensajeError = "Error al aprobar el plan de tratamiento";
      let detalleError = "";
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Formato esperado según backend:
        // { error: "...", detalle: "..." }
        if (errorData.error) {
          mensajeError = errorData.error;
          if (errorData.detalle) {
            detalleError = errorData.detalle;
          }
        } else if (errorData.detail) {
          mensajeError = errorData.detail;
        } else if (errorData.non_field_errors) {
          mensajeError = Array.isArray(errorData.non_field_errors) 
            ? errorData.non_field_errors[0] 
            : errorData.non_field_errors;
        } else if (typeof errorData === 'string') {
          mensajeError = errorData;
        }
      }
      
      // Mostrar error con detalle si existe
      if (detalleError) {
        toast.error(`${mensajeError}\n\n${detalleError}`, { duration: 6000 });
      } else {
        toast.error(mensajeError, { duration: 5000 });
      }
      
      // Logging para debugging (según SOLUCION_BUG_APROBAR_PLAN.md)
      if (error.response?.status === 403) {
        console.warn("⚠️ Error 403: Permisos insuficientes");
        console.warn("Verifica que seas el odontólogo asignado o administrador");
      } else if (error.response?.status === 400) {
        console.warn("⚠️ Error 400: Validación de negocio");
        console.warn("Posibles causas: plan no en borrador, sin ítems activos, etc.");
      } else if (error.response?.status === 500) {
        console.error("🔥 Error 500: Error interno del servidor");
        console.error("Enviar logs completos al equipo de backend");
      }
    } finally {
      setProcesando(false);
    }
  };

  const handleActivarItem = async (itemId: number) => {
    setProcesando(true);
    try {
      await activarItemPlan(parseInt(id!), itemId);
      toast.success("Ítem activado exitosamente");
      cargarPlan();
    } catch (error: any) {
      console.error("Error al activar ítem:", error);
      toast.error(error?.response?.data?.detail || "Error al activar el ítem");
    } finally {
      setProcesando(false);
    }
  };

  const handleCancelarItem = async (itemId: number) => {
    if (
      !window.confirm(
        "¿Está seguro de cancelar este ítem? Será excluido del total del plan."
      )
    ) {
      return;
    }

    setProcesando(true);
    try {
      const response = await cancelarItemPlan(parseInt(id!), itemId);
      toast.success(response.mensaje);
      cargarPlan();
    } catch (error: any) {
      console.error("Error al cancelar ítem:", error);
      toast.error(error?.response?.data?.detail || "Error al cancelar el ítem");
    } finally {
      setProcesando(false);
    }
  };

  const handleCompletarItem = async (itemId: number) => {
    setProcesando(true);
    try {
      await completarItemPlan(parseInt(id!), itemId);
      toast.success("Ítem marcado como completado");
      cargarPlan();
    } catch (error: any) {
      console.error("Error al completar ítem:", error);
      toast.error(error?.response?.data?.detail || "Error al completar el ítem");
    } finally {
      setProcesando(false);
    }
  };

  const handleEliminarItem = async (itemId: number) => {
    if (
      !window.confirm(
        "¿Está seguro de eliminar este ítem del plan de tratamiento?"
      )
    ) {
      return;
    }

    setProcesando(true);
    try {
      await eliminarItemPlan(parseInt(id!), itemId);
      toast.success("Ítem eliminado exitosamente");
      cargarPlan();
    } catch (error: any) {
      console.error("Error al eliminar ítem:", error);
      toast.error(
        error?.response?.data?.detail ||
          "Error al eliminar el ítem. Solo se pueden eliminar ítems de planes en borrador."
      );
    } finally {
      setProcesando(false);
    }
  };

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-white">
        <TopBar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando plan de tratamiento...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!plan) {
    return <Navigate to="/planes-tratamiento" replace />;
  }

  // 🔍 DEBUG: Información de permisos de aprobación
  console.log("🔐 VALIDACIÓN DE PERMISOS PARA APROBAR:");
  console.log("Usuario logueado:", {
    codigo: user?.codigo,
    nombre: user?.nombre,
    idtipousuario: user?.idtipousuario,
    tipo: user?.idtipousuario === 1 ? "Admin" : user?.idtipousuario === 3 ? "Odontólogo" : "Otro"
  });
  console.log("Plan de tratamiento:", {
    id: plan.id,
    estado_plan: plan.estado_plan,
    es_borrador: plan.es_borrador,
    odontologo_asignado: {
      id: plan.odontologo.id,
      nombre: plan.odontologo.nombre
    }
  });
  console.log("Validación:", {
    es_admin: user?.idtipousuario === 1,
    es_odontologo: user?.idtipousuario === 3,
    es_odontologo_asignado: user?.codigo === plan.odontologo.id,
    comparacion: `${user?.codigo} === ${plan.odontologo.id} → ${user?.codigo === plan.odontologo.id}`
  });

  const puedeAprobar =
    plan.es_borrador &&
    (user?.idtipousuario === 1 ||
      (user?.idtipousuario === 3 && user?.codigo === plan.odontologo.id));

  console.log("✅ Resultado final - puedeAprobar:", puedeAprobar);
  
  // 🔍 DEBUG: Validación del backend
  if (validacion) {
    console.log("📋 VALIDACIÓN DEL BACKEND:");
    console.log("- puede_aprobar:", validacion.puede_aprobar);
    console.log("- motivos:", validacion.motivos);
    console.log("- detalles completos:", validacion.detalles);
  } else {
    console.log("⚠️ No hay validación del backend cargada");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-white">
      <TopBar />
      <Toaster position="top-right" />

      <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/planes-tratamiento")}
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
                Plan de Tratamiento #{plan.id}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Creado el {new Date(plan.fechaplan).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Acciones del Plan */}
          <div className="flex gap-2">
            {/* Botones de Sesiones - Solo para Odontólogo y Admin */}
            {!plan.es_borrador && (user?.idtipousuario === 1 || user?.idtipousuario === 3) && (
              <>
                <button
                  onClick={() => navigate(`/planes/${plan.id}/sesiones`)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Ver Sesiones
                </button>
                <button
                  onClick={() => navigate(`/planes/${plan.id}/registrar-sesion`)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Registrar Sesión
                </button>
              </>
            )}
            
            {puedeAprobar && (
              <div className="relative">
                <button
                  onClick={handleAprobarPlan}
                  disabled={procesando || (validacion && !validacion.puede_aprobar)}
                  className={`px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
                    validacion && !validacion.puede_aprobar
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                  title={
                    validacion && !validacion.puede_aprobar
                      ? validacion.motivos.join('\n')
                      : 'Aprobar plan de tratamiento'
                  }
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {validacion && !validacion.puede_aprobar ? 'No puede aprobar' : 'Aprobar Plan'}
                </button>
              </div>
            )}
            {plan.puede_editarse &&
              (user?.idtipousuario === 1 || user?.idtipousuario === 3) && (
                <button
                  onClick={() => navigate(`/planes-tratamiento/${plan.id}/editar`)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Editar Plan
                </button>
              )}
          </div>
        </header>

        {/* Información del Plan */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Información General */}
          <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm border border-cyan-100 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Información General
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Paciente</p>
                <p className="font-medium text-gray-900">
                  {plan.paciente.nombre} {plan.paciente.apellido}
                </p>
                <p className="text-sm text-gray-500">{plan.paciente.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Odontólogo</p>
                <p className="font-medium text-gray-900">
                  {plan.odontologo.nombre}
                </p>
                <p className="text-sm text-gray-500">
                  {plan.odontologo.especialidad}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Estado del Plan</p>
                <span
                  className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getEstadoPlanColor(
                    plan.estado_plan
                  )}`}
                >
                  {plan.estado_plan}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Estado de Aceptación</p>
                <p className="font-medium text-gray-900">
                  {plan.estado_aceptacion}
                </p>
              </div>
              {plan.fecha_vigencia && (
                <div>
                  <p className="text-sm text-gray-600">Vigencia</p>
                  <p className="font-medium text-gray-900">
                    {new Date(plan.fecha_vigencia).toLocaleDateString()}
                  </p>
                </div>
              )}
              {plan.fecha_aprobacion && (
                <div>
                  <p className="text-sm text-gray-600">Aprobado por</p>
                  <p className="font-medium text-gray-900">
                    {plan.usuario_aprueba_nombre}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(plan.fecha_aprobacion).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            {plan.notas_plan && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Notas del Plan</p>
                <p className="text-gray-800">{plan.notas_plan}</p>
              </div>
            )}
          </div>

          {/* Resumen Financiero */}
          <div className="bg-white/80 backdrop-blur-sm border border-cyan-100 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Resumen Financiero
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">
                  {formatearMonto(plan.subtotal_calculado)}
                </span>
              </div>
              {parseFloat(plan.descuento) > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Descuento:</span>
                  <span className="font-medium text-red-600">
                    - {formatearMonto(plan.descuento)}
                  </span>
                </div>
              )}
              <div className="pt-3 border-t border-gray-200">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-cyan-600">
                    {formatearMonto(plan.montototal)}
                  </span>
                </div>
              </div>
            </div>

            {/* Estadísticas */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                Progreso del Tratamiento
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total ítems:</span>
                  <span className="font-medium">
                    {plan.estadisticas.total_items}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Activos:</span>
                  <span className="font-medium text-green-600">
                    {plan.estadisticas.items_activos}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Completados:</span>
                  <span className="font-medium text-purple-600">
                    {plan.estadisticas.items_completados}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Cancelados:</span>
                  <span className="font-medium text-red-600">
                    {plan.estadisticas.items_cancelados}
                  </span>
                </div>
              </div>

              {/* Barra de Progreso */}
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Progreso</span>
                  <span className="font-medium">
                    {plan.estadisticas.progreso_porcentaje.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-cyan-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${plan.estadisticas.progreso_porcentaje}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ítems del Plan */}
        <div className="bg-white/80 backdrop-blur-sm border border-cyan-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Ítems del Tratamiento ({plan.items.length})
            </h3>
            {plan.puede_editarse &&
              (user?.idtipousuario === 1 || user?.idtipousuario === 3) && (
                <button
                  onClick={() => navigate(`/planes-tratamiento/${plan.id}/agregar-item`)}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Agregar Ítem
                </button>
              )}
          </div>

          {plan.items.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">
                No hay ítems en este plan de tratamiento
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {plan.items.map((item) => (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-gray-900">
                          {item.servicio_nombre}
                        </h4>
                        {item.pieza_dental_nombre && (
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                            {item.pieza_dental_nombre}
                          </span>
                        )}
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getEstadoItemColor(
                            item.estado_item
                          )}`}
                        >
                          {item.estado_item}
                        </span>
                      </div>

                      {item.servicio_descripcion && (
                        <p className="text-sm text-gray-600 mb-2">
                          {item.servicio_descripcion}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Costo:</span>{" "}
                          {formatearMonto(item.costofinal)}
                        </div>
                        <div>
                          <span className="font-medium">Duración:</span>{" "}
                          {item.tiempo_estimado} min
                        </div>
                        {item.fecha_objetivo && (
                          <div>
                            <span className="font-medium">Fecha objetivo:</span>{" "}
                            {new Date(item.fecha_objetivo).toLocaleDateString()}
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Orden:</span> #{item.orden}
                        </div>
                      </div>

                      {item.notas_item && (
                        <p className="text-sm text-gray-600 mt-2 italic">
                          {item.notas_item}
                        </p>
                      )}
                    </div>

                    {/* Acciones del Item */}
                    {(user?.idtipousuario === 1 || user?.idtipousuario === 3) && (
                      <div className="ml-4 flex flex-col gap-2">
                        {item.estado_item === "Pendiente" && (
                          <button
                            onClick={() => handleActivarItem(item.id)}
                            disabled={procesando}
                            className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors disabled:opacity-50"
                          >
                            Activar
                          </button>
                        )}
                        {item.estado_item === "Activo" && (
                          <>
                            <button
                              onClick={() => handleCompletarItem(item.id)}
                              disabled={procesando}
                              className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors disabled:opacity-50"
                            >
                              Completar
                            </button>
                            <button
                              onClick={() => handleCancelarItem(item.id)}
                              disabled={procesando}
                              className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors disabled:opacity-50"
                            >
                              Cancelar
                            </button>
                          </>
                        )}
                        {plan.puede_editarse && (
                          <button
                            onClick={() => handleEliminarItem(item.id)}
                            disabled={procesando}
                            className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alertas */}
        {validacion && !validacion.puede_aprobar && plan.es_borrador && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-red-600 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="flex-1">
                <h4 className="font-medium text-red-800">
                  No se puede aprobar este plan
                </h4>
                <ul className="text-sm text-red-700 mt-1 list-disc list-inside">
                  {validacion.motivos.map((motivo, index) => (
                    <li key={index}>{motivo}</li>
                  ))}
                </ul>
                <div className="mt-3 p-3 bg-red-100 rounded-lg">
                  <p className="text-sm text-red-800 font-medium mb-2">
                    📊 Información de Permisos:
                  </p>
                  <div className="text-xs text-red-700 space-y-1">
                    <p><strong>Tu usuario:</strong> {user?.nombre || 'N/A'} (Tipo: {
                      user?.idtipousuario === 1 ? 'Admin' : 
                      user?.idtipousuario === 3 ? 'Odontólogo' : 
                      user?.idtipousuario === 2 ? 'Paciente' : 
                      'Otro'
                    })</p>
                    <p><strong>Odontólogo asignado al plan:</strong> {plan.odontologo.nombre} (ID: {plan.odontologo.id})</p>
                    <p><strong>Tu código de usuario:</strong> {user?.codigo || 'N/A'}</p>
                    {user?.idtipousuario === 3 && user?.codigo !== plan.odontologo.id && (
                      <p className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded">
                        ⚠️ <strong>Motivo:</strong> Solo el odontólogo asignado al plan puede aprobarlo. 
                        Este plan fue creado por/para: <strong>{plan.odontologo.nombre}</strong>
                      </p>
                    )}
                    {user?.idtipousuario !== 1 && user?.idtipousuario !== 3 && (
                      <p className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded">
                        ⚠️ <strong>Motivo:</strong> Solo usuarios con rol de Administrador u Odontólogo pueden aprobar planes.
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-sm text-red-600 mt-3">
                  <strong>Estadísticas del plan:</strong> {validacion.detalles.items_activos} ítems activos, {validacion.detalles.items_pendientes} pendientes, {validacion.detalles.items_cancelados} cancelados
                </p>
              </div>
            </div>
          </div>
        )}
        
        {validacion && validacion.puede_aprobar && plan.es_borrador && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-green-600 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h4 className="font-medium text-green-800">
                  Plan listo para aprobar
                </h4>
                <p className="text-sm text-green-700 mt-1">
                  Este plan cumple todos los requisitos y puede ser aprobado. 
                  Tiene {validacion.detalles.items_activos + validacion.detalles.items_pendientes} ítems activos/pendientes de un total de {validacion.detalles.items_totales}.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {plan.es_borrador && !validacion && (
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
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
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>
                <h4 className="font-medium text-yellow-800">
                  Plan en estado Borrador
                </h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Este plan puede ser editado. Una vez que esté listo, apruébelo
                  para que sea inmutable y el paciente pueda aceptarlo.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
