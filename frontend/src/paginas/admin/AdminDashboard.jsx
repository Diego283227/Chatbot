import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import clienteAxios from '../../config/axios';

const AdminDashboard = () => {
    const { auth } = useAuth();
    const [estadisticas, setEstadisticas] = useState({
        totalUsuarios: 0,
        usuariosActivos: 0,
        promptsActivos: 0,
        conversacionesHoy: 0,
        nuevosUsuariosHoy: 0,
        conversacionesTotal: 0
    });
    const [actividadReciente, setActividadReciente] = useState([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        obtenerEstadisticas();
        obtenerActividadReciente();
    }, []);

    const obtenerEstadisticas = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const config = {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }
            };

            const { data } = await clienteAxios.get('/admin/estadisticas', config);

            setEstadisticas({
                totalUsuarios: data.totalUsuarios || 0,
                usuariosActivos: data.usuariosActivos || 0,
                promptsActivos: data.promptsActivos || 0,
                conversacionesHoy: data.conversacionesHoy || 0,
                nuevosUsuariosHoy: data.nuevosUsuariosHoy || 0,
                conversacionesTotal: data.conversacionesTotal || 0
            });
        } catch (error) {
            console.error('Error al obtener estadísticas:', error);
        } finally {
            setCargando(false);
        }
    };

    const obtenerActividadReciente = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const config = {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }
            };

            const { data } = await clienteAxios.get('/admin/actividad-reciente', config);
            setActividadReciente(data.actividades || []);
        } catch (error) {
            console.error('Error al obtener actividad reciente:', error);
        }
    };

    const stats = [
        {
            title: 'Usuarios Totales',
            value: estadisticas.totalUsuarios.toLocaleString(),
            subValue: `${estadisticas.usuariosActivos} activos`,
            icon: '👥',
            bgColor: 'bg-slate-50',
            iconColor: 'text-slate-600',
            borderColor: 'border-slate-200',
            link: '/admin/usuarios'
        },
        {
            title: 'Prompts Activos',
            value: estadisticas.promptsActivos.toLocaleString(),
            icon: '💬',
            bgColor: 'bg-emerald-50',
            iconColor: 'text-emerald-600',
            borderColor: 'border-emerald-200',
            link: '/admin/prompts'
        },
        {
            title: 'Conversaciones Hoy',
            value: estadisticas.conversacionesHoy.toLocaleString(),
            subValue: `${estadisticas.conversacionesTotal.toLocaleString()} total`,
            icon: '📊',
            bgColor: 'bg-red-50',
            iconColor: 'text-red-600',
            borderColor: 'border-red-200',
            link: '/admin'
        },
        {
            title: 'Nuevos Usuarios Hoy',
            value: estadisticas.nuevosUsuariosHoy.toLocaleString(),
            icon: '🆕',
            bgColor: 'bg-amber-50',
            iconColor: 'text-amber-600',
            borderColor: 'border-amber-200',
            link: '/admin/usuarios'
        }
    ];

    const formatearTiempo = (fecha) => {
        const ahora = new Date();
        const fechaActividad = new Date(fecha);
        const diferencia = ahora - fechaActividad;

        const minutos = Math.floor(diferencia / 60000);
        const horas = Math.floor(diferencia / 3600000);
        const dias = Math.floor(diferencia / 86400000);

        if (minutos < 1) return 'Hace un momento';
        if (minutos < 60) return `Hace ${minutos} minuto${minutos > 1 ? 's' : ''}`;
        if (horas < 24) return `Hace ${horas} hora${horas > 1 ? 's' : ''}`;
        return `Hace ${dias} día${dias > 1 ? 's' : ''}`;
    };

    const obtenerColorActividad = (tipo) => {
        switch (tipo) {
            case 'nuevo_usuario':
                return 'border-l-slate-400 bg-slate-50';
            case 'prompt_actualizado':
                return 'border-l-emerald-400 bg-emerald-50';
            case 'conversacion':
                return 'border-l-red-400 bg-red-50';
            case 'usuario_eliminado':
                return 'border-l-orange-400 bg-orange-50';
            default:
                return 'border-l-gray-400 bg-gray-50';
        }
    };

    if (cargando) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-gray-200 border-t-red-500 rounded-full animate-spin mx-auto"></div>
                    </div>
                    <p className="mt-6 text-gray-600 font-medium">Cargando estadísticas...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                
                {/* Header */}
                <div className="mb-10">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                                Dashboard
                            </h1>
                            <p className="mt-2 text-gray-600">
                                Bienvenido, <span className="font-medium text-gray-900">{auth?.nombre || 'Administrador'}</span>
                            </p>
                        </div>
                        <div className="flex items-center space-x-3">
                            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-sm text-gray-600 font-medium">Sistema activo</span>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    {stats.map((stat, index) => (
                        <Link
                            key={index}
                            to={stat.link}
                            className="group block"
                        >
                            <div className={`bg-white rounded-xl border ${stat.borderColor} p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 group-hover:border-red-300`}>
                                <div className="flex items-center justify-between">
                                    <div className={`${stat.bgColor} rounded-lg p-3`}>
                                        <span className={`text-2xl ${stat.iconColor}`}>{stat.icon}</span>
                                    </div>
                                    <svg className="w-4 h-4 text-gray-400 group-hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                                <div className="mt-4">
                                    <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                                        {stat.title}
                                    </h3>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">
                                        {stat.value}
                                    </p>
                                    {stat.subValue && (
                                        <p className="text-sm text-gray-500 mt-1">
                                            {stat.subValue}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Acciones rápidas */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-6">
                                Acciones Rápidas
                            </h2>
                            <div className="space-y-3">
                                <Link
                                    to="/admin/usuarios"
                                    className="w-full bg-slate-600 text-white rounded-lg px-4 py-3 text-sm font-medium hover:bg-slate-700 transition-colors flex items-center justify-between group"
                                >
                                    <span>Gestionar Usuarios</span>
                                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </Link>
                                <Link
                                    to="/admin/prompts"
                                    className="w-full bg-emerald-600 text-white rounded-lg px-4 py-3 text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center justify-between group"
                                >
                                    <span>Administrar Prompts</span>
                                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </Link>
                                <Link
                                    to="/admin/prompt-contexto"
                                    className="w-full bg-red-500 text-white rounded-lg px-4 py-3 text-sm font-medium hover:bg-red-600 transition-colors flex items-center justify-between group"
                                >
                                    <span>Prompt de Contexto</span>
                                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </Link>
                                <button
                                    className="w-full bg-gray-100 text-gray-700 rounded-lg px-4 py-3 text-sm font-medium hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
                                    onClick={obtenerEstadisticas}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    <span>Actualizar Stats</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Actividad reciente */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Actividad Reciente
                                </h2>
                                <button
                                    onClick={obtenerActividadReciente}
                                    className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center space-x-1 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    <span>Actualizar</span>
                                </button>
                            </div>

                            {actividadReciente.length > 0 ? (
                                <div className="space-y-4 max-h-96 overflow-y-auto">
                                    {actividadReciente.map((actividad, index) => (
                                        <div
                                            key={index}
                                            className={`border-l-4 pl-4 py-3 rounded-r-lg ${obtenerColorActividad(actividad.tipo)}`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-900 mb-1">
                                                        {actividad.descripcion}
                                                    </p>
                                                    {actividad.detalles && (
                                                        <p className="text-sm text-gray-600 mb-2">
                                                            {actividad.detalles}
                                                        </p>
                                                    )}
                                                </div>
                                                <span className="text-xs text-gray-500 font-medium whitespace-nowrap ml-4">
                                                    {formatearTiempo(actividad.fecha)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                    <p className="text-gray-500 text-sm">
                                        No hay actividad reciente para mostrar
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;