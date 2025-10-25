// src/pages/CrearPlanTratamiento.tsx
// CORREG IDO según documentación del backend (DOCUMENTACION_PLAN_TRATAMIENTO.md)

import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import TopBar from "../components/TopBar";
import { toast, Toaster } from "react-hot-toast";
import { Api } from "../lib/Api";
import {
  crearPlanTratamiento,
  formatearMonto,
} from "../services/planesTratamientoService";
import type { CrearPlanTratamientoDTO, CrearItemPlanDTO } from "../interfaces/PlanTratamiento";

// ========================================
// Interfaces según estructura del backend
// ========================================

interface Paciente {
  codigo: number;                  // ID único del paciente
  nombre: string;                  // Nombre directo (no anidado)
  apellido: string;                // Apellido directo (no anidado)
  nombre_completo: string;         // Nombre completo formateado "Nombre Apellido"
  correoelectronico: string;       // Email del usuario
  telefono?: string | null;        // Teléfono (puede ser null)
  sexo?: 'M' | 'F' | null;        // Sexo
  carnetidentidad?: string | null; // CI/DNI/Pasaporte
  fechanacimiento?: string | null; // Formato: "YYYY-MM-DD"
  direccion?: string | null;       // Dirección completa
  empresa: number;                 // ID de la empresa/clínica
}

interface Odontologo {
  codusuario: number;  // FK al usuario
  nombre: string;
  apellido: string;
  nombre_completo?: string;
  correo?: string;
  especialidad?: string;
  nromatricula?: string;
  experienciaprofesional?: string;
  empresa: number;
}

interface Servicio {
  id: number;  // Backend usa "id", no "codigo"
  nombre: string;
  descripcion?: string;
  costobase: string;  // Backend usa "costobase"
  precio_vigente?: string;
  duracion?: number;  // minutos (nombre diferente en backend)
  activo?: boolean;
}

interface PiezaDental {
  codigo: number;
  numero: string;
  nombre: string;
}

