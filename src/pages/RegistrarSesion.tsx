import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  crearSesion,
  validarFormularioSesion,
  formatearFecha,
  formatearHora,
} from "../services/sesionesTratamientoService";
import { obtenerPlanTratamiento } from "../services/planesTratamientoService";
import { obtenerConsultasPorPaciente } from "../services/consultasService";
import type { FormularioSesion } from "../interfaces/SesionTratamiento";
import type { PlanTratamientoDetalle, ItemPlanTratamiento } from "../interfaces/PlanTratamiento";
import type { Consulta } from "../interfaces/Consulta";
import BarraProgresoItem from "../components/sesiones/BarraProgresoItem";
import UploadEvidencias from "../components/sesiones/UploadEvidencias";

/**
 * Página para registrar una nueva sesión de tratamiento
 */
const RegistrarSesion: React.FC = () => {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();

  // Estado del formulario
  const [formulario, setFormulario] = useState<FormularioSesion>({
    item_plan: 0,
    consulta: 0,
    fecha_sesion: formatearFecha(new Date()),
    hora_inicio: formatearHora(new Date()),
    duracion_minutos: 30,
    progreso_actual: 0,
    acciones_realizadas: "",
    notas_sesion: "",
    complicaciones: "",
    evidencias: [],
  });

  // Estados auxiliares
  const [plan, setPlan] = useState<PlanTratamientoDetalle | null>(null);
  const [itemsDisponibles, setItemsDisponibles] = useState<ItemPlanTratamiento[]>([]);
  const [consultasDisponibles, setConsultasDisponibles] = useState<Consulta[]>([]);
  const [progresoAnterior, setProgresoAnterior] = useState<number>(0);
  const [cargando, setCargando] = useState<boolean>(false);
  const [cargandoDatos, setCargandoDatos] = useState<boolean>(true);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    cargarDatosIniciales();
  }, [planId]);

  const cargarDatosIniciales = async () => {
    if (!planId) {
      setMensaje("❌ Error: No se especificó el ID del plan");
      setCargandoDatos(false);
      return;
    }

    try {
      setCargandoDatos(true);

      // 1. Cargar el plan de tratamiento
      const planData = await obtenerPlanTratamiento(parseInt(planId));
      setPlan(planData);

      // 2. Cargar ítems del plan (solo activos y pendientes, no completados ni cancelados)
      const itemsActivos = planData.items.filter(
        (item) => item.estado_item === "Activo" || item.estado_item === "Pendiente"
      );
      setItemsDisponibles(itemsActivos);

      // 3. Cargar consultas DEL PACIENTE de este plan específico
      if (planData.paciente && planData.paciente.id) {
        const consultasPaciente = await obtenerConsultasPorPaciente(
          planData.paciente.id,  // ← Usar paciente.id en lugar de codpaciente
          {
            ordering: '-fecha', // Más recientes primero
          }
        );
        setConsultasDisponibles(consultasPaciente);
      } else {
        console.warn("El plan no tiene paciente asociado");
        setConsultasDisponibles([]);
      }

    } catch (error: any) {
      console.error("Error al cargar datos iniciales:", error);
      setMensaje(`❌ Error al cargar datos: ${error.message || "Error desconocido"}`);
    } finally {
      setCargandoDatos(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormulario((prev) => ({
      ...prev,
      [name]:
        name === "duracion_minutos" ||
        name === "progreso_actual" ||
        name === "item_plan" ||
        name === "consulta"
          ? parseInt(value) || 0
          : value,
    }));

    // Limpiar error del campo
    if (errores[name]) {
      setErrores((prev) => {
        const nuevos = { ...prev };
        delete nuevos[name];
        return nuevos;
      });
    }
  };

  const handleItemChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const itemId = parseInt(e.target.value);
    setFormulario((prev) => ({ ...prev, item_plan: itemId }));

    if (itemId > 0) {
      try {
        // Obtener el progreso actual del ítem desde la API
        const { obtenerProgresoItem } = await import("../services/sesionesTratamientoService");
        const progresoInfo = await obtenerProgresoItem(itemId);

        setProgresoAnterior(progresoInfo.progreso_actual);

        // Sugerir progreso actual basado en el anterior
        if (progresoInfo.progreso_actual < 100) {
          setFormulario((prev) => ({
            ...prev,
            progreso_actual: Math.min(progresoInfo.progreso_actual + 25, 100),
          }));
        } else {
          setFormulario((prev) => ({
            ...prev,
            progreso_actual: 100,
          }));
        }
      } catch (error) {
        console.error("Error al obtener progreso del ítem:", error);
        // Si falla, asumir progreso 0
        setProgresoAnterior(0);
        setFormulario((prev) => ({
          ...prev,
          progreso_actual: 25,
        }));
      }
    }
  };

  const handleProgresoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = parseInt(e.target.value) || 0;
    setFormulario((prev) => ({ ...prev, progreso_actual: valor }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje(null);
    setErrores({});

    // Validar formulario
    const erroresValidacion = validarFormularioSesion(
      formulario,
      progresoAnterior
    );

    if (erroresValidacion) {
      setErrores(erroresValidacion);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    try {
      setCargando(true);

      // Crear sesión
      const sesionCreada = await crearSesion(formulario);

      setMensaje("✅ Sesión registrada exitosamente");

      // Redirigir después de 2 segundos
      setTimeout(() => {
        navigate(`/planes/${planId}/sesiones`);
      }, 2000);
    } catch (error: any) {
      console.error("Error al crear sesión:", error);

      if (error.item_plan || error.progreso_actual || error.consulta) {
        // Errores de validación del backend
        setErrores(error);
      } else {
        setMensaje(`❌ Error: ${error.message || "Error al registrar sesión"}`);
      }

      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setCargando(false);
    }
  };

  const handleCancelar = () => {
    if (
      window.confirm(
        "¿Está seguro de cancelar? Se perderán los datos ingresados."
      )
    ) {
      navigate(-1);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          📋 Registrar Sesión de Tratamiento
        </h1>
        <p className="text-gray-600 mt-1">
          Plan de Tratamiento #{planId}
        </p>
      </div>

      {/* Mensajes */}
      {mensaje && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            mensaje.includes("✅")
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          {mensaje}
        </div>
      )}

      {/* Errores generales */}
      {Object.keys(errores).length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-semibold mb-2">
            ⚠️ Por favor corrija los siguientes errores:
          </p>
          <ul className="list-disc list-inside text-red-600 text-sm space-y-1">
            {Object.entries(errores).map(([campo, mensaje]) => (
              <li key={campo}>{mensaje}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Indicador de carga */}
      {cargandoDatos ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando datos del plan y consultas...</p>
        </div>
      ) : (
        <>
          {/* Información del paciente */}
          {plan && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Paciente:</strong> {plan.paciente_nombre} | <strong>Odontólogo:</strong> {plan.odontologo_nombre}
              </p>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
            {/* Ítem del Plan */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Ítem del Plan <span className="text-red-600">*</span>
              </label>
              <select
                name="item_plan"
                value={formulario.item_plan}
                onChange={handleItemChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errores.item_plan ? "border-red-500" : "border-gray-300"
                }`}
                required
                disabled={itemsDisponibles.length === 0}
              >
                <option value={0}>
                  {itemsDisponibles.length === 0 ? "No hay ítems disponibles" : "Seleccione un ítem"}
                </option>
                {itemsDisponibles.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.servicio_nombre} - {item.estado_item}
                    {item.pieza_dental_nombre ? ` (${item.pieza_dental_nombre})` : ""}
                  </option>
                ))}
              </select>
              {progresoAnterior > 0 && (
                <p className="text-xs text-gray-600 mt-1">
                  Progreso anterior: {progresoAnterior}%
                </p>
              )}
              {errores.item_plan && (
                <p className="text-xs text-red-600 mt-1">{errores.item_plan}</p>
              )}
            </div>

            {/* Consulta */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Consulta <span className="text-red-600">*</span>
              </label>
              <select
                name="consulta"
                value={formulario.consulta}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errores.consulta ? "border-red-500" : "border-gray-300"
                }`}
                required
                disabled={consultasDisponibles.length === 0}
              >
                <option value={0}>
                  {consultasDisponibles.length === 0
                    ? `No hay consultas registradas para ${plan?.paciente_nombre || "este paciente"}`
                    : "Seleccione una consulta"}
                </option>
                {consultasDisponibles.map((consulta) => (
                  <option key={consulta.id} value={consulta.id}>
                    {consulta.fecha}
                    {consulta.tipo_consulta && ` - ${consulta.tipo_consulta}`}
                    {consulta.horario_hora && ` (${consulta.horario_hora})`}
                  </option>
                ))}
              </select>
              {errores.consulta && (
                <p className="text-xs text-red-600 mt-1">{errores.consulta}</p>
              )}
              {consultasDisponibles.length === 0 && plan && (
                <p className="text-xs text-amber-600 mt-1">
                  ⚠️ No hay consultas disponibles para {plan.paciente_nombre}. Debe crear una consulta primero.
                </p>
              )}
            </div>

        {/* Fecha y Hora */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Fecha de Sesión <span className="text-red-600">*</span>
            </label>
            <input
              type="date"
              name="fecha_sesion"
              value={formulario.fecha_sesion}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errores.fecha_sesion ? "border-red-500" : "border-gray-300"
              }`}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Hora de Inicio (opcional)
            </label>
            <input
              type="time"
              name="hora_inicio"
              value={formulario.hora_inicio}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Duración */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Duración (minutos) <span className="text-red-600">*</span>
          </label>
          <input
            type="number"
            name="duracion_minutos"
            value={formulario.duracion_minutos}
            onChange={handleInputChange}
            min="1"
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errores.duracion_minutos ? "border-red-500" : "border-gray-300"
            }`}
            required
          />
        </div>

        {/* Progreso Actual */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Progreso Actual (%) <span className="text-red-600">*</span>
          </label>
          <div className="space-y-3">
            <input
              type="range"
              name="progreso_actual"
              value={formulario.progreso_actual}
              onChange={handleProgresoChange}
              min="0"
              max="100"
              step="5"
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">
                Progreso anterior: {progresoAnterior}%
              </span>
              <input
                type="number"
                value={formulario.progreso_actual}
                onChange={handleProgresoChange}
                min="0"
                max="100"
                className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
              />
            </div>
            <BarraProgresoItem
              progreso={formulario.progreso_actual}
              mostrarPorcentaje={true}
              altura="h-4"
            />
          </div>
          {errores.progreso_actual && (
            <p className="text-red-600 text-xs mt-1">{errores.progreso_actual}</p>
          )}
        </div>

        {/* Acciones Realizadas */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Acciones Realizadas <span className="text-red-600">*</span>
          </label>
          <textarea
            name="acciones_realizadas"
            value={formulario.acciones_realizadas}
            onChange={handleInputChange}
            rows={4}
            placeholder="Describa detalladamente las acciones realizadas durante la sesión..."
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errores.acciones_realizadas ? "border-red-500" : "border-gray-300"
            }`}
            required
          />
        </div>

        {/* Notas de Sesión */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Notas de Sesión (opcional)
          </label>
          <textarea
            name="notas_sesion"
            value={formulario.notas_sesion}
            onChange={handleInputChange}
            rows={3}
            placeholder="Notas adicionales sobre la sesión..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Complicaciones */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Complicaciones (opcional)
          </label>
          <textarea
            name="complicaciones"
            value={formulario.complicaciones}
            onChange={handleInputChange}
            rows={3}
            placeholder="Registre cualquier complicación ocurrida..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Evidencias - TODO: Implementar upload */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Evidencias (opcional)
          </label>
          <UploadEvidencias
            evidencias={formulario.evidencias || []}
            onChange={(urls) =>
              setFormulario((prev) => ({ ...prev, evidencias: urls }))
            }
            maxFiles={10}
            disabled={cargando}
          />
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleCancelar}
            disabled={cargando}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={cargando}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {cargando ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Guardando...
              </>
            ) : (
              <>💾 Guardar Sesión</>
            )}
          </button>
        </div>
      </form>
        </>
      )}
    </div>
  );
};

export default RegistrarSesion;
