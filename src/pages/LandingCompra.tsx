import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { toast } from 'react-hot-toast';
import {
  registrarEmpresa,
  crearPaymentIntent,
  verificarSubdominio,
  obtenerPlanes,
  type RegistroEmpresaData,
  type Plan
} from '../services/empresaService';

// Inicializar Stripe con la clave pública
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const LandingCompra = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/dentist.svg" alt="Logo" className="w-10 h-10" />
              <h1 className="text-2xl font-bold text-blue-600">DentalSmile</h1>
            </div>
            <a href="#planes" className="text-blue-600 hover:text-blue-700 font-medium">
              Ver Planes
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
          Gestiona tu Clínica Dental de Forma Profesional
        </h2>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Sistema completo de gestión para clínicas dentales. Agenda citas, historias clínicas digitales, 
          recordatorios automáticos y mucho más.
        </p>
        <div className="flex gap-4 justify-center">
          <a 
            href="#registro" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold text-lg transition"
          >
            Comenzar Ahora
          </a>
          <a 
            href="#caracteristicas" 
            className="bg-white hover:bg-gray-50 text-blue-600 px-8 py-3 rounded-lg font-semibold text-lg border-2 border-blue-600 transition"
          >
            Ver Características
          </a>
        </div>
      </section>

      {/* Características */}
      <section id="caracteristicas" className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">¿Por qué elegir DentalSmile?</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon="📅"
              title="Gestión de Citas"
              description="Agenda, reprograma y gestiona todas tus citas desde un solo lugar"
            />
            <FeatureCard
              icon="📋"
              title="Historias Clínicas Digitales"
              description="Mantén todo el historial médico de tus pacientes digitalizado y seguro"
            />
            <FeatureCard
              icon="🔔"
              title="Recordatorios Automáticos"
              description="Reduce las inasistencias con recordatorios automáticos por email y SMS"
            />
            <FeatureCard
              icon="📊"
              title="Reportes y Estadísticas"
              description="Visualiza el rendimiento de tu clínica con reportes detallados"
            />
            <FeatureCard
              icon="👥"
              title="Multi-Usuario"
              description="Gestiona múltiples odontólogos y personal con roles diferenciados"
            />
            <FeatureCard
              icon="🔒"
              title="Seguro y Confiable"
              description="Tus datos protegidos con los más altos estándares de seguridad"
            />
          </div>
        </div>
      </section>

      {/* Planes */}
      <PlanesSection />

      {/* Formulario de Registro */}
      <section id="registro" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <h3 className="text-3xl font-bold text-center mb-12">Comienza Tu Prueba Gratuita</h3>
          <Elements stripe={stripePromise}>
            <FormularioRegistro />
          </Elements>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2025 DentalSmile. Todos los derechos reservados.</p>
          <div className="mt-4 flex gap-6 justify-center text-sm">
            <a href="#" className="hover:text-blue-400">Términos de Servicio</a>
            <a href="#" className="hover:text-blue-400">Política de Privacidad</a>
            <a href="#" className="hover:text-blue-400">Contacto</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Componente de tarjeta de característica
const FeatureCard = ({ icon, title, description }: { icon: string; title: string; description: string }) => (
  <div className="bg-gray-50 p-6 rounded-lg text-center">
    <div className="text-4xl mb-4">{icon}</div>
    <h4 className="text-xl font-semibold mb-2">{title}</h4>
    <p className="text-gray-600">{description}</p>
  </div>
);