export default function CrearPlanTratamiento() {
  const { isAuth, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Datos para dropdowns
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [odontologos, setOdontologos] = useState<Odontologo[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [piezasDentales, setPiezasDentales] = useState<PiezaDental[]>([]);

  // Formulario del plan (solo campos que acepta el backend)
  const [formPlan, setFormPlan] = useState({
    codpaciente: 0,
    cododontologo: 0,
    notas_plan: "",
  });

  // Items del plan
  const [items, setItems] = useState<CrearItemPlanDTO[]>([]);
  
  // Formulario para nuevo item (según estructura del backend ACTUALIZADA)
  const [nuevoItem, setNuevoItem] = useState({
    idservicio: 0,           // Backend espera "idservicio"
    idpiezadental: null as number | null,  // Backend espera "idpiezadental"
    costofinal: 0,           // Backend espera "costofinal"
    fecha_objetivo: "",
    tiempo_estimado: 0,
    estado_item: "Pendiente" as const,  // OPCIONAL: Backend usa "Pendiente" por defecto
    notas_item: "",
    orden: 0,
  });

  // Estados auxiliares para calculadora de descuento (solo UI, no se envían al backend)
  const [precioBase, setPrecioBase] = useState(0);
  const [descuentoPorcentaje, setDescuentoPorcentaje] = useState(0);

  // Calcular costo final automáticamente cuando cambian precio base o descuento
  useEffect(() => {
    if (precioBase > 0) {
      const descuentoEnBs = (precioBase * descuentoPorcentaje) / 100;
      const costoFinal = precioBase - descuentoEnBs;
      setNuevoItem((prev) => ({ ...prev, costofinal: costoFinal }));
    }
  }, [precioBase, descuentoPorcentaje]);

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  const cargarDatosIniciales = async () => {
    try {
      const [pacientesRes, odontologosRes, serviciosRes, piezasRes] = await Promise.all([
        Api.get<{ results: Paciente[] }>("/clinic/pacientes/?page_size=1000"),
        Api.get<{ results: Odontologo[] }>("/users/odontologos/?page_size=100"),
        Api.get<{ results: Servicio[] }>("/clinic/servicios/"),
        Api.get<{ results: PiezaDental[] }>("/clinic/piezas-dentales/?page_size=100"),
      ]);

      console.log("📊 DATOS CARGADOS DEL BACKEND:");
      console.log("Pacientes RAW:", JSON.stringify(pacientesRes.data.results, null, 2));
      console.log("Primer Paciente:", pacientesRes.data.results[0]);
      console.log("Odontólogos RAW:", JSON.stringify(odontologosRes.data.results, null, 2));
      console.log("Primer Odontólogo:", odontologosRes.data.results[0]);
      console.log("Servicios RAW:", JSON.stringify(serviciosRes.data.results, null, 2));
      console.log("Primer Servicio:", serviciosRes.data.results[0]);
      console.log("Piezas Dentales:", piezasRes.data.results);

      const pacientesData = pacientesRes.data.results || [];
      const odontologosData = odontologosRes.data.results || [];
      const serviciosData = serviciosRes.data.results || [];
      const piezasData = piezasRes.data.results || [];

      setPacientes(pacientesData);
      setOdontologos(odontologosData);
      setServicios(serviciosData);
      setPiezasDentales(piezasData);

      console.log("✅ ESTADOS ACTUALIZADOS:");
      console.log(`- ${pacientesData.length} pacientes cargados`);
      console.log(`- ${odontologosData.length} odontólogos cargados`);
      console.log(`- ${serviciosData.length} servicios cargados`);
      console.log(`- ${piezasData.length} piezas dentales cargadas`);

      // Si el usuario es odontólogo, auto-seleccionarlo
      if (user?.idtipousuario === 3) {
        setFormPlan((prev) => ({ ...prev, cododontologo: user.codigo }));
      }
    } catch (error) {
      console.error("Error al cargar datos iniciales:", error);
      toast.error("Error al cargar los datos necesarios");
    }
  };

  const handleAgregarItem = () => {
    if (nuevoItem.idservicio === 0) {
      toast.error("Debe seleccionar un servicio");
      return;
    }

    if (!nuevoItem.costofinal || nuevoItem.costofinal <= 0) {
      toast.error("Debe especificar un precio válido");
      return;
    }

    // Crear el item según estructura del backend ACTUAL
    const itemCompleto: CrearItemPlanDTO = {
      idservicio: nuevoItem.idservicio,
      idpiezadental: nuevoItem.idpiezadental,
      costofinal: nuevoItem.costofinal,
      fecha_objetivo: nuevoItem.fecha_objetivo || undefined,
      tiempo_estimado: nuevoItem.tiempo_estimado || undefined,
      estado_item: "Pendiente",  // OPCIONAL: Backend asigna "Pendiente" por defecto si no se envía
      notas_item: nuevoItem.notas_item || undefined,
      orden: items.length,
    };

    setItems([...items, itemCompleto]);
    
    // Resetear formulario de item Y calculadora de descuento
    setNuevoItem({
      idservicio: 0,
      idpiezadental: null,
      costofinal: 0,
      fecha_objetivo: "",
      tiempo_estimado: 0,
      estado_item: "Pendiente",
      notas_item: "",
      orden: items.length + 1,
    });
    setPrecioBase(0);
    setDescuentoPorcentaje(0);
    
    toast.success("Item agregado a la lista");
  };

  const handleEliminarItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
    toast.success("Item eliminado de la lista");
  };

  // Cálculo de subtotal (costofinal directo, sin cantidad ni descuento)
  const calcularSubtotalItem = (item: CrearItemPlanDTO): number => {
    return item.costofinal || 0;
  };

  // Cálculo de descuento del item (no aplica en esta versión del backend)
  const calcularDescuentoItem = (item: CrearItemPlanDTO): number => {
    return 0; // Backend no maneja descuento por item
  };

  // Cálculo de total del item (igual al costofinal)
  const calcularTotalItem = (item: CrearItemPlanDTO): number => {
    return item.costofinal || 0;
  };

  // Cálculo de subtotal general
  const calcularSubtotal = (): number => {
    return items.reduce((sum, item) => sum + calcularSubtotalItem(item), 0);
  };

  // Cálculo de descuento total
  const calcularDescuentoTotal = (): number => {
    return 0; // Backend maneja descuento global, no por item
  };

  // Cálculo de total general
  const calcularTotal = (): number => {
    return items.reduce((sum, item) => sum + calcularTotalItem(item), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formPlan.codpaciente === 0) {
      toast.error("Debe seleccionar un paciente");
      return;
    }

    if (formPlan.cododontologo === 0) {
      toast.error("Debe seleccionar un odontólogo");
      return;
    }

    if (items.length === 0) {
      toast.error("Debe agregar al menos un ítem al plan");
      return;
    }

    setLoading(true);
    try {
      // Estructura según documentación ACTUALIZADA del backend
      const planData: CrearPlanTratamientoDTO = {
        codpaciente: formPlan.codpaciente,
        cododontologo: formPlan.cododontologo,
        notas_plan: formPlan.notas_plan || undefined,
        items_iniciales: items, // IMPORTANTE: Backend espera "items_iniciales"
      };

      console.log("📤 Enviando plan al backend:");
      console.log(JSON.stringify(planData, null, 2));
      console.log("✅ Backend asignará idestado automáticamente a cada item");

      const planCreado = await crearPlanTratamiento(planData);
      toast.success("Plan de tratamiento creado exitosamente");
      
      // Navegar al detalle del plan creado
      if (planCreado.id) {
        navigate(`/planes-tratamiento/${planCreado.id}`);
      } else {
        navigate("/planes-tratamiento");
      }
    } catch (error: any) {
      console.error("❌ Error al crear plan:", error);
      
      // Mostrar errores de validación del backend
      if (error?.response?.data) {
        const errorData = error.response.data;
        
        console.error("🔍 Detalle del error:", errorData);
        
        // Si hay errores de validación por campo
        if (typeof errorData === 'object' && !errorData.detail) {
          Object.entries(errorData).forEach(([campo, mensajes]) => {
            const mensaje = Array.isArray(mensajes) ? mensajes[0] : mensajes;
            toast.error(`${campo}: ${mensaje}`);
          });
        } else {
          toast.error(errorData.detail || "Error al crear el plan de tratamiento");
        }
      } else {
        toast.error("Error al crear el plan de tratamiento");
      }
    } finally {
      setLoading(false);
    }
  };

  // Auto-llenar precio cuando se selecciona un servicio
  const handleSeleccionarServicio = (idservicio: number) => {
    const servicio = servicios.find((s) => s.id === idservicio);
    if (servicio) {
      const precio = parseFloat(servicio.precio_vigente || servicio.costobase);
      
      // Actualizar precio base para la calculadora
      setPrecioBase(precio);
      setDescuentoPorcentaje(0); // Resetear descuento
      
      setNuevoItem({
        ...nuevoItem,
        idservicio,
        costofinal: precio,
        tiempo_estimado: servicio.duracion || 0,
      });
    }
  };

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  if (user?.idtipousuario !== 1 && user?.idtipousuario !== 3) {
    toast.error("No tiene permisos para crear planes de tratamiento");
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
              Crear Plan de Tratamiento
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Estado inicial: Borrador • Se puede editar hasta aprobar
            </p>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Datos del Plan */}
          <div className="bg-white/80 backdrop-blur-sm border border-cyan-100 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              📋 Información del Plan
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Paciente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Paciente <span className="text-red-500">*</span>
                </label>
                <select
                  value={formPlan.codpaciente === 0 ? "" : String(formPlan.codpaciente)}
                  onChange={(e) =>
                    setFormPlan({
                      ...formPlan,
                      codpaciente: e.target.value === "" ? 0 : Number(e.target.value),
                    })
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                >
                  <option key="default-paciente" value="">-- Seleccione un paciente --</option>
                  {pacientes.map((p) => (
                    <option key={p.codigo} value={p.codigo}>
                      {p.nombre_completo}
                      {p.carnetidentidad && ` - CI: ${p.carnetidentidad}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Odontólogo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Odontólogo <span className="text-red-500">*</span>
                </label>
                <select
                  value={formPlan.cododontologo === 0 ? "" : String(formPlan.cododontologo)}
                  onChange={(e) =>
                    setFormPlan({
                      ...formPlan,
                      cododontologo: e.target.value === "" ? 0 : Number(e.target.value),
                    })
                  }
                  required
                  disabled={user?.idtipousuario === 3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 disabled:bg-gray-100"
                >
                  <option key="default-odontologo" value="">-- Seleccione un odontólogo --</option>
                  {odontologos.map((o) => (
                    <option key={o.codusuario} value={o.codusuario}>
                      {o.nombre} {o.apellido}
                      {o.especialidad && ` - ${o.especialidad}`}
                    </option>
                  ))}
                </select>
                {user?.idtipousuario === 3 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Auto-seleccionado (usted es el odontólogo)
                  </p>
                )}
              </div>

              {/* Notas del Plan */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas del Plan
                </label>
                <textarea
                  value={formPlan.notas_plan}
                  onChange={(e) =>
                    setFormPlan({ ...formPlan, notas_plan: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  placeholder="Descripción general del plan de tratamiento (diagnóstico, objetivos, consideraciones especiales, etc.)..."
                />
              </div>
            </div>
          </div>

          {/* Agregar Items */}
          <div className="bg-white/80 backdrop-blur-sm border border-cyan-100 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              ➕ Agregar Procedimientos/Servicios
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {/* Servicio/Procedimiento */}
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                >
                  <option key="default-servicio" value="">-- Seleccione un servicio --</option>
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
                  <option key="default-pieza" value="">-- Sin pieza específica --</option>
                  {piezasDentales.map((p) => (
                    <option key={p.codigo} value={p.codigo}>
                      {p.numero} - {p.nombre}
                    </option>
                  ))}
                </select>
                {piezasDentales.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    No hay piezas dentales registradas
                  </p>
                )}
              </div>

              {/* Calculadora de Precio con Descuento */}
              <div className="col-span-full">
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
                      onChange={(e) => setPrecioBase(parseFloat(e.target.value) || 0)}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
                      placeholder="Auto-completa"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Se auto-completa al seleccionar servicio
                    </p>
                  </div>

                  {/* Descuento (%) */}
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
                    <p className="text-xs text-gray-500 mt-1">
                      Opcional: descuento a aplicar
                    </p>
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
                        // Si edita manualmente, recalcular el descuento
                        if (precioBase > 0) {
                          const descuento = ((precioBase - valor) / precioBase) * 100;
                          setDescuentoPorcentaje(Math.max(0, descuento));
                        }
                      }}
                      className="w-full px-3 py-2 border-2 border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 font-bold text-green-700 bg-green-50"
                      placeholder="0.00"
                    />
                    {descuentoPorcentaje > 0 && precioBase > 0 && (
                      <p className="text-xs text-green-600 mt-1 font-medium">
                        ✓ Ahorro: {formatearMonto((precioBase * descuentoPorcentaje) / 100)}
                      </p>
                    )}
                    {descuentoPorcentaje === 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Se calcula automáticamente
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
                  Tiempo Estimado (min)
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

              {/* Notas del Item */}
              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas del Procedimiento
                </label>
                <textarea
                  value={nuevoItem.notas_item}
                  onChange={(e) =>
                    setNuevoItem({ ...nuevoItem, notas_item: e.target.value })
                  }
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  placeholder="Observaciones específicas del procedimiento (anestesia, materiales, precauciones, etc.)..."
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleAgregarItem}
              className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 justify-center"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Agregar Procedimiento
            </button>
          </div>

          {/* Lista de Items Agregados */}
          {items.length > 0 && (
            <div className="bg-white/80 backdrop-blur-sm border border-cyan-100 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                📝 Procedimientos del Plan ({items.length})
              </h3>
              <div className="space-y-3">
                {items.map((item, index) => {
                  const servicio = servicios.find((s) => s.id === item.idservicio);
                  const pieza = item.idpiezadental
                    ? piezasDentales.find((p) => p.codigo === item.idpiezadental)
                    : null;

                  const total = calcularTotalItem(item);
                  
                  // Calcular si hubo descuento comparando con precio del servicio
                  const precioOriginal = servicio 
                    ? parseFloat(servicio.precio_vigente || servicio.costobase)
                    : item.costofinal;
                  const descuentoAplicado = precioOriginal - (item.costofinal || 0);
                  const tieneDescuento = descuentoAplicado > 0.01; // Tolerancia para decimales

                  return (
                    <div
                      key={index}
                      className="flex items-start justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">
                            {index + 1}. {servicio?.nombre || "Servicio"}
                          </span>
                          {pieza && (
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                              Pieza {pieza.numero}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 mt-2 space-y-1">
                          <div className="flex flex-wrap gap-4 items-center">
                            <span className="font-semibold text-green-700">
                              Costo Final: {formatearMonto(item.costofinal)}
                            </span>
                            {tieneDescuento && (
                              <>
                                <span className="text-gray-400 line-through">
                                  {formatearMonto(precioOriginal)}
                                </span>
                                <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full font-medium">
                                  -{formatearMonto(descuentoAplicado)} ({((descuentoAplicado / precioOriginal) * 100).toFixed(1)}% desc.)
                                </span>
                              </>
                            )}
                          </div>
                          {item.fecha_objetivo && (
                            <div>Fecha objetivo: {new Date(item.fecha_objetivo).toLocaleDateString()}</div>
                          )}
                          {item.tiempo_estimado && item.tiempo_estimado > 0 && (
                            <div>Tiempo estimado: {item.tiempo_estimado} min</div>
                          )}
                        </div>
                        {item.notas_item && (
                          <p className="text-sm text-gray-500 mt-2 italic">
                            "{item.notas_item}"
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleEliminarItem(index)}
                        className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar procedimiento"
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Resumen de Totales */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">
                      {formatearMonto(calcularSubtotal())}
                    </span>
                  </div>
                  {calcularDescuentoTotal() > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Descuento Total:</span>
                      <span className="font-medium text-red-600">
                        - {formatearMonto(calcularDescuentoTotal())}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                    <span>Total del Plan:</span>
                    <span className="text-cyan-600">
                      {formatearMonto(calcularTotal())}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 text-right">
                    Los totales se calcularán automáticamente en el servidor
                  </p>
                </div>
              </div>
            </div>
          )}

          {items.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
              ℹ️ Debe agregar al menos un procedimiento para crear el plan de tratamiento.
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
              disabled={loading || items.length === 0}
              className="px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              )}
              {loading ? "Creando plan..." : "Crear Plan de Tratamiento"}
            </button>
          </div>

          {/* Nota informativa */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            <p className="font-medium mb-1">ℹ️ Información importante:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>El plan se creará en estado <strong>Borrador</strong></li>
              <li>Podrá editar el plan y sus procedimientos mientras esté en borrador</li>
              <li>Una vez aprobado, el plan será <strong>inmutable</strong> (no se puede editar)</li>
              <li>Los totales se calculan automáticamente según los procedimientos agregados</li>
              <li>Los procedimientos cancelados no se incluyen en el total del plan</li>
            </ul>
          </div>
        </form>
      </main>
    </div>
  );
}
