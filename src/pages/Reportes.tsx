// src/pages/Reportes.tsx
import { useState, useEffect } from 'react';
import { Api } from '../lib/Api';
import { useAuth } from '../context/AuthContext';
import TopBar from '../components/TopBar';
import { toast, Toaster } from 'react-hot-toast';

interface ConsultaReporte {
  idconsulta: number;
  fecha: string;
  paciente_nombre: string;
  paciente_apellido: string;
  paciente_rut: string;
  odontologo_nombre: string;
  odontologo_apellido: string;
  hora_inicio: string;
  tipo_consulta: string;
  estado: string;
}

interface PacienteReporte {
  codusuario: {
    codigo: number;
    nombre: string;
    apellido: string;
    correoelectronico: string;
    telefono?: string;
    sexo?: string;
  };
  carnetidentidad: string;
  fechanacimiento: string;
  direccion?: string;
}

const Reportes = () => {
  const { user, isAuth } = useAuth();
  const [activeTab, setActiveTab] = useState<'consultas' | 'pacientes'>('consultas');
  const [consultasData, setConsultasData] = useState<ConsultaReporte[]>([]);
  const [pacientesData, setPacientesData] = useState<PacienteReporte[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filtros
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [odontologoFilter, setOdontologoFilter] = useState('');

  // Función auxiliar para procesar respuestas del backend
  const processApiResponse = (data: any, type: 'consultas' | 'pacientes'): any[] => {
    console.log(`Procesando respuesta ${type}:`, data);
    
    // Si ya es un array, devolverlo directamente
    if (Array.isArray(data)) {
      return data;
    }
    
    // Si tiene una propiedad 'results' que es array (paginación)
    if (data?.results && Array.isArray(data.results)) {
      return data.results;
    }
    
    // Si tiene una propiedad específica para el tipo
    if (type === 'consultas' && data?.consultas && Array.isArray(data.consultas)) {
      return data.consultas;
    }
    
    if (type === 'pacientes' && data?.pacientes && Array.isArray(data.pacientes)) {
      return data.pacientes;
    }
    
    // Fallback: devolver array vacío y mostrar warning
    console.warn(`No se pudo procesar la respuesta ${type}:`, data);
    return [];
  };

  // Función auxiliar para obtener el nombre del paciente
  const getPacienteNombre = (consulta: ConsultaReporte): string => {
    try {
      return `${consulta.paciente_nombre} ${consulta.paciente_apellido}`.trim() || 'Sin paciente';
    } catch (error) {
      console.warn('Error obteniendo nombre del paciente:', error);
      return 'Sin paciente';
    }
  };

  // Función auxiliar para obtener el nombre del odontólogo
  const getOdontologoNombre = (consulta: ConsultaReporte): string => {
    try {
      return `Dr. ${consulta.odontologo_nombre} ${consulta.odontologo_apellido}`.trim() || 'Sin odontólogo';
    } catch (error) {
      console.warn('Error obteniendo nombre del odontólogo:', error);
      return 'Sin odontólogo';
    }
  };

  // Función auxiliar para obtener el tipo de consulta
  const getTipoConsulta = (consulta: ConsultaReporte): string => {
    try {
      return consulta.tipo_consulta || 'Sin tipo';
    } catch (error) {
      console.warn('Error obteniendo tipo de consulta:', error);
      return 'Sin tipo';
    }
  };

  // Función auxiliar para obtener el estado
  const getEstado = (consulta: ConsultaReporte): string => {
    try {
      return consulta.estado || 'Sin estado';
    } catch (error) {
      console.warn('Error obteniendo estado:', error);
      return 'Sin estado';
    }
  };

  // Función auxiliar para obtener la hora
  const getHora = (consulta: ConsultaReporte): string => {
    try {
      return consulta.hora_inicio || 'Sin hora';
    } catch (error) {
      console.warn('Error obteniendo hora:', error);
      return 'Sin hora';
    }
  };

  // Función auxiliar para formatear fechas
  const formatearFecha = (fecha: any): string => {
    if (!fecha) return 'Sin fecha';
    try {
      return new Date(fecha).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      console.warn('Error formateando fecha:', fecha);
      return 'Fecha inválida';
    }
  };

  // Función para convertir fecha de input (YYYY-MM-DD) a formato backend (DD/MM/YYYY)
  const convertirFechaParaBackend = (fecha: string): string => {
    if (!fecha) return '';
    try {
      const [year, month, day] = fecha.split('-');
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.warn('Error convirtiendo fecha:', fecha);
      return '';
    }
  };

  useEffect(() => {
    if (isAuth) {
      loadReportes();
    }
  }, [isAuth, activeTab]);

  const loadReportes = async () => {
    setLoading(true);
    setError('');
    
    try {
      if (activeTab === 'consultas') {
        const params = new URLSearchParams();
        
        // Convertir fechas al formato que espera el backend (DD/MM/YYYY)
        if (fechaInicio) {
          const fechaConvertida = convertirFechaParaBackend(fechaInicio);
          if (fechaConvertida) params.append('fecha_inicio', fechaConvertida);
        }
        if (fechaFin) {
          const fechaConvertida = convertirFechaParaBackend(fechaFin);
          if (fechaConvertida) params.append('fecha_fin', fechaConvertida);
        }
        if (odontologoFilter) params.append('odontologo', odontologoFilter);

        // Usar el endpoint correcto según la documentación
        const response = await Api.get(`/reportes/?${params.toString()}`);
        
        console.log('🔍 URL generada:', `/reportes/?${params.toString()}`);
        console.log('📅 Filtros aplicados:', {
          fecha_inicio_original: fechaInicio,
          fecha_inicio_convertida: fechaInicio ? convertirFechaParaBackend(fechaInicio) : null,
          fecha_fin_original: fechaFin,
          fecha_fin_convertida: fechaFin ? convertirFechaParaBackend(fechaFin) : null,
          odontologo: odontologoFilter
        });
        
        // Usar la función auxiliar para procesar la respuesta
        const consultasArray = processApiResponse(response.data, 'consultas');
        
        console.log('Respuesta consultas:', response.data);
        console.log('Array procesado:', consultasArray);
        setConsultasData(consultasArray);
      } else {
        // Para pacientes, usar el endpoint específico
        const response = await Api.get('/reportes/pacientes/');
        
        console.log('🔍 URL pacientes:', '/reportes/pacientes/');
        
        // Usar la función auxiliar para procesar la respuesta
        const pacientesArray = processApiResponse(response.data, 'pacientes');
        
        console.log('Respuesta pacientes:', response.data);
        console.log('Array procesado:', pacientesArray);
        setPacientesData(pacientesArray);
      }
    } catch (err: any) {
      console.error('Error cargando reportes:', err);
      setError('Error al cargar los reportes');
      toast.error('Error al cargar los reportes');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = (data: any[], filename: string) => {
    // Validación más estricta para asegurar que data es un array
    if (!Array.isArray(data) || data.length === 0) {
      toast.error('No hay datos para exportar o el formato es incorrecto');
      console.warn('Datos para exportar:', data);
      return;
    }

    // Para consultas, crear headers más legibles
    if (filename.includes('consultas') && data.length > 0 && 'idconsulta' in data[0]) {
      const csvData = data.map(consulta => ({
        'ID': consulta.idconsulta || '',
        'Fecha': formatearFecha(consulta.fecha) || '',
        'Hora': consulta.hora_inicio || '',
        'Paciente': `${consulta.paciente_nombre || ''} ${consulta.paciente_apellido || ''}`.trim(),
        'RUT': consulta.paciente_rut || '',
        'Odontólogo': `${consulta.odontologo_nombre || ''} ${consulta.odontologo_apellido || ''}`.trim(),
        'Tipo de Consulta': consulta.tipo_consulta || '',
        'Estado': consulta.estado || ''
      }));

      const headers = Object.keys(csvData[0]);
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => headers.map(header => `"${(row as any)[header]}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Reporte exportado exitosamente');
      return;
    }

    // Para otros tipos de datos, usar el método genérico
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Reporte exportado exitosamente');
  };

  if (!isAuth) {
    return <div>Cargando...</div>;
  }

  // Verificar permisos - solo administradores pueden ver reportes
  const puedeVerReportes = user?.subtipo === "administrador" || user?.idtipousuario === 1;
  
  if (!puedeVerReportes) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopBar />
        <div className="flex flex-col items-center justify-center px-4 pt-10">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-8 text-center">
            <h2 className="text-xl font-bold text-gray-800">Acceso no autorizado</h2>
            <p className="text-gray-600 mt-2">
              Solo los administradores pueden acceder a los reportes del sistema.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar />
      <Toaster position="top-right" />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Reportes del Sistema</h1>
          <p className="text-gray-600 mt-2">
            Genera y visualiza reportes de consultas y pacientes
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('consultas')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'consultas'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Reporte de Consultas
              </button>
              <button
                onClick={() => setActiveTab('pacientes')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'pacientes'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Reporte de Pacientes
              </button>
            </nav>
          </div>
        </div>

        {/* Filtros para consultas */}
        {activeTab === 'consultas' && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Inicio
                </label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Fin
                </label>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Odontólogo (nombre completo)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Pedro Martínez"
                  value={odontologoFilter}
                  onChange={(e) => setOdontologoFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mt-4 flex space-x-3">
              <button
                onClick={loadReportes}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Cargando...' : 'Aplicar Filtros'}
              </button>
              <button
                onClick={() => {
                  setFechaInicio('');
                  setFechaFin('');
                  setOdontologoFilter('');
                  loadReportes();
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                Limpiar Filtros
              </button>
            </div>
          </div>
        )}

        {/* Contenido principal */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              {activeTab === 'consultas' ? 'Reporte de Consultas' : 'Reporte de Pacientes'}
            </h2>
            <button
              onClick={() => exportToCSV(
                activeTab === 'consultas' ? consultasData : pacientesData,
                `reporte_${activeTab}_${new Date().toISOString().split('T')[0]}`
              )}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Exportar CSV
            </button>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Cargando datos...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-600">
                {error}
              </div>
            ) : (
              <>
                {activeTab === 'consultas' ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hora</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paciente</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Odontólogo</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {Array.isArray(consultasData) && consultasData.map((consulta, index) => {
                          // Debug: mostrar la estructura de cada consulta
                          if (index === 0) {
                            console.log('Estructura de consulta:', consulta);
                            console.log('Campos disponibles:', Object.keys(consulta));
                          }
                          
                          return (
                            <tr key={consulta.idconsulta || index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatearFecha(consulta.fecha)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {getHora(consulta)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {getPacienteNombre(consulta)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {getOdontologoNombre(consulta)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {getTipoConsulta(consulta)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  getEstado(consulta) === 'Completada' 
                                    ? 'bg-green-100 text-green-800'
                                    : getEstado(consulta) === 'Cancelada'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {getEstado(consulta)}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {(!Array.isArray(consultasData) || consultasData.length === 0) && (
                      <div className="text-center py-8 text-gray-500">
                        {!Array.isArray(consultasData) 
                          ? 'Error: Los datos no están en el formato correcto'
                          : 'No se encontraron consultas con los filtros aplicados'
                        }
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CI</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Nac.</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {Array.isArray(pacientesData) && pacientesData.map((paciente, index) => (
                          <tr key={paciente.codusuario.codigo || index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {paciente.codusuario.nombre} {paciente.codusuario.apellido}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {paciente.codusuario.correoelectronico}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {paciente.codusuario.telefono || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {paciente.carnetidentidad || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {paciente.fechanacimiento ? formatearFecha(paciente.fechanacimiento) : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {(!Array.isArray(pacientesData) || pacientesData.length === 0) && (
                      <div className="text-center py-8 text-gray-500">
                        {!Array.isArray(pacientesData) 
                          ? 'Error: Los datos no están en el formato correcto'
                          : 'No se encontraron pacientes'
                        }
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reportes;