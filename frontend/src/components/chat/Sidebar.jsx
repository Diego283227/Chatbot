import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Swal from 'sweetalert2';

const Sidebar = ({ 
  sidebarOpen, 
  setSidebarOpen, 
  conversacionActual, 
  setConversacionActual, 
  conversaciones, 
  setConversaciones,
  onNuevaConversacion,
  onCambiarConversacion,
  onEliminarConversacion,
  onLimpiarHistorial,
  onEditarConversacion
}) => {
  const { auth, cerrarSesion } = useAuth();
  
  // Estados para edición
  const [conversacionEditando, setConversacionEditando] = useState(null);
  const [tituloEditando, setTituloEditando] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  // Estados para búsqueda
  const [busqueda, setBusqueda] = useState('');
  const [mostrarSoloBusqueda, setMostrarSoloBusqueda] = useState(false);

  // Estado para el dropdown de conversaciones
  const [dropdownConversacionesAbierto, setDropdownConversacionesAbierto] = useState(false);

  const API_BASE_URL = 'http://localhost:4000/api';

  // Efectos
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (window.innerWidth < 1024 && sidebarOpen && !event.target.closest('.sidebar-container')) {
        setSidebarOpen(false);
      }
      // Cerrar dropdown de conversaciones si se hace clic fuera
      if (!event.target.closest('.dropdown-conversaciones')) {
        setDropdownConversacionesAbierto(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sidebarOpen, setSidebarOpen]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
        event.preventDefault();
        onNuevaConversacion?.();
      }
      if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
        event.preventDefault();
        setSidebarOpen(!sidebarOpen);
      }
      if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
        event.preventDefault();
        document.getElementById('search-conversations')?.focus();
      }
      if (event.key === 'Escape' && conversacionEditando) {
        cancelarEdicion();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen, setSidebarOpen, onNuevaConversacion, conversacionEditando]);

  // Funciones de filtrado y búsqueda
  const filtrarConversaciones = (conversaciones, termino) => {
    if (!termino.trim()) return conversaciones;
    
    const terminoLower = termino.toLowerCase();
    return conversaciones.filter(conv => {
      const tituloMatch = (conv.titulo || 'Nueva conversación').toLowerCase().includes(terminoLower);
      const mensajesMatch = conv.mensajes?.some(mensaje => {
        const contenido = mensaje.contenido || mensaje.content || '';
        return contenido.toLowerCase().includes(terminoLower);
      }) || false;
      const fechaMatch = formatearFecha(conv.updatedAt).toLowerCase().includes(terminoLower);
      
      return tituloMatch || mensajesMatch || fechaMatch;
    });
  };

  const handleBusquedaChange = (e) => {
    const valor = e.target.value;
    setBusqueda(valor);
    setMostrarSoloBusqueda(valor.trim().length > 0);
  };

  const limpiarBusqueda = () => {
    setBusqueda('');
    setMostrarSoloBusqueda(false);
  };

  const formatearFecha = (fecha) => {
    const hoy = new Date();
    const fechaConv = new Date(fecha);
    const diffTime = Math.abs(hoy - fechaConv);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) return 'Hoy';
    if (diffDays === 2) return 'Ayer';
    if (diffDays <= 7) return `${diffDays - 1} días`;
    return fechaConv.toLocaleDateString();
  };

  // Funciones de manejo de conversaciones
  const handleSelectConversation = (id) => {
    if (conversacionEditando) {
      cancelarEdicion();
    }
    onCambiarConversacion?.(id);
  };

  // Función para manejar selección desde dropdown
  const handleSelectFromDropdown = (id) => {
    setDropdownConversacionesAbierto(false);
    handleSelectConversation(id);
  };

  // Función para toggle del dropdown
  const toggleDropdownConversaciones = () => {
    setDropdownConversacionesAbierto(!dropdownConversacionesAbierto);
  };

  const handleDeleteConversation = async (id, e) => {
    e.stopPropagation();
    
    // Cancelar edición si está editando esta conversación
    if (conversacionEditando === id) {
      cancelarEdicion();
    }

    // Buscar el título de la conversación para mostrar en la alerta
    const conversacion = conversaciones.find(conv => conv._id === id);
    const tituloConversacion = conversacion?.titulo || 'Nueva conversación';

    // Mostrar alerta de confirmación con SweetAlert2
    const result = await Swal.fire({
      title: '¿Eliminar conversación?',
      html: `
        <div class="text-left">
          <p class="text-gray-600 mb-3">¿Estás seguro de que deseas eliminar esta conversación?</p>
          <div class="bg-gray-50 p-3 rounded-lg border">
            <p class="font-medium text-gray-800">"${tituloConversacion}"</p>
            <p class="text-sm text-gray-500 mt-1">Esta acción no se puede deshacer</p>
          </div>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      focusCancel: true,
      customClass: {
        popup: 'rounded-lg shadow-xl',
        title: 'text-gray-800 font-semibold text-lg',
        htmlContainer: 'text-sm',
        confirmButton: 'font-medium px-6 py-2 rounded-lg hover:bg-red-600',
        cancelButton: 'font-medium px-6 py-2 rounded-lg hover:bg-gray-600'
      },
      buttonsStyling: true
    });

    // Si el usuario confirma, proceder con la eliminación
    if (result.isConfirmed) {
      try {
        // Mostrar loading mientras se elimina
        Swal.fire({
          title: 'Eliminando...',
          text: 'Por favor espera un momento',
          icon: 'info',
          allowOutsideClick: false,
          allowEscapeKey: false,
          showConfirmButton: false,
          timer: 800,
          timerProgressBar: true,
          customClass: {
            popup: 'rounded-lg',
            title: 'text-gray-800 font-semibold',
            content: 'text-gray-600'
          }
        });

        // Ejecutar la eliminación después del loading
        setTimeout(async () => {
          const eliminacionExitosa = await onEliminarConversacion?.(id);
          
          if (eliminacionExitosa !== false) {
            // Mostrar mensaje de éxito
            Swal.fire({
              title: '¡Eliminada!',
              text: 'La conversación se ha eliminado correctamente',
              icon: 'success',
              timer: 2000,
              timerProgressBar: true,
              showConfirmButton: false,
              customClass: {
                popup: 'rounded-lg',
                title: 'text-gray-800 font-semibold',
                content: 'text-gray-600'
              }
            });
          } else {
            // Mostrar error si la eliminación falló
            Swal.fire({
              title: 'Error',
              text: 'No se pudo eliminar la conversación. Inténtalo de nuevo.',
              icon: 'error',
              confirmButtonColor: '#ef4444',
              customClass: {
                popup: 'rounded-lg',
                title: 'text-gray-800 font-semibold',
                content: 'text-gray-600',
                confirmButton: 'font-medium px-4 py-2 rounded-lg'
              }
            });
          }
        }, 800);

      } catch (error) {
        console.error('Error al eliminar conversación:', error);
        
        Swal.fire({
          title: 'Error',
          text: 'Ocurrió un error inesperado al eliminar la conversación',
          icon: 'error',
          confirmButtonColor: '#ef4444',
          customClass: {
            popup: 'rounded-lg',
            title: 'text-gray-800 font-semibold',
            content: 'text-gray-600',
            confirmButton: 'font-medium px-4 py-2 rounded-lg'
          }
        });
      }
    }
  };

  // Funciones de edición
  const iniciarEdicion = (conversacion, e) => {
    e.stopPropagation();
    setConversacionEditando(conversacion._id);
    setTituloEditando(conversacion.titulo || 'Nueva conversación');
    setError('');
  };

  const cancelarEdicion = () => {
    setConversacionEditando(null);
    setTituloEditando('');
    setGuardando(false);
    setError('');
  };

  const guardarEdicion = async (e) => {
    if (e) e.stopPropagation();
    
    const tituloFinal = tituloEditando.trim();
    
    if (!tituloFinal) {
      setError('El título no puede estar vacío');
      return;
    }

    setGuardando(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      const rutasPosibles = [
        `/conversaciones/${conversacionEditando}`,
        `/chatbot/conversaciones/${conversacionEditando}`,
        `/chat/conversaciones/${conversacionEditando}`
      ];

      let response = null;

      for (const ruta of rutasPosibles) {
        try {
          response = await fetch(`${API_BASE_URL}${ruta}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ titulo: tituloFinal })
          });

          if (response.ok) {
            break;
          } else if (response.status === 404) {
            continue;
          } else {
            const errorText = await response.text();
            throw new Error(`Error ${response.status}: ${errorText}`);
          }
        } catch (fetchError) {
          if (ruta === rutasPosibles[rutasPosibles.length - 1]) {
            throw fetchError;
          }
        }
      }

      if (!response || !response.ok) {
        throw new Error(`No se encontró una ruta válida para editar`);
      }

      setConversaciones(prev => 
        prev.map(conv => 
          conv._id === conversacionEditando 
            ? { ...conv, titulo: tituloFinal, updatedAt: new Date().toISOString() }
            : conv
        )
      );

      if (conversacionActual?._id === conversacionEditando) {
        setConversacionActual(prev => ({
          ...prev,
          titulo: tituloFinal,
          updatedAt: new Date().toISOString()
        }));
      }

      if (onEditarConversacion) {
        try {
          await onEditarConversacion(conversacionEditando, tituloFinal);
        } catch (parentError) {
          console.warn('⚠️ Error en función del padre:', parentError);
        }
      }

      cancelarEdicion();

    } catch (error) {
      console.error('❌ Error al editar conversación:', error);
      setError(error.message || 'Error al guardar los cambios');
      setGuardando(false);
    }
  };

  const handleKeyDownEdicion = (e) => {
    if (e.key === 'Enter' && !guardando) {
      guardarEdicion(e);
    } else if (e.key === 'Escape') {
      cancelarEdicion();
    }
  };

  const handleLogout = () => {
    cerrarSesion();
  };

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Preparar datos para el render
  const conversacionesFiltradas = filtrarConversaciones(conversaciones, busqueda);
  
  const conversacionesConFecha = conversacionesFiltradas.map(conv => ({
    ...conv,
    fechaFormateada: formatearFecha(conv.updatedAt)
  }));

  const groupedConversations = mostrarSoloBusqueda ? {
    'Resultados': conversacionesConFecha
  } : {
    'Hoy': conversacionesConFecha.filter(c => c.fechaFormateada === 'Hoy'),
    'Ayer': conversacionesConFecha.filter(c => c.fechaFormateada === 'Ayer'),
    'Anteriores': conversacionesConFecha.filter(c => !['Hoy', 'Ayer'].includes(c.fechaFormateada))
  };

  return (
    <>
      {/* Overlay para móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Barra lateral mini (cuando sidebar está cerrado) */}
      {!sidebarOpen && (
        <aside className="hidden lg:flex flex-col w-16 bg-white border-r border-gray-200 flex-shrink-0 relative z-30">
          <div className="flex flex-col h-full">
            {/* Logo compacto - Color uniforme */}
            <div className="p-3 border-b border-gray-200 bg-white">
              <Link to="/chat" className="flex justify-center">
                <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-red-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
              </Link>
            </div>

            {/* Botón nueva conversación compacto */}
            <div className="p-2">
              <button 
                onClick={onNuevaConversacion}
                className="w-full h-10 flex items-center justify-center text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                title="Nueva conversación (Ctrl+N)"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>

            {/* Ícono único de conversaciones con dropdown */}
            <div className="px-2 dropdown-conversaciones relative">
              <button
                onClick={toggleDropdownConversaciones}
                className={`w-full h-10 flex items-center justify-center rounded-lg transition-colors relative ${
                  dropdownConversacionesAbierto
                    ? 'bg-pink-100 text-pink-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title={`${conversaciones.length} conversaciones`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                
                {/* Badge con número de conversaciones */}
                {conversaciones.length > 0 && (
                  <div className="absolute -top-1 -right-1 bg-pink-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                    {conversaciones.length > 99 ? '99+' : conversaciones.length}
                  </div>
                )}
                
                {/* Indicador de conversación activa */}
                {conversacionActual && (
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-pink-600 rounded-r"></div>
                )}
              </button>

              {/* Dropdown de conversaciones */}
              {dropdownConversacionesAbierto && (
                <div className="absolute left-full top-0 ml-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-96 overflow-hidden">
                  {/* Header del dropdown */}
                  <div className="p-3 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-800 text-sm">Conversaciones</h3>
                      <button
                        onClick={() => setDropdownConversacionesAbierto(false)}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Lista de conversaciones en dropdown */}
                  <div className="max-h-80 overflow-y-auto">
                    {conversaciones.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        No hay conversaciones
                      </div>
                    ) : (
                      <div className="p-2 space-y-1">
                        {conversaciones.slice(0, 15).map(conv => (
                          <button
                            key={conv._id}
                            onClick={() => handleSelectFromDropdown(conv._id)}
                            className={`w-full text-left p-3 rounded-lg transition-colors group ${
                              conversacionActual?._id === conv._id
                                ? 'bg-pink-50 text-pink-700 border border-pink-200'
                                : 'hover:bg-gray-50 text-gray-700'
                            }`}
                          >
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0 mt-0.5">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {conv.titulo || 'Nueva conversación'}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {formatearFecha(conv.updatedAt)}
                                  {conv.mensajes?.length > 0 && ` • ${conv.mensajes.length} mensajes`}
                                </p>
                              </div>
                              {conversacionActual?._id === conv._id && (
                                <div className="flex-shrink-0">
                                  <div className="w-2 h-2 bg-pink-600 rounded-full"></div>
                                </div>
                              )}
                            </div>
                          </button>
                        ))}
                        
                        {/* Botón para ver todas si hay más de 15 */}
                        {conversaciones.length > 15 && (
                          <button
                            onClick={() => {
                              setDropdownConversacionesAbierto(false);
                              handleToggleSidebar();
                            }}
                            className="w-full p-3 text-center text-sm text-pink-600 hover:text-pink-700 hover:bg-pink-50 rounded-lg transition-colors border-t border-gray-100 mt-2"
                          >
                            Ver todas las conversaciones ({conversaciones.length})
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Espacio flexible */}
            <div className="flex-1"></div>

            {/* Navegación rápida compacta */}
            <div className="px-2 py-2 space-y-1 border-t border-gray-200">
              <Link
                to="/perfil"
                className="w-full h-10 flex items-center justify-center text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                title="Perfil"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </Link>
              
              <Link
                to="/configuracion"
                className="w-full h-10 flex items-center justify-center text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                title="Configuración"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </Link>
            </div>

            {/* Footer compacto con usuario - Color uniforme */}
            <div className="p-2 border-t border-gray-200 bg-white">
              <div className="flex flex-col items-center space-y-2">
                {/* Avatar del usuario */}
                <Link
                  to="/perfil"
                  className="w-10 h-10 bg-pink-600 rounded-full flex items-center justify-center hover:bg-pink-700 transition-colors"
                  title={`${auth?.nombre || 'Usuario'} - ${auth?.email || ''}`}
                >
                  <span className="text-sm font-medium text-white">
                    {auth?.nombre?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </Link>

                {/* Botón de logout */}
                <button
                  onClick={handleLogout}
                  className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded transition-colors"
                  title="Cerrar sesión"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Botón para expandir sidebar */}
            <div className="absolute -right-3 top-1/2 transform -translate-y-1/2">
              <button
                onClick={handleToggleSidebar}
                className="w-6 h-12 bg-gray-900 text-white rounded-r-lg shadow-lg hover:bg-gray-800 transition-all duration-200 flex items-center justify-center"
                title="Expandir sidebar (Ctrl+B)"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Sidebar completo (cuando está abierto) */}
      {sidebarOpen && (
        <aside className="sidebar-container fixed lg:relative inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex-shrink-0">
          <div className="flex flex-col h-full">
            {/* Header integrado */}
            <div className="p-3 border-b border-gray-200 bg-gradient-to-r">
              <div className="flex items-center justify-between mb-3">
                <Link to="/chat" className="flex items-center space-x-2 flex-1">
                  <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-red-600 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                  <span className="text-lg font-bold text-gray-800">AirbnbBot</span>
                </Link>
                
                <div className="flex items-center space-x-1">
                  <button
                    onClick={handleToggleSidebar}
                    className="hidden lg:flex p-1.5 text-gray-600 hover:text-gray-800 hover:bg-white rounded transition-colors"
                    title="Ocultar sidebar (Ctrl+B)"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="lg:hidden p-1.5 text-gray-600 hover:text-gray-800 hover:bg-white rounded transition-colors"
                    title="Cerrar sidebar"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <button 
                onClick={onNuevaConversacion}
                className="w-full flex items-center justify-center px-3 py-2.5 border border-gray-300 text-gray-700 hover:bg-white rounded-lg transition-colors text-sm font-medium"
                title="Nueva conversación (Ctrl+N)"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nueva conversación
              </button>
            </div>

            {/* Buscador */}
            <div className="p-3 border-b border-gray-200">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  id="search-conversations"
                  type="text"
                  value={busqueda}
                  onChange={handleBusquedaChange}
                  placeholder="Buscar conversaciones..."
                  className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-gray-50"
                  title="Buscar conversaciones (Ctrl+F)"
                />
                {busqueda && (
                  <button
                    onClick={limpiarBusqueda}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded"
                    title="Limpiar búsqueda"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              
              {mostrarSoloBusqueda && (
                <div className="mt-1 px-2">
                  <span className="text-xs text-gray-500">
                    {conversacionesFiltradas.length} resultado{conversacionesFiltradas.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>

            {/* Lista de conversaciones */}
            <div className="flex-1 overflow-y-auto px-2 py-2">
              {conversaciones.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <p className="text-gray-500 text-xs">No hay conversaciones</p>
                  <button 
                    onClick={onNuevaConversacion}
                    className="mt-2 text-pink-600 hover:text-pink-700 text-xs"
                  >
                    Crear primera conversación
                  </button>
                </div>
              ) : conversacionesFiltradas.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p className="text-gray-500 text-xs mb-1">No se encontraron conversaciones</p>
                  <p className="text-gray-400 text-xs">Intenta con otros términos</p>
                  <button 
                    onClick={limpiarBusqueda}
                    className="mt-2 text-pink-600 hover:text-pink-700 text-xs"
                  >
                    Limpiar búsqueda
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {Object.entries(groupedConversations).map(([dateGroup, convs]) => 
                    convs.length > 0 && (
                      <div key={dateGroup}>
                        <p className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide sticky top-0 bg-white">
                          {dateGroup}
                        </p>
                        <div className="space-y-1">
                          {convs.map(conv => (
                            <div
                              key={conv._id}
                              className={`w-full rounded-lg transition-colors group relative ${
                                conversacionActual?._id === conv._id
                                  ? 'bg-pink-50 text-pink-700 border border-pink-200'
                                  : 'text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {conversacionEditando !== conv._id ? (
                                <button
                                  onClick={() => handleSelectConversation(conv._id)}
                                  className="w-full text-left px-2 py-2 rounded-lg"
                                  disabled={guardando}
                                >
                                  <div className="flex items-center pr-12">
                                    <svg className="w-4 h-4 mr-2 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                    </svg>
                                    <span className="text-xs truncate leading-4">
                                      {conv.titulo || 'Nueva conversación'}
                                    </span>
                                  </div>
                                  
                                  <div className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 flex space-x-1">
                                    <button 
                                      onClick={(e) => iniciarEdicion(conv, e)}
                                      className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-blue-600"
                                      title="Editar título"
                                      disabled={guardando}
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                    </button>
                                    
                                    <button 
                                      onClick={(e) => handleDeleteConversation(conv._id, e)}
                                      className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-red-600"
                                      title="Eliminar"
                                      disabled={guardando}
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                </button>
                              ) : (
                                <div className="px-2 py-2">
                                  <div className="flex items-center space-x-2">
                                    <svg className="w-4 h-4 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                    </svg>
                                    
                                    <input
                                      type="text"
                                      value={tituloEditando}
                                      onChange={(e) => setTituloEditando(e.target.value)}
                                      onKeyDown={handleKeyDownEdicion}
                                      onBlur={guardando ? undefined : guardarEdicion}
                                      className={`flex-1 text-xs bg-white border rounded px-2 py-1 focus:outline-none focus:ring-1 ${
                                        error 
                                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                                          : 'border-gray-300 focus:border-pink-500 focus:ring-pink-500'
                                      }`}
                                      placeholder="Título de la conversación"
                                      autoFocus
                                      maxLength={100}
                                      disabled={guardando}
                                    />
                                  </div>
                                  
                                  {error && (
                                    <p className="text-xs text-red-600 mt-1 px-1">
                                      {error}
                                    </p>
                                  )}
                                  
                                  <div className="flex justify-end space-x-1 mt-2">
                                    <button
                                      onClick={cancelarEdicion}
                                      className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-700"
                                      title="Cancelar (Esc)"
                                      disabled={guardando}
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={guardarEdicion}
                                      className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-green-600 disabled:opacity-50"
                                      title="Guardar (Enter)"
                                      disabled={guardando || !tituloEditando.trim()}
                                    >
                                      {guardando ? (
                                        <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                      ) : (
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                      )}
                                    </button>
                                  </div>
                                  
                                  <p className="text-xs text-gray-400 mt-1 px-1">
                                    {guardando ? 'Guardando...' : 'Enter para guardar • Esc para cancelar'}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            {/* Footer con usuario y logout */}
            <div className="border-t border-gray-200 mt-auto">
              <div className="p-2 space-y-1">
                <button 
                  onClick={onLimpiarHistorial}
                  className="w-full text-left px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-50 hover:text-red-600 rounded transition-colors flex items-center"
                >
                  <svg className="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Limpiar conversaciones
                </button>
              </div>

              <div className="p-2 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <Link
                    to="/perfil" 
                    className="flex items-center space-x-2 p-1.5 text-gray-600 flex-1 min-w-0 hover:bg-gray-100 rounded transition-colors"
                  >
                    <div className="w-7 h-7 bg-pink-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-white">
                        {auth?.nombre?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">
                        {auth?.nombre || 'Usuario'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {auth?.email || 'usuario@email.com'}
                      </p>
                    </div>
                  </Link>
                  
                  <button
                    onClick={handleLogout}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded transition-colors ml-1"
                    title="Cerrar sesión"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </aside>
      )}
    </>
  );
};

export default Sidebar;