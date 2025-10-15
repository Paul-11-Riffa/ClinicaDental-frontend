// src/components/FormularioFirma.tsx
import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { crearConsentimiento } from '../services/consentimientoService';
import type { NuevoConsentimientoData } from '../services/consentimientoService';

// Define las propiedades que el componente espera recibir
interface FormularioFirmaProps {
  pacienteId: number;
  consultaId?: number;
  titulo: string;
  texto: string;
  onFirmado: (consentimientoId: number) => void; // Función para notificar cuando se complete la firma
  onCancelar: () => void; // Función para cerrar o cancelar
}

export const FormularioFirma: React.FC<FormularioFirmaProps> = ({
  pacienteId,
  consultaId,
  titulo,
  texto,
  onFirmado,
  onCancelar,
}) => {
  // Referencia para acceder al lienzo de la firma
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [error, setError] = useState<string | null>(null);
  const [estaGuardando, setEstaGuardando] = useState(false);

  // Función para limpiar el lienzo
  const limpiarFirma = () => {
    sigCanvas.current?.clear();
    setError(null);
  };

  // Función para guardar la firma
  const guardarFirma = async () => {
    if (sigCanvas.current?.isEmpty()) {
      setError('Por favor, ingrese su firma en el recuadro.');
      return;
    }

    setError(null);
    setEstaGuardando(true);

    // Obtiene la firma como una imagen en formato Base64
    const firmaBase64 = sigCanvas.current?.toDataURL('image/png') ?? '';

    const datos: NuevoConsentimientoData = {
      paciente: pacienteId,
      consulta: consultaId,
      titulo: titulo,
      texto_contenido: texto,
      firma_base64: firmaBase64,
    };

    try {
      const nuevoConsentimiento = await crearConsentimiento(datos);
      // Llama a la función 'onFirmado' para notificar al componente padre
      onFirmado(nuevoConsentimiento.id);
    } catch (err) {
      setError('Ocurrió un error al guardar la firma. Inténtalo de nuevo.');
      console.error(err);
    } finally {
      setEstaGuardando(false);
    }
  };

  return (
    // Contenedor principal del formulario
    <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '8px', maxWidth: '600px', margin: 'auto' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>{titulo}</h2>
      
      {/* Contenedor para el texto del consentimiento con scroll */}
      <div style={{ height: '250px', overflowY: 'auto', border: '1px solid #e0e0e0', padding: '15px', marginBottom: '20px', whiteSpace: 'pre-wrap' }}>
        {texto}
      </div>
      
      <p style={{ marginBottom: '10px', fontWeight: 'bold' }}>Por favor, firme en el siguiente recuadro:</p>
      
      {/* Lienzo para la firma */}
      <div style={{ border: '2px dashed #007bff', borderRadius: '4px', width: '100%' }}>
        <SignatureCanvas
          ref={sigCanvas}
          penColor='black'
          canvasProps={{ width: 560, height: 200, className: 'sigCanvas' }}
        />
      </div>

      {/* Mensaje de error */}
      {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}

      {/* Botones de acción */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
        <button onClick={onCancelar} disabled={estaGuardando} style={{ padding: '10px 20px' }}>
          Cancelar
        </button>
        <div>
          <button onClick={limpiarFirma} disabled={estaGuardando} style={{ padding: '10px 20px', marginRight: '10px' }}>
            Limpiar
          </button>
          <button onClick={guardarFirma} disabled={estaGuardando} style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none' }}>
            {estaGuardando ? 'Guardando...' : 'Aceptar y Firmar'}
          </button>
        </div>
      </div>
    </div>
  );
};
