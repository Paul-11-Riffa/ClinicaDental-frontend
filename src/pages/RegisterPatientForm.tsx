// src/components/RegisterPatientForm.tsx
import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import RegisterPatientBackend from "../components/RegisterPatientBackend";
import { Toaster, toast } from "react-hot-toast";
// import Logo from "../assets/logo.png"; // opcional si prefieres el logo

import type {
  RegisterPatientPayload,
  RegisterSuccess,
  RegisterError,
} from "../components/RegisterPatientBackend";

export default function RegisterPatientForm(): JSX.Element {
  const [sending, setSending] = useState<boolean>(false);
  const [payload, setPayload] = useState<RegisterPatientPayload | null>(null);
  const navigate = useNavigate();

  const defaultDate = useMemo<string>(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d.toISOString().slice(0, 10);
  }, []);

  const onDone = useCallback(
    (result: { ok: true; data: RegisterSuccess } | { ok: false; error: RegisterError }) => {
      setSending(false);

      if (result.ok) {
        toast.dismiss();
        toast.success(result.data.message || "Cuenta creada correctamente.");
        (document.getElementById("form-register-patient") as HTMLFormElement | null)?.reset();
        
        // Redireccionar al login después de 2 segundos
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        const detail = result.error.detail || "No se pudo crear la cuenta.";
        const fieldMsg = result.error.fields
          ? " " +
            Object.entries(result.error.fields)
              .map(([k, v]) => `${k}: ${v}`)
              .join(" • ")
          : "";
        toast.dismiss();
        toast.error(detail + fieldMsg);
      }

      setPayload(null);
    },
    [navigate]
  );

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();

    const f = new FormData(e.currentTarget);

    const email = String(f.get("email") ?? "").trim();
    const password = String(f.get("password") ?? "");
    const nombre = String(f.get("nombre") ?? "").trim();
    const apellido = String(f.get("apellido") ?? "").trim();
    const telefono = String(f.get("telefono") ?? "").trim();
    const sexo = String(f.get("sexo") ?? "").trim();
    const direccion = String(f.get("direccion") ?? "").trim();
    const fechanacimiento = String(f.get("fechanacimiento") ?? "");
    const carnetidentidad = String(f.get("carnetidentidad") ?? "").trim();

    // Validaciones específicas
    if (!email) {
      toast.error("El correo electrónico es requerido.");
      return;
    }

    if (!email.includes('@')) {
      toast.error("Ingresa un correo electrónico válido.");
      return;
    }

    if (!password) {
      toast.error("La contraseña es requerida.");
      return;
    }

    if (password.length < 8) {
      toast.error("La contraseña debe tener mínimo 8 caracteres.");
      return;
    }

    if (!nombre) {
      toast.error("El nombre es requerido.");
      return;
    }

    if (!apellido) {
      toast.error("El apellido es requerido.");
      return;
    }

    if (!telefono) {
      toast.error("El teléfono es requerido.");
      return;
    }

    if (telefono.length !== 8 || !/^\d{8}$/.test(telefono)) {
      toast.error("El teléfono debe tener exactamente 8 dígitos.");
      return;
    }

    if (!sexo) {
      toast.error("Selecciona el sexo.");
      return;
    }

    if (!direccion) {
      toast.error("La dirección es requerida.");
      return;
    }

    if (!fechanacimiento) {
      toast.error("La fecha de nacimiento es requerida.");
      return;
    }

    if (!carnetidentidad) {
      toast.error("El carnet de identidad es requerido.");
      return;
    }

    if (carnetidentidad.length !== 8 || !/^\d{8}$/.test(carnetidentidad)) {
      toast.error("El carnet de identidad debe tener exactamente 8 dígitos.");
      return;
    }

    const p: RegisterPatientPayload = {
      email,
      password,
      nombre,
      apellido,
      telefono,
      sexo, // "M" o "F"
      direccion,
      fechanacimiento,
      carnetidentidad,
    };

    toast.loading("Creando cuenta…");
    setSending(true);
    setPayload(p);
  }

  return (
    <>
      <RegisterPatientBackend payload={payload} onDone={onDone} />

      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-cyan-100 flex items-center justify-center p-4 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(120,119,198,0.1),_transparent_50%)] pointer-events-none"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(34,211,238,0.1),_transparent_50%)] pointer-events-none"></div>

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: { fontSize: "0.9rem" },
          }}
        />

        <div className="relative w-full max-w-md md:max-w-lg">
          <div className="bg-white/70 backdrop-blur-sm p-8 md:p-10 rounded-3xl shadow-2xl border border-white/50">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-2xl mb-4 shadow-lg">
                <img src="/dentist.svg" alt="Dentista" className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Clínica Dental</h2>
              <p className="text-gray-600">Crea tu cuenta de paciente</p>
            </div>

            {/* Form con estilos congruentes al Login */}
            <form id="form-register-patient" onSubmit={handleSubmit} className="space-y-6">
              {/* Email + Password */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                    Email *
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="tu@correo.com"
                      required
                      disabled={sending}
                      className="w-full px-4 py-3 pl-12 bg-white/80 border-2 border-cyan-200 rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200 transition-all duration-200 placeholder-gray-400"
                    />
                    <svg
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                    Contraseña *
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      minLength={8}
                      placeholder="••••••••"
                      required
                      disabled={sending}
                      className="w-full px-4 py-3 pl-12 bg-white/80 border-2 border-cyan-200 rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200 transition-all duration-200 placeholder-gray-400"
                    />
                    <svg
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400"
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Nombre y Apellido (ahora obligatorios) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre *</label>
                  <input
                    name="nombre"
                    required
                    disabled={sending}
                    className="w-full px-4 py-3 bg-white/80 border-2 border-cyan-200 rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Apellido *</label>
                  <input
                    name="apellido"
                    required
                    disabled={sending}
                    className="w-full px-4 py-3 bg-white/80 border-2 border-cyan-200 rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Teléfono (ahora obligatorio) EXACTAMENTE 8 dígitos */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Teléfono *</label>
                <input
                  name="telefono"
                  type="tel"
                  inputMode="numeric"
                  pattern="\d{8}"
                  minLength={8}
                  maxLength={8}
                  placeholder="12345678"
                  required
                  disabled={sending}
                  className="w-full px-4 py-3 bg-white/80 border-2 border-cyan-200 rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200 transition-all duration-200 placeholder-gray-400"
                />
              </div>

              {/* Sexo (requerido) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Sexo *</label>
                <select
                  name="sexo"
                  required
                  defaultValue=""
                  disabled={sending}
                  className="w-full px-4 py-3 bg-white/80 border-2 border-cyan-200 rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200 transition-all duration-200 bg-white"
                >
                  <option value="" disabled>Selecciona…</option>
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                </select>
              </div>

              {/* Dirección (requerido) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Dirección *</label>
                <input
                  name="direccion"
                  required
                  disabled={sending}
                  placeholder="Introduce tu dirección"
                  className="w-full px-4 py-3 bg-white/80 border-2 border-cyan-200 rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200 transition-all duration-200 placeholder-gray-400"
                />
              </div>

              {/* Fecha de nacimiento + CI */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha de nacimiento *</label>
                  <input
                    name="fechanacimiento"
                    type="date"
                    required
                    defaultValue={defaultDate}
                    disabled={sending}
                    className="w-full px-4 py-3 bg-white/80 border-2 border-cyan-200 rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Carnet de identidad *</label>
                  <input
                    name="carnetidentidad"
                    required
                    inputMode="numeric"
                    pattern="\d{8}"
                    minLength={8}
                    maxLength={8}
                    placeholder="12345678"
                    disabled={sending}
                    className="w-full px-4 py-3 bg-white/80 border-2 border-cyan-200 rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200 transition-all duration-200 placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Botón submit (mismo estilo que el Login) */}
              <button
                type="submit"
                disabled={sending}
                className="w-full bg-gradient-to-r from-cyan-400 to-cyan-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-cyan-500 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 transform transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg cursor-pointer"
              >
                {sending ? (
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Registrando…</span>
                  </div>
                ) : (
                  "Crear cuenta"
                )}
              </button>
            </form>

            {/* Footer: congruente con Login pero al revés */}
            <div className="mt-8 text-center space-y-3">
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <span>¿Ya tienes una cuenta?</span>
                <button
                  type="button"
                  className="text-cyan-600 hover:text-cyan-800 transition-colors font-medium cursor-pointer"
                  onClick={() => navigate("/login")}
                  disabled={sending}
                >
                  Inicia sesión aquí
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Text (igual que Login) */}
          <div className="text-center mt-6">
            <p className="text-sm text-gray-500">Sistema de Gestión Dental • Versión 2.0</p>
          </div>
        </div>
      </div>
    </>
  );
}