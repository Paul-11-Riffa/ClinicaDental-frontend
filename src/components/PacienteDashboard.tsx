// src/components/PacienteDashboard.tsx

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { updateUserSettings, Api } from '../lib/Api';
import TopBar from "./TopBar.tsx";
import { motion } from 'framer-motion';

// --- Iconos SVG Mejorados ---
const BellIcon = ({ className = "h-6 w-6" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const CalendarIcon = ({ className = "h-8 w-8" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ClipboardListIcon = ({ className = "h-8 w-8" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
);

const MedicalFileIcon = ({ className = "h-8 w-8" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 3h6l3 3v12a3 3 0 01-3 3H9a3 3 0 01-3-3V6l3-3z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 11v6M9 14h6" />
  </svg>
);

const ServicesIcon = ({ className = "h-8 w-8" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
);

const HeartPulseIcon = ({ className = "h-6 w-6" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

const CheckCircleIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

// Variantes de animación para Framer Motion
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const cardVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 15
    }
  }
};

interface Cita {
  id: number;
  fecha: string;
  hora: string;
  odontologo_nombre?: string;
  estado: string;
  motivo?: string;
}

const PacienteDashboard = () => {
  const { user, token, updateNotificationSetting } = useAuth();

  const [notificationsEnabled, setNotificationsEnabled] = useState(user?.recibir_notificaciones ?? true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [proximaCita, setProximaCita] = useState<Cita | null>(null);
  const [loadingCita, setLoadingCita] = useState(true);
  const [stats, setStats] = useState({
    citasPendientes: 0,
    citasCompletadas: 0,
    historiasClinicas: 0
  });

  // Obtener próxima cita y estadísticas
  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;

      try {
        setLoadingCita(true);

        // Obtener consultas del paciente - usa el endpoint correcto
        const response = await Api.get('/consultas/');
        const citas = response.data?.results || response.data || [];

        // Encontrar la próxima cita (fecha futura más cercana)
        const ahora = new Date();
        const citasFuturas = citas
          .filter((c: Cita) => {
            const fechaCita = new Date(c.fecha + ' ' + c.hora);
            return fechaCita > ahora && c.estado !== 'cancelada';
          })
          .sort((a: Cita, b: Cita) => {
            const dateA = new Date(a.fecha + ' ' + a.hora);
            const dateB = new Date(b.fecha + ' ' + b.hora);
            return dateA.getTime() - dateB.getTime();
          });

        if (citasFuturas.length > 0) {
          setProximaCita(citasFuturas[0]);
        }

        // Calcular estadísticas
        const pendientes = citas.filter((c: Cita) => {
          const fechaCita = new Date(c.fecha + ' ' + c.hora);
          return fechaCita > ahora && c.estado !== 'cancelada';
        }).length;

        const completadas = citas.filter((c: Cita) => c.estado === 'atendida' || c.estado === 'completada').length;

        setStats({
          citasPendientes: pendientes,
          citasCompletadas: completadas,
          historiasClinicas: 0 // Puedes agregar una llamada adicional si existe el endpoint
        });

      } catch (err) {
        console.error('Error al cargar datos:', err);
      } finally {
        setLoadingCita(false);
      }
    };

    fetchData();
  }, [token]);

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

  const formatearFecha = (fecha: string) => {
    const date = new Date(fecha);
    return new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  return (
    <>
      <TopBar />

      {/* Fondo con gradiente animado */}
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 relative overflow-hidden">
        {/* Elementos decorativos de fondo */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-cyan-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Cabecera de Bienvenida Mejorada */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <HeartPulseIcon className="h-10 w-10 text-rose-500" />
              </motion.div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                ¡Hola, {user?.nombre || 'Paciente'}!
              </h1>
            </div>
            <p className="text-slate-600 text-lg ml-13">
              Tu salud dental es nuestra prioridad. Aquí puedes gestionar todo lo relacionado con tus citas.
            </p>
          </motion.div>

          {/* Próxima Cita Destacada */}
          {!loadingCita && proximaCita && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-8"
            >
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl p-6 text-white shadow-xl backdrop-blur-sm border border-white/20">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <CalendarIcon className="h-6 w-6" />
                      <h2 className="text-xl font-bold">Próxima Cita</h2>
                    </div>
                    <p className="text-2xl font-semibold mb-2 capitalize">
                      {formatearFecha(proximaCita.fecha)}
                    </p>
                    <div className="flex items-center gap-4 text-blue-50">
                      <span className="flex items-center gap-1">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {proximaCita.hora}
                      </span>
                      {proximaCita.odontologo_nombre && (
                        <span className="flex items-center gap-1">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Dr. {proximaCita.odontologo_nombre}
                        </span>
                      )}
                    </div>
                  </div>
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="bg-white/20 backdrop-blur-sm rounded-full p-4"
                  >
                    <CheckCircleIcon className="h-8 w-8 text-white" />
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Estadísticas Rápidas */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
          >
            <motion.div variants={cardVariants} className="bg-white/70 backdrop-blur-sm rounded-xl p-5 border border-blue-100 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Citas Pendientes</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.citasPendientes}</p>
                </div>
                <div className="bg-blue-100 rounded-full p-3">
                  <CalendarIcon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </motion.div>

            <motion.div variants={cardVariants} className="bg-white/70 backdrop-blur-sm rounded-xl p-5 border border-green-100 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Citas Completadas</p>
                  <p className="text-3xl font-bold text-green-600">{stats.citasCompletadas}</p>
                </div>
                <div className="bg-green-100 rounded-full p-3">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </motion.div>

            <motion.div variants={cardVariants} className="bg-white/70 backdrop-blur-sm rounded-xl p-5 border border-purple-100 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Historias Médicas</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.historiasClinicas}</p>
                </div>
                <div className="bg-purple-100 rounded-full p-3">
                  <MedicalFileIcon className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Grid Principal */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Columna de Acciones Rápidas */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="lg:col-span-2 space-y-6"
            >
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <span className="w-1 h-8 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></span>
                Acciones Rápidas
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <motion.div variants={cardVariants} whileHover={{ scale: 1.02, y: -5 }} whileTap={{ scale: 0.98 }}>
                  <Link to="/agendar-cita" className="group block relative overflow-hidden bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-blue-100 shadow-lg hover:shadow-2xl transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="bg-blue-100 group-hover:bg-white/20 p-3 rounded-xl transition-colors duration-300">
                          <CalendarIcon className="h-8 w-8 text-blue-600 group-hover:text-white transition-colors duration-300" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-800 group-hover:text-white transition-colors duration-300">Agendar Cita</h3>
                          <p className="text-sm text-slate-600 group-hover:text-blue-50 transition-colors duration-300">Reserva tu consulta</p>
                        </div>
                      </div>
                      <svg className="w-6 h-6 text-blue-600 group-hover:text-white transform group-hover:translate-x-1 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                </motion.div>

                <motion.div variants={cardVariants} whileHover={{ scale: 1.02, y: -5 }} whileTap={{ scale: 0.98 }}>
                  <Link to="/mis-citas" className="group block relative overflow-hidden bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100 shadow-lg hover:shadow-2xl transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="bg-green-100 group-hover:bg-white/20 p-3 rounded-xl transition-colors duration-300">
                          <ClipboardListIcon className="h-8 w-8 text-green-600 group-hover:text-white transition-colors duration-300" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-800 group-hover:text-white transition-colors duration-300">Mis Citas</h3>
                          <p className="text-sm text-slate-600 group-hover:text-green-50 transition-colors duration-300">Ver historial</p>
                        </div>
                      </div>
                      <svg className="w-6 h-6 text-green-600 group-hover:text-white transform group-hover:translate-x-1 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                </motion.div>

                <motion.div variants={cardVariants} whileHover={{ scale: 1.02, y: -5 }} whileTap={{ scale: 0.98 }}>
                  <Link to="/mis-historias" className="group block relative overflow-hidden bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-indigo-100 shadow-lg hover:shadow-2xl transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="bg-indigo-100 group-hover:bg-white/20 p-3 rounded-xl transition-colors duration-300">
                          <MedicalFileIcon className="h-8 w-8 text-indigo-600 group-hover:text-white transition-colors duration-300" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-800 group-hover:text-white transition-colors duration-300">Historia Clínica</h3>
                          <p className="text-sm text-slate-600 group-hover:text-indigo-50 transition-colors duration-300">Mis registros</p>
                        </div>
                      </div>
                      <svg className="w-6 h-6 text-indigo-600 group-hover:text-white transform group-hover:translate-x-1 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                </motion.div>

                <motion.div variants={cardVariants} whileHover={{ scale: 1.02, y: -5 }} whileTap={{ scale: 0.98 }}>
                  <Link to="/catalogo-servicios" className="group block relative overflow-hidden bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-purple-100 shadow-lg hover:shadow-2xl transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="bg-purple-100 group-hover:bg-white/20 p-3 rounded-xl transition-colors duration-300">
                          <ServicesIcon className="h-8 w-8 text-purple-600 group-hover:text-white transition-colors duration-300" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-800 group-hover:text-white transition-colors duration-300">Servicios</h3>
                          <p className="text-sm text-slate-600 group-hover:text-purple-50 transition-colors duration-300">Ver catálogo</p>
                        </div>
                      </div>
                      <svg className="w-6 h-6 text-purple-600 group-hover:text-white transform group-hover:translate-x-1 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                </motion.div>
              </div>
            </motion.div>

            {/* Columna de Configuración */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <span className="w-1 h-8 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></span>
                Configuración
              </h2>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <BellIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-lg">Notificaciones</h3>
                </div>
                <p className="text-sm text-slate-600 mb-5">
                  Recibe recordatorios y actualizaciones importantes sobre tus citas por correo electrónico.
                </p>
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl border border-slate-200">
                  <span className="text-slate-700 font-semibold flex items-center gap-2">
                    <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Correos
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationsEnabled}
                      onChange={handleNotificationToggle}
                      disabled={isLoading}
                      className="sr-only peer"
                    />
                    <div className="w-14 h-7 bg-gray-300 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-cyan-500"></div>
                  </label>
                </div>
                {isLoading && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-blue-600 mt-3 text-right flex items-center justify-end gap-1"
                  >
                    <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Guardando...
                  </motion.p>
                )}
                {error && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-red-500 mt-3 text-right"
                  >
                    {error}
                  </motion.p>
                )}
              </div>

              {/* Tips de Salud */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl p-6 text-white shadow-lg"
              >
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <h3 className="font-bold text-lg">Consejo del Día</h3>
                </div>
                <p className="text-teal-50 text-sm leading-relaxed">
                  Cepilla tus dientes al menos dos veces al día y usa hilo dental diariamente para mantener una sonrisa saludable.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* CSS para animaciones blob */}
      <style>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(20px, -50px) scale(1.1);
          }
          50% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          75% {
            transform: translate(50px, 50px) scale(1.05);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </>
  );
};

export default PacienteDashboard;
