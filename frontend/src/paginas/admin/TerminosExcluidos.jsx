import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import clienteAxios from '../../config/axios';
import useAuth from '../../hooks/useAuth';

const TerminosExcluidosAdmin = () => {
    const { auth } = useAuth();
    const [terminos, setTerminos] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [mostrarModal, setMostrarModal] = useState(false);
    const [terminoEditando, setTerminoEditando] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
    const [formData, setFormData] = useState({
        palabra: '',
        usuarioId: '',
        aplicarGlobalmente: false,
        activo: true
    });
    const [usuarios, setUsuarios] = useState([]);
    const [estadisticas, setEstadisticas] = useState({
        totalTerminos: 0,
        terminosActivos: 0,
        terminosInactivos: 0,
        usuariosConTerminos: 0
    });

    useEffect(() => {
        if (auth?.rol === 'admin') {
            cargarDatos();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [auth]);

    const cargarDatos = async () => {
        await Promise.all([
            cargarTerminos(),
            cargarUsuarios(),
            cargarEstadisticas()
        ]);
    };

    const cargarTerminos = async () => {
        try {
            setCargando(true);
            const token = localStorage.getItem('token');
            const config = {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }
            };

            const { data } = await clienteAxios.get('/admin/terminos-excluidos', config);
            setTerminos(data.terminos || []);
        } catch (error) {
            console.error('Error al cargar términos excluidos:', error);
            setTerminos([]);
        } finally {
            setCargando(false);
        }
    };

    const cargarUsuarios = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }
            };

            const { data } = await clienteAxios.get('/admin/usuarios', config);
            setUsuarios(data.usuarios || []);
        } catch (error) {
            console.error('Error al cargar usuarios:', error);
            setUsuarios([]);
        }
    };

    const cargarEstadisticas = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }
            };

            const { data } = await clienteAxios.get('/admin/terminos-excluidos/estadisticas', config);
            setEstadisticas(data.estadisticas || {
                totalTerminos: 0,
                terminosActivos: 0,
                terminosInactivos: 0,
                usuariosConTerminos: 0
            });
        } catch (error) {
            console.error('Error al cargar estadísticas:', error);
        }
    };

    const terminosFiltrados = terminos.filter(termino =>
        termino.palabra?.toLowerCase().includes(busqueda.toLowerCase()) ||
        termino.usuario?.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
        termino.usuario?.email?.toLowerCase().includes(busqueda.toLowerCase())
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        setGuardando(true);
        
        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }
            };

            if (terminoEditando) {
                // Actualizar término existente
                const { data } = await clienteAxios.put(
                    `/admin/terminos-excluidos/${terminoEditando._id}`, 
                    { palabra: formData.palabra, activo: formData.activo }, 
                    config
                );
                setTerminos(terminos.map(t => 
                    t._id === terminoEditando._id ? data.termino : t
                ));
                setMensaje({
                    texto: 'Término actualizado correctamente',
                    tipo: 'exito'
                });
            } else {
                // Crear nuevo término
                const { data } = await clienteAxios.post('/admin/terminos-excluidos', formData, config);
                setTerminos([...terminos, data.termino]);
                setMensaje({
                    texto: 'Término creado correctamente',
                    tipo: 'exito'
                });
            }
            cerrarModal();
            await cargarEstadisticas(); // Actualizar estadísticas
        } catch (error) {
            console.error('Error al guardar término:', error);
            setMensaje({
                texto: error.response?.data?.msg || 'Error al guardar el término',
                tipo: 'error'
            });
        } finally {
            setGuardando(false);
        }
    };

    const editarTermino = (termino) => {
        setTerminoEditando(termino);
        setFormData({
            palabra: termino.palabra || '',
            usuarioId: termino.usuario?._id || '',
            aplicarGlobalmente: termino.aplicarGlobalmente || false,
            activo: termino.activo !== undefined ? termino.activo : true
        });
        setMostrarModal(true);
    };

    const eliminarTermino = async (id) => {
        if (!window.confirm('¿Estás seguro de eliminar este término excluido?')) return;

        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }
            };

            await clienteAxios.delete(`/admin/terminos-excluidos/${id}`, config);
            setTerminos(terminos.filter(t => t._id !== id));
            setMensaje({
                texto: 'Término eliminado correctamente',
                tipo: 'exito'
            });
            await cargarEstadisticas(); // Actualizar estadísticas
        } catch (error) {
            console.error('Error al eliminar término:', error);
            setMensaje({
                texto: error.response?.data?.msg || 'Error al eliminar el término',
                tipo: 'error'
            });
        }
    };

    const toggleEstado = async (id, nuevoEstado) => {
        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }
            };

            await clienteAxios.patch(
                `/admin/terminos-excluidos/${id}/estado`, 
                { activo: nuevoEstado }, 
                config
            );

            setTerminos(terminos.map(t => 
                t._id === id ? { ...t, activo: nuevoEstado } : t
            ));

            setMensaje({
                texto: `Término ${nuevoEstado ? 'activado' : 'desactivado'} correctamente`,
                tipo: 'exito'
            });
            await cargarEstadisticas(); // Actualizar estadísticas
        } catch (error) {
            console.error('Error al cambiar estado:', error);
            setMensaje({
                texto: 'Error al cambiar el estado del término',
                tipo: 'error'
            });
        }
    };

    const cerrarModal = () => {
        setMostrarModal(false);
        setTerminoEditando(null);
        setFormData({
            palabra: '',
            usuarioId: '',
            aplicarGlobalmente: false,
            activo: true
        });
    };

    const formatearFecha = (fecha) => {
        if (!fecha) return 'N/A';
        return new Date(fecha).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    // Limpiar mensaje después de 5 segundos
    useEffect(() => {
        if (mensaje.texto) {
            const timer = setTimeout(() => {
                setMensaje({ texto: '', tipo: '' });
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [mensaje]);

    if (cargando) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-gray-200 to-slate-300">
                <div className="text-center">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-gray-300 border-t-red-500 rounded-full animate-spin mx-auto"></div>
                    </div>
                    <p className="mt-6 text-gray-700 font-medium">Cargando términos excluidos...</p>
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
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                                    </svg>
                                </div>
                                <div>
                                    <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
                                        Términos Excluidos
                                    </h1>
                                    <p className="text-gray-600 text-lg font-medium">
                                        Gestiona los términos prohibidos en el sistema
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
                            <button
                                onClick={() => setMostrarModal(true)}
                                className="inline-flex items-center px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-lg"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Agregar Término
                            </button>
                        </div>
                    </div>

                    {/* Estadísticas */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-md">
                            <div className="flex items-center space-x-3">
                                <div className="w-4 h-4 rounded-full bg-red-500 shadow-lg"></div>
                                <div>
                                    <p className="text-gray-600 text-sm font-medium">Total Términos</p>
                                    <p className="text-lg font-bold text-red-600">
                                        {estadisticas.totalTerminos}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-md">
                            <div className="flex items-center space-x-3">
                                <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-lg"></div>
                                <div>
                                    <p className="text-gray-600 text-sm font-medium">Activos</p>
                                    <p className="text-lg font-bold text-emerald-600">
                                        {estadisticas.terminosActivos}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-md">
                            <div className="flex items-center space-x-3">
                                <div className="w-4 h-4 rounded-full bg-gray-500 shadow-lg"></div>
                                <div>
                                    <p className="text-gray-600 text-sm font-medium">Inactivos</p>
                                    <p className="text-lg font-bold text-gray-600">
                                        {estadisticas.terminosInactivos}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-md">
                            <div className="flex items-center space-x-3">
                                <div className="w-4 h-4 rounded-full bg-purple-500 shadow-lg"></div>
                                <div>
                                    <p className="text-gray-600 text-sm font-medium">Usuarios</p>
                                    <p className="text-lg font-bold text-purple-600">
                                        {estadisticas.usuariosConTerminos}
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

                {/* Buscador */}
                <div className="bg-white rounded-lg shadow-md border border-gray-300 p-6 mb-8">
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Buscar términos por palabra, usuario o email..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                    </div>
                </div>

                {/* Tabla de Términos */}
                <div className="bg-white rounded-lg shadow-lg border border-gray-300 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Término
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Usuario
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Estado
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Alcance
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Fecha Creación
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {terminosFiltrados.length > 0 ? (
                                    terminosFiltrados.map((termino) => (
                                        <tr key={termino._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {termino.palabra}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-8 w-8">
                                                        <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                                                            <span className="text-sm font-medium text-red-600">
                                                                {termino.usuario?.nombre?.charAt(0)?.toUpperCase() || 'U'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="ml-3">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {termino.usuario?.nombre || 'Usuario desconocido'}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {termino.usuario?.email || 'Sin email'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <label className="inline-flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={termino.activo}
                                                        onChange={(e) => toggleEstado(termino._id, e.target.checked)}
                                                        className="form-checkbox h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                                                    />
                                                    <span className={`ml-2 text-xs font-medium ${
                                                        termino.activo ? 'text-emerald-600' : 'text-gray-500'
                                                    }`}>
                                                        {termino.activo ? 'Activo' : 'Inactivo'}
                                                    </span>
                                                </label>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                    termino.aplicarGlobalmente 
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {termino.aplicarGlobalmente ? 'Global' : 'Personal'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatearFecha(termino.fechaCreacion)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => editarTermino(termino)}
                                                        className="inline-flex items-center px-3 py-1 border border-blue-300 text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                                                        title="Editar término"
                                                    >
                                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                        Editar
                                                    </button>
                                                    <button
                                                        onClick={() => eliminarTermino(termino._id)}
                                                        className="inline-flex items-center px-3 py-1 border border-red-300 text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                                                        title="Eliminar término"
                                                    >
                                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center">
                                                <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                                                </svg>
                                                <p className="text-gray-500 text-sm">No se encontraron términos excluidos</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Modal */}
                {mostrarModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                            <div className="p-6">
                                <h2 className="text-2xl font-bold mb-6 text-gray-900">
                                    {terminoEditando ? 'Editar Término' : 'Nuevo Término Excluido'}
                                </h2>
                                <form onSubmit={handleSubmit}>
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Palabra o Término *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.palabra}
                                                onChange={(e) => setFormData({...formData, palabra: e.target.value})}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                                placeholder="Ej: violencia, drogas, etc."
                                            />
                                        </div>
                                        
                                        {!terminoEditando && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Usuario *
                                                </label>
                                                <select
                                                    required
                                                    value={formData.usuarioId}
                                                    onChange={(e) => setFormData({...formData, usuarioId: e.target.value})}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                                >
                                                    <option value="">Seleccionar usuario...</option>
                                                    {usuarios.map((usuario) => (
                                                        <option key={usuario._id} value={usuario._id}>
                                                            {usuario.nombre} ({usuario.email})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between">
                                            <label className="flex items-center space-x-3">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.aplicarGlobalmente}
                                                    onChange={(e) => setFormData({...formData, aplicarGlobalmente: e.target.checked})}
                                                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                                                    disabled={terminoEditando} // No permitir cambiar esto en edición
                                                />
                                                <span className="text-sm font-medium text-gray-700">
                                                    Aplicar globalmente
                                                </span>
                                            </label>

                                            {terminoEditando && (
                                                <label className="flex items-center space-x-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.activo}
                                                        onChange={(e) => setFormData({...formData, activo: e.target.checked})}
                                                        className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                                                    />
                                                    <span className="text-sm font-medium text-gray-700">
                                                        Término activo
                                                    </span>
                                                </label>
                                            )}
                                        </div>

                                        {formData.aplicarGlobalmente && (
                                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                                <div className="flex">
                                                    <svg className="w-5 h-5 text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                                    </svg>
                                                    <div>
                                                        <h3 className="text-sm font-medium text-yellow-800">
                                                            Configuración Global
                                                        </h3>
                                                        <p className="text-sm text-yellow-700 mt-1">
                                                            Este término se aplicará a todos los usuarios del sistema, no solo al usuario seleccionado.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-8 flex justify-end space-x-4">
                                        <button
                                            type="button"
                                            onClick={cerrarModal}
                                            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                            disabled={guardando}
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={guardando}
                                            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                                        >
                                            {guardando ? (
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    <span>Guardando...</span>
                                                </div>
                                            ) : (
                                                terminoEditando ? 'Actualizar' : 'Crear'
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TerminosExcluidosAdmin;