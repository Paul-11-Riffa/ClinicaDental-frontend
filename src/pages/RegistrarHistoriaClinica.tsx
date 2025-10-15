// src/pages/RegistrarHistoriaClinica.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import ProtectedRoute from "../components/ProtectedRoute";
import { Api } from "../lib/Api";
import { toast, Toaster } from "react-hot-toast";

type PacienteApi = {
  codusuario: {
    codigo: number;
    nombre: string;
    apellido: string;
    correoelectronico: string;
    telefono?: string;
  };
  carnetidentidad?: string | null;
  fechanacimiento?: string | null;
  direccion?: string | null;
};

type HCECreatePayload = {
  pacientecodigo: number;
  alergias?: string;
  enfermedades?: string;
  motivoconsulta?: string;
  diagnostico?: string;
};

type DocumentoUpload = {
  file: File;
  tipo_documento: string;
  fecha_documento: string;
  notas: string;
  preview?: string;
};

// --- API local (solo crear) ---
async function crearHistoriaClinica(payload: HCECreatePayload) {
  const { data } = await Api.post("/historias-clinicas/", payload);
  return data;
}

export default function RegistrarHistoriaClinica() {
  const navigate = useNavigate();

  // Pacientes para el select
  const [pacientes, setPacientes] = useState<PacienteApi[]>([]);
  const [loadingPacientes, setLoadingPacientes] = useState(true);

  // Form
  const [pacienteId, setPacienteId] = useState<number | "">("");
  const [alergias, setAlergias] = useState("");
  const [enfermedades, setEnfermedades] = useState("");
  const [motivoconsulta, setMotivo] = useState("");
  const [diagnostico, setDiagnostico] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Estado para documentos clínicos
  const [documentos, setDocumentos] = useState<DocumentoUpload[]>([]);
  const [showDocumentos, setShowDocumentos] = useState(false);

  // Estado para modal de confirmación de duplicado
  const [showDuplicadoModal, setShowDuplicadoModal] = useState(false);
  const [datosFormularioPendiente, setDatosFormularioPendiente] = useState<{
    pacienteId: number;
    alergias: string;
    enfermedades: string;
    motivoconsulta: string;
    diagnostico: string;
    documentosSubidos: string[];
  } | null>(null);

  // Cargar pacientes iniciales
  useEffect(() => {
    (async () => {
      try {
        // Este endpoint del backend ya devuelve SOLO pacientes
        const { data } = await Api.get("/pacientes/?limit=1000&ordering=codusuario");
        const list = Array.isArray(data) ? data : (data?.results ?? []);
        setPacientes(list || []);
      } catch {
        setPacientes([]);
        toast.error("No se pudieron cargar pacientes");
      } finally {
        setLoadingPacientes(false);
      }
    })();
  }, []);

  // Opciones del select
  const optionsPacientes = useMemo(
    () =>
      Array.isArray(pacientes)
        ? pacientes.map((p) => ({
            id: p?.codusuario?.codigo,
            label: `${p?.codusuario?.nombre ?? ""} ${p?.codusuario?.apellido ?? ""}`.trim(),
          }))
        : [],
    [pacientes]
  );

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("=== INICIO DEL SUBMIT ===");
    console.log("Paciente ID:", pacienteId);
    console.log("Cantidad de documentos:", documentos.length);

    if (!pacienteId) {
      toast.error("Selecciona un paciente");
      return;
    }

    // Validar que todos los documentos tengan tipo seleccionado
    if (documentos.length > 0) {
      console.log("Validando documentos...");

      const documentosIncompletos = documentos.filter((doc) => !doc.tipo_documento);
      if (documentosIncompletos.length > 0) {
        console.log("Documentos incompletos encontrados:", documentosIncompletos.length);
        toast.error("Todos los documentos deben tener un tipo seleccionado");
        return;
      }

      // Validar tamaño total de archivos
      const tamanioTotal = documentos.reduce((sum, doc) => sum + doc.file.size, 0);
      const tamanioTotalMB = tamanioTotal / (1024 * 1024);

      console.log("Tamaño total de archivos:", tamanioTotalMB.toFixed(2), "MB");

      if (tamanioTotalMB > 10) {
        console.log("ERROR: Tamaño excede el límite");
        toast.error(
          `El tamaño total de los archivos (${tamanioTotalMB.toFixed(2)} MB) excede el límite de 10 MB. Por favor, elimina algunos archivos.`,
          { duration: 5000 }
        );
        return;
      }
    }

    setSubmitting(true);

    // DECLARAR AQUÍ para que esté disponible en todo el scope (try y catch)
    const documentosSubidosIds: string[] = [];

    try {
      // PRIMERO: Subir documentos si hay alguno (antes de crear la historia clínica)
      if (documentos.length > 0) {
        console.log("=== INICIANDO SUBIDA DE DOCUMENTOS ===");
        toast.loading("Subiendo documentos clínicos...", { id: "uploading-docs" });

        let errorCount = 0;
        let successCount = 0;

        for (let i = 0; i < documentos.length; i++) {
          const doc = documentos[i];
          console.log(`\n--- Documento ${i + 1}/${documentos.length} ---`);
          console.log("Nombre archivo:", doc.file.name);
          console.log("Tamaño:", (doc.file.size / (1024 * 1024)).toFixed(2), "MB");
          console.log("Tipo:", doc.tipo_documento);
          console.log("Fecha:", doc.fecha_documento);
          console.log("Notas:", doc.notas || "(sin notas)");

          try {
            const formData = new FormData();
            formData.append("archivo", doc.file);
            formData.append("codpaciente", String(pacienteId));
            formData.append("tipo_documento", doc.tipo_documento);
            formData.append("fecha_documento", doc.fecha_documento);
            if (doc.notas) {
              formData.append("notas", doc.notas);
            }

            console.log("Enviando FormData al servidor...");
            console.log("Endpoint: /documentos-clinicos/upload/");

            // Log de FormData para debugging
            for (const [key, value] of formData.entries()) {
              if (key === "archivo") {
                console.log(`  ${key}:`, (value as File).name, (value as File).size, "bytes");
              } else {
                console.log(`  ${key}:`, value);
              }
            }

            const response = await Api.post("/documentos-clinicos/upload/", formData, {
              headers: { "Content-Type": "multipart/form-data" },
            });

            console.log("✅ Documento subido exitosamente:", response.data);
            documentosSubidosIds.push(response.data.id);
            successCount++;

          } catch (err: unknown) {
            console.error("❌ ERROR subiendo documento:", err);
            errorCount++;

            const error = err as {
              response?: {
                data?: {
                  archivo?: string[];
                  detail?: string;
                  [key: string]: unknown;
                };
                status?: number;
                statusText?: string;
              };
              message?: string;
            };

            console.log("Detalles del error:");
            console.log("  Status:", error?.response?.status);
            console.log("  Status Text:", error?.response?.statusText);
            console.log("  Response Data:", JSON.stringify(error?.response?.data, null, 2));
            console.log("  Error Message:", error?.message);

            const errorMsg =
              error?.response?.data?.archivo?.[0] ||
              error?.response?.data?.detail ||
              error?.message ||
              `Error subiendo ${doc.file.name}`;

            toast.error(errorMsg, { duration: 4000 });
          }
        }

        toast.dismiss("uploading-docs");

        console.log("\n=== RESUMEN DE SUBIDA ===");
        console.log("Exitosos:", successCount);
        console.log("Errores:", errorCount);
        console.log("IDs subidos:", documentosSubidosIds);

        if (errorCount > 0) {
          console.log("❌ Hay errores en la subida. NO se creará la historia clínica.");
          toast.error(
            `${errorCount} documento(s) no se pudieron subir. Por favor, verifica los archivos e intenta nuevamente.`,
            { duration: 6000 }
          );
          setSubmitting(false);
          return; // DETENER AQUÍ si hay errores
        }

        if (successCount > 0) {
          toast.success(`${successCount} documento(s) subido(s) correctamente`);
        }
      }

      // SEGUNDO: Solo si los documentos se subieron exitosamente (o no hay documentos), crear la historia clínica
      console.log("\n=== CREANDO HISTORIA CLÍNICA ===");
      console.log("Payload:", {
        pacientecodigo: Number(pacienteId),
        alergias: alergias || undefined,
        enfermedades: enfermedades || undefined,
        motivoconsulta: motivoconsulta || undefined,
        diagnostico: diagnostico || undefined,
      });

      const historiaCreada = await crearHistoriaClinica({
        pacientecodigo: Number(pacienteId),
        alergias: alergias || undefined,
        enfermedades: enfermedades || undefined,
        motivoconsulta: motivoconsulta || undefined,
        diagnostico: diagnostico || undefined,
      });

      console.log("✅ Historia clínica creada:", historiaCreada);
      console.log("🔍 ID de historia:", historiaCreada.id);

      if (!historiaCreada.id) {
        console.error("❌ ERROR: El backend no devolvió el ID de la historia clínica");
        throw new Error("No se pudo obtener el ID de la historia clínica creada");
      }

      const historiaId = historiaCreada.id;
      toast.success("Historia clínica registrada exitosamente");

      // TERCERO: Vincular los documentos a la historia clínica si se subieron antes
      if (documentosSubidosIds.length > 0) {
        console.log("\n=== VINCULANDO DOCUMENTOS A HISTORIA CLÍNICA ===");
        console.log("Historia ID:", historiaId);
        console.log("Documentos a vincular:", documentosSubidosIds);

        toast.loading("Vinculando documentos a la historia clínica...", { id: "linking-docs" });

        let vinculacionErrores = 0;

        for (const documentoId of documentosSubidosIds) {
          try {
            console.log(`\n🔗 Vinculando documento ${documentoId} a historia ${historiaId}`);
            console.log("📤 Payload enviado:", { idhistorialclinico: historiaId });
            console.log("📍 URL:", `/documentos-clinicos/${documentoId}/`);

            const response = await Api.patch(`/documentos-clinicos/${documentoId}/`, {
              idhistorialclinico: historiaId  // Sin _id, el backend lo maneja
            });

            console.log(`✅ Documento ${documentoId} vinculado exitosamente`);
            console.log("📥 Response completa:", JSON.stringify(response.data, null, 2));
            console.log("🔍 idhistorialclinico en respuesta:", response.data.idhistorialclinico);

            // Verificar que realmente se guardó
            if (response.data.idhistorialclinico === historiaId) {
              console.log("✅ CONFIRMADO: idhistorialclinico se guardó correctamente");
            } else {
              console.warn("⚠️ ADVERTENCIA: idhistorialclinico NO coincide");
              console.warn("   Esperado:", historiaId);
              console.warn("   Recibido:", response.data.idhistorialclinico);
            }
          } catch (err: unknown) {
            console.error(`❌ Error vinculando documento ${documentoId}:`, err);
            vinculacionErrores++;

            const error = err as {
              response?: {
                data?: { [key: string]: unknown };
                status?: number;
              };
              message?: string;
            };

            console.log("Detalles del error de vinculación:");
            console.log("  Status:", error?.response?.status);
            console.log("  Response Data:", JSON.stringify(error?.response?.data, null, 2));
          }
        }

        toast.dismiss("linking-docs");

        if (vinculacionErrores === 0) {
          console.log("✅ Todos los documentos vinculados exitosamente");
        } else {
          console.log(`⚠️ ${vinculacionErrores} documento(s) no se pudieron vincular`);
          toast.error(`${vinculacionErrores} documento(s) no se pudieron vincular a la historia`, { duration: 4000 });
        }
      }

      // Limpieza del formulario
      console.log("\n=== LIMPIANDO FORMULARIO ===");
      setMotivo("");
      setDiagnostico("");
      setAlergias("");
      setEnfermedades("");
      setDocumentos([]);
      setShowDocumentos(false);

      // Redirigir al AdminDashboard
      console.log("Redirigiendo al dashboard en 1.5 segundos...");
      setTimeout(() => navigate("/dashboard"), 1500);

    } catch (err: unknown) {
      console.error("❌ ERROR GENERAL:", err);

      const error = err as {
        response?: {
          data?: {
            detail?: string;
            non_field_errors?: string[];
            duplicado?: string;
            [key: string]: unknown;
          };
          status?: number;
        };
        message?: string;
      };

      console.log("Detalles del error general:");
      console.log("  Status:", error?.response?.status);
      console.log("  Response Data:", JSON.stringify(error?.response?.data, null, 2));
      console.log("  Message:", error?.message);

      // Detectar error de duplicado
      if (error?.response?.data?.duplicado) {
        console.log("⚠️ Error de duplicado detectado");
        setDatosFormularioPendiente({
          pacienteId: Number(pacienteId),
          alergias,
          enfermedades,
          motivoconsulta,
          diagnostico,
          documentosSubidos: documentosSubidosIds,
        });
        setShowDuplicadoModal(true);
        setSubmitting(false);
        return; // NO hacer rollback aquí porque el usuario puede confirmar
      }

      // Si la historia clínica falló pero había documentos subidos, hacer rollback
      if (documentosSubidosIds.length > 0) {
        console.log("\n=== ⚠️ ROLLBACK: Eliminando documentos huérfanos ===");
        console.log("Documentos a eliminar:", documentosSubidosIds);
        toast.loading("Limpiando documentos...", { id: "rollback-docs" });

        for (const documentoId of documentosSubidosIds) {
          try {
            console.log(`Eliminando documento ${documentoId}`);
            await Api.delete(`/documentos-clinicos/${documentoId}/`);
            console.log(`✅ Documento ${documentoId} eliminado`);
          } catch (deleteErr) {
            console.error(`❌ Error al eliminar documento ${documentoId}:`, deleteErr);
          }
        }

        toast.dismiss("rollback-docs");
        console.log("✅ Rollback completado");
      }

      const msg =
        error?.response?.data?.detail ||
        error?.response?.data?.non_field_errors?.[0] ||
        error?.message ||
        "No se pudo registrar la historia";

      toast.error(String(msg));
    } finally {
      console.log("\n=== FIN DEL SUBMIT ===\n");
      setSubmitting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newDocs: DocumentoUpload[] = [];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".pdf", ".dcm", ".dicom"];

    Array.from(files).forEach((file) => {
      // Validar tamaño
      if (file.size > maxSize) {
        toast.error(`${file.name} excede el tamaño máximo de 10MB`);
        return;
      }

      // Validar extensión
      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      if (!allowedExtensions.includes(ext)) {
        toast.error(`${file.name} tiene una extensión no permitida`);
        return;
      }

      const doc: DocumentoUpload = {
        file,
        tipo_documento: "",
        fecha_documento: new Date().toISOString().split("T")[0],
        notas: "",
      };

      // Preview para imágenes
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          doc.preview = reader.result as string;
          setDocumentos((prev) => [...prev]);
        };
        reader.readAsDataURL(file);
      }

      newDocs.push(doc);
    });

    setDocumentos((prev) => [...prev, ...newDocs]);
    e.target.value = ""; // Reset input
  };

  const removeDocumento = (index: number) => {
    setDocumentos((prev) => prev.filter((_, i) => i !== index));
  };

  const updateDocumento = (index: number, field: keyof DocumentoUpload, value: string) => {
    setDocumentos((prev) =>
      prev.map((doc, i) => (i === index ? { ...doc, [field]: value } : doc))
    );
  };

  const confirmarNuevoEpisodio = async () => {
    if (!datosFormularioPendiente) return;

    console.log("=== FORZANDO NUEVO EPISODIO ===");
    setShowDuplicadoModal(false);
    setSubmitting(true);

    try {
      // Crear historia clínica con forzar_nuevo_episodio=true
      const { data: historiaCreada } = await Api.post("/historias-clinicas/?forzar_nuevo_episodio=true", {
        pacientecodigo: datosFormularioPendiente.pacienteId,
        alergias: datosFormularioPendiente.alergias || undefined,
        enfermedades: datosFormularioPendiente.enfermedades || undefined,
        motivoconsulta: datosFormularioPendiente.motivoconsulta || undefined,
        diagnostico: datosFormularioPendiente.diagnostico || undefined,
      });

      console.log("✅ Historia clínica creada con nuevo episodio:", historiaCreada);
      toast.success("Historia clínica registrada exitosamente (nuevo episodio)");

      // Vincular documentos si los hay
      if (datosFormularioPendiente.documentosSubidos.length > 0) {
        console.log("\n=== VINCULANDO DOCUMENTOS A NUEVA HISTORIA CLÍNICA ===");
        toast.loading("Vinculando documentos...", { id: "linking-docs" });

        for (const documentoId of datosFormularioPendiente.documentosSubidos) {
          try {
            console.log(`Vinculando documento ${documentoId} a historia ${historiaCreada.id}`);

            await Api.patch(`/documentos-clinicos/${documentoId}/`, {
              idhistorialclinico: historiaCreada.id
            });

            console.log(`✅ Documento ${documentoId} vinculado`);
          } catch (err) {
            console.error(`❌ Error vinculando documento ${documentoId}:`, err);
          }
        }

        toast.dismiss("linking-docs");
      }

      // Limpieza
      setMotivo("");
      setDiagnostico("");
      setAlergias("");
      setEnfermedades("");
      setDocumentos([]);
      setShowDocumentos(false);
      setDatosFormularioPendiente(null);

      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (err: unknown) {
      console.error("❌ ERROR al forzar nuevo episodio:", err);
      toast.error("No se pudo crear el nuevo episodio");
    } finally {
      setSubmitting(false);
    }
  };

  const cancelarNuevoEpisodio = async () => {
    console.log("❌ Usuario canceló la creación del nuevo episodio");

    // Si hay documentos subidos, eliminarlos (rollback)
    if (datosFormularioPendiente?.documentosSubidos && datosFormularioPendiente.documentosSubidos.length > 0) {
      console.log("\n=== 🗑️ ROLLBACK: Eliminando documentos por cancelación ===");
      console.log("Documentos a eliminar:", datosFormularioPendiente.documentosSubidos);

      toast.loading("Limpiando documentos...", { id: "rollback-cancel" });

      for (const documentoId of datosFormularioPendiente.documentosSubidos) {
        try {
          console.log(`Eliminando documento ${documentoId}`);
          await Api.delete(`/documentos-clinicos/${documentoId}/`);
          console.log(`✅ Documento ${documentoId} eliminado de S3 y BD`);
        } catch (deleteErr) {
          console.error(`❌ Error al eliminar documento ${documentoId}:`, deleteErr);
        }
      }

      toast.dismiss("rollback-cancel");
      toast.success("Documentos eliminados correctamente");
      console.log("✅ Rollback por cancelación completado");
    }

    setShowDuplicadoModal(false);
    setDatosFormularioPendiente(null);
    setSubmitting(false);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-white">
        <TopBar />
        <Toaster />

        <main className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          <header className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800">
              Registrar Historia Clínica
            </h1>
            <p className="text-gray-500">
              Completa los datos y asocia la HCE al paciente.
            </p>
          </header>

          {/* Formulario */}
          <form
            onSubmit={onSubmit}
            className="bg-white rounded-2xl shadow p-4 sm:p-6 grid gap-4 sm:gap-5"
          >
            {/* Paciente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Paciente <span className="text-red-500">*</span>
              </label>
              <select
                value={pacienteId}
                onChange={(e) => setPacienteId(e.target.value ? Number(e.target.value) : "")}
                required
                className="w-full border rounded-lg p-2"
                disabled={loadingPacientes}
              >
                <option value="">Selecciona…</option>
                {optionsPacientes.map((op) => (
                  <option key={op.id} value={op.id}>
                    {op.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Campos clínicos (mismo tamaño/estilo) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo de consulta
                </label>
                <textarea
                  value={motivoconsulta}
                  onChange={(e) => setMotivo(e.target.value)}
                  className="w-full border rounded-lg p-3 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-200"
                  placeholder="Dolor en molar 26…"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Diagnóstico
                </label>
                <textarea
                  value={diagnostico}
                  onChange={(e) => setDiagnostico(e.target.value)}
                  className="w-full border rounded-lg p-3 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-200"
                  placeholder="Caries clase II…"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alergias
                </label>
                <textarea
                  value={alergias}
                  onChange={(e) => setAlergias(e.target.value)}
                  className="w-full border rounded-lg p-3 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-200"
                  placeholder="Penicilina…"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enfermedades
                </label>
                <textarea
                  value={enfermedades}
                  onChange={(e) => setEnfermedades(e.target.value)}
                  className="w-full border rounded-lg p-3 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-200"
                  placeholder="Asma…"
                />
              </div>
            </div>

            {/* Sección de Documentos Clínicos */}
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-800">
                  Documentos Clínicos (Opcional)
                </h2>
                <button
                  type="button"
                  onClick={() => setShowDocumentos(!showDocumentos)}
                  className="text-cyan-600 hover:text-cyan-700 text-sm font-medium"
                >
                  {showDocumentos ? "Ocultar" : "Agregar documentos"}
                </button>
              </div>

              {showDocumentos && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <input
                      type="file"
                      id="file-upload"
                      multiple
                      accept=".jpg,.jpeg,.png,.pdf,.dcm,.dicom"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <svg
                        className="w-12 h-12 text-gray-400 mb-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      <span className="text-cyan-600 font-medium">
                        Seleccionar archivos
                      </span>
                      <span className="text-xs text-gray-500 mt-1">
                        JPG, PNG, PDF, DICOM (Max. 10MB)
                      </span>
                    </label>
                  </div>

                  {/* Indicador de tamaño total */}
                  {documentos.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                          Tamaño total de archivos:
                        </span>
                        <span
                          className={`text-sm font-bold ${
                            (() => {
                              const total = documentos.reduce((sum, doc) => sum + doc.file.size, 0) / (1024 * 1024);
                              if (total > 10) return "text-red-600";
                              if (total > 8) return "text-yellow-600";
                              return "text-green-600";
                            })()
                          }`}
                        >
                          {(documentos.reduce((sum, doc) => sum + doc.file.size, 0) / (1024 * 1024)).toFixed(2)} MB / 10 MB
                        </span>
                      </div>
                      {(() => {
                        const total = documentos.reduce((sum, doc) => sum + doc.file.size, 0) / (1024 * 1024);
                        if (total > 10) {
                          return (
                            <div className="mt-2 flex items-start gap-2 text-red-600">
                              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                              <span className="text-sm font-medium">
                                Límite excedido. Elimina al menos {(total - 10).toFixed(2)} MB de archivos para continuar.
                              </span>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  )}

                  {/* Lista de documentos seleccionados */}
                  {documentos.length > 0 && (
                    <div className="space-y-3">
                      {documentos.map((doc, index) => (
                        <div
                          key={index}
                          className="border rounded-lg p-3 bg-gray-50 space-y-2"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              {doc.preview && (
                                <img
                                  src={doc.preview}
                                  alt="Preview"
                                  className="w-16 h-16 object-cover rounded"
                                />
                              )}
                              <div className="flex-1">
                                <p className="font-medium text-sm text-gray-800">
                                  {doc.file.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {(doc.file.size / (1024 * 1024)).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeDocumento(index)}
                              className="text-red-500 hover:text-red-700"
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
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Tipo de documento *
                              </label>
                              <select
                                value={doc.tipo_documento}
                                onChange={(e) =>
                                  updateDocumento(index, "tipo_documento", e.target.value)
                                }
                                required
                                className="w-full border rounded p-1.5 text-sm"
                              >
                                <option value="">Seleccionar</option>
                                <option value="radiografia">Radiografía</option>
                                <option value="examen_laboratorio">
                                  Examen de Laboratorio
                                </option>
                                <option value="imagen_diagnostico">
                                  Imagen de Diagnóstico
                                </option>
                                <option value="consentimiento">
                                  Consentimiento Informado
                                </option>
                                <option value="receta">Receta Médica</option>
                                <option value="foto_clinica">Foto Clínica</option>
                                <option value="otro">Otro</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Fecha del documento *
                              </label>
                              <input
                                type="date"
                                value={doc.fecha_documento}
                                onChange={(e) =>
                                  updateDocumento(index, "fecha_documento", e.target.value)
                                }
                                required
                                className="w-full border rounded p-1.5 text-sm"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Notas
                              </label>
                              <input
                                type="text"
                                value={doc.notas}
                                onChange={(e) =>
                                  updateDocumento(index, "notas", e.target.value)
                                }
                                placeholder="Opcional"
                                maxLength={1000}
                                className="w-full border rounded p-1.5 text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting || !pacienteId}
                className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-60"
              >
                {submitting ? "Guardando…" : "Guardar HCE"}
              </button>

              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="px-4 py-2 border rounded-lg"
                disabled={submitting}
              >
                Volver
              </button>
            </div>
          </form>

          {/* Modal de confirmación de duplicado */}
          {showDuplicadoModal && (
            <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
              {/* Backdrop sutil */}
              <div
                className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm"
                onClick={cancelarNuevoEpisodio}
              ></div>

              {/* Modal */}
              <div className="relative bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full transform transition-all">
                {/* Icono de advertencia */}
                <div className="flex items-center justify-center w-14 h-14 mx-auto mb-4 bg-amber-100 rounded-full">
                  <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 2.98 1.732 2.98z" />
                  </svg>
                </div>

                {/* Contenido */}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    Registro Duplicado Detectado
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-2">
                    Ya existe una historia clínica registrada <strong>hoy</strong> para este paciente con el mismo motivo de consulta.
                  </p>
                  <p className="text-gray-700 text-sm font-medium">
                    ¿Desea crear un nuevo episodio de atención?
                  </p>
                </div>

                {/* Info adicional */}
                <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-xl p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-cyan-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div className="text-sm text-cyan-900">
                      <p className="font-semibold mb-1">¿Qué significa esto?</p>
                      <p>Al continuar, se creará un <strong>nuevo episodio</strong> que se agregará al historial clínico del paciente, permitiendo documentar múltiples consultas del mismo día.</p>
                    </div>
                  </div>
                </div>

                {/* Botones */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={cancelarNuevoEpisodio}
                    className="flex-1 px-5 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                    disabled={submitting}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmarNuevoEpisodio}
                    className="flex-1 px-5 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold rounded-xl hover:from-cyan-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creando...
                      </span>
                    ) : (
                      "Sí, Crear Nuevo Episodio"
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
