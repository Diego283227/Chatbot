import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import clienteAxios from '../../config/axios';
import useAuth from '../../hooks/useAuth';

const PromptsAdmin = () => {
    const { auth } = useAuth();
    const [, setPrompts] = useState([]);
    const [conversaciones, setConversaciones] = useState([]);
    const [conversacionesFiltradas, setConversacionesFiltradas] = useState([]);
    const [estadisticas, setEstadisticas] = useState({
        totalConversaciones: 0,
        mensajesTotales: 0,
        usuariosActivos: 0
    });
    const [mostrarModalConversacion, setMostrarModalConversacion] = useState(false);
    const [conversacionSeleccionada, setConversacionSeleccionada] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
    const [busqueda, setBusqueda] = useState('');
    const [tipoBusqueda, setTipoBusqueda] = useState('todo'); // 'todo', 'usuario', 'mensaje'

    useEffect(() => {
        if (auth?.rol === 'admin') {
            cargarDatos();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [auth]);

    // Filtrar conversaciones cuando cambie la búsqueda
    useEffect(() => {
        filtrarConversaciones();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [busqueda, tipoBusqueda, conversaciones]);

    const cargarDatos = async () => {
        try {
            setCargando(true);
            const token = localStorage.getItem('token');
            const config = {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }
            };

            // Cargar prompts
            await cargarPrompts(config);
            
            // Cargar conversaciones y estadísticas
            await cargarConversaciones(config);
            
        } catch (error) {
            console.error('Error al cargar datos:', error);
            setMensaje({
                texto: 'Error al cargar los datos',
                tipo: 'error'
            });
        } finally {
            setCargando(false);
        }
    };

    const cargarPrompts = async (config) => {
        try {
            const { data } = await clienteAxios.get('/admin/prompts', config);
            setPrompts(data.prompts || []);
        } catch (error) {
            console.error('Error al cargar prompts:', error);
            // Datos de ejemplo como fallback
            setPrompts([
                {
                    _id: '1',
                    nombre: 'Asistente General',
                    descripcion: 'Prompt base para conversaciones generales',
                    categoria: 'general',
                    activo: true,
                    usos: 0,
                    fechaCreacion: new Date().toISOString()
                }
            ]);
        }
    };

    const cargarConversaciones = async (config) => {
        try {
            // Usar la nueva ruta de admin para obtener TODAS las conversaciones
            const { data } = await clienteAxios.get('/admin/conversaciones', config);
            
            if (data.success) {
                // Ordenar conversaciones alfabéticamente por nombre de usuario
                const conversacionesOrdenadas = (data.conversaciones || []).sort((a, b) => {
                    const nombreA = a.usuario?.nombre || 'Usuario anónimo';
                    const nombreB = b.usuario?.nombre || 'Usuario anónimo';
                    return nombreA.localeCompare(nombreB);
                });
                
                setConversaciones(conversacionesOrdenadas);
                setConversacionesFiltradas(conversacionesOrdenadas);
                setEstadisticas(data.estadisticas);
            } else {
                throw new Error('No se pudieron cargar las conversaciones');
            }

        } catch (error) {
            console.error('Error al cargar conversaciones:', error);
            // Estadísticas por defecto si falla
            setEstadisticas({
                totalConversaciones: 0,
                mensajesTotales: 0,
                usuariosActivos: 0
            });
        }
    };

    const filtrarConversaciones = () => {
        if (!busqueda.trim()) {
            setConversacionesFiltradas(conversaciones);
            return;
        }

        const busquedaLower = busqueda.toLowerCase().trim();
        
        const conversacionesFiltradas = conversaciones.filter(conversacion => {
            const nombreUsuario = (conversacion.usuario?.nombre || '').toLowerCase();
            const emailUsuario = (conversacion.usuario?.email || '').toLowerCase();
            
            // Buscar en mensajes
            const mensajesTexto = conversacion.mensajes?.map(msg => 
                (msg.contenido || msg.content || '').toLowerCase()
            ).join(' ') || '';

            // Filtrar según el tipo de búsqueda
            switch (tipoBusqueda) {
                case 'usuario':
                    return nombreUsuario.includes(busquedaLower) || 
                           emailUsuario.includes(busquedaLower);
                
                case 'mensaje':
                    return mensajesTexto.includes(busquedaLower);
                
                case 'todo':
                default:
                    return nombreUsuario.includes(busquedaLower) || 
                           emailUsuario.includes(busquedaLower) ||
                           mensajesTexto.includes(busquedaLower);
            }
        });

        setConversacionesFiltradas(conversacionesFiltradas);
    };

    const limpiarBusqueda = () => {
        setBusqueda('');
        setTipoBusqueda('todo');
    };

    const verConversacion = (conversacion) => {
        setConversacionSeleccionada(conversacion);
        setMostrarModalConversacion(true);
    };

    const cerrarModalConversacion = () => {
        setMostrarModalConversacion(false);
        setConversacionSeleccionada(null);
    };

    const formatearFecha = (fecha) => {
        if (!fecha) return 'N/A';
        return new Date(fecha).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    // eslint-disable-next-line no-unused-vars
    const calcularUsosPrompt = (promptNombre) => {
        // Calcular cuántas veces se ha usado un prompt específico
        // Esto requeriría que los mensajes tengan referencia al prompt usado
        return conversaciones.reduce((total, conv) => {
            return total + (conv.mensajes?.filter(msg =>
                msg.prompt === promptNombre || msg.tipo === 'bot'
            ).length || 0);
        }, 0);
    };

    if (cargando) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-gray-200 to-slate-300">
                <div className="text-center">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-gray-300 border-t-red-500 rounded-full animate-spin mx-auto"></div>
                    </div>
                    <p className="mt-6 text-gray-700 font-medium">Cargando prompts y conversaciones...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-gray-200 to-slate-300">
            {/* Header */}
            <div className="bg-white shadow-lg border-b border-gray-300">
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <div className="flex items-center space-x-4 mb-2">
                                <div className="p-3 bg-red-500 rounded-lg shadow-lg">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </div>
                                <div>
                                    <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
                                        Gestión de Mensajes
                                    </h1>
                                    <p className="text-gray-600 text-lg font-medium">
                                        Administra las respuestas del sistema
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                            <Link 
                                to="/admin" 
                                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                Dashboard
                            </Link>
                        </div>
                    </div>

                    {/* Estadísticas */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-md">
                            <div className="flex items-center space-x-3">
                                <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-lg"></div>
                                <div>
                                    <p className="text-gray-600 text-sm font-medium">Conversaciones</p>
                                    <p className="text-lg font-bold text-emerald-600">
                                        {estadisticas.totalConversaciones}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-md">
                            <div className="flex items-center space-x-3">
                                <div className="w-4 h-4 rounded-full bg-amber-500 shadow-lg"></div>
                                <div>
                                    <p className="text-gray-600 text-sm font-medium">Mensajes Totales</p>
                                    <p className="text-lg font-bold text-amber-600">
                                        {estadisticas.mensajesTotales}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-md">
                            <div className="flex items-center space-x-3">
                                <div className="w-4 h-4 rounded-full bg-purple-500 shadow-lg"></div>
                                <div>
                                    <p className="text-gray-600 text-sm font-medium">Usuarios Activos</p>
                                    <p className="text-lg font-bold text-purple-600">
                                        {estadisticas.usuariosActivos}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-md">
                            <div className="flex items-center space-x-3">
                                <div className="w-4 h-4 rounded-full bg-blue-500 shadow-lg"></div>
                                <div>
                                    <p className="text-gray-600 text-sm font-medium">Resultados</p>
                                    <p className="text-lg font-bold text-blue-600">
                                        {conversacionesFiltradas.length}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Mensaje de estado */}
                {mensaje.texto && (
                    <div className={`mb-6 p-4 rounded-lg border shadow-md ${
                        mensaje.tipo === 'exito' 
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                            : 'bg-red-50 border-red-300 text-red-800'
                    }`}>
                        <div className="flex items-center space-x-2">
                            {mensaje.tipo === 'exito' ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            )}
                            <span className="font-medium">{mensaje.texto}</span>
                        </div>
                    </div>
                )}

                {/* Buscador Avanzado */}
                <div className="bg-white rounded-lg shadow-md border border-gray-300 p-6 mb-8">
                    <div className="flex flex-col space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                Buscar en Conversaciones
                            </h3>
                            {busqueda && (
                                <button
                                    onClick={limpiarBusqueda}
                                    className="text-sm text-red-600 hover:text-red-800 transition-colors"
                                >
                                    Limpiar búsqueda
                                </button>
                            )}
                        </div>
                        
                        <div className="flex flex-col lg:flex-row gap-4">
                            {/* Campo de búsqueda */}
                            <div className="flex-1 relative">
                                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Buscar por usuario, email o contenido de mensajes..."
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                {busqueda && (
                                    <button
                                        onClick={() => setBusqueda('')}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                            
                            {/* Filtro por tipo */}
                            <div className="lg:w-48">
                                <select
                                    value={tipoBusqueda}
                                    onChange={(e) => setTipoBusqueda(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="todo">🔍 Buscar en todo</option>
                                    <option value="usuario">👤 Solo usuarios</option>
                                    <option value="mensaje">💬 Solo mensajes</option>
                                </select>
                            </div>
                        </div>
                        
                        {/* Indicador de resultados */}
                        {busqueda && (
                            <div className="flex items-center justify-between text-sm text-gray-600 bg-blue-50 px-4 py-2 rounded-lg">
                                <span>
                                    {conversacionesFiltradas.length === 0 ? (
                                        <span className="text-red-600">❌ No se encontraron resultados</span>
                                    ) : (
                                        <span className="text-blue-600">
                                            ✅ {conversacionesFiltradas.length} conversación(es) encontrada(s)
                                        </span>
                                    )}
                                </span>
                                <span className="text-gray-500">
                                    Filtro: {tipoBusqueda === 'todo' ? 'Completo' : tipoBusqueda === 'usuario' ? 'Usuarios' : 'Mensajes'}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Conversaciones de Usuarios */}
                <div className="bg-white rounded-lg shadow-lg border border-gray-300 overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                {busqueda ? 
                                    `Resultados de búsqueda "${busqueda}"` : 
                                    'Conversaciones por Usuario (Orden Alfabético)'
                                }
                            </h3>
                            <span className="text-sm text-gray-500">
                                {busqueda ? 
                                    `${conversacionesFiltradas.length} de ${conversaciones.length} conversaciones` :
                                    `Total: ${conversaciones.length} conversaciones`
                                }
                            </span>
                        </div>
                    </div>
                    
                    {conversacionesFiltradas.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Usuario
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Última Pregunta
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Mensajes
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Fecha
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {conversacionesFiltradas.map((conversacion) => {
                                        // Encontrar el último mensaje del usuario
                                        const ultimaPregunta = conversacion.mensajes
                                            ?.filter(msg => msg.tipo === 'usuario' || msg.role === 'user')
                                            ?.slice(-1)[0];
                                        
                                        // Función para resaltar el texto buscado
                                        const resaltarTexto = (texto) => {
                                            if (!busqueda || !texto) return texto;
                                            const regex = new RegExp(`(${busqueda})`, 'gi');
                                            return texto.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
                                        };
                                        
                                        return (
                                            <tr 
                                                key={conversacion._id} 
                                                className="hover:bg-gray-50 transition-colors cursor-pointer"
                                                onClick={() => verConversacion(conversacion)}
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-8 w-8">
                                                            <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                                                                <span className="text-sm font-medium text-purple-600">
                                                                    {conversacion.usuario?.nombre?.charAt(0)?.toUpperCase() || 'U'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="ml-3">
                                                            <div 
                                                                className="text-sm font-medium text-gray-900"
                                                                dangerouslySetInnerHTML={{
                                                                    __html: resaltarTexto(conversacion.usuario?.nombre || 'Usuario anónimo')
                                                                }}
                                                            />
                                                            <div 
                                                                className="text-sm text-gray-500"
                                                                dangerouslySetInnerHTML={{
                                                                    __html: resaltarTexto(conversacion.usuario?.email || 'Sin email')
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-900 max-w-md">
                                                        {ultimaPregunta?.contenido || ultimaPregunta?.content ? (
                                                            <div 
                                                                className="truncate"
                                                                dangerouslySetInnerHTML={{
                                                                    __html: '"' + resaltarTexto(
                                                                        (ultimaPregunta.contenido || ultimaPregunta.content).substring(0, 100)
                                                                    ) + (
                                                                        (ultimaPregunta.contenido || ultimaPregunta.content).length > 100 ? '...' : '"'
                                                                    )
                                                                }}
                                                            />
                                                        ) : (
                                                            <span className="text-gray-400 italic">Sin preguntas registradas</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                            {conversacion.mensajes?.length || 0} mensajes
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <div className="flex items-center justify-between">
                                                        <span>{formatearFecha(conversacion.updatedAt || conversacion.createdAt)}</span>
                                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="px-6 py-12 text-center">
                            <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={busqueda ? "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" : "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"} />
                            </svg>
                            <h3 className="text-sm font-medium text-gray-900 mb-1">
                                {busqueda ? 'No se encontraron resultados' : 'No hay conversaciones'}
                            </h3>
                            <p className="text-sm text-gray-500">
                                {busqueda ? 
                                    `No hay conversaciones que coincidan con "${busqueda}"` : 
                                    'Aún no se han registrado conversaciones de usuarios.'
                                }
                            </p>
                        </div>
                    )}
                </div>

                {/* Modal de Conversación */}
                {mostrarModalConversacion && conversacionSeleccionada && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
                            {/* Header del modal */}
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                        <span className="text-lg font-medium text-purple-600">
                                            {conversacionSeleccionada.usuario?.nombre?.charAt(0)?.toUpperCase() || 'U'}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            Conversación con {conversacionSeleccionada.usuario?.nombre || 'Usuario anónimo'}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            {conversacionSeleccionada.usuario?.email || 'Sin email'} • {conversacionSeleccionada.mensajes?.length || 0} mensajes
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={cerrarModalConversacion}
                                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                                >
                                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Contenido de mensajes */}
                            <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 160px)' }}>
                                {conversacionSeleccionada.mensajes && conversacionSeleccionada.mensajes.length > 0 ? (
                                    <div className="space-y-4">
                                        {conversacionSeleccionada.mensajes.map((mensaje, index) => {
                                            const esUsuario = mensaje.tipo === 'usuario' || mensaje.role === 'user';
                                            const contenido = mensaje.contenido || mensaje.content || '';
                                            
                                            // Función para resaltar texto en el modal
                                            const resaltarTextoModal = (texto) => {
                                                if (!busqueda || !texto) return texto;
                                                const regex = new RegExp(`(${busqueda})`, 'gi');
                                                return texto.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
                                            };
                                            
                                            return (
                                                <div
                                                    key={index}
                                                    className={`flex ${esUsuario ? 'justify-end' : 'justify-start'}`}
                                                >
                                                    <div
                                                        className={`max-w-[70%] rounded-lg px-4 py-3 ${
                                                            esUsuario
                                                                ? 'bg-blue-500 text-white'
                                                                : 'bg-gray-100 text-gray-900 border border-gray-200'
                                                        }`}
                                                    >
                                                        <div className="flex items-start space-x-2">
                                                            {!esUsuario && (
                                                                <div className="flex-shrink-0 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center mt-1">
                                                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                                    </svg>
                                                                </div>
                                                            )}
                                                            <div className="flex-1">
                                                                <div className={`text-xs ${esUsuario ? 'text-blue-100' : 'text-gray-500'} mb-1`}>
                                                                    {esUsuario ? 'Usuario' : 'AirbnbBot'}
                                                                    {mensaje.timestamp && (
                                                                        <span className="ml-2">
                                                                            {new Date(mensaje.timestamp).toLocaleTimeString('es-ES', {
                                                                                hour: '2-digit',
                                                                                minute: '2-digit'
                                                                            })}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div 
                                                                    className="text-sm whitespace-pre-wrap break-words"
                                                                    dangerouslySetInnerHTML={{
                                                                        __html: resaltarTextoModal(contenido)
                                                                    }}
                                                                />
                                                            </div>
                                                            {esUsuario && (
                                                                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center mt-1">
                                                                    <span className="text-xs text-white font-medium">
                                                                        {conversacionSeleccionada.usuario?.nombre?.charAt(0)?.toUpperCase() || 'U'}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                        <p className="text-gray-500">No hay mensajes en esta conversación</p>
                                    </div>
                                )}
                            </div>

                            {/* Footer del modal */}
                            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                                <div className="text-sm text-gray-600">
                                    Iniciada el {formatearFecha(conversacionSeleccionada.createdAt)}
                                    {busqueda && (
                                        <span className="ml-4 text-blue-600">
                                            🔍 Búsqueda activa: "{busqueda}"
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={cerrarModalConversacion}
                                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PromptsAdmin;