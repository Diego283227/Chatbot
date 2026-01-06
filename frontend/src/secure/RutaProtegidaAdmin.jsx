import useAuth from "../hooks/useAuth"
import { Navigate, Outlet } from "react-router-dom"
import AdminHeader from "../components/AdminHeader"

const RutaProtegidaAdmin = () => {
    const { auth, cargando } = useAuth()
    
    // Si está cargando, mostrar loader
    if(cargando) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando panel de administración...</p>
                </div>
            </div>
        )
    }
    
    // Si no está autenticado, redirigir al login
    if(!auth?._id) {
        return <Navigate to="/" replace />
    }
    
    // Si no es admin, redirigir al chat
    if(auth.rol !== 'admin') {
        return <Navigate to="/chat" replace />
    }
    
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header de admin */}
            <AdminHeader />
            
            {/* Contenido principal */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Outlet />
            </main>
        </div>
    )
}

export default RutaProtegidaAdmin