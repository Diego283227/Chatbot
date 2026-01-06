// ModalDetalles.jsx - Versión final limpia y funcional
import React, { useEffect, useState } from 'react';

const ModalDetalles = ({ isOpen, onClose, datos, compact = false }) => {
  const [animacionSalida, setAnimacionSalida] = useState(false);
  const [activeTab, setActiveTab] = useState('datos');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setAnimacionSalida(false);
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleClose = () => {
    setAnimacionSalida(true);
    setTimeout(() => {
      onClose();
      setAnimacionSalida(false);
    }, 200);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  const formatPrice = (price) => price ? `$${Math.round(price).toLocaleString()}` : 'N/A';
  const formatNumber = (num) => num ? Math.round(num).toLocaleString() : 'N/A';

  const getRoomTypeBadge = (roomType) => {
    const colors = {
      'Entire home/apt': 'bg-green-100 text-green-800',
      'Private room': 'bg-blue-100 text-blue-800',
      'Shared room': 'bg-yellow-100 text-yellow-800',
      'Hotel room': 'bg-pink-100 text-pink-800'
    };
    const colorClass = colors[roomType] || 'bg-gray-100 text-gray-800';
    
    return (
      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
        {roomType || 'N/A'}
      </span>
    );
  };

  // Determinar si son datos de demo/fallback
  const isDemoData = datos?.isDemo || datos?.fuenteDatos === 'fallback' || datos?.fuenteDatos === 'prueba';
  
  // Determinar tamaño del modal
  const modalSize = compact ? 'max-w-4xl max-h-[85vh]' : 'max-w-6xl max-h-[90vh]';
  const contentPadding = compact ? 'p-4' : 'p-6';

  // Obtener el color del header basado en el tipo de datos
  const getHeaderColor = () => {
    if (isDemoData) {
      return 'from-yellow-600 to-orange-600';
    }
    switch (datos?.fuenteDatos) {
      case 'mongodb':
        return 'from-green-600 to-blue-600';
      case 'backend':
        return 'from-green-600 to-blue-600';
      case 'fallback':
        return 'from-yellow-600 to-orange-600';
      default:
        return 'from-purple-600 to-blue-600';
    }
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300 z-50 ${
          animacionSalida ? 'opacity-0' : 'opacity-100'
        }`}
        onClick={handleOverlayClick}
      >
        {/* Modal */}
        <div className="flex items-center justify-center min-h-screen p-4">
          <div 
            className={`bg-white rounded-xl shadow-2xl w-full ${modalSize} flex flex-col transform transition-all duration-300 ${
              animacionSalida ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header mejorado con indicadores de estado */}
            <div className={`bg-gradient-to-r ${getHeaderColor()} text-white px-6 py-4 rounded-t-xl`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-xl">
                    {datos?.tipo === 'listings' ? '🏠' : 
                     datos?.tipo === 'estadisticas' ? '📊' : 
                     datos?.tipo === 'hosts' ? '👤' : 
                     datos?.tipo === 'barrios' ? '📍' : 
                     datos?.tipo === 'conteo' ? '🔢' : '💾'}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold flex items-center">
                      Datos de Airbnb NYC
                      {datos?.fuenteDatos === 'mongodb' && (
                        <span className="ml-2 px-2 py-1 bg-white bg-opacity-20 rounded-full text-xs">
                          EN VIVO
                        </span>
                      )}
                    </h2>
                    <p className="text-white text-opacity-90 text-sm">
                      {datos?.tipo === 'listings' ? '🏠 Alojamientos' : 
                       datos?.tipo === 'estadisticas' ? '📊 Estadísticas' : 
                       datos?.tipo === 'hosts' ? '👤 Anfitriones' : 
                       datos?.tipo === 'barrios' ? '📍 Por ubicación' : 
                       datos?.tipo === 'conteo' ? '🔢 Totales' : 'Información'} 
                      {datos?.datos?.length && ` • ${datos.datos.length} elementos`}
                      {datos?.total && ` • Total: ${formatNumber(datos.total)}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Tabs compactas */}
            <div className="border-b border-gray-200 bg-gray-50">
              <nav className="flex px-6">
                {[
                  { id: 'datos', label: 'Datos', icon: '📊' },
                  { id: 'contexto', label: 'Contexto', icon: '💬' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <span className="mr-1">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Content */}
            <div className={`flex-1 overflow-auto ${contentPadding} bg-gray-50`}>
              {activeTab === 'contexto' && (
                <div className="space-y-4">
                  {datos?.userMessage && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-blue-800 mb-2">👤 Tu consulta</h4>
                      <p className="text-sm text-blue-700 italic">"{datos.userMessage}"</p>
                    </div>
                  )}
                  
                  <div className="bg-white border rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-800 mb-3">ℹ️ Información técnica</h4>
                    <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                      <div>
                        <p><strong>Tipo de datos:</strong> {datos?.tipo || 'N/A'}</p>
                        <p><strong>Fuente:</strong> {
                          datos?.fuenteDatos === 'mongodb' ? '🟢 Base de datos MongoDB' :
                          datos?.fuenteDatos === 'backend' ? '🟢 Servidor backend' :
                          datos?.fuenteDatos === 'fallback' ? '🟡 Datos de demostración' :
                          datos?.fuenteDatos === 'prueba' ? '🔵 Datos de prueba' :
                          '⚪ Desconocida'
                        }</p>
                        <p><strong>Elementos:</strong> {datos?.datos?.length || datos?.total || 'N/A'}</p>
                      </div>
                      <div>
                        <p><strong>Generado:</strong> {datos?.timestamp ? new Date(datos.timestamp).toLocaleString('es-ES') : 'N/A'}</p>
                        <p><strong>Descripción:</strong> {datos?.descripcion || 'Sin descripción'}</p>
                        <p><strong>Estado:</strong> {datos?.fuenteDatos === 'mongodb' ? '🟢 Datos en vivo' : '🟡 Modo demo'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'datos' && (
                <div className="space-y-4">
                  
                  {/* Listings - Alojamientos */}
                  {datos?.tipo === 'listings' && datos?.datos && Array.isArray(datos.datos) && (
                    <>
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-gray-800 flex items-center">
                          🏠 Alojamientos de Airbnb
                        </h3>
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                          {datos.datos.length} resultados
                        </span>
                      </div>
                      
                      <div className="grid gap-4 max-h-[400px] overflow-y-auto pr-2">
                        {datos.datos.slice(0, 15).map((listing, idx) => (
                          <div key={idx} className="bg-white rounded-lg p-4 border shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-3">
                              <h4 className="font-semibold text-gray-800 text-sm flex-1 mr-2 leading-tight">
                                {listing.name || `Alojamiento #${idx + 1}`}
                              </h4>
                              <div className="text-right">
                                <span className="font-bold text-lg text-green-600">
                                  {formatPrice(listing.price)}
                                </span>
                                <p className="text-xs text-gray-500">por noche</p>
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 mb-3">
                              {getRoomTypeBadge(listing.room_type)}
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
                              <div className="space-y-1">
                                <p><strong>📍 Ubicación:</strong></p>
                                <p className="pl-4">{listing.neighbourhood || 'N/A'}</p>
                                <p className="pl-4 font-medium">{listing.neighbourhood_group || 'N/A'}</p>
                              </div>
                              <div className="space-y-1">
                                <p><strong>👤 Anfitrión:</strong> {listing.host_name || 'N/A'}</p>
                                <p><strong>📝 Reviews:</strong> {listing.number_of_reviews || 0}</p>
                                <p><strong>🛏️ Mín. noches:</strong> {listing.minimum_nights || 'N/A'}</p>
                                <p><strong>📅 Disponible:</strong> {listing.availability_365 || 0} días/año</p>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {datos.datos.length > 15 && (
                          <div className="text-center py-4 text-gray-500 text-sm bg-gray-100 rounded-lg">
                            <p className="font-medium">Mostrando 15 de {datos.datos.length} alojamientos</p>
                            <p className="text-xs mt-1">Los datos se ordenan por relevancia y precio</p>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Estadísticas */}
                  {datos?.tipo === 'estadisticas' && datos?.datos && (
                    <>
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-gray-800">📊 Estadísticas de Airbnb</h3>
                      </div>
                      <div className="bg-white rounded-lg overflow-hidden border shadow-sm">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left font-semibold text-gray-700">Categoría</th>
                              <th className="px-4 py-3 text-left font-semibold text-gray-700">Cantidad</th>
                              <th className="px-4 py-3 text-left font-semibold text-gray-700">Precio Promedio</th>
                              <th className="px-4 py-3 text-left font-semibold text-gray-700">%</th>
                            </tr>
                          </thead>
                          <tbody>
                            {datos.datos.map((item, idx) => (
                              <tr key={idx} className="border-t hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium">{item._id || 'N/A'}</td>
                                <td className="px-4 py-3">{formatNumber(item.count)}</td>
                                <td className="px-4 py-3 text-green-600 font-medium">{formatPrice(item.avgPrice)}</td>
                                <td className="px-4 py-3">{item.porcentaje ? `${item.porcentaje.toFixed(1)}%` : 'N/A'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}

                  {/* Conteo simple */}
                  {datos?.tipo === 'conteo' && (
                    <div className="text-center py-12 bg-white rounded-lg border">
                      <div className="text-5xl font-bold text-blue-600 mb-4">
                        {formatNumber(datos.total || datos.count || 0)}
                      </div>
                      <p className="text-lg text-gray-700 mb-2">
                        {datos.descripcion || 'Registros encontrados'}
                      </p>
                      <p className="text-sm text-gray-500">
                        Base de datos actualizada • {new Date().toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  )}

                  {/* Hosts */}
                  {datos?.tipo === 'hosts' && datos?.datos && (
                    <>
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-gray-800">👤 Top Anfitriones</h3>
                        <span className="text-sm text-gray-500">Mejor valorados</span>
                      </div>
                      <div className="grid gap-3 max-h-[400px] overflow-y-auto">
                        {datos.datos.slice(0, 10).map((host, idx) => (
                          <div key={idx} className="bg-white rounded-lg p-4 border shadow-sm">
                            <h4 className="font-semibold text-gray-800 mb-3">
                              #{idx + 1} {host._id || host.host_name || `Anfitrión #${idx + 1}`}
                            </h4>
                            <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                              <p><strong>🏠 Propiedades:</strong> {formatNumber(host.totalPropiedades || host.count)}</p>
                              <p><strong>💰 Precio prom.:</strong> {formatPrice(host.precioPromedio)}</p>
                              <p><strong>📝 Total reviews:</strong> {formatNumber(host.totalReviews)}</p>
                              <p><strong>🔢 ID Host:</strong> {host.host_id || 'N/A'}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Barrios */}
                  {datos?.tipo === 'barrios' && datos?.datos && (
                    <>
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-gray-800">🗺️ Análisis por Ubicación</h3>
                        <span className="text-sm text-gray-500">NYC - 5 Boroughs</span>
                      </div>
                      <div className="grid gap-4">
                        {datos.datos.map((barrio, idx) => (
                          <div key={idx} className="bg-white rounded-lg p-4 border shadow-sm">
                            <h4 className="font-semibold text-gray-800 mb-3 text-lg">📍 {barrio._id}</h4>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div className="text-center">
                                <p className="text-2xl font-bold text-blue-600">{formatNumber(barrio.total)}</p>
                                <p className="text-gray-600">Alojamientos</p>
                              </div>
                              <div className="text-center">
                                <p className="text-2xl font-bold text-green-600">{formatPrice(barrio.precioPromedio)}</p>
                                <p className="text-gray-600">Precio promedio</p>
                              </div>
                              <div className="text-center">
                                <p className="text-2xl font-bold text-purple-600">{formatNumber(barrio.disponibilidadPromedio)}%</p>
                                <p className="text-gray-600">Disponibilidad</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* No data */}
                  {(!datos?.tipo || (datos?.datos && Array.isArray(datos.datos) && datos.datos.length === 0)) && (
                    <div className="text-center py-12 bg-white rounded-lg border">
                      <div className="text-6xl mb-4">🔍</div>
                      <h3 className="text-xl font-semibold text-gray-600 mb-2">
                        No hay datos para mostrar
                      </h3>
                      <p className="text-gray-500">
                        Esta consulta no generó resultados estructurados de la base de datos
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer mejorado */}
            <div className="border-t bg-gray-50 px-6 py-4 rounded-b-xl">
              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-500">
                  <p>
                    {datos?.timestamp && `Generado: ${new Date(datos.timestamp).toLocaleTimeString('es-ES')}`}
                    {datos?.fuenteDatos === 'mongodb' && ' • Datos en tiempo real de MongoDB'}
                  </p>
                  {datos?.descripcion && (
                    <p className="mt-1 italic">{datos.descripcion}</p>
                  )}
                </div>
                <button
                  onClick={handleClose}
                  className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ModalDetalles;