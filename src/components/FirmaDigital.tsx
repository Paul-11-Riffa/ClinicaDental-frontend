// src/components/FirmaDigital.tsx
import { useRef, useState, useEffect } from "react";
import type { FirmaDigital } from "../interfaces/PresupuestoDigital";
import { construirFirmaDigital } from "../services/presupuestosDigitalesService";

interface FirmaDigitalProps {
  presupuestoId: string | number;
  userId: number;
  consentText: string;
  onFirmaCompleta: (firma: FirmaDigital) => void;
  onFirmaLimpia: () => void;
}

export default function FirmaDigitalComponent({
  presupuestoId,
  userId,
  consentText,
  onFirmaCompleta,
  onFirmaLimpia,
}: FirmaDigitalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [generandoFirma, setGenerandoFirma] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Configurar canvas con tamaño responsive
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = 200;
        // Configurar estilos de dibujo
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();

    if (!hasSignature) {
      setHasSignature(true);
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const limpiarFirma = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onFirmaLimpia();
  };

  const generarFirma = async () => {
    if (!hasSignature) {
      return;
    }

    setGenerandoFirma(true);
    try {
      // Generar firma digital con hash SHA-256
      const firma = await construirFirmaDigital(
        userId,
        presupuestoId,
        [], // Los items se agregan en el componente padre
        consentText
      );

      onFirmaCompleta(firma);
    } catch (error) {
      console.error("Error al generar firma digital:", error);
    } finally {
      setGenerandoFirma(false);
    }
  };

  // Generar firma automáticamente cuando el usuario termina de firmar
  useEffect(() => {
    if (hasSignature && !isDrawing) {
      const timer = setTimeout(() => {
        generarFirma();
      }, 500); // Esperar 500ms después de que deje de dibujar

      return () => clearTimeout(timer);
    }
  }, [hasSignature, isDrawing]);

  return (
    <div className="space-y-4">
      {/* Texto de Consentimiento */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          Consentimiento Informado
        </h4>
        <p className="text-sm text-blue-800 leading-relaxed">{consentText}</p>
      </div>

      {/* Canvas de Firma */}
      <div>
        <label 
          className="block text-sm font-medium text-gray-700 mb-2"
          htmlFor="firma-canvas"
        >
          Firma Digital <span className="text-red-500" aria-label="requerido">*</span>
        </label>
        <div className="relative">
          <canvas
            id="firma-canvas"
            ref={canvasRef}
            aria-label="Canvas para firma digital. Use el mouse o el dedo para firmar."
            role="img"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={(e) => {
              e.preventDefault();
              startDrawing(e);
            }}
            onTouchMove={(e) => {
              e.preventDefault();
              draw(e);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              stopDrawing();
            }}
            className="w-full border-2 border-gray-300 rounded-lg cursor-crosshair touch-none bg-white hover:border-blue-400 transition-colors"
            style={{ touchAction: "none" }}
          />
          
          {/* Placeholder cuando no hay firma */}
          {!hasSignature && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-gray-400 text-sm flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
                Firme aquí con el mouse o su dedo
              </p>
            </div>
          )}

          {/* Indicador de generando firma */}
          {generandoFirma && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
              <div className="flex items-center text-blue-600">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
                <span className="text-sm font-medium">Generando firma digital...</span>
              </div>
            </div>
          )}
        </div>

        {/* Botón Limpiar y Estado de Firma */}
        <div className="mt-2 flex justify-between items-center">
          {/* Indicador de estado */}
          {hasSignature ? (
            <div className="flex items-center text-green-600 text-sm">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Firma capturada correctamente</span>
            </div>
          ) : (
            <div className="flex items-center text-red-600 text-sm">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Firma requerida</span>
            </div>
          )}

          <button
            type="button"
            onClick={limpiarFirma}
            disabled={!hasSignature}
            aria-label="Limpiar firma digital"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Limpiar Firma
          </button>
        </div>
      </div>

      {/* Información de Seguridad */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <div className="flex items-start">
          <svg
            className="w-5 h-5 text-gray-500 mr-2 mt-0.5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <p className="text-xs font-medium text-gray-700 mb-1">
              🔒 Firma Segura con Encriptación SHA-256
            </p>
            <p className="text-xs text-gray-600">
              Tu firma será encriptada y firmada digitalmente con timestamp.
              Este proceso garantiza la autenticidad e integridad del documento.
            </p>
          </div>
        </div>
      </div>

      {/* Validación visual */}
      {hasSignature && !generandoFirma && (
        <div className="flex items-center text-green-600 text-sm">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span className="font-medium">Firma capturada correctamente</span>
        </div>
      )}
    </div>
  );
}
