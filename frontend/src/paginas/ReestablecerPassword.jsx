import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import clienteAxios from '../config/axios';
import Swal from 'sweetalert2';

export default function RestablecerPassword() {
  const { token } = useParams(); // Token desde la URL
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    password: '',
    confirmarPassword: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [tokenValido, setTokenValido] = useState(null); // null = verificando, true = válido, false = inválido
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarConfirmarPassword, setMostrarConfirmarPassword] = useState(false);

  // Verificar token al cargar el componente
  useEffect(() => {
    verificarToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const verificarToken = async () => {
    if (!token) {
      setTokenValido(false);
      return;
    }

    try {
      console.log('🔍 Verificando token:', token);
      
      // Verificar si el token es válido
      const { data } = await clienteAxios.get(`/usuarios/olvide-password/${token}`);
      
      console.log('✅ Token válido:', data);
      setTokenValido(true);
      
    } catch (error) {
      console.error('❌ Token inválido:', error);
      setTokenValido(false);
      
      // Mostrar mensaje de error
      await Swal.fire({
        title: 'Token inválido',
        text: 'El enlace de recuperación ha expirado o no es válido. Solicita uno nuevo.',
        icon: 'error',
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'Solicitar nuevo enlace',
        customClass: {
          popup: 'rounded-lg',
          title: 'text-gray-800 font-semibold',
          content: 'text-gray-600',
          confirmButton: 'font-medium px-4 py-2 rounded-lg'
        }
      }).then(() => {
        navigate('/recuperar-cuenta');
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar errores cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (!formData.confirmarPassword) {
      newErrors.confirmarPassword = 'Confirma tu contraseña';
    } else if (formData.password !== formData.confirmarPassword) {
      newErrors.confirmarPassword = 'Las contraseñas no coinciden';
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
      console.log('🔄 Restableciendo contraseña con token:', token);
      
      const { data } = await clienteAxios.post(`/usuarios/olvide-password/${token}`, {
        password: formData.password
      });

      console.log('✅ Contraseña restablecida:', data);

      // Mostrar mensaje de éxito
      await Swal.fire({
        title: '¡Contraseña restablecida!',
        text: 'Tu contraseña ha sido actualizada correctamente. Ya puedes iniciar sesión con tu nueva contraseña.',
        icon: 'success',
        confirmButtonColor: '#10b981',
        confirmButtonText: 'Ir al Login',
        customClass: {
          popup: 'rounded-lg shadow-xl',
          title: 'text-gray-800 font-semibold text-lg',
          content: 'text-gray-600',
          confirmButton: 'font-medium px-6 py-2 rounded-lg'
        }
      });

      // Redirigir al login
      navigate('/');

    } catch (error) {
      console.error('❌ Error al restablecer contraseña:', error);
      
      const mensajeError = error.response?.data?.msg || 
                          error.response?.data?.message || 
                          'Error al restablecer la contraseña';

      setErrors({
        general: mensajeError
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

  // Mientras se verifica el token
  if (tokenValido === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Verificando enlace...</h3>
            <p className="text-gray-600 text-sm">Por favor espera mientras validamos tu enlace de recuperación.</p>
          </div>
        </div>
      </div>
    );
  }

  // Si el token no es válido
  if (tokenValido === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100 p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-pink-600 p-8 text-center">
              <div className="w-20 h-20 bg-white rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white">Enlace Inválido</h2>
            </div>
            
            <div className="p-8 text-center space-y-4">
              <p className="text-gray-600">
                El enlace de recuperación ha expirado o no es válido.
              </p>
              <p className="text-sm text-gray-500">
                Por favor, solicita un nuevo enlace de recuperación.
              </p>
              
              <div className="space-y-3 pt-4">
                <Link
                  to="/recuperar-cuenta"
                  className="block w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all text-center font-medium"
                >
                  Solicitar nuevo enlace
                </Link>
                
                <Link
                  to="/"
                  className="block w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-center"
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

  // Formulario para restablecer contraseña
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-8 text-center">
            <div className="w-20 h-20 bg-white rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white">Nueva Contraseña</h2>
            <p className="text-green-100 mt-2">Ingresa tu nueva contraseña segura</p>
          </div>
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Error general */}
            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.general}
                </p>
              </div>
            )}

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Nueva Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={mostrarPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                    errors.password 
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                  }`}
                  placeholder="Mínimo 6 caracteres"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {mostrarPassword ? (
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmarPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <input
                  type={mostrarConfirmarPassword ? "text" : "password"}
                  id="confirmarPassword"
                  name="confirmarPassword"
                  value={formData.confirmarPassword}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                    errors.confirmarPassword 
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                  }`}
                  placeholder="Repite tu contraseña"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setMostrarConfirmarPassword(!mostrarConfirmarPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {mostrarConfirmarPassword ? (
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.confirmarPassword && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.confirmarPassword}
                </p>
              )}
            </div>

            {/* Indicador de fortaleza de contraseña */}
            {formData.password && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Fortaleza de la contraseña:</p>
                <div className="flex space-x-1">
                  <div className={`h-2 flex-1 rounded ${formData.password.length >= 6 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                  <div className={`h-2 flex-1 rounded ${formData.password.length >= 8 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                  <div className={`h-2 flex-1 rounded ${/[A-Z]/.test(formData.password) ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                  <div className={`h-2 flex-1 rounded ${/[0-9]/.test(formData.password) ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                  <p className={formData.password.length >= 6 ? 'text-green-600' : 'text-gray-500'}>
                    ✓ Al menos 6 caracteres
                  </p>
                  <p className={formData.password.length >= 8 ? 'text-green-600' : 'text-gray-500'}>
                    ✓ 8 o más caracteres (recomendado)
                  </p>
                  <p className={/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}>
                    ✓ Al menos una mayúscula
                  </p>
                  <p className={/[0-9]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}>
                    ✓ Al menos un número
                  </p>
                </div>
              </div>
            )}
            
            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 border border-transparent rounded-lg text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 font-medium transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Actualizando contraseña...
                </span>
              ) : (
                'Actualizar contraseña'
              )}
            </button>
          </form>
          
          {/* Footer */}
          <div className="px-8 pb-8">
            <p className="text-center text-sm text-gray-600">
              ¿Recordaste tu contraseña?{' '}
              <Link to="/" className="font-medium text-green-600 hover:text-green-500">
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}