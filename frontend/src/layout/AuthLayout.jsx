import  { useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const AuthLayout = () => {
    const { auth, cargando } = useAuth();
    
    // Debug: mostrar información del usuario
    useEffect(() => {
        console.log('AuthLayout - Estado de autenticación:', {
            auth,
            cargando,
            tieneId: auth?._id,
            rol: auth?.rol
        });
    }, [auth, cargando]);
    
    // Si está cargando, mostrar loader
    if (cargando) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando...</p>
                </div>
            </div>
        );
    }
    
    // Si el usuario ya está autenticado
    if (auth?._id) {
        console.log('Usuario autenticado, redirigiendo según rol:', auth.rol);
        
        // Redirigir según el rol del usuario
        if (auth.rol === 'admin') {
            // Si es admin, redirigir al dashboard de admin
            return <Navigate to="/admin" replace />;
        } else {
            // Si es usuario normal, redirigir al chat
            return <Navigate to="/chat" replace />;
        }
    }
    
    // Si no está autenticado, mostrar las rutas públicas (login, registro, etc.)
    return (
        <div className='flex-1 flex flex-col'>
            <Outlet />
        </div>
    );
};

export default AuthLayout;