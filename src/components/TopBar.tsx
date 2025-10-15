import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function getDisplayData(authUser: any) {
  let lsUser: any = null;
  try { lsUser = JSON.parse(localStorage.getItem("user_data") || "null"); } catch {}

  const first = authUser?.first_name || lsUser?.usuario?.nombres || lsUser?.user?.first_name || "";
  const last  = authUser?.last_name  || lsUser?.usuario?.apellidos || lsUser?.user?.last_name  || "";
  const email = authUser?.email || lsUser?.user?.email || "";

  const displayName = [first, last].filter(Boolean).join(" ") || (email ? email.split("@")[0] : "Usuario");
  const initial = (first?.[0] || email?.[0] || "U").toUpperCase();
  return { displayName, email, initial };
}

export default function TopBar() {
  const { isAuth, user, logout } = useAuth();
  const navigate = useNavigate();
  const { displayName, email, initial } = getDisplayData(user);
  console.log("Estado de Auth en TopBar:", { isAuth, user });

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-40">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3 sm:py-4">
          <Link to="/dashboard" className="flex items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-2xl grid place-items-center shadow">
              <img src="/dentist.svg" alt="Clínica Dental" className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h1 className="text-lg sm:text-2xl font-bold text-gray-800">Clínica Dental</h1>
          </Link>

          {!isAuth ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                to="/login"
                className="px-3 py-2 sm:px-4 text-sm sm:text-base text-cyan-700 border border-cyan-600 rounded-lg hover:bg-cyan-50 transition"
              >
                Iniciar
              </Link>
              <Link
                to="/register"
                className="px-3 py-2 sm:px-4 text-sm sm:text-base bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition"
              >
                Registrarse
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="text-right hidden xs:block sm:block">
                <p className="text-sm sm:text-base font-semibold text-gray-800 leading-none">{displayName}</p>
                <p className="hidden sm:block text-xs text-gray-500">{email}</p>
              </div>

              <Link
                to="/perfil"
                title="Mi perfil"
                aria-label="Ir a mi perfil"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-cyan-100 grid place-items-center ring-2 ring-cyan-300 hover:bg-cyan-200 transition"
              >
                <span className="text-cyan-700 font-bold">{initial}</span>
              </Link>

              <button
                onClick={handleLogout}
                className="px-3 py-2 text-xs sm:text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
              >
                Salir
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
