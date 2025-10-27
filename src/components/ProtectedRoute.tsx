// src/components/ProtectedRoute.tsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: number[]; // IDs de tipo de usuario permitidos
  requireAuth?: boolean; // Requiere autenticación (default: true)
}

/**
 * Componente para proteger rutas basándose en autenticación y roles.
 *
 * Uso:
 * ```tsx
 * <ProtectedRoute allowedRoles={[2]}>  // Solo pacientes (id=2)
 *   <MisPresupuestosPaciente />
 * </ProtectedRoute>
 *
 * <ProtectedRoute allowedRoles={[1, 3]}>  // Odontólogos (1) y Admins (3)
 *   <CrearPresupuestoDigital />
 * </ProtectedRoute>
 * ```
 *
 * @param children - Componente a renderizar si pasa las validaciones
 * @param allowedRoles - Array de IDs de tipos de usuario permitidos
 * @param requireAuth - Si requiere autenticación (default: true)
 */
export default function ProtectedRoute({
  children,
  allowedRoles,
  requireAuth = true,
}: ProtectedRouteProps) {
  const { isAuth, user } = useAuth();

  // 1. Verificar autenticación si es requerida
  if (requireAuth && !isAuth) {
    return <Navigate to="/login" replace state={{ from: window.location.pathname }} />;
  }

  // 2. Verificar roles si se especificaron
  if (allowedRoles && allowedRoles.length > 0) {
    const userRoleId = user?.idtipousuario;

    // Si no tiene rol o no está en los roles permitidos, denegar acceso
    if (!userRoleId || !allowedRoles.includes(userRoleId)) {
      console.warn(
        `[ProtectedRoute] Acceso denegado: Usuario con rol ${userRoleId} intentó acceder a ruta restringida a roles ${allowedRoles.join(", ")}`
      );

      // Redirigir a dashboard o página de acceso denegado
      return (
        <Navigate
          to="/dashboard"
          replace
          state={{
            error: "No tienes permisos para acceder a esta página.",
            requiredRoles: allowedRoles,
            userRole: userRoleId,
          }}
        />
      );
    }
  }

  // 3. Si pasa todas las validaciones, renderizar el componente hijo
  return children;
}
