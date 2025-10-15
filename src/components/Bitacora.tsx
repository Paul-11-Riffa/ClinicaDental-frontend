// src/components/Bitacora.tsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Api } from '../lib/Api';

interface BitacoraEntry {
    id: number;
    accion: string;
    accion_display: string;
    descripcion: string;
    fecha_hora: string; // ← ISO del back (con offset)
    usuario_nombre: string;
    ip_address: string;
    user_agent: string;
    modelo_afectado?: string | null;
    objeto_id?: number | null;
    datos_adicionales?: Record<string, any> | null;
}

interface BitacoraStats {
    total_registros: number;
    acciones: { [key: string]: number };
    usuarios_activos: { [key: string]: number };
    actividad_diaria: { [key: string]: number };
    periodo: string;
}

// Formatea en la zona/offset del navegador a dd/mm/yyyy HH:mm:ss
/*const formatLocal = (iso: string) =>
    new Intl.DateTimeFormat('es-BO', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).format(new Date(iso));
*/
type TzMode = 'local' | 'la_paz';

const formatDate = (iso: string, tz: TzMode = 'local') => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;

    const base: Intl.DateTimeFormatOptions = {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false,
    };

    const fmt = new Intl.DateTimeFormat(
        'es-BO',
        tz === 'la_paz' ? { ...base, timeZone: 'America/La_Paz' } : base
    );

    return fmt.format(d);
};

