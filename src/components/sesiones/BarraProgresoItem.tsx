import React from "react";
import { obtenerColorProgreso } from "../../services/sesionesTratamientoService";

interface BarraProgresoItemProps {
  progreso: number; // 0-100
  mostrarPorcentaje?: boolean;
  altura?: string;
  animate?: boolean;
}

/**
 * Componente para mostrar una barra de progreso visual
 * Colores dinámicos según el porcentaje:
 * - Rojo: 0-30%
 * - Amarillo: 30-70%
 * - Azul: 70-100%
 * - Verde: 100%
 */
const BarraProgresoItem: React.FC<BarraProgresoItemProps> = ({
  progreso,
  mostrarPorcentaje = true,
  altura = "h-4",
  animate = true,
}) => {
  // Limitar progreso entre 0 y 100
  const progresoNormalizado = Math.min(Math.max(progreso, 0), 100);
  const colorClase = obtenerColorProgreso(progresoNormalizado);

  return (
    <div className="w-full">
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${altura}`}>
        <div
          className={`${colorClase} ${altura} rounded-full flex items-center justify-center text-white text-xs font-semibold ${
            animate ? "transition-all duration-500 ease-out" : ""
          }`}
          style={{ width: `${progresoNormalizado}%` }}
        >
          {mostrarPorcentaje && progresoNormalizado > 10 && (
            <span className="px-2">{progresoNormalizado.toFixed(0)}%</span>
          )}
        </div>
      </div>
      {mostrarPorcentaje && progresoNormalizado <= 10 && (
        <div className="text-xs text-gray-600 mt-1 text-center">
          {progresoNormalizado.toFixed(0)}%
        </div>
      )}
    </div>
  );
};

export default BarraProgresoItem;
