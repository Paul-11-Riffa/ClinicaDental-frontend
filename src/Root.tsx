// src/Root.tsx
import { Outlet } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext"; // Asegúrate que la ruta sea correcta

export function Root() {
  return (
    // AuthProvider envuelve a todas las rutas que se renderizarán en el Outlet
    <AuthProvider>
      <main>
        <Outlet />
      </main>
    </AuthProvider>
  );
}