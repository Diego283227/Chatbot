import useAuth from "../hooks/useAuth"
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom"
import Sidebar from "../components/chat/Sidebar"
import { useState, useEffect } from "react"
import { chatbotService } from '../services/chatbotService'

const RutaProtegida = () => {
    const { auth, cargando } = useAuth()
    const location = useLocation()
    const navigate = useNavigate()
    
    // Estado para controlar el sidebar - responsive
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        return window.innerWidth >= 1024
    })
    
    // Estados del chat
    const [conversacionActual, setConversacionActual] = useState(null)
    const [conversaciones, setConversaciones] = useState([])
    const [chatInicializado, setChatInicializado] = useState(false)
    
    // Escuchar cambios de tamaño de pantalla
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setSidebarOpen(false)
            } else {
                // En desktop, mantener el estado que el usuario eligió
                // No forzar a abierto automáticamente
            }
        }

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])
    
    // Inicializar chat
    useEffect(() => {
        if (auth?._id && !chatInicializado) {
            inicializarChat()
        }
    }, [auth, chatInicializado])

    const inicializarChat = async () => {
        try {
            console.log('🚀 Inicializando chat...')
            const convs = await chatbotService.obtenerConversaciones()
            setConversaciones(convs)
            setChatInicializado(true)
            console.log('✅ Chat inicializado, conversaciones:', convs.length)
        } catch (error) {
            console.error('❌ Error al inicializar chat:', error)
            setChatInicializado(true)
        }
    }

    // Funciones del chat con navegación integrada
    const handleNuevaConversacion = async () => {
        try {
            const nuevaConv = await chatbotService.crearConversacion()
            setConversacionActual(nuevaConv)
            
            const convsActualizadas = await chatbotService.obtenerConversaciones()
            setConversaciones(convsActualizadas)
            
            // Navegar a la nueva conversación solo si estamos en rutas de chat
            if (location.pathname.startsWith('/chat')) {
                navigate(`/chat/${nuevaConv._id}`)
            }
            
            return nuevaConv
        } catch (error) {
            console.error('❌ Error al crear conversación:', error)
            return null
        }
    }

    const handleCambiarConversacion = async (id) => {
        try {
            // Cerrar sidebar en móvil al seleccionar conversación
            if (window.innerWidth < 1024) {
                setSidebarOpen(false)
            }
            
            const conv = await chatbotService.obtenerConversacion(id)
            setConversacionActual(conv)
            
            // Navegar a la conversación solo si estamos en rutas de chat
            if (location.pathname.startsWith('/chat')) {
                navigate(`/chat/${id}`)
            }
            
            return conv
        } catch (error) {
            console.error('❌ Error al cargar conversación:', error)
            return null
        }
    }

    const handleEliminarConversacion = async (id) => {
        if (!window.confirm('¿Estás seguro de eliminar esta conversación?')) {
            return false
        }

        try {
            await chatbotService.eliminarConversacion(id)
            
            // Si es la conversación actual, limpiar y redirigir
            if (conversacionActual?._id === id) {
                setConversacionActual(null)
                
                // Redirigir si estamos en la conversación eliminada
                if (location.pathname === `/chat/${id}`) {
                    const convsRestantes = conversaciones.filter(c => c._id !== id)
                    if (convsRestantes.length > 0) {
                        navigate(`/chat/${convsRestantes[0]._id}`)
                    } else {
                        navigate('/chat')
                    }
                }
            }
            
            const convsActualizadas = await chatbotService.obtenerConversaciones()
            setConversaciones(convsActualizadas)
            
            return true
        } catch (error) {
            console.error('❌ Error al eliminar conversación:', error)
            return false
        }
    }

    const handleLimpiarHistorial = async () => {
        if (!window.confirm('¿Estás seguro de que quieres limpiar todo el historial?')) {
            return false
        }

        try {
            await chatbotService.limpiarHistorial()
            setConversaciones([])
            setConversacionActual(null)
            
            // Redirigir al chat base si estamos en una conversación específica
            if (location.pathname.startsWith('/chat/')) {
                navigate('/chat')
            }
            
            return true
        } catch (error) {
            console.error('❌ Error al limpiar historial:', error)
            return false
        }
    }

    // Función para cargar conversación por ID (usada por componentes hijos)
    const cargarConversacionPorId = async (id) => {
        try {
            console.log('🔄 Cargando conversación por ID:', id)
            
            // Verificar si la conversación existe en el listado actual
            const conversacionEnLista = conversaciones.find(conv => conv._id === id)
            
            if (conversacionEnLista) {
                // Si está en la lista, cargar los detalles completos
                const conversacionCompleta = await chatbotService.obtenerConversacion(id)
                setConversacionActual(conversacionCompleta)
                console.log('✅ Conversación cargada desde lista:', conversacionCompleta.titulo)
                return conversacionCompleta
            } else {
                // Si no está en la lista, intentar cargar directamente
                try {
                    const conversacionCompleta = await chatbotService.obtenerConversacion(id)
                    setConversacionActual(conversacionCompleta)
                    
                    // Actualizar lista de conversaciones para incluir esta
                    const convsActualizadas = await chatbotService.obtenerConversaciones()
                    setConversaciones(convsActualizadas)
                    
                    console.log('✅ Conversación cargada directamente:', conversacionCompleta.titulo)
                    return conversacionCompleta
                } catch (error) {
                    console.error('❌ Conversación no encontrada:', id)
                    throw error
                }
            }
        } catch (error) {
            console.error('❌ Error al cargar conversación:', error)
            throw error
        }
    }
    
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
        <div className="h-screen flex flex-col overflow-hidden bg-gray-50 relative">
          
            
            {/* Contenedor principal */}
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar colapsable */}
                <Sidebar 
                    sidebarOpen={sidebarOpen} 
                    setSidebarOpen={setSidebarOpen}
                    conversacionActual={conversacionActual}
                    setConversacionActual={setConversacionActual}
                    conversaciones={conversaciones}
                    setConversaciones={setConversaciones}
                    onNuevaConversacion={handleNuevaConversacion}
                    onCambiarConversacion={handleCambiarConversacion}
                    onEliminarConversacion={handleEliminarConversacion}
                    onLimpiarHistorial={handleLimpiarHistorial}
                />
                
                {/* Main content - Ahora toma el espacio restante automáticamente */}
                <main className="flex-1 overflow-hidden relative z-10">
                    <Outlet context={{
                        // Estados del chat
                        conversacionActual,
                        setConversacionActual,
                        conversaciones,
                        setConversaciones,
                        chatInicializado,
                        
                        // Funciones del chat
                        onNuevaConversacion: handleNuevaConversacion,
                        onCambiarConversacion: handleCambiarConversacion,
                        onEliminarConversacion: handleEliminarConversacion,
                        onLimpiarHistorial: handleLimpiarHistorial,
                        cargarConversacionPorId,
                        
                        // Control del sidebar
                        sidebarOpen,
                        setSidebarOpen
                    }} />
                </main>
            </div>
        </div>
    )
}

export default RutaProtegida