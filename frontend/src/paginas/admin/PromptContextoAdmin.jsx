import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import clienteAxios from '../../config/axios';
import useAuth from '../../hooks/useAuth';

const PromptContextoAdmin = () => {
    const { auth } = useAuth();
    const navigate = useNavigate();
    const [prompt, setPrompt] = useState(null);
    const [contenidoEditado, setContenidoEditado] = useState('');
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

    useEffect(() => {
        if (auth?.rol === 'admin') {
            cargarPrompt();
        } else {
            navigate('/admin');
        }
    }, [auth, navigate]);

    const cargarPrompt = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            };

            const { data } = await clienteAxios.get('/admin/prompt-contexto', config);
            console.log('Prompt desde BD:', data.prompt);
            
            setPrompt(data.prompt);
            setContenidoEditado(data.prompt.contenido || '');
            setCargando(false);
        } catch (error) {
            console.error('Error:', error);
            setCargando(false);
            setMensaje({
                texto: 'Error al cargar el prompt',
                tipo: 'error'
            });
        }
    };

    const guardarCambios = async () => {
        try {
            setGuardando(true);
            const token = localStorage.getItem('token');
            const config = {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }
            };

            const { data } = await clienteAxios.put('/admin/prompt-contexto', {
                contenido: contenidoEditado
            }, config);

            setPrompt(data.prompt);
            setContenidoEditado(data.prompt.contenido);
            
            setMensaje({
                texto: 'Cambios guardados correctamente',
                tipo: 'exito'
            });

            setTimeout(() => {
                setMensaje({ texto: '', tipo: '' });
            }, 3000);

        } catch (error) {
            console.error('Error al guardar:', error);
            setMensaje({
                texto: 'Error al guardar los cambios',
                tipo: 'error'
            });
        } finally {
            setGuardando(false);
        }
    };

    if (cargando) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-gray-200 to-slate-300">
                <div className="text-center">
                    <div className="relative">
                        <div className="w-20 h-20 border-4 border-gray-400 border-t-red-500 rounded-full animate-spin mx-auto"></div>
                        <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-r-red-400 rounded-full animate-ping mx-auto"></div>
                    </div>
                    <p className="mt-6 text-gray-700 font-medium text-lg">Cargando configuración del sistema...</p>
                    <div className="mt-2 flex justify-center space-x-1">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-gray-200 to-slate-300">
            {/* Header */}
            <div className="bg-white shadow-lg border-b border-gray-300">
                <div className="max-w-6xl mx-auto px-4 py-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <div className="flex items-center space-x-4 mb-2">
                                <div className="p-3 bg-red-500 rounded-lg shadow-lg">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                </div>
                                <div>
                                    <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
                                        Configuración del Sistema
                                    </h1>
                                    <p className="text-gray-600 text-lg font-medium">
                                        Control avanzado del comportamiento IA
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <Link 
                            to="/admin" 
                            className="group inline-flex items-center px-6 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-700 transition-all duration-300 shadow-lg"
                        >
                            <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Dashboard
                        </Link>
                    </div>

                    {/* Indicadores de estado */}
                    {prompt && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-md">
                                <div className="flex items-center space-x-3">
                                    <div className={`w-4 h-4 rounded-full ${prompt.activo ? 'bg-emerald-500 animate-pulse shadow-lg' : 'bg-red-500 shadow-lg'}`}></div>
                                    <div>
                                        <p className="text-gray-600 text-sm font-medium">Estado del Sistema</p>
                                        <p className={`text-lg font-bold ${prompt.activo ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {prompt.activo ? 'OPERATIVO' : 'DESCONECTADO'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-md">
                                <div className="flex items-center space-x-3">
                                    <div className="w-4 h-4 rounded-full bg-blue-500 shadow-lg"></div>
                                    <div>
                                        <p className="text-gray-600 text-sm font-medium">Caracteres</p>
                                        <p className="text-lg font-bold text-blue-600">
                                            {contenidoEditado.length.toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-md">
                                <div className="flex items-center space-x-3">
                                    <div className="w-4 h-4 rounded-full bg-amber-500 shadow-lg"></div>
                                    <div>
                                        <p className="text-gray-600 text-sm font-medium">Última Modificación</p>
                                        <p className="text-lg font-bold text-amber-600">
                                            {new Date(prompt.updatedAt).toLocaleDateString('es-ES', { 
                                                day: '2-digit', 
                                                month: '2-digit',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Contenido principal */}
            <div className="max-w-6xl mx-auto px-4 pb-8">
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

                {/* Editor principal */}
                {prompt && (
                    <div className="bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden">
                        {/* Header del editor */}
                        <div className="bg-gray-100 border-b border-gray-300 p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
                                        <div className="w-3 h-3 bg-amber-500 rounded-sm"></div>
                                        <div className="w-3 h-3 bg-emerald-500 rounded-sm"></div>
                                    </div>
                                    <span className="text-gray-700 font-mono text-sm font-medium">
                                        /system/prompt/context.conf
                                    </span>
                                </div>
                                <div className="flex items-center space-x-2 text-xs text-gray-600">
                                    <span>Líneas: {contenidoEditado.split('\n').length}</span>
                                    <span>•</span>
                                    <span>UTF-8</span>
                                </div>
                            </div>
                        </div>

                        {/* Área de edición */}
                        <div className="relative">
                            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gray-50 border-r border-gray-300 flex flex-col text-xs text-gray-500 font-mono">
                                {Array.from({ length: Math.max(20, contenidoEditado.split('\n').length) }, (_, i) => (
                                    <div key={i + 1} className="h-6 flex items-center justify-end pr-3 border-b border-gray-200/50">
                                        {i + 1}
                                    </div>
                                ))}
                            </div>
                            <textarea
                                value={contenidoEditado}
                                onChange={(e) => setContenidoEditado(e.target.value)}
                                className="w-full h-96 bg-white text-gray-900 font-mono text-sm leading-6 pl-20 pr-6 py-4 resize-none focus:outline-none focus:ring-2 focus:ring-red-500 border-0 placeholder-gray-400"
                                disabled={guardando}
                                placeholder="Ingrese las instrucciones del sistema..."
                                style={{ minHeight: '400px' }}
                            />
                            
                            {/* Overlay de carga */}
                            {guardando && (
                                <div className="absolute inset-0 bg-white/90 flex items-center justify-center">
                                    <div className="flex items-center space-x-3 text-gray-700">
                                        <div className="w-6 h-6 border-2 border-gray-300 border-t-red-500 rounded-full animate-spin"></div>
                                        <span className="font-medium">Guardando cambios...</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Barra de acciones */}
                        <div className="bg-gray-50 border-t border-gray-300 p-4">
                            <div className="flex items-center justify-between">
                                <button
                                    onClick={cargarPrompt}
                                    disabled={guardando}
                                    className="group inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 shadow-sm"
                                >
                                    <svg className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Recargar
                                </button>
                                
                                <div className="flex items-center space-x-3">
                                    <button
                                        onClick={() => setContenidoEditado(prompt.contenido)}
                                        disabled={guardando}
                                        className="inline-flex items-center px-4 py-2 bg-amber-50 border border-amber-300 rounded-lg text-amber-700 hover:bg-amber-100 transition-all duration-200 disabled:opacity-50 shadow-sm"
                                    >
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                        </svg>
                                        Deshacer
                                    </button>
                                    
                                    <button
                                        onClick={guardarCambios}
                                        disabled={guardando || contenidoEditado === prompt.contenido}
                                        className="group relative inline-flex items-center px-6 py-2 bg-red-600 border border-red-700 rounded-lg text-white font-medium hover:bg-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                                    >
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                        </svg>
                                        <span>
                                            {guardando ? 'Guardando...' : 'Guardar Cambios'}
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PromptContextoAdmin;