const Bitacora: React.FC = () => {
    const [entries, setEntries] = useState<BitacoraEntry[]>([]);
    const [stats, setStats] = useState<BitacoraStats | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState({
        accion: '',
        fecha_desde: '',
        fecha_hasta: '',
        search: '',
    });
    const [showStats, setShowStats] = useState(false);

    const { token } = useAuth();

    const fetchBitacora = async (page = 1) => {
        if (!token) return;
        setLoading(true);
        setError('');
        try {
            const { data } = await Api.get('/bitacora/', {
                params: {
                    page,
                    ...(filters.accion && { accion: filters.accion }),
                    ...(filters.fecha_desde && { fecha_desde: filters.fecha_desde }),
                    ...(filters.fecha_hasta && { fecha_hasta: filters.fecha_hasta }),
                    ...(filters.search && { search: filters.search }),
                },
                headers: { Authorization: `Token ${token}` }, // ← importante
            });
            setEntries(data.results);
            setTotalPages(Math.ceil(data.count / 25));
            setCurrentPage(page);
        } catch (e: any) {
            const status = e?.response?.status;
            if (status === 403) setError('No tienes permisos para ver la bitácora.');
            else setError('Error al cargar la bitácora.');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        if (!token) return;
        try {
            const { data } = await Api.get('/bitacora/estadisticas/', {
                headers: { Authorization: `Token ${token}` }, // ← importante
            });
            setStats(data);
        } catch (e: any) {
            // No rompemos la página si falla; solo mostramos el botón igual
            console.error('Error al cargar estadísticas:', e);
        }
    };

    useEffect(() => {
        fetchBitacora();
        fetchStats();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const applyFilters = () => {
        setCurrentPage(1);
        fetchBitacora(1);
    };

    const clearFilters = () => {
        setFilters({ accion: '', fecha_desde: '', fecha_hasta: '', search: '' });
        setCurrentPage(1);
        fetchBitacora(1);
    };

    const getActionColor = (accion: string) => {
        switch (accion) {
            case 'login':
                return 'text-green-600 bg-green-100';
            case 'logout':
                return 'text-gray-600 bg-gray-100';
            case 'registro':
                return 'text-blue-600 bg-blue-100';
            case 'crear_cita':
                return 'text-purple-600 bg-purple-100';
            case 'modificar_cita':
                return 'text-yellow-600 bg-yellow-100';
            case 'eliminar_cita':
                return 'text-red-600 bg-red-100';
            default:
                return 'text-gray-600 bg-gray-100';
        }
    };

    if (error && error.includes('permisos')) {
        return (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Bitácora de Auditoría</h2>
                <button
                    onClick={() => setShowStats(!showStats)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    {showStats ? 'Ocultar Estadísticas' : 'Ver Estadísticas'}
                </button>
            </div>

            {/* Estadísticas */}
            {showStats && stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg shadow border">
                        <h3 className="font-semibold text-gray-900">Total Registros</h3>
                        <p className="text-2xl font-bold text-blue-600">{stats.total_registros}</p>
                        <p className="text-sm text-gray-500">{stats.periodo}</p>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow border">
                        <h3 className="font-semibold text-gray-900">Acciones Principales</h3>
                        <div className="space-y-1">
                            {Object.entries(stats.acciones)
                                .slice(0, 3)
                                .map(([accion, count]) => (
                                    <div key={accion} className="flex justify-between text-sm">
                                        <span className="truncate">{accion}</span>
                                        <span className="font-medium">{count}</span>
                                    </div>
                                ))}
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow border">
                        <h3 className="font-semibold text-gray-900">Usuarios Activos</h3>
                        <div className="space-y-1">
                            {Object.entries(stats.usuarios_activos)
                                .slice(0, 3)
                                .map(([usuario, count]) => (
                                    <div key={usuario} className="flex justify-between text-sm">
                                        <span className="truncate">{usuario}</span>
                                        <span className="font-medium">{count}</span>
                                    </div>
                                ))}
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow border">
                        <h3 className="font-semibold text-gray-900">Actividad Diaria</h3>
                        <div className="space-y-1">
                            {Object.entries(stats.actividad_diaria)
                                .slice(0, 3)
                                .map(([fecha, count]) => (
                                    <div key={fecha} className="flex justify-between text-sm">
                                        <span>{fecha}</span>
                                        <span className="font-medium">{count}</span>
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Filtros */}
            <div className="bg-white p-4 rounded-lg shadow border">
                <h3 className="font-semibold text-gray-900 mb-4">Filtros</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Acción</label>
                        <select
                            value={filters.accion}
                            onChange={(e) => handleFilterChange('accion', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Todas las acciones</option>
                            <option value="login">Inicio de sesión</option>
                            <option value="logout">Cierre de sesión</option>
                            <option value="registro">Registro</option>
                            <option value="crear_cita">Crear cita</option>
                            <option value="modificar_cita">Modificar cita</option>
                            <option value="eliminar_cita">Eliminar cita</option>
                            <option value="crear_paciente">Crear paciente</option>
                            <option value="modificar_paciente">Modificar paciente</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
                        <input
                            type="date"
                            value={filters.fecha_desde}
                            onChange={(e) => handleFilterChange('fecha_desde', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
                        <input
                            type="date"
                            value={filters.fecha_hasta}
                            onChange={(e) => handleFilterChange('fecha_hasta', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
                        <input
                            type="text"
                            placeholder="Usuario, descripción, IP..."
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div className="flex gap-2 mt-4">
                    <button
                        onClick={applyFilters}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                        Aplicar Filtros
                    </button>
                    <button
                        onClick={clearFilters}
                        className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                    >
                        Limpiar
                    </button>
                </div>
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-lg shadow border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Fecha/Hora
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Acción
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Usuario
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Descripción
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                IP
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Detalles
                            </th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                    Cargando...
                                </td>
                            </tr>
                        ) : entries.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                    No hay registros para mostrar
                                </td>
                            </tr>
                        ) : (
                            entries.map((entry) => (
                                <tr key={entry.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {formatDate(entry.fecha_hora)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(
                              entry.accion
                          )}`}
                      >
                        {entry.accion_display}
                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {entry.usuario_nombre}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{entry.descripcion}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {entry.ip_address}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {entry.modelo_afectado && (
                                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {entry.modelo_afectado}
                                                {entry.objeto_id && ` #${entry.objeto_id}`}
                        </span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>

                {/* Paginación */}
                {totalPages > 1 && (
                    <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                        <div className="flex items-center justify-between">
                            <div className="flex-1 flex justify-between sm:hidden">
                                <button
                                    onClick={() => fetchBitacora(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Anterior
                                </button>
                                <button
                                    onClick={() => fetchBitacora(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Siguiente
                                </button>
                            </div>
                            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm text-gray-700">
                                        Página <span className="font-medium">{currentPage}</span> de{' '}
                                        <span className="font-medium">{totalPages}</span>
                                    </p>
                                </div>
                                <div>
                                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                        <button
                                            onClick={() => fetchBitacora(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                        >
                                            ‹
                                        </button>
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            const page = i + 1;
                                            return (
                                                <button
                                                    key={page}
                                                    onClick={() => fetchBitacora(page)}
                                                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                        page === currentPage
                                                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    {page}
                                                </button>
                                            );
                                        })}
                                        <button
                                            onClick={() => fetchBitacora(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                        >
                                            ›
                                        </button>
                                    </nav>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {error && (
                <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>
            )}
        </div>
    );
};

export default Bitacora;
