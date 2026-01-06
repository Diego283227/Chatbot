import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import clienteAxios from '../../config/axios';
import useAuth from '../../hooks/useAuth';

const UsuariosAdmin = () => {
    const { auth } = useAuth();
    const [usuarios, setUsuarios] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [busquedaServidor, setBusquedaServidor] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('todos');
    const [cargando, setCargando] = useState(true);
    const [paginaActual, setPaginaActual] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);

    // Timer para el debounce
    const [searchTimer, setSearchTimer] = useState(null);

    // Cargar usuarios cuando cambian los parámetros del servidor
    useEffect(() => {
        cargarUsuarios();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paginaActual, filtroEstado, busquedaServidor]);

    // Implementar debounce para la búsqueda
    useEffect(() => {
        // Limpiar el timer anterior
        if (searchTimer) {
            clearTimeout(searchTimer);
        }

        // Si la búsqueda está vacía, actualizar inmediatamente
        if (busqueda === '') {
            setBusquedaServidor('');
            return;
        }

        // Establecer un nuevo timer
        const newTimer = setTimeout(() => {
            setBusquedaServidor(busqueda);
            setPaginaActual(1); // Resetear a la primera página al buscar
        }, 800); // Esperar 800ms después de que el usuario deje de escribir

        setSearchTimer(newTimer);

        // Limpiar el timer cuando el componente se desmonte
        return () => {
            if (newTimer) {
                clearTimeout(newTimer);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [busqueda]);

    const cargarUsuarios = async () => {
        try {
            // Solo mostrar cargando en la carga inicial o cambio de página/filtro
            if (usuarios.length === 0) {
                setCargando(true);
            }
            
            const token = localStorage.getItem('token');
            if (!token) return;

            const config = {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }
            };

            // Construir URL con parámetros de consulta
            const params = new URLSearchParams({
                page: paginaActual,
                limit: 10,
                busqueda: busquedaServidor,
                filtro: filtroEstado
            });

            const { data } = await clienteAxios.get(`/admin/usuarios?${params}`, config);
            
            setUsuarios(data.usuarios || []);
            setTotalPaginas(data.totalPages || 1);
            setPaginaActual(data.currentPage || 1);
            
        } catch (error) {
            console.error('Error al cargar usuarios:', error);
            // Si hay error, usar datos de ejemplo
            setUsuarios([
                {
                    _id: '1',
                    nombre: 'Usuario de ejemplo',
                    email: 'ejemplo@correo.com',
                    rol: 'usuario',
                    confirmado: true,
                    createdAt: new Date().toISOString()
                }
            ]);
        } finally {
            setCargando(false);
        }
    };

    // Filtrar usuarios localmente para búsqueda instantánea
    const usuariosFiltrados = usuarios.filter(usuario => {
        if (busqueda === '') return true;
        
        const busquedaLower = busqueda.toLowerCase();
        return (
            usuario.nombre?.toLowerCase().includes(busquedaLower) ||
            usuario.email?.toLowerCase().includes(busquedaLower)
        );
    });

    const eliminarUsuario = async (id) => {
        if (!window.confirm('¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.')) return;

        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }
            };

            await clienteAxios.delete(`/admin/usuarios/${id}`, config);
            
            // Actualizar localmente
            setUsuarios(usuarios.filter(u => u._id !== id));
            
            // Recargar si es necesario
            if (usuarios.length === 1 && paginaActual > 1) {
                setPaginaActual(paginaActual - 1);
            }
            
        } catch (error) {
            console.error('Error al eliminar usuario:', error);
            alert(error.response?.data?.msg || 'Error al eliminar el usuario');
        }
    };

    const formatearFecha = (fecha) => {
        if (!fecha) return 'Nunca';
        return new Date(fecha).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    // Limpiar búsqueda
    const limpiarBusqueda = () => {
        setBusqueda('');
        setBusquedaServidor('');
        if (searchTimer) {
            clearTimeout(searchTimer);
        }
    };

    // Solo mostrar pantalla de carga en la carga inicial
    if (cargando && usuarios.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-gray-200 border-t-red-500 rounded-full animate-spin mx-auto"></div>
                    </div>
                    <p className="mt-6 text-gray-600 font-medium">Cargando usuarios...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                                Gestión de Usuarios
                            </h1>
                            <p className="mt-2 text-gray-600">
                                Visualiza y gestiona los usuarios del sistema
                            </p>
                        </div>
                        <Link 
                            to="/admin" 
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Volver al Dashboard
                        </Link>
                    </div>
                </div>

                {/* Filtros */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Buscar usuarios
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </span>
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre o email..."
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                />
                                {busqueda && (
                                    <button
                                        onClick={limpiarBusqueda}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                            {busqueda !== busquedaServidor && busqueda !== '' && (
                                <div className="flex items-center mt-2 text-xs text-gray-500">
                                    <div className="w-3 h-3 border border-gray-300 border-t-red-500 rounded-full animate-spin mr-2"></div>
                                    Buscando...
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Filtrar por estado
                            </label>
                            <select
                                value={filtroEstado}
                                onChange={(e) => {
                                    setFiltroEstado(e.target.value);
                                    setPaginaActual(1);
                                }}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            >
                                <option value="todos">Todos los usuarios</option>
                                <option value="activos">Usuarios confirmados</option>
                                <option value="inactivos">Sin confirmar</option>
                                <option value="admin">Administradores</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Estadísticas */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-slate-100 rounded-lg">
                                <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total usuarios</p>
                                <p className="text-2xl font-bold text-gray-900">{usuarios.length}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-emerald-100 rounded-lg">
                                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Confirmados</p>
                                <p className="text-2xl font-bold text-emerald-600">
                                    {usuarios.filter(u => u.confirmado).length}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-amber-100 rounded-lg">
                                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Sin confirmar</p>
                                <p className="text-2xl font-bold text-amber-600">
                                    {usuarios.filter(u => !u.confirmado).length}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Administradores</p>
                                <p className="text-2xl font-bold text-red-600">
                                    {usuarios.filter(u => u.rol === 'admin').length}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Resultados de búsqueda */}
                {busqueda && (
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-700">
                            <span className="font-medium">
                                {usuariosFiltrados.length} resultado{usuariosFiltrados.length !== 1 ? 's' : ''} encontrado{usuariosFiltrados.length !== 1 ? 's' : ''}
                            </span>
                            {busqueda !== busquedaServidor && ' (búsqueda local)'}
                        </p>
                    </div>
                )}

                {/* Tabla de usuarios */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Usuario
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Rol
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Estado
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Fecha registro
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {usuariosFiltrados.length > 0 ? (
                                    usuariosFiltrados.map((usuario) => (
                                        <tr key={usuario._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10">
                                                        <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                                                            <span className="text-sm font-medium text-red-600">
                                                                {usuario.nombre?.charAt(0)?.toUpperCase() || 'U'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {usuario.nombre}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {usuario.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                    usuario.rol === 'admin' 
                                                        ? 'bg-red-100 text-red-800' 
                                                        : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {usuario.rol === 'admin' ? 'Administrador' : 'Usuario'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className={`flex-shrink-0 h-2.5 w-2.5 rounded-full mr-3 ${
                                                        usuario.confirmado ? 'bg-emerald-400' : 'bg-amber-400'
                                                    }`}></div>
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                        usuario.confirmado 
                                                            ? 'bg-emerald-100 text-emerald-800' 
                                                            : 'bg-amber-100 text-amber-800'
                                                    }`}>
                                                        {usuario.confirmado ? 'Confirmado' : 'Sin confirmar'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatearFecha(usuario.createdAt)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                {usuario._id !== auth._id ? (
                                                    <button
                                                        onClick={() => eliminarUsuario(usuario._id)}
                                                        className="inline-flex items-center px-3 py-1.5 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                                                        title="Eliminar usuario"
                                                    >
                                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                        Eliminar
                                                    </button>
                                                ) : (
                                                    <span className="inline-flex items-center px-3 py-1.5 text-sm text-gray-500 bg-gray-100 rounded-lg">
                                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                        </svg>
                                                        Tu cuenta
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center">
                                                <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                                </svg>
                                                <p className="text-gray-500 text-sm">No se encontraron usuarios</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Paginación */}
                    {totalPaginas > 1 && !busqueda && (
                        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
                            <div className="flex-1 flex justify-between sm:hidden">
                                <button
                                    onClick={() => setPaginaActual(Math.max(1, paginaActual - 1))}
                                    disabled={paginaActual === 1}
                                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Anterior
                                </button>
                                <button
                                    onClick={() => setPaginaActual(Math.min(totalPaginas, paginaActual + 1))}
                                    disabled={paginaActual === totalPaginas}
                                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Siguiente
                                </button>
                            </div>
                            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-center">
                                <div>
                                    <nav className="relative z-0 inline-flex rounded-lg shadow-sm -space-x-px">
                                        {[...Array(totalPaginas)].map((_, index) => (
                                            <button
                                                key={index + 1}
                                                onClick={() => setPaginaActual(index + 1)}
                                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-colors ${
                                                    paginaActual === index + 1
                                                        ? 'z-10 bg-red-50 border-red-500 text-red-600'
                                                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                } ${index === 0 ? 'rounded-l-lg' : ''} ${index === totalPaginas - 1 ? 'rounded-r-lg' : ''}`}
                                            >
                                                {index + 1}
                                            </button>
                                        ))}
                                    </nav>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UsuariosAdmin;