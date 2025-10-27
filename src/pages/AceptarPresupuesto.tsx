// src/pages/AceptarPresupuesto.tsx
import { useState, useEffect } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import TopBar from "../components/TopBar";
import FirmaDigitalComponent from "../components/FirmaDigital";
import HistorialAceptacionesComponent from "../components/HistorialAceptaciones";
import { toast, Toaster } from "react-hot-toast";
import {
  obtenerPresupuestoDigital,
  puedeAceptarPresupuesto,
  aceptarPresupuesto,
  descargarComprobanteAceptacion,
  obtenerHistorialAceptaciones,
  formatearMonto,
  calcularDiasRestantes,
} from "../services/presupuestosDigitalesService";
import type {
  PresupuestoDigitalDetalle,
  RespuestaPuedeAceptar,
  AceptarPresupuestoDTO,
  FirmaDigital,
  HistorialAceptaciones,
} from "../interfaces/PresupuestoDigital";

export default function AceptarPresupuesto() {
  const { isAuth, user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Estados principales
  const [presupuesto, setPresupuesto] = useState<PresupuestoDigitalDetalle | null>(null);
  const [validacion, setValidacion] = useState<RespuestaPuedeAceptar | null>(null);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);

  // Estados del formulario
  const [tipoAceptacion, setTipoAceptacion] = useState<"Total" | "Parcial">("Total");
  const [itemsSeleccionados, setItemsSeleccionados] = useState<number[]>([]);
  const [firmaDigital, setFirmaDigital] = useState<FirmaDigital | null>(null);
  const [notas, setNotas] = useState("");
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [terminosAceptados, setTerminosAceptados] = useState(false);
  const [terminosExpandidos, setTerminosExpandidos] = useState(false);

  // Estados para historial de aceptaciones
  const [historialAceptaciones, setHistorialAceptaciones] = useState<HistorialAceptaciones | null>(null);
  const [itemsYaAceptados, setItemsYaAceptados] = useState<number[]>([]); // IDs de ítems ya aceptados

  // Verificar autenticación y rol
  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  if (user?.idtipousuario !== 2) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopBar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">
              Acceso Restringido
            </h3>
            <p className="text-yellow-700">
              Solo los pacientes pueden aceptar presupuestos.
            </p>
            <button
              onClick={() => navigate("/dashboard")}
              className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
            >
              Ir al Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (id) {
      cargarDatos();
    }
  }, [id]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      // Cargar presupuesto
      const presupuestoData = await obtenerPresupuestoDigital(parseInt(id!));
      setPresupuesto(presupuestoData);

      // Verificar si puede aceptar
      const validacionData = await puedeAceptarPresupuesto(parseInt(id!));
      setValidacion(validacionData);

      // Cargar historial de aceptaciones previas
      try {
        const historial = await obtenerHistorialAceptaciones(parseInt(id!));
        setHistorialAceptaciones(historial);

        // Extraer todos los IDs de ítems ya aceptados de aceptaciones previas
        const idsAceptados: number[] = [];
        if (historial.aceptaciones && historial.aceptaciones.length > 0) {
          historial.aceptaciones.forEach((aceptacion: any) => {
            if (aceptacion.items_aceptados && Array.isArray(aceptacion.items_aceptados)) {
              idsAceptados.push(...aceptacion.items_aceptados);
            }
          });
        }
        // Eliminar duplicados
        setItemsYaAceptados([...new Set(idsAceptados)]);
      } catch (error) {
        console.warn("No se pudo cargar historial de aceptaciones:", error);
        // No es crítico, continuar
      }

      // Si puede aceptar, inicializar items seleccionados (todos si es Total, excluyendo ya aceptados)
      if (validacionData.puede_aceptar && presupuestoData.items) {
        // Para aceptación total, seleccionar todos MENOS los ya aceptados
        const todosLosItems = presupuestoData.items.map((item: any) => item.id);
        setItemsSeleccionados(todosLosItems);
      }
    } catch (error: any) {
      console.error("Error al cargar datos:", error);
      toast.error(
        error?.response?.data?.detail ||
          "Error al cargar el presupuesto. Verifica que tengas acceso."
      );
      setTimeout(() => navigate("/mis-presupuestos"), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleTipoAceptacionChange = (tipo: "Total" | "Parcial") => {
    setTipoAceptacion(tipo);
    if (tipo === "Total" && presupuesto?.items) {
      // Seleccionar todos los items
      setItemsSeleccionados(presupuesto.items.map((item: any) => item.id));
    } else if (tipo === "Parcial") {
      // Limpiar selección para que el usuario elija
      setItemsSeleccionados([]);
    }
  };

  const toggleItem = (itemId: number) => {
    // Validar si el ítem ya fue aceptado previamente
    if (itemsYaAceptados.includes(itemId)) {
      toast.error(
        "Este tratamiento ya fue aceptado en una aceptación previa y no puede volver a seleccionarse.",
        { duration: 4000 }
      );
      return;
    }

    // Si es aceptación parcial, validar que el ítem permita pago parcial
    if (tipoAceptacion === "Parcial" && presupuesto?.items) {
      const item = presupuesto.items.find((i: any) => i.id === itemId);
      if (item && !item.permite_pago_parcial) {
        toast.error(
          "Este tratamiento no permite aceptación parcial. Solo puedes aceptarlo como parte del presupuesto completo.",
          { duration: 4000 }
        );
        return;
      }
    }

    setItemsSeleccionados((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleFirmaCompleta = (firma: FirmaDigital) => {
    setFirmaDigital(firma);
  };

  const handleFirmaLimpia = () => {
    setFirmaDigital(null);
  };

  const validarFormulario = (): boolean => {
    if (!terminosAceptados && presupuesto?.terminos_condiciones) {
      toast.error("Debes leer y aceptar los términos y condiciones antes de continuar");
      setTerminosExpandidos(true); // Expandir automáticamente para que los vea
      return false;
    }

    if (!firmaDigital) {
      toast.error("Debes firmar digitalmente para aceptar el presupuesto");
      return false;
    }

    if (tipoAceptacion === "Parcial" && itemsSeleccionados.length === 0) {
      toast.error("Debes seleccionar al menos un tratamiento para aceptación parcial");
      return false;
    }

    return true;
  };

  const handleAceptar = async () => {
    if (!validarFormulario()) {
      return;
    }

    setMostrarConfirmacion(true);
  };

  const confirmarAceptacion = async () => {
    setMostrarConfirmacion(false);
    setProcesando(true);

    try {
      // Validar que tenemos firma digital
      if (!firmaDigital) {
        toast.error("Error: Firma digital no generada. Por favor, firma nuevamente.");
        setProcesando(false);
        return;
      }

      // Validar user_id
      if (!user?.codigo) {
        toast.error("Error: No se pudo identificar al usuario. Por favor, vuelve a iniciar sesión.");
        setProcesando(false);
        return;
      }

      // Construir el payload
      const payload: AceptarPresupuestoDTO = {
        tipo_aceptacion: tipoAceptacion,
        firma_digital: {
          timestamp: firmaDigital.timestamp,
          user_id: user.codigo, // Usar explícitamente user.codigo del contexto
          signature_hash: firmaDigital.signature_hash,
          consent_text:
            tipoAceptacion === "Total"
              ? `Acepto todos los términos y condiciones del presupuesto dental ${presupuesto?.codigo_presupuesto}. Confirmo que he leído y entendido el plan de tratamiento completo.`
              : `Acepto únicamente los tratamientos seleccionados del presupuesto ${presupuesto?.codigo_presupuesto}. Me reservo el derecho de aceptar los demás tratamientos posteriormente.`,
          ip_address: firmaDigital.ip_address,
        },
        notas: notas.trim() || undefined,
      };

      // Agregar items solo si es parcial
      if (tipoAceptacion === "Parcial") {
        payload.items_aceptados = itemsSeleccionados;
      }

      console.log("📤 Enviando aceptación:");
      console.log("- Presupuesto ID:", id);
      console.log("- Tipo:", tipoAceptacion);
      console.log("- User ID:", user.codigo);
      console.log("- User Email:", user.correoelectronico);
      console.log("- Signature Hash:", firmaDigital.signature_hash.substring(0, 20) + "...");
      console.log("- Items seleccionados:", tipoAceptacion === "Parcial" ? itemsSeleccionados : "Todos");
      console.log("- Payload completo:", JSON.stringify(payload, null, 2));

      // Enviar aceptación
      const response = await aceptarPresupuesto(parseInt(id!), payload);

      console.log("✅ Respuesta del servidor:", response);

      // Éxito
      toast.success(
        `✅ ${response.mensaje}\n\n🎉 Presupuesto ${
          tipoAceptacion === "Total" ? "aceptado completamente" : "parcialmente aceptado"
        }`,
        { duration: 5000 }
      );

      // Descargar comprobante automáticamente
      if (response.aceptacion.puede_descargar) {
        setTimeout(() => {
          descargarComprobantePDF(response.aceptacion.id);
        }, 1000);
      }

      // Redirigir después de 3 segundos
      setTimeout(() => {
        navigate("/mis-presupuestos");
      }, 3000);
    } catch (error: any) {
      console.error("❌ Error al aceptar presupuesto:", error);
      console.error("- Error completo:", error);
      console.error("- Response status:", error.response?.status);
      console.error("- Response data:", error.response?.data);
      console.error("- Response headers:", error.response?.headers);

      // Manejo específico de errores de rate limiting (429)
      if (error.response?.status === 429) {
        const retryAfter = error.response.headers["retry-after"]; // En segundos
        let mensajeEspera = "";

        if (retryAfter) {
          const segundos = parseInt(retryAfter);
          const minutos = Math.ceil(segundos / 60);

          if (segundos < 60) {
            mensajeEspera = `${segundos} segundo${segundos !== 1 ? "s" : ""}`;
          } else if (minutos < 60) {
            mensajeEspera = `${minutos} minuto${minutos !== 1 ? "s" : ""}`;
          } else {
            const horas = Math.ceil(minutos / 60);
            mensajeEspera = `${horas} hora${horas !== 1 ? "s" : ""}`;
          }

          // Calcular hora exacta de reintentar
          const ahora = new Date();
          const momentoReintento = new Date(ahora.getTime() + segundos * 1000);
          const horaReintento = momentoReintento.toLocaleTimeString("es-BO", {
            hour: "2-digit",
            minute: "2-digit"
          });

          toast.error(
            `🚫 Límite de Aceptaciones Alcanzado\n\n` +
            `Has realizado demasiadas aceptaciones en poco tiempo.\n\n` +
            `⏱️ Podrás intentar nuevamente en: ${mensajeEspera}\n` +
            `🕐 Hora estimada: ${horaReintento}\n\n` +
            `Por seguridad, limitamos a 10 aceptaciones por hora.`,
            {
              duration: 10000,
              style: {
                maxWidth: "500px",
              }
            }
          );
        } else {
          toast.error(
            `🚫 Límite de Aceptaciones Alcanzado\n\n` +
            `Has alcanzado el límite de 10 aceptaciones por hora.\n\n` +
            `Por favor, intenta nuevamente más tarde (aproximadamente en 1 hora).`,
            { duration: 8000 }
          );
        }
      } else if (error.response?.status === 403) {
        toast.error(
          "🚫 No tienes permiso para aceptar este presupuesto.\n\nSolo el paciente asociado puede realizar esta acción."
        );
      } else if (error.response?.status === 400) {
        const detalle = error.response?.data?.detalle || error.response?.data?.error;
        toast.error(`❌ Error de validación:\n\n${detalle}`);
      } else {
        toast.error(
          error.message || "Error al aceptar el presupuesto. Intenta nuevamente."
        );
      }
    } finally {
      setProcesando(false);
    }
  };

  const descargarComprobantePDF = async (aceptacionId: number) => {
    try {
      toast.loading("Descargando comprobante...", { id: "download-pdf" });

      const blob = await descargarComprobanteAceptacion(aceptacionId);

      // Crear URL del blob
      const url = window.URL.createObjectURL(blob);

      // Crear elemento <a> temporal
      const link = document.createElement("a");
      link.href = url;
      link.download = `comprobante_${presupuesto?.codigo_presupuesto}_${new Date()
        .toISOString()
        .split("T")[0]}.pdf`;

      // Agregar al DOM, hacer click y remover
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Limpiar URL del blob
      window.URL.revokeObjectURL(url);

      toast.success("📄 Comprobante descargado correctamente", { id: "download-pdf" });
    } catch (error) {
      console.error("Error al descargar comprobante:", error);
      toast.error("Error al descargar el comprobante PDF", { id: "download-pdf" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopBar />
        <div className="flex justify-center items-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando presupuesto...</p>
          </div>
        </div>
      </div>
    );
  }

  // Si no hay presupuesto cargado, mostrar error
  if (!presupuesto) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Toaster position="top-right" />
        <TopBar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Error al cargar el presupuesto
            </h3>
            <p className="text-red-700 mb-4">
              No se pudo cargar la información del presupuesto. Por favor, verifica que tengas acceso.
            </p>
            <button
              onClick={() => navigate("/mis-presupuestos")}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Volver a Mis Presupuestos
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Renderizado principal del formulario
  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      <TopBar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/mis-presupuestos")}
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Volver a Mis Presupuestos
          </button>

          <div className="flex items-center mb-4">
            <svg
              className="w-8 h-8 text-blue-600 mr-3"
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
              <h1 className="text-3xl font-bold text-gray-900">Aceptar Presupuesto</h1>
              <p className="text-gray-600">
                Presupuesto #{presupuesto?.codigo_presupuesto || presupuesto?.codigo_corto}
              </p>
            </div>
          </div>

          {/* Información del Presupuesto */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-blue-700 font-medium mb-1">Odontólogo</p>
                <p className="text-gray-900 font-semibold">{presupuesto?.odontologo_nombre}</p>
              </div>
              <div>
                <p className="text-sm text-blue-700 font-medium mb-1">Fecha de Emisión</p>
                <p className="text-gray-900 font-semibold">
                  {presupuesto?.fecha_emision &&
                    new Date(presupuesto.fecha_emision).toLocaleDateString("es-BO", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                </p>
              </div>
              <div>
                <p className="text-sm text-blue-700 font-medium mb-1">Válido Hasta</p>
                <p className="text-gray-900 font-semibold">
                  {presupuesto?.fecha_vigencia &&
                    new Date(presupuesto.fecha_vigencia).toLocaleDateString("es-BO", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  <span className="ml-2 text-sm text-orange-600">
                    ({calcularDiasRestantes(presupuesto?.fecha_vigencia || "")} días restantes)
                  </span>
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-blue-200">
              <p className="text-sm text-blue-700 font-medium mb-1">Monto Total</p>
              <p className="text-3xl font-bold text-blue-600">{formatearMonto(presupuesto?.total || "0")}</p>
            </div>
          </div>
        </div>

        {/* Banner de Estado (si ya fue aceptado, caducado, etc.) */}
        {!validacion?.puede_aceptar && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-6 mb-6">
            <div className="flex items-start">
              <svg
                className="w-6 h-6 text-yellow-600 mr-3 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                  Estado del Presupuesto
                </h3>
                <ul className="list-disc list-inside text-yellow-700 space-y-1 mb-4">
                  {validacion?.razones.map((razon, idx) => (
                    <li key={idx}>{razon}</li>
                  ))}
                </ul>

                {/* Mostrar botón de descarga si ya fue aceptado */}
                {validacion?.validaciones?.no_aceptado_previamente === false && historialAceptaciones && historialAceptaciones.aceptaciones.length > 0 && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Este presupuesto ya fue aceptado. Puedes descargar tu comprobante a continuación.
                    </p>
                    <button
                      onClick={() => {
                        const ultimaAceptacion = historialAceptaciones.aceptaciones[0];
                        if (ultimaAceptacion?.id) {
                          descargarComprobantePDF(ultimaAceptacion.id);
                        }
                      }}
                      className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Descargar Comprobante
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Formulario de Aceptación (solo si puede aceptar) */}
        {validacion?.puede_aceptar && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Selecciona el Tipo de Aceptación</h2>

          {/* Radio Buttons: Total o Parcial */}
          <div className="space-y-4 mb-8" role="radiogroup" aria-labelledby="tipo-aceptacion-label">
            <h2 id="tipo-aceptacion-label" className="sr-only">Tipo de aceptación</h2>
            
            <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors focus-within:ring-2 focus-within:ring-blue-500">
              <input
                type="radio"
                name="tipoAceptacion"
                value="Total"
                checked={tipoAceptacion === "Total"}
                onChange={() => handleTipoAceptacionChange("Total")}
                aria-describedby="tipo-total-desc"
                className="mt-1 mr-3 h-5 w-5 text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-900">Aceptar Todo</span>
                  {tipoAceptacion === "Total" && (
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded-full">
                      Seleccionado
                    </span>
                  )}
                </div>
                <p id="tipo-total-desc" className="text-sm text-gray-600 mt-1">
                  Acepto todos los tratamientos incluidos en este presupuesto por el monto total de{" "}
                  <strong>{formatearMonto(presupuesto?.total || "0")}</strong>
                </p>
              </div>
            </label>

            <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors focus-within:ring-2 focus-within:ring-blue-500">
              <input
                type="radio"
                name="tipoAceptacion"
                value="Parcial"
                checked={tipoAceptacion === "Parcial"}
                onChange={() => handleTipoAceptacionChange("Parcial")}
                aria-describedby="tipo-parcial-desc"
                className="mt-1 mr-3 h-5 w-5 text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-900">Aceptar Solo Algunos</span>
                  {tipoAceptacion === "Parcial" && (
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded-full">
                      Seleccionado
                    </span>
                  )}
                </div>
                <p id="tipo-parcial-desc" className="text-sm text-gray-600 mt-1">
                  Selecciono únicamente los tratamientos que deseo aceptar ahora. Podré aceptar los demás
                  posteriormente.
                </p>
              </div>
            </label>
          </div>

          {/* Lista de Items (solo si es Parcial) */}
          {tipoAceptacion === "Parcial" && (
            <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Selecciona los Tratamientos a Aceptar
              </h3>
              <p className="text-sm text-blue-600 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Solo puedes seleccionar tratamientos que permitan aceptación parcial
              </p>

              {/* Mensaje si hay ítems ya aceptados */}
              {itemsYaAceptados.length > 0 && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-900">
                      {itemsYaAceptados.length} tratamiento{itemsYaAceptados.length !== 1 ? "s" : ""} ya aceptado{itemsYaAceptados.length !== 1 ? "s" : ""} previamente
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      Los tratamientos marcados con "✓ Ya aceptado" fueron aceptados en aceptaciones parciales anteriores y no pueden volver a seleccionarse.
                    </p>
                  </div>
                </div>
              )}
              <div className="space-y-3">
                {presupuesto?.items?.map((item: any) => {
                  const puedeSeleccionar = item.permite_pago_parcial;
                  const yaAceptado = itemsYaAceptados.includes(item.id);

                  return (
                    <label
                      key={item.id}
                      className={`flex items-start p-3 border rounded-lg transition-colors ${
                        yaAceptado
                          ? "bg-green-50 border-green-300 cursor-not-allowed opacity-75"
                          : puedeSeleccionar
                          ? "bg-white border-gray-200 cursor-pointer hover:border-blue-400"
                          : "bg-gray-100 border-gray-300 cursor-not-allowed opacity-60"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={itemsSeleccionados.includes(item.id) || yaAceptado}
                        onChange={() => toggleItem(item.id)}
                        disabled={!puedeSeleccionar || yaAceptado}
                        className="mt-1 mr-3 h-5 w-5 text-blue-600 rounded disabled:cursor-not-allowed disabled:opacity-50"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className={`font-medium ${
                                yaAceptado ? "text-green-900" : puedeSeleccionar ? "text-gray-900" : "text-gray-500"
                              }`}>
                                {item.servicio_nombre || item.descripcion}
                              </p>

                              {/* Badge de estado principal */}
                              {yaAceptado ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-600 text-white">
                                  ✓ Ya aceptado
                                </span>
                              ) : puedeSeleccionar ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                  ✓ Seleccionable
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                  ✗ Solo aceptación total
                                </span>
                              )}
                            </div>
                            {item.servicio_descripcion && (
                              <p className={`text-sm mt-1 ${puedeSeleccionar ? "text-gray-600" : "text-gray-500"}`}>
                                {item.servicio_descripcion}
                              </p>
                            )}
                            {item.pieza_dental && (
                              <p className="text-xs text-gray-500 mt-1">Pieza dental: {item.pieza_dental}</p>
                            )}
                          </div>
                          <div className="text-right ml-4">
                            <p className={`font-bold ${puedeSeleccionar ? "text-blue-600" : "text-gray-500"}`}>
                              {formatearMonto(item.precio_final || item.precio_unitario || 0)}
                            </p>
                            {puedeSeleccionar && item.cantidad_cuotas && (
                              <p className="text-xs text-green-600 mt-1">
                                {item.cantidad_cuotas} cuotas disponibles
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
              {itemsSeleccionados.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">
                    {itemsSeleccionados.length} {itemsSeleccionados.length === 1 ? "tratamiento seleccionado" : "tratamientos seleccionados"}
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Los tratamientos no seleccionados podrán ser aceptados en el futuro.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Términos y Condiciones */}
          {presupuesto?.terminos_condiciones && (
            <div className="mb-8">
              <div className="border-2 border-blue-200 rounded-lg overflow-hidden">
                {/* Header colapsable */}
                <button
                  onClick={() => setTerminosExpandidos(!terminosExpandidos)}
                  className="w-full px-4 py-3 bg-blue-50 hover:bg-blue-100 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div className="text-left">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Términos y Condiciones del Presupuesto
                      </h3>
                      <p className="text-sm text-gray-600">
                        {terminosExpandidos ? "Clic para contraer" : "Clic para leer (obligatorio)"}
                      </p>
                    </div>
                  </div>
                  <svg
                    className={`w-6 h-6 text-blue-600 transition-transform ${terminosExpandidos ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Contenido expandible */}
                {terminosExpandidos && (
                  <div className="p-6 bg-white border-t-2 border-blue-200">
                    <div className="prose max-w-none text-gray-700 text-sm mb-6 max-h-96 overflow-y-auto p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <pre className="whitespace-pre-wrap font-sans text-sm">
                        {presupuesto.terminos_condiciones}
                      </pre>
                    </div>

                    {/* Checkbox de aceptación */}
                    <label className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors">
                      <input
                        type="checkbox"
                        checked={terminosAceptados}
                        onChange={(e) => setTerminosAceptados(e.target.checked)}
                        className="mt-1 h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          He leído y acepto los términos y condiciones
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Al marcar esta casilla confirmo que he leído, entendido y acepto todos los términos y
                          condiciones descritos en este documento.
                        </p>
                      </div>
                    </label>

                    {terminosAceptados && (
                      <div className="mt-3 flex items-center gap-2 text-green-700 text-sm">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium">Términos aceptados correctamente</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Advertencia si no ha aceptado */}
              {!terminosAceptados && (
                <div className="mt-3 flex items-start gap-2 text-amber-700 text-sm bg-amber-50 p-3 rounded-lg border border-amber-200">
                  <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p>Debes leer y aceptar los términos y condiciones antes de continuar con la aceptación del presupuesto.</p>
                </div>
              )}
            </div>
          )}

          {/* Componente Firma Digital */}
          <div className="mb-8">
            <FirmaDigitalComponent
              presupuestoId={presupuesto?.id || 0}
              userId={user?.codigo || 0}
              consentText={
                tipoAceptacion === "Total"
                  ? `Acepto todos los términos y condiciones del presupuesto dental ${
                      presupuesto?.codigo_presupuesto || presupuesto?.codigo_corto
                    }. Confirmo que he leído y entendido el plan de tratamiento completo, incluyendo todos los procedimientos dentales, costos asociados y condiciones de pago. Autorizo al odontólogo a proceder con los tratamientos especificados.`
                  : `Acepto únicamente los tratamientos seleccionados del presupuesto ${
                      presupuesto?.codigo_presupuesto || presupuesto?.codigo_corto
                    }. Me reservo el derecho de aceptar los demás tratamientos posteriormente. Confirmo que he leído y entendido los procedimientos que acepto en este momento.`
              }
              onFirmaCompleta={handleFirmaCompleta}
              onFirmaLimpia={handleFirmaLimpia}
            />
          </div>

          {/* Notas Opcionales */}
          <div className="mb-8">
            <label 
              htmlFor="notas-adicionales"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Notas Adicionales (Opcional)
            </label>
            <textarea
              id="notas-adicionales"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={4}
              maxLength={500}
              placeholder="Ejemplo: Deseo programar la primera cita lo antes posible..."
              aria-describedby="notas-helper"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            <div className="flex justify-between items-center mt-1">
              <p id="notas-helper" className="text-xs text-gray-500">
                Puedes agregar comentarios o solicitudes especiales sobre tu tratamiento
              </p>
              <p className="text-xs text-gray-500">
                {notas.length}/500
              </p>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="button"
              onClick={() => navigate("/mis-presupuestos")}
              aria-label="Cancelar y volver a mis presupuestos"
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleAceptar}
              disabled={!firmaDigital || procesando || (tipoAceptacion === "Parcial" && itemsSeleccionados.length === 0)}
              aria-label={
                !firmaDigital 
                  ? "Debe firmar digitalmente antes de aceptar" 
                  : tipoAceptacion === "Parcial" && itemsSeleccionados.length === 0
                  ? "Debe seleccionar al menos un tratamiento"
                  : "Aceptar presupuesto"
              }
              className="flex-1 inline-flex justify-center items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105 active:scale-95"
            >
              {procesando ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Procesando...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Aceptar Presupuesto
                </>
              )}
            </button>
          </div>
        </div>
        )}

        {/* Historial de Aceptaciones (si existe) */}
        {historialAceptaciones && historialAceptaciones.total_aceptaciones > 0 && (
          <div className="mt-8">
            <HistorialAceptacionesComponent
              presupuestoId={parseInt(id!)}
              codigoPresupuesto={presupuesto?.codigo_corto || presupuesto?.codigo_presupuesto || ""}
            />
          </div>
        )}
      </div>

      {/* Modal de Confirmación */}
      {mostrarConfirmacion && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="bg-white rounded-lg max-w-md w-full p-6 animate-slideUp shadow-2xl">
            <div className="flex items-center mb-4">
              <div className="bg-blue-100 rounded-full p-3 mr-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 id="modal-title" className="text-xl font-bold text-gray-900">Confirmar Aceptación</h3>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                Estás a punto de aceptar{" "}
                <strong>
                  {tipoAceptacion === "Total"
                    ? "todos los tratamientos"
                    : `${itemsSeleccionados.length} tratamiento(s)`}
                </strong>{" "}
                del presupuesto #{presupuesto?.codigo_presupuesto || presupuesto?.codigo_corto}.
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-900 mb-2">Resumen:</p>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Tipo: Aceptación {tipoAceptacion}</li>
                  <li>
                    • Tratamientos: {tipoAceptacion === "Total" ? presupuesto?.items?.length || 0 : itemsSeleccionados.length}
                  </li>
                  <li>
                    • Monto{tipoAceptacion === "Parcial" ? " parcial" : " total"}: {formatearMonto(
                      tipoAceptacion === "Total"
                        ? presupuesto?.total || 0
                        : presupuesto?.items
                            ?.filter((item: any) => itemsSeleccionados.includes(item.id))
                            .reduce((sum: number, item: any) => {
                              const precio = item.precio_final || item.precio_unitario || 0;
                              const precioNum = typeof precio === 'string' ? parseFloat(precio) : precio;
                              return sum + (isNaN(precioNum) ? 0 : precioNum);
                            }, 0) || 0
                    )}
                  </li>
                  <li>• Firma digital: Capturada ✓</li>
                  {terminosAceptados && presupuesto?.terminos_condiciones && (
                    <li>• Términos y condiciones: Aceptados ✓</li>
                  )}
                  {notas && <li>• Notas: Incluidas ✓</li>}
                </ul>
              </div>

              <p className="text-xs text-gray-500 mt-4">
                ⚠️ Una vez aceptado, se generará un comprobante PDF con código QR para verificación. Esta acción
                quedará registrada en el sistema.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setMostrarConfirmacion(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarAceptacion}
                className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
