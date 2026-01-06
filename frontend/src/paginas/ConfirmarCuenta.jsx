import { useState, useEffect } from 'react';




export default function ConfirmarCuenta() {
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState(''); // 'success' o 'error'
  const [isLoading, setIsLoading] = useState(true);
  const [cuentaConfirmada, setCuentaConfirmada] = useState(false);
  
  // Obtener el token de la URL
  // En tu implementación real, usa useParams de react-router-dom
  const token = window.location.pathname.split('/').pop();

  useEffect(() => {
    const confirmarCuenta = async () => {
      try {
        // Reemplaza esta URL con tu configuración de axios
        const response = await fetch(`http://localhost:4000/api/usuarios/confirmar/${token}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        const data = await response.json();
        
        if (response.ok) {
          setMensaje(data.msg || 'Cuenta confirmada correctamente');
          setTipoMensaje('success');
          setCuentaConfirmada(true);
        } else {
          throw new Error(data.msg || 'Error al confirmar cuenta');
        }
        
      } catch (error) {
        console.error('Error:', error);
        
        setTipoMensaje('error');
        setMensaje(error.message || 'Error al confirmar la cuenta. El enlace puede ser inválido o haber expirado.');
      } finally {
        setIsLoading(false);
      }
    };

    if (token && token !== 'confirmar') {
      confirmarCuenta();
    } else {
      setMensaje('Token no válido');
      setTipoMensaje('error');
      setIsLoading(false);
    }
  }, [token]);

  const handleRedirect = (path) => {
    window.location.href = path;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        {/* Card Container */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-center">
            <div className="w-20 h-20 bg-white rounded-full mx-auto mb-4 flex items-center justify-center">
              {tipoMensaje === 'success' ? (
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <h2 className="text-2xl font-bold text-white">
              {isLoading ? 'Confirmando cuenta...' : 'Confirmación de Cuenta'}
            </h2>
          </div>
          
          {/* Content */}
          <div className="p-8">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <svg className="animate-spin h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : (
              <>
                {/* Mensaje */}
                <div className={`text-center mb-6 p-6 rounded-lg ${
                  tipoMensaje === 'success' 
                    ? 'bg-green-50 text-green-800' 
                    : 'bg-red-50 text-red-800'
                }`}>
                  <p className="text-lg font-medium mb-2">{mensaje}</p>
                  {tipoMensaje === 'success' && (
                    <p className="text-sm">
                      Tu cuenta ha sido verificada exitosamente. Ya puedes iniciar sesión.
                    </p>
                  )}
                </div>

                {/* Botones de acción */}
                <div className="space-y-3">
                  {cuentaConfirmada ? (
                    <>
                      <button
                        onClick={() => handleRedirect('/')}
                        className="w-full py-3 px-4 border border-transparent rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 font-medium transition-all duration-200 transform hover:scale-[1.02]"
                      >
                        Iniciar Sesión
                      </button>
                      
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleRedirect('/registrar')}
                        className="w-full py-3 px-4 border border-transparent rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 font-medium transition-all duration-200 transform hover:scale-[1.02]"
                      >
                        Intentar Registrarse Nuevamente
                      </button>
                      
                      <button
                        onClick={() => handleRedirect('/')}
                        className="w-full py-3 px-4 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 font-medium transition-all duration-200"
                      >
                        Volver al Inicio
                      </button>
                    </>
                  )}
                </div>

                {/* Información adicional */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <p className="text-center text-sm text-gray-600">
                    {tipoMensaje === 'success' ? (
                      <>
                        Si tienes problemas para iniciar sesión, 
                        <a href="/recuperar-cuenta" className="text-blue-600 hover:text-blue-500 ml-1">
                          recupera tu contraseña
                        </a>
                      </>
                    ) : (
                      <>
                        ¿Necesitas ayuda? 
                        <a href="/contacto" className="text-blue-600 hover:text-blue-500 ml-1">
                          Contáctanos
                        </a>
                      </>
                    )}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}