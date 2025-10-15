import React, {useState, useEffect} from 'react';
import {Api} from '../lib/Api';
import {useAuth} from '../context/AuthContext';
import {useNavigate} from 'react-router-dom';
import TopBar from '../components/TopBar';

// ... (Las interfaces Odontologo, Horario, TipoConsulta y Paciente se quedan igual) ...
interface Odontologo {
    codusuario: { codigo: number; nombre: string; apellido: string; };
}

interface Horario {
    id: number;
    hora: string;
}

interface TipoConsulta {
    id: number;
    nombreconsulta: string;
}

interface Paciente {
    carnetidentidad: string;
    direccion: string;
    fechanacimiento: string;
    codusuario: { codigo: number; };
}


const AgendarCita = () => {
    const {user} = useAuth();
    const navigate = useNavigate();
    const [odontologos, setOdontologos] = useState<Odontologo[]>([]);
    const [horarios, setHorarios] = useState<Horario[]>([]);
    const [tiposConsulta, setTiposConsulta] = useState<TipoConsulta[]>([]);
    const [pacientes, setPacientes] = useState<Paciente[]>([]);

    const [selectedOdontologo, setSelectedOdontologo] = useState('');
    const [selectedFecha, setSelectedFecha] = useState('');
    const [selectedHorario, setSelectedHorario] = useState('');
    const [selectedTipoConsulta, setSelectedTipoConsulta] = useState('');

    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [odontologosRes, horariosRes, tiposConsultaRes, pacientesRes] = await Promise.all([
                    Api.get('/odontologos/'), Api.get('/horarios/'), Api.get('/tipos-consulta/'), Api.get('/pacientes/')
                ]);
                setOdontologos(odontologosRes.data.results || []);
                setHorarios(horariosRes.data.results || []);
                setTiposConsulta(tiposConsultaRes.data.results || []);
                setPacientes(pacientesRes.data.results || []);
            } catch (fetchError) {
                setError('Error al cargar los datos necesarios para agendar.');
                console.error("Error cargando datos:", fetchError);
            }
        };
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setIsSubmitting(true);

        if (!user) {
            setError('Debes iniciar sesión para agendar una cita.');
            setIsSubmitting(false);
            return;
        }

        const pacienteActual = pacientes.find(p => p.codusuario.codigo === user.codigo);
        if (!pacienteActual) {
            setError('No se encontró el perfil de paciente para este usuario.');
            setIsSubmitting(false);
            return;
        }

        const nuevaConsulta = {
            fecha: selectedFecha,
            codpaciente: pacienteActual.codusuario.codigo,
            cododontologo: parseInt(selectedOdontologo, 10),
            idhorario: parseInt(selectedHorario, 10),
            idtipoconsulta: parseInt(selectedTipoConsulta, 10),
            idestadoconsulta: 1,
        };

        try {
            await Api.post('/consultas/', nuevaConsulta);
            setMessage('¡Cita agendada con éxito! Redirigiendo al dashboard...');
            
            // Limpiar el formulario
            setSelectedOdontologo('');
            setSelectedFecha('');
            setSelectedHorario('');
            setSelectedTipoConsulta('');
            
            // Redirigir al dashboard después de 2 segundos
            setTimeout(() => {
                navigate('/dashboard');
            }, 2000);
            
        } catch (submitError: any) {
            if (submitError.response?.status === 400) {
                setError('El horario seleccionado ya está ocupado. Por favor, elige otro horario.');
            } else {
                setError('Hubo un error al agendar la cita. Por favor, inténtalo de nuevo.');
            }
            console.error('Error al agendar la cita:', submitError);
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- 👇 AQUÍ ESTÁ LA LÓGICA NUEVA ---
    if (!user) {
        return <div>Cargando...</div>; // Muestra un mensaje de carga mientras el usuario se establece
    }

    // Si el usuario NO es un paciente (rol ID 2), muestra un mensaje y no el formulario.
    if (user.idtipousuario !== 2) {
        return (
            <div className="min-h-screen bg-gray-50">
                <TopBar/>
                <div className="flex flex-col items-center justify-center px-4 pt-10">
                    <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-8 text-center">
                        <h2 className="text-xl font-bold text-gray-800">Acción no permitida</h2>
                        <p className="text-gray-600 mt-2">
                            Este formulario es para que los pacientes agenden sus propias citas. Los administradores y
                            recepcionistas deben gestionar las citas desde la sección "Agenda de la Clínica".
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <TopBar/>
            <div className="flex flex-col items-center justify-center px-4 pt-10 pb-20">
                <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-6 md:p-8">
                    <div className="flex flex-col items-center mb-6">
                        <img src="/dentist.svg" className="w-12 h-12 mb-3" alt="Icono de diente"/>
                        <h2 className="text-2xl font-bold text-gray-800">Agendar Nueva Cita</h2>
                        <p className="text-sm text-gray-500 mt-1">Completa los siguientes campos para programar tu
                            visita.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">

                        <div>
                            <label htmlFor="odontologo"
                                   className="block text-sm font-medium text-gray-700 mb-1">Odontólogo</label>
                            <select id="odontologo" value={selectedOdontologo}
                                    onChange={(e) => setSelectedOdontologo(e.target.value)} required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500">
                                <option value="" disabled>Seleccione un odontólogo</option>
                                {odontologos.map(od => (
                                    <option key={od.codusuario.codigo}
                                            value={od.codusuario.codigo}>{od.codusuario.nombre} {od.codusuario.apellido}</option>
                                ))}
                            </select>
                        </div>

                        {/* Selector de Fecha */}
                        <div>
                            <label htmlFor="fecha"
                                   className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                            <input type="date" id="fecha" value={selectedFecha}
                                   onChange={(e) => setSelectedFecha(e.target.value)} required
                                   className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500"/>
                        </div>

                        {/* Selector de Horario */}
                        <div>
                            <label htmlFor="horario"
                                   className="block text-sm font-medium text-gray-700 mb-1">Horario</label>
                            <select id="horario" value={selectedHorario}
                                    onChange={(e) => setSelectedHorario(e.target.value)} required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500">
                                <option value="" disabled>Seleccione una hora</option>
                                {horarios.map(h => (<option key={h.id} value={h.id}>{h.hora}</option>))}
                            </select>
                        </div>

                        {/* Selector de Tipo de Consulta */}
                        <div>
                            <label htmlFor="tipo-consulta" className="block text-sm font-medium text-gray-700 mb-1">Tipo
                                de Consulta</label>
                            <select id="tipo-consulta" value={selectedTipoConsulta}
                                    onChange={(e) => setSelectedTipoConsulta(e.target.value)} required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500">
                                <option value="" disabled>Seleccione el motivo</option>
                                {tiposConsulta.map(tc => (
                                    <option key={tc.id} value={tc.id}>{tc.nombreconsulta}</option>))}
                            </select>
                        </div>

                        {/* Botón de envío */}
                        <button 
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-cyan-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-colors duration-300 disabled:bg-cyan-300 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Agendando...' : 'Agendar Cita'}
                        </button>
                    </form>

                    {/* Mensajes de feedback */}
                    {message && (
                        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center">
                                <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <p className="text-sm font-medium text-green-800">{message}</p>
                            </div>
                        </div>
                    )}
                    {error && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center">
                                <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <p className="text-sm font-medium text-red-800">{error}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AgendarCita;