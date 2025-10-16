import { Api } from '../lib/Api';

export interface RegistroEmpresaData {
  // Datos de la empresa
  nombre_empresa: string;
  subdominio: string;
  telefono: string;
  direccion: string;
  
  // Datos del administrador
  nombre_admin: string;
  apellido_admin: string;
  email_admin: string;
  rut_admin: string;
  telefono_admin: string;
  
  // Plan seleccionado
  plan: 'basico' | 'profesional' | 'premium';
  
  // Stripe Payment Intent ID
  payment_intent_id?: string;
}

export interface RegistroEmpresaResponse {
  success: boolean;
  message: string;
  empresa_id?: number;
  subdominio?: string;
  redirect_url?: string;
}

export interface PaymentIntentData {
  amount: number;
  plan: string;
}

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
}

/**
 * Crear Payment Intent en Stripe
 */
export const crearPaymentIntent = async (data: PaymentIntentData): Promise<PaymentIntentResponse> => {
  try {
    const response = await Api.post<PaymentIntentResponse>('/empresas/crear-payment-intent/', data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error al crear Payment Intent:', error);
    throw new Error(error.response?.data?.message || 'Error al procesar el pago');
  }
};

/**
 * Registrar nueva empresa y crear cuenta de administrador
 */
export const registrarEmpresa = async (data: RegistroEmpresaData): Promise<RegistroEmpresaResponse> => {
  try {
    const response = await Api.post<RegistroEmpresaResponse>('/empresas/registrar/', data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error al registrar empresa:', error);
    
    // Extraer mensaje de error del backend
    const errorMessage = error.response?.data?.message 
      || error.response?.data?.error
      || 'Error al registrar la empresa';
    
    throw new Error(errorMessage);
  }
};

/**
 * Verificar disponibilidad de subdominio
 */
export const verificarSubdominio = async (subdominio: string): Promise<boolean> => {
  try {
    const response = await Api.post('/public/validar-subdomain/', {
      subdomain: subdominio  // Backend espera "subdomain" sin "io"
    });
    return response.data.disponible;
  } catch (error: any) {
    console.error('❌ Error al verificar subdominio:', error);
    return false;
  }
};

/**
 * Obtener planes disponibles
 */
export interface Plan {
  id: string;
  nombre: string;
  precio: number;
  caracteristicas: string[];
  popular?: boolean;
}

export const obtenerPlanes = (): Plan[] => {
  return [
    {
      id: 'basico',
      nombre: 'Plan Básico',
      precio: 29990,
      caracteristicas: [
        'Hasta 2 odontólogos',
        'Gestión de citas',
        'Historias clínicas digitales',
        'Soporte por email',
        'Almacenamiento 5GB'
      ]
    },
    {
      id: 'profesional',
      nombre: 'Plan Profesional',
      precio: 49990,
      popular: true,
      caracteristicas: [
        'Hasta 5 odontólogos',
        'Todo lo del Plan Básico',
        'Recordatorios automáticos',
        'Reportes avanzados',
        'Almacenamiento 20GB',
        'Soporte prioritario'
      ]
    },
    {
      id: 'premium',
      nombre: 'Plan Premium',
      precio: 79990,
      caracteristicas: [
        'Odontólogos ilimitados',
        'Todo lo del Plan Profesional',
        'API para integraciones',
        'Backup automático diario',
        'Almacenamiento 100GB',
        'Soporte 24/7',
        'Capacitación incluida'
      ]
    }
  ];
};
