// src/components/PacienteDashboard.tsx

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { updateUserSettings } from '../lib/Api';
import TopBar from "./TopBar.tsx";

// --- Iconos SVG ---
const BellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ClipboardListIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
);

// Nuevo icono para Historia Clínica
const MedicalFileIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 3h6l3 3v12a3 3 0 01-3 3H9a3 3 0 01-3-3V6l3-3z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 11v6M9 14h6" />
  </svg>
);

const PacienteDashboard = () => {
  const { user, token, updateNotificationSetting } = useAuth();

  const [notificationsEnabled, setNotificationsEnabled] = useState(user?.recibir_notificaciones ?? true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleNotificationToggle = async () => {
    if (!token || isLoading) return;

    const originalValue = notificationsEnabled;
    const newValue = !notificationsEnabled;

    setIsLoading(true);
    setError('');
    setNotificationsEnabled(newValue);

    try {
      await updateUserSettings({ recibir_notificaciones: newValue }, token);
      updateNotificationSetting(newValue);
    } catch (err) {
      setError('No se pudo guardar el cambio. Inténtalo de nuevo.');
      setNotificationsEnabled(originalValue);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <TopBar />

      <div className="bg-slate-50 min-h-screen">
        <div className="container mx-auto py-10 px-4">
          {/* --- Cabecera de Bienvenida --- */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-800">
              Bienvenido de nuevo, {user?.nombre || 'Paciente'}
            </h1>
            <p className="text-slate-500 mt-1">
              Gestiona tu perfil y tus citas de forma rápida y sencilla.
            </p>
          </div>

          {/* --- Contenedor Principal con Grid --- */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Columna de Acciones Rápidas */}
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-xl font-semibold text-slate-700 border-b pb-2">Acciones Rápidas</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Link to="/agendar-cita" className="group flex items-center justify-center p-6 bg-white text-slate-700 rounded-lg shadow-md hover:shadow-lg hover:bg-blue-500 hover:text-white transition-all duration-300">
                  <CalendarIcon />
                  <span className="text-lg font-semibold">Agendar Cita</span>
                </Link>

                <Link to="/mis-citas" className="group flex items-center justify-center p-6 bg-white text-slate-700 rounded-lg shadow-md hover:shadow-lg hover:bg-green-500 hover:text-white transition-all duration-300">
                  <ClipboardListIcon />
                  <span className="text-lg font-semibold">Ver Mis Citas</span>
                </Link>

                {/* ➕ NUEVO: Ver Mi Historia Clínica */}
                <Link to="/mis-historias" className="group flex items-center justify-center p-6 bg-white text-slate-700 rounded-lg shadow-md hover:shadow-lg hover:bg-indigo-500 hover:text-white transition-all duration-300">
                  <MedicalFileIcon />
                  <span className="text-lg font-semibold">Mi Historia Clínica</span>
                </Link>
              </div>
            </div>

            {/* Columna de Preferencias */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-slate-700 border-b pb-2">Configuración</h2>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center">
                  <BellIcon />
                  <h3 className="ml-3 font-semibold text-slate-800">Preferencias de Notificación</h3>
                </div>
                <p className="text-sm text-slate-500 mt-2 mb-4">
                  Elige cómo quieres recibir las comunicaciones importantes sobre tus citas.
                </p>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-md">
                  <span className="text-slate-600 font-medium">Recibir correos</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationsEnabled}
                      onChange={handleNotificationToggle}
                      disabled={isLoading}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                {isLoading && <p className="text-xs text-blue-500 mt-2 text-right">Guardando...</p>}
                {error && <p className="text-xs text-red-500 mt-2 text-right">{error}</p>}
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default PacienteDashboard;
