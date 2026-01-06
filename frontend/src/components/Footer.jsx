import { useState } from 'react';

const Footer = () => {
  const [showDataInfo, setShowDataInfo] = useState(false);

  return (
    <>
      <footer className="bg-gray-900 text-white border-t border-gray-800">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
            {/* Logo e información */}
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-gradient-to-br from-red-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold">MovieBot Assistant</h3>
                <p className="text-xs text-gray-400">Consultas sobre MongoDB sample_mflix</p>
              </div>
            </div>

            {/* Enlaces centrales */}
            <div className="flex items-center space-x-6 text-sm">
              <button 
                onClick={() => setShowDataInfo(true)}
                className="text-gray-400 hover:text-white transition-colors flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
                Sobre la BD
              </button>
              <a href="/guia" className="text-gray-400 hover:text-white transition-colors">
                Guía de uso
              </a>
              <a href="/ejemplos" className="text-gray-400 hover:text-white transition-colors">
                Ejemplos
              </a>
              <a href="/ayuda" className="text-gray-400 hover:text-white transition-colors">
                Ayuda
              </a>
            </div>

            {/* Versión e información */}
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span>MongoDB v6.0</span>
              <span>•</span>
              <span>© 2024 MovieBot</span>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mt-4 pt-4 border-t border-gray-800">
            <p className="text-xs text-gray-400 text-center">
              <span className="inline-flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                MovieBot puede generar respuestas incorrectas. Verifica las consultas importantes directamente en MongoDB.
                Esta es una base de datos de ejemplo con información de películas, actores y reseñas.
              </span>
            </p>
          </div>
        </div>
      </footer>

      {/* Modal de información de la base de datos */}
      {showDataInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 text-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-xl font-semibold flex items-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
                Base de datos sample_mflix
              </h2>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Colecciones disponibles:</h3>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-center">
                      <span className="w-24 font-mono">movies</span>
                      <span>- Información de películas (título, año, género, director, etc.)</span>
                    </li>
                    <li className="flex items-center">
                      <span className="w-24 font-mono">comments</span>
                      <span>- Comentarios y reseñas de usuarios</span>
                    </li>
                    <li className="flex items-center">
                      <span className="w-24 font-mono">users</span>
                      <span>- Información de usuarios</span>
                    </li>
                    <li className="flex items-center">
                      <span className="w-24 font-mono">theaters</span>
                      <span>- Ubicaciones de cines</span>
                    </li>
                    <li className="flex items-center">
                      <span className="w-24 font-mono">sessions</span>
                      <span>- Sesiones de usuario</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Ejemplos de consultas:</h3>
                  <ul className="space-y-1 text-sm text-gray-300">
                    <li>• ¿Cuántas películas hay del año 2010?</li>
                    <li>• Muéstrame las películas dirigidas por Christopher Nolan</li>
                    <li>• ¿Cuáles son las películas mejor calificadas?</li>
                    <li>• Busca películas del género "Action"</li>
                    <li>• ¿Cuántos comentarios tiene la película "The Dark Knight"?</li>
                  </ul>
                </div>

                <div className="bg-gray-900 rounded-lg p-4">
                  <p className="text-sm text-gray-400">
                    <strong>Nota:</strong> Esta es la base de datos de ejemplo oficial de MongoDB que contiene
                    información sobre películas desde principios del siglo XX hasta 2015.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-700 flex justify-end">
              <button
                onClick={() => setShowDataInfo(false)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Footer;