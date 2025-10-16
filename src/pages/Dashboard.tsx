// src/pages/Dashboard.tsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.tsx";
import AdminDashboard from "../components/AdminDashboard.tsx";
import PacienteDashboard from "../components/PacienteDashboard.tsx";
import OdontologoDashboard from "../components/OdontologoDashboard.tsx";
import RecepcionistaDashboard from "../components/RecepcionistaDashboard.tsx";

export default function Dashboard() {
  const { isAuth, user, loading } = useAuth();

  console.log("=== DASHBOARD DEBUG ===");
  console.log("isAuth:", isAuth);
  console.log("user:", user);
  console.log("loading:", loading);
  console.log("user.subtipo:", user?.subtipo);
  console.log("user.idtipousuario:", user?.idtipousuario);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuth || !user) {
    return <Navigate to="/login" replace />;
  }

  // Routing basado en el subtipo del usuario
  switch (user.subtipo) {
    case "administrador":
      return <AdminDashboard />;
    
    case "paciente":
      return <PacienteDashboard />;
    
    case "odontologo":
      return <OdontologoDashboard />;
    
    case "recepcionista":
      return <RecepcionistaDashboard />;
    
    default:
      // Fallback: si no tiene subtipo o es desconocido, usar idtipousuario como antes
      console.warn("Subtipo no reconocido:", user.subtipo, "- usando fallback con idtipousuario");
      
      if (user.idtipousuario === 2) {
        return <PacienteDashboard />;
      } else {
        return <AdminDashboard />;
      }
  }
}