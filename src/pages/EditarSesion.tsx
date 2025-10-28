import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  obtenerSesion,
  actualizarSesion,
  validarFormularioSesion,
  parsearProgreso,
} from "../services/sesionesTratamientoService";
import type {
  SesionTratamientoDetalle,
  FormularioSesion,
} from "../interfaces/SesionTratamiento";
import BarraProgresoItem from "../components/sesiones/BarraProgresoItem";
import UploadEvidencias from "../components/sesiones/UploadEvidencias";

/**
 * Página para editar una sesión existente
 * Restricciones: No se puede editar item_plan, consulta ni progreso_anterior
 */
const EditarSesion: React.FC = () => {
  const { sesionId } = useParams<{ sesionId: string }>();
  const navigate = useNavigate();

  const [sesionOriginal, setSesionOriginal] =
    useState<SesionTratamientoDetalle | null>(null);
  const [formulario, setFormulario] = useState<Partial<FormularioSesion>>({});
  const [progresoAnterior, setProgresoAnterior] = useState<number>(0);
  const [cargando, setCargando] = useState<boolean>(true);
  const [guardando, setGuardando] = useState<boolean>(false);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    cargarSesion();
  }, [sesionId]);

  const cargarSesion = async () => {
    if (!sesionId) {
      setMensaje("❌ ID de sesión no proporcionado");
      setCargando(false);
      return;
    }

    try {
      setCargando(true);
      const datos = await obtenerSesion(parseInt(sesionId));
      setSesionOriginal(datos);
      setProgresoAnterior(parsearProgreso(datos.progreso_anterior));

      // Prellenar formulario con datos existentes
      setFormulario({
        fecha_sesion: datos.fecha_sesion,
        hora_inicio: datos.hora_inicio || undefined,
        duracion_minutos: datos.duracion_minutos,
        progreso_actual: parsearProgreso(datos.progreso_actual),
        acciones_realizadas: datos.acciones_realizadas,
        notas_sesion: datos.notas_sesion || undefined,
        complicaciones: datos.complicaciones || undefined,
        evidencias: datos.evidencias,
      });
    } catch (err: any) {
      console.error("Error al cargar sesión:", err);
      setMensaje(`❌ Error: ${err.message || "Error al cargar la sesión"}`);
    } finally {
      setCargando(false);
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
        name === "duracion_minutos" || name === "progreso_actual"
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

  const handleProgresoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = parseInt(e.target.value) || 0;
    setFormulario((prev) => ({ ...prev, progreso_actual: valor }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje(null);
    setErrores({});

    if (!sesionId || !sesionOriginal) {
      setMensaje("❌ Error: No se puede actualizar la sesión");
      return;
    }

    // Validar solo los campos editables
    const erroresValidacion: Record<string, string> = {};

    if (
      formulario.progreso_actual !== undefined &&
      (formulario.progreso_actual < 0 || formulario.progreso_actual > 100)
    ) {
      erroresValidacion.progreso_actual =
        "El progreso debe estar entre 0 y 100%";
    }

    if (
      formulario.progreso_actual !== undefined &&
      formulario.progreso_actual < progresoAnterior
    ) {
      erroresValidacion.progreso_actual = `El progreso no puede ser menor a ${progresoAnterior}%`;
    }

    if (
      formulario.duracion_minutos !== undefined &&
      formulario.duracion_minutos <= 0
    ) {
      erroresValidacion.duracion_minutos =
        "La duración debe ser mayor a 0 minutos";
    }

    if (
      formulario.acciones_realizadas !== undefined &&
      !formulario.acciones_realizadas.trim()
    ) {
      erroresValidacion.acciones_realizadas =
        "Debe describir las acciones realizadas";
    }

    if (Object.keys(erroresValidacion).length > 0) {
      setErrores(erroresValidacion);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    try {
      setGuardando(true);

      // Actualizar sesión (solo campos modificables)
      await actualizarSesion(parseInt(sesionId), formulario);

      setMensaje("✅ Sesión actualizada exitosamente");

      // Redirigir después de 2 segundos
      setTimeout(() => {
        navigate(-1);
      }, 2000);
    } catch (error: any) {
      console.error("Error al actualizar sesión:", error);

      if (error.progreso_actual || error.duracion_minutos) {
        // Errores de validación del backend
        setErrores(error);
      } else {
        setMensaje(
          `❌ Error: ${error.message || "Error al actualizar sesión"}`
        );
      }

      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setGuardando(false);
    }
  };

  const handleCancelar = () => {
    if (
      window.confirm(
        "¿Está seguro de cancelar? Se perderán los cambios realizados."
      )
    ) {
      navigate(-1);
    }
  };

  if (cargando) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando sesión...</p>
        </div>
      </div>
    );
  }

  if (!sesionOriginal) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800 font-semibold mb-2">❌ Error</p>
          <p className="text-red-600">{mensaje || "Sesión no encontrada"}</p>
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

  const itemPlan =
    typeof sesionOriginal.item_plan === "object"
      ? sesionOriginal.item_plan
      : null;
  const consulta =
    typeof sesionOriginal.consulta === "object" ? sesionOriginal.consulta : null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          ✏️ Editar Sesión de Tratamiento
        </h1>
        <p className="text-gray-600 mt-1">Sesión #{sesionId}</p>
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

      {/* Información no editable */}
      <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          ℹ️ Información No Editable
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Ítem del Plan:</span>
            <p className="font-semibold text-gray-800">
              {itemPlan?.idservicio?.nombre || "N/A"}
            </p>
          </div>
          <div>
            <span className="text-gray-600">Consulta:</span>
            <p className="font-semibold text-gray-800">
              {consulta?.fecha || "N/A"}
            </p>
          </div>
          <div>
            <span className="text-gray-600">Progreso Anterior:</span>
            <p className="font-semibold text-gray-800">
              {progresoAnterior.toFixed(0)}%
            </p>
          </div>
          <div>
            <span className="text-gray-600">Registrado por:</span>
            <p className="font-semibold text-gray-800">
              {sesionOriginal.usuario_registro_nombre || "N/A"}
            </p>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        {/* Fecha y Hora */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Fecha de Sesión <span className="text-red-600">*</span>
            </label>
            <input
              type="date"
              name="fecha_sesion"
              value={formulario.fecha_sesion || ""}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errores.fecha_sesion ? "border-red-500" : "border-gray-300"
              }`}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Hora de Inicio
            </label>
            <input
              type="time"
              name="hora_inicio"
              value={formulario.hora_inicio || ""}
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
            value={formulario.duracion_minutos || 0}
            onChange={handleInputChange}
            min="1"
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errores.duracion_minutos ? "border-red-500" : "border-gray-300"
            }`}
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
              value={formulario.progreso_actual || 0}
              onChange={handleProgresoChange}
              min={progresoAnterior}
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
                value={formulario.progreso_actual || 0}
                onChange={handleProgresoChange}
                min={progresoAnterior}
                max="100"
                className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
              />
            </div>
            <BarraProgresoItem
              progreso={formulario.progreso_actual || 0}
              mostrarPorcentaje={true}
              altura="h-4"
            />
          </div>
          {errores.progreso_actual && (
            <p className="text-red-600 text-xs mt-1">
              {errores.progreso_actual}
            </p>
          )}
        </div>

        {/* Acciones Realizadas */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Acciones Realizadas <span className="text-red-600">*</span>
          </label>
          <textarea
            name="acciones_realizadas"
            value={formulario.acciones_realizadas || ""}
            onChange={handleInputChange}
            rows={4}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errores.acciones_realizadas ? "border-red-500" : "border-gray-300"
            }`}
          />
        </div>

        {/* Notas de Sesión */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Notas de Sesión
          </label>
          <textarea
            name="notas_sesion"
            value={formulario.notas_sesion || ""}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Complicaciones */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Complicaciones
          </label>
          <textarea
            name="complicaciones"
            value={formulario.complicaciones || ""}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Evidencias - TODO: Implementar upload */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Evidencias
          </label>
          <UploadEvidencias
            evidencias={formulario.evidencias || []}
            onChange={(urls) =>
              setFormulario((prev) => ({ ...prev, evidencias: urls }))
            }
            maxFiles={10}
            disabled={guardando}
          />
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleCancelar}
            disabled={guardando}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={guardando}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {guardando ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Guardando...
              </>
            ) : (
              <>💾 Guardar Cambios</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditarSesion;
