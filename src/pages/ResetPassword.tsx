import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Api } from "../lib/Api";

type ConfirmOk = { ok: true; message?: string };
type ConfirmErr = { detail?: string };

export default function ResetPassword() {
  const [sp] = useSearchParams();
  const uid = (sp.get("uid") || "").trim();
  const token = (sp.get("token") || "").trim();

  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const redirectTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (redirectTimer.current) window.clearTimeout(redirectTimer.current);
    };
  }, []);

  useEffect(() => {
    setError("");
    setMessage("");
  }, [password, password2]);

  const pwdOk = useMemo(() => password.length >= 8, [password]);
  const matchOk = useMemo(() => password && password2 && password === password2, [password, password2]);
  const canSubmit = !!uid && !!token && pwdOk && matchOk && !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    setError("");
    setMessage("");

    try {
      const res = await Api.post<ConfirmOk>(
        "/auth/password-reset-confirm/",
        { uid, token, new_password: password },
        {
          validateStatus: (s) => [200, 201, 202, 204].includes(s ?? 0) || (s ?? 0) >= 400,
        }
      );

      if ([200, 201, 202, 204].includes(res.status)) {
        setMessage("Tu contraseña fue actualizada. Redirigiendo al inicio de sesión…");
        redirectTimer.current = window.setTimeout(() => navigate("/login"), 1600);
      } else {
        const d = res.data as unknown as ConfirmErr;
        setError(d?.detail || "No se pudo actualizar la contraseña.");
      }
    } catch (err: any) {
      const d = err?.response?.data as ConfirmErr | undefined;
      setError(d?.detail || err?.message || "Error de red. Intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Si el link está incompleto
  if (!uid || !token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-cyan-100 to-teal-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border border-teal-300 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Enlace inválido</h2>
          <p className="text-gray-600 mb-6">El enlace de recuperación no es válido o está incompleto.</p>
          <button
            className="px-6 py-3 rounded-xl bg-teal-600 text-white font-semibold hover:bg-teal-700 transition"
            onClick={() => navigate("/forgot-password")}
          >
            Volver a recuperar contraseña
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-cyan-100 to-teal-100 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-r from-teal-200 to-teal-400 opacity-40 pointer-events-none" />
      <div className="relative w-full max-w-md bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border border-teal-300">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-teal-400 to-teal-600 rounded-2xl mb-4 shadow-lg">
            <img
              src="/dentist.svg"
              alt="Dentista"
              className="w-10 h-10"
            />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Crear nueva contraseña</h2>
          <p className="text-gray-600">Ingresa tu nueva contraseña para finalizar el proceso</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
              Nueva contraseña
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              className="w-full px-4 py-3 bg-white/80 border-2 border-teal-300 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              aria-invalid={!pwdOk}
            />
            <p className="mt-2 text-xs text-gray-500">Mínimo 8 caracteres (respeta también validadores de Django).</p>
          </div>

          <div>
            <label htmlFor="password2" className="block text-sm font-semibold text-gray-700 mb-2">
              Confirmar contraseña
            </label>
            <input
              id="password2"
              type="password"
              autoComplete="new-password"
              className="w-full px-4 py-3 bg-white/80 border-2 border-teal-300 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              required
              aria-invalid={!matchOk}
            />
            {!matchOk && password2.length > 0 && (
              <p className="mt-2 text-xs text-red-600">Las contraseñas no coinciden.</p>
            )}
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className={`w-full bg-gradient-to-r from-teal-400 to-teal-600 text-white font-semibold py-3 px-6 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-300 focus:ring-offset-2 transform transition-all
              ${canSubmit ? "hover:from-teal-500 hover:to-teal-700 hover:scale-[1.02]" : "opacity-60 cursor-not-allowed"}`}
          >
            {isSubmitting ? "Guardando…" : "Guardar nueva contraseña"}
          </button>
        </form>

        {message && (
          <div className="mt-6 p-4 rounded-xl text-center font-medium bg-green-50 text-green-700 border border-green-200" role="status">
            {message}
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 rounded-xl text-center font-medium bg-red-50 text-red-700 border border-red-200" role="alert">
            {error}
          </div>
        )}

        <div className="mt-8 text-center">
          <button className="text-sm text-teal-600 hover:text-teal-800 font-medium" onClick={() => navigate("/login")}>
            Volver al inicio de sesión
          </button>
        </div>
      </div>
    </div>
  );
}
