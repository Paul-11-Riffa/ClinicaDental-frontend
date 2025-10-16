// src/router.tsx
import {createBrowserRouter} from "react-router-dom";
import {Root} from "./Root";
import Home from "./pages/Home";
import RegisterPatientForm from "./pages/RegisterPatientForm";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AgendarCita from "./pages/AgendarCita";
import ProtectedRoute from "./components/ProtectedRoute";
import MisCitas from "./pages/MisCitas";
import Agenda from "./pages/Agenda";
import ForgotPassword from "./pages/Forgot-Password";
import ResetPassword from "./pages/ResetPassword";
import GestionRoles from "./pages/GestionRoles";
import Perfil from "./pages/Perfil";
import RegistrarHistoriaClinica from "./pages/RegistrarHistoriaClinica";
import UsuariosySeguridad from "./components/UsuariosySeguridad";
import ConsultarHistoriaClinica from "./pages/ConsultarHistoriaClinica";
import ConsultarHistoriaClinicaPaciente from "./pages/ConsultarHistoriaClinicaPaciente";
import PolticasNoShow from "./pages/CrearPoliticaNoShow";
import Reportes from "./pages/Reportes";
import LandingCompra from "./pages/LandingCompra";

// Función para detectar si hay subdominio
function tieneSubdominio(): boolean {
  const hostname = window.location.hostname;
  
  // localhost sin subdominio
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return false;
  }
  
  // localhost con subdominio (norte.localhost, sur.localhost)
  if (hostname.includes('localhost')) {
    const parts = hostname.split('.');
    return parts.length > 1 && parts[0] !== 'localhost' && parts[0] !== '127';
  }
  
  // Producción: verificar si hay subdominio (norte.tudominio.com)
  const parts = hostname.split('.');
  return parts.length >= 3 && parts[0] !== 'www';
}

export const router = createBrowserRouter([
    {
        path: "/",
        element: <Root/>,
        children: [
            // Si NO hay subdominio, mostrar landing de compra
            // Si hay subdominio, mostrar Home normal
            {index: true, element: tieneSubdominio() ? <Home/> : <LandingCompra/>},

            // Públicas
            {path: "/login", element: <Login/>},
            {path: "/register", element: <RegisterPatientForm/>},
            {path: "/forgot-password", element: <ForgotPassword/>},
            {path: "/reset-password", element: <ResetPassword/>},

            // Protegidas (requieren sesión)
            {
                path: "/dashboard",
                element: (
                    <ProtectedRoute>
                        <Dashboard/>
                    </ProtectedRoute>
                ),
            },
            {
                path: "/agenda",
                element: (
                    <ProtectedRoute>
                        <Agenda/>
                    </ProtectedRoute>
                ),
            },
            {
                path: "/agendar-cita",
                element: (
                    <ProtectedRoute>
                        <AgendarCita/>
                    </ProtectedRoute>
                ),
            },
            {
                path: "/mis-citas",
                element: (
                    <ProtectedRoute>
                        <MisCitas/>
                    </ProtectedRoute>
                ),
            },
            {
                path: "/perfil",
                element: (
                    <ProtectedRoute>
                        <Perfil/>
                    </ProtectedRoute>
                ),
            },

            // Administración (protegida; backend valida si es admin)
            {
                path: "/usuarios",
                element: (
                    <ProtectedRoute>
                        <GestionRoles/>
                    </ProtectedRoute>
                ),
            },

             {
                path: "/politicanoshow",
                element: (
                    <ProtectedRoute>
                        <PolticasNoShow/>
                    </ProtectedRoute>
                ),
            },


            //Registrar Historia Clínica (protegida)
            {
                path: "/historias/registrar",
                element: (
                    <ProtectedRoute>
                        <RegistrarHistoriaClinica/>
                    </ProtectedRoute>
                ),
            },
            {
                path: "/registrar-historia-clinica",
                element: (
                    <ProtectedRoute>
                        <RegistrarHistoriaClinica/>
                    </ProtectedRoute>
                ),
            },
            {
                path: "/historias/consultar",
                element: (
                    <ProtectedRoute>
                        <ConsultarHistoriaClinica/>
                    </ProtectedRoute>
                ),
            },
            {
                path: "/consultar-historia-clinica",
                element: (
                    <ProtectedRoute>
                        <ConsultarHistoriaClinica/>
                    </ProtectedRoute>
                ),
            },
            {
                path: "/usuarios-seguridad",
                element: (
                    <ProtectedRoute>
                        {/* Si usas AdminRoute, envuelve: <AdminRoute> ... </AdminRoute> */}
                        <UsuariosySeguridad/>
                    </ProtectedRoute>
                )
            },
            {
                path: "/mis-historias",
                element: (
                    <ProtectedRoute>
                        <ConsultarHistoriaClinicaPaciente/>
                    </ProtectedRoute>
                ),
            },

            // Reportes (protegida - solo administradores)
            {
                path: "/reportes",
                element: (
                    <ProtectedRoute>
                        <Reportes/>
                    </ProtectedRoute>
                ),
            },

            // 404
            {
                path: "*",
                element: <div className="min-h-screen grid place-items-center">404</div>,
            },
        ],
    },
]);
