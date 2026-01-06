import useAuth from "../hooks/useAuth"
import { Navigate, Outlet } from "react-router-dom"
import Header from "../components/Header"
import { useState, useEffect } from "react"

const LayoutSinSidebar = () => {
    const { auth, cargando } = useAuth()

    // Estado para controlar el header - aunque no hay sidebar, mantenemos consistencia
    const [, setSidebarOpen] = useState(false)
    
    // Escuchar cambios de tamaño de pantalla
    useEffect(() => {
        const handleResize = () => {
            setSidebarOpen(false)
        }

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])
    
    // Verificaciones de autenticación
    if(cargando) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando...</p>
                </div>
            </div>
        )
    }
    
    if(!auth?._id) {
        return <Navigate to="/" replace />
    }
    
    if(auth.rol === 'admin') {
        return <Navigate to="/admin" replace />
    }
    
    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            {/* Header sin sidebar */}
            <Header 
                sidebarOpen={false} 
                setSidebarOpen={setSidebarOpen}
                showSidebarToggle={false} // Prop para ocultar el botón del sidebar
            />
            
            {/* Main content sin sidebar */}
            <main className="flex-1">
                <Outlet />
            </main>
        </div>
    )
}

export default LayoutSinSidebar