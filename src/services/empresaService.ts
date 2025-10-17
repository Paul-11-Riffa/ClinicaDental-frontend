import { Api } from '../lib/Api';

export interface RegistroEmpresaData {
  // Datos de la empresa
  nombre_empresa: string;
  subdomain: string;
  telefono?: string;
  direccion?: string;
  
  // Datos del administrador
  nombre_admin: string;
  apellido_admin: string;
  email_admin: string;
  telefono_admin?: string;
  sexo_admin?: string;
  
  // Plan seleccionado (no usado en backend actualmente)
  plan?: 'basico' | 'profesional' | 'premium';
  
  // Stripe Payment Method ID
  payment_method_id?: string;
}

export interface RegistroEmpresaResponse {
  success: boolean;
  message: string;
  empresa_id?: number;
  subdominio?: string;
  redirect_url?: string;
}

export interface PaymentIntentData {
  email: string;
  nombre_empresa: string;
}

export interface PaymentIntentResponse {
  clientSecret: string;
  price: number;
  customerId: string;
}

/**
 * Crear Payment Intent en Stripe
 */
export const crearPaymentIntent = async (data: PaymentIntentData): Promise<PaymentIntentResponse> => {
  try {
    // ⭐ CORRECCIÓN: Usar la ruta pública correcta
    const response = await Api.post<PaymentIntentResponse>('/public/create-payment-intent/', data);
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
    // ⭐ CORRECCIÓN: Usar la ruta pública correcta
    const response = await Api.post<RegistroEmpresaResponse>('/public/registrar-empresa-pago/', data);
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
