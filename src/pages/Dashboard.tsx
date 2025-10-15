// src/pages/Dashboard.tsx

import {useAuth} from "../context/AuthContext";
import AdminDashboard from "../components/AdminDashboard";
import PacienteDashboard from "../components/PacienteDashboard";


const Dashboard = () => {
    const { user, isAuth, loading } = useAuth();

    console.log("=== DASHBOARD RENDER ===");
    console.log("isAuth:", isAuth);
    console.log("user:", user);
    console.log("loading:", loading);

    if (loading) {
        return <div>Cargando...</div>;
    }

    if (!isAuth || !user) {
        console.log("No autenticado o sin usuario");
        return <div>Cargando...</div>;
    }

    console.log("Usuario autenticado:", user.idtipousuario);

    if (user.idtipousuario === 2) {
        return <PacienteDashboard/>;
    } else {
        return <AdminDashboard/>;
    }
};

export default Dashboard;