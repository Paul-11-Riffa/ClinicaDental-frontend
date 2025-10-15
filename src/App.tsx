// src/App.tsx
import { Routes, Route, BrowserRouter } from "react-router-dom";
import RegisterPatientForm from "./pages/RegisterPatientForm";
import Login from "./pages/Login";
import Home from "./pages/Home";
import ForgotPassword from "./pages/Forgot-Password";
import AdminDashboard from "./components/AdminDashboard.tsx";
import ResetPassword from "./pages/ResetPassword";
import Perfil from "./pages/Perfil"; // 👈 importa tu página de perfil

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<RegisterPatientForm />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/dashboard" element={<AdminDashboard />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/perfil" element={<Perfil />} /> {/* 👈 agrega esta ruta */}
        <Route
          path="*"
          element={<div className="flex justify-center">Error 404</div>}
        />
      </Routes>
    </BrowserRouter>
  );
}
