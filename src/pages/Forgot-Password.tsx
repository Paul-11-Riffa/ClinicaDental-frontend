import { useState } from "react";
import { useNavigate } from "react-router-dom";
// Usar 'import type' para los tipos
import type { ForgotPasswordPayload } from "../components/ForgotPasswordBackend";
import ForgotPasswordBackend from "../components/ForgotPasswordBackend";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [payload, setPayload] = useState<ForgotPasswordPayload | null>(null);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    // Disparar la solicitud de recuperación de contraseña
    setPayload({
      email: email.trim(),
    });
  };

  const handleForgotPasswordResult = (result: { ok: true; data: any } | { ok: false; error: any }) => {
    if (result.ok) {
      setMessage("Te hemos enviado un enlace para restablecer tu contraseña.");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } else {
      setError(result.error.detail || "Hubo un error. Intenta nuevamente.");
    }
  };

  return (
    <>
      <ForgotPasswordBackend payload={payload} onDone={handleForgotPasswordResult} />

      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-cyan-100 to-teal-100 flex items-center justify-center p-4">
        {/* Fondo con gradiente */}
        <div className="absolute inset-0 bg-gradient-to-r from-teal-200 to-teal-400 opacity-40 pointer-events-none"></div>

        <div className="relative w-full max-w-md bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border border-teal-300">
          {/* Card Principal */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-teal-400 to-teal-600 rounded-2xl mb-4 shadow-lg">
              <img
                src="/dentist.svg"
                alt="Dentista"
                className="w-10 h-10"
              />
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Recuperación de Contraseña</h2>
            <p className="text-gray-600">Ingresa tu correo electrónico para recibir el enlace de recuperación</p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  placeholder="tu@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 pl-12 bg-white/80 border-2 border-teal-300 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all duration-200 placeholder-gray-400"
                  required
                />
                <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-teal-400 to-teal-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-teal-500 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:ring-offset-2 transform transition-all duration-200 hover:scale-[1.02]"
            >
              Enviar enlace de recuperación
            </button>
          </form>

          {/* Mensajes */}
          {message && (
            <div className="mt-6 p-4 rounded-xl text-center font-medium bg-green-50 text-green-700 border border-green-200">
              {message}
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 rounded-xl text-center font-medium bg-red-50 text-red-700 border border-red-200">
              {error}
            </div>
          )}

          {/* Enlaces de footer */}
          <div className="mt-8 text-center space-y-3">
            <button
              type="button"
              className="text-sm text-teal-600 hover:text-teal-800 transition-colors font-medium"
              onClick={() => navigate("/login")}
            >
              Volver al inicio de sesión
            </button>

            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <span>¿No tienes cuenta?</span>
              <button
                type="button"
                className="text-teal-600 hover:text-teal-800 transition-colors font-medium"
                onClick={() => navigate("/register")}
              >
                Regístrate aquí
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
