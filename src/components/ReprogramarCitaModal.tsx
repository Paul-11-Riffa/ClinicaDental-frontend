// src/components/ReprogramarCitaModal.tsx

import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { reprogramarCita, obtenerHorariosDisponibles } from '../lib/Api';

// --- Interfaces para los datos que vamos a manejar ---
interface Consulta {
    id: number;
    fecha: string;
    cododontologo: {
        // Necesitamos el código del odontólogo para buscar sus citas
        codigo: number;
        codusuario: {
            nombre: string;
            apellido: string;
        };
    };
    idhorario: {
        id: number;
        hora: string;
    };
}

interface Horario {
    id: number;
    hora: string;
}

// --- Props que el modal recibirá de la página 'MisCitas' ---
interface ReprogramarCitaModalProps {
    isOpen: boolean;
    onClose: () => void;
    cita: Consulta | null;
    onCitaReprogramada: (citaActualizada: any) => void;
}

export const ReprogramarCitaModal = ({ isOpen, onClose, cita, onCitaReprogramada }: ReprogramarCitaModalProps) => {
    // --- Estados para manejar el formulario y la carga de datos ---
    const [nuevaFecha, setNuevaFecha] = useState('');
    const [nuevoHorarioId, setNuevoHorarioId] = useState<number | null>(null);
    const [horariosDisponibles, setHorariosDisponibles] = useState<Horario[]>([]);
    const [loadingHorarios, setLoadingHorarios] = useState(false);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- Efecto para buscar horarios disponibles ---
    // Se ejecuta cada vez que el usuario cambia la fecha.
    useEffect(() => {
        if (!isOpen || !cita || !nuevaFecha) {
            setHorariosDisponibles([]);
            return;
        }

        const fetchHorariosDisponibles = async () => {
            setLoadingHorarios(true);
            setError('');
            try {
                // Usar el código del odontólogo directamente
                const odontologoId = cita.cododontologo.codigo;
                const horarios = await obtenerHorariosDisponibles(nuevaFecha, odontologoId);
                setHorariosDisponibles(horarios);

            } catch (err) {
                console.error("Error al buscar horarios", err);
                setError('No se pudieron cargar los horarios. Intente más tarde.');
            } finally {
                setLoadingHorarios(false);
            }
        };

        fetchHorariosDisponibles();
    }, [nuevaFecha, cita, isOpen]);

    // --- Efecto para resetear el estado cuando se abre el modal ---
    useEffect(() => {
        if (isOpen && cita) {
            setNuevaFecha(cita.fecha); // Inicializa con la fecha actual de la cita
            setNuevoHorarioId(null);
            setError('');
            setIsSubmitting(false);
        }
    }, [isOpen, cita]);


    // --- Manejador del envío del formulario ---
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!cita || !nuevoHorarioId || !nuevaFecha) {
            setError('Por favor, selecciona una nueva fecha y hora.');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const citaActualizada = await reprogramarCita(cita.id, nuevaFecha, nuevoHorarioId);
            alert('¡Cita reprogramada con éxito!');
            // Pasar la cita completa actualizada que viene del backend
            onCitaReprogramada(citaActualizada);
            onClose(); // Cierra el modal
        } catch (err: any) {
            const errorMsg = err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || 'El horario seleccionado ya no está disponible. Por favor, elige otro.';
            setError(errorMsg);
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Si no está abierto o no hay cita, no renderiza nada
    if (!isOpen || !cita) {
        return null;
    }

    // --- Renderizado del Modal ---
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Reprogramar Cita</h2>
                <p className="mb-2 text-sm text-gray-600">Odontólogo: <span className="font-medium text-gray-800">{cita.cododontologo.codusuario.nombre} {cita.cododontologo.codusuario.apellido}</span></p>
                <p className="mb-4 text-sm text-gray-600">Cita actual: <span className="font-medium text-gray-800">{cita.fecha} a las {cita.idhorario.hora}</span></p>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="fecha" className="block text-sm font-medium text-gray-700">Nueva Fecha</label>
                        <input
                            type="date"
                            id="fecha"
                            value={nuevaFecha}
                            onChange={(e) => setNuevaFecha(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="horario" className="block text-sm font-medium text-gray-700">Nueva Hora</label>
                        <select
                            id="horario"
                            value={nuevoHorarioId || ''}
                            onChange={(e) => setNuevoHorarioId(Number(e.target.value))}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                            required
                            disabled={loadingHorarios || !nuevaFecha}
                        >
                            <option value="" disabled>
                                {loadingHorarios ? 'Cargando horarios...' : 'Selecciona una hora'}
                            </option>
                            {horariosDisponibles.length > 0 ? (
                                horariosDisponibles.map(horario => (
                                    <option key={horario.id} value={horario.id}>{horario.hora}</option>
                                ))
                            ) : (
                                !loadingHorarios && nuevaFecha && <option disabled>No hay horarios disponibles</option>
                            )}
                        </select>
                    </div>

                    {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 disabled:bg-cyan-300"
                            disabled={isSubmitting || !nuevoHorarioId}
                        >
                            {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};