// Sección de planes
const PlanesSection = () => {
  const planes = obtenerPlanes();

  return (
    <section id="planes" className="py-16">
      <div className="container mx-auto px-4">
        <h3 className="text-3xl font-bold text-center mb-12">Planes y Precios</h3>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {planes.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      </div>
    </section>
  );
};

// Tarjeta de plan
const PlanCard = ({ plan }: { plan: Plan }) => (
  <div className={`bg-white rounded-lg shadow-lg p-8 ${plan.popular ? 'ring-2 ring-blue-500 relative' : ''}`}>
    {plan.popular && (
      <div className="absolute top-0 right-0 bg-blue-500 text-white px-4 py-1 rounded-bl-lg rounded-tr-lg text-sm font-semibold">
        Más Popular
      </div>
    )}
    <h4 className="text-2xl font-bold mb-2">{plan.nombre}</h4>
    <div className="mb-6">
      <span className="text-4xl font-bold">${plan.precio.toLocaleString('es-CL')}</span>
      <span className="text-gray-600">/mes</span>
    </div>
    <ul className="space-y-3 mb-8">
      {plan.caracteristicas.map((caracteristica, index) => (
        <li key={index} className="flex items-start gap-2">
          <span className="text-green-500 mt-1">✓</span>
          <span className="text-gray-700">{caracteristica}</span>
        </li>
      ))}
    </ul>
    <a
      href="#registro"
      className={`block text-center py-3 rounded-lg font-semibold transition ${
        plan.popular
          ? 'bg-blue-600 hover:bg-blue-700 text-white'
          : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
      }`}
    >
      Seleccionar Plan
    </a>
  </div>
);

// Formulario de registro con Stripe
const FormularioRegistro = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Datos empresa, 2: Datos admin, 3: Pago

  const [formData, setFormData] = useState({
    nombre_empresa: '',
    subdominio: '',
    telefono: '',
    direccion: '',
    nombre_admin: '',
    apellido_admin: '',
    email_admin: '',
    telefono_admin: '',
    rut_admin: '',  // Solo para UI, no se envía al backend
    plan: 'profesional' as 'basico' | 'profesional' | 'premium'
  });

  const [subdominioValido, setSubdominioValido] = useState<boolean | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Validar subdominio en tiempo real
    if (name === 'subdominio') {
      const subdominioLimpio = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
      setFormData(prev => ({ ...prev, subdominio: subdominioLimpio }));
      
      if (subdominioLimpio.length >= 3) {
        verificarSubdominioDisponible(subdominioLimpio);
      }
    }
  };

  const verificarSubdominioDisponible = async (subdominio: string) => {
    try {
      const disponible = await verificarSubdominio(subdominio);
      setSubdominioValido(disponible);
    } catch {
      setSubdominioValido(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      toast.error('Stripe no está cargado');
      return;
    }

    setLoading(true);

    try {
      // 1. Crear Payment Intent
      const planSeleccionado = obtenerPlanes().find(p => p.id === formData.plan);
      if (!planSeleccionado) {
        throw new Error('Plan no válido');
      }

      // ⭐ CORRECCIÓN: Enviar email y nombre_empresa como espera el backend
      const { clientSecret, customerId } = await crearPaymentIntent({
        email: formData.email_admin,
        nombre_empresa: formData.nombre_empresa
      });

      // 2. Confirmar pago con Stripe
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Elemento de tarjeta no encontrado');
      }

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: `${formData.nombre_admin} ${formData.apellido_admin}`,
            email: formData.email_admin
          }
        }
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      if (paymentIntent?.status !== 'succeeded') {
        throw new Error('El pago no se completó correctamente');
      }

      // ⭐ CORRECCIÓN: Obtener payment_method_id del paymentIntent
      const paymentMethodId = typeof paymentIntent.payment_method === 'string' 
        ? paymentIntent.payment_method 
        : paymentIntent.payment_method?.id;

      if (!paymentMethodId) {
        throw new Error('No se pudo obtener el método de pago');
      }

      // 3. Registrar empresa en el backend
      const resultado = await registrarEmpresa({
        nombre_empresa: formData.nombre_empresa,
        subdomain: formData.subdominio,
        nombre_admin: formData.nombre_admin,
        apellido_admin: formData.apellido_admin,
        email_admin: formData.email_admin,
        telefono_admin: formData.telefono_admin,
        // ❌ NO enviar rut_admin, backend no lo espera
        payment_method_id: paymentMethodId,  // ⭐ Enviar payment_method_id
      } as RegistroEmpresaData);

      if (resultado.success) {
        toast.success('¡Empresa registrada exitosamente!');
        
        // Redirigir al subdominio de la empresa
        const baseDomain = import.meta.env.VITE_BASE_DOMAIN || 'localhost:5177';
        const url = `http://${formData.subdominio}.${baseDomain}/login`;
        
        // Mostrar mensaje y redirigir
        setTimeout(() => {
          window.location.href = url;
        }, 2000);
      }
    } catch (error: any) {
      console.error('Error en registro:', error);
      toast.error(error.message || 'Error al procesar el registro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8">
      {/* Indicador de pasos */}
      <div className="flex items-center justify-center mb-8">
        <StepIndicator current={step} total={3} />
      </div>

      {/* Step 1: Datos de la Empresa */}
      {step === 1 && (
        <div className="space-y-4">
          <h4 className="text-xl font-semibold mb-4">Datos de la Empresa</h4>
          
          <div>
            <label className="block text-sm font-medium mb-1">Nombre de la Empresa *</label>
            <input
              type="text"
              name="nombre_empresa"
              value={formData.nombre_empresa}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Subdominio * (tu-clinica.dentalsmile.com)</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                name="subdominio"
                value={formData.subdominio}
                onChange={handleInputChange}
                className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="mi-clinica"
                pattern="[a-z0-9-]{3,}"
                required
              />
              {subdominioValido === true && <span className="text-green-500">✓ Disponible</span>}
              {subdominioValido === false && <span className="text-red-500">✗ No disponible</span>}
            </div>
            <p className="text-sm text-gray-500 mt-1">Solo letras minúsculas, números y guiones (mínimo 3 caracteres)</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Teléfono *</label>
            <input
              type="tel"
              name="telefono"
              value={formData.telefono}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="+56 9 1234 5678"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Dirección *</label>
            <input
              type="text"
              name="direccion"
              value={formData.direccion}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="button"
            onClick={() => setStep(2)}
            disabled={!formData.nombre_empresa || !formData.subdominio || subdominioValido !== true}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white py-3 rounded-lg font-semibold transition"
          >
            Continuar
          </button>
        </div>
      )}

      {/* Step 2: Datos del Administrador */}
      {step === 2 && (
        <div className="space-y-4">
          <h4 className="text-xl font-semibold mb-4">Datos del Administrador</h4>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre *</label>
              <input
                type="text"
                name="nombre_admin"
                value={formData.nombre_admin}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Apellido *</label>
              <input
                type="text"
                name="apellido_admin"
                value={formData.apellido_admin}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email *</label>
            <input
              type="email"
              name="email_admin"
              value={formData.email_admin}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* RUT opcional - no usado por backend */}
            <div>
              <label className="block text-sm font-medium mb-1">RUT (Opcional)</label>
              <input
                type="text"
                name="rut_admin"
                value={formData.rut_admin || ''}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="12.345.678-9"
              />
              <p className="text-xs text-gray-500 mt-1">Este campo no se envía al servidor</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Teléfono *</label>
              <input
                type="tel"
                name="telefono_admin"
                value={formData.telefono_admin}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg font-semibold transition"
            >
              Atrás
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition"
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Selección de Plan y Pago */}
      {step === 3 && (
        <div className="space-y-6">
          <h4 className="text-xl font-semibold mb-4">Selecciona tu Plan y Método de Pago</h4>
          
          <div>
            <label className="block text-sm font-medium mb-2">Plan</label>
            <select
              name="plan"
              value={formData.plan}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {obtenerPlanes().map(plan => (
                <option key={plan.id} value={plan.id}>
                  {plan.nombre} - ${plan.precio.toLocaleString('es-CL')}/mes
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Información de la Tarjeta</label>
            <div className="border rounded-lg p-4">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#424770',
                      '::placeholder': {
                        color: '#aab7c4',
                      },
                    },
                    invalid: {
                      color: '#9e2146',
                    },
                  },
                }}
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Pago seguro procesado por Stripe. No guardamos información de tu tarjeta.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h5 className="font-semibold mb-2">Resumen de tu compra:</h5>
            <div className="space-y-1 text-sm">
              <p><strong>Empresa:</strong> {formData.nombre_empresa}</p>
              <p><strong>Subdominio:</strong> {formData.subdominio}.dentalsmile.com</p>
              <p><strong>Plan:</strong> {obtenerPlanes().find(p => p.id === formData.plan)?.nombre}</p>
              <p className="text-lg font-bold mt-2">
                Total: ${obtenerPlanes().find(p => p.id === formData.plan)?.precio.toLocaleString('es-CL')}/mes
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg font-semibold transition"
              disabled={loading}
            >
              Atrás
            </button>
            <button
              type="submit"
              disabled={loading || !stripe}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white py-3 rounded-lg font-semibold transition"
            >
              {loading ? 'Procesando...' : 'Completar Registro'}
            </button>
          </div>
        </div>
      )}
    </form>
  );
};

// Indicador de pasos
const StepIndicator = ({ current, total }: { current: number; total: number }) => (
  <div className="flex items-center gap-2">
    {Array.from({ length: total }, (_, i) => i + 1).map((step) => (
      <div key={step} className="flex items-center">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
            step === current
              ? 'bg-blue-600 text-white'
              : step < current
              ? 'bg-green-500 text-white'
              : 'bg-gray-200 text-gray-600'
          }`}
        >
          {step < current ? '✓' : step}
        </div>
        {step < total && <div className="w-12 h-1 bg-gray-200 mx-2" />}
      </div>
    ))}
  </div>
);

export default LandingCompra;
