import { useState } from 'react';
import { Link } from 'react-router-dom';
import clienteAxios from '../config/axios';
import Swal from 'sweetalert2';

export default function RecuperarCuenta() {
  const [formData, setFormData] = useState({
    email: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [emailEnviado, setEmailEnviado] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const { data } = await clienteAxios.post('/usuarios/olvide-password', {
        email: formData.email
      });

      console.log('✅ Respuesta del servidor:', data);

      // Mostrar mensaje de éxito
      setEmailEnviado(true);
      
      await Swal.fire({
        title: '¡Email enviado!',
        html: `
          <div class="text-left">
            <p class="text-gray-600 mb-3">Se han enviado las instrucciones de recuperación a:</p>
            <div class="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p class="font-medium text-blue-800">${formData.email}</p>
            </div>
            <p class="text-sm text-gray-500 mt-3">Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.</p>
          </div>
        `,
        icon: 'success',
        confirmButtonColor: '#3b82f6',
        confirmButtonText: 'Entendido',
        customClass: {
          popup: 'rounded-lg shadow-xl',
          title: 'text-gray-800 font-semibold text-lg',
          htmlContainer: 'text-sm',
          confirmButton: 'font-medium px-6 py-2 rounded-lg'
        }
      });

    } catch (error) {
      console.error('❌ Error al enviar email:', error);
      
      const mensajeError = error.response?.data?.msg || 
                          error.response?.data?.message || 
                          'Error al enviar el email de recuperación';

      setErrors({
        email: mensajeError
      });

      await Swal.fire({
        title: 'Error',
        text: mensajeError,
        icon: 'error',
        confirmButtonColor: '#ef4444',
        customClass: {
          popup: 'rounded-lg',
          title: 'text-gray-800 font-semibold',
          content: 'text-gray-600',
          confirmButton: 'font-medium px-4 py-2 rounded-lg'
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (emailEnviado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Header de éxito */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-8 text-center">
              <div className="w-20 h-20 bg-white rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white">¡Email Enviado!</h2>
            </div>
            
            {/* Contenido */}
            <div className="p-8 text-center space-y-4">
              <p className="text-gray-600">
                Se han enviado las instrucciones de recuperación a:
              </p>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="font-medium text-blue-800">{formData.email}</p>
              </div>
              <p className="text-sm text-gray-500">
                Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.
              </p>
              
              {/* Botones de acción */}
              <div className="space-y-3 pt-4">
                <button
                  onClick={() => {
                    setEmailEnviado(false);
                    setFormData({ email: '' });
                  }}
                  className="w-full py-2 px-4 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  Enviar a otro email
                </button>
                
                <Link
                  to="/"
                  className="block w-full py-2 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all text-center"
                >
                  Volver al Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        {/* Card Container */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-center">
            <div className="w-20 h-20 bg-white rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white">Recupera tu Cuenta</h2>
            <p className="text-blue-100 mt-2">Ingresa tu email para recibir instrucciones</p>
          </div>
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                    errors.email 
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  placeholder="tu@email.com"
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.email}
                </p>
              )}
            </div>
            
            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 border border-transparent rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 font-medium transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Enviando instrucciones...
                </span>
              ) : (
                'Enviar instrucciones'
              )}
            </button>
          </form>
          
          {/* Footer */}
          <div className="px-8 pb-8">
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                ¿No tienes una cuenta?{' '}
                <Link to="/registrar" className="font-medium text-blue-600 hover:text-blue-500">
                  Regístrate aquí
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}