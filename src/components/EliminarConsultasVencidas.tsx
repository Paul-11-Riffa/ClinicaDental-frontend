{/*import { useState } from 'react';
import { eliminarConsultasVencidas } from '../lib/Api';

interface EliminarConsultasVencidasProps {
    onConsultasEliminadas?: () => void;
}

export const EliminarConsultasVencidas = ({ onConsultasEliminadas }: EliminarConsultasVencidasProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleEliminarConsultas = async () => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar todas las consultas vencidas? Esta acción no se puede deshacer.')) {
            return;
        }

        setIsLoading(true);
        setError('');
        setMessage('');

        try {
            const result = await eliminarConsultasVencidas();
            setMessage(`Tarea iniciada: ${result.message}`);
            
            // Si hay callback, ejecutarlo para refrescar datos
            if (onConsultasEliminadas) {
                onConsultasEliminadas();
            }
        } catch (err: any) {
            if (err.response?.status === 403) {
                setError('No tienes permisos para ejecutar esta acción.');
            } else {
                setError('Error al eliminar consultas vencidas. Inténtalo de nuevo.');
            }
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Eliminar Consultas Vencidas
            </h3>
            <p className="text-sm text-gray-600 mb-4">
                Esta función elimina automáticamente todas las consultas que ya pasaron su fecha y hora límite.
                Las consultas canceladas o finalizadas no se eliminan.
            </p>
            
            {message && (
                <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                    {message}
                </div>
            )}
            
            {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                </div>
            )}
            
            <button
                onClick={handleEliminarConsultas}
                disabled={isLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed"
            >
                {isLoading ? 'Eliminando...' : 'Eliminar Consultas Vencidas'}
            </button>
        </div>
    );
};*/